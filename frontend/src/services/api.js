import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add a request interceptor to include the JWT token
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

// Admin API
export const adminApi = {
  createEmployee: (data) => api.post('/admin/create-employee', data),
  getEmployees: () => api.get('/admin/employees'),
  deleteEmployee: (id) => api.delete(`/admin/employees/${id}`),
  
  createClient: (data) => api.post('/admin/create-client', data),
  getClients: () => api.get('/admin/clients'),
  deleteClient: (id) => api.delete(`/admin/clients/${id}`),

  createTask: (data) => api.post('/api/tasks', data),
  getAllTasks: () => api.get('/api/tasks'),
  deleteTask: (id) => api.delete(`/api/tasks/${id}`),
};

// Attendance API
export const attendanceApi = {
  clockIn: (lat, lon) => api.post('/attendance/clock-in', { latitude: lat, longitude: lon }),
  clockOut: () => api.post('/attendance/clock-out'),
  getHistory: () => api.get('/attendance/me'),
};

// Employee API (Backwards Compatibility)
export const employeeApi = {
  getMyTasks: () => api.get('/api/tasks/me'), // Use /me for security filters
  startTask: (taskId) => api.put(`/api/tasks/${taskId}/status?status=IN_PROGRESS`),
  completeTask: (taskId) => api.put(`/api/tasks/${taskId}/status?status=COMPLETED`),
  clockIn: (userId, lat, lon) => attendanceApi.clockIn(lat, lon),
  clockOut: (userId) => attendanceApi.clockOut(),
  updateLocation: (userId, lat, lon) => api.post('/api/employee/location/update', { latitude: lat, longitude: lon })
};

// Client API (Backwards Compatibility)
export const clientApi = {
  getClientTasks: (clientId) => api.get(`/api/tasks/client/${clientId}`)
};

// Auth API
export const authApi = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return api.post('/auth/logout');
  }
};

export default api;
