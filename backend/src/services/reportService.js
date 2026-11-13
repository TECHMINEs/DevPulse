const PDFDocument = require('pdfkit');
const db = require('../db/pool');
const wellnessService = require('./wellnessService');

// ============================================================================
// Sharp Edged Plasma PDF theme
// ============================================================================
const THEME = {
  background: '#000000',
  surface: '#0A0A0A',
  red: '#FF2626',
  orange: '#A9A9A9',
  cyan: '#FFFFFF',
  green: '#39FF14',
  text: '#FFFFFF',
  muted: '#A3A3A3',
  faint: '#525252',
  rule: '#2E2E2E',
};

const PAGE_MARGIN = 50;
const CONTENT_WIDTH = 595.28 - PAGE_MARGIN * 2; // A4 width in points minus margins

const scoreColor = (score) => (score >= 70 ? THEME.green : score >= 40 ? THEME.orange : THEME.red);

const paintBackground = (doc) => {
  doc.save().rect(0, 0, doc.page.width, doc.page.height).fill(THEME.background).restore();
  doc.fillColor(THEME.text);
};

/** Creates an A4 document whose every page has the black Plasma background. */
const createDocument = (title) => {
  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: PAGE_MARGIN, bottom: PAGE_MARGIN, left: PAGE_MARGIN, right: PAGE_MARGIN },
    info: { Title: title, Author: 'DevPulse — TECHMINES' },
  });
  paintBackground(doc);
  doc.on('pageAdded', () => paintBackground(doc));
  return doc;
};

const drawRule = (doc) => {
  doc.strokeColor(THEME.rule).lineWidth(1)
    .moveTo(PAGE_MARGIN, doc.y).lineTo(PAGE_MARGIN + CONTENT_WIDTH, doc.y).stroke();
  doc.moveDown(1);
};

const drawHeader = (doc, subtitle) => {
  doc.fontSize(28).font('Helvetica-Bold').fillColor(THEME.red).text('DEVPULSE', { align: 'center', characterSpacing: 4 });
  doc.fontSize(12).font('Helvetica').fillColor(THEME.muted).text(subtitle, { align: 'center' });
  doc.moveDown(0.5);
  doc.fontSize(9).fillColor(THEME.faint)
    .text(`Generated ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`, { align: 'center' });
  doc.moveDown(1);
  drawRule(doc);
};

const drawSectionTitle = (doc, title) => {
  doc.x = PAGE_MARGIN;
  doc.fontSize(14).font('Helvetica-Bold').fillColor(THEME.text).text(title.toUpperCase(), { characterSpacing: 1.5 });
  doc.moveDown(0.5);
};

const drawKeyValues = (doc, rows) => {
  rows.forEach(([label, value]) => {
    doc.fontSize(11).font('Helvetica').fillColor(THEME.muted).text(label, PAGE_MARGIN + 20, doc.y, { continued: true });
    doc.font('Helvetica-Bold').fillColor(THEME.cyan).text(`  ${value}`);
  });
  doc.moveDown(1);
};

/**
 * Vector bar chart of daily wellness scores (0–100), drawn with PDFKit primitives so no
 * native canvas dependency is needed. Bars are coloured by risk band.
 */
