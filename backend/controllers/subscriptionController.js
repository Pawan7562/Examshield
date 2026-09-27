// controllers/subscriptionController.js
const Razorpay = require('razorpay');
const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');
const { supabase } = require('../config/supabase-clean');

const PLANS = {
  monthly: {
    basic: {
      id: 'basic',
      name: 'Basic Quota',
      tier: 'Departmental',
      tagline: 'Ideal for single departments & basic classroom proctoring',
      price: 999,
      annualTotal: 999,
      billingCycle: 'monthly',
      periodLabel: '/ month',
      originalPrice: null,
      savingsLabel: null,
      maxStudents: 50,
      maxExams: 10,
      duration: 30, // days
      popular: false,
      features: [
        '50 Candidate Seats Quota',
        '10 Assessment Slots / Month',
        'Standard MCQ & Subjective Formats',
        'Proctor Lockdown (Anti-Tab Switch & Fullscreen)',
        'Basic Result Card & Gradebook Export',
        'Standard Helpdesk Email Support'
      ],
      quotas: {
        students: 50,
        exams: 10,
        proctoring: 'Standard Tab-Lock',
        support: 'Email'
      }
    },
    standard: {
      id: 'standard',
      name: 'Standard Quota',
      tier: 'Institutional Growth',
      tagline: 'Best for growing faculties, mid-size institutions & tech colleges',
      price: 2999,
      annualTotal: 2999,
      billingCycle: 'monthly',
      periodLabel: '/ month',
      originalPrice: null,
      savingsLabel: null,
      maxStudents: 200,
      maxExams: 50,
      duration: 30,
      popular: true,
      features: [
        '200 Candidate Seats Quota',
        '50 Assessment Slots / Month',
        'All Exam Types: MCQ, Coding & Subjective',
        'Interactive Python/Java/C++ Code Sandbox',
        'AI Proctoring Lite (Audio + Tab + Device Telemetry)',
        'Live Active Proctor Room & Monitor Grid',
        'Priority Technical Hotline Support (4h SLA)'
      ],
      quotas: {
        students: 200,
        exams: 50,
        proctoring: 'AI Audio & Tab Monitor',
        support: 'Priority Hotline'
      }
    },
    premium: {
      id: 'premium',
      name: 'Premium Enterprise',
      tier: 'University Accreditation',
      tagline: 'For full university campuses, multi-department certifications & autonomous institutions',
      price: 7999,
      annualTotal: 7999,
      billingCycle: 'monthly',
      periodLabel: '/ month',
      originalPrice: null,
      savingsLabel: null,
      maxStudents: null, // unlimited
      maxExams: null,
      duration: 30,
      popular: false,
      features: [
        'Unlimited Candidate Enrollment Seats',
        'Unlimited Monthly Assessment Slots',
        'Deep AI Proctoring: Multi-face, Gaze, Voice & Secondary Cam',
        'Real-time Plagiarism & Code Diff Detection',
        'Custom College Subdomain & Institutional White-Labeling',
        'Dedicated Technical Account Manager & 24/7 Priority Emergency Support',
        'Direct REST API & LMS Webhook Integrations'
      ],
      quotas: {
        students: 'Unlimited',
        exams: 'Unlimited',
        proctoring: 'Full Multi-Modal AI',
        support: '24/7 Dedicated SLA'
      }
    }
  },
  annually: {
    basic: {
      id: 'basic',
      name: 'Basic Quota',
      tier: 'Departmental',
      tagline: 'Ideal for single departments & basic classroom proctoring',
      price: 799,
      annualTotal: 9588,
      billingCycle: 'annually',
      periodLabel: '/ mo',
      originalPrice: 999,
      savingsLabel: 'Save 20%',
      maxStudents: 50,
      maxExams: 10,
      duration: 365, // days
      popular: false,
      features: [
        '50 Candidate Seats Quota',
        '10 Assessment Slots / Month',
        'Standard MCQ & Subjective Formats',
        'Proctor Lockdown (Anti-Tab Switch & Fullscreen)',
        'Basic Result Card & Gradebook Export',
        'Standard Helpdesk Email Support',
        '2 Months Free Included (Annual License)'
      ],
      quotas: {
        students: 50,
        exams: 10,
        proctoring: 'Standard Tab-Lock',
        support: 'Email'
      }
    },
    standard: {
      id: 'standard',
      name: 'Standard Quota',
      tier: 'Institutional Growth',
      tagline: 'Best for growing faculties, mid-size institutions & tech colleges',
      price: 2399,
      annualTotal: 28788,
      billingCycle: 'annually',
      periodLabel: '/ mo',
      originalPrice: 2999,
      savingsLabel: 'Save 20%',
      maxStudents: 200,
      maxExams: 50,
      duration: 365,
      popular: true,
      features: [
        '200 Candidate Seats Quota',
        '50 Assessment Slots / Month',
        'All Exam Types: MCQ, Coding & Subjective',
        'Interactive Python/Java/C++ Code Sandbox',
        'AI Proctoring Lite (Audio + Tab + Device Telemetry)',
        'Live Active Proctor Room & Monitor Grid',
        'Priority Technical Hotline Support (4h SLA)',
        '2 Months Free Included (Annual License)'
      ],
      quotas: {
        students: 200,
        exams: 50,
        proctoring: 'AI Audio & Tab Monitor',
        support: 'Priority Hotline'
      }
    },
    premium: {
      id: 'premium',
      name: 'Premium Enterprise',
      tier: 'University Accreditation',
      tagline: 'For full university campuses, multi-department certifications & autonomous institutions',
      price: 6399,
      annualTotal: 76788,
      billingCycle: 'annually',
      periodLabel: '/ mo',
      originalPrice: 7999,
      savingsLabel: 'Save 20%',
      maxStudents: null, // unlimited
      maxExams: null,
      duration: 365,
      popular: false,
      features: [
        'Unlimited Candidate Enrollment Seats',
        'Unlimited Monthly Assessment Slots',
        'Deep AI Proctoring: Multi-face, Gaze, Voice & Secondary Cam',
        'Real-time Plagiarism & Code Diff Detection',
        'Custom College Subdomain & Institutional White-Labeling',
        'Dedicated Technical Account Manager & 24/7 Priority Emergency Support',
        'Direct REST API & LMS Webhook Integrations',
        '2 Months Free Included (Annual License)'
      ],
      quotas: {
        students: 'Unlimited',
        exams: 'Unlimited',
        proctoring: 'Full Multi-Modal AI',
        support: '24/7 Dedicated SLA'
      }
    }
  }
};

