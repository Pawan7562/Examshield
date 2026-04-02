// controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');
const { supabase } = require('../config/supabase-clean');
const { v4: uuidv4 } = require('uuid');
const { sendCollegeWelcome } = require('../services/emailService');

/**
 * Generate JWT tokens
 */
const generateTokens = (payload) => {
  const jwtSecret = process.env.JWT_SECRET || 'examshield_jwt_secret_key_change_in_production_123456';
  const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET || 'examshield_refresh_secret_key_change_in_production_123456';
  
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
  if (!hashedPassword) return false;

  try {
    return await bcrypt.compare(plainPassword, hashedPassword);
  } catch (error) {
    // Manual Supabase edits sometimes store plaintext or non-bcrypt values.
    console.error('Password comparison failed:', error.message);
    return false;
  }
};

const createSupabaseAuthClient = () => createClient(
  process.env.SUPABASE_URL || 'https://jzxvxxgsfbzqhrirnqfm.supabase.co',
  process.env.SUPABASE_SERVICE_KEY || 'sb_publishable_Y3eNbkdEjC59m67N0GiY4Q_1rOveLyL',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

const signInWithSupabaseAuth = async (email, password) => {
  const authClient = createSupabaseAuthClient();
  const { data, error } = await authClient.auth.signInWithPassword({ email, password });

  // Avoid leaving a server-side auth session hanging around in the client instance.
  try {
    await authClient.auth.signOut();
  } catch (signOutError) {
    console.error('Supabase auth sign-out cleanup failed:', signOutError.message);
  }

  return { data, error };
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
    const { data: admin, error } = await supabase
      .from('super_admins')
      .select('*')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (error) {
      console.error('Super admin login error:', error);
      return res.status(500).json({ success: false, message: 'Login failed', error: error.message });
    }

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
    let { data: college, error } = await supabase
      .from('colleges')
      .select('*')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (error) {
      console.error('College login error:', error);
      return res.status(500).json({ success: false, message: 'Login failed', error: error.message });
    }

    let isPasswordValid = college ? await comparePassword(password, college.password) : false;

    if (!college || !isPasswordValid) {
      const { data: authData, error: authError } = await signInWithSupabaseAuth(normalizedEmail, password);

      if (authError || !authData?.user) {
        return res.status(401).json({
          success: false,
          message: college
            ? 'Invalid email or password.'
            : 'No college account was found in the app database. If you only created a user in Supabase, register through /admin/register or add the user to public.colleges.',
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
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const normalizedEmail = normalizeEmail(email);
    const { data: student, error } = await supabase
      .from('students')
      .select('*')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (error) {
      console.error('Student login error:', error);
      return res.status(500).json({ success: false, message: 'Login failed', error: error.message });
    }

    if (!student || !await comparePassword(password, student.password)) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    if (student.is_active === false) {
      return res.status(403).json({ success: false, message: 'Your account has been deactivated.' });
    }

    let collegeName = null;
    if (student.college_id) {
      const { data: college } = await supabase
        .from('colleges')
        .select('name')
        .eq('id', student.college_id)
        .maybeSingle();

      collegeName = college?.name || null;
    }

    // Update last login without blocking login if the timestamp update fails.
    const { error: lastLoginError } = await supabase
      .from('students')
      .update({ last_login: new Date().toISOString() })
      .eq('id', student.id);

    if (lastLoginError) {
      console.error('Student last_login update error:', lastLoginError);
    }

    const tokens = generateTokens({ id: student.id, role: 'student' });

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
          collegeName,
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

    const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET || 'examshield_refresh_secret_key_change_in_production_123456';
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
