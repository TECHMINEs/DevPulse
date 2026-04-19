const axios = require('axios');
const logger = require('../utils/logger');

// In-Memory cache for GitHub API responses since we eliminated Redis
const memoryCache = new Map();

const CACHE_TTL = 900; // 15 minutes in seconds

// Helper to set cache with expiration
const setCache = (key, value, ttlSeconds) => {
  const expiresAt = Date.now() + (ttlSeconds * 1000);
  memoryCache.set(key, { value, expiresAt });
};

// Helper to get from cache
const getCache = (key) => {
  const item = memoryCache.get(key);
  if (!item) return null;
  if (Date.now() > item.expiresAt) {
    memoryCache.delete(key);
    return null;
  }
  return item.value;
};
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
  const cached = getCache(cacheKey);
  if (cached) {
    logger.debug('Cache hit', { key: cacheKey });
    return cached;
  }

  // cache miss — make the request
  const data = await requestFn();
  setCache(cacheKey, data, CACHE_TTL);

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
  const prefix = `gh:*:${accessToken.substring(0, 8)}`;
  let cleared = 0;
  for (const key of memoryCache.keys()) {
    if (key.includes(prefix)) {
      memoryCache.delete(key);
      cleared++;
    }
  }
  if (cleared > 0) {
    logger.info('Cleared GitHub cache', { keysCleared: cleared });
  }
};

module.exports = {
  fetchUserRepos,
  fetchRepoCommits,
  fetchCommitDetails,
  fetchUserProfile,
  clearUserCache
};