/**
 * GET /api/subscriptions/plans
 */
exports.getPlans = async (req, res) => {
  res.json({ 
    success: true, 
    data: { 
      plans: PLANS.monthly, 
      plansMonthly: PLANS.monthly,
      plansAnnually: PLANS.annually,
      allPlans: PLANS 
    } 
  });
};

/**
 * POST /api/subscriptions/create-order
 * Create Razorpay order for Monthly or Annual License
 */
exports.createOrder = async (req, res) => {
  try {
    const { plan, billingCycle = 'monthly' } = req.body;
    const collegeId = req.user.id;

    const cycleKey = billingCycle === 'annually' ? 'annually' : 'monthly';
    const planGroup = PLANS[cycleKey] || PLANS.monthly;
    const planDetails = planGroup[plan];

    if (!planDetails) {
      return res.status(400).json({ success: false, message: 'Invalid subscription plan selection.' });
    }

    const payableAmountINR = cycleKey === 'annually' ? planDetails.annualTotal : planDetails.price;
    const amountInPaise = payableAmountINR * 100; // Razorpay expects paise

    // Check if Razorpay keys are configured
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret || keyId === 'your_razorpay_key_id') {
      // Sandbox fallback mode for local testing without real Razorpay keys
      const mockOrderId = `order_sim_${Date.now()}`;
      return res.json({
        success: true,
        data: {
          orderId: mockOrderId,
          amount: amountInPaise,
          currency: 'INR',
          keyId: 'rzp_test_mock_sandbox',
          plan,
          billingCycle: cycleKey,
          planDetails,
          isSandbox: true,
        },
      });
    }

    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: `sub_${collegeId.substring(0, 8)}_${Date.now()}`,
      notes: { collegeId, plan, billingCycle: cycleKey },
    });

    res.json({
      success: true,
      data: {
        orderId: order.id,
        amount: amountInPaise,
        currency: 'INR',
        keyId,
        plan,
        billingCycle: cycleKey,
        planDetails,
        isSandbox: false,
      },
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ success: false, message: 'Failed to create order', error: error.message });
  }
};

