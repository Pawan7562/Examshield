// src/services/api.js
import axios from 'axios';
import toast from 'react-hot-toast';

// Priority: env var > hardcoded production URL
const developmentApiBaseURL = process.env.REACT_APP_API_URL || 'https://exam.nexifyforge.in/api';
const productionApiBaseURL = process.env.REACT_APP_API_URL || 'https://exam.nexifyforge.in/api';

const API_BASE_URL =
  process.env.NODE_ENV === 'development' ? developmentApiBaseURL : productionApiBaseURL;

console.log('API Base URL:', API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // 60 seconds to accommodate AI generation & cold starts
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

const handleAuthRedirect = () => {
  const currentPath = window.location.pathname;
  if (currentPath.includes('/login') || currentPath.includes('/register') || currentPath === '/') {
    return;
  }
  if (currentPath.startsWith('/super-admin')) {
    window.location.href = '/super-admin/login';
  } else if (currentPath.startsWith('/student')) {
    window.location.href = '/student/login';
  } else {
    window.location.href = '/admin/login';
  }
};

// Response interceptor - handle token refresh and 401 errors
api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const resStatus = error.response?.status;
    const resData = error.response?.data;
    const original = error.config || {};
    const isAuthRequest = original.url?.includes('/auth/');

    // Filter out raw SQL / database stack traces from leaking to client components
    const sanitizeText = (txt, fallback) => {
      if (!txt || typeof txt !== 'string') return fallback;
      const lower = txt.toLowerCase();
      if (
        lower.includes('syntax error') ||
        lower.includes('relation') ||
        lower.includes('column') ||
        lower.includes('table') ||
        lower.includes('database') ||
        lower.includes('violates') ||
        lower.includes('foreign key') ||
        lower.includes('pg_') ||
        lower.includes('psql') ||
        lower.includes('select ') ||
        lower.includes('insert into') ||
        lower.includes('update ') ||
        lower.includes('pool') ||
        lower.includes('deadlock')
      ) {
        return fallback;
      }
      return txt;
    };

    if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') {
      return Promise.reject({
        success: false,
        message: 'The examination system is briefly reconnecting. Your session and exam answers are safely preserved.',
        action: 'Please wait a moment while the connection resumes automatically.',
        code: error.code,
        isNetworkError: true,
      });
    }

    if (error.response?.status === 401) {
      if (isAuthRequest) {
        const rawMsg = resData?.message || error.message;
        return Promise.reject({
          ...resData,
          message: sanitizeText(rawMsg, 'Invalid credentials. Please verify your details and try again.')
        });
      }

      const refreshToken = localStorage.getItem('refreshToken');

      if (refreshToken && !original._retry) {
        original._retry = true;

        try {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
          const tokenData = response.data?.data || response.data;
          const { accessToken, refreshToken: newRefresh } = tokenData || {};

          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', newRefresh);
          api.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
          original.headers = original.headers || {};
          original.headers.Authorization = `Bearer ${accessToken}`;

          return api(original);
        } catch (refreshError) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          handleAuthRedirect();
          return Promise.reject({
            success: false,
            message: 'Your security session has expired. Please sign in again.',
            action: 'Sign in with your credentials to resume.'
          });
        }
      } else {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        handleAuthRedirect();
      }
    }

    if (error.response?.status === 403 && error.response.data?.code === 'SUBSCRIPTION_EXPIRED') {
      toast.error('Your subscription has expired. Please contact support or renew.');
    }

    if (!error.response) {
      return Promise.reject({
        success: false,
        message: 'Network connection temporarily unavailable. Your exam progress is safely cached.',
        action: 'Check your internet connection; the system will auto-sync when online.',
        isNetworkError: true,
      });
    }

    const status = error.response.status;

    // Handle 502 Bad Gateway, 503 Service Unavailable, 504 Gateway Timeout
    if (status === 502 || status === 503 || status === 504) {
      return Promise.reject({
        success: false,
        status,
        code: 'CLUSTER_SYNCHRONIZING',
        message: 'The examination cluster is momentarily synchronizing traffic. Your exam progress is safely preserved.',
        action: 'Please wait a moment; your answers are protected and sync will resume automatically.'
      });
    }

    // Handle 500 Internal Server Error
    if (status === 500) {
      const serverMsg = resData?.message || resData?.error;
      const cleanMsg = sanitizeText(
        serverMsg,
        'An unexpected server issue occurred. Your data is protected; please try again shortly.'
      );
      return Promise.reject({
        success: false,
        status: 500,
        message: cleanMsg,
        action: resData?.action || 'If this continues, please contact your examination administrator.'
      });
    }

    if (typeof resData === 'string') {
      return Promise.reject({
        success: false,
        status,
        message: sanitizeText(resData, 'Service is momentarily synchronizing. Please try again in a moment.'),
        action: 'Please try again.'
      });
    }

    // Sanitize any other error data
    const safeData = typeof resData === 'object' && resData !== null ? { ...resData } : {};
    if (safeData.message) {
      safeData.message = sanitizeText(safeData.message, 'Unable to complete request. Please verify inputs and try again.');
    }
    if (safeData.error && typeof safeData.error === 'string') {
      safeData.error = sanitizeText(safeData.error, 'An unexpected issue occurred.');
    }

    return Promise.reject(safeData || error);
  }
);

