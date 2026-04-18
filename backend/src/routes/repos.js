const router = require('express').Router();
const db = require('../db/pool');
const { authenticate } = require('../middleware/auth');
const logger = require('../utils/logger');

/**
 * @swagger
 * /api/repos:
 *   get:
 *     summary: List all repositories with stats
 *     tags: [Repositories]
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT r.*,
        (SELECT COUNT(*) FROM commit_snapshots cs WHERE cs.repo_id = r.id) as commit_count,
        (SELECT AVG(CASE WHEN cs.hour_of_day >= 0 AND cs.hour_of_day < 5 THEN 1.0 ELSE 0.0 END)
         FROM commit_snapshots cs WHERE cs.repo_id = r.id) as night_pct,
        (SELECT COUNT(*) FROM commit_snapshots cs
         WHERE cs.repo_id = r.id AND cs.committed_at >= CURRENT_DATE - 7) as weekly_commits
      FROM repositories r
      WHERE r.user_id = $1
      ORDER BY r.last_commit_at DESC NULLS LAST
    `, [req.user.id]);

    res.json({ repos: result.rows });
  } catch (error) {
    logger.error('Get repos error', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch repositories' });
  }
});

/**
 * @swagger
 * /api/repos/top:
 *   get:
 *     summary: Get top 3 repos by activity this month
 *     tags: [Repositories]
 */
router.get('/top', authenticate, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT r.id, r.name, r.full_name, r.language, r.stars, r.description,
        COUNT(cs.id) as commit_count
      FROM repositories r
      JOIN commit_snapshots cs ON cs.repo_id = r.id
      WHERE r.user_id = $1 AND cs.committed_at >= CURRENT_DATE - 30
      GROUP BY r.id
      ORDER BY commit_count DESC
      LIMIT 3
    `, [req.user.id]);

    // get weekly velocity for each top repo (sparkline data)
    const reposWithVelocity = await Promise.all(result.rows.map(async (repo) => {
      const velResult = await db.query(`
        SELECT DATE_TRUNC('week', committed_at) as week, COUNT(*) as count
        FROM commit_snapshots
        WHERE repo_id = $1 AND committed_at >= CURRENT_DATE - 49
        GROUP BY DATE_TRUNC('week', committed_at)
        ORDER BY week ASC
      `, [repo.id]);
      return { ...repo, velocity: velResult.rows };
    }));

    res.json({ repos: reposWithVelocity });
  } catch (error) {
    logger.error('Get top repos error', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch top repos' });
  }
});

/**
 * @swagger
 * /api/repos/{repoId}:
 *   get:
 *     summary: Get single repo deep dive
 *     tags: [Repositories]
 */
router.get('/:repoId', authenticate, async (req, res) => {
  try {
    // repo info
    const repoResult = await db.query(`
      SELECT * FROM repositories WHERE id = $1 AND user_id = $2
    `, [req.params.repoId, req.user.id]);

    if (repoResult.rows.length === 0) {
      return res.status(404).json({ error: 'Repository not found' });
    }

    const repo = repoResult.rows[0];

    // commit timeline (last 90 days)
    const timelineResult = await db.query(`
      SELECT DATE(committed_at) as date, COUNT(*) as count
      FROM commit_snapshots
      WHERE repo_id = $1 AND committed_at >= CURRENT_DATE - 90
      GROUP BY DATE(committed_at)
      ORDER BY date ASC
    `, [req.params.repoId]);

    // hourly distribution
    const hourlyResult = await db.query(`
      SELECT hour_of_day as hour, COUNT(*) as count
      FROM commit_snapshots
      WHERE repo_id = $1
      GROUP BY hour_of_day
      ORDER BY hour_of_day
    `, [req.params.repoId]);

    // commit message quality
    const qualityResult = await db.query(`
      SELECT
        AVG(message_length) as avg_message_length,
        COUNT(CASE WHEN message ~ '^(feat|fix|chore|docs|style|refactor|test|ci|build|perf):' THEN 1 END)::float
          / GREATEST(COUNT(*), 1) * 100 as conventional_pct,
        COUNT(*) as total_commits,
        AVG(lines_added + lines_removed) as avg_change_size,
        MIN(committed_at) as first_commit,
        MAX(committed_at) as last_commit
      FROM commit_snapshots
      WHERE repo_id = $1
    `, [req.params.repoId]);

    res.json({
      repo,
      timeline: timelineResult.rows,
      hourly: hourlyResult.rows,
      quality: qualityResult.rows[0],
    });
  } catch (error) {
    logger.error('Get repo detail error', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch repo details' });
  }
});

module.exports = router;