/**
 * POST /api/subscriptions/verify
 * Verify payment and activate subscription in PostgreSQL
 */
exports.verifyPayment = async (req, res) => {
  try {
    const { 
      razorpayOrderId, 
      razorpayPaymentId, 
      razorpaySignature, 
      plan,
      billingCycle = 'monthly'
    } = req.body;
    const collegeId = req.user.id;

    const cycleKey = billingCycle === 'annually' ? 'annually' : 'monthly';
    const planGroup = PLANS[cycleKey] || PLANS.monthly;
    const planDetails = planGroup[plan] || PLANS.monthly[plan];

    if (!planDetails) {
      return res.status(400).json({ success: false, message: 'Invalid subscription plan.' });
    }

    // Verify signature only if real keys are configured and not mock
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (keySecret && !razorpayOrderId?.startsWith('order_sim_')) {
      const crypto = require('crypto');
      const expectedSignature = crypto
        .createHmac('sha256', keySecret)
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest('hex');

      if (expectedSignature !== razorpaySignature) {
        return res.status(400).json({ success: false, message: 'Payment signature verification failed.' });
      }
    }

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + (planDetails.duration || 30));

    const finalAmount = cycleKey === 'annually' ? planDetails.annualTotal : planDetails.price;

    // 1. Expire existing subscriptions for this college
    await pool.query(
      `UPDATE subscriptions SET status = 'expired', updated_at = NOW() WHERE college_id = $1 AND status = 'active'`,
      [collegeId]
    );

    // 2. Insert new verified subscription directly into PostgreSQL
    const newSubRes = await pool.query(
      `INSERT INTO subscriptions 
        (college_id, plan, start_date, end_date, amount, currency, payment_id, payment_gateway, status, max_students, max_exams, features, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, 'INR', $6, $7, 'active', $8, $9, $10, NOW(), NOW())
       RETURNING *`,
      [
        collegeId,
        plan,
        startDate,
        endDate,
        finalAmount,
        razorpayPaymentId || `sim_pay_${Date.now()}`,
        razorpayOrderId?.startsWith('order_sim_') ? 'sandbox_test' : 'razorpay',
        planDetails.maxStudents,
        planDetails.maxExams,
        JSON.stringify(planDetails.features)
      ]
    );

    // 3. Update college row with active plan and expiration date
    await pool.query(
      `UPDATE colleges SET subscription_plan = $1, subscription_expiry = $2, updated_at = NOW() WHERE id = $3`,
      [plan, endDate, collegeId]
    );

    res.json({
      success: true,
      message: `${planDetails.name} (${cycleKey.toUpperCase()}) successfully activated!`,
      data: { 
        plan, 
        billingCycle: cycleKey,
        endDate,
        subscription: newSubRes.rows[0]
      },
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ success: false, message: 'Payment verification failed', error: error.message });
  }
};

/**
 * GET /api/subscriptions/current
 * High-speed direct Neon DB fetch for active license, capacity meters, and plan metadata
 */
