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
router.get('/github', rateLimitMiddleware(authRateLimiter), (req, res, next) => {
  try {
    passport.authenticate('github', {
      scope: ['user:email', 'read:user', 'repo'],
      session: false,
    })(req, res, next);
  } catch (error) {
    logger.error('Passport authenticate error', { error: error.message });
    res.status(500).json({ error: 'Auth initialization failed' });
  }
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
        { userId: req.user.id, username: req.user.username, role: req.user.role, token_version: req.user.token_version },
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

      // redirect to frontend — cookie is already set, no token in URL (CRIT-07)
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      res.redirect(`${frontendUrl}/login/callback`);
    } catch (error) {
      logger.error('GitHub callback error', { error: error.message });
      res.redirect('/login?error=token_generation_failed');
    }
  }
);

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
router.post('/logout', authenticate, async (req, res) => {
  try {
    await query('UPDATE users SET token_version = token_version + 1 WHERE id = $1', [req.user.id]);
    res.clearCookie('devpulse_token');
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    logger.error('Logout error', { error: error.message });
    res.status(500).json({ error: 'Failed to logout' });
  }
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

/**
 * @swagger
 * /auth/users/search:
 *   get:
 *     summary: Search for users to invite to a team
 *     tags: [Auth, Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query (username or display name)
 *     responses:
 *       200:
 *         description: List of matching users
 */
router.get('/users/search', authenticate, async (req, res) => {
  try {
    const searchQuery = req.query.q;
    if (!searchQuery || searchQuery.length < 2) {
      return res.json({ users: [] });
    }

    // Explicitly exclude sensitive tokens and passwords
    const result = await query(`
      SELECT id, username, display_name, avatar_url 
      FROM users 
      WHERE (username ILIKE $1 OR display_name ILIKE $1)
      AND id != $2
      LIMIT 10
    `, [`%${searchQuery}%`, req.user.id]);

    res.json({ users: result.rows });
  } catch (error) {
    logger.error('User search error', { error: error.message });
    res.status(500).json({ error: 'Failed to search users' });
  }
});

module.exports = router;
