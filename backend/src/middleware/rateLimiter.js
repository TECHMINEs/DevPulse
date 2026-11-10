const { RateLimiterMemory } = require('rate-limiter-flexible');
const logger = require('../utils/logger');

// DevPulse runs as a single Node process on SQLite with an in-memory job queue,
// so an in-process limiter is the correct, dependency-free choice. If the API is ever
// scaled horizontally, swap these for RateLimiterRedis instances with the same options.
const rateLimiter = new RateLimiterMemory({
  points: 100, // 100 requests
  duration: 60, // per 60 seconds per IP
  blockDuration: 60, // block for 60 seconds if exceeded
});

// stricter limiter for auth endpoints to prevent brute force
const authRateLimiter = new RateLimiterMemory({
  points: 10,
  duration: 60,
  blockDuration: 120,
});

// CRIT-02: sync limiter — 3 triggers per 5 minutes to prevent GitHub rate limit abuse
const syncRateLimiter = new RateLimiterMemory({
  points: 3,
  duration: 300,     // 5 minutes
  blockDuration: 300,
});

const rateLimitMiddleware = (limiter = rateLimiter) => async (req, res, next) => {
  try {
    const key = req.user ? req.user.id : req.ip;
    await limiter.consume(key);
    next();
  } catch (rejRes) {
    logger.warn('Rate limit exceeded', { ip: req.ip, path: req.path });
    res.status(429).json({
      error: 'Too many requests, please try again later',
      retryAfter: Math.ceil(rejRes.msBeforeNext / 1000),
    });
  }
};

module.exports = { rateLimitMiddleware, authRateLimiter, syncRateLimiter };

