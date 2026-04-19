const db = require('../db/pool');
const logger = require('../utils/logger');

// check and award achievements for a user
// this runs after every sync — might want to debounce it later
const checkAndAwardAchievements = async (userId, io = null) => {
  const newlyEarned = [];

  try {
    // get all achievements and which ones user already has
    const achievementsResult = await db.query(`
      SELECT a.*, ua.earned_at
      FROM achievements a
      LEFT JOIN user_achievements ua ON a.id = ua.achievement_id AND ua.user_id = $1
    `, [userId]);

    const achievements = achievementsResult.rows;
    const unearned = achievements.filter(a => !a.earned_at);

    for (const achievement of unearned) {
      const earned = await checkAchievement(userId, achievement.slug);
      if (earned) {
        // award it
        await db.query(`
          INSERT INTO user_achievements (user_id, achievement_id)
          VALUES ($1, $2)
          ON CONFLICT (user_id, achievement_id) DO NOTHING
        `, [userId, achievement.id]);

        const awardedAchievement = {
          slug: achievement.slug,
          name: achievement.name,
          description: achievement.description,
          icon: achievement.icon,
          category: achievement.category,
          points: achievement.points,
          earned_at: new Date().toISOString(),
        };

        newlyEarned.push(awardedAchievement);

        // emit real-time notification if socket available
        if (io) {
          io.to(`user:${userId}`).emit('achievement_unlocked', { achievement: awardedAchievement });
        }

        logger.info('Achievement unlocked', { userId, achievement: achievement.slug });
      }
    }
  } catch (error) {
    logger.error('Error checking achievements', { userId, error: error.message });
  }

  return newlyEarned;
};

// individual achievement check functions
// each returns true if the user qualifies
const checkAchievement = async (userId, slug) => {
  switch (slug) {
    case 'first_sync':
      return checkFirstSync(userId);
    case 'night_owl':
      return checkNightOwl(userId);
    case 'early_bird':
      return checkEarlyBird(userId);
    case 'streak_7':
      return checkStreak(userId, 7);
    case 'streak_30':
      return checkStreak(userId, 30);
    case 'wellness_90':
      return checkWellness90(userId);
    case 'centurion':
      return checkCenturion(userId);
    case 'polyglot':
      return checkPolyglot(userId);
    case 'team_player':
      return checkTeamPlayer(userId);
    default:
      return false;
  }
};

const checkFirstSync = async (userId) => {
  const result = await db.query(
    "SELECT COUNT(*) as count FROM sync_jobs WHERE user_id = $1 AND status = 'completed'",
    [userId]
  );
  return parseInt(result.rows[0].count) >= 1;
};

const checkNightOwl = async (userId) => {
  // 50+ commits between midnight and 4am
  const result = await db.query(
    'SELECT COUNT(*) as count FROM commit_snapshots WHERE user_id = $1 AND hour_of_day >= 0 AND hour_of_day < 4',
    [userId]
  );
  return parseInt(result.rows[0].count) >= 50;
};

const checkEarlyBird = async (userId) => {
  // 50+ commits before 7am
  const result = await db.query(
    'SELECT COUNT(*) as count FROM commit_snapshots WHERE user_id = $1 AND hour_of_day >= 4 AND hour_of_day < 7',
    [userId]
  );
  return parseInt(result.rows[0].count) >= 50;
};

const checkStreak = async (userId, requiredDays) => {
  // check if user has a streak of N consecutive days
  const result = await db.query(`
    SELECT DISTINCT DATE(committed_at) as commit_date
    FROM commit_snapshots
    WHERE user_id = $1
    ORDER BY commit_date DESC
    LIMIT 365
  `, [userId]);

  if (result.rows.length < requiredDays) return false;

  let maxStreak = 0;
  let currentStreak = 1;
  const dates = result.rows.map(r => new Date(r.commit_date));

  for (let i = 1; i < dates.length; i++) {
    const diff = (dates[i - 1] - dates[i]) / (1000 * 60 * 60 * 24);
    if (Math.abs(diff - 1) < 0.1) {
      currentStreak++;
    } else {
      maxStreak = Math.max(maxStreak, currentStreak);
      currentStreak = 1;
    }
  }
  maxStreak = Math.max(maxStreak, currentStreak);

  return maxStreak >= requiredDays;
};

const checkWellness90 = async (userId) => {
  // 7 consecutive days with score above 90
  const result = await db.query(`
    SELECT score_date, score
    FROM wellness_scores
    WHERE user_id = $1 AND score >= 90
    ORDER BY score_date DESC
    LIMIT 30
  `, [userId]);

  if (result.rows.length < 7) return false;

  let consecutive = 1;
  for (let i = 1; i < result.rows.length; i++) {
    const diff = (new Date(result.rows[i - 1].score_date) - new Date(result.rows[i].score_date)) / (1000 * 60 * 60 * 24);
    if (Math.abs(diff - 1) < 0.1) {
      consecutive++;
      if (consecutive >= 7) return true;
    } else {
      consecutive = 1;
    }
  }

  return consecutive >= 7;
};

const checkCenturion = async (userId) => {
  // 100 commits in a single calendar month
  const result = await db.query(`
    SELECT COUNT(*) as count
    FROM commit_snapshots
    WHERE user_id = $1
        AND strftime('%Y-%m', committed_at) = strftime('%Y-%m', 'now')
  `, [userId]);
  return parseInt(result.rows[0].count) >= 100;
};

const checkPolyglot = async (userId) => {
  // committed to repos in 5+ different languages
  const result = await db.query(`
    SELECT COUNT(DISTINCT r.language) as count
    FROM repositories r
    JOIN commit_snapshots cs ON cs.repo_id = r.id
    WHERE r.user_id = $1 AND r.language IS NOT NULL
  `, [userId]);
  return parseInt(result.rows[0].count) >= 5;
};

const checkTeamPlayer = async (userId) => {
  const result = await db.query(
    'SELECT COUNT(*) as count FROM team_members WHERE user_id = $1',
    [userId]
  );
  return parseInt(result.rows[0].count) >= 1;
};

// get all achievements with user's earned status
const getUserAchievements = async (userId) => {
  const result = await db.query(`
    SELECT a.*, ua.earned_at
    FROM achievements a
    LEFT JOIN user_achievements ua ON a.id = ua.achievement_id AND ua.user_id = $1
    ORDER BY ua.earned_at DESC NULLS LAST, a.points DESC
  `, [userId]);
  return result.rows;
};

// get only earned achievements
const getEarnedAchievements = async (userId) => {
  const result = await db.query(`
    SELECT a.*, ua.earned_at
    FROM achievements a
    JOIN user_achievements ua ON a.id = ua.achievement_id
    WHERE ua.user_id = $1
    ORDER BY ua.earned_at DESC
  `, [userId]);
  return result.rows;
};

// get total points
const getTotalPoints = async (userId) => {
  const result = await db.query(`
    SELECT COALESCE(SUM(a.points), 0) as total
    FROM achievements a
    JOIN user_achievements ua ON a.id = ua.achievement_id
    WHERE ua.user_id = $1
  `, [userId]);
  return parseInt(result.rows[0].total);
};

module.exports = {
  checkAndAwardAchievements,
  getUserAchievements,
  getEarnedAchievements,
  getTotalPoints,
};
