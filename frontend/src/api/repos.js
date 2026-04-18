import client from './client';

export const getRepos = () => client.get('/api/repos').then(r => r.data);
export const getTopRepos = () => client.get('/api/repos/top').then(r => r.data);
export const getRepoDetail = (id) => client.get(`/api/repos/${id}`).then(r => r.data);