// =====================================================
// High-Speed Client-Side In-Memory Cache (20s TTL)
// =====================================================
const apiCache = new Map();
const CACHE_TTL_MS = 20000;

export const clearApiCache = (filter = '') => {
  if (!filter) {
    apiCache.clear();
  } else {
    for (const key of apiCache.keys()) {
      if (key.includes(filter)) apiCache.delete(key);
    }
  }
};

const getTenantCacheScope = () => {
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const u = JSON.parse(userStr);
      return u.id || u.collegeId || 'auth';
    }
  } catch (_) { }
  const token = localStorage.getItem('accessToken');
  return token ? token.slice(-16) : 'anon';
};

// Wrap api.get for instantaneous navigation between pages
const rawGet = api.get.bind(api);
api.get = async (url, config = {}) => {
  if (config.bypassCache) {
    return rawGet(url, config);
  }
  const scope = getTenantCacheScope();
  const cacheKey = `${scope}:${url}?${JSON.stringify(config.params || {})}`;
  const now = Date.now();
  const cached = apiCache.get(cacheKey);

  if (cached && (now - cached.timestamp < (config.ttl || CACHE_TTL_MS))) {
    return cached.data;
  }

  const promise = rawGet(url, config).then((data) => {
    apiCache.set(cacheKey, { timestamp: Date.now(), data });
    return data;
  });

  return promise;
};

// Invalidate cache immediately on mutations (POST, PUT, PATCH, DELETE)
const rawPost = api.post.bind(api);
api.post = async (...args) => {
  clearApiCache();
  return rawPost(...args);
};

const rawPut = api.put.bind(api);
api.put = async (...args) => {
  clearApiCache();
  return rawPut(...args);
};

const rawPatch = api.patch.bind(api);
api.patch = async (...args) => {
  clearApiCache();
  return rawPatch(...args);
};

const rawDelete = api.delete.bind(api);
api.delete = async (...args) => {
  clearApiCache();
  return rawDelete(...args);
};

// Auth APIs
export const authAPI = {
  superAdminLogin: (data) => api.post('/auth/super-admin/login', data),
  collegeRegister: (data) => api.post('/auth/college/register', data),
  checkApplicationStatus: (params) => api.get('/auth/college/application-status', { params }),
  collegeLogin: (data) => api.post('/auth/college/login', data),
  collegeForgotPassword: (data) => api.post('/auth/college/forgot-password', data),
  collegeResetPassword: (data) => api.post('/auth/college/reset-password', data),
  studentLogin: (data) => api.post('/auth/student/login', data),
  getMe: () => api.get('/auth/me'),
};

