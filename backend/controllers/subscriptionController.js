// controllers/subscriptionController.js
const Razorpay = require('razorpay');
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
// SUPER ADMIN CONTROLLER
// =====================================================

/**
 * GET /api/super-admin/dashboard
 */
exports.getSuperAdminDashboard = async (req, res) => {
  try {
    const [colleges, students, exams, revenue] = await Promise.all([
      supabase.from('colleges').select('id, is_active'),
      supabase.from('students').select('id'),
      supabase.from('exams').select('id'),
      supabase.from('subscriptions').select('amount').eq('status', 'active'),
    ]);

    const collegesData = colleges.data || [];
    const studentsData = students.data || [];
    const examsData = exams.data || [];
    const revenueData = revenue.data || [];

    const recentColleges = await supabase
      .from('colleges')
      .select('id, name, email, subscription_plan, is_active, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    const planDistribution = await supabase
      .from('colleges')
      .select('subscription_plan')
      .then(result => {
        const plans = result.data || [];
        const distribution = {};
        plans.forEach(college => {
          distribution[college.subscription_plan] = (distribution[college.subscription_plan] || 0) + 1;
        });
        return distribution;
      });

    res.json({
      success: true,
      data: {
        stats: {
          totalColleges: collegesData.length,
          activeColleges: collegesData.filter(c => c.is_active).length,
          totalStudents: studentsData.length,
          totalExams: examsData.length,
          totalRevenue: revenueData.reduce((sum, r) => sum + (r.amount || 0), 0),
        },
        recentColleges: recentColleges.data || [],
        planDistribution,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard', error: error.message });
  }
};

/**
 * GET /api/super-admin/colleges
 */
exports.getAllColleges = async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    
    let query = supabase
      .from('colleges')
      .select(`
        *,
        students(count)
      `, { count: 'exact' });

    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data: colleges, error, count } = await query
      .range((page - 1) * limit, page * limit - 1)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data: {
        colleges: colleges || [],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count || 0,
          pages: Math.ceil((count || 0) / limit),
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch colleges', error: error.message });
  }
};

/**
 * PATCH /api/super-admin/colleges/:id/toggle
 */
exports.toggleCollegeStatus = async (req, res) => {
  try {
    const { id } = req.params;
    
    // First get current status
    const { data: currentCollege, error: fetchError } = await supabase
      .from('colleges')
      .select('is_active')
      .eq('id', id)
      .single();
    
    if (fetchError || !currentCollege) {
      return res.status(404).json({ success: false, message: 'College not found.' });
    }
    
    // Toggle status
    const { data: college, error: updateError } = await supabase
      .from('colleges')
      .update({ is_active: !currentCollege.is_active })
      .eq('id', id)
      .select('id, name, is_active')
      .single();
    
    if (updateError || !college) {
      return res.status(404).json({ success: false, message: 'College not found.' });
    }
    
    res.json({
      success: true,
      message: `College ${college.is_active ? 'activated' : 'suspended'}.`,
      data: { college },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Status update failed', error: error.message });
  }
};
