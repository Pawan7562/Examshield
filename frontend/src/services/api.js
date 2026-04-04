// src/services/api.js
import axios from 'axios';
import toast from 'react-hot-toast';

// Use direct backend URL for both development and production
const developmentApiBaseURL = 'http://localhost:5000/api';  // Direct URL in development
const productionApiBaseURL = 'http://localhost:5000/api';  // Direct URL in production

const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  (process.env.NODE_ENV === 'development' ? developmentApiBaseURL : productionApiBaseURL);

console.log('API Base URL:', API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // Reduced timeout to 10 seconds
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor - attach token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle token refresh and 401 errors
api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    console.error('=== API ERROR ===');
    console.error('Error config:', error.config);
    console.error('Error message:', error.message);
    console.error('Error response:', error.response);
    console.error('Error request:', error.request);
    
    const original = error.config || {};
    const isAuthRequest = original.url?.includes('/auth/');

    if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') {
      console.error('Network error - Backend may not be running');
      return Promise.reject({
        message: 'Cannot connect to server. Please check if the backend is running.',
        code: error.code,
        isNetworkError: true
      });
    }

    if (error.response?.status === 401) {
      // Login failures are expected sometimes; keep the browser console clean.
      if (isAuthRequest) {
        return Promise.reject(error.response?.data || error);
      }

      console.error('401 Unauthorized - Checking authentication...');

      const refreshToken = localStorage.getItem('refreshToken');

      if (refreshToken && !original._retry) {
        original._retry = true;

        try {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
          const { accessToken, refreshToken: newRefresh } = response.data.data;

          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', newRefresh);
          api.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
          original.headers = original.headers || {};
          original.headers.Authorization = `Bearer ${accessToken}`;

          return api(original);
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/admin/login';
          return Promise.reject(refreshError);
        }
      } else {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/admin/login';
      }
    }

    if (error.response?.status === 403 && error.response.data?.code === 'SUBSCRIPTION_EXPIRED') {
      toast.error('Your subscription has expired. Please renew.');
    }

    if (!error.response) {
      return Promise.reject({
        success: false,
        message: `Unable to reach the backend API at ${API_BASE_URL}. Make sure the backend server is running.`,
      });
    }

    if (typeof error.response.data === 'string') {
      return Promise.reject({
        success: false,
        message: `Request failed with status ${error.response.status}. Check that the backend API is running and reachable at ${API_BASE_URL}.`,
      });
    }

    return Promise.reject(error.response.data || error);
  }
);

// Auth APIs
export const authAPI = {
  superAdminLogin: (data) => api.post('/auth/super-admin/login', data),
  collegeRegister: (data) => api.post('/auth/college/register', data),
  collegeLogin: (data) => api.post('/auth/college/login', data),
  studentLogin: (data) => api.post('/auth/student/login', data),
  getMe: () => api.get('/auth/me'),
};

// Admin APIs
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getStudents: (params) => api.get('/admin/students', { params }),
  addStudent: (data) => api.post('/admin/students', data),
  bulkUpload: (formData) => api.post('/admin/students/bulk', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  updateStudent: (id, data) => api.put(`/admin/students/${id}`, data),
  toggleStudent: (id) => api.patch(`/admin/students/${id}/toggle-status`),
  deleteStudent: (id) => api.delete(`/admin/students/${id}`),

  getExams: (params) => api.get('/admin/exams', { params }),
  createExam: (data) => api.post('/admin/exams', data),
  updateExam: (id, data) => api.put(`/admin/exams/${id}`, data),
  publishExam: (id) => api.post(`/admin/exams/${id}/publish`),
  getExamQuestions: (id) => api.get(`/admin/exams/${id}/questions`),
  addQuestions: (id, data) => api.post(`/admin/exams/${id}/questions`, data),
  deleteQuestion: (examId, questionId) => api.delete(`/admin/exams/${examId}/questions/${questionId}`),
  getMonitoringData: (id) => api.get(`/admin/exams/${id}/monitor`),

  getResults: (params) => api.get('/admin/results', { params }),
  evaluateResult: (id, data) => api.post(`/admin/results/${id}/evaluate`, data),
  publishResults: (examId) => api.post(`/admin/results/exam/${examId}/publish`),

  getNotifications: () => api.get('/admin/notifications'),
};

// Student APIs
export const studentAPI = {
  getProfile: () => api.get('/student/profile'),
  changePassword: (data) => api.post('/student/change-password', data),
  getExams: () => api.get('/student/exams'),
  startExam: (id, data) => api.post(`/student/exams/${id}/start`, data),
  saveAnswer: (examId, data) => api.post(`/student/exams/${examId}/save-answer`, data),
  submitExam: (examId, data) => api.post(`/student/exams/${examId}/submit`, data),
  reportViolation: (data) => api.post('/student/violations', data),
  getResults: () => api.get('/student/results'),
  getExamResult: (examId) => api.get(`/student/results/${examId}`),
  getResultByKey: (examKey) => api.get(`/student/results/by-key/${examKey}`),
  getNotifications: () => api.get('/student/notifications'),
};

// Subscription APIs
export const subscriptionAPI = {
  getPlans: () => api.get('/subscriptions/plans'),
  getCurrent: () => api.get('/subscriptions/current'),
  createOrder: (data) => api.post('/subscriptions/create-order', data),
  verifyPayment: (data) => api.post('/subscriptions/verify', data),
};

// Super Admin APIs
export const superAdminAPI = {
  getDashboard: () => api.get('/super-admin/dashboard'),
  getColleges: (params) => api.get('/super-admin/colleges', { params }),
  toggleCollege: (id) => api.patch(`/super-admin/colleges/${id}/toggle`),
  getAuditLogs: () => api.get('/super-admin/audit-logs'),
};

export default api;
