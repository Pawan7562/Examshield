// create-admin-controller.js - Create admin controller with Supabase
const { supabase } = require('../config/supabase');

exports.getDashboard = async (req, res) => {
  try {
    const collegeId = req.user.id;
    
    // Get basic stats
    const [
      { count: totalStudents },
      { count: totalExams },
      { count: totalResults },
      { data: upcomingExams }
    ] = await Promise.all([
      supabase.from('students').select('*', { count: 'exact', head: true }).eq('college_id', collegeId),
      supabase.from('exams').select('*', { count: 'exact', head: true }).eq('college_id', collegeId),
      supabase.from('results').select('*', { count: 'exact', head: true }),
      supabase.from('exams').select('*').eq('college_id', collegeId).in('status', ['published', 'active']).gt('date_time', new Date().toISOString()).order('date_time', { ascending: true }).limit(5)
    ]);
    
    res.json({
      success: true,
      data: {
        stats: {
          totalStudents: totalStudents || 0,
          totalExams: totalExams || 0,
          totalResults: totalResults || 0,
        },
        upcomingExams: upcomingExams || [],
      }
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
    
    let query = supabase
      .from('exams')
      .select('*', { count: 'exact' })
      .eq('college_id', collegeId)
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1)
      .order('created_at', { ascending: false });
    
    if (status) {
      query = query.eq('status', status);
    }
    
    const { data: exams, error, count } = await query;
    
    if (error) throw error;
    
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
