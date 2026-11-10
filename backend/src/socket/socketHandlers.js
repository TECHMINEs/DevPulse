const jwt = require('jsonwebtoken');
const db = require('../db/pool');
const logger = require('../utils/logger');

let _ioInstance = null;
const getIO = () => _ioInstance;

// Socket.io event handlers
const setupSocketHandlers = (io) => {
  // make io globally available for workers
  _ioInstance = io;

  // SEC-02: JWT auth middleware for Socket.io — now also checks token_version
  // so revoked tokens (after logout) cannot maintain WebSocket connections.
  io.use(async (socket, next) => {
    let token = socket.handshake.auth?.token;

    // fall back to reading from cookie if auth.token is missing
    if (!token && socket.request.headers.cookie) {
      const match = socket.request.headers.cookie.match(/devpulse_token=([^;]+)/);
      if (match) {
        token = match[1];
      }
    }

    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // SEC-02: validate token_version against DB to catch revoked tokens
      const result = await db.query(
        'SELECT id, token_version FROM users WHERE id = $1',
        [decoded.userId]
      );
      if (!result.rows[0]) {
        return next(new Error('User not found'));
      }
      if (
        decoded.token_version !== undefined &&
        result.rows[0].token_version !== decoded.token_version
      ) {
        logger.warn('Socket: revoked token rejected', { userId: decoded.userId });
        return next(new Error('Token revoked'));
      }

      socket.userId = decoded.userId;
      socket.username = decoded.username;
      next();
    } catch (error) {
      logger.warn('Socket auth failed', { error: error.message });
      return next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    logger.info('Socket connected', { userId: socket.userId, socketId: socket.id });

    // auto-join user's room
    socket.join(`user:${socket.userId}`);

    // handle explicit subscribe (for backward compat)
    socket.on('subscribe', () => {
      socket.join(`user:${socket.userId}`);
      socket.emit('subscribed', { room: `user:${socket.userId}` });
    });

    socket.on('disconnect', (reason) => {
      logger.info('Socket disconnected', { userId: socket.userId, reason });
    });

    socket.on('error', (error) => {
      logger.error('Socket error', { userId: socket.userId, error: error.message });
    });
  });

  logger.info('Socket.io handlers initialized');
};

module.exports = { setupSocketHandlers, getIO };
