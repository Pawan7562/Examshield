// controllers/subscriptionController.js
const Razorpay = require('razorpay');
const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');
const { supabase } = require('../config/supabase-clean');

const PLANS = {
  basic: {
    name: 'Basic',
    price: 999,
    maxStudents: 50,
    maxExams: 10,
    duration: 30, // days
    features: ['50 Students', '10 Exams/month', 'MCQ Exams', 'Basic Reports', 'Email Support'],
  },
  standard: {
    name: 'Standard',
    price: 2999,
    maxStudents: 200,
    maxExams: 50,
    duration: 30,
    features: ['200 Students', '50 Exams/month', 'All Exam Types', 'Live Monitoring', 'Advanced Reports', 'Priority Support'],
  },
  premium: {
    name: 'Premium',
    price: 7999,
    maxStudents: null, // unlimited
    maxExams: null,
    duration: 30,
    features: ['Unlimited Students', 'Unlimited Exams', 'AI Proctoring', 'Custom Branding', '24/7 Support', 'API Access'],
  },
};

/**
 * GET /api/subscriptions/plans
 */
exports.getPlans = async (req, res) => {
  res.json({ success: true, data: { plans: PLANS } });
};

/**
 * POST /api/subscriptions/create-order
 * Create Razorpay order
 */
