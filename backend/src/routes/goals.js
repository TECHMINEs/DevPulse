const router = require('express').Router();
const db = require('../db/pool');
const { authenticate } = require('../middleware/auth');
const { validateGoal } = require('../middleware/validate');
const logger = require('../utils/logger');

/**
 * @swagger
 * /api/goals:
 *   get:
 *     summary: List user goals
 *     tags: [Goals]
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT * FROM goals
      WHERE user_id = $1
      ORDER BY is_completed ASC, end_date ASC
    `, [req.user.id]);

    // separate active and completed
    const active = result.rows.filter(g => !g.is_completed);
    const completed = result.rows.filter(g => g.is_completed);

    // calculate completion rate
    const total = result.rows.length;
    const completedCount = completed.length;
    const completionRate = total > 0 ? (completedCount / total * 100).toFixed(1) : 0;

    res.json({ active, completed, stats: { total, completedCount, completionRate } });
  } catch (error) {
    logger.error('Get goals error', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch goals' });
  }
});

/**
 * @swagger
 * /api/goals:
 *   post:
 *     summary: Create a new goal
 *     tags: [Goals]
 */
router.post('/', authenticate, validateGoal, async (req, res) => {
  try {
    const { title, goal_type, target_value, start_date, end_date } = req.body;

    const result = await db.query(`
      INSERT INTO goals (user_id, title, goal_type, target_value, start_date, end_date)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [req.user.id, title, goal_type, target_value, start_date, end_date]);

    res.status(201).json({ goal: result.rows[0] });
  } catch (error) {
    logger.error('Create goal error', { error: error.message });
    res.status(500).json({ error: 'Failed to create goal' });
  }
});

/**
 * @swagger
 * /api/goals/{id}:
 *   put:
 *     summary: Update goal progress
 *     tags: [Goals]
 */
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { current_value, is_completed } = req.body;

    const result = await db.query(`
      UPDATE goals SET
        current_value = COALESCE($3, current_value),
        is_completed = COALESCE($4, is_completed)
      WHERE id = $2 AND user_id = $1
      RETURNING *
    `, [req.user.id, req.params.id, current_value, is_completed]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    res.json({ goal: result.rows[0] });
  } catch (error) {
    logger.error('Update goal error', { error: error.message });
    res.status(500).json({ error: 'Failed to update goal' });
  }
});

/**
 * @swagger
 * /api/goals/{id}:
 *   delete:
 *     summary: Delete a goal
 *     tags: [Goals]
 */
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const result = await db.query(
      'DELETE FROM goals WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    res.json({ message: 'Goal deleted' });
  } catch (error) {
    logger.error('Delete goal error', { error: error.message });
    res.status(500).json({ error: 'Failed to delete goal' });
  }
});

module.exports = router;
