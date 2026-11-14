import axios from 'axios';
import useStore from '../store/useStore';
import { demoMock } from '../data/demoMock';

const isStaticDemo = typeof window !== 'undefined' && (
  window.location.hostname.includes('github.io') ||
  window.location.pathname.startsWith('/DevPulse') ||
  import.meta.env.VITE_DEMO_MODE === 'true'
);

const API_URL = import.meta.env.VITE_API_URL || '';

const client = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  withCredentials: true,
});

const fixSafariDates = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj;
  for (const key in obj) {
    if (typeof obj[key] === 'string' && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(\.\d+)?$/.test(obj[key])) {
      obj[key] = obj[key].replace(' ', 'T') + 'Z';
    } else if (typeof obj[key] === 'object') {
      fixSafariDates(obj[key]);
    }
  }
  return obj;
};

function resolveDemo(url) {
  const clean = (url || '').replace(/^\/+/, '');
  if (clean.startsWith('auth/me') || clean.startsWith('api/user/profile')) {
    return { user: demoMock.user, token: 'demo-session-token' };
  }
  if (clean.startsWith('api/user/onboarding')) {
    try {
      localStorage.setItem('devpulse_onboarded', 'true');
    } catch {}
    return { success: true, onboarding_completed: true };
  }
  if (clean.startsWith('api/admin/verify')) {
    return { verified: true };
  }
  if (clean.startsWith('api/analytics/dashboard')) {
    return demoMock.getDashboardData();
  }
  if (clean.startsWith('api/analytics/wellness')) {
    return demoMock.getWellness();
  }
  if (clean.startsWith('api/analytics/commits')) {
    return demoMock.getCommits();
  }
  if (clean.startsWith('api/analytics/hourly')) {
    return demoMock.getHourly();
  }
  if (clean.startsWith('api/analytics/languages')) {
    return demoMock.getLanguages();
  }
  if (clean.startsWith('api/analytics/streak')) {
    return demoMock.getStreak();
  }
  if (clean.startsWith('api/analytics/velocity')) {
    return demoMock.getVelocity();
  }
  if (clean.startsWith('api/analytics/radar')) {
    return demoMock.getRadar();
  }
  if (clean.startsWith('api/analytics/benchmark')) {
    return demoMock.getBenchmark();
  }
  if (clean.startsWith('api/analytics/predictions')) {
    return demoMock.getPredictions();
  }
  if (clean.startsWith('api/repos/top')) {
    return demoMock.getTopRepos();
  }
  if (clean.startsWith('api/repos/')) {
    const id = clean.split('/')[2];
    return demoMock.getRepoDetail(id);
  }
  if (clean.startsWith('api/repos')) {
    return demoMock.getRepos();
  }
  if (clean.startsWith('api/achievements/earned')) {
    return demoMock.getEarnedAchievements();
  }
  if (clean.startsWith('api/achievements')) {
    return demoMock.getAchievements();
  }
  if (clean.startsWith('api/goals')) {
    return demoMock.getGoals();
  }
  if (clean.startsWith('api/sync/history')) {
    return [];
  }
  return {};
}

// Request interceptor to serve demo data in static mode
client.interceptors.request.use(async (config) => {
  if (isStaticDemo) {
    config.adapter = async () => {
      const demoData = resolveDemo(config.url || '');
      return {
        data: demoData,
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      };
    };
  }
  return config;
});

// Response interceptor
client.interceptors.response.use(
  (response) => {
    if (response.data) {
      fixSafariDates(response.data);
    }
    return response;
  },
  async (error) => {
    if (isStaticDemo || !error.response || error.code === 'ERR_NETWORK') {
      const demoData = resolveDemo(error.config?.url || '');
      return {
        data: demoData,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: error.config,
      };
    }
    if (error.response?.status === 401) {
      useStore.getState().clearAuth();
      window.dispatchEvent(new CustomEvent('devpulse:unauthorized'));
    }
    return Promise.reject(error);
  }
);

export default client;
