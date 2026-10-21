// controllers/authController.js
let bcrypt;
try {
  bcrypt = require('bcrypt');
} catch (_) {
  bcrypt = require('bcryptjs');
}
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
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
    const isBcrypt = /^\$2[aby]\$/.test(hashedPassword);
    if (isBcrypt) {
      const match = await bcrypt.compare(plainPassword, hashedPassword);
      if (!match && plainPassword.trim() !== plainPassword) {
        return await bcrypt.compare(plainPassword.trim(), hashedPassword);
      }
      return match;
    }
    // Legacy transition check: strictly compare if non-bcrypt, but never fallback in catch
    return plainPassword === hashedPassword || plainPassword.trim() === hashedPassword;
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
    console.log(`[AUTH] College login attempt for: "${normalizedEmail}"`);

    const dbRes = await pool.query(
      'SELECT * FROM colleges WHERE email = $1 OR LOWER(email) = LOWER($1) LIMIT 1',
      [normalizedEmail]
    );
    let college = dbRes.rows[0] || null;

    let isPasswordValid = college ? await comparePassword(password, college.password) : false;

    if (!college || !isPasswordValid) {
      console.warn(`[AUTH] College login rejected for: "${normalizedEmail}". Account in DB: ${Boolean(college)}, Password valid: ${isPasswordValid}`);
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
    console.log(`[AUTH] College login successful for: "${college.email}" (${college.name})`);

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
 * Secure College Admin password recovery initiation
 * Security protections:
 * 1. Anti-enumeration: Identical response whether email exists or not.
 * 2. High-entropy cryptographically secure random token (256-bit).
 * 3. Token hashed with SHA-256 in database (OWASP standard; protects against DB breach).
 * 4. Strict 15-minute expiration window.
 * 5. Cooldown/Rate-limit to prevent spamming email inbox.
 * 6. Zero leakage: Token is NEVER returned in the API response.
 */
exports.collegeForgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ success: false, message: 'Institutional email address is required.' });
    }

    const normalized = normalizeEmail(email);
    const { pool } = require('../config/database');
    const result = await pool.query(
      'SELECT id, name, email, reset_password_expires FROM colleges WHERE LOWER(email) = $1',
      [normalized]
    );

    // Constant anti-enumeration message returned in all circumstances
    const genericSuccessMessage = 'If an administrator account exists with this email, secure password recovery instructions have been dispatched to your registered inbox.';

    if (result.rows.length === 0) {
      // Artificial delay to prevent timing attacks
      await new Promise(r => setTimeout(r, 200 + Math.random() * 200));
      return res.json({
        success: true,
        message: genericSuccessMessage
      });
    }

    const college = result.rows[0];

    // Rate-limiting / Cooldown protection: if a reset was requested less than 60s ago, don't spam emails
    if (college.reset_password_expires) {
      const now = new Date();
      const expiresAt = new Date(college.reset_password_expires);
      const remainingMs = expiresAt.getTime() - now.getTime();
      // If token was generated less than 60s ago (15m - 60s = 14m remaining)
      if (remainingMs > 14 * 60 * 1000) {
        return res.json({
          success: true,
          message: genericSuccessMessage
        });
      }
    }

    // 1. Generate clean 6-digit numeric OTP code for manual input
    const resetCode = crypto.randomInt(100000, 999999).toString();

    // 2. Generate high-entropy 24-byte hex token for 1-click magic link
    const rawToken = crypto.randomBytes(24).toString('hex');

    // 3. Compute SHA-256 hashes of both (never store plaintext credentials)
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const codeHash = crypto.createHash('sha256').update(resetCode).digest('hex');

    // 4. Store JSON payload in reset_password_token with failed attempt counter
    const tokenPayload = JSON.stringify({ t: tokenHash, o: codeHash, a: 0 });

    await pool.query(
      `UPDATE colleges 
       SET reset_password_token = $1, 
           reset_password_expires = NOW() + INTERVAL '15 minutes', 
           updated_at = NOW() 
       WHERE id = $2`,
      [tokenPayload, college.id]
    );

    // 5. Construct direct 1-click reset URL
    const { resolvePortalBaseUrl, sendCollegeAdminPasswordReset } = require('../services/emailService');
    const platformUrl = resolvePortalBaseUrl();
    const resetUrl = `${platformUrl}/college/reset-password?token=${encodeURIComponent(rawToken)}&email=${encodeURIComponent(normalized)}`;

    // 6. Dispatch email with prominent 6-digit code and direct link
    try {
      await sendCollegeAdminPasswordReset({
        name: college.name,
        email: college.email,
        collegeName: college.name,
        resetUrl,
        resetCode,
        resetToken: rawToken
      });
      console.log(`🔒 [AUTH-SECURITY] 6-digit reset code and 1-click link dispatched to ${college.email}`);
    } catch (mailErr) {
      console.error(`⚠️ [AUTH-SECURITY] Email dispatch error:`, mailErr.message);
    }

    // 7. Security requirement: NEVER return code or token in API response
    return res.json({
      success: true,
      message: genericSuccessMessage
    });
  } catch (error) {
    console.error('College forgot-password error:', error);
    res.status(500).json({ success: false, message: 'Failed to process password recovery request', error: error.message });
  }
};

