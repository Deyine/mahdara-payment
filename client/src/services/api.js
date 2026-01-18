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

  // Sale management
  sell: (carId, salePrice, saleDate = null) => {
    const data = { sale_price: salePrice };
    if (saleDate) {
      data.sale_date = saleDate;
    }
    return api.post(`/cars/${carId}/sell`, data);
  },
  unsell: (carId) => api.post(`/cars/${carId}/unsell`),

  // Rental management
  rent: (id) => api.post(`/cars/${id}/rent`),
  returnRental: (id, data = {}) => api.post(`/cars/${id}/return_rental`, data),

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

// Payment Methods
export const paymentMethodsAPI = {
  getAll: () => api.get('/payment_methods'),
  getActive: () => api.get('/payment_methods/active'),
  getOne: (id) => api.get(`/payment_methods/${id}`),
  create: (data) => api.post('/payment_methods', { payment_method: data }),
  update: (id, data) => api.put(`/payment_methods/${id}`, { payment_method: data }),
  delete: (id) => api.delete(`/payment_methods/${id}`),
};

// Users (tenant members)
export const usersAPI = {
  getAll: () => api.get('/users'),
  getManagers: () => api.get('/users/managers'),
  getProfits: () => api.get('/users/profits'),
  getOne: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', { user: data }),
  update: (id, data) => api.put(`/users/${id}`, { user: data }),
  delete: (id) => api.delete(`/users/${id}`),
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

// Payments
export const paymentsAPI = {
  getAll: (carId = null) => {
    const params = carId ? `?car_id=${carId}` : '';
    return api.get(`/payments${params}`);
  },
  getOne: (id) => api.get(`/payments/${id}`),
  create: (data) => api.post('/payments', { payment: data }),
  update: (id, data) => api.put(`/payments/${id}`, { payment: data }),
  delete: (id) => api.delete(`/payments/${id}`),
};

// Rental Transactions
export const rentalTransactionsAPI = {
  getAll: (carId = null, status = null) => {
    let url = '/rental_transactions';
    const params = new URLSearchParams();
    if (carId) params.append('car_id', carId);
    if (status) params.append('status', status);
    if (params.toString()) url += `?${params.toString()}`;
    return api.get(url);
  },
  getOne: (id) => api.get(`/rental_transactions/${id}`),
  create: (data) => api.post('/rental_transactions', { rental_transaction: data }),
  update: (id, data) => api.put(`/rental_transactions/${id}`, { rental_transaction: data }),
  delete: (id) => api.delete(`/rental_transactions/${id}`),
};

// Tags
export const tagsAPI = {
  getAll: () => api.get('/tags'),
  getOne: (id) => api.get(`/tags/${id}`),
  create: (data) => api.post('/tags', { tag: data }),
  update: (id, data) => api.put(`/tags/${id}`, { tag: data }),
  delete: (id) => api.delete(`/tags/${id}`),
};

export default api;
