import axios from 'axios';
const baseURL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000').replace(/\/+$/, '').replace(/\/api$/, '') + '/api';
const api = axios.create({baseURL, timeout:15000});
export default api;
export const authApi = {
  register: data => api.post('/auth/register',data),
  login: data => api.post('/auth/login',data),
  getCurrentUser: token => api.get('/auth/me',{headers:{Authorization:`Bearer ${token}`}})
};
