require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const passport = require('passport');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const logger = require('./utils/logger');
const { setupSocketHandlers } = require('./socket/socketHandlers');
const cron = require('node-cron');

// Route imports
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const syncRoutes = require('./routes/sync');
const analyticsRoutes = require('./routes/analytics');
const reposRoutes = require('./routes/repos');
const achievementRoutes = require('./routes/achievements');
const goalRoutes = require('./routes/goals');
const teamRoutes = require('./routes/teams');
const reportRoutes = require('./routes/reports');
const adminRoutes = require('./routes/admin');

const app = express();
const server = http.createServer(app);

// Socket.io setup — this was way more complex than I expected
// had to figure out CORS + auth handshake together
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

// make io accessible from routes/services
app.set('io', io);

// ============================================================================
// MIDDLEWARE
// ============================================================================

// security headers — helmet is a must
app.use(helmet({
  contentSecurityPolicy: false, // disabled for swagger UI, revisit later
  crossOriginEmbedderPolicy: false,
}));

// CORS — took a while to get this right with credentials + cookies
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// passport setup for OAuth
app.use(passport.initialize());
require('./config/passport')(passport);

// request logging in dev
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    logger.info(`${req.method} ${req.path}`, {
      query: Object.keys(req.query).length ? req.query : undefined,
    });
    next();
  });
}

// ============================================================================
// ROUTES
// ============================================================================
app.use('/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/repos', reposRoutes);
app.use('/api/achievements', achievementRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/admin', adminRoutes);

// Swagger docs — super helpful for the portfolio
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'DevPulse API Documentation',
}));

// health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() });
});

// ============================================================================
// SOCKET.IO
// ============================================================================
setupSocketHandlers(io);

// ============================================================================
// SCHEDULED JOBS
// ============================================================================
// Weekly digest — every Monday at 8am
// TODO: make this timezone-aware per user, for now it runs in server timezone
cron.schedule('0 8 * * 1', async () => {
  logger.info('Running weekly digest job...');
  try {
    const { digestQueue } = require('./queues/digestQueue');
    await digestQueue.add('send-digests', {}, { attempts: 3, backoff: 5000 });
    logger.info('Weekly digest job queued successfully');
  } catch (error) {
    logger.error('Failed to queue weekly digest job', { error: error.message });
  }
});

// ============================================================================
// ERROR HANDLING
// ============================================================================
// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found', path: req.path });
});

// global error handler — catches everything unhandled
app.use((err, req, res, next) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  // don't leak stack traces in production
  const response = {
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  };

  res.status(err.status || 500).json(response);
});

// ============================================================================
// START SERVER
// ============================================================================
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  logger.info(`🚀 DevPulse API running on port ${PORT}`);
  logger.info(`📖 API docs available at http://localhost:${PORT}/api/docs`);
  logger.info(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', { reason: reason?.message || reason });
});

module.exports = { app, server, io };
