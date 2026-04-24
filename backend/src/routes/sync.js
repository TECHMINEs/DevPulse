const router = require('express').Router();
const db = require('../db/pool');
const { authenticate } = require('../middleware/auth');
const { syncQueue } = require('../queues/syncQueue');
const logger = require('../utils/logger');

const { rateLimitMiddleware, syncRateLimiter } = require('../middleware/rateLimiter');

/**
 * @swagger
 * /api/sync/trigger:
 *   post:
 *     summary: Trigger GitHub data sync
 *     tags: [Sync]
 *     security:
 *       - bearerAuth: []
 */
router.post('/trigger', authenticate, rateLimitMiddleware(syncRateLimiter), async (req, res) => {
  try {
    // get user's access token
    const userResult = await db.query(
      'SELECT access_token FROM users WHERE id = $1',
      [req.user.id]
    );

    if (!userResult.rows[0]?.access_token) {
      return res.status(400).json({ error: 'No access token found. Please re-authenticate.' });
    }

    // add job to Bull queue
    const job = await syncQueue.add('sync-github', {
      userId: req.user.id,
      accessToken: userResult.rows[0].access_token,
    }, {
      jobId: `sync-${req.user.id}-${Date.now()}`,
      attempts: 3,
    });

    logger.info('Sync job queued', { userId: req.user.id, jobId: job.id });

    res.json({
      jobId: job.id,
      message: 'Sync job queued successfully',
    });
  } catch (error) {
    logger.error('Trigger sync error', { error: error.message });
    res.status(500).json({ error: 'Failed to start sync' });
  }
});

/**
 * @swagger
 * /api/sync/status/{jobId}:
 *   get:
 *     summary: Get sync job status
 *     tags: [Sync]
 */
router.get('/status/:jobId', authenticate, async (req, res) => {
  try {
    const job = await syncQueue.getJob(req.params.jobId);

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const state = await job.getState();
    const progress = job.progress();

    res.json({
      jobId: job.id,
      status: state,
      progress,
      data: job.returnvalue || null,
      failedReason: job.failedReason || null,
    });
  } catch (error) {
    logger.error('Get sync status error', { error: error.message });
    res.status(500).json({ error: 'Failed to get job status' });
  }
});

/**
 * @swagger
 * /api/sync/history:
 *   get:
 *     summary: Get sync job history
 *     tags: [Sync]
 */
router.get('/history', authenticate, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT id, status, started_at, completed_at, repos_synced, commits_synced, error_message
      FROM sync_jobs
      WHERE user_id = $1
      ORDER BY started_at DESC
      LIMIT 10
    `, [req.user.id]);

    res.json({ jobs: result.rows });
  } catch (error) {
    logger.error('Get sync history error', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch sync history' });
  }
});

module.exports = router;