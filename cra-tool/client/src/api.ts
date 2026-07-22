import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// When the token is stale/expired the server returns 401. Rather than leave the
// user staring at a raw "Invalid or expired token" error on an empty page, clear
// the dead session and bounce them cleanly to the login screen. The login and
// signup calls are excluded so a genuine "wrong credentials" 401 still surfaces
// on the form instead of triggering a redirect loop.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status  = error.response?.status;
    const url      = error.config?.url || '';
    const isAuthCall = url.includes('/auth/login') || url.includes('/auth/register');
    const onAuthPage = ['/login', '/signup'].includes(window.location.pathname);

    if (status === 401 && !isAuthCall && !onAuthPage) {
      ['token', 'email', 'name', 'orgName'].forEach((k) => localStorage.removeItem(k));
      window.location.assign('/login');
    }
    return Promise.reject(error);
  }
);

export default api;
