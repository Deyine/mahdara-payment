import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_URL,
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Authentication
export const authAPI = {
  login: (username, password) => api.post('/auth/login', { username, password }),
};

// Time Tracking API
export const timeTrackingAPI = {
  // Projects
  projects: {
    getAll: (filters = {}) => {
      const params = new URLSearchParams();
      if (filters.includeDeleted) params.append('include_deleted', 'true');
      if (filters.onlyDeleted) params.append('only_deleted', 'true');
      if (filters.status) params.append('status', filters.status);
      const queryString = params.toString();
      return api.get(`/time_tracking/projects${queryString ? `?${queryString}` : ''}`);
    },
    getOne: (id) => api.get(`/time_tracking/projects/${id}`),
    create: (data) => api.post('/time_tracking/projects', { project: data }),
    update: (id, data) => api.put(`/time_tracking/projects/${id}`, { project: data }),
    delete: (id) => api.delete(`/time_tracking/projects/${id}`),
    restore: (id) => api.post(`/time_tracking/projects/${id}/restore`),
  },

  // Tasks
  tasks: {
    getAll: (filters = {}) => {
      const params = new URLSearchParams();
      if (filters.projectId) params.append('project_id', filters.projectId);
      if (filters.status) params.append('status', filters.status);
      if (filters.includeDeleted) params.append('include_deleted', 'true');
      const queryString = params.toString();
      return api.get(`/time_tracking/tasks${queryString ? `?${queryString}` : ''}`);
    },
    getOne: (id) => api.get(`/time_tracking/tasks/${id}`),
    create: (data) => api.post('/time_tracking/tasks', { task: data }),
    update: (id, data) => api.put(`/time_tracking/tasks/${id}`, { task: data }),
    delete: (id) => api.delete(`/time_tracking/tasks/${id}`),
    complete: (id) => api.post(`/time_tracking/tasks/${id}/complete`),
  },

  // Time Entries
  timeEntries: {
    getAll: (filters = {}) => {
      const params = new URLSearchParams();
      if (filters.taskId) params.append('task_id', filters.taskId);
      if (filters.userId) params.append('user_id', filters.userId);
      const queryString = params.toString();
      return api.get(`/time_tracking/time_entries${queryString ? `?${queryString}` : ''}`);
    },
    getOne: (id) => api.get(`/time_tracking/time_entries/${id}`),
    create: (data) => api.post('/time_tracking/time_entries', { time_entry: data }),
    update: (id, data) => api.put(`/time_tracking/time_entries/${id}`, { time_entry: data }),
    delete: (id) => api.delete(`/time_tracking/time_entries/${id}`),
  },
};

export default api;
