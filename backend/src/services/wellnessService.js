const db = require('../db/pool');
const logger = require('../utils/logger');

// not 100% sure this is the right formula but the scores feel right empirically
// the idea is: more night commits = worse wellness, more regular hours = better
// streak bonus caps at 30 days to prevent rewarding unhealthy obsession
const computeWellnessScore = (features) => {
  const {
    avg_commit_hour,
    night_commit_pct,
    weekend_commit_pct,
    avg_message_length,
    commits_count,
    lines_changed_stddev = 0,
    streak_days = 0,
  } = features;

  let score = 100;

  // penalize night commits (midnight to 5am) — this is the biggest red flag
  // if 50%+ of your commits are at night, that's not great
  score -= night_commit_pct * 40;

  // penalize heavy weekend work (some is fine, >60% is burnout territory)
  if (weekend_commit_pct > 0.6) {
    score -= (weekend_commit_pct - 0.6) * 30;
  } else if (weekend_commit_pct > 0.3) {
    score -= (weekend_commit_pct - 0.3) * 10;
  }

  // penalize very late average commit hour (after 11pm)
  if (avg_commit_hour > 23 || avg_commit_hour < 4) {
    score -= 15;
  } else if (avg_commit_hour > 21) {
    score -= 8;
  }

  // penalize very short commit messages (lazy commits = tired developer)
  if (avg_message_length < 10) {
    score -= 10;
  } else if (avg_message_length < 20) {
    score -= 5;
  }

  // bonus for good commit messages
  if (avg_message_length > 50) {
    score += 5;
  }

  // penalize high variance in code output (sprint/crash cycle)
  if (lines_changed_stddev > 500) {
    score -= 10;
  }

  // streak bonus — up to 10 points for consistent daily commits
  // but cap it so we don't reward overwork
  const streakBonus = Math.min(streak_days, 30) / 3;
  score += streakBonus;

  // penalize zero commits (if this function is called with 0 commits, user is inactive)
  if (commits_count === 0) {
    score = 50; // neutral — we can't really score someone with no data
  }

  // clamp to 0-100
  score = Math.max(0, Math.min(100, Math.round(score * 100) / 100));

  return score;
};

// determine risk flag based on score
const getRiskFlag = (score) => {
  if (score >= 70) return 'none';
  if (score >= 40) return 'caution';
  return 'high';
};

// calculate and store wellness score for a specific date
const calculateDailyWellness = async (userId, date = new Date()) => {
  const dateStr = date.toISOString().split('T')[0];

  // get commits for the last 7 days (rolling window for the score)
  const sevenDaysAgo = new Date(date);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const commitsResult = await db.query(`
    SELECT
      hour_of_day,
      day_of_week,
      is_weekend,
      message_length,
      lines_added,
      lines_removed,
      committed_at
    FROM commit_snapshots
    WHERE user_id = $1
      AND committed_at >= $2
      AND committed_at <= $3
    ORDER BY committed_at
  `, [userId, sevenDaysAgo.toISOString(), date.toISOString()]);

  const commits = commitsResult.rows;

  if (commits.length === 0) {
    // no commits in the window — store a neutral score
    const score = 50;
    await upsertWellnessScore(userId, dateStr, score, 'none', {
      night_commit_pct: 0,
      weekend_commit_pct: 0,
      avg_commit_hour: 0,
      avg_message_length: 0,
      commits_count: 0,
      lines_changed: 0,
      streak_days: 0,
    });
    return { score, risk_flag: 'none' };
  }

  // calculate features
  const nightCommits = commits.filter(c => c.hour_of_day >= 0 && c.hour_of_day < 5).length;
  const weekendCommits = commits.filter(c => c.is_weekend).length;
  const totalHours = commits.reduce((sum, c) => sum + c.hour_of_day, 0);
  const totalMsgLen = commits.reduce((sum, c) => sum + (c.message_length || 0), 0);
  const totalLinesChanged = commits.reduce((sum, c) => sum + (c.lines_added || 0) + (c.lines_removed || 0), 0);

  // calculate lines changed std dev
  const linesPerCommit = commits.map(c => (c.lines_added || 0) + (c.lines_removed || 0));
  const avgLines = linesPerCommit.reduce((a, b) => a + b, 0) / linesPerCommit.length;
  const variance = linesPerCommit.reduce((sum, l) => sum + Math.pow(l - avgLines, 2), 0) / linesPerCommit.length;
  const stddev = Math.sqrt(variance);

  // calculate streak
  const streakDays = await calculateStreak(userId, date);

  const features = {
    avg_commit_hour: totalHours / commits.length,
    night_commit_pct: nightCommits / commits.length,
    weekend_commit_pct: weekendCommits / commits.length,
    avg_message_length: totalMsgLen / commits.length,
    commits_count: commits.length,
    lines_changed_stddev: stddev,
    streak_days: streakDays,
  };

  const score = computeWellnessScore(features);
  const risk_flag = getRiskFlag(score);

  await upsertWellnessScore(userId, dateStr, score, risk_flag, {
    ...features,
    lines_changed: totalLinesChanged,
  });

  return { score, risk_flag, features };
};

