const express = require('express');
const router = express.Router();
const studentPasswordController = require('../controllers/studentPasswordController');

// Request password reset
router.post('/request-reset', studentPasswordController.requestPasswordReset);

// Reset password with token
router.post('/reset', studentPasswordController.resetPassword);

// Verify reset token
router.get('/verify-token', studentPasswordController.verifyResetToken);

// Change password (when logged in)
router.post('/change', studentPasswordController.changePassword);

// Request password reset assistance from College Admin (from login page or student dashboard)
router.post('/request-admin-assistance', studentPasswordController.requestAdminAssistance);

// Get my password reset requests (student dashboard)
router.get('/my-requests', studentPasswordController.getMyPasswordRequests);

module.exports = router;
