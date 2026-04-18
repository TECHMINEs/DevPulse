const jwt = require('jsonwebtoken');
const db = require('../db/pool');
const logger = require('../utils/logger');

// JWT auth middleware — checks both Authorization header and httpOnly cookie
const authenticate = async (req, res, next) => {
  try {
    let token = null;

    // check Authorization header first
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    // fall back to httpOnly cookie
    if (!token && req.cookies && req.cookies.devpulse_token) {
      token = req.cookies.devpulse_token;
    }

    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // fetch fresh user data — could cache this but it's fast enough for now
    const result = await db.query(
      'SELECT id, username, display_name, email, avatar_url, role, provider FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = result.rows[0];
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    logger.error('Auth middleware error', { error: error.message });
    return res.status(500).json({ error: 'Authentication failed' });
  }
};

module.exports = { authenticate };