exports.getCurrentSubscription = async (req, res) => {
  try {
    const collegeId = req.user.id;

    // Run parallel high-speed queries to Neon PostgreSQL
    const [subRes, studentsRes, examsRes, resultsRes, collegeRes] = await Promise.all([
      pool.query(`SELECT * FROM subscriptions WHERE college_id = $1 ORDER BY created_at DESC LIMIT 1`, [collegeId]),
      pool.query(`SELECT COUNT(*)::int AS count FROM students WHERE college_id = $1`, [collegeId]),
      pool.query(`SELECT COUNT(*)::int AS count FROM exams WHERE college_id = $1`, [collegeId]),
      pool.query(`SELECT COUNT(*)::int AS count FROM results r JOIN exams e ON r.exam_id = e.id WHERE e.college_id = $1`, [collegeId]),
      pool.query(`SELECT id, name, email, subscription_plan, subscription_expiry FROM colleges WHERE id = $1`, [collegeId])
    ]);

    const college = collegeRes.rows[0] || {};
    let subscriptionData = subRes.rows[0] || null;

    // If no explicit subscription row found, generate default tier from college table
    if (!subscriptionData) {
      const planName = college.subscription_plan || 'standard';
      const defaultDuration = 30;
      const defaultEndDate = college.subscription_expiry || new Date(Date.now() + defaultDuration * 24 * 60 * 60 * 1000);
      subscriptionData = {
        id: `lic_${collegeId.substring(0, 8)}`,
        college_id: collegeId,
        plan: planName,
        status: 'active',
        start_date: new Date(),
        end_date: defaultEndDate,
        amount: planName === 'basic' ? 999 : planName === 'premium' ? 7999 : 2999,
        currency: 'INR',
        max_students: planName === 'basic' ? 50 : planName === 'premium' ? null : 200,
        max_exams: planName === 'basic' ? 10 : planName === 'premium' ? null : 50,
        payment_gateway: 'institutional_license',
        payment_id: `LIC-${collegeId.substring(0, 6).toUpperCase()}-VERIFIED`
      };
    }

    const currentStudents = studentsRes.rows[0]?.count || 0;
    const currentExams = examsRes.rows[0]?.count || 0;
    const currentResults = resultsRes.rows[0]?.count || 0;

    res.json({
      success: true,
      data: {
        subscription: subscriptionData,
        usage: {
          students: currentStudents,
          exams: currentExams,
          results: currentResults,
        },
        studentCount: currentStudents,
        hasSubscription: true,
        plan: subscriptionData?.plan || 'standard',
        plans: PLANS.monthly,
        plansMonthly: PLANS.monthly,
        plansAnnually: PLANS.annually,
        allPlans: PLANS,
        college: {
          id: college.id,
          name: college.name,
          email: college.email,
        }
      }
    });
  } catch (error) {
    console.error('Get current subscription error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to load institutional license quotas',
      error: error.message 
    });
  }
};

/**
 * POST /api/subscriptions/quote-request
 * Submit request for Custom University Quota / Enterprise Volume Requisition
 */
exports.requestCustomQuote = async (req, res) => {
  try {
    const collegeId = req.user.id;
    const { 
      candidateCapacity, 
      examsPerMonth, 
      proctoringType = 'full_ai', 
      contactPerson, 
      contactPhone, 
      notes 
    } = req.body;

    const [collegeRes] = await Promise.all([
      pool.query('SELECT name, email, phone FROM colleges WHERE id = $1', [collegeId])
    ]);
    const college = collegeRes.rows[0] || {};

    const subject = `Enterprise License Quota Request: ${college.name || 'Institution'} (${candidateCapacity || '500+'} seats)`;
    const description = `Institutional Quota Requisition Details:
- Institution: ${college.name} (${college.email})
- Requested Candidate Seats: ${candidateCapacity || 'Custom'}
- Estimated Exams/Month: ${examsPerMonth || 'Custom'}
- Proctoring Level: ${proctoringType}
- Contact Person: ${contactPerson || college.name} (${contactPhone || college.phone || 'N/A'})
- Requisition Notes: ${notes || 'Standard enterprise institutional licensing request'}`;

    // Auto-create ticket in support_tickets table if available
    try {
      await pool.query(
        `INSERT INTO support_tickets 
          (college_id, subject, category, priority, status, description, created_at, updated_at)
         VALUES ($1, $2, 'sales_quote', 'high', 'open', $3, NOW(), NOW())`,
        [collegeId, subject, description]
      );
    } catch (ticketErr) {
      console.warn('Support ticket auto-insert warning (non-fatal):', ticketErr.message);
    }

    res.json({
      success: true,
      message: 'Custom institutional quote request submitted successfully. Our enterprise solutions manager will reach out within 4 business hours.'
    });
  } catch (error) {
    console.error('Quote request error:', error);
    res.status(500).json({ success: false, message: 'Failed to submit quote request', error: error.message });
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
