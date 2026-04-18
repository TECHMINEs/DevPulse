const Queue = require('bull');
const logger = require('../utils/logger');

const digestQueue = new Queue('digest-jobs', process.env.REDIS_URL || 'redis://localhost:6379', {
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: 10,
    removeOnFail: 10,
  },
});

digestQueue.on('error', (error) => {
  logger.error('Digest queue error', { error: error.message });
});

module.exports = { digestQueue };
