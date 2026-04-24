const router = require('express').Router();
const db = require('../db/pool');
const { authenticate } = require('../middleware/auth');
const wellnessService = require('../services/wellnessService');
const mlService = require('../services/mlService');
const logger = require('../utils/logger');

router.get('/dashboard', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const [profileResult, wellnessResult, commitsResult, hourlyResult, languagesResult, reposResult, achievementsResult] = await Promise.all([
      db.query(`SELECT u.*,
        (SELECT COUNT(*) FROM commit_snapshots WHERE user_id=u.id) as total_commits,
        (SELECT COUNT(*) FROM repositories WHERE user_id=u.id) as total_repos,
        (SELECT ws.score FROM wellness_scores ws WHERE ws.user_id=u.id ORDER BY ws.score_date DESC LIMIT 1) as current_score,
        (SELECT ws.streak_days FROM wellness_scores ws WHERE ws.user_id=u.id ORDER BY ws.score_date DESC LIMIT 1) as streak_days,
        (SELECT ws.risk_flag FROM wellness_scores ws WHERE ws.user_id=u.id ORDER BY ws.score_date DESC LIMIT 1) as risk_flag
        FROM users u WHERE u.id=$1`, [userId]),
      wellnessService.getWellnessHistory(userId, 90),
      db.query('SELECT DATE(committed_at) as date, COUNT(*) as count FROM commit_snapshots WHERE user_id=$1 AND committed_at >= CURRENT_DATE - 365 GROUP BY DATE(committed_at) ORDER BY date ASC', [userId]),
      db.query('SELECT hour_of_day as hour, COUNT(*) as count FROM commit_snapshots WHERE user_id=$1 GROUP BY hour_of_day ORDER BY hour_of_day', [userId]),
      db.query('SELECT language, COUNT(*) as count FROM repositories WHERE user_id=$1 AND language IS NOT NULL GROUP BY language ORDER BY count DESC LIMIT 10', [userId]),
      db.query(`SELECT r.id, r.name, r.description, r.language, COUNT(cs.id) as commit_count FROM repositories r LEFT JOIN commit_snapshots cs ON r.id=cs.repo_id AND cs.committed_at >= CURRENT_DATE - 30 WHERE r.user_id=$1 GROUP BY r.id ORDER BY commit_count DESC LIMIT 6`, [userId]),
      db.query('SELECT a.*, ua.earned_at FROM user_achievements ua JOIN achievements a ON ua.achievement_id=a.id WHERE ua.user_id=$1 ORDER BY ua.earned_at DESC LIMIT 3', [userId]),
    ]);
    res.json({ profile: profileResult.rows[0], wellness: wellnessResult, commits: commitsResult.rows, hourly: hourlyResult.rows, languages: languagesResult.rows, repos: reposResult.rows, achievements: achievementsResult.rows });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load dashboard data' });
  }
});
/**
 * @swagger
 * /api/analytics/wellness:
 *   get:
 *     summary: Get wellness score history
 *     tags: [Analytics]
 *     parameters:
 *       - name: days
 *         in: query
 *         schema:
 *           type: integer
 *           default: 90
 */
router.get('/wellness', authenticate, async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 90;
    const history = await wellnessService.getWellnessHistory(req.user.id, days);
    res.json({ wellness: history });
  } catch (error) {
    logger.error('Get wellness error', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch wellness data' });
  }
});

/**
 * @swagger
 * /api/analytics/commits:
 *   get:
 *     summary: Get commit heatmap data
 *     tags: [Analytics]
 */
router.get('/commits', authenticate, async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 365;
    const repo = req.query.repo;

    let query = `
      SELECT DATE(committed_at) as date, COUNT(*) as count
      FROM commit_snapshots
      WHERE user_id = $1 AND committed_at >= date('now', '-' || $2 || ' days')
    `;
    const params = [req.user.id, days];

    if (repo && repo !== 'all') {
      query += ' AND repo_id = $3';
      params.push(repo);
    }

    query += ' GROUP BY DATE(committed_at) ORDER BY date ASC';

    const result = await db.query(query, params);
    res.json({ commits: result.rows });
  } catch (error) {
    logger.error('Get commits error', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch commit data' });
  }
});

/**
 * @swagger
 * /api/analytics/hourly:
 *   get:
 *     summary: Get commit count by hour of day
 *     tags: [Analytics]
 */
router.get('/hourly', authenticate, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT hour_of_day as hour, COUNT(*) as count
      FROM commit_snapshots
      WHERE user_id = $1
      GROUP BY hour_of_day
      ORDER BY hour_of_day
    `, [req.user.id]);

    // fill in missing hours with 0
    const hourlyData = Array.from({ length: 24 }, (_, i) => {
      const found = result.rows.find(r => parseInt(r.hour) === i);
      return { hour: i, count: found ? parseInt(found.count) : 0 };
    });

    res.json({ hourly: hourlyData });
  } catch (error) {
    logger.error('Get hourly error', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch hourly data' });
  }
});

/**
 * @swagger
 * /api/analytics/languages:
 *   get:
 *     summary: Get commit distribution by language
 *     tags: [Analytics]
 */
router.get('/languages', authenticate, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT r.language, COUNT(cs.id) as commit_count
      FROM commit_snapshots cs
      JOIN repositories r ON cs.repo_id = r.id
      WHERE cs.user_id = $1 AND r.language IS NOT NULL
      GROUP BY r.language
      ORDER BY commit_count DESC
      LIMIT 10
    `, [req.user.id]);

    res.json({ languages: result.rows });
  } catch (error) {
    logger.error('Get languages error', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch language data' });
  }
});

