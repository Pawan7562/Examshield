// controllers/authController.js
let bcrypt;
try {
  bcrypt = require('bcrypt');
} catch (_) {
  bcrypt = require('bcryptjs');
}
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');
const { supabase } = require('../config/supabase-clean');
const { pool } = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const { sendCollegeWelcome } = require('../services/emailService');

/**
 * Generate JWT tokens
 */
const generateTokens = (payload) => {
  const jwtSecret = process.env.JWT_SECRET || 'CollegeExam_jwt_secret_key_change_in_production_123456';
  const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET || 'CollegeExam_refresh_secret_key_change_in_production_123456';
  
  const accessToken = jwt.sign(payload, jwtSecret, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
  const refreshToken = jwt.sign(payload, jwtRefreshSecret, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  });
  return { accessToken, refreshToken };
};

const normalizeEmail = (email = '') => email.trim().toLowerCase();

const comparePassword = async (plainPassword, hashedPassword) => {
  if (!hashedPassword || !plainPassword) return false;

  try {
    const isBcrypt = hashedPassword.startsWith('$2a$') || hashedPassword.startsWith('$2b$');
    if (isBcrypt) {
      return await bcrypt.compare(plainPassword, hashedPassword);
    }
    // Legacy transition check: strictly compare if non-bcrypt, but never fallback in catch
    return plainPassword === hashedPassword;
  } catch (error) {
    return false;
  }
};

