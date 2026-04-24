const jwt = require('jsonwebtoken');
const db = require('../db/pool');
const logger = require('../utils/logger');

// --- lightweight LRU-style user cache ----------------------------------------
// Avoids a DB round-trip on every authenticated request. Max 500 entries,
// 30-second TTL. Token revocation still kicks in within one TTL window.
const USER_CACHE_TTL = 30 * 1000; // 30 s
const USER_CACHE_MAX = 500;
const _userCache = new Map(); // key: `${userId}:${token_version}`

const _pruneCache = () => {
  const now = Date.now();
  for (const [key, entry] of _userCache) {
    if (now > entry.expiresAt) _userCache.delete(key);
  }
};

const _getCached = (userId, tokenVersion) => {
  const key = `${userId}:${tokenVersion}`;
  const entry = _userCache.get(key);
  if (!entry || Date.now() > entry.expiresAt) {
    _userCache.delete(key);
    return null;
  }
  return entry.user;
};

const _setCache = (userId, tokenVersion, user) => {
  if (_userCache.size >= USER_CACHE_MAX) _pruneCache();
  _userCache.set(`${userId}:${tokenVersion}`, {
    user,
    expiresAt: Date.now() + USER_CACHE_TTL,
  });
};
// -----------------------------------------------------------------------------

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

    // try cache first — keyed on userId + token_version so revocation busts the cache
    const cachedUser = _getCached(decoded.userId, decoded.token_version);
    if (cachedUser) {
      req.user = cachedUser;
      return next();
    }

    // cache miss — fetch from DB
    const result = await db.query(
      'SELECT id, username, display_name, email, avatar_url, role, provider, token_version FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    if (decoded.token_version !== undefined && result.rows[0].token_version !== decoded.token_version) {
      return res.status(401).json({ error: 'Token revoked' });
    }

    // store in cache and proceed
    _setCache(decoded.userId, decoded.token_version, result.rows[0]);
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