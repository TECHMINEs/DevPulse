const { body, param, validationResult } = require('express-validator');

// centralized validation error handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array().map(e => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

// reusable validation chains
const validateGoal = [
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 200 }),
  body('goal_type').trim().notEmpty().withMessage('Goal type is required')
    .isIn(['daily_commits', 'weekly_commits', 'wellness_score', 'no_night_commits']),
  body('target_value').isNumeric().withMessage('Target value must be a number'),
  body('start_date').isISO8601().withMessage('Start date must be valid ISO date'),
  body('end_date').isISO8601().withMessage('End date must be valid ISO date'),
  handleValidationErrors,
];

const validateTeam = [
  body('name').trim().notEmpty().withMessage('Team name is required').isLength({ max: 100 }),
  body('description').optional().trim().isLength({ max: 500 }),
  handleValidationErrors,
];

const validateProfile = [
  body('display_name').optional().trim().isLength({ max: 150 }),
  body('bio').optional().trim().isLength({ max: 500 }),
  body('location').optional().trim().isLength({ max: 100 }),
  body('company').optional().trim().isLength({ max: 100 }),
  handleValidationErrors,
];

const validateSettings = [
  body('weekly_digest_enabled').optional().isBoolean(),
  body('alert_threshold').optional().isInt({ min: 0, max: 100 }),
  body('alert_email').optional().isEmail().withMessage('Must be a valid email'),
  body('is_public_profile').optional().isBoolean(),
  // SEC-04: validate Slack webhook URL to prevent SSRF via arbitrary webhook destinations
  body('slack_webhook_url')
    .optional()
    .trim()
    .custom((val) => {
      if (val && !val.startsWith('https://hooks.slack.com/')) {
        throw new Error('Slack webhook URL must start with https://hooks.slack.com/');
      }
      return true;
    }),
  handleValidationErrors,
];

const validateUUID = (paramName) => [
  param(paramName).isUUID().withMessage(`${paramName} must be a valid UUID`),
  handleValidationErrors,
];

module.exports = {
  handleValidationErrors,
  validateGoal,
  validateTeam,
  validateProfile,
  validateSettings,
  validateUUID,
};
