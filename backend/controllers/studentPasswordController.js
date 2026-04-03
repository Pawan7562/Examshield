const { supabase } = require('../config/supabase');
const crypto = require('crypto');
const bcrypt = require('bcrypt');

// Generate random token
function generateResetToken() {
  return crypto.randomBytes(32).toString('hex');
}

// Send password reset email
async function sendPasswordResetEmail(email, userId, resetToken) {
  // This is a placeholder - integrate with your email service
  // For now, we'll log the details
  console.log('Password Reset Email Details:');
  console.log('Email:', email);
  console.log('User ID:', userId);
  console.log('Reset Token:', resetToken);
  console.log('Reset Link:', `https://yourdomain.com/reset-password?token=${resetToken}&userId=${userId}`);
  
  // TODO: Implement actual email sending
  // Example with nodemailer:
  /*
  const nodemailer = require('nodemailer');
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
  
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'ExamShield - Password Reset Request',
    html: `
      <h2>Password Reset Request</h2>
      <p>Hello ${userId},</p>
      <p>You requested to reset your password for ExamShield.</p>
      <p>Click the link below to reset your password:</p>
      <a href="https://yourdomain.com/reset-password?token=${resetToken}&userId=${userId}">Reset Password</a>
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't request this, please ignore this email.</p>
    `
  };
  
  await transporter.sendMail(mailOptions);
  */
}

// Request password reset
exports.requestPasswordReset = async (req, res) => {
  try {
    const { email, userId } = req.body;

    // Validate input
    if (!email || !userId) {
      return res.status(400).json({
        success: false,
        message: 'Email and User ID are required'
      });
    }

    // Find student by email and userId
    const { data: student, error } = await supabase
      .from('students')
      .select('id, student_id, name, email')
      .eq('email', email)
      .eq('student_id', userId)
      .single();

    if (error || !student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found with provided email and User ID'
      });
    }

    // Generate reset token
    const resetToken = generateResetToken();
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    // For now, we'll store the reset token in a simple way
    // In a production environment, you might want to use a separate table or Redis
    // For this demo, we'll just simulate the email sending
    
    console.log('Password reset token generated:', {
      studentId: student.student_id,
      email: student.email,
      resetToken: resetToken,
      expiry: resetTokenExpiry
    });

    // Send password reset email (simplified version)
    try {
      await sendPasswordResetEmail(email, userId, resetToken);
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      // Continue even if email fails, as this is a demo
    }

    res.json({
      success: true,
      message: 'Password reset instructions sent to your email',
      // For demo purposes, include the reset link in the response
      // In production, you would NOT include this in the response
      resetLink: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/student/password-reset?token=${resetToken}&userId=${student.student_id}`
    });

  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process password reset request'
    });
  }
};

// Reset password with token
exports.resetPassword = async (req, res) => {
  try {
    const { token, userId, newPassword } = req.body;

    // Validate input
    if (!token || !userId || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Token, User ID, and new password are required'
      });
    }

    // For demo purposes, we'll just validate the token format
    // In production, you would verify the token against stored data
    
    // Simple token validation (not secure for production)
    if (token.length !== 32) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    // Find student by userId
    const { data: student, error } = await supabase
      .from('students')
      .select('id, student_id, email, password')
      .eq('student_id', userId)
      .single();

    if (error || !student) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    console.log('Password reset being processed for:', {
      studentId: student.student_id,
      email: student.email,
      token: token.substring(0, 8) + '...' // Only log partial token for security
    });

    // Hash new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password (we can't clear reset token since we're not storing it)
    const { error: updateError } = await supabase
      .from('students')
      .update({
        password: hashedPassword,
        updated_at: new Date().toISOString()
      })
      .eq('id', student.id);

    if (updateError) {
      throw updateError;
    }

    console.log('Password reset successfully for:', student.student_id);

    res.json({
      success: true,
      message: 'Password reset successfully'
    });

  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset password'
    });
  }
};

// Verify reset token
exports.verifyResetToken = async (req, res) => {
  try {
    const { token, userId } = req.query;

    if (!token || !userId) {
      return res.status(400).json({
        success: false,
        message: 'Token and User ID are required'
      });
    }

    // For demo purposes, we'll just validate the token format
    // In production, you would verify the token against stored data
    
    // Simple token validation (not secure for production)
    if (token.length !== 32) {
      return res.status(400).json({
        success: false,
        message: 'Invalid reset token'
      });
    }

    // Find student by userId
    const { data: student, error } = await supabase
      .from('students')
      .select('student_id, email')
      .eq('student_id', userId)
      .single();

    if (error || !student) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    console.log('Reset token verified for:', {
      studentId: student.student_id,
      email: student.email,
      token: token.substring(0, 8) + '...' // Only log partial token for security
    });

    res.json({
      success: true,
      message: 'Token is valid',
      data: {
        userId: student.student_id,
        email: student.email
      }
    });

  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify reset token'
    });
  }
};

// Change password (when logged in)
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const studentId = req.user.id; // From JWT token

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    // Get current student data
    const { data: student, error } = await supabase
      .from('students')
      .select('password')
      .eq('id', studentId)
      .single();

    if (error || !student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, student.password);
    if (!isValidPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    const { error: updateError } = await supabase
      .from('students')
      .update({ password: hashedPassword })
      .eq('id', studentId);

    if (updateError) {
      throw updateError;
    }

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password'
    });
  }
};
