const router = require('express').Router();
const db = require('../db/pool');
const { authenticate } = require('../middleware/auth');
const { adminOnly } = require('../middleware/adminOnly');
const mlService = require('../services/mlService');
const logger = require('../utils/logger');

/**
 * @swagger
 * /api/admin/stats:
 *   get:
 *     summary: Get platform statistics
 *     tags: [Admin]
 */
router.get('/stats', authenticate, adminOnly, async (req, res) => {
  try {
    const usersResult = await db.query('SELECT COUNT(*) as total FROM users');
    const commitsResult = await db.query('SELECT COUNT(*) as total FROM commit_snapshots');
    const teamsResult = await db.query('SELECT COUNT(*) as total FROM teams');
    const activeResult = await db.query(`
      SELECT COUNT(DISTINCT user_id) as count
      FROM commit_snapshots
      WHERE committed_at >= CURRENT_DATE
    `);

    // check service health
    const mlHealth = await mlService.healthCheck();

    // Redis connection status
    let redisStatus = 'disconnected';
    try {
      const { redis } = require('../services/githubService');
      if (redis && redis.status === 'ready') {
        redisStatus = 'connected';
      }
    } catch (e) {
      redisStatus = 'error';
    }

    res.json({
      users: parseInt(usersResult.rows[0].total),
      commits: parseInt(commitsResult.rows[0].total),
      teams: parseInt(teamsResult.rows[0].total),
      active_today: parseInt(activeResult.rows[0].count),
      services: {
        ml: mlHealth,
        redis: redisStatus,
        database: 'connected',
      },
    });
  } catch (error) {
    logger.error('Admin stats error', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: List all users with pagination
 *     tags: [Admin]
 */
router.get('/users', authenticate, adminOnly, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const countResult = await db.query('SELECT COUNT(*) as total FROM users');
    const total = parseInt(countResult.rows[0].total);

    const result = await db.query(`
      SELECT u.id, u.username, u.display_name, u.email, u.avatar_url, u.role,
             u.provider, u.created_at, u.last_synced_at,
             (SELECT COUNT(*) FROM commit_snapshots WHERE user_id = u.id) as commit_count,
             (SELECT COUNT(*) FROM repositories WHERE user_id = u.id) as repo_count
      FROM users u
      ORDER BY u.created_at DESC
      LIMIT $1 OFFSET $2
    `, [limit, offset]);

    res.json({
      users: result.rows,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error('Admin users error', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

/**
 * @swagger
 * /api/admin/users/{id}/role:
 *   put:
 *     summary: Change user role
 *     tags: [Admin]
 */
router.put('/users/:id/role', authenticate, adminOnly, async (req, res) => {
  try {
    const { role } = req.body;
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const result = await db.query(
      'UPDATE users SET role = $2, updated_at = NOW() WHERE id = $1 RETURNING id, username, role',
      [req.params.id, role]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    logger.error('Update role error', { error: error.message });
    res.status(500).json({ error: 'Failed to update role' });
  }
});

/**
 * @swagger
 * /api/admin/users/{id}:
 *   delete:
 *     summary: Delete a user
 *     tags: [Admin]
 */
router.delete('/users/:id', authenticate, adminOnly, async (req, res) => {
  try {
    // don't allow self-deletion
    if (req.params.id === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete yourself' });
    }

    const result = await db.query('DELETE FROM users WHERE id = $1 RETURNING id, username', [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    logger.info('User deleted by admin', { deletedUser: result.rows[0].username, admin: req.user.username });
    res.json({ message: 'User deleted', user: result.rows[0] });
  } catch (error) {
    logger.error('Delete user error', { error: error.message });
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

/**
 * @swagger
 * /api/admin/sync-jobs:
 *   get:
 *     summary: Recent sync jobs across all users
 *     tags: [Admin]
 */
router.get('/sync-jobs', authenticate, adminOnly, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT sj.*, u.username
      FROM sync_jobs sj
      JOIN users u ON sj.user_id = u.id
      ORDER BY sj.started_at DESC NULLS LAST
      LIMIT 50
    `);

    res.json({ jobs: result.rows });
  } catch (error) {
    logger.error('Admin sync jobs error', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch sync jobs' });
  }
});

module.exports = router;
