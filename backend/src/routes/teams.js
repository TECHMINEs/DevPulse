const router = require('express').Router();
const crypto = require('crypto');
const db = require('../db/pool');
const { authenticate } = require('../middleware/auth');
const { validateTeam } = require('../middleware/validate');
const logger = require('../utils/logger');

// generate URL-friendly slug from team name
const generateSlug = (name) => {
  return name.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    + '-' + crypto.randomBytes(3).toString('hex');
};

/**
 * @swagger
 * /api/teams:
 *   post:
 *     summary: Create a new team
 *     tags: [Teams]
 */
router.post('/', authenticate, validateTeam, async (req, res) => {
  try {
    const { name, description } = req.body;
    const slug = generateSlug(name);

    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      // create team
      const teamResult = await client.query(`
        INSERT INTO teams (name, slug, description, owner_id)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `, [name, slug, description, req.user.id]);

      // add creator as admin member
      await client.query(`
        INSERT INTO team_members (team_id, user_id, role)
        VALUES ($1, $2, 'admin')
      `, [teamResult.rows[0].id, req.user.id]);

      await client.query('COMMIT');

      res.status(201).json({ team: teamResult.rows[0] });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error('Create team error', { error: error.message });
    res.status(500).json({ error: 'Failed to create team' });
  }
});

/**
 * @swagger
 * /api/teams/{slug}:
 *   get:
 *     summary: Get team with members and aggregate wellness
 *     tags: [Teams]
 */
router.get('/:slug', authenticate, async (req, res) => {
  try {
    const teamResult = await db.query(`
      SELECT t.*, u.username as owner_username
      FROM teams t
      JOIN users u ON t.owner_id = u.id
      WHERE t.slug = $1
    `, [req.params.slug]);

    if (teamResult.rows.length === 0) {
      return res.status(404).json({ error: 'Team not found' });
    }

    const team = teamResult.rows[0];

    // check membership
    const memberCheck = await db.query(
      'SELECT * FROM team_members WHERE team_id = $1 AND user_id = $2',
      [team.id, req.user.id]
    );

    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ error: 'You are not a member of this team' });
    }

    // get members with recent wellness
    const membersResult = await db.query(`
      SELECT u.id, u.username, u.display_name, u.avatar_url, tm.role, tm.joined_at,
        (SELECT ws.score FROM wellness_scores ws WHERE ws.user_id = u.id ORDER BY ws.score_date DESC LIMIT 1) as latest_score,
        (SELECT ws.risk_flag FROM wellness_scores ws WHERE ws.user_id = u.id ORDER BY ws.score_date DESC LIMIT 1) as risk_flag
      FROM team_members tm
      JOIN users u ON tm.user_id = u.id
      WHERE tm.team_id = $1
      ORDER BY tm.role = 'admin' DESC, tm.joined_at ASC
    `, [team.id]);

    // aggregate wellness
    const aggregateResult = await db.query(`
      SELECT ws.score_date, AVG(ws.score) as avg_score
      FROM wellness_scores ws
      JOIN team_members tm ON ws.user_id = tm.user_id
      WHERE tm.team_id = $1 AND ws.score_date >= CURRENT_DATE - 30
      GROUP BY ws.score_date
      ORDER BY ws.score_date ASC
    `, [team.id]);

    res.json({
      team,
      members: membersResult.rows,
      aggregate_wellness: aggregateResult.rows,
      member_count: membersResult.rows.length,
    });
  } catch (error) {
    logger.error('Get team error', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch team' });
  }
});

/**
 * @swagger
 * /api/teams/{slug}/invite:
 *   post:
 *     summary: Generate invite link for a team
 *     tags: [Teams]
 */
