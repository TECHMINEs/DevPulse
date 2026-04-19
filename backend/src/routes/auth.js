const router = require('express').Router();
const passport = require('passport');
const jwt = require('jsonwebtoken');
const { authenticate } = require('../middleware/auth');
const { rateLimitMiddleware, authRateLimiter } = require('../middleware/rateLimiter');
const logger = require('../utils/logger');
const { query } = require('../db/pool');

/**
 * @swagger
 * /auth/github:
 *   get:
 *     summary: Initiate GitHub OAuth flow
 *     tags: [Auth]
 *     responses:
 *       302:
 *         description: Redirects to GitHub OAuth page
 */
router.get('/github', rateLimitMiddleware(authRateLimiter), async (req, res, next) => {
  if (!process.env.GITHUB_CLIENT_ID || process.env.GITHUB_CLIENT_ID.includes('your_github_client_id')) {
    logger.info('Bypassing GitHub OAuth (no credentials provided). Logging in as local Demo User.');
    
    // Ensure Demo User exists
    let user = await query('SELECT * FROM users WHERE username = ?', ['demo_user']);
    if (user.rows.length === 0) {
      await query(`
        INSERT INTO users (id, github_id, username, display_name, email, avatar_url, bio, provider, role)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        'demo-uuid-1234', '12345678', 'demo_user', 'Demo User', 'demo@devpulse.local', 
        'https://avatars.githubusercontent.com/u/9919?s=200&v=4', 'Local dev account', 'github', 'user'
      ]);
      user = await query('SELECT * FROM users WHERE username = ?', ['demo_user']);
    }

    const token = jwt.sign(
      { userId: user.rows[0].id, username: user.rows[0].username, role: user.rows[0].role },
      process.env.JWT_SECRET || 'devpulse_default_secret_key',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.cookie('devpulse_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const frontendUrl = process.env.FRONTEND_URL || 'http://127.0.0.1:5174';
    return res.redirect(`${frontendUrl}/auth/callback?token=${token}`);
  }

  passport.authenticate('github', {
    scope: ['user:email', 'read:user', 'repo'],
    session: false,
  })(req, res, next);
});

/**
 * @swagger
 * /auth/github/callback:
 *   get:
 *     summary: GitHub OAuth callback
 *     tags: [Auth]
 *     responses:
 *       302:
 *         description: Redirects to frontend with JWT cookie set
 */
router.get('/github/callback',
  passport.authenticate('github', { session: false, failureRedirect: '/login?error=auth_failed' }),
  (req, res) => {
    try {
      const token = jwt.sign(
        { userId: req.user.id, username: req.user.username, role: req.user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      // set httpOnly cookie for security
      res.cookie('devpulse_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      // redirect to frontend with token in URL for the client to grab
      // not ideal security-wise but needed for the OAuth redirect flow
      const frontendUrl = process.env.FRONTEND_URL || 'http://127.0.0.1:5174';
      res.redirect(`${frontendUrl}/auth/callback?token=${token}`);
    } catch (error) {
      logger.error('GitHub callback error', { error: error.message });
      res.redirect('/login?error=token_generation_failed');
    }
  }
);

// GitLab OAuth — same pattern, different strategy
// TODO: implement GitLab passport strategy properly, this is a placeholder for now
/**
 * @swagger
 * /auth/gitlab:
 *   get:
 *     summary: Initiate GitLab OAuth flow (beta)
 *     tags: [Auth]
 *     responses:
 *       501:
 *         description: Not yet fully implemented
 */
router.get('/gitlab', (req, res) => {
  // GitLab OAuth is beta — need to finish this
  res.status(501).json({ error: 'GitLab OAuth coming soon — currently in beta' });
});

router.get('/gitlab/callback', (req, res) => {
  res.status(501).json({ error: 'GitLab OAuth coming soon' });
});

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout and clear session
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully logged out
 */
router.post('/logout', (req, res) => {
  res.clearCookie('devpulse_token');
  res.json({ message: 'Logged out successfully' });
});

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get current authenticated user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user profile
 *       401:
 *         description: Not authenticated
 */
router.get('/me', authenticate, (req, res) => {
  // don't send access_token back to the client, that would be bad
  const { access_token, gitlab_access_token, ...safeUser } = req.user;
  res.json({ user: safeUser });
});

module.exports = router;
