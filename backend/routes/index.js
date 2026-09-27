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

// Multer config for CSV uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, './uploads/'),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || path.extname(file.originalname) === '.csv') {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// =====================================================
// AUTH ROUTES
// =====================================================
const auth = express.Router();
auth.post('/super-admin/login', authController.superAdminLogin);
auth.post('/college/register', authController.collegeRegister);
auth.post('/college/login', authController.collegeLogin);
auth.post('/college/forgot-password', authController.collegeForgotPassword);
auth.post('/college/reset-password', authController.collegeResetPassword);
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
admin.post('/students/bulk', checkSubscription, upload.single('file'), studentController.bulkUploadStudents);
admin.put('/students/:id', studentController.updateStudent);
admin.patch('/students/:id/toggle-status', studentController.toggleStudentStatus);
admin.delete('/students/:id', studentController.deleteStudent);
admin.post('/students/:id/reset-password', studentController.resetStudentPassword);
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

// Results management
admin.get('/results', resultController.getResults);
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
// CODE EXECUTION (Sandboxed - basic implementation)
// =====================================================
router.post('/execute-code', authenticate, authorize('student'), async (req, res) => {
  const { code, language, input } = req.body;

  // NOTE: In production, use Judge0 API or similar sandboxed service
  // This is a placeholder that integrates with Judge0 API
  try {
    const response = await fetch('https://judge0-ce.p.rapidapi.com/submissions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-RapidAPI-Key': process.env.JUDGE0_API_KEY,
        'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com',
      },
      body: JSON.stringify({
        source_code: Buffer.from(code).toString('base64'),
        language_id: getLanguageId(language),
        stdin: input ? Buffer.from(input).toString('base64') : null,
      }),
    });

    const submission = await response.json();
    res.json({ success: true, data: { token: submission.token } });
  } catch (error) {
    res.status(503).json({
      success: false,
      message: 'Code execution service unavailable. Configure JUDGE0_API_KEY.',
    });
  }
});

const getLanguageId = (language) => {
  const map = {
    javascript: 63, python: 71, java: 62, cpp: 54, c: 50,
    csharp: 51, php: 68, ruby: 72, go: 60, rust: 73,
  };
  return map[language.toLowerCase()] || 71;
};

module.exports = router;