const createSupabaseAuthClient = () => {
  const authUrl = process.env.SUPABASE_AUTH_URL || process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const authKey = process.env.SUPABASE_AUTH_ANON_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!authUrl || !authKey) throw new Error('Supabase Auth fallback is not configured.');

  return createClient(authUrl, authKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

const signInWithSupabaseAuth = async (email, password) => {
  try {
    const authClient = createSupabaseAuthClient();
    const { data, error } = await authClient.auth.signInWithPassword({ email, password });

    try {
      await authClient.auth.signOut();
    } catch (signOutError) {
      // quiet cleanup
    }

    return { data, error };
  } catch (err) {
    return { data: null, error: err };
  }
};

const getCollegeDisplayName = (authUser, email) =>
  authUser?.user_metadata?.collegeName ||
  authUser?.user_metadata?.college_name ||
  authUser?.user_metadata?.institution ||
  authUser?.user_metadata?.name ||
  email.split('@')[0];

const syncCollegeFromSupabaseAuth = async ({ authUser, email, password, existingCollege }) => {
  const hashedPassword = await bcrypt.hash(password, 12);
  const now = new Date().toISOString();

  if (existingCollege) {
    const { data: updatedCollege, error } = await supabase
      .from('colleges')
      .update({
        email,
        password: hashedPassword,
        name: existingCollege.name || getCollegeDisplayName(authUser, email),
        updated_at: now,
      })
      .eq('id', existingCollege.id)
      .select('*')
      .single();

    if (error) throw error;
    return updatedCollege;
  }

  const trialExpiry = new Date();
  trialExpiry.setDate(trialExpiry.getDate() + 14);

  const { data: createdCollege, error } = await supabase
    .from('colleges')
    .insert([{
      id: authUser.id,
      name: getCollegeDisplayName(authUser, email),
      email,
      password: hashedPassword,
      subscription_plan: 'basic',
      subscription_expiry: trialExpiry.toISOString(),
      is_active: true,
      created_at: now,
      updated_at: now,
    }])
    .select('*')
    .single();

  if (error) throw error;
  return createdCollege;
};

// =====================================================
// SUPER ADMIN AUTH
// =====================================================

/**
 * POST /api/auth/super-admin/login
 */
exports.superAdminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const normalizedEmail = normalizeEmail(email);
    const dbRes = await pool.query(
      'SELECT * FROM super_admins WHERE email = $1 OR LOWER(email) = LOWER($1) LIMIT 1',
      [normalizedEmail]
    );
    const admin = dbRes.rows[0] || null;

    if (!admin || !await comparePassword(password, admin.password)) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const tokens = generateTokens({ id: admin.id, role: 'super_admin' });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: { id: admin.id, name: admin.name, email: admin.email, role: 'super_admin' },
        ...tokens,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// =====================================================
// COLLEGE ADMIN AUTH
// =====================================================

/**
 * POST /api/auth/college/register
 */
exports.collegeRegister = async (req, res) => {
  try {
    console.log('Registration request received:', req.body);
    const { name, email, password, phone, address, website, collegeName } = req.body;

    if (!name || !email || !password || !collegeName) {
      return res.status(400).json({ success: false, message: 'All required fields must be filled.' });
    }

    const normalizedEmail = normalizeEmail(email);

    console.log('Checking if email already exists...');
    // Check if email already exists
    const { data: existingCollege } = await supabase
      .from('colleges')
      .select('id')
      .eq('email', normalizedEmail)
      .limit(1);

    if (existingCollege && existingCollege.length > 0) {
      return res.status(409).json({ success: false, message: 'Email already registered.' });
    }

    console.log('Hashing password...');
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Create college with 14-day trial
    const trialExpiry = new Date();
    trialExpiry.setDate(trialExpiry.getDate() + 14);
    
    console.log('Creating college record...');
    const { data: college, error } = await supabase
      .from('colleges')
      .insert([{
        name: collegeName,
        email: normalizedEmail,
        password: hashedPassword,
        phone: phone || null,
        address: address || null,
        website: website || null,
        subscription_plan: 'basic',
        subscription_expiry: trialExpiry.toISOString(),
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      console.error('College creation error:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to create college account',
        error: error.message 
      });
    }

    console.log('College created:', college);
    
    // Generate tokens
    const { accessToken, refreshToken } = generateTokens({ id: college.id, role: 'college_admin' });
    
    res.status(201).json({
      success: true,
      message: 'College registered successfully! 14-day trial activated.',
      data: {
        user: { id: college.id, name: college.name, email: college.email, role: 'college_admin' },
        accessToken,
        refreshToken
      }
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during registration',
      error: error.message 
    });
  }
};

/**
 * POST /api/auth/college/login
 */
exports.collegeLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const normalizedEmail = normalizeEmail(email);
    const dbRes = await pool.query(
      'SELECT * FROM colleges WHERE email = $1 OR LOWER(email) = LOWER($1) LIMIT 1',
      [normalizedEmail]
    );
    let college = dbRes.rows[0] || null;

    let isPasswordValid = college ? await comparePassword(password, college.password) : false;

    if (!college || !isPasswordValid) {
      const { data: authData, error: authError } = await signInWithSupabaseAuth(normalizedEmail, password);

      if (authError || !authData?.user) {
        return res.status(401).json({
          success: false,
          message: college
            ? 'Invalid email or password.'
            : 'No administrator account found with this email. Please verify your credentials.',
        });
      }

      try {
        college = await syncCollegeFromSupabaseAuth({
          authUser: authData.user,
          email: normalizedEmail,
          password,
          existingCollege: college || null,
        });
        isPasswordValid = true;
      } catch (syncError) {
        console.error('College profile sync error:', syncError);
        return res.status(500).json({
          success: false,
          message: 'Login failed while syncing your account profile.',
          error: syncError.message,
        });
      }
    }

    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    if (college.is_active === false) {
      return res.status(403).json({ success: false, message: 'Your account has been suspended.' });
    }

    const tokens = generateTokens({ id: college.id, role: 'college_admin' });

    const subscriptionExpired = college.subscription_expiry && new Date(college.subscription_expiry) < new Date();

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: college.id,
          name: college.name,
          email: college.email,
          role: 'college_admin',
          subscriptionPlan: college.subscription_plan,
          subscriptionExpiry: college.subscription_expiry,
          subscriptionExpired,
        },
        ...tokens,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Login failed', error: error.message });
  }
};

// =====================================================
// STUDENT AUTH
// =====================================================

/**
 * POST /api/auth/student/login
 */
exports.studentLogin = async (req, res) => {
  try {
    const input = (req.body.email || req.body.studentId || req.body.emailOrId || req.body.id || '').trim();
    const { password } = req.body;

    if (!input || !password) {
      return res.status(400).json({ success: false, message: 'Email / Student ID and password are required.' });
    }

    const isEmailInput = input.includes('@');
    let studentQuery;
    let studentQueryParams;

    if (isEmailInput) {
      studentQuery = `
        SELECT s.*, c.name AS college_name
        FROM students s
        LEFT JOIN colleges c ON s.college_id = c.id
        WHERE s.email = $1 OR LOWER(s.email) = LOWER($1)
        LIMIT 1;
      `;
      studentQueryParams = [normalizeEmail(input)];
    } else {
      studentQuery = `
        SELECT s.*, c.name AS college_name
        FROM students s
        LEFT JOIN colleges c ON s.college_id = c.id
        WHERE s.student_id = $1 OR s.student_id ILIKE $1 OR s.roll_no = $1 OR s.roll_no ILIKE $1
        LIMIT 1;
      `;
      studentQueryParams = [input];
    }

    const dbRes = await pool.query(studentQuery, studentQueryParams);
    const student = dbRes.rows[0] || null;

    const trimmedPassword = (password || '').trim();
    let isPasswordValid = student ? await comparePassword(password, student.password) : false;
    if (!isPasswordValid && trimmedPassword && trimmedPassword !== password) {
      isPasswordValid = await comparePassword(trimmedPassword, student.password);
    }

    if (!student || !isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Invalid Student ID/Email or password.' });
    }

    if (student.is_active === false) {
      return res.status(403).json({ success: false, message: 'Your account has been deactivated.' });
    }

    // Update last login in background (non-blocking for ultra-fast response)
    pool.query('UPDATE students SET last_login = NOW() WHERE id = $1', [student.id]).catch(() => {});

    const tokens = generateTokens({ id: student.id, role: 'student', college_id: student.college_id });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: student.id,
          studentId: student.student_id,
          name: student.name,
          email: student.email,
          rollNo: student.roll_no,
          collegeName: student.college_name || null,
          collegeId: student.college_id,
          role: 'student',
        },
        ...tokens,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Login failed', error: error.message });
  }
};

