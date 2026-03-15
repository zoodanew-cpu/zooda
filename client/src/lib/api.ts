import axios from 'axios';

// Use environment variable for API URL, fallback to localhost for development
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://api.zooda.in/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Accept': 'application/json',
  },
  // Include credentials if your API uses cookies
  // withCredentials: true,
});

// Request interceptor: add authorization token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle common errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized (token expired or invalid)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // Optionally attempt to refresh token
      // const refreshToken = localStorage.getItem('refreshToken');
      // if (refreshToken) {
      //   try {
      //     const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
      //     localStorage.setItem('token', data.token);
      //     originalRequest.headers.Authorization = `Bearer ${data.token}`;
      //     return api(originalRequest);
      //   } catch (refreshError) {
      //     // Refresh failed – logout user
      //     localStorage.clear();
      //     window.location.href = '/login';
      //   }
      // }

      // If no refresh token mechanism, just logout
      localStorage.clear();
      window.location.href = '/login';
    }

    // Handle network errors or other statuses as needed
    return Promise.reject(error);
  }
);

export default api;