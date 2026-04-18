const logger = require('../utils/logger');

// simple admin check — could make this more granular later with permissions
const adminOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (req.user.role !== 'admin') {
    logger.warn('Admin access denied', { userId: req.user.id, path: req.path });
    return res.status(403).json({ error: 'Admin access required' });
  }

  next();
};

module.exports = { adminOnly };
