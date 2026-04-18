// GitLab API wrapper — beta quality, not as polished as the GitHub one
// TODO: add proper pagination and error handling like githubService.js
const axios = require('axios');
const logger = require('../utils/logger');

const GITLAB_API_BASE = 'https://gitlab.com/api/v4';

const createGitlabClient = (accessToken) => {
  return axios.create({
    baseURL: GITLAB_API_BASE,
    headers: {
      'PRIVATE-TOKEN': accessToken,
      'Content-Type': 'application/json',
    },
    timeout: 15000,
  });
};

const fetchUserRepos = async (accessToken) => {
  const client = createGitlabClient(accessToken);
  try {
    const response = await client.get('/projects', {
      params: {
        membership: true,
        per_page: 100,
        order_by: 'last_activity_at',
        sort: 'desc',
      },
    });

    return response.data.map(repo => ({
      id: repo.id.toString(),
      name: repo.name,
      full_name: repo.path_with_namespace,
      description: repo.description,
      language: null, // GitLab doesn't return this easily
      is_private: repo.visibility === 'private',
      stars: repo.star_count,
      forks: repo.forks_count,
      created_at: repo.created_at,
      pushed_at: repo.last_activity_at,
    }));
  } catch (error) {
    logger.error('GitLab API error', { error: error.message });
    throw error;
  }
};

const fetchRepoCommits = async (accessToken, projectId, since = null) => {
  const client = createGitlabClient(accessToken);
  const sinceDate = since || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

  try {
    const response = await client.get(`/projects/${encodeURIComponent(projectId)}/repository/commits`, {
      params: {
        since: sinceDate,
        per_page: 100,
      },
    });

    return response.data.map(commit => ({
      sha: commit.id,
      message: commit.message,
      date: commit.committed_date,
      author: commit.author_name,
      is_merge: commit.parent_ids && commit.parent_ids.length > 1,
    }));
  } catch (error) {
    logger.warn('GitLab commit fetch error', { projectId, error: error.message });
    return [];
  }
};

module.exports = { fetchUserRepos, fetchRepoCommits };