exports.createOrder = async (req, res) => {
  try {
    const { plan } = req.body;
    const collegeId = req.user.id;

    if (!PLANS[plan]) {
      return res.status(400).json({ success: false, message: 'Invalid plan.' });
    }

    const planDetails = PLANS[plan];
    const amount = planDetails.price * 100; // Razorpay expects paise

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const order = await razorpay.orders.create({
      amount,
      currency: 'INR',
      receipt: `sub_${collegeId}_${Date.now()}`,
      notes: { collegeId, plan },
    });

    res.json({
      success: true,
      data: {
        orderId: order.id,
        amount,
        currency: 'INR',
        keyId: process.env.RAZORPAY_KEY_ID,
        plan,
        planDetails,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create order', error: error.message });
  }
};

/**
 * POST /api/subscriptions/verify
 * Verify payment and activate subscription
 */
exports.verifyPayment = async (req, res) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, plan } = req.body;
    const collegeId = req.user.id;

    // Verify signature
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    if (expectedSignature !== razorpaySignature) {
      return res.status(400).json({ success: false, message: 'Payment verification failed.' });
    }

    const planDetails = PLANS[plan];
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + planDetails.duration);

    // Deactivate old subscriptions
    await supabase
      .from('subscriptions')
      .update({ status: 'expired' })
      .eq('college_id', collegeId);

    // Create new subscription
    await supabase
      .from('subscriptions')
      .insert([{
        college_id: collegeId,
        plan: plan,
        start_date: startDate,
        end_date: endDate,
        amount: planDetails.price,
        currency: 'INR',
        payment_id: razorpayPaymentId,
        payment_gateway: 'razorpay',
        status: 'active',
        max_students: planDetails.maxStudents,
        max_exams: planDetails.maxExams,
        features: JSON.stringify(planDetails.features)
      }]);

    // Update college subscription
    await supabase
      .from('colleges')
      .update({ 
        subscription_plan: plan, 
        subscription_expiry: endDate 
      })
      .eq('id', collegeId);

    res.json({
      success: true,
      message: `${planDetails.name} subscription activated successfully!`,
      data: { plan, endDate },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Payment verification failed', error: error.message });
  }
};

/**
 * GET /api/subscriptions/current
 */
exports.getCurrentSubscription = async (req, res) => {
  try {
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('college_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(1);

    // Handle no subscription case
    let subscriptionData = null;
    if (!subError && subscription && subscription.length > 0) {
      subscriptionData = subscription[0];
    } else if (subError && subError.code !== 'PGRST116') {
      throw subError;
    }

    const { data: students, error: studentError } = await supabase
      .from('students')
      .select('id')
      .eq('college_id', req.user.id)
      .eq('is_active', true);

    if (studentError) {
      throw studentError;
    }

    res.json({
      success: true,
      data: {
        subscription: subscriptionData,
        studentCount: students?.length || 0,
        hasSubscription: !!subscriptionData,
        plan: subscriptionData?.plan || 'free'
      }
    });
  } catch (error) {
    console.error('Get current subscription error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get subscription information',
      error: error.message 
    });
  }
};

// =====================================================
// SUPER ADMIN CONTROLLER & GOVERNANCE SUITE
// =====================================================

let platformSettings = {
  maintenance_mode: false,
  allow_college_self_registration: true,
  ai_proctoring_strictness: 'medium',
  face_detection_threshold: 85,
  tab_switch_limit: 3,
  default_trial_days: 14,
  system_notice: 'ExamShield cluster operating normally across all availability zones.',
  updated_at: new Date().toISOString(),
};

const logAudit = async ({ actor_id, actor_type = 'super_admin', action, resource_type, resource_id, details, ip_address, user_agent }) => {
  try {
    await pool.query(
      `INSERT INTO audit_logs (actor_id, actor_type, action, resource_type, resource_id, details, ip_address, user_agent, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
      [
        actor_id || null,
        actor_type,
        action,
        resource_type || null,
        resource_id || null,
        details ? JSON.stringify(details) : null,
        ip_address || null,
        user_agent || null,
      ]
    );
  } catch (err) {
    console.error('Audit log write error (non-fatal):', err.message);
  }
};

/**
 * GET /api/super-admin/dashboard
 */
exports.getSuperAdminDashboard = async (req, res) => {
  try {
    const [collegesRes, studentsRes, examsRes, revenueRes, subsRes] = await Promise.all([
      pool.query('SELECT id, is_active, subscription_plan FROM colleges'),
      pool.query('SELECT count(*) FROM students'),
      pool.query('SELECT count(*) FROM exams'),
      pool.query("SELECT COALESCE(SUM(amount), 0) as total, COUNT(*) as count FROM subscriptions WHERE status = 'active'"),
      pool.query("SELECT COALESCE(SUM(amount), 0) as all_time FROM subscriptions"),
    ]);

    const colleges = collegesRes.rows || [];
    const totalColleges = colleges.length;
    const activeColleges = colleges.filter((c) => c.is_active).length;
    const totalStudents = parseInt(studentsRes.rows[0]?.count || 0, 10);
    const totalExams = parseInt(examsRes.rows[0]?.count || 0, 10);
    const totalRevenue = parseFloat(revenueRes.rows[0]?.total || 0);
    const allTimeRevenue = parseFloat(subsRes.rows[0]?.all_time || 0);

    const recentCollegesRes = await pool.query(
      'SELECT id, name, email, subscription_plan, subscription_expiry, is_active, created_at FROM colleges ORDER BY created_at DESC LIMIT 10'
    );

    const planDistribution = {};
    colleges.forEach((c) => {
      const plan = c.subscription_plan || 'basic';
      planDistribution[plan] = (planDistribution[plan] || 0) + 1;
    });

    res.json({
      success: true,
      data: {
        stats: {
          totalColleges,
          activeColleges,
          suspendedColleges: totalColleges - activeColleges,
          totalStudents,
          totalExams,
          totalRevenue,
          allTimeRevenue,
          activeSubscriptions: parseInt(revenueRes.rows[0]?.count || 0, 10),
        },
        recentColleges: recentCollegesRes.rows || [],
        planDistribution,
        platformSettings,
      },
    });
  } catch (error) {
    console.error('Dashboard fetch error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard', error: error.message });
  }
};

/**
 * GET /api/super-admin/colleges
 */
exports.getAllColleges = async (req, res) => {
  try {
    const { search, status } = req.query;
    let sql = `
      SELECT c.*, 
        (SELECT COUNT(*) FROM students s WHERE s.college_id = c.id) as student_count,
        (SELECT COUNT(*) FROM exams e WHERE e.college_id = c.id) as exam_count
      FROM colleges c
    `;
    const params = [];
    const conditions = [];

    if (search) {
      params.push(`%${search.trim()}%`);
      conditions.push(`(c.name ILIKE $${params.length} OR c.email ILIKE $${params.length} OR c.address ILIKE $${params.length})`);
    }

    if (status === 'active') {
      conditions.push('c.is_active = true');
    } else if (status === 'suspended') {
      conditions.push('c.is_active = false');
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY c.created_at DESC';

    const { rows } = await pool.query(sql, params);

    res.json({
      success: true,
      data: {
        colleges: rows,
        total: rows.length,
      },
    });
  } catch (error) {
    console.error('Fetch colleges error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch colleges', error: error.message });
  }
};

/**
 * POST /api/super-admin/colleges
 * Directly onboard a new university/college tenant
 */
exports.createCollegeByAdmin = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      address,
      website,
      subscription_plan = 'basic',
      duration_months = 1,
      is_active = true,
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Institution name, email, and initial password are required.' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check uniqueness
    const existing = await pool.query('SELECT id FROM colleges WHERE email = $1', [normalizedEmail]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'An institution with this email address already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const planKey = PLANS[subscription_plan] ? subscription_plan : 'basic';
    const planDetails = PLANS[planKey];

    const months = Math.max(1, parseInt(duration_months, 10) || 1);
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + months * 30);

    const insertResult = await pool.query(
      `INSERT INTO colleges (name, email, password, phone, address, website, subscription_plan, subscription_expiry, is_active, is_email_verified, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true, NOW(), NOW())
       RETURNING id, name, email, phone, address, website, subscription_plan, subscription_expiry, is_active, created_at`,
      [
        name.trim(),
        normalizedEmail,
        hashedPassword,
        phone || null,
        address || null,
        website || null,
        planKey,
        endDate,
        is_active,
      ]
    );

    const newCollege = insertResult.rows[0];

    // Create subscription record
    await pool.query(
      `INSERT INTO subscriptions (college_id, plan, start_date, end_date, amount, currency, payment_id, payment_gateway, status, max_students, max_exams, features, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, 'INR', $6, 'admin_onboard', 'active', $7, $8, $9, NOW(), NOW())`,
      [
        newCollege.id,
        planKey,
        startDate,
        endDate,
        planDetails.price * months,
        `ONBOARD_${Date.now()}`,
        planDetails.maxStudents,
        planDetails.maxExams,
        JSON.stringify(planDetails.features),
      ]
    );

    // Audit Log
    await logAudit({
      actor_id: req.user?.id,
      action: 'COLLEGE_ONBOARDED',
      resource_type: 'college',
      resource_id: newCollege.id,
      details: { name: newCollege.name, email: newCollege.email, plan: planKey, months },
      ip_address: req.ip,
      user_agent: req.headers['user-agent'],
    });

    res.status(201).json({
      success: true,
      message: `Institution "${newCollege.name}" successfully onboarded with ${planKey.toUpperCase()} tier!`,
      data: { college: newCollege },
    });
  } catch (error) {
    console.error('Onboard college error:', error);
    res.status(500).json({ success: false, message: 'Failed to onboard institution', error: error.message });
  }
};

/**
 * PUT /api/super-admin/colleges/:id
 * Update college general metadata
 */
exports.updateCollegeByAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, address, website, is_active } = req.body;

    const check = await pool.query('SELECT * FROM colleges WHERE id = $1', [id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'College not found.' });
    }

    if (email) {
      const emailCheck = await pool.query('SELECT id FROM colleges WHERE email = $1 AND id <> $2', [email.trim().toLowerCase(), id]);
      if (emailCheck.rows.length > 0) {
        return res.status(400).json({ success: false, message: 'Email address is already in use by another college.' });
      }
    }

    const updateResult = await pool.query(
      `UPDATE colleges 
       SET name = COALESCE($1, name),
           email = COALESCE($2, email),
           phone = $3,
           address = $4,
           website = $5,
           is_active = COALESCE($6, is_active),
           updated_at = NOW()
       WHERE id = $7
       RETURNING id, name, email, phone, address, website, subscription_plan, subscription_expiry, is_active, updated_at`,
      [
        name ? name.trim() : null,
        email ? email.trim().toLowerCase() : null,
        phone !== undefined ? phone : check.rows[0].phone,
        address !== undefined ? address : check.rows[0].address,
        website !== undefined ? website : check.rows[0].website,
        typeof is_active === 'boolean' ? is_active : null,
        id,
      ]
    );

    await logAudit({
      actor_id: req.user?.id,
      action: 'COLLEGE_UPDATED',
      resource_type: 'college',
      resource_id: id,
      details: { name: updateResult.rows[0].name, email: updateResult.rows[0].email },
      ip_address: req.ip,
      user_agent: req.headers['user-agent'],
    });

    res.json({
      success: true,
      message: 'Institution profile updated successfully.',
      data: { college: updateResult.rows[0] },
    });
  } catch (error) {
    console.error('Update college error:', error);
    res.status(500).json({ success: false, message: 'Failed to update institution', error: error.message });
  }
};

/**
 * PATCH /api/super-admin/colleges/:id/plan
 * Override tier, extend subscription days, or set custom expiry
 */
exports.updateCollegePlan = async (req, res) => {
  try {
    const { id } = req.params;
    const { plan, extend_days, custom_expiry, notes } = req.body;

    const collegeRes = await pool.query('SELECT * FROM colleges WHERE id = $1', [id]);
    if (collegeRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'College not found.' });
    }

    const college = collegeRes.rows[0];
    const targetPlan = plan && PLANS[plan] ? plan : college.subscription_plan || 'basic';
    const planDetails = PLANS[targetPlan];

    let newExpiry;
    if (custom_expiry) {
      newExpiry = new Date(custom_expiry);
    } else if (extend_days) {
      const baseDate =
        college.subscription_expiry && new Date(college.subscription_expiry) > new Date()
          ? new Date(college.subscription_expiry)
          : new Date();
      baseDate.setDate(baseDate.getDate() + parseInt(extend_days, 10));
      newExpiry = baseDate;
    } else {
      const baseDate = new Date();
      baseDate.setDate(baseDate.getDate() + planDetails.duration);
      newExpiry = baseDate;
    }

    // Update college
    await pool.query(
      'UPDATE colleges SET subscription_plan = $1, subscription_expiry = $2, is_active = true, updated_at = NOW() WHERE id = $3',
      [targetPlan, newExpiry, id]
    );

    // Mark past active subscriptions as expired
    await pool.query("UPDATE subscriptions SET status = 'expired' WHERE college_id = $1 AND status = 'active'", [id]);

    // Create new active subscription record
    const subResult = await pool.query(
      `INSERT INTO subscriptions (college_id, plan, start_date, end_date, amount, currency, payment_id, payment_gateway, status, max_students, max_exams, features, created_at, updated_at)
       VALUES ($1, $2, NOW(), $3, $4, 'INR', $5, 'admin_override', 'active', $6, $7, $8, NOW(), NOW())
       RETURNING *`,
      [
        id,
        targetPlan,
        newExpiry,
        planDetails.price,
        `OVERRIDE_${Date.now()}`,
        planDetails.maxStudents,
        planDetails.maxExams,
        JSON.stringify({ ...planDetails.features, notes: notes || 'Super Admin Manual Tier Override' }),
      ]
    );

    await logAudit({
      actor_id: req.user?.id,
      action: 'SUBSCRIPTION_OVERRIDDEN',
      resource_type: 'subscription',
      resource_id: subResult.rows[0].id,
      details: { college_id: id, plan: targetPlan, newExpiry, notes },
      ip_address: req.ip,
      user_agent: req.headers['user-agent'],
    });

    res.json({
      success: true,
      message: `Subscription successfully updated to ${targetPlan.toUpperCase()} until ${newExpiry.toLocaleDateString()}.`,
      data: { plan: targetPlan, expiry: newExpiry, subscription: subResult.rows[0] },
    });
  } catch (error) {
    console.error('Update plan error:', error);
    res.status(500).json({ success: false, message: 'Failed to update plan', error: error.message });
  }
};

/**
 * POST /api/super-admin/colleges/:id/reset-password
 */
exports.resetCollegePassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { new_password } = req.body;

    if (!new_password || new_password.trim().length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
    }

    const hashedPassword = await bcrypt.hash(new_password.trim(), 10);
    const result = await pool.query(
      'UPDATE colleges SET password = $1, updated_at = NOW() WHERE id = $2 RETURNING id, name, email',
      [hashedPassword, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'College not found.' });
    }

    await logAudit({
      actor_id: req.user?.id,
      action: 'COLLEGE_PASSWORD_RESET',
      resource_type: 'college',
      resource_id: id,
      details: { college_name: result.rows[0].name },
      ip_address: req.ip,
      user_agent: req.headers['user-agent'],
    });

    res.json({
      success: true,
      message: `Password reset successfully for "${result.rows[0].name}".`,
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, message: 'Failed to reset password', error: error.message });
  }
};

/**
 * DELETE /api/super-admin/colleges/:id
 */
exports.deleteCollegeByAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const college = await pool.query('SELECT id, name FROM colleges WHERE id = $1', [id]);
    if (college.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'College not found.' });
    }

    await pool.query('DELETE FROM colleges WHERE id = $1', [id]);

    await logAudit({
      actor_id: req.user?.id,
      action: 'COLLEGE_DELETED',
      resource_type: 'college',
      resource_id: id,
      details: { name: college.rows[0].name },
      ip_address: req.ip,
      user_agent: req.headers['user-agent'],
    });

    res.json({
      success: true,
      message: `Institution "${college.rows[0].name}" deleted from the platform.`,
    });
  } catch (error) {
    console.error('Delete college error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete college', error: error.message });
  }
};

/**
 * PATCH /api/super-admin/colleges/:id/toggle
 */
exports.toggleCollegeStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const currentCollege = await pool.query('SELECT id, name, is_active FROM colleges WHERE id = $1', [id]);
    if (currentCollege.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'College not found.' });
    }

    const nextState = !currentCollege.rows[0].is_active;
    const updated = await pool.query(
      'UPDATE colleges SET is_active = $1, updated_at = NOW() WHERE id = $2 RETURNING id, name, is_active',
      [nextState, id]
    );

    await logAudit({
      actor_id: req.user?.id,
      action: nextState ? 'COLLEGE_ACTIVATED' : 'COLLEGE_SUSPENDED',
      resource_type: 'college',
      resource_id: id,
      details: { name: updated.rows[0].name, is_active: nextState },
      ip_address: req.ip,
      user_agent: req.headers['user-agent'],
    });

    res.json({
      success: true,
      message: `College "${updated.rows[0].name}" ${nextState ? 'activated' : 'suspended'}.`,
      data: { college: updated.rows[0] },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Status update failed', error: error.message });
  }
};

/**
 * GET /api/super-admin/payments
 * Full Financial Ledger & Subscription Transactions
 */
exports.getAllPayments = async (req, res) => {
  try {
    const { status, plan, search } = req.query;
    let sql = `
      SELECT s.*, 
             c.name as college_name, 
             c.email as college_email,
             c.phone as college_phone,
             c.website as college_website
      FROM subscriptions s
      JOIN colleges c ON s.college_id = c.id
    `;
    const params = [];
    const conditions = [];

    if (status && status !== 'all') {
      params.push(status);
      conditions.push(`s.status = $${params.length}`);
    }

    if (plan && plan !== 'all') {
      params.push(plan);
      conditions.push(`s.plan = $${params.length}`);
    }

    if (search) {
      params.push(`%${search.trim()}%`);
      conditions.push(`(c.name ILIKE $${params.length} OR c.email ILIKE $${params.length} OR s.payment_id ILIKE $${params.length})`);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY s.created_at DESC';

    const [paymentsRes, metricsRes] = await Promise.all([
      pool.query(sql, params),
      pool.query(`
        SELECT 
          COALESCE(SUM(CASE WHEN status = 'active' THEN amount ELSE 0 END), 0) as active_revenue,
          COALESCE(SUM(amount), 0) as total_volume,
          COUNT(CASE WHEN status = 'active' THEN 1 END) as active_count,
          COUNT(CASE WHEN status = 'expired' THEN 1 END) as expired_count,
          COUNT(*) as total_transactions
        FROM subscriptions
      `),
    ]);

    const metrics = metricsRes.rows[0] || {};

    res.json({
      success: true,
      data: {
        payments: paymentsRes.rows,
        metrics: {
          activeRevenue: parseFloat(metrics.active_revenue || 0),
          totalVolume: parseFloat(metrics.total_volume || 0),
          activeCount: parseInt(metrics.active_count || 0, 10),
          expiredCount: parseInt(metrics.expired_count || 0, 10),
          totalTransactions: parseInt(metrics.total_transactions || 0, 10),
        },
      },
    });
  } catch (error) {
    console.error('Get all payments error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch financial ledger', error: error.message });
  }
};

/**
 * POST /api/super-admin/payments/record
 * Record offline wire/cheque/invoice payment
 */
exports.recordManualPayment = async (req, res) => {
  try {
    const { college_id, plan, amount, payment_gateway = 'bank_transfer', payment_id, duration_days = 30, notes } = req.body;

    if (!college_id || !plan) {
      return res.status(400).json({ success: false, message: 'College and plan selection are required.' });
    }

    const collegeRes = await pool.query('SELECT * FROM colleges WHERE id = $1', [college_id]);
    if (collegeRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Selected institution not found.' });
    }

    const targetPlan = PLANS[plan] ? plan : 'basic';
    const planDetails = PLANS[targetPlan];
    const finalAmount = amount !== undefined && amount !== '' ? parseFloat(amount) : planDetails.price;

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + (parseInt(duration_days, 10) || 30));

    // Expire previous active subscriptions
    await pool.query("UPDATE subscriptions SET status = 'expired' WHERE college_id = $1 AND status = 'active'", [college_id]);

    // Insert new payment transaction
    const subResult = await pool.query(
      `INSERT INTO subscriptions (college_id, plan, start_date, end_date, amount, currency, payment_id, payment_gateway, status, max_students, max_exams, features, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, 'INR', $6, $7, 'active', $8, $9, $10, NOW(), NOW())
       RETURNING *`,
      [
        college_id,
        targetPlan,
        startDate,
        endDate,
        finalAmount,
        payment_id || `OFFLINE_${Date.now()}`,
        payment_gateway,
        planDetails.maxStudents,
        planDetails.maxExams,
        JSON.stringify({ notes: notes || 'Manual offline transaction recorded by Super Admin' }),
      ]
    );

    // Update college expiry and plan
    await pool.query(
      'UPDATE colleges SET subscription_plan = $1, subscription_expiry = $2, is_active = true, updated_at = NOW() WHERE id = $3',
      [targetPlan, endDate, college_id]
    );

    await logAudit({
      actor_id: req.user?.id,
      action: 'PAYMENT_RECORDED_MANUALLY',
      resource_type: 'subscription',
      resource_id: subResult.rows[0].id,
      details: { college_id, amount: finalAmount, gateway: payment_gateway, reference: payment_id },
      ip_address: req.ip,
      user_agent: req.headers['user-agent'],
    });

    res.status(201).json({
      success: true,
      message: `Payment of ₹${finalAmount.toLocaleString('en-IN')} recorded successfully for ${collegeRes.rows[0].name}.`,
      data: { subscription: subResult.rows[0] },
    });
  } catch (error) {
    console.error('Record manual payment error:', error);
    res.status(500).json({ success: false, message: 'Failed to record transaction', error: error.message });
  }
};

/**
 * GET /api/super-admin/audit-logs
 */
exports.getAuditLogs = async (req, res) => {
  try {
    const { limit = 100, action } = req.query;
    let sql = 'SELECT * FROM audit_logs';
    const params = [];

    if (action) {
      params.push(action);
      sql += ' WHERE action = $1';
    }

    sql += ` ORDER BY created_at DESC LIMIT $${params.length + 1}`;
    params.push(parseInt(limit, 10) || 100);

    const { rows } = await pool.query(sql, params);
    res.json({ success: true, data: { logs: rows } });
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch audit logs', error: error.message });
  }
};

/**
 * GET & PUT /api/super-admin/settings
 */
exports.getPlatformSettings = async (req, res) => {
  try {
    res.json({ success: true, data: { settings: platformSettings } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch platform settings', error: error.message });
  }
};

exports.updatePlatformSettings = async (req, res) => {
  try {
    const updates = req.body;
    platformSettings = {
      ...platformSettings,
      ...updates,
      updated_at: new Date().toISOString(),
    };

    await logAudit({
      actor_id: req.user?.id,
      action: 'PLATFORM_SETTINGS_UPDATED',
      resource_type: 'system',
      details: updates,
      ip_address: req.ip,
      user_agent: req.headers['user-agent'],
    });

    res.json({
      success: true,
      message: 'Platform governance settings updated.',
      data: { settings: platformSettings },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update platform settings', error: error.message });
  }
};
