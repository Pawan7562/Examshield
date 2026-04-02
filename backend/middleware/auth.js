// middleware/auth.js
const jwt = require('jsonwebtoken');
const { supabase } = require('../config/supabase-clean');

/**
 * Verify JWT token and attach user to request
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch user based on role using Supabase
    let user = null;
    
    if (decoded.role === 'super_admin') {
      const { data, error } = await supabase
        .from('super_admins')
        .select('id, name, email')
        .eq('id', decoded.id)
        .limit(1);
      user = data?.[0];
    } else if (decoded.role === 'college_admin') {
      const { data, error } = await supabase
        .from('colleges')
        .select('id, name, email, subscription_plan, subscription_expiry, is_active')
        .eq('id', decoded.id)
        .limit(1);
      user = data?.[0];
      if (user && user.is_active === false) {
        return res.status(403).json({ success: false, message: 'Account has been deactivated.' });
      }
    } else if (decoded.role === 'student') {
      const { data, error } = await supabase
        .from('students')
        .select('id, student_id, name, email, college_id, is_active')
        .eq('id', decoded.id)
        .limit(1);
      user = data?.[0];
      if (user && user.is_active === false) {
        return res.status(403).json({ success: false, message: 'Your account has been deactivated.' });
      }
    }

    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found.' });
    }

    req.user = { ...user, role: decoded.role };
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired. Please log in again.' });
    }
    return res.status(401).json({ success: false, message: 'Invalid token.' });
  }
};

/**
 * Role-based access control middleware
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.',
      });
    }
    next();
  };
};

/**
 * Check active subscription for college admins
 */
const checkSubscription = async (req, res, next) => {
  if (req.user.role !== 'college_admin') return next();
  
  const { subscription_expiry } = req.user;
  // Allow access if no subscription expiry is set (trial or lifetime)
  if (!subscription_expiry) {
    return next();
  }
  
  // Check if subscription is expired
  if (new Date(subscription_expiry) < new Date()) {
    return res.status(403).json({
      success: false,
      message: 'Your subscription has expired. Please renew to continue.',
      code: 'SUBSCRIPTION_EXPIRED',
    });
  }
  next();
};

/**
 * Log audit trail using Supabase
 */
const auditLog = (action, resourceType) => async (req, res, next) => {
  const originalJson = res.json.bind(res);
  res.json = (data) => {
    if (data.success !== false && req.user) {
      supabase
        .from('audit_logs')
        .insert([{
          actor_id: req.user.id,
          actor_type: req.user.role,
          action: action,
          resource_type: resourceType,
          resource_id: data.data?.id || req.params.id || null,
          details: { method: req.method, path: req.path },
          ip_address: req.ip,
          user_agent: req.get('User-Agent'),
          created_at: new Date().toISOString()
        }])
        .catch(() => {}); // Non-blocking
    }
    return originalJson(data);
  };
  next();
};

module.exports = { authenticate, authorize, checkSubscription, auditLog };
