const router = require('express').Router();
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const db = require('../db/pool');
const { authenticate } = require('../middleware/auth');
const { validateProfile, validateSettings } = require('../middleware/validate');
const logger = require('../utils/logger');

// multer setup for avatar upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, WebP, and GIF images are allowed'));
    }
  },
});

/**
 * @swagger
 * /api/user/profile:
 *   get:
 *     summary: Get current user profile with stats
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 */
router.get('/profile', authenticate, async (req, res) => {
  try {
    const userResult = await db.query(`
      SELECT u.id, u.username, u.display_name, u.email, u.avatar_url, u.bio,
             u.location, u.company, u.provider, u.is_public_profile,
             u.weekly_digest_enabled, u.alert_threshold, u.role,
             u.created_at, u.last_synced_at,
             (SELECT COUNT(*) FROM commit_snapshots WHERE user_id = u.id) as total_commits,
             (SELECT COUNT(*) FROM repositories WHERE user_id = u.id) as total_repos,
             (SELECT COUNT(*) FROM user_achievements WHERE user_id = u.id) as total_achievements,
             (SELECT COALESCE(SUM(a.points), 0) FROM user_achievements ua JOIN achievements a ON ua.achievement_id = a.id WHERE ua.user_id = u.id) as total_points
      FROM users u
      WHERE u.id = $1
    `, [req.user.id]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // get latest wellness score
    const wellnessResult = await db.query(`
      SELECT score, risk_flag, streak_days
      FROM wellness_scores
      WHERE user_id = $1
      ORDER BY score_date DESC
      LIMIT 1
    `, [req.user.id]);

    const profile = {
      ...userResult.rows[0],
      current_wellness: wellnessResult.rows[0] || { score: null, risk_flag: 'none', streak_days: 0 },
    };

    res.json({ profile });
  } catch (error) {
    logger.error('Get profile error', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

/**
 * @swagger
 * /api/user/profile:
 *   put:
 *     summary: Update user profile
 *     tags: [User]
 */
router.put('/profile', authenticate, validateProfile, async (req, res) => {
  try {
    const { display_name, bio, location, company } = req.body;

    const result = await db.query(`
      UPDATE users SET
        display_name = COALESCE($2, display_name),
        bio = COALESCE($3, bio),
        location = COALESCE($4, location),
        company = COALESCE($5, company),
        updated_at = NOW()
      WHERE id = $1
      RETURNING id, username, display_name, bio, location, company, avatar_url
    `, [req.user.id, display_name, bio, location, company]);

    res.json({ profile: result.rows[0] });
  } catch (error) {
    logger.error('Update profile error', { error: error.message });
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

/**
 * @swagger
 * /api/user/settings:
 *   put:
 *     summary: Update user notification and privacy settings
 *     tags: [User]
 */
router.put('/settings', authenticate, validateSettings, async (req, res) => {
  try {
    const { weekly_digest_enabled, alert_threshold, alert_email, is_public_profile, slack_webhook_url } = req.body;

    const result = await db.query(`
      UPDATE users SET
        weekly_digest_enabled = COALESCE($2, weekly_digest_enabled),
        alert_threshold = COALESCE($3, alert_threshold),
        alert_email = COALESCE($4, alert_email),
        is_public_profile = COALESCE($5, is_public_profile),
        slack_webhook_url = COALESCE($6, slack_webhook_url),
        updated_at = NOW()
      WHERE id = $1
      RETURNING id, weekly_digest_enabled, alert_threshold, alert_email, is_public_profile, slack_webhook_url
    `, [req.user.id, weekly_digest_enabled, alert_threshold, alert_email, is_public_profile, slack_webhook_url]);

    res.json({ settings: result.rows[0] });
  } catch (error) {
    logger.error('Update settings error', { error: error.message });
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

/**
 * @swagger
 * /api/user/{username}/public:
 *   get:
 *     summary: Get public developer profile
 *     tags: [User]
 */
router.get('/:username/public', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT u.username, u.display_name, u.avatar_url, u.bio, u.location,
             u.created_at,
             (SELECT COUNT(*) FROM commit_snapshots WHERE user_id = u.id) as total_commits,
             (SELECT COUNT(*) FROM repositories WHERE user_id = u.id) as total_repos,
             (SELECT COUNT(*) FROM user_achievements WHERE user_id = u.id) as total_achievements
      FROM users u
      WHERE u.username = $1 AND u.is_public_profile = true
    `, [req.params.username]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Profile not found or is private' });
    }

    // get top language
    const langResult = await db.query(`
      SELECT r.language, COUNT(cs.id) as count
      FROM repositories r
      JOIN commit_snapshots cs ON cs.repo_id = r.id
      JOIN users u ON u.id = r.user_id
      WHERE u.username = $1 AND r.language IS NOT NULL
      GROUP BY r.language
      ORDER BY count DESC
      LIMIT 1
    `, [req.params.username]);

    // get wellness history (last 30 days) for public profile
    const wellnessResult = await db.query(`
      SELECT ws.score_date, ws.score
      FROM wellness_scores ws
      JOIN users u ON u.id = ws.user_id
      WHERE u.username = $1 AND u.is_public_profile = true
        AND ws.score_date >= CURRENT_DATE - 30
      ORDER BY ws.score_date ASC
    `, [req.params.username]);

    // get earned achievements
    const achievementsResult = await db.query(`
      SELECT a.name, a.icon, a.category, ua.earned_at
      FROM user_achievements ua
      JOIN achievements a ON ua.achievement_id = a.id
      JOIN users u ON u.id = ua.user_id
      WHERE u.username = $1
      ORDER BY ua.earned_at DESC
    `, [req.params.username]);

    // get longest streak
    const streakResult = await db.query(`
      SELECT MAX(streak_days) as longest_streak
      FROM wellness_scores ws
      JOIN users u ON u.id = ws.user_id
      WHERE u.username = $1
    `, [req.params.username]);

    res.json({
      profile: {
        ...result.rows[0],
        top_language: langResult.rows[0]?.language || null,
        longest_streak: streakResult.rows[0]?.longest_streak || 0,
        wellness_history: wellnessResult.rows,
        achievements: achievementsResult.rows,
      },
    });
  } catch (error) {
    logger.error('Get public profile error', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

/**
 * @swagger
 * /api/user/avatar:
 *   post:
 *     summary: Upload user avatar
 *     tags: [User]
 */
router.post('/avatar', authenticate, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // resize to 200x200 with sharp
    const resizedBuffer = await sharp(req.file.buffer)
      .resize(200, 200, { fit: 'cover' })
      .webp({ quality: 80 })
      .toBuffer();

    // convert to base64 data URL (for simplicity — in production use S3/Cloudinary)
    const base64 = resizedBuffer.toString('base64');
    const avatarUrl = `data:image/webp;base64,${base64}`;

    await db.query('UPDATE users SET avatar_url = $2, updated_at = NOW() WHERE id = $1', [req.user.id, avatarUrl]);

    res.json({ avatar_url: avatarUrl, message: 'Avatar updated successfully' });
  } catch (error) {
    logger.error('Avatar upload error', { error: error.message });
    res.status(500).json({ error: 'Failed to upload avatar' });
  }
});

module.exports = router;