const drawWellnessChart = (doc, entries, height = 140) => {
  const x = PAGE_MARGIN;
  const y = doc.y;
  const width = CONTENT_WIDTH;
  const labelBand = 16;
  const plotHeight = height - labelBand;

  doc.save().rect(x, y, width, height).fill(THEME.surface).restore();

  // Grid lines at 0 / 40 / 70 / 100 — the risk-band thresholds
  [0, 40, 70, 100].forEach((v) => {
    const gy = y + plotHeight - (v / 100) * plotHeight;
    doc.strokeColor(THEME.rule).lineWidth(0.5).moveTo(x, gy).lineTo(x + width, gy).stroke();
    doc.fontSize(6).font('Helvetica').fillColor(THEME.faint).text(String(v), x + 2, gy - 7, { lineBreak: false });
  });

  const slot = width / entries.length;
  const barWidth = Math.max(2, Math.min(28, slot * 0.6));
  const showDayLabels = entries.length <= 14;

  entries.forEach((entry, i) => {
    const score = Math.max(0, Math.min(100, parseFloat(entry.score) || 0));
    const barHeight = (score / 100) * plotHeight;
    const bx = x + i * slot + (slot - barWidth) / 2;
    doc.save().rect(bx, y + plotHeight - barHeight, barWidth, barHeight).fill(scoreColor(score)).restore();

    if (showDayLabels) {
      const label = new Date(entry.score_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      doc.fontSize(6).fillColor(THEME.muted).text(label, x + i * slot, y + plotHeight + 4, { width: slot, align: 'center', lineBreak: false });
    }
  });

  doc.y = y + height + 12;
  doc.x = PAGE_MARGIN;
};

const drawFooter = (doc) => {
  doc.moveDown(2);
  drawRule(doc);
  // Two runs measured and centred manually — PDFKit mis-centres `continued` text
  const prefix = 'Created by Pranav Jangid | ';
  const brand = 'TECHMINES';
  doc.fontSize(8);
  const prefixWidth = doc.font('Helvetica').widthOfString(prefix);
  const brandWidth = doc.font('Helvetica-Bold').widthOfString(brand);
  const startX = PAGE_MARGIN + (CONTENT_WIDTH - prefixWidth - brandWidth) / 2;
  const lineY = doc.y;
  doc.font('Helvetica').fillColor(THEME.muted).text(prefix, startX, lineY, { lineBreak: false });
  doc.font('Helvetica-Bold').fillColor(THEME.red)
    .text(brand, startX + prefixWidth, lineY, { lineBreak: false, width: brandWidth + 1, link: 'https://github.com/TECHMINEs' });
};

const getReportUser = async (userId) => {
  const result = await db.query('SELECT username, display_name, provider FROM users WHERE id = $1', [userId]);
  if (!result.rows[0]) throw new Error('User not found');
  return result.rows[0];
};

const averageScore = (rows) => (rows.length > 0
  ? (rows.reduce((sum, w) => sum + parseFloat(w.score), 0) / rows.length).toFixed(1)
  : 'N/A');

// ============================================================================
// Weekly report
// ============================================================================
const generateWeeklyReport = async (userId) => {
  const user = await getReportUser(userId);
  const wellness = await wellnessService.getWellnessHistory(userId, 7);

  const commitsResult = await db.query(`
    SELECT COUNT(*) as count,
           SUM(lines_added) as lines_added,
           SUM(lines_removed) as lines_removed
    FROM commit_snapshots
    WHERE user_id = $1 AND committed_at >= date('now', '-7 days')
  `, [userId]);
  const commitStats = commitsResult.rows[0];

  const topReposResult = await db.query(`
    SELECT r.name, COUNT(cs.id) as commit_count
    FROM commit_snapshots cs
    JOIN repositories r ON cs.repo_id = r.id
    WHERE cs.user_id = $1 AND cs.committed_at >= date('now', '-7 days')
    GROUP BY r.name
    ORDER BY commit_count DESC
    LIMIT 5
  `, [userId]);

  const doc = createDocument('DevPulse Weekly Report');
  drawHeader(doc, 'Weekly Developer Intelligence Report');

  doc.fontSize(16).font('Helvetica-Bold').fillColor(THEME.text).text(user.display_name || user.username);
  doc.fontSize(10).font('Helvetica').fillColor(THEME.muted).text(`@${user.username} - ${user.provider}`);
  doc.moveDown(1);

  drawSectionTitle(doc, 'Weekly Summary');
  drawKeyValues(doc, [
    ['Average Wellness Score', averageScore(wellness)],
    ['Total Commits', commitStats.count || '0'],
    ['Lines Added', commitStats.lines_added || '0'],
    ['Lines Removed', commitStats.lines_removed || '0'],
  ]);

  drawSectionTitle(doc, 'Daily Wellness Scores');
  if (wellness.length > 0) {
    drawWellnessChart(doc, wellness);
    wellness.forEach((w) => {
      const score = parseFloat(w.score);
      doc.fontSize(9).font('Helvetica').fillColor(THEME.muted)
        .text(new Date(w.score_date).toLocaleDateString(), PAGE_MARGIN + 20, doc.y, { continued: true });
      doc.font('Helvetica-Bold').fillColor(scoreColor(score)).text(`  ${score.toFixed(1)} (${w.risk_flag})`);
    });
  } else {
    doc.fontSize(10).fillColor(THEME.faint).text('No wellness data for this week');
  }
  doc.moveDown(1);

  drawSectionTitle(doc, 'Top Repositories');
  if (topReposResult.rows.length > 0) {
    topReposResult.rows.forEach((repo, i) => {
      doc.fontSize(10).font('Helvetica').fillColor(THEME.muted)
        .text(`${i + 1}. ${repo.name}`, PAGE_MARGIN + 20, doc.y, { continued: true });
      doc.fillColor(THEME.cyan).text(`  (${repo.commit_count} commits)`);
    });
  } else {
    doc.fontSize(10).fillColor(THEME.faint).text('No repository activity this week');
  }

  drawFooter(doc);
  doc.end();
  return doc;
};

// ============================================================================
// Monthly report
// ============================================================================
const generateMonthlyReport = async (userId, year, month) => {
  const user = await getReportUser(userId);
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);

  const wellness = await db.query(`
    SELECT score_date, score, risk_flag
    FROM wellness_scores
    WHERE user_id = $1 AND score_date >= $2 AND score_date <= $3
    ORDER BY score_date ASC
  `, [userId, startDate.toISOString(), endDate.toISOString()]);

  const commits = await db.query(`
    SELECT COUNT(*) as count, SUM(lines_added) as added, SUM(lines_removed) as removed
    FROM commit_snapshots
    WHERE user_id = $1 AND committed_at >= $2 AND committed_at <= $3
  `, [userId, startDate.toISOString(), endDate.toISOString()]);

  const monthName = startDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const doc = createDocument(`DevPulse Monthly Report — ${monthName}`);
  drawHeader(doc, `Monthly Report - ${monthName} - @${user.username}`);

  drawSectionTitle(doc, 'Monthly Overview');
  drawKeyValues(doc, [
    ['Average Wellness', averageScore(wellness.rows)],
    ['Total Commits', commits.rows[0].count || 0],
    ['Lines Added', commits.rows[0].added || 0],
    ['Lines Removed', commits.rows[0].removed || 0],
  ]);

  drawSectionTitle(doc, 'Daily Scores');
  if (wellness.rows.length > 0) {
    drawWellnessChart(doc, wellness.rows, 160);
  } else {
    doc.fontSize(10).fillColor(THEME.faint).text('No wellness data for this month');
  }

  drawFooter(doc);
  doc.end();
  return doc;
};

module.exports = { generateWeeklyReport, generateMonthlyReport };
