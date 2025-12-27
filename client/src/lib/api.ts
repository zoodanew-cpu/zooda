import axios from 'axios';

const API_HOST =
  (import.meta as any)?.env?.VITE_API_BASE ||
  (typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://127.0.0.1:5000'
    : 'https://api.zooda.in');

export const API_BASE_URL = `${API_HOST.replace(/\/$/, '')}/api`;

axios.defaults.baseURL = API_BASE_URL;
axios.defaults.headers.common['Accept'] = 'application/json';

export default axios;
