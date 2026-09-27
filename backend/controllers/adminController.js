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
    const collegeId = req.user?.id;
    if (!collegeId) {
      return res.status(401).json({ success: false, message: 'Unauthorized college session' });
    }

    const { limit = 50, search = '', page = 1 } = req.query;
    const actualLimit = Math.min(Math.max(1, parseInt(limit) || 15), 500);
    const actualPage = Math.max(1, parseInt(page) || 1);
    const actualOffset = (actualPage - 1) * actualLimit;

    const params = [collegeId];
    let whereClause = 'WHERE college_id = $1';

    if (search && search.trim()) {
      params.push(`%${search.trim()}%`);
      whereClause += ` AND (name ILIKE $${params.length} OR email ILIKE $${params.length} OR student_id ILIKE $${params.length} OR roll_no ILIKE $${params.length})`;
    }

    const countPromise = pool.query(`SELECT COUNT(*)::int AS count FROM students ${whereClause}`, params);
    const queryParams = [...params, actualLimit, actualOffset];
    const studentsPromise = pool.query(`
      SELECT id, student_id, name, email, roll_no, department, batch, is_active, created_at, updated_at, college_id 
      FROM students 
      ${whereClause} 
      ORDER BY created_at DESC 
      LIMIT $${queryParams.length - 1} OFFSET $${queryParams.length}
    `, queryParams);

    const [countResult, studentsResult] = await Promise.all([countPromise, studentsPromise]);
    const total = countResult.rows[0]?.count || 0;
    const students = studentsResult.rows || [];
    const totalPages = Math.ceil(total / actualLimit);

    res.json({
      success: true,
      data: {
        students,
        total,
        pagination: {
          page: actualPage,
          limit: actualLimit,
          pages: totalPages,
          hasNext: actualPage < totalPages,
          hasPrev: actualPage > 1,
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
    const { limit = 50, offset = 0, status, search } = req.query;
    
    const parsedLimit = Math.min(Math.max(1, parseInt(limit) || 50), 100);
    const parsedOffset = Math.max(0, parseInt(offset) || 0);

    const params = [collegeId];
    let whereClause = 'WHERE college_id = $1';
    if (status && status !== 'all') {
      params.push(status);
      whereClause += ` AND status = $${params.length}`;
    }

    if (search && search.trim()) {
      params.push(`%${search.trim()}%`);
      whereClause += ` AND (COALESCE(title, name, '') ILIKE $${params.length} OR COALESCE(description, '') ILIKE $${params.length})`;
    }

    const countPromise = pool.query(`SELECT COUNT(*)::int AS total FROM exams ${whereClause}`, params);
    const examsParams = [...params, parsedLimit, parsedOffset];
    const examsPromise = pool.query(`
      SELECT e.*, 
             COALESCE(e.title, e.name, 'Untitled Exam') AS name, 
             COALESCE(e.title, e.name, 'Untitled Exam') AS title,
             COALESCE((SELECT COUNT(*)::int FROM questions q WHERE q.exam_id = e.id), 0) AS question_count,
             COALESCE((
               SELECT COUNT(DISTINCT student_id)::int 
               FROM (
                 SELECT student_id FROM exam_assignments ea WHERE ea.exam_id = e.id
                 UNION
                 SELECT student_id FROM exam_students es WHERE es.exam_id = e.id
               ) assigned
             ), 0) AS student_count
      FROM exams e
      ${whereClause.replace(/college_id/g, 'e.college_id').replace(/status/g, 'e.status').replace(/title/g, 'e.title').replace(/name/g, 'e.name').replace(/description/g, 'e.description')} 
      ORDER BY e.created_at DESC 
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
      message: 'Failed to load exams',
      error: error.message
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
