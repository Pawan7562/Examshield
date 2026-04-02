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
auth.post('/student/login', authController.studentLogin);
auth.post('/refresh', authController.refreshToken);
auth.get('/me', authenticate, authController.getMe);
router.use('/auth', auth);

// =====================================================
// ADMIN ROUTES (College Admin)
// =====================================================
const admin = express.Router();
admin.use(authenticate, authorize('college_admin'));

// Student management
admin.get('/students', adminController.getStudents);
admin.post('/students', checkSubscription, studentController.addStudent);
admin.post('/students/bulk', checkSubscription, upload.single('file'), studentController.bulkUploadStudents);
admin.put('/students/:id', studentController.updateStudent);
admin.patch('/students/:id/toggle-status', studentController.toggleStudentStatus);
admin.delete('/students/:id', studentController.deleteStudent);

// Exam management
admin.get('/exams', adminController.getExams);
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
admin.get('/exams/:id/monitor', examController.getLiveMonitoringData);

// Results management
admin.get('/results', resultController.getResults);
admin.post('/results/:id/evaluate', resultController.evaluateResult);
admin.post('/results/exam/:examId/publish', resultController.publishResults);

// Dashboard stats
admin.get('/dashboard', adminController.getDashboard);

// Notifications
admin.get('/notifications', adminController.getNotifications);

router.use('/admin', admin);

// =====================================================
// STUDENT ROUTES
// =====================================================
const student = express.Router();
student.use(authenticate, authorize('student'));

student.get('/profile', studentController.getStudentProfile);
student.post('/change-password', studentController.changePassword);
student.get('/exams', examController.getStudentExams);
student.post('/exams/:id/start', examController.startExam);
student.post('/exams/:id/save-answer', examController.saveAnswer);
student.post('/exams/:id/submit', examController.submitExam);
student.post('/violations', examController.reportViolation);
student.get('/results', resultController.getStudentResults);
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
router.use('/subscriptions', subscription);

// =====================================================
// SUPER ADMIN ROUTES
// =====================================================
const superAdmin = express.Router();
superAdmin.use(authenticate, authorize('super_admin'));
superAdmin.get('/dashboard', subscriptionController.getSuperAdminDashboard);
superAdmin.get('/colleges', subscriptionController.getAllColleges);
superAdmin.patch('/colleges/:id/toggle', subscriptionController.toggleCollegeStatus);
superAdmin.get('/audit-logs', async (req, res) => {
  try {
    const { supabase } = require('../config/supabase-clean');
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);
    
    if (error) {
      return res.status(500).json({ success: false, message: 'Failed to fetch audit logs', error: error.message });
    }
    
    res.json({ success: true, data: { logs: data || [] } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch audit logs', error: error.message });
  }
});
router.use('/super-admin', superAdmin);

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
