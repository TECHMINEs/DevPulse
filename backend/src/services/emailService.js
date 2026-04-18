const nodemailer = require('nodemailer');
const handlebars = require('handlebars');
const logger = require('../utils/logger');

// create transporter — using gmail for dev, should switch to SendGrid for prod
const createTransporter = () => {
  if (!process.env.SMTP_HOST) {
    logger.warn('Email not configured — SMTP_HOST missing');
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

// weekly digest email template
// email template broken on gmail, had to inline all css
const digestTemplate = handlebars.compile(`
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f172a;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#1e293b;border-radius:16px;overflow:hidden;">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px;text-align:center;">
              <h1 style="color:#ffffff;margin:0;font-size:28px;">⚡ DevPulse</h1>
              <p style="color:#e0e7ff;margin:8px 0 0;font-size:14px;">Your weekly developer wellness report</p>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding:32px 32px 16px;">
              <h2 style="color:#f1f5f9;margin:0;font-size:20px;">Hey {{name}} 👋</h2>
              <p style="color:#94a3b8;margin:8px 0 0;font-size:14px;">Here's your developer wellness report for the week of {{weekStart}}</p>
            </td>
          </tr>

          <!-- Stats Row -->
          <tr>
            <td style="padding:16px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="33%" style="text-align:center;padding:16px;background-color:#0f172a;border-radius:12px;">
                    <div style="color:#6366f1;font-size:32px;font-weight:700;">{{avgScore}}</div>
                    <div style="color:#94a3b8;font-size:12px;margin-top:4px;">Avg Score</div>
                  </td>
                  <td width="8"></td>
                  <td width="33%" style="text-align:center;padding:16px;background-color:#0f172a;border-radius:12px;">
                    <div style="color:#10b981;font-size:32px;font-weight:700;">{{totalCommits}}</div>
                    <div style="color:#94a3b8;font-size:12px;margin-top:4px;">Commits</div>
                  </td>
                  <td width="8"></td>
                  <td width="33%" style="text-align:center;padding:16px;background-color:#0f172a;border-radius:12px;">
                    <div style="color:#f59e0b;font-size:14px;font-weight:600;">{{topRepo}}</div>
                    <div style="color:#94a3b8;font-size:12px;margin-top:4px;">Top Repo</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- AI Insights -->
          <tr>
            <td style="padding:16px 32px;">
              <div style="background-color:#0f172a;border-radius:12px;padding:20px;border-left:4px solid #6366f1;">
                <h3 style="color:#e0e7ff;margin:0 0 8px;font-size:14px;">🤖 AI Insights</h3>
                <p style="color:#cbd5e1;margin:0;font-size:14px;line-height:1.6;">{{aiSummary}}</p>
              </div>
            </td>
          </tr>

          {{#if achievements.length}}
          <!-- Achievements -->
          <tr>
            <td style="padding:16px 32px;">
              <h3 style="color:#f1f5f9;margin:0 0 12px;font-size:16px;">🏆 New Achievements</h3>
              {{#each achievements}}
              <div style="display:inline-block;background-color:#0f172a;border-radius:8px;padding:8px 16px;margin:4px;">
                <span style="font-size:20px;">{{this.icon}}</span>
                <span style="color:#e0e7ff;font-size:13px;margin-left:4px;">{{this.name}}</span>
              </div>
              {{/each}}
            </td>
          </tr>
          {{/if}}

          <!-- CTA -->
          <tr>
            <td style="padding:24px 32px;text-align:center;">
              <a href="{{dashboardUrl}}" style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:600;font-size:14px;">
                View Full Dashboard →
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 32px;border-top:1px solid #334155;text-align:center;">
              <p style="color:#64748b;font-size:12px;margin:0;">
                You're receiving this because you have weekly digests enabled.
                <a href="{{unsubscribeUrl}}" style="color:#6366f1;">Unsubscribe</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`);

// send weekly digest email
const sendWeeklyDigest = async (recipientEmail, data) => {
  const transporter = createTransporter();
  if (!transporter) {
    logger.warn('Email not sent — transporter not configured');
    return false;
  }

  const html = digestTemplate({
    ...data,
    dashboardUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
    unsubscribeUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/settings`,
  });

  try {
    await transporter.sendMail({
      from: `"DevPulse" <${process.env.SMTP_USER}>`,
      to: recipientEmail,
      subject: `Your DevPulse weekly digest — week of ${data.weekStart}`,
      html,
    });

    logger.info('Weekly digest sent', { to: recipientEmail });
    return true;
  } catch (error) {
    logger.error('Failed to send digest email', { to: recipientEmail, error: error.message });
    return false;
  }
};

// send alert email when wellness drops below threshold
const sendAlertEmail = async (recipientEmail, data) => {
  const transporter = createTransporter();
  if (!transporter) return false;

  const html = `
    <div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:20px;">
      <h2 style="color:#ef4444;">⚠️ DevPulse wellness alert</h2>
      <p>Hey ${data.name}, your wellness score dropped to <strong>${data.score}</strong>.</p>
      <p>Your threshold is set to ${data.threshold}. Consider taking a break!</p>
      <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard"
         style="display:inline-block;background:#6366f1;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;margin-top:12px;">
        View Dashboard
      </a>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"DevPulse" <${process.env.SMTP_USER}>`,
      to: recipientEmail,
      subject: `⚠️ DevPulse: Your wellness score is ${data.score}`,
      html,
    });
    return true;
  } catch (error) {
    logger.error('Failed to send alert email', { error: error.message });
    return false;
  }
};

module.exports = { sendWeeklyDigest, sendAlertEmail };
