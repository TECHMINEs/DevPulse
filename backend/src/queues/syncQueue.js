const Queue = require('bull');
const logger = require('../utils/logger');

// Bull queue for sync jobs — backed by Redis
// this was a game changer for performance, syncing in the background
// instead of blocking the API response
const syncQueue = new Queue('sync-jobs', process.env.REDIS_URL || 'redis://localhost:6379', {
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: 50, // keep last 50 completed jobs
    removeOnFail: 20,
  },
});

syncQueue.on('error', (error) => {
  logger.error('Sync queue error', { error: error.message });
});

syncQueue.on('failed', (job, error) => {
  logger.error('Sync job failed', { jobId: job.id, error: error.message });
});

syncQueue.on('completed', (job, result) => {
  logger.info('Sync job completed', { jobId: job.id, result });
});

module.exports = { syncQueue };
