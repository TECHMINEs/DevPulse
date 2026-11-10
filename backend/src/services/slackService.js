const axios = require('axios');
const logger = require('../utils/logger');

/**
 * FEAT-02: Slack Notification Service
 * Handles sending formatted alerts to user-provided Slack webhooks.
 */
class SlackService {
  /**
   * Send a wellness alert to Slack
   * @param {string} webhookUrl - The user's Slack webhook URL
   * @param {Object} data - Alert data (score, username, risk_flag)
   */
  async sendWellnessAlert(webhookUrl, { score, username, riskFlag }) {
    if (!webhookUrl || !webhookUrl.startsWith('https://hooks.slack.com/')) {
      logger.debug('Skipping Slack alert: Invalid or missing webhook URL');
      return;
    }

    try {
      const color = riskFlag === 'high' ? '#ef4444' : '#f59e0b';
      const emoji = riskFlag === 'high' ? '⚠️' : '🔔';

      const payload = {
        text: `${emoji} *DevPulse Wellness Alert for ${username}*`,
        attachments: [
          {
            color,
            blocks: [
              {
                type: 'section',
                text: {
                  type: 'mrkdwn',
                  text: `Your wellness score has dropped to *${score}*.`,
                },
              },
              {
                type: 'context',
                elements: [
                  {
                    type: 'mrkdwn',
                    text: riskFlag === 'high' 
                      ? '_We recommend taking a short break to prevent burnout._' 
                      : '_Consider checking your recent commit patterns._',
                  },
                ],
              },
            ],
          },
        ],
      };

      await axios.post(webhookUrl, payload, { timeout: 5000 });
      logger.info('Slack alert sent successfully', { username, riskFlag });
    } catch (error) {
      // Don't throw — we don't want Slack failures to break the core sync/wellness logic
      logger.error('Failed to send Slack alert', { 
        username, 
        error: error.response?.data || error.message 
      });
    }
  }
}

module.exports = new SlackService();
