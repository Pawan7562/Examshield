const express = require('express');
const router = express.Router();
const studentPasswordController = require('../controllers/studentPasswordController');
const { passwordRecoveryLimiter } = require('../middleware/rateLimiter');

// Request password reset (Rate limited to 5 attempts per 15 minutes)
router.post('/request-reset', passwordRecoveryLimiter, studentPasswordController.requestPasswordReset);

// Reset password with token (Rate limited to 5 attempts per 15 minutes)
router.post('/reset', passwordRecoveryLimiter, studentPasswordController.resetPassword);

// Verify reset token (Rate limited to prevent token brute force)
router.get('/verify-token', passwordRecoveryLimiter, studentPasswordController.verifyResetToken);

// Change password (when logged in)
router.post('/change', studentPasswordController.changePassword);

// Request password reset assistance from College Admin (Rate limited)
router.post('/request-admin-assistance', passwordRecoveryLimiter, studentPasswordController.requestAdminAssistance);

// Get my password reset requests (student dashboard)
router.get('/my-requests', studentPasswordController.getMyPasswordRequests);

module.exports = router;
