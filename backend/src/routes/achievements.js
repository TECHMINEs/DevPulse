const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const achievementService = require('../services/achievementService');
const logger = require('../utils/logger');

/**
 * @swagger
 * /api/achievements:
 *   get:
 *     summary: Get all achievements with earned status
 *     tags: [Achievements]
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const achievements = await achievementService.getUserAchievements(req.user.id);
    const totalPoints = await achievementService.getTotalPoints(req.user.id);
    res.json({ achievements, totalPoints });
  } catch (error) {
    logger.error('Get achievements error', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch achievements' });
  }
});

/**
 * @swagger
 * /api/achievements/earned:
 *   get:
 *     summary: Get only earned achievements
 *     tags: [Achievements]
 */
router.get('/earned', authenticate, async (req, res) => {
  try {
    const achievements = await achievementService.getEarnedAchievements(req.user.id);
    res.json({ achievements });
  } catch (error) {
    logger.error('Get earned achievements error', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch earned achievements' });
  }
});

/**
 * @swagger
 * /api/achievements/check:
 *   post:
 *     summary: Trigger achievement check (internal)
 *     tags: [Achievements]
 */
router.post('/check', authenticate, async (req, res) => {
  try {
    const io = req.app.get('io');
    const newlyEarned = await achievementService.checkAndAwardAchievements(req.user.id, io);
    res.json({ newlyEarned });
  } catch (error) {
    logger.error('Check achievements error', { error: error.message });
    res.status(500).json({ error: 'Failed to check achievements' });
  }
});

module.exports = router;
