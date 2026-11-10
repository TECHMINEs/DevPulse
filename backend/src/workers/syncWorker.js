const { syncQueue } = require('../queues/syncQueue');
const githubService = require('../services/githubService');
const wellnessService = require('../services/wellnessService');
const achievementService = require('../services/achievementService');
const db = require('../db/pool');
const logger = require('../utils/logger');
const { getIO } = require('../socket/socketHandlers');

// Register the sync worker
syncQueue.process('sync-github', async (job) => {
  const { userId } = job.data;

  // SEC-05: fetch access token from DB instead of reading from job data
  const tokenResult = await db.query(
    'SELECT access_token FROM users WHERE id = $1',
    [userId]
  );
  const accessToken = tokenResult.rows[0]?.access_token;
  if (!accessToken) {
    throw new Error('No access token found for user. Please re-authenticate.');
  }

  let reposSynced = 0;
  let commitsSynced = 0;

  // create sync job record
  const syncJobResult = await db.query(`
    INSERT INTO sync_jobs (user_id, status, started_at)
    VALUES ($1, 'active', CURRENT_TIMESTAMP)
    RETURNING id
  `, [userId]);
  const syncJobId = syncJobResult.rows[0].id;

  try {
    logger.info('Starting GitHub sync', { userId, jobId: job.id });

    // emit start event
    emitProgress(job, { status: 'starting', message: 'Fetching repositories...', userId });

    // 1. Fetch all repos
    const repos = await githubService.fetchUserRepos(accessToken);
    logger.info(`Found ${repos.length} repositories`, { userId });

    emitProgress(job, {
      status: 'fetching_repos',
      totalRepos: repos.length,
      message: `Found ${repos.length} repositories`,
      userId,
    });

    // 2. Upsert repos and fetch commits for each
    for (let i = 0; i < repos.length; i++) {
      const repo = repos[i];

      try {
        emitProgress(job, {
          status: 'syncing_repo',
          currentRepo: repo.name,
          reposScanned: i + 1,
          totalRepos: repos.length,
          commitsFound: commitsSynced,
          message: `Syncing ${repo.name}...`,
          userId,
        });

        // upsert repository
        const repoResult = await db.query(`
          INSERT INTO repositories (user_id, repo_external_id, name, full_name, description, language, is_private, stars, forks, last_commit_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          ON CONFLICT (user_id, repo_external_id) DO UPDATE SET
            name = EXCLUDED.name,
            full_name = EXCLUDED.full_name,
            description = EXCLUDED.description,
            language = EXCLUDED.language,
            is_private = EXCLUDED.is_private,
            stars = EXCLUDED.stars,
            forks = EXCLUDED.forks,
            last_commit_at = EXCLUDED.last_commit_at
          RETURNING id
        `, [
          userId, repo.id, repo.name, repo.full_name, repo.description,
          repo.language, repo.is_private, repo.stars, repo.forks, repo.pushed_at,
        ]);

        const repoId = repoResult.rows[0].id;

        // fetch commits for this repo (last 90 days)
        const [owner, repoName] = repo.full_name.split('/');
        const commits = await githubService.fetchRepoCommits(accessToken, owner, repoName);

        // CRIT-15: batch commit detail fetches (5 at a time) instead of sequential awaits
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const recentCommits = commits.filter(c => new Date(c.date) > thirtyDaysAgo);
        const olderCommits = commits.filter(c => new Date(c.date) <= thirtyDaysAgo);

        // process older commits without fetching details (saves API calls)
        const processCommit = async (commit, lines_added = 0, lines_removed = 0, files_changed = 0) => {
          const date = new Date(commit.date);
          const hourOfDay = date.getHours();
          const dayOfWeek = date.getDay();
          const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

          await db.query(`
            INSERT INTO commit_snapshots (
              user_id, repo_id, commit_sha, message, message_length,
              committed_at, hour_of_day, day_of_week, is_weekend,
              lines_added, lines_removed, files_changed, is_merge_commit
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            ON CONFLICT (user_id, commit_sha) DO NOTHING
          `, [
            userId, repoId, commit.sha, commit.message,
            commit.message ? commit.message.length : 0,
            commit.date, hourOfDay, dayOfWeek, isWeekend ? 1 : 0,
            lines_added, lines_removed, files_changed,
            commit.is_merge ? 1 : 0,
          ]);
          commitsSynced++;
        };

        // batch-fetch details for recent commits (5 parallel)
        const BATCH_SIZE = 5;
        for (let b = 0; b < recentCommits.length; b += BATCH_SIZE) {
          const batch = recentCommits.slice(b, b + BATCH_SIZE);
          const results = await Promise.allSettled(
            batch.map(async (commit) => {
              let details = { stats: { additions: 0, deletions: 0 }, files: 0 };
              try {
                details = await githubService.fetchCommitDetails(accessToken, owner, repoName, commit.sha);
              } catch (e) {
                logger.debug('fetchCommitDetails failed', { sha: commit.sha, error: e.message });
              }
              await processCommit(commit, details.stats.additions, details.stats.deletions, details.files);
            })
          );
          results.forEach((r, idx) => {
            if (r.status === 'rejected') {
              logger.warn('Batch commit processing failed', { sha: batch[idx]?.sha, error: r.reason?.message });
            }
          });
          // brief pause between batches
          if (b + BATCH_SIZE < recentCommits.length) await sleep(150);
        }

        // process older commits without detail fetching
        for (const commit of olderCommits) {
          try {
            await processCommit(commit);
          } catch (e) {
            logger.warn('Failed to store old commit', { sha: commit.sha, error: e.message });
          }
        }

        reposSynced++;

        // update progress after each repo
        if (typeof job.progress === 'function') {
          job.progress(Math.round((i + 1) / repos.length * 100));
        }
      } catch (repoError) {
        // skip problematic repos but continue with others
        logger.warn('Failed to sync repo', {
          repo: repo.name,
          error: repoError.message,
        });
      }

      // small delay between repos to be nice to GitHub API
      await sleep(200);
    }

    // 3. Calculate wellness scores for the last 7 days
    logger.info('Calculating wellness scores...', { userId });
    emitProgress(job, { status: 'calculating', message: 'Calculating wellness scores...', userId });

    const today = new Date();
    let latestScore = null;
    for (let d = 6; d >= 0; d--) {
      const date = new Date(today);
      date.setDate(date.getDate() - d);
      const result = await wellnessService.calculateDailyWellness(userId, date);
      if (d === 0) latestScore = result;
    }

    // 4. Check achievements
    logger.info('Checking achievements...', { userId });
    const newAchievements = await achievementService.checkAndAwardAchievements(userId);

    // 5. Update user's last_synced_at
    await db.query('UPDATE users SET last_synced_at = CURRENT_TIMESTAMP WHERE id = $1', [userId]);

    // 6. Update sync job record
    await db.query(`
      UPDATE sync_jobs SET status = 'completed', completed_at = CURRENT_TIMESTAMP,
        repos_synced = $2, commits_synced = $3
      WHERE id = $1
    `, [syncJobId, reposSynced, commitsSynced]);

    // 7. Emit completion event
    const result = {
      reposSynced,
      commitsSynced,
      newScore: latestScore,
      newAchievements,
    };

    emitProgress(job, {
      status: 'complete',
      ...result,
      message: `Synced ${reposSynced} repos and ${commitsSynced} commits`,
      userId,
    });

    logger.info('GitHub sync completed', { userId, reposSynced, commitsSynced });
    return result;
  } catch (error) {
    // update sync job record with error
    await db.query(`
      UPDATE sync_jobs SET status = 'failed', completed_at = CURRENT_TIMESTAMP,
        error_message = $2, repos_synced = $3, commits_synced = $4
      WHERE id = $1
    `, [syncJobId, error.message, reposSynced, commitsSynced]);

    logger.error('GitHub sync failed', { userId, error: error.message });
    throw error;
  }
});

// emit progress to Socket.io room for the user
function emitProgress(job, data) {
  try {
    const io = getIO();
    if (io) {
      io.to(`user:${data.userId || job.data.userId}`).emit('sync_progress', data);
    }
  } catch (err) {
    logger.debug('Socket emit failed (non-critical)', { error: err.message });
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = { syncQueue };
