import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3062/api';

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/admin/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (username, password) => api.post('/auth/login', { username, password }),
};

export const dashboardAPI = {
  getStatistics: () => api.get('/dashboard/statistics'),
};

export const banksAPI = {
  getAll: () => api.get('/banks'),
  create: (data) => api.post('/banks', { bank: data }),
  update: (id, data) => api.patch(`/banks/${id}`, { bank: data }),
  delete: (id) => api.delete(`/banks/${id}`),
};

export const employeeTypesAPI = {
  getAll: () => api.get('/employee_types'),
  create: (data) => api.post('/employee_types', { employee_type: data }),
  update: (id, data) => api.patch(`/employee_types/${id}`, { employee_type: data }),
  delete: (id) => api.delete(`/employee_types/${id}`),
};

export const employeesAPI = {
  getAll: () => api.get('/employees'),
  getById: (id) => api.get(`/employees/${id}`),
  create: (data) => api.post('/employees', { employee: data }),
  update: (id, data) => api.patch(`/employees/${id}`, { employee: data }),
  delete: (id) => api.delete(`/employees/${id}`),
  lookupNni: (nni) => api.get(`/employees/lookup_nni?nni=${nni}`),
};

export const contractsAPI = {
  create: (data) => api.post('/contracts', { contract: data }),
  update: (id, data) => api.patch(`/contracts/${id}`, { contract: data }),
  delete: (id) => api.delete(`/contracts/${id}`),
};

const buildImportFn = (path) => (file) => {
  const fd = new FormData();
  fd.append('file', file);
  return api.post(path, fd);
};

export const wilayasAPI = {
  getAll: () => api.get('/wilayas'),
  create: (data) => api.post('/wilayas', { wilaya: data }),
  update: (id, data) => api.patch(`/wilayas/${id}`, { wilaya: data }),
  delete: (id) => api.delete(`/wilayas/${id}`),
  import: buildImportFn('/wilayas/import'),
};

export const moughataaAPI = {
  getAll: (params) => api.get('/moughataa', { params }),
  create: (data) => api.post('/moughataa', { moughataa: data }),
  update: (id, data) => api.patch(`/moughataa/${id}`, { moughataa: data }),
  delete: (id) => api.delete(`/moughataa/${id}`),
  import: buildImportFn('/moughataa/import'),
};

export const communesAPI = {
  getAll: (params) => api.get('/communes', { params }),
  create: (data) => api.post('/communes', { commune: data }),
  update: (id, data) => api.patch(`/communes/${id}`, { commune: data }),
  delete: (id) => api.delete(`/communes/${id}`),
  import: buildImportFn('/communes/import'),
};

export const villagesAPI = {
  getAll: (params) => api.get('/villages', { params }),
  create: (data) => api.post('/villages', { village: data }),
  update: (id, data) => api.patch(`/villages/${id}`, { village: data }),
  delete: (id) => api.delete(`/villages/${id}`),
  import: buildImportFn('/villages/import'),
};

export const paymentBatchesAPI = {
  getAll: () => api.get('/payment_batches'),
  getById: (id) => api.get(`/payment_batches/${id}`),
  create: (batchData, employees) => api.post('/payment_batches', { payment_batch: batchData, employees }),
  delete: (id) => api.delete(`/payment_batches/${id}`),
};

export const usersAPI = {
  getAll: () => api.get('/users'),
  create: (data) => api.post('/users', { user: data }),
  update: (id, data) => api.patch(`/users/${id}`, { user: data }),
  delete: (id) => api.delete(`/users/${id}`),
};

export default api;
