const { digestQueue } = require('../queues/digestQueue');
const emailService = require('../services/emailService');
const wellnessService = require('../services/wellnessService');
const achievementService = require('../services/achievementService');
const db = require('../db/pool');
const logger = require('../utils/logger');

// Weekly digest worker — processes every Monday at 8am
// email template broken on gmail, had to inline all css
digestQueue.process('send-digests', async (job) => {
  logger.info('Processing weekly digest job');

  try {
    // get all users with digest enabled
    const usersResult = await db.query(`
      SELECT id, username, display_name, email, alert_email
      FROM users
      WHERE weekly_digest_enabled = true
        AND (email IS NOT NULL OR alert_email IS NOT NULL)
    `);

    const users = usersResult.rows;
    logger.info(`Sending digest to ${users.length} users`);

    let sent = 0;
    let failed = 0;

    for (const user of users) {
      try {
        const recipientEmail = user.alert_email || user.email;
        if (!recipientEmail) continue;

        // get this week's data
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - 7);
        const weekStartStr = weekStart.toISOString().split('T')[0];

        // get wellness scores for the week
        const wellnessHistory = await wellnessService.getWellnessHistory(user.id, 7);
        const avgScore = wellnessHistory.length > 0
          ? wellnessHistory.reduce((sum, w) => sum + parseFloat(w.score), 0) / wellnessHistory.length
          : 0;

        // get commit count
        const commitsResult = await db.query(`
          SELECT COUNT(*) as count FROM commit_snapshots
          WHERE user_id = $1 AND committed_at >= $2
        `, [user.id, weekStart.toISOString()]);
        const totalCommits = parseInt(commitsResult.rows[0].count);

        // get top repo
        const topRepoResult = await db.query(`
          SELECT r.name, COUNT(cs.id) as commit_count
          FROM commit_snapshots cs
          JOIN repositories r ON cs.repo_id = r.id
          WHERE cs.user_id = $1 AND cs.committed_at >= $2
          GROUP BY r.name
          ORDER BY commit_count DESC
          LIMIT 1
        `, [user.id, weekStart.toISOString()]);
        const topRepo = topRepoResult.rows[0]?.name || 'N/A';

        // get new achievements this week
        const newAchievements = await db.query(`
          SELECT a.name, a.icon, ua.earned_at
          FROM user_achievements ua
          JOIN achievements a ON ua.achievement_id = a.id
          WHERE ua.user_id = $1 AND ua.earned_at >= $2
        `, [user.id, weekStart.toISOString()]);

        // generate AI summary (optional — requires OpenAI key)
        let aiSummary = '';
        let aiRecommendations = '';

        if (process.env.OPENAI_API_KEY) {
          try {
            const axios = require('axios');
            const dataContext = `Average wellness: ${avgScore.toFixed(1)}, Total commits: ${totalCommits}, Top repo: ${topRepo}, Night commit %: ${wellnessHistory[wellnessHistory.length - 1]?.night_commit_pct || 0}`;

            const aiResponse = await axios.post('https://api.openai.com/v1/chat/completions', {
              model: 'gpt-4o-mini',
              messages: [{
                role: 'system',
                content: 'You are a friendly developer wellness advisor. Write brief, warm, encouraging analysis.'
              }, {
                role: 'user',
                content: `Given this developer's data for the past week: ${dataContext}, write a brief, warm, encouraging 3-4 sentence analysis. Mention one specific positive pattern and one area to watch. Do not use jargon.`
              }],
              max_tokens: 200,
              temperature: 0.7,
            }, {
              headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` },
            });

            aiSummary = aiResponse.data.choices[0].message.content;
          } catch (aiError) {
            logger.warn('AI summary generation failed', { error: aiError.message });
            aiSummary = `This week you made ${totalCommits} commits with an average wellness score of ${avgScore.toFixed(1)}. Keep up the great work!`;
          }
        } else {
          aiSummary = `This week you made ${totalCommits} commits with an average wellness score of ${avgScore.toFixed(1)}. Your most active repo was ${topRepo}.`;
        }

        // send the email
        await emailService.sendWeeklyDigest(recipientEmail, {
          name: user.display_name || user.username,
          weekStart: weekStartStr,
          avgScore: avgScore.toFixed(1),
          totalCommits,
          topRepo,
          aiSummary,
          achievements: newAchievements.rows,
          wellnessHistory,
        });

        // store digest record
        await db.query(`
          INSERT INTO weekly_digests (user_id, week_start, avg_score, total_commits, top_repo, ai_summary, ai_recommendations)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [user.id, weekStartStr, avgScore, totalCommits, topRepo, aiSummary, aiRecommendations]);

        sent++;
      } catch (userError) {
        logger.error('Failed to send digest to user', {
          userId: user.id,
          error: userError.message,
        });
        failed++;
      }
    }

    logger.info('Weekly digest job completed', { sent, failed });
    return { sent, failed };
  } catch (error) {
    logger.error('Weekly digest job failed', { error: error.message });
    throw error;
  }
});

module.exports = { digestQueue };
