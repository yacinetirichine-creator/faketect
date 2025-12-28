import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use((config) => {
  const auth = localStorage.getItem('faketect-auth');
  if (auth) {
    const { state } = JSON.parse(auth);
    if (state?.token) config.headers.Authorization = `Bearer ${state.token}`;
  }
  return config;
});

api.interceptors.response.use((r) => r, (e) => {
  if (e.response?.status === 401) {
    localStorage.removeItem('faketect-auth');
    window.location.href = '/login';
  }
  return Promise.reject(e);
});

export const analysisApi = {
  analyzeFile: (file) => {
    const fd = new FormData();
    fd.append('file', file);
    return api.post('/analysis/file', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  getHistory: (params) => api.get('/analysis/history', { params }),
  delete: (id) => api.delete(`/analysis/${id}`)
};

export const userApi = {
  getDashboard: () => api.get('/user/dashboard')
};

export const adminApi = {
  getMetrics: () => api.get('/admin/metrics'),
  getUsers: (params) => api.get('/admin/users', { params }),
  getAnalyses: (params) => api.get('/admin/analyses', { params }),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`)
};

export const plansApi = {
  getPlans: () => api.get('/plans')
};

export const stripeApi = {
  createCheckout: (planId, billing, locale) => api.post('/stripe/create-checkout', { planId, billing, locale }),
  getCustomerPortal: () => api.post('/stripe/customer-portal')
};

export default api;
