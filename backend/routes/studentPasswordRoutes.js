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

module.exports = router;
