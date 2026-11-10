import client from './client';

export const getDashboardData = () => client.get('/api/analytics/dashboard').then(r => r.data);

export const getWellness = (days = 90) => client.get(`/api/analytics/wellness?days=${days}`).then(r => r.data);
export const getCommits = (days = 365) => client.get(`/api/analytics/commits?days=${days}`).then(r => r.data);
export const getHourly = () => client.get('/api/analytics/hourly').then(r => r.data);
export const getLanguages = () => client.get('/api/analytics/languages').then(r => r.data);
export const getStreak = () => client.get('/api/analytics/streak').then(r => r.data);
export const getVelocity = (weeks = 12) => client.get(`/api/analytics/velocity?weeks=${weeks}`).then(r => r.data);
export const getRadar = () => client.get('/api/analytics/radar').then(r => r.data);
export const getBenchmark = () => client.get('/api/analytics/benchmark').then(r => r.data);
export const getPredictions = () => client.get('/api/analytics/predictions').then(r => r.data);

export const getProfile = () => client.get('/auth/me').then(r => r.data.user);
export const updateProfile = (data) => client.put('/api/user/profile', data).then(r => r.data);
export const updateSettings = (data) => client.put('/api/user/settings', data).then(r => r.data);
export const getPublicProfile = (username) => client.get(`/api/user/${username}/public`).then(r => r.data);

export const triggerSync = () => client.post('/api/sync/trigger').then(r => r.data);
export const getSyncStatus = (jobId) => client.get(`/api/sync/status/${jobId}`).then(r => r.data);
export const getSyncHistory = () => client.get('/api/sync/history').then(r => r.data);

export const getAchievements = () => client.get('/api/achievements').then(r => r.data);
export const getEarnedAchievements = () => client.get('/api/achievements/earned').then(r => r.data);

export const getGoals = () => client.get('/api/goals').then(r => r.data);
export const createGoal = (data) => client.post('/api/goals', data).then(r => r.data);
export const updateGoal = (id, data) => client.put(`/api/goals/${id}`, data).then(r => r.data);
export const deleteGoal = (id) => client.delete(`/api/goals/${id}`).then(r => r.data);
