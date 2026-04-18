const axios = require('axios');
const Redis = require('ioredis');
const logger = require('../utils/logger');

// Redis for caching GitHub API responses
// GitHub API rate limit is 5000 req/hour per token, caching in Redis solves this
let redis = null;
try {
  if (process.env.REDIS_URL) {
    redis = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        if (times > 3) return null;
        return Math.min(times * 200, 2000);
      },
    });
    redis.on('error', (err) => {
      logger.warn('Redis connection error — caching disabled', { error: err.message });
    });
    redis.on('connect', () => {
      logger.info('Redis connected for GitHub API caching');
    });
  }
} catch (err) {
  logger.warn('Redis not available, proceeding without cache', { error: err.message });
}

const CACHE_TTL = 900; // 15 minutes in seconds
const GITHUB_API_BASE = 'https://api.github.com';

// helper to build axios instance with auth
const createGithubClient = (accessToken) => {
  return axios.create({
    baseURL: GITHUB_API_BASE,
    headers: {
      Authorization: `bearer ${accessToken}`,
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'DevPulse/1.0',
    },
    timeout: 15000,
  });
};

// cache wrapper — try cache first, fall back to API
const cachedRequest = async (cacheKey, requestFn) => {
  // try cache first
  if (redis) {
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        logger.debug('Cache hit', { key: cacheKey });
        return JSON.parse(cached);
      }
    } catch (err) {
      logger.warn('Redis get error', { error: err.message });
    }
  }

  // cache miss — make the request
  const data = await requestFn();

  // store in cache
  if (redis) {
    try {
      await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(data));
    } catch (err) {
      logger.warn('Redis set error', { error: err.message });
    }
  }

  return data;
};

// fetch all repos for a user (handles pagination)
// this was trickier than expected — GitHub paginates at 100 items
const fetchUserRepos = async (accessToken) => {
  const client = createGithubClient(accessToken);
  const cacheKey = `gh:repos:${accessToken.substring(0, 8)}`;

  return cachedRequest(cacheKey, async () => {
    let allRepos = [];
    let page = 1;
    const perPage = 100;

    while (true) {
      const response = await client.get('/user/repos', {
        params: {
          page,
          per_page: perPage,
          sort: 'pushed',
          direction: 'desc',
          type: 'all', // includes private repos if user granted access
        },
      });

      allRepos = allRepos.concat(response.data);

      // check if there are more pages
      if (response.data.length < perPage) break;
      page++;

      // safety limit — most users have < 50 repos
      // TODO: add pagination here, works for now since most users have < 50 repos
      if (page > 10) {
        logger.warn('Repo fetch hit safety limit of 1000 repos');
        break;
      }
    }

    return allRepos.map(repo => ({
      id: repo.id.toString(),
      name: repo.name,
      full_name: repo.full_name,
      description: repo.description,
      language: repo.language,
      is_private: repo.private,
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      created_at: repo.created_at,
      pushed_at: repo.pushed_at,
      default_branch: repo.default_branch,
    }));
  });
};

// fetch commits for a specific repo (last 90 days by default)
const fetchRepoCommits = async (accessToken, owner, repo, since = null) => {
  const client = createGithubClient(accessToken);
  const sinceDate = since || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
  const cacheKey = `gh:commits:${accessToken.substring(0, 8)}:${owner}/${repo}:${sinceDate.substring(0, 10)}`;

  return cachedRequest(cacheKey, async () => {
    let allCommits = [];
    let page = 1;

    while (true) {
      try {
        const response = await client.get(`/repos/${owner}/${repo}/commits`, {
          params: {
            page,
            per_page: 100,
            since: sinceDate,
          },
        });

        const commits = response.data.map(commit => ({
          sha: commit.sha,
          message: commit.commit.message,
          date: commit.commit.author.date || commit.commit.committer.date,
          author: commit.commit.author.name,
          is_merge: commit.parents && commit.parents.length > 1,
        }));

        allCommits = allCommits.concat(commits);

        if (response.data.length < 100) break;
        page++;
        if (page > 20) break; // safety limit
      } catch (error) {
        // some repos might be empty or have restricted access
        if (error.response && error.response.status === 409) {
          logger.debug('Empty repo, skipping', { repo: `${owner}/${repo}` });
          break;
        }
        throw error;
      }
    }

    return allCommits;
  });
};

// fetch commit details (additions/deletions/files) for a specific commit
// this is a separate API call per commit, which is why we need caching badly
const fetchCommitDetails = async (accessToken, owner, repo, sha) => {
  const client = createGithubClient(accessToken);
  const cacheKey = `gh:commit-detail:${owner}/${repo}:${sha}`;

  return cachedRequest(cacheKey, async () => {
    try {
      const response = await client.get(`/repos/${owner}/${repo}/commits/${sha}`);
      return {
        sha: response.data.sha,
        stats: response.data.stats || { additions: 0, deletions: 0, total: 0 },
        files: (response.data.files || []).length,
      };
    } catch (error) {
      // not 100% sure this is the best fallback but it prevents crashes
      logger.warn('Failed to fetch commit details', { sha, error: error.message });
      return { sha, stats: { additions: 0, deletions: 0, total: 0 }, files: 0 };
    }
  });
};

// fetch user's GitHub profile info
const fetchUserProfile = async (accessToken) => {
  const client = createGithubClient(accessToken);
  const cacheKey = `gh:profile:${accessToken.substring(0, 8)}`;

  return cachedRequest(cacheKey, async () => {
    const response = await client.get('/user');
    return response.data;
  });
};

// clear all cache for a user (used when force-syncing)
const clearUserCache = async (accessToken) => {
  if (!redis) return;
  try {
    const prefix = `gh:*:${accessToken.substring(0, 8)}*`;
    const keys = await redis.keys(prefix);
    if (keys.length > 0) {
      await redis.del(...keys);
      logger.info('Cleared GitHub cache', { keysCleared: keys.length });
    }
  } catch (err) {
    logger.warn('Failed to clear cache', { error: err.message });
  }
};

module.exports = {
  fetchUserRepos,
  fetchRepoCommits,
  fetchCommitDetails,
  fetchUserProfile,
  clearUserCache,
  redis,
};
