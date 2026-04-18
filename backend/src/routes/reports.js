const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const reportService = require('../services/reportService');
const logger = require('../utils/logger');

/**
 * @swagger
 * /api/reports/weekly:
 *   get:
 *     summary: Generate weekly PDF report
 *     tags: [Reports]
 */
router.get('/weekly', authenticate, async (req, res) => {
  try {
    const doc = await reportService.generateWeeklyReport(req.user.id);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=devpulse-weekly-report.pdf');

    doc.pipe(res);
  } catch (error) {
    logger.error('Generate weekly report error', { error: error.message });
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

/**
 * @swagger
 * /api/reports/monthly/{year}/{month}:
 *   get:
 *     summary: Generate monthly PDF report
 *     tags: [Reports]
 */
router.get('/monthly/:year/:month', authenticate, async (req, res) => {
  try {
    const year = parseInt(req.params.year);
    const month = parseInt(req.params.month);

    if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
      return res.status(400).json({ error: 'Invalid year or month' });
    }

    const doc = await reportService.generateMonthlyReport(req.user.id, year, month);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=devpulse-report-${year}-${month}.pdf`);

    doc.pipe(res);
  } catch (error) {
    logger.error('Generate monthly report error', { error: error.message });
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

module.exports = router;
