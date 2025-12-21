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

// Dashboard
export const dashboardAPI = {
  getStatistics: () => api.get('/dashboard/statistics'),
};

// Tenants (Super Admin only)
export const tenantsAPI = {
  getAll: () => api.get('/tenants'),
  getOne: (id) => api.get(`/tenants/${id}`),
  create: (data) => api.post('/tenants', { tenant: data }),
  update: (id, data) => api.put(`/tenants/${id}`, { tenant: data }),
  delete: (id) => api.delete(`/tenants/${id}`),
};

// Cars
export const carsAPI = {
  getAll: (includeDeleted = false, onlyDeleted = false) => {
    let params = '';
    if (includeDeleted) {
      params = '?include_deleted=true';
    } else if (onlyDeleted) {
      params = '?only_deleted=true';
    }
    return api.get(`/cars${params}`);
  },
  getOne: (id) => api.get(`/cars/${id}`),
  create: (data) => api.post('/cars', { car: data }),
  update: (id, data) => api.put(`/cars/${id}`, { car: data }),
  delete: (id) => api.delete(`/cars/${id}`),
  restore: (id) => api.post(`/cars/${id}/restore`),

  // Photo management
  addSalvagePhotos: (carId, files) => {
    const formData = new FormData();
    files.forEach(file => formData.append('photos[]', file));
    return api.post(`/cars/${carId}/salvage_photos`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  deleteSalvagePhoto: (carId, photoId) => api.delete(`/cars/${carId}/salvage_photos/${photoId}`),

  addAfterRepairPhotos: (carId, files) => {
    const formData = new FormData();
    files.forEach(file => formData.append('photos[]', file));
    return api.post(`/cars/${carId}/after_repair_photos`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  deleteAfterRepairPhoto: (carId, photoId) => api.delete(`/cars/${carId}/after_repair_photos/${photoId}`),

  // Invoice management
  addInvoices: (carId, files) => {
    const formData = new FormData();
    files.forEach(file => formData.append('invoices[]', file));
    return api.post(`/cars/${carId}/invoices`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  deleteInvoice: (carId, invoiceId) => api.delete(`/cars/${carId}/invoices/${invoiceId}`),

  // Expense creation (convenience method)
  createExpense: (data) => api.post('/expenses', { expense: data }),
};

// Car Models
export const carModelsAPI = {
  getAll: () => api.get('/car_models'),
  getActive: () => api.get('/car_models/active'),
  getOne: (id) => api.get(`/car_models/${id}`),
  create: (data) => api.post('/car_models', { car_model: data }),
  update: (id, data) => api.put(`/car_models/${id}`, { car_model: data }),
  delete: (id) => api.delete(`/car_models/${id}`),
};

// Expense Categories
export const expenseCategoriesAPI = {
  getAll: () => api.get('/expense_categories'),
  getActive: () => api.get('/expense_categories/active'),
  getOne: (id) => api.get(`/expense_categories/${id}`),
  create: (data) => api.post('/expense_categories', { expense_category: data }),
  update: (id, data) => api.put(`/expense_categories/${id}`, { expense_category: data }),
  delete: (id) => api.delete(`/expense_categories/${id}`),
};

// Sellers
export const sellersAPI = {
  getAll: () => api.get('/sellers'),
  getActive: () => api.get('/sellers/active'),
  getOne: (id) => api.get(`/sellers/${id}`),
  create: (data) => api.post('/sellers', { seller: data }),
  update: (id, data) => api.put(`/sellers/${id}`, { seller: data }),
  delete: (id) => api.delete(`/sellers/${id}`),
};

// Expenses
export const expensesAPI = {
  getAll: (carId = null) => {
    const params = carId ? `?car_id=${carId}` : '';
    return api.get(`/expenses${params}`);
  },
  getOne: (id) => api.get(`/expenses/${id}`),
  create: (data) => api.post('/expenses', { expense: data }),
  update: (id, data) => api.put(`/expenses/${id}`, { expense: data }),
  delete: (id) => api.delete(`/expenses/${id}`),
};

export default api;
