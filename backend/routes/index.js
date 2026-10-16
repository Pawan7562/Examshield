// routes/index.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { authenticate, authorize, checkSubscription } = require('../middleware/auth');

// Controllers
const authController = require('../controllers/authController');
const adminController = require('../controllers/adminController');
const studentController = require('../controllers/studentController');
const examController = require('../controllers/examController');
const resultController = require('../controllers/resultController');
const subscriptionController = require('../controllers/subscriptionController');
const studentPasswordController = require('../controllers/studentPasswordController');
const aiQuestionController = require('../controllers/aiQuestionController');
const codeExecutionController = require('../controllers/codeExecutionController');
const liveMonitoringController = require('../controllers/liveMonitoringController');
const supportController = require('../controllers/supportController');

// Student password routes
const studentPasswordRoutes = require('./studentPasswordRoutes');
const chatbotRoutes = require('./chatbotRoutes');

const fs = require('fs');

// Multer config for CSV and Excel (.xlsx, .xls) uploads
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const validExtensions = ['.csv', '.xlsx', '.xls'];
    const validMimes = [
      'text/csv',
      'text/plain',
      'application/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/octet-stream',
    ];

    if (validExtensions.includes(ext) || validMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file format. Only CSV (.csv) and Excel (.xlsx, .xls) spreadsheets are supported.'));
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// Middleware wrapper to return clean 400 JSON on Multer errors
const handleRosterUpload = (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ success: false, message: 'File is too large. Maximum allowed size is 10MB.' });
      }
      return res.status(400).json({ success: false, message: `Upload error: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next();
  });
};

// =====================================================
// AUTH ROUTES
// =====================================================
const rateLimit = require('express-rate-limit');
const passwordRecoveryLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // max 5 attempts per 15 minutes per IP
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === 'OPTIONS',
  message: {
    success: false,
    message: 'Too many password recovery attempts. Please try again after 15 minutes.'
  }
});

const auth = express.Router();
auth.post('/super-admin/login', authController.superAdminLogin);
auth.post('/college/register', authController.collegeRegister);
auth.post('/college/login', authController.collegeLogin);
auth.post('/college/forgot-password', passwordRecoveryLimiter, authController.collegeForgotPassword);
auth.post('/college/reset-password', passwordRecoveryLimiter, authController.collegeResetPassword);
auth.post('/student/login', authController.studentLogin);
auth.post('/refresh', authController.refreshToken);
auth.get('/me', authenticate, authController.getMe);
router.use('/auth', auth);

// =====================================================
// ADMIN ROUTES (College Admin)
// =====================================================
const admin = express.Router();
admin.use(authenticate, authorize('college_admin'));

// Student management & Password Governance
admin.get('/students', adminController.getStudents);
admin.post('/students', checkSubscription, studentController.addStudent);
admin.post('/students/bulk', checkSubscription, handleRosterUpload, studentController.bulkUploadStudents);
admin.put('/students/:id', studentController.updateStudent);
admin.patch('/students/:id/toggle-status', studentController.toggleStudentStatus);
admin.delete('/students/:id', studentController.deleteStudent);
admin.post('/students/:id/reset-password', studentController.resetStudentPassword);
admin.post('/students/:id/resend-credentials', studentController.resendStudentCredentials);
admin.get('/students/password-requests', studentController.getPasswordRequests);
admin.post('/students/password-requests/:id/resolve', studentController.resolvePasswordRequest);

// Exam management
admin.get('/exams', adminController.getExams);
admin.get('/exams/health-check', examController.healthCheck);
admin.get('/debug/schema', examController.debugSchema);
admin.post('/exams', checkSubscription, examController.createExam);
admin.put('/exams/:id', examController.updateExam);
admin.delete('/exams/:id', async (req, res) => {
  try {
    const { supabase } = require('../config/supabase-clean');
    const { data, error } = await supabase
      .from('exams')
      .update({ status: 'cancelled' })
      .eq('id', req.params.id)
      .eq('college_id', req.user.id)
      .select()
      .single();
    
    if (error || !data) {
      return res.status(404).json({ success: false, message: 'Exam not found.' });
    }
    
    res.json({ success: true, message: 'Exam cancelled.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to cancel exam', error: error.message });
  }
});
admin.post('/exams/:id/publish', examController.publishExam);
admin.get('/exams/:id/questions', examController.getExamQuestions);
admin.post('/exams/:id/questions', examController.addQuestions);
admin.delete('/exams/:id/questions/:questionId', examController.deleteQuestion);

// Live Monitoring & Remote Proctoring Cockpit
admin.get('/monitoring/overview', liveMonitoringController.getLiveOverview);
admin.get('/exams/:id/monitor', liveMonitoringController.getMonitoringData);
admin.post('/exams/:id/warn-student', liveMonitoringController.sendWarning);
admin.post('/exams/:id/terminate-student', liveMonitoringController.terminateStudentExam);
admin.post('/exams/:id/broadcast', liveMonitoringController.broadcastAnnouncement);
admin.get('/exams/:id/student-activity/:studentId', liveMonitoringController.getStudentActivity);

// Results management & Answer Sheet inspection
admin.get('/results', resultController.getResults);
admin.get('/results/:id/submission', resultController.getAdminStudentSubmission);
admin.post('/results/:id/re-evaluate', resultController.reevaluateResult);
admin.post('/results/re-evaluate/:examId', resultController.reevaluateExam);
admin.put('/results/:id', resultController.updateResult);
admin.post('/results/:id/evaluate', resultController.evaluateResult);
admin.post('/results/exam/:examId/publish', resultController.publishResults);

// Dashboard stats
admin.get('/dashboard', adminController.getDashboard);

// Notifications
admin.get('/notifications', adminController.getNotifications);

// AI Question Generation
admin.get('/ai/status', aiQuestionController.getStatus);
admin.post('/ai/generate-questions', aiQuestionController.generateQuestions);

// Support & Helpdesk
admin.get('/support/tickets', supportController.getTickets);
admin.post('/support/tickets', supportController.createTicket);
admin.get('/support/faqs', supportController.getFaqs);
admin.get('/support/system-status', supportController.getSystemStatus);

router.use('/admin', admin);

// =====================================================
// STUDENT ROUTES
// =====================================================
const student = express.Router();
student.use(authenticate, authorize('student'));

student.get('/profile', studentController.getStudentProfile);
student.post('/change-password', studentController.changePassword);
student.get('/exams', examController.getStudentExams);
student.get('/exams/:id', examController.getExamDetails);
student.post('/exams/:id/start', examController.startExam);
student.post('/exams/:id/save-answer', examController.saveAnswer);
student.post('/exams/:id/save-answers-bulk', examController.saveAnswersBulk);
student.post('/exams/:id/submit', examController.submitExam);
student.post('/run-code', codeExecutionController.runCode);
student.post('/submit-code', codeExecutionController.submitCode);
student.post('/violations', examController.reportViolation);
student.get('/results', resultController.getStudentResults);
student.get('/results/by-key/:examKey', resultController.getStudentResultByKey);
student.get('/results/:examId', resultController.getStudentExamResult);
student.get('/notifications', async (req, res) => {
  try {
    const { supabase } = require('../config/supabase-clean');
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('recipient_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(30);
    
    if (error) {
      return res.status(500).json({ success: false, message: 'Failed to fetch notifications', error: error.message });
    }
    
    // Mark as read
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('recipient_id', req.user.id);
    
    res.json({ success: true, data: { notifications: data || [] } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch notifications', error: error.message });
  }
});

router.use('/student', student);

// =====================================================
// SUBSCRIPTION ROUTES
// =====================================================
const subscription = express.Router();
subscription.get('/plans', subscriptionController.getPlans);
subscription.get('/current', authenticate, authorize('college_admin'), subscriptionController.getCurrentSubscription);
subscription.post('/create-order', authenticate, authorize('college_admin'), subscriptionController.createOrder);
subscription.post('/verify', authenticate, authorize('college_admin'), subscriptionController.verifyPayment);
subscription.post('/quote-request', authenticate, authorize('college_admin'), subscriptionController.requestCustomQuote);
router.use('/subscriptions', subscription);

// =====================================================
// SUPER ADMIN ROUTES
// =====================================================
// SUPER ADMIN MANAGEMENT & PLATFORM GOVERNANCE
// =====================================================
const superAdmin = express.Router();
superAdmin.use(authenticate, authorize('super_admin'));

// Dashboard Overview
superAdmin.get('/dashboard', subscriptionController.getSuperAdminDashboard);

// College Tenants & Multi-Tenancy Control
superAdmin.get('/colleges', subscriptionController.getAllColleges);
superAdmin.post('/colleges', subscriptionController.createCollegeByAdmin);
superAdmin.put('/colleges/:id', subscriptionController.updateCollegeByAdmin);
superAdmin.patch('/colleges/:id/toggle', subscriptionController.toggleCollegeStatus);
superAdmin.patch('/colleges/:id/plan', subscriptionController.updateCollegePlan);
superAdmin.post('/colleges/:id/reset-password', subscriptionController.resetCollegePassword);
superAdmin.delete('/colleges/:id', subscriptionController.deleteCollegeByAdmin);

// Payment Ledger & Financial Management
superAdmin.get('/payments', subscriptionController.getAllPayments);
superAdmin.post('/payments/record', subscriptionController.recordManualPayment);

// Audit & Compliance
superAdmin.get('/audit-logs', subscriptionController.getAuditLogs);

// System Settings & Governance Controls
superAdmin.get('/settings', subscriptionController.getPlatformSettings);
superAdmin.put('/settings', subscriptionController.updatePlatformSettings);

router.use('/super-admin', superAdmin);

// =====================================================
// STUDENT PASSWORD ROUTES (Public - No authentication required)
// =====================================================
router.use('/student-password', studentPasswordRoutes);

// =====================================================
// CHATBOT SUPPORT & KNOWLEDGE BASE (Public)
// =====================================================
router.use('/chatbot', chatbotRoutes);

// =====================================================
// CODE EXECUTION (Sandboxed Enterprise Judge & Runner)
// =====================================================
router.post('/code/run', authenticate, codeExecutionController.runCode);
router.post('/code/submit', authenticate, codeExecutionController.submitCode);
router.post('/code/execute', authenticate, codeExecutionController.runCode);
router.post('/execute-code', authenticate, codeExecutionController.runCode);

const getLanguageId = (language) => {
  const map = {
    javascript: 63, python: 71, java: 62, cpp: 54, c: 50,
    csharp: 51, php: 68, ruby: 72, go: 60, rust: 73,
  };
  return map[language.toLowerCase()] || 71;
};

module.exports = router;