/**
 * POST /api/auth/refresh
 */
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ success: false, message: 'Refresh token required.' });
    }

    const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET || 'CollegeExam_refresh_secret_key_change_in_production_123456';
    const decoded = jwt.verify(refreshToken, jwtRefreshSecret);
    const tokens = generateTokens({ id: decoded.id, role: decoded.role });

    res.json({ success: true, data: tokens });
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid or expired refresh token.' });
  }
};

/**
 * GET /api/auth/me
 */
exports.getMe = async (req, res) => {
  res.json({ success: true, data: { user: req.user } });
};

/**
 * POST /api/auth/college/forgot-password
 * College Admin password recovery initiation
 */
exports.collegeForgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Administrator email is required.' });
    }

    const normalized = normalizeEmail(email);
    const { pool } = require('../config/database');
    const result = await pool.query(
      'SELECT id, name, email FROM colleges WHERE LOWER(email) = $1',
      [normalized]
    );

    if (result.rows.length === 0) {
      // Return success to avoid email enumeration
      return res.json({
        success: true,
        message: 'If an account exists with this email, password recovery instructions have been sent.'
      });
    }

    const college = result.rows[0];
    const jwtSecret = process.env.JWT_SECRET || 'CollegeExam_jwt_secret_key_change_in_production_123456';
    const resetToken = jwt.sign(
      { id: college.id, email: college.email, type: 'college_admin_pwd_reset' },
      jwtSecret,
      { expiresIn: '2h' }
    );

    const platformUrl = process.env.PLATFORM_URL || 'http://localhost:3000';
    const resetUrl = `${platformUrl}/college/reset-password?token=${resetToken}`;

    // Optional email dispatch
    console.log(`[AUTH] College Admin Password Reset requested for ${college.email}: ${resetUrl}`);

    res.json({
      success: true,
      message: 'Password reset link sent to your registered administrator email.',
      data: {
        resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined,
        resetUrl: process.env.NODE_ENV === 'development' ? resetUrl : undefined
      }
    });
  } catch (error) {
    console.error('College forgot-password error:', error);
    res.status(500).json({ success: false, message: 'Failed to process password reset request', error: error.message });
  }
};

/**
 * POST /api/auth/college/reset-password
 * Complete College Admin password reset
 */
exports.collegeResetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ success: false, message: 'Reset token and new password are required.' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters long.' });
    }

    const jwtSecret = process.env.JWT_SECRET || 'CollegeExam_jwt_secret_key_change_in_production_123456';
    let decoded;
    try {
      decoded = jwt.verify(token, jwtSecret);
    } catch (tokenErr) {
      return res.status(400).json({ success: false, message: 'Invalid or expired password reset link. Please request a new one.' });
    }

    if (decoded.type !== 'college_admin_pwd_reset' || !decoded.id) {
      return res.status(400).json({ success: false, message: 'Invalid reset token payload.' });
    }

    const { pool } = require('../config/database');
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    const updateRes = await pool.query(
      'UPDATE colleges SET password = $1, updated_at = NOW() WHERE id = $2 RETURNING id, name, email',
      [hashedPassword, decoded.id]
    );

    if (updateRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'College account not found.' });
    }

    res.json({
      success: true,
      message: 'Administrator password reset successfully! You can now log in with your new password.'
    });
  } catch (error) {
    console.error('College reset-password error:', error);
    res.status(500).json({ success: false, message: 'Failed to reset password', error: error.message });
  }
};
