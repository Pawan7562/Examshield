const { pool } = require('../config/database');
const { supabase } = require('../config/supabase');
const { toISTISOString } = require('../utils/timezone');

// Ultra-fast in-memory cache for college dashboard (15-second TTL)
const dashboardCache = new Map();
const DASHBOARD_CACHE_TTL = 15000;

exports.getDashboard = async (req, res) => {
  try {
    const collegeId = req.user.id;
    const now = Date.now();

    // 1. Instant Cache Hit Check (< 1ms response)
    const cached = dashboardCache.get(collegeId);
    if (cached && (now - cached.timestamp < DASHBOARD_CACHE_TTL)) {
      return res.json({
        success: true,
        data: cached.data,
      });
    }

    // 2. High-speed single consolidated query to Neon
    const statsPromise = pool.query(`
      SELECT 
        (SELECT COUNT(*)::int FROM students WHERE college_id = $1) AS total_students,
        (SELECT COUNT(*)::int FROM exams WHERE college_id = $1) AS total_exams,
        (SELECT COUNT(*)::int FROM results r JOIN exams e ON r.exam_id = e.id WHERE e.college_id = $1) AS total_results
    `, [collegeId]);

    const upcomingPromise = pool.query(`
      SELECT * FROM exams 
      WHERE college_id = $1 
        AND status IN ('published', 'active') 
        AND date_time > $2 
      ORDER BY date_time ASC 
      LIMIT 5
    `, [collegeId, toISTISOString(new Date())]);

    const [statsRes, upcomingRes] = await Promise.all([statsPromise, upcomingPromise]);
    const statsRow = statsRes.rows[0] || {};

    const dashboardData = {
      stats: {
        totalStudents: statsRow.total_students || 0,
        totalExams: statsRow.total_exams || 0,
        totalResults: statsRow.total_results || 0,
      },
      upcomingExams: upcomingRes.rows || [],
    };

    // Store in memory cache
    dashboardCache.set(collegeId, {
      timestamp: now,
      data: dashboardData,
    });

    res.json({
      success: true,
      data: dashboardData
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load dashboard data'
    });
  }
};

exports.getStudents = async (req, res) => {
  try {
    const collegeId = req.user.id;
    const { limit = 50, search = '', page = 1 } = req.query;
    const actualLimit = parseInt(limit);
    const actualOffset = (parseInt(page) - 1) * actualLimit;
    
    let query = supabase
      .from('students')
      .select('*', { count: 'exact' })
      .eq('college_id', collegeId)
      .range(actualOffset, actualOffset + actualLimit - 1);
    
    // Apply search filters only if columns exist
    if (search) {
      // Try to search by name, email, and student_id only (skip roll_no if it doesn't exist)
      try {
        query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,student_id.ilike.%${search}%`);
      } catch (searchError) {
        console.log('Search filter error (missing roll_no column):', searchError.message);
        // Fallback to name and email only
        query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
      }
    }
    
    // Apply other filters only if columns exist
    if (req.query.isActive !== undefined) {
      try {
        query = query.eq('is_active', req.query.isActive === 'true');
      } catch (error) {
        console.log('is_active filter error:', error.message);
      }
    }
    // Removed department and batch filters as they don't exist in students table
    
    const { data: students, error, count } = await query;
    
    if (error) {
      console.error('Students query error:', error);
      // Handle column-specific errors gracefully
      if (error.message.includes('column') || error.message.includes('does not exist')) {
        return res.status(400).json({
          success: false,
          message: 'Some search filters are not available. Please check database schema.',
          error: 'Database schema issue - some columns may not exist'
        });
      }
      throw error;
    }
    
    // Calculate pagination
    const total = count || 0;
    const totalPages = Math.ceil(total / actualLimit);
    
    res.json({
      success: true,
      data: {
        students: students || [],
        total: total,
        pagination: {
          page: parseInt(page),
          limit: actualLimit,
          pages: totalPages,
          hasNext: parseInt(page) < totalPages,
          hasPrev: parseInt(page) > 1
        }
      }
    });
    
  } catch (error) {
    console.error('Students error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load students',
      error: error.message
    });
  }
};

exports.getExams = async (req, res) => {
  try {
    const collegeId = req.user.id;
    const { limit = 50, offset = 0, status } = req.query;
    
    const parsedLimit = Math.min(Math.max(1, parseInt(limit) || 50), 100);
    const parsedOffset = Math.max(0, parseInt(offset) || 0);

    const params = [collegeId];
    let whereClause = 'WHERE college_id = $1';
    if (status && status !== 'all') {
      params.push(status);
      whereClause += ` AND status = $${params.length}`;
    }

    const countPromise = pool.query(`SELECT COUNT(*)::int AS total FROM exams ${whereClause}`, params);
    const examsParams = [...params, parsedLimit, parsedOffset];
    const examsPromise = pool.query(`
      SELECT * FROM exams 
      ${whereClause} 
      ORDER BY created_at DESC 
      LIMIT $${examsParams.length - 1} OFFSET $${examsParams.length}
    `, examsParams);

    const [countResult, examsResult] = await Promise.all([countPromise, examsPromise]);
    const exams = examsResult.rows || [];
    const count = countResult.rows[0]?.total || 0;
    
    res.json({
      success: true,
      data: { exams: exams || [], total: count || 0 }
    });
    
  } catch (error) {
    console.error('Exams error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load exams'
    });
  }
};

exports.getNotifications = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('recipient_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(20);
    
    if (error) throw error;
    res.json({ success: true, data: { notifications: data || [] } });
  } catch (error) {
    console.error('Notifications error:', error);
    res.status(500).json({ success: false, message: 'Failed to load notifications' });
  }
};

module.exports = {
  getDashboard: exports.getDashboard,
  getStudents: exports.getStudents,
  getExams: exports.getExams,
  getNotifications: exports.getNotifications
};
