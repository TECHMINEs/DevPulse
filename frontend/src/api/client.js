import axios from 'axios';
import useStore from '../store/useStore';

const API_URL = import.meta.env.VITE_API_URL || '';

const client = axios.create({
  baseURL: API_URL,
  timeout: 30000,
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

// response interceptor — handle 401s and Safari date bug
client.interceptors.response.use(
  (response) => {
    if (response.data) {
      fixSafariDates(response.data);
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // token expired or invalid — clear auth
      useStore.getState().clearAuth();
      window.dispatchEvent(new CustomEvent('devpulse:unauthorized'));
    }
    return Promise.reject(error);
  }
);

export default client;
