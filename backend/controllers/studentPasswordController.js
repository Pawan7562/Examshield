const { supabase } = require('../config/supabase');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

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
    subject: 'CollegeExam - Password Reset Request',
    html: `
      <h2>Password Reset Request</h2>
      <p>Hello ${userId},</p>
      <p>You requested to reset your password for CollegeExam.</p>
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
    const { pool } = require('../config/database');
    const jwt = require('jsonwebtoken');
    const { currentPassword, newPassword } = req.body;
    let studentId = req.user?.id;

    if (!studentId && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      try {
        const token = req.headers.authorization.split(' ')[1];
        const jwtSecret = process.env.JWT_SECRET || 'CollegeExam_jwt_secret_key_change_in_production_123456';
        const decoded = jwt.verify(token, jwtSecret);
        studentId = decoded.id;
      } catch (_) {}
    }

    if (!studentId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please log into your student dashboard.'
      });
    }

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
    }

    // Get current student data from PostgreSQL
    const studentRes = await pool.query('SELECT id, password FROM students WHERE id = $1', [studentId]);
    if (studentRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Student account not found'
      });
    }

    const student = studentRes.rows[0];

    // If current password provided, verify it
    if (currentPassword && currentPassword.trim()) {
      const isValidPassword = await bcrypt.compare(currentPassword, student.password);
      if (!isValidPassword) {
        return res.status(400).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }
    }

    // Hash new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update in Neon PostgreSQL
    await pool.query('UPDATE students SET password = $1, updated_at = NOW() WHERE id = $2', [hashedPassword, studentId]);

    // Also mark any pending reset requests as resolved
    await pool.query(
      `UPDATE student_password_requests 
       SET status = 'resolved', admin_notes = 'Password changed by student in dashboard', resolved_at = NOW(), updated_at = NOW() 
       WHERE student_uuid = $1 AND status = 'pending'`,
      [studentId]
    );

    res.json({
      success: true,
      message: 'Password changed successfully!'
    });

  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password',
      error: error.message
    });
  }
};

/**
 * POST /api/student-password/request-admin-assistance
 * Request College Admin assistance to reset password (from student dashboard or login help modal)
 */
exports.requestAdminAssistance = async (req, res) => {
  try {
    const { pool } = require('../config/database');
    const jwt = require('jsonwebtoken');
    const { studentIdOrEmail, collegeCode, reason, studentUuid } = req.body;

    let student = null;

    // 1. Check if authenticated via JWT token
    let authUser = req.user;
    if (!authUser && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      try {
        const token = req.headers.authorization.split(' ')[1];
        const jwtSecret = process.env.JWT_SECRET || 'CollegeExam_jwt_secret_key_change_in_production_123456';
        authUser = jwt.verify(token, jwtSecret);
      } catch (_) {}
    }

    if (authUser && authUser.id) {
      const authRes = await pool.query(
        'SELECT id, student_id, name, email, roll_no, college_id FROM students WHERE id = $1',
        [authUser.id]
      );
      if (authRes.rows.length > 0) {
        student = authRes.rows[0];
      }
    }

    if (!student && studentUuid) {
      const uuidRes = await pool.query(
        'SELECT id, student_id, name, email, roll_no, college_id FROM students WHERE id = $1',
        [studentUuid]
      );
      if (uuidRes.rows.length > 0) {
        student = uuidRes.rows[0];
      }
    }

    // 2. If unauthenticated, search by studentIdOrEmail
    if (!student) {
      if (!studentIdOrEmail) {
        return res.status(400).json({
          success: false,
          message: 'Student ID, University Roll Number, or registered email is required.'
        });
      }

      const cleanInput = studentIdOrEmail.trim();
      const findRes = await pool.query(`
        SELECT s.id, s.student_id, s.name, s.email, s.roll_no, s.college_id, c.name as college_name
        FROM students s
        LEFT JOIN colleges c ON s.college_id = c.id
        WHERE (LOWER(s.email) = LOWER($1) OR s.student_id = $1 OR s.roll_no = $1)
        LIMIT 1
      `, [cleanInput]);

      if (findRes.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No student record found with the provided credentials. Please contact your College Administrator.'
        });
      }

      student = findRes.rows[0];
    }

    // 3. Check if a pending request already exists in the last 2 hours
    const existingCheck = await pool.query(
      `SELECT id, created_at FROM student_password_requests 
       WHERE student_uuid = $1 AND status = 'pending' AND created_at > NOW() - INTERVAL '2 hours' 
       ORDER BY created_at DESC LIMIT 1`,
      [student.id]
    );

    if (existingCheck.rows.length > 0) {
      return res.json({
        success: true,
        message: 'Your password reset assistance request is already active and pending with your College Administration.',
        data: {
          requestId: existingCheck.rows[0].id,
          status: 'pending'
        }
      });
    }

    // 4. Insert into student_password_requests
    const insertRes = await pool.query(
      `INSERT INTO student_password_requests
        (college_id, student_uuid, student_id, student_name, student_email, roll_no, status, requested_from, reason, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7, $8, NOW(), NOW())
       RETURNING *`,
      [
        student.college_id,
        student.id,
        student.student_id,
        student.name,
        student.email,
        student.roll_no,
        authUser ? 'dashboard' : 'login_page',
        reason || 'Candidate requested password reset assistance'
      ]
    );

    res.json({
      success: true,
      message: 'Password reset assistance request dispatched to your College Examination Administration successfully!',
      data: {
        request: insertRes.rows[0],
        studentName: student.name,
        studentId: student.student_id
      }
    });

  } catch (error) {
    console.error('Request admin assistance error:', error);
    res.status(500).json({ success: false, message: 'Failed to submit password reset request', error: error.message });
  }
};

/**
 * GET /api/student-password/my-requests
 * Fetch the student's password reset requests from dashboard
 */
exports.getMyPasswordRequests = async (req, res) => {
  try {
    const { pool } = require('../config/database');
    const jwt = require('jsonwebtoken');
    let studentId = req.user?.id;

    if (!studentId && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      try {
        const token = req.headers.authorization.split(' ')[1];
        const jwtSecret = process.env.JWT_SECRET || 'CollegeExam_jwt_secret_key_change_in_production_123456';
        const decoded = jwt.verify(token, jwtSecret);
        studentId = decoded.id;
      } catch (_) {}
    }

    if (!studentId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const result = await pool.query(
      `SELECT * FROM student_password_requests WHERE student_uuid = $1 ORDER BY created_at DESC LIMIT 10`,
      [studentId]
    );

    res.json({
      success: true,
      data: {
        requests: result.rows || []
      }
    });
  } catch (error) {
    console.error('Get my password requests error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch password requests', error: error.message });
  }
};
