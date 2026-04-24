const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

let _ioInstance = null;
const getIO = () => _ioInstance;

// Socket.io event handlers
// this was way more complex than I expected, Socket.io room auth is tricky
const setupSocketHandlers = (io) => {
  // make io globally available for workers
  _ioInstance = io;

  // JWT auth middleware for Socket.io
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
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