router.post('/:slug/invite', authenticate, async (req, res) => {
  try {
    const teamResult = await db.query('SELECT * FROM teams WHERE slug = $1', [req.params.slug]);
    if (teamResult.rows.length === 0) return res.status(404).json({ error: 'Team not found' });

    // only owner/admin can invite
    const memberCheck = await db.query(
      "SELECT * FROM team_members WHERE team_id = $1 AND user_id = $2 AND role IN ('admin', 'owner')",
      [teamResult.rows[0].id, req.user.id]
    );

    // also check if user is the owner
    if (memberCheck.rows.length === 0 && teamResult.rows[0].owner_id !== req.user.id) {
      return res.status(403).json({ error: 'Only admins can invite members' });
    }

    // generate invite token (simple approach)
    // revisit this when team mode has more users
    const inviteToken = crypto.randomBytes(16).toString('hex');
    const inviteUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/teams/${req.params.slug}/join?token=${inviteToken}`;

    // store the token temporarily (in practice, you'd want a separate invite table)
    // for now, we just use the slug as the invite mechanism
    res.json({ inviteUrl, token: inviteToken });
  } catch (error) {
    logger.error('Invite error', { error: error.message });
    res.status(500).json({ error: 'Failed to generate invite' });
  }
});

/**
 * @swagger
 * /api/teams/{slug}/join:
 *   post:
 *     summary: Join a team
 *     tags: [Teams]
 */
router.post('/:slug/join', authenticate, async (req, res) => {
  try {
    const teamResult = await db.query('SELECT * FROM teams WHERE slug = $1', [req.params.slug]);
    if (teamResult.rows.length === 0) return res.status(404).json({ error: 'Team not found' });

    // check if already a member
    const existing = await db.query(
      'SELECT * FROM team_members WHERE team_id = $1 AND user_id = $2',
      [teamResult.rows[0].id, req.user.id]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Already a member of this team' });
    }

    await db.query(`
      INSERT INTO team_members (team_id, user_id, role)
      VALUES ($1, $2, 'member')
    `, [teamResult.rows[0].id, req.user.id]);

    res.json({ message: 'Successfully joined team' });
  } catch (error) {
    logger.error('Join team error', { error: error.message });
    res.status(500).json({ error: 'Failed to join team' });
  }
});

/**
 * @swagger
 * /api/teams/{slug}/leave:
 *   delete:
 *     summary: Leave a team
 *     tags: [Teams]
 */
router.delete('/:slug/leave', authenticate, async (req, res) => {
  try {
    const teamResult = await db.query('SELECT * FROM teams WHERE slug = $1', [req.params.slug]);
    if (teamResult.rows.length === 0) return res.status(404).json({ error: 'Team not found' });

    // owner can't leave their own team (they should transfer or delete)
    if (teamResult.rows[0].owner_id === req.user.id) {
      return res.status(400).json({ error: 'Team owner cannot leave. Transfer ownership first.' });
    }

    await db.query(
      'DELETE FROM team_members WHERE team_id = $1 AND user_id = $2',
      [teamResult.rows[0].id, req.user.id]
    );

    res.json({ message: 'Left team successfully' });
  } catch (error) {
    logger.error('Leave team error', { error: error.message });
    res.status(500).json({ error: 'Failed to leave team' });
  }
});

/**
 * @swagger
 * /api/teams/{slug}/leaderboard:
 *   get:
 *     summary: Get team leaderboard
 *     tags: [Teams]
 */
router.get('/:slug/leaderboard', authenticate, async (req, res) => {
  try {
    const teamResult = await db.query('SELECT * FROM teams WHERE slug = $1', [req.params.slug]);
    if (teamResult.rows.length === 0) return res.status(404).json({ error: 'Team not found' });

    const anonymize = req.query.anonymize === 'true';

    const result = await db.query(`
      SELECT
        u.id, u.username, u.display_name, u.avatar_url,
        AVG(ws.score) as avg_score,
        COUNT(DISTINCT ws.score_date) as days_tracked
      FROM team_members tm
      JOIN users u ON tm.user_id = u.id
      LEFT JOIN wellness_scores ws ON ws.user_id = u.id AND ws.score_date >= CURRENT_DATE - 30
      WHERE tm.team_id = $1
      GROUP BY u.id, u.username, u.display_name, u.avatar_url
      ORDER BY avg_score DESC NULLS LAST
    `, [teamResult.rows[0].id]);

    const leaderboard = result.rows.map((row, index) => ({
      rank: index + 1,
      username: anonymize ? `Developer ${index + 1}` : row.username,
      display_name: anonymize ? `Developer ${index + 1}` : row.display_name,
      avatar_url: anonymize ? null : row.avatar_url,
      avg_score: parseFloat(row.avg_score)?.toFixed(1) || 'N/A',
      days_tracked: parseInt(row.days_tracked),
    }));

    res.json({ leaderboard });
  } catch (error) {
    logger.error('Get leaderboard error', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

/**
 * @swagger
 * /api/teams/{slug}/insights:
 *   get:
 *     summary: Get team-level analytics
 *     tags: [Teams]
 */
router.get('/:slug/insights', authenticate, async (req, res) => {
  try {
    const teamResult = await db.query('SELECT * FROM teams WHERE slug = $1', [req.params.slug]);
    if (teamResult.rows.length === 0) return res.status(404).json({ error: 'Team not found' });

    // aggregate stats
    // revisit this when team mode has more users — the aggregate query might be slow
    const statsResult = await db.query(`
      SELECT
        COUNT(DISTINCT tm.user_id) as member_count,
        AVG(ws.score) as team_avg_score,
        COUNT(DISTINCT CASE WHEN ws.risk_flag = 'high' THEN ws.user_id END) as at_risk_count,
        SUM(ws.commits_count) as total_commits
      FROM team_members tm
      LEFT JOIN wellness_scores ws ON ws.user_id = tm.user_id AND ws.score_date = CURRENT_DATE
      WHERE tm.team_id = $1
    `, [teamResult.rows[0].id]);

    // team wellness timeline
    const timelineResult = await db.query(`
      SELECT ws.score_date, AVG(ws.score) as avg_score, COUNT(DISTINCT ws.user_id) as active_members
      FROM wellness_scores ws
      JOIN team_members tm ON ws.user_id = tm.user_id
      WHERE tm.team_id = $1 AND ws.score_date >= CURRENT_DATE - 30
      GROUP BY ws.score_date
      ORDER BY ws.score_date ASC
    `, [teamResult.rows[0].id]);

    // member heatmap data
    const heatmapResult = await db.query(`
      SELECT u.username, ws.score_date, ws.score
      FROM team_members tm
      JOIN users u ON tm.user_id = u.id
      JOIN wellness_scores ws ON ws.user_id = u.id
      WHERE tm.team_id = $1 AND ws.score_date >= CURRENT_DATE - 14
      ORDER BY u.username, ws.score_date
    `, [teamResult.rows[0].id]);

    res.json({
      stats: statsResult.rows[0],
      timeline: timelineResult.rows,
      heatmap: heatmapResult.rows,
    });
  } catch (error) {
    logger.error('Get team insights error', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch team insights' });
  }
});

module.exports = router;