// calculate current streak (consecutive days with at least 1 commit)
const calculateStreak = async (userId, endDate = new Date()) => {
  const result = await db.query(`
    SELECT DISTINCT DATE(committed_at) as commit_date
    FROM commit_snapshots
    WHERE user_id = $1
      AND committed_at <= $2
    ORDER BY commit_date DESC
    LIMIT 365
  `, [userId, endDate.toISOString()]);

  if (result.rows.length === 0) return 0;

  let streak = 0;
  let currentDate = new Date(endDate);
  currentDate.setHours(0, 0, 0, 0);

  const commitDates = new Set(result.rows.map(r => r.commit_date.toISOString().split('T')[0]));

  // check today first
  const todayStr = currentDate.toISOString().split('T')[0];
  if (!commitDates.has(todayStr)) {
    // check yesterday — streak might still be active
    currentDate.setDate(currentDate.getDate() - 1);
    const yesterdayStr = currentDate.toISOString().split('T')[0];
    if (!commitDates.has(yesterdayStr)) {
      return 0;
    }
  }

  // count consecutive days backwards
  while (commitDates.has(currentDate.toISOString().split('T')[0])) {
    streak++;
    currentDate.setDate(currentDate.getDate() - 1);
    if (streak > 365) break; // safety
  }

  return streak;
};

// upsert wellness score into the database
const upsertWellnessScore = async (userId, dateStr, score, riskFlag, features) => {
  await db.query(`
    INSERT INTO wellness_scores (
      user_id, score_date, score, risk_flag,
      night_commit_pct, weekend_commit_pct, avg_commit_hour,
      avg_message_length, commits_count, lines_changed, streak_days, features_json
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    ON CONFLICT (user_id, score_date) DO UPDATE SET
      score = EXCLUDED.score,
      risk_flag = EXCLUDED.risk_flag,
      night_commit_pct = EXCLUDED.night_commit_pct,
      weekend_commit_pct = EXCLUDED.weekend_commit_pct,
      avg_commit_hour = EXCLUDED.avg_commit_hour,
      avg_message_length = EXCLUDED.avg_message_length,
      commits_count = EXCLUDED.commits_count,
      lines_changed = EXCLUDED.lines_changed,
      streak_days = EXCLUDED.streak_days,
      features_json = EXCLUDED.features_json
  `, [
    userId, dateStr, score, riskFlag,
    features.night_commit_pct,
    features.weekend_commit_pct,
    features.avg_commit_hour,
    features.avg_message_length,
    features.commits_count,
    features.lines_changed || 0,
    features.streak_days || 0,
    JSON.stringify(features),
  ]);
};

// get wellness history for charts
const getWellnessHistory = async (userId, days = 90) => {
  const result = await db.query(`
    SELECT score_date, score, risk_flag, night_commit_pct, weekend_commit_pct,
           commits_count, streak_days
    FROM wellness_scores
    WHERE user_id = $1
      AND score_date >= date('now', '-' || $2 || ' days')
    ORDER BY score_date ASC
  `, [userId, days]);

  return result.rows;
};

module.exports = {
  computeWellnessScore,
  getRiskFlag,
  calculateDailyWellness,
  calculateStreak,
  getWellnessHistory,
};