/**
 * @swagger
 * /api/analytics/streak:
 *   get:
 *     summary: Get streak data
 *     tags: [Analytics]
 */
router.get('/streak', authenticate, async (req, res) => {
  try {
    const currentStreak = await wellnessService.calculateStreak(req.user.id);

    // get longest streak from wellness_scores
    const longestResult = await db.query(`
      SELECT MAX(streak_days) as longest
      FROM wellness_scores
      WHERE user_id = $1
    `, [req.user.id]);

    // get calendar data (dates with commits for the last year)
    const calendarResult = await db.query(`
      SELECT DATE(committed_at) as date, COUNT(*) as count
      FROM commit_snapshots
      WHERE user_id = $1 AND committed_at >= CURRENT_DATE - 365
      GROUP BY DATE(committed_at)
      ORDER BY date ASC
    `, [req.user.id]);

    res.json({
      current_streak: currentStreak,
      longest_streak: parseInt(longestResult.rows[0]?.longest) || currentStreak,
      calendar: calendarResult.rows,
    });
  } catch (error) {
    logger.error('Get streak error', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch streak data' });
  }
});

/**
 * @swagger
 * /api/analytics/velocity:
 *   get:
 *     summary: Get commits per week velocity
 *     tags: [Analytics]
 */
router.get('/velocity', authenticate, async (req, res) => {
  try {
    const weeks = parseInt(req.query.weeks) || 12;

    const result = await db.query(`
      SELECT strftime('%Y-%W', committed_at) as week_start,
             COUNT(*) as commits,
             SUM(lines_added) as lines_added,
             SUM(lines_removed) as lines_removed
      FROM commit_snapshots
      WHERE user_id = $1
        AND committed_at >= date('now', '-' || ($2 * 7) || ' days')
      GROUP BY strftime('%Y-%W', committed_at)
      ORDER BY week_start ASC
    `, [req.user.id, weeks]);

    res.json({ velocity: result.rows });
  } catch (error) {
    logger.error('Get velocity error', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch velocity data' });
  }
});

/**
 * @swagger
 * /api/analytics/radar:
 *   get:
 *     summary: Get radar chart data (6 dimensions)
 *     tags: [Analytics]
 */
router.get('/radar', authenticate, async (req, res) => {
  try {
    // get recent data for calculations
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const commitsResult = await db.query(`
      SELECT COUNT(*) as total,
             AVG(message_length) as avg_msg_len,
             COUNT(DISTINCT DATE(committed_at)) as active_days,
             COUNT(DISTINCT repo_id) as unique_repos,
             AVG(CASE WHEN hour_of_day >= 9 AND hour_of_day <= 17 THEN 1.0 ELSE 0.0 END) as work_hours_pct
      FROM commit_snapshots
      WHERE user_id = $1 AND committed_at >= $2
    `, [req.user.id, thirtyDaysAgo.toISOString()]);

    const wellnessResult = await db.query(`
      SELECT AVG(score) as avg_score
      FROM wellness_scores
      WHERE user_id = $1 AND score_date >= CURRENT_DATE - 30
    `, [req.user.id]);

    const stats = commitsResult.rows[0];
    const avgWellness = parseFloat(wellnessResult.rows[0]?.avg_score) || 50;

    // normalize each dimension to 0-100
    const radar = {
      consistency: Math.min(100, (parseInt(stats.active_days) / 30) * 100),
      volume: Math.min(100, (parseInt(stats.total) / 150) * 100), // 150 commits/month = 100
      timing: (parseFloat(stats.work_hours_pct) || 0) * 100,
      diversity: Math.min(100, (parseInt(stats.unique_repos) / 5) * 100),
      quality: Math.min(100, (parseFloat(stats.avg_msg_len) / 50) * 100), // 50 chars = 100
      wellness: avgWellness,
    };

    res.json({ radar });
  } catch (error) {
    logger.error('Get radar error', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch radar data' });
  }
});

/**
 * @swagger
 * /api/analytics/benchmark:
 *   get:
 *     summary: Compare user vs industry average
 *     tags: [Analytics]
 */
router.get('/benchmark', authenticate, async (req, res) => {
  try {
    // hardcoding the benchmark values for now, ideally would come from aggregated data
    // these are based on research + educated guesses from GitHub data
    const industryAverage = {
      commits_per_week: 25,
      avg_commit_message_length: 35,
      night_commit_pct: 0.12,
      weekend_commit_pct: 0.15,
      repos_active: 3,
      avg_wellness_score: 72,
      avg_streak: 5,
      languages_used: 3,
    };

    // get user's actual metrics
    const commitResult = await db.query(`
      SELECT
        CAST(COUNT(*) AS REAL) / MAX(1, CAST((julianday('now') - julianday(MIN(committed_at))) / 7 AS INTEGER)) as commits_per_week,
        AVG(message_length) as avg_commit_message_length,
        AVG(CASE WHEN hour_of_day >= 0 AND hour_of_day < 5 THEN 1.0 ELSE 0.0 END) as night_commit_pct,
        AVG(CASE WHEN is_weekend THEN 1.0 ELSE 0.0 END) as weekend_commit_pct
      FROM commit_snapshots
      WHERE user_id = $1 AND committed_at >= CURRENT_DATE - 90
    `, [req.user.id]);

    const repoResult = await db.query(`
      SELECT COUNT(DISTINCT repo_id) as repos_active
      FROM commit_snapshots
      WHERE user_id = $1 AND committed_at >= CURRENT_DATE - 30
    `, [req.user.id]);

    const wellnessResult = await db.query(`
      SELECT AVG(score) as avg_score, MAX(streak_days) as max_streak
      FROM wellness_scores
      WHERE user_id = $1 AND score_date >= CURRENT_DATE - 30
    `, [req.user.id]);

    const langResult = await db.query(`
      SELECT COUNT(DISTINCT r.language) as languages_used
      FROM commit_snapshots cs
      JOIN repositories r ON cs.repo_id = r.id
      WHERE cs.user_id = $1 AND r.language IS NOT NULL
    `, [req.user.id]);

    const userMetrics = {
      commits_per_week: parseFloat(commitResult.rows[0]?.commits_per_week) || 0,
      avg_commit_message_length: parseFloat(commitResult.rows[0]?.avg_commit_message_length) || 0,
      night_commit_pct: parseFloat(commitResult.rows[0]?.night_commit_pct) || 0,
      weekend_commit_pct: parseFloat(commitResult.rows[0]?.weekend_commit_pct) || 0,
      repos_active: parseInt(repoResult.rows[0]?.repos_active) || 0,
      avg_wellness_score: parseFloat(wellnessResult.rows[0]?.avg_score) || 0,
      avg_streak: parseInt(wellnessResult.rows[0]?.max_streak) || 0,
      languages_used: parseInt(langResult.rows[0]?.languages_used) || 0,
    };

    res.json({ user: userMetrics, industry: industryAverage });
  } catch (error) {
    logger.error('Get benchmark error', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch benchmark data' });
  }
});

/**
 * @swagger
 * /api/analytics/predictions:
 *   get:
 *     summary: Get ML-powered wellness predictions
 *     tags: [Analytics]
 */
router.get('/predictions', authenticate, async (req, res) => {
  try {
    // get recent features for prediction
    const recentData = await db.query(`
      SELECT
        AVG(hour_of_day) as avg_commit_hour,
        AVG(CASE WHEN hour_of_day >= 0 AND hour_of_day < 5 THEN 1.0 ELSE 0.0 END) as night_commit_pct,
        AVG(CASE WHEN is_weekend THEN 1.0 ELSE 0.0 END) as weekend_commit_pct,
        AVG(message_length) as avg_message_length,
        AVG(ABS(lines_added + lines_removed)) as lines_changed_stddev,
        CAST(COUNT(*) AS REAL) / 7 as commits_per_day,
        AVG(files_changed) as files_per_commit
      FROM commit_snapshots
      WHERE user_id = $1 AND committed_at >= CURRENT_DATE - 7
    `, [req.user.id]);

    const streakResult = await db.query(`
      SELECT streak_days FROM wellness_scores
      WHERE user_id = $1 ORDER BY score_date DESC LIMIT 1
    `, [req.user.id]);

    const features = recentData.rows[0];
    const streak = streakResult.rows[0]?.streak_days || 0;

    // call ML service for next 7 days prediction
    const predictions = [];
    for (let day = 1; day <= 7; day++) {
      const prediction = await mlService.predictWellness({
        avg_commit_hour: parseFloat(features.avg_commit_hour) || 14,
        night_commit_pct: parseFloat(features.night_commit_pct) || 0,
        weekend_commit_pct: parseFloat(features.weekend_commit_pct) || 0,
        avg_message_length: parseFloat(features.avg_message_length) || 30,
        lines_changed_stddev: parseFloat(features.lines_changed_stddev) || 100,
        commits_per_day: parseFloat(features.commits_per_day) || 3,
        streak_length: streak + day,
        files_per_commit: parseFloat(features.files_per_commit) || 3,
      });

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + day);

      predictions.push({
        date: futureDate.toISOString().split('T')[0],
        ...prediction,
      });
    }

    // also get actual scores for context
    const actualScores = await wellnessService.getWellnessHistory(req.user.id, 14);

    res.json({ predictions, actual: actualScores });
  } catch (error) {
    logger.error('Get predictions error', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch predictions' });
  }
});

module.exports = router;
