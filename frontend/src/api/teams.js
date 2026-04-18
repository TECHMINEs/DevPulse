import client from './client';

export const createTeam = (data) => client.post('/api/teams', data).then(r => r.data);
export const getTeam = (slug) => client.get(`/api/teams/${slug}`).then(r => r.data);
export const joinTeam = (slug) => client.post(`/api/teams/${slug}/join`).then(r => r.data);
export const leaveTeam = (slug) => client.delete(`/api/teams/${slug}/leave`).then(r => r.data);
export const getLeaderboard = (slug) => client.get(`/api/teams/${slug}/leaderboard`).then(r => r.data);
export const getTeamInsights = (slug) => client.get(`/api/teams/${slug}/insights`).then(r => r.data);
export const generateInvite = (slug) => client.post(`/api/teams/${slug}/invite`).then(r => r.data);