// Admin APIs
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getStudents: (params) => api.get('/admin/students', { params }),
  addStudent: (data) => api.post('/admin/students', data, { timeout: 30000 }),
  bulkUpload: (formData) => api.post('/admin/students/bulk', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  updateStudent: (id, data) => api.put(`/admin/students/${id}`, data),
  toggleStudent: (id) => api.patch(`/admin/students/${id}/toggle-status`),
  deleteStudent: (id) => api.delete(`/admin/students/${id}`),
  resetStudentPassword: (id, data) => api.post(`/admin/students/${id}/reset-password`, data),
  resendStudentCredentials: (id) => api.post(`/admin/students/${id}/resend-credentials`),
  getStudentPasswordRequests: (params) => api.get('/admin/students/password-requests', { params }),
  resolvePasswordRequest: (id, data) => api.post(`/admin/students/password-requests/${id}/resolve`, data),

  getExams: (params) => api.get('/admin/exams', { params }),
  createExam: (data) => api.post('/admin/exams', data),
  updateExam: (id, data) => api.put(`/admin/exams/${id}`, data),
  publishExam: (id) => api.post(`/admin/exams/${id}/publish`),
  getExamQuestions: (id) => api.get(`/admin/exams/${id}/questions`),
  addQuestions: (id, data) => api.post(`/admin/exams/${id}/questions`, data),
  deleteQuestion: (examId, questionId) => api.delete(`/admin/exams/${examId}/questions/${questionId}`),
  getMonitoringOverview: () => api.get('/admin/monitoring/overview'),
  getMonitoringData: (id) => api.get(`/admin/exams/${id}/monitor`),
  warnStudent: (examId, data) => api.post(`/admin/exams/${examId}/warn-student`, data),
  terminateStudent: (examId, data) => api.post(`/admin/exams/${examId}/terminate-student`, data),
  resumeStudent: (examId, data) => api.post(`/admin/exams/${examId}/resume-student`, data),
  broadcastAnnouncement: (examId, data) => api.post(`/admin/exams/${examId}/broadcast`, data),
  getStudentActivity: (examId, studentId) => api.get(`/admin/exams/${examId}/student-activity/${studentId}`),

  getResults: (params, config = {}) => api.get('/admin/results', { params, ...config }),
  getSubmission: (id) => api.get(`/admin/results/${id}/submission`),
  reevaluateResult: (id) => api.post(`/admin/results/${id}/re-evaluate`),
  reevaluateExam: (examId) => api.post(`/admin/results/re-evaluate/${examId}`),
  updateResult: (id, data) => api.put(`/admin/results/${id}`, data),
  evaluateResult: (id, data) => api.post(`/admin/results/${id}/evaluate`, data),
  publishResults: (examId) => api.post(`/admin/results/exam/${examId}/publish`),

  getNotifications: () => api.get('/admin/notifications'),

  // AI Question Generation
  getAIStatus: () => api.get('/admin/ai/status'),
  generateAIQuestions: (data) => api.post('/admin/ai/generate-questions', data, { timeout: 180000 }),

  // Support & Helpdesk
  getSupportTickets: (params) => api.get('/admin/support/tickets', { params }),
  createSupportTicket: (data) => api.post('/admin/support/tickets', data),
  getSupportFaqs: () => api.get('/admin/support/faqs'),
  getSystemStatus: () => api.get('/admin/support/system-status'),
};

// Student APIs
export const studentAPI = {
  getProfile: () => api.get('/student/profile'),
  changePassword: (data) => api.post('/student/change-password', data),
  requestPasswordAssistance: (data) => api.post('/student-password/request-admin-assistance', data),
  getMyPasswordRequests: () => api.get('/student-password/my-requests'),
  getExams: () => api.get('/student/exams'),
  getExamDetails: (examId) => api.get(`/student/exams/${examId}`),
  startExam: (id, data) => api.post(`/student/exams/${id}/start`, data),
  saveAnswer: (examId, data) => api.post(`/student/exams/${examId}/save-answer`, data),
  saveAnswersBulk: (examId, data) => api.post(`/student/exams/${examId}/save-answers-bulk`, data),
  submitExam: (examId, data) => api.post(`/student/exams/${examId}/submit`, data),
  reportViolation: (data) => api.post('/student/violations', data),
  runCode: (data) => api.post('/student/run-code', data),
  submitCode: (data) => api.post('/student/submit-code', data),
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
  requestQuote: (data) => api.post('/subscriptions/quote-request', data),
};

// Super Admin APIs
export const superAdminAPI = {
  getDashboard: () => api.get('/super-admin/dashboard'),
  getColleges: (params) => api.get('/super-admin/colleges', { params }),
  onboardCollege: (data) => api.post('/super-admin/colleges', data),
  updateCollege: (id, data) => api.put(`/super-admin/colleges/${id}`, data),
  approveCollege: (id) => api.patch(`/super-admin/colleges/${id}/approve`),
  rejectCollege: (id, data) => api.patch(`/super-admin/colleges/${id}/reject`, data),
  toggleCollege: (id) => api.patch(`/super-admin/colleges/${id}/toggle`),
  updateCollegePlan: (id, data) => api.patch(`/super-admin/colleges/${id}/plan`, data),
  resetCollegePassword: (id, data) => api.post(`/super-admin/colleges/${id}/reset-password`, data),
  deleteCollege: (id) => api.delete(`/super-admin/colleges/${id}`),
  getPayments: (params) => api.get('/super-admin/payments', { params }),
  recordManualPayment: (data) => api.post('/super-admin/payments/record', data),
  getAuditLogs: (params) => api.get('/super-admin/audit-logs', { params }),
  getSettings: () => api.get('/super-admin/settings'),
  updateSettings: (data) => api.put('/super-admin/settings', data),
};

export default api;
