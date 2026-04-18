const { RateLimiterMemory } = require('rate-limiter-flexible');
const logger = require('../utils/logger');

// using in-memory rate limiter for now
// TODO: switch to RateLimiterRedis when Redis is always available
// the memory one is fine for single-instance deployment
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

module.exports = { rateLimitMiddleware, authRateLimiter };
