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
  createEmployee: (data) => api.post('/api/employees', data),
  getEmployees: () => api.get('/admin/employees'),
  deleteEmployee: (id) => api.delete(`/admin/employees/${id}`),

  createClient: (data) => api.post('/api/clients', data),
  getClients: () => api.get('/admin/clients'),
  updateClient: (id, data) => api.put(`/admin/clients/${id}`, data),
  deleteClient: (id) => api.delete(`/admin/clients/${id}`),

  getAllTasks: () => api.get('/api/tasks'),
  createTask: (data) => api.post('/api/tasks', data),
  updateTask: (id, data) => api.put(`/api/tasks/${id}`, data),
  deleteTask: (id) => api.delete(`/api/tasks/${id}`),
  updateTaskStatus: (taskId, status, lat, lon) => {
    return api.put(`/api/tasks/${taskId}/status`, null, {
      params: {
        status,
        lat: lat !== undefined ? lat : null,
        lon: lon !== undefined ? lon : null
      }
    });
  },
  getTaskSummary: () => api.get('/api/tasks/admin/task-summary'),
  getEmployeeStats: () => api.get('/api/admin/employee-stats'),
};

// Attendance API
export const attendanceApi = {
  clockIn: (lat, lon) => api.post('/attendance/clock-in', { latitude: lat, longitude: lon }),
  clockOut: () => api.post('/attendance/clock-out'),
  getHistory: () => api.get('/attendance/me'),
  getAllHistory: () => api.get('/attendance/all'),
  getActiveLocations: () => api.get('/api/location/all'),
  getEmployeeHistory: (id) => api.get(`/api/employee/history/${id}`),
};

// Employee API (Backwards Compatibility)
export const employeeApi = {
  getMyTasks: () => api.get('/api/tasks/me'), // Use /me for security filters
  startTask: (taskId) => api.put(`/api/tasks/${taskId}/status?status=IN_PROGRESS`),
  completeTask: (taskId) => api.put(`/api/tasks/${taskId}/status?status=COMPLETED`),
  updateTaskStatus: (taskId, status, lat, lon) => {
    return api.put(`/api/tasks/${taskId}/status`, null, {
      params: {
        status,
        lat: lat !== undefined ? lat : null,
        lon: lon !== undefined ? lon : null
      }
    });
  },
  clockIn: (userId, lat, lon) => attendanceApi.clockIn(lat, lon),
  clockOut: (userId) => attendanceApi.clockOut(),
  updateLocation: (lat, lon, clientId) => {
    let url = `/api/employee/location/update?lat=${lat}&lon=${lon}`;
    if (clientId) url += `&clientId=${clientId}`;
    return api.post(url);
  }
};

// Client API
export const clientApi = {
  getMyTasks: () => api.get('/api/tasks/client/me'),
  updateTaskStatus: (taskId, status) => api.put(`/api/tasks/${taskId}/status?status=${status}`),
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