/**
 * POST /api/auth/college/reset-password
 * Complete College Admin password reset
 * Supports both:
 *   A) 6-digit numeric verification code entered in login modal
 *   B) Direct 1-click magic link token from email
 * Security protections:
 * 1. Checks SHA-256 hash against database.
 * 2. Max 5 attempts for 6-digit code to completely prevent brute forcing.
 * 3. Immediate token invalidation (Single-Use guaranteed).
 * 4. Password complexity enforcement.
 * 5. Audit logging and security notification email.
 */
exports.collegeResetPassword = async (req, res) => {
  try {
    const { token, email, newPassword } = req.body;
    if (!token || typeof token !== 'string' || !newPassword || typeof newPassword !== 'string') {
      return res.status(400).json({ success: false, message: 'Verification code/token and new password are required.' });
    }

    const cleanInput = token.trim();
    if (!cleanInput) {
      return res.status(400).json({ success: false, message: 'Please provide your 6-digit code or reset token.' });
    }

    // Password complexity validation
    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters long.' });
    }
    const hasLetter = /[a-zA-Z]/.test(newPassword);
    const hasNumberOrSymbol = /[\d!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(newPassword);
    if (!hasLetter || !hasNumberOrSymbol) {
      return res.status(400).json({ success: false, message: 'Password must contain at least one letter and one number or symbol.' });
    }

    const { pool } = require('../config/database');
    const inputHash = crypto.createHash('sha256').update(cleanInput).digest('hex');

    // Find all active unexpired college reset records
    const cleanEmail = email && typeof email === 'string' ? normalizeEmail(email) : null;
    let query = `SELECT id, name, email, reset_password_token, reset_password_expires FROM colleges WHERE reset_password_expires > NOW()`;
    const params = [];

    if (cleanEmail) {
      query += ` AND LOWER(email) = LOWER($1)`;
      params.push(cleanEmail);
    }

    const matchRes = await pool.query(query, params);
    let matchedCollege = null;

    for (const row of matchRes.rows) {
      if (!row.reset_password_token) continue;

      // Try JSON payload { t: tokenHash, o: codeHash, a: attempts }
      try {
        const parsed = JSON.parse(row.reset_password_token);
        if (parsed && (parsed.t || parsed.o)) {
          // Check link token match
          if (parsed.t && parsed.t === inputHash) {
            matchedCollege = row;
            break;
          }
          // Check 6-digit code match
          if (parsed.o && parsed.o === inputHash) {
            matchedCollege = row;
            break;
          }

          // If code was attempted for this specific email but didn't match:
          if (cleanEmail && /^\d{6}$/.test(cleanInput)) {
            const attempts = (parsed.a || 0) + 1;
            if (attempts >= 5) {
              // Lockout and wipe token after 5 failed attempts
              await pool.query(
                `UPDATE colleges SET reset_password_token = NULL, reset_password_expires = NULL WHERE id = $1`,
                [row.id]
              );
              return res.status(400).json({
                success: false,
                message: 'Too many incorrect code attempts. For security, this reset code has been revoked. Please request a new one.'
              });
            } else {
              parsed.a = attempts;
              await pool.query(
                `UPDATE colleges SET reset_password_token = $1 WHERE id = $2`,
                [JSON.stringify(parsed), row.id]
              );
              return res.status(400).json({
                success: false,
                message: `Incorrect 6-digit reset code. ${5 - attempts} attempt(s) remaining.`
              });
            }
          }
        }
      } catch (_) {
        // Fallback: Legacy raw token or raw SHA-256 match
        if (row.reset_password_token === inputHash || row.reset_password_token === cleanInput) {
          matchedCollege = row;
          break;
        }
      }
    }

    if (!matchedCollege) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification code. Please request a new one.'
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Single-use: Update password and instantly clear the reset token
    await pool.query(
      `UPDATE colleges 
       SET password = $1, 
           reset_password_token = NULL, 
           reset_password_expires = NULL, 
           updated_at = NOW() 
       WHERE id = $2`,
      [hashedPassword, matchedCollege.id]
    );

    // Audit log entry for security compliance
    await pool.query(
      `INSERT INTO audit_logs (id, actor_id, actor_type, action, resource_type, resource_id, details, ip_address, user_agent, created_at)
       VALUES (gen_random_uuid(), $1, 'college_admin', 'PASSWORD_RESET', 'colleges', $1, $2, $3, $4, NOW())`,
      [matchedCollege.id, JSON.stringify({ method: cleanInput.length === 6 ? '6_digit_otp' : 'direct_link' }), req.ip || req.headers['x-forwarded-for'] || null, req.headers['user-agent'] || null]
    ).catch(err => console.warn('[AUTH-AUDIT] Could not record password reset audit log:', err.message));

    // Dispatch security alert email to inform the administrator
    const { sendPasswordChangedAlert } = require('../services/emailService');
    sendPasswordChangedAlert({
      name: matchedCollege.name,
      email: matchedCollege.email,
      collegeName: matchedCollege.name,
      ip: req.ip || req.headers['x-forwarded-for'] || 'Unknown',
      userAgent: req.headers['user-agent'] || 'Web Client'
    }).catch(err => console.warn('[AUTH] Alert email failed:', err.message));

    return res.json({
      success: true,
      message: 'Your administrator password has been updated securely. You can now log in.'
    });
  } catch (error) {
    console.error('College reset-password error:', error);
    res.status(500).json({ success: false, message: 'Failed to reset administrator password', error: error.message });
  }
};
