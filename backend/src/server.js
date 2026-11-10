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
    origin: process.env.NODE_ENV === 'production' 
      ? process.env.FRONTEND_URL 
      : [process.env.FRONTEND_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'],
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
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdn.jsdelivr.net"],
      imgSrc: ["'self'", "data:", "https://avatars.githubusercontent.com", "https://api.dicebear.com"],
      connectSrc: [
        "'self'", 
        process.env.FRONTEND_URL || "http://localhost:5173", 
        "https://api.github.com", 
        process.env.ML_SERVICE_URL || "http://localhost:8000", 
        "ws:", 
        "wss:"
      ],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL 
    : [process.env.FRONTEND_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

// CORS — took a while to get this right with credentials + cookies
app.use(cors(corsOptions));

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

// FEAT-05: health check — verifies DB connectivity, returns 503 if unhealthy
app.get('/health', async (req, res) => {
  const checks = { database: 'ok' };
  let healthy = true;
  try {
    const { query } = require('./db/pool');
    await query('SELECT 1');
  } catch (e) {
    checks.database = `error: ${e.message}`;
    healthy = false;
  }
  res.status(healthy ? 200 : 503).json({
    status: healthy ? 'ok' : 'degraded',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    checks,
  });
});

// ============================================================================
// SOCKET.IO
// ============================================================================
setupSocketHandlers(io);

// ============================================================================
// SCHEDULED JOBS AND WORKERS
// ============================================================================
require('./workers/syncWorker');

// Weekly digest — every Monday at 08:00 in DIGEST_TIMEZONE (IANA name, default UTC).
// Pinning the zone keeps delivery time stable regardless of where the server is hosted.
const DIGEST_TIMEZONE = process.env.DIGEST_TIMEZONE || 'UTC';
cron.schedule('0 8 * * 1', async () => {
  logger.info('Running weekly digest job...');
  try {
    const { digestQueue } = require('./queues/digestQueue');
    await digestQueue.add('send-digests', {}, { attempts: 3, backoff: 5000 });
    logger.info('Weekly digest job queued successfully');
  } catch (error) {
    logger.error('Failed to queue weekly digest job', { error: error.message });
  }
}, { timezone: DIGEST_TIMEZONE });

// ============================================================================
// ERROR HANDLING
// ============================================================================
// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found', path: req.path });
});

// global error handler — catches everything unhandled
app.use((err, req, res, _next) => {
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
const PORT = process.env.PORT || 5001;
const { initDB } = require('./db/pool');
const fs = require('fs');
const path = require('path');

const startServer = async () => {
  try {
    const db = await initDB();
    const schemaSQL = fs.readFileSync(path.join(__dirname, 'db/schema.sql'), 'utf-8');
    await db.exec(schemaSQL);
    logger.info('Database schema applied');

    server.listen(PORT, () => {
      logger.info(`🚀 DevPulse API running on port ${PORT}`);
      logger.info(`📖 API docs available at http://localhost:${PORT}/api/docs`);
      logger.info(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    logger.error('Failed to start server', { error: error.message });
    process.exit(1);
  }
};

startServer();

// QUAL-10: graceful shutdown — wait for in-flight sync jobs before closing
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, draining queue...');
  try {
    const { syncQueue } = require('./queues/syncQueue');
    await syncQueue.waitForIdle();
  } catch (e) {
    logger.warn('Queue drain failed', { error: e.message });
  }
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection', { reason: reason?.message || reason });
});

module.exports = { app, server, io };
