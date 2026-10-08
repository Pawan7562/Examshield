// controllers/studentController.js - Fixed with Supabase integration
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const csv = require('csv-parser');
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');
const { supabase } = require('../config/supabase');
const { pool } = require('../config/database');
const { sendStudentCredentials } = require('../services/emailService');

/**
 * Generate unique student ID: ES-YYYY-random
 */
const generateStudentId = async (collegeId) => {
  const year = new Date().getFullYear();
  for (let attempts = 0; attempts < 5; attempts++) {
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    const candidate = `ES-${year}-${randomSuffix}`;
    const check = await pool.query('SELECT id FROM students WHERE student_id = $1 LIMIT 1', [candidate]);
    if (check.rows.length === 0) return candidate;
  }
  return `ES-${year}-${Date.now().toString().slice(-4)}${Math.floor(10 + Math.random() * 90)}`;
};

/**
 * Generate secure random password
 */
const generatePassword = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#$';
  let password = '';
  for (let i = 0; i < 10; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

/**
 * GET /api/admin/students
 * Get all students for college
 */
exports.getStudents = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, department } = req.query;
    const collegeId = req.user.id;
    if (!collegeId) {
      return res.status(401).json({ success: false, message: 'Unauthorized college session' });
    }

    const actualLimit = Math.min(Math.max(1, parseInt(limit) || 15), 500);
    const actualPage = Math.max(1, parseInt(page) || 1);
    const actualOffset = (actualPage - 1) * actualLimit;

    const params = [collegeId];
    let whereClause = 'WHERE college_id = $1';

    if (search && search.trim()) {
      params.push(`%${search.trim()}%`);
      whereClause += ` AND (name ILIKE $${params.length} OR email ILIKE $${params.length} OR student_id ILIKE $${params.length} OR roll_no ILIKE $${params.length})`;
    }

    if (department && department.trim() && department.toLowerCase() !== 'all') {
      if (department.toLowerCase() === 'unassigned') {
        whereClause += ` AND (department IS NULL OR TRIM(department) = '')`;
      } else {
        const cleanDept = department.trim();
        if (/^ai[\/&]?ml$/i.test(cleanDept.replace(/\s+/g, ''))) {
          whereClause += ` AND (department ILIKE '%aiml%' OR department ILIKE '%ai&ml%' OR department ILIKE '%ai/ml%' OR department ILIKE '%aimml%')`;
        } else {
          params.push(`%${cleanDept}%`);
          whereClause += ` AND department ILIKE $${params.length}`;
        }
      }
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

    const deptsPromise = pool.query(`
      SELECT DISTINCT department 
      FROM students 
      WHERE college_id = $1 AND department IS NOT NULL AND TRIM(department) != ''
      ORDER BY department ASC
    `, [collegeId]);

    const [countResult, studentsResult, deptsResult] = await Promise.all([countPromise, studentsPromise, deptsPromise]);
    const total = countResult.rows[0]?.count || 0;
    const students = studentsResult.rows || [];
    const departments = (deptsResult.rows || []).map(r => r.department);
    const totalPages = Math.ceil(total / actualLimit);

    res.json({
      success: true,
      data: {
        students,
        total,
        departments,
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
    console.error('Get students error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch students',
      error: error.message
    });
  }
};

/**
 * POST /api/admin/students
 * Add a new student
 */
exports.addStudent = async (req, res) => {
  try {
    const { name, email, rollNo, roll_no, department, batch, phone, semester } = req.body;
    const collegeId = req.user.id;

    if (!collegeId) {
      return res.status(401).json({ success: false, message: 'Unauthorized college session' });
    }

    // Handle both rollNo (frontend) and roll_no (backend) field names
    const rollNumber = rollNo || roll_no;

    // Validate required fields
    if (!name || !email || !rollNumber) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and roll number are required'
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanRoll = rollNumber.trim();

    // Check if student already exists in this college
    const existingCheck = await pool.query(
      'SELECT id, email, roll_no FROM students WHERE (LOWER(email) = $1 OR roll_no = $2) AND college_id = $3 LIMIT 1',
      [cleanEmail, cleanRoll, collegeId]
    );

    if (existingCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'A student with this email or roll number is already registered under your college.'
      });
    }

    // Generate student ID and password
    const studentId = await generateStudentId(collegeId);
    const password = generatePassword();
    const hashedPassword = await bcrypt.hash(password, 12);
    const newStudentUuid = uuidv4();

    const insertRes = await pool.query(
      `INSERT INTO students (id, student_id, name, email, roll_no, department, batch, password, college_id, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true, NOW(), NOW())
       RETURNING *`,
      [newStudentUuid, studentId, name.trim(), cleanEmail, cleanRoll, department?.trim() || null, batch?.trim() || null, hashedPassword, collegeId]
    );

    const student = insertRes.rows[0];

    if (!student) {
      return res.status(500).json({
        success: false,
        message: 'Failed to add student - database insert failed'
      });
    }

    // Look up exam to assign (either specified examId or latest active exam for this college)
    const { examId } = req.body;
    let targetExam = null;
    let effectiveExamKey = null;

    try {
      if (examId) {
        const { data: specifiedExam } = await supabase
          .from('exams')
          .select('*')
          .eq('id', examId)
          .eq('college_id', collegeId)
          .single();
        targetExam = specifiedExam;
      }

      if (!targetExam) {
        const { data: latestExams } = await supabase
          .from('exams')
          .select('*')
          .eq('college_id', collegeId)
          .order('created_at', { ascending: false })
          .limit(1);
        if (latestExams && latestExams.length > 0) {
          targetExam = latestExams[0];
        }
      }

      if (targetExam) {
        effectiveExamKey = targetExam.exam_key || targetExam.exam_code;
        if (!effectiveExamKey) {
          effectiveExamKey = `EXAM-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
          await supabase
            .from('exams')
            .update({ exam_key: effectiveExamKey, exam_code: effectiveExamKey })
            .eq('id', targetExam.id);
        }

        // Insert exam assignment
        await supabase
          .from('exam_assignments')
          .insert([{
            exam_id: targetExam.id,
            student_id: student.id,
            status: 'assigned',
            created_at: new Date().toISOString()
          }]);

        console.log(`✅ Assigned student ${student.id} to exam ${targetExam.title || targetExam.name} with key: ${effectiveExamKey}`);
      }
    } catch (examErr) {
      console.warn('⚠️ Could not complete exam assignment:', examErr.message);
    }

    let emailSent = false;
    try {
      console.log(`\n📧 [addStudent] Attempting email send...`);
      console.log(`   → To: ${cleanEmail}`);
      console.log(`   → EMAIL_USER: ${process.env.EMAIL_USER}`);
      console.log(`   → EMAIL_PASS set: ${!!process.env.EMAIL_PASS}`);
      console.log(`   → College: ${req.user?.name || req.user?.college_name}`);

      // Safe timeout guard: never let email delays block the API response past 8 seconds
      const emailPromise = sendStudentCredentials({
        name: student?.name || name,
        email: cleanEmail,
        studentId,
        password,
        collegeName: req.user?.name || req.user?.college_name || 'Your Institution',
        loginUrl: process.env.STUDENT_LOGIN_URL || 'https://exam.nexifyforge.in/student/login',
        examName: targetExam?.title || targetExam?.name || 'Scheduled Examination',
        examKey: effectiveExamKey,
        examDate: targetExam?.date_time,
        examDuration: targetExam?.duration,
        subject: targetExam?.subject,
        isReset: false
      });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Email dispatch timed out (8s limit)')), 8000)
      );

      await Promise.race([emailPromise, timeoutPromise]);
      emailSent = true;
      console.log(`✅ [addStudent] Credentials email delivered to: ${cleanEmail}`);
    } catch (emailError) {
      console.error(`❌ [addStudent] Email FAILED for ${cleanEmail}:`);
      console.error(`   Code: ${emailError.code}`);
      console.error(`   Message: ${emailError.message}`);
    }

    res.status(201).json({
      success: true,
      message: emailSent
        ? `Student added and credentials email sent with exam key: ${effectiveExamKey || 'N/A'}`
        : 'Student added, but the credentials email could not be sent. Share the displayed credentials securely.',
      data: {
        id: student?.id || 'unknown',
        student_id: student?.student_id || studentId,
        name: student?.name || name,
        email: student?.email || email,
        roll_no: student?.roll_no || rollNumber,
        department: student?.department || 'Not specified',
        batch: student?.batch || 'Not specified',
        emailSent,
        password,
        exam_id: targetExam?.id || null,
        exam_name: targetExam?.title || targetExam?.name || null,
        exam_key: effectiveExamKey || null,
      }
    });

  } catch (error) {
    console.error('Add student error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add student',
      error: error.message
    });
  }
};

/**
 * PUT /api/admin/students/:id
 * Update student
 */
exports.updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, roll_no, rollNo, department, batch, is_active } = req.body;
    const collegeId = req.user.id;
    const rollNumber = rollNo || roll_no;

    const checkRes = await pool.query(
      'SELECT id FROM students WHERE id = $1 AND college_id = $2',
      [id, collegeId]
    );

    if (checkRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Student not found in your institution'
      });
    }

    const updateRes = await pool.query(
      `UPDATE students 
       SET name = COALESCE($1, name),
           email = COALESCE($2, email),
           roll_no = COALESCE($3, roll_no),
           department = COALESCE($4, department),
           batch = COALESCE($5, batch),
           is_active = COALESCE($6, is_active),
           updated_at = NOW()
       WHERE id = $7 AND college_id = $8
       RETURNING *`,
      [
        name ? name.trim() : null,
        email ? email.trim().toLowerCase() : null,
        rollNumber ? rollNumber.trim() : null,
        department !== undefined ? department : null,
        batch !== undefined ? batch : null,
        is_active !== undefined ? is_active : null,
        id,
        collegeId
      ]
    );

    res.json({
      success: true,
      message: 'Student updated successfully',
      data: updateRes.rows[0]
    });

  } catch (error) {
    console.error('Update student error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update student',
      error: error.message
    });
  }
};

/**
 * PATCH /api/admin/students/:id/toggle-status
 * Toggle student active status
 */
exports.toggleStudentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const collegeId = req.user.id;

    const checkRes = await pool.query(
      'SELECT id, is_active FROM students WHERE id = $1 AND college_id = $2',
      [id, collegeId]
    );

    if (checkRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Student not found in your institution'
      });
    }

    const currentStatus = checkRes.rows[0].is_active;
    const newStatus = !currentStatus;

    const updateRes = await pool.query(
      'UPDATE students SET is_active = $1, updated_at = NOW() WHERE id = $2 AND college_id = $3 RETURNING *',
      [newStatus, id, collegeId]
    );

    const updated = updateRes.rows[0];

    res.json({
      success: true,
      message: `Student ${updated.is_active ? 'activated' : 'deactivated'} successfully`,
      data: updated
    });

  } catch (error) {
    console.error('Toggle student status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle student status',
      error: error.message
    });
  }
};

/**
 * DELETE /api/admin/students/:id
 * Delete student with foreign key cascades
 */
exports.deleteStudent = async (req, res) => {
  let client;
  try {
    const { id } = req.params;
    const collegeId = req.user.id;

    client = await pool.connect();

    // Check if student exists in database
    const checkRes = await client.query(
      'SELECT id, name, student_id, college_id FROM students WHERE id::text = $1 OR student_id = $1',
      [id]
    );

    if (checkRes.rows.length === 0) {
      return res.json({
        success: true,
        message: 'Student already deleted or does not exist'
      });
    }

    const student = checkRes.rows[0];

    // Check college authorization
    if (student.college_id && student.college_id !== collegeId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: Student belongs to another institution'
      });
    }

    await client.query('BEGIN');

    // Helper: run a cleanup query with a SAVEPOINT so that if it fails
    // (e.g. table doesn't exist), we rollback only that step and keep
    // the outer transaction alive for the next step.
    const safeDelete = async (label, sql, params) => {
      const sp = `sp_${label.replace(/[^a-z0-9]/gi, '_')}`;
      await client.query(`SAVEPOINT ${sp}`);
      try {
        const r = await client.query(sql, params);
        await client.query(`RELEASE SAVEPOINT ${sp}`);
        if (r.rowCount > 0) console.log(`[deleteStudent] ${label}: removed ${r.rowCount} row(s)`);
      } catch (e) {
        await client.query(`ROLLBACK TO SAVEPOINT ${sp}`);
        await client.query(`RELEASE SAVEPOINT ${sp}`);
        console.warn(`[deleteStudent] skip ${label}: ${e.message}`);
      }
    };

    // Delete in dependency order (children before parents)
    // answers and violations reference exam_sessions → must go first
    await safeDelete('answers',                 'DELETE FROM answers WHERE student_id = $1',                [student.id]);
    await safeDelete('violations',              'DELETE FROM violations WHERE student_id = $1',             [student.id]);
    await safeDelete('results',                 'DELETE FROM results WHERE student_id = $1',                [student.id]);
    await safeDelete('exam_sessions',           'DELETE FROM exam_sessions WHERE student_id = $1',          [student.id]);
    await safeDelete('exam_attempts',           'DELETE FROM exam_attempts WHERE student_id = $1',          [student.id]);
    await safeDelete('student_question_sets',   'DELETE FROM student_question_sets WHERE student_id = $1', [student.id]);
    await safeDelete('exam_assignments',        'DELETE FROM exam_assignments WHERE student_id = $1',       [student.id]);
    await safeDelete('exam_students',           'DELETE FROM exam_students WHERE student_id = $1',          [student.id]);
    await safeDelete('student_password_requests',
      'DELETE FROM student_password_requests WHERE student_uuid = $1 OR student_id = $2',
      [student.id, student.student_id]
    );

    // Finally, delete the student record itself
    await client.query(
      'DELETE FROM students WHERE id = $1',
      [student.id]
    );

    await client.query('COMMIT');
    console.log(`[deleteStudent] ✅ deleted student ${student.id} (${student.name})`);

    res.json({
      success: true,
      message: `Student "${student.name}" deleted successfully`
    });

  } catch (error) {
    if (client) await client.query('ROLLBACK').catch(() => {});
    console.error('[deleteStudent] FATAL:', error.message, '|', error.detail || '', '| code:', error.code);
    res.status(500).json({
      success: false,
      message: 'Failed to delete student',
      error: error.message
    });
  } finally {
    if (client) client.release();
  }
};


/**
 * GET /api/student/profile
 * Get student profile
 */
exports.getStudentProfile = async (req, res) => {
  try {
    const studentId = req.user.id;
    
    const { data: student, error } = await supabase
      .from('students')
      .select('*')
      .eq('id', studentId)
      .single();

    if (error) {
      console.error('Get student profile error:', error);
      throw error;
    }

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Remove password from response
    const { password, ...studentData } = student;

    res.json({
      success: true,
      data: studentData
    });

  } catch (error) {
    console.error('Get student profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get student profile',
      error: error.message
    });
  }
};

/**
 * POST /api/student/change-password
 * Change student password
 */
exports.changePassword = async (req, res) => {
  try {
    console.log('Change password request received:', req.body);
    console.log('User from token:', req.user);
    
    const { currentPassword, newPassword } = req.body;
    const studentId = req.user.id;

    if (!newPassword) {
      console.log('New password is required');
      return res.status(400).json({
        success: false,
        message: 'New password is required'
      });
    }

    // Get current student
    const { data: student, error } = await supabase
      .from('students')
      .select('password, student_id, name, email')
      .eq('id', studentId)
      .single();

    console.log('Student data retrieved:', { student_id: student?.student_id, hasPassword: !!student?.password });

    if (error) {
      console.error('Get student for password change error:', error);
      throw error;
    }

    if (!student) {
      console.log('Student not found');
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Check if student has a password set
    if (!student.password) {
      console.log('Student has no password set, setting first password');
      // If no password exists, just set the new password directly
      const hashedNewPassword = await bcrypt.hash(newPassword, 12);
      
      const { data: updatedStudent, error: updateError } = await supabase
        .from('students')
        .update({
          password: hashedNewPassword,
          updated_at: new Date().toISOString()
        })
        .eq('id', studentId)
        .select()
        .single();

      if (updateError) {
        console.error('Set first password error:', updateError);
        throw updateError;
      }

      console.log('First password set successfully');
      return res.json({
        success: true,
        message: 'Password set successfully'
      });
    }

    // Allow password change without current password for users who don't remember it
    // but require email verification for security
    if (!currentPassword) {
      console.log('No current password provided, checking if we should allow bypass');
      
      // For development/testing purposes, allow password change without current password
      // In production, you might want to require email verification here
      console.log('Allowing password change without current password (development mode)');
      
      // Hash new password
      const hashedNewPassword = await bcrypt.hash(newPassword, 12);

      // Update password
      const { data: updatedStudent, error: updateError } = await supabase
        .from('students')
        .update({
          password: hashedNewPassword,
          updated_at: new Date().toISOString()
        })
        .eq('id', studentId)
        .select()
        .single();

      if (updateError) {
        console.error('Update password error:', updateError);
        throw updateError;
      }

      console.log('Password updated successfully without current password');
      return res.json({
        success: true,
        message: 'Password updated successfully'
      });
    }

    // If current password is provided, verify it
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, student.password);
    console.log('Password verification result:', isCurrentPasswordValid);
    console.log('Password hash exists:', !!student.password);
    console.log('Current password provided:', !!currentPassword);
    
    if (!isCurrentPasswordValid) {
      console.log('Current password verification failed');
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect. Please check your password and try again, or leave it empty if you don\'t remember it.'
      });
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    const { data: updatedStudent, error: updateError } = await supabase
      .from('students')
      .update({
        password: hashedNewPassword,
        updated_at: new Date().toISOString()
      })
      .eq('id', studentId)
      .select()
      .single();

    if (updateError) {
      console.error('Update password error:', updateError);
      throw updateError;
    }

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password',
      error: error.message
    });
  }
};

/**
 * POST /api/admin/students/bulk
 * Bulk upload students from CSV and Excel (.xlsx, .xls) files.
 * Dispatches credentials email to each registered student.
 */
exports.bulkUploadStudents = async (req, res) => {
  let uploadedFilePath = null;
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded. Please upload a CSV (.csv) or Excel (.xlsx, .xls) file.'
      });
    }

    uploadedFilePath = req.file.path;
    const collegeId = req.user.id;

    // 1. Universal Spreadsheet parsing with SheetJS (supports .csv, .xlsx, .xls)
    let rawRows = [];
    try {
      const workbook = xlsx.readFile(uploadedFilePath, { cellDates: true, raw: false });
      const sheetName = workbook.SheetNames[0];
      if (!sheetName) {
        throw new Error('Spreadsheet does not contain any sheets.');
      }
      const worksheet = workbook.Sheets[sheetName];
      rawRows = xlsx.utils.sheet_to_json(worksheet, { defval: '', blankrows: false });
    } catch (parseErr) {
      return res.status(400).json({
        success: false,
        message: `Failed to read spreadsheet: ${parseErr.message}. Please upload a valid CSV or Excel file.`
      });
    }

    if (!Array.isArray(rawRows) || rawRows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'The uploaded file contains no data rows.'
      });
    }

    // 2. Normalization helper to map flexible column headers
    const normalizeRow = (rawRow) => {
      const map = {};
      for (const [key, val] of Object.entries(rawRow)) {
        if (!key) continue;
        const cleanKey = String(key).trim().toLowerCase().replace(/[\s\-_.]+/g, '');
        map[cleanKey] = typeof val === 'string' ? val.trim() : String(val ?? '').trim();
      }

      const name = map['name'] || map['studentname'] || map['fullname'] || map['candidatename'] || map['student'] || '';
      const email = map['email'] || map['studentemail'] || map['emailid'] || map['emailaddress'] || map['mail'] || '';
      const roll_no = map['rollno'] || map['rollnumber'] || map['registrationno'] || map['regno'] || map['registerno'] || map['enrollmentno'] || map['enrollmentnumber'] || map['studentid'] || '';
      const department = map['department'] || map['dept'] || map['branch'] || map['stream'] || map['course'] || '';
      const batch = map['batch'] || map['year'] || map['academicbatch'] || map['session'] || map['class'] || '';
      const semester = map['semester'] || map['sem'] || '';

      return { name, email, roll_no, department, batch, semester };
    };

    // 3. Resolve active or specified exam for this college
    const { examId } = req.body || {};
    let targetExam = null;
    let effectiveExamKey = null;

    try {
      if (examId) {
        const { data: specifiedExam } = await supabase
          .from('exams')
          .select('*')
          .eq('id', examId)
          .eq('college_id', collegeId)
          .single();
        targetExam = specifiedExam;
      }

      if (!targetExam) {
        const { data: latestExams } = await supabase
          .from('exams')
          .select('*')
          .eq('college_id', collegeId)
          .order('created_at', { ascending: false })
          .limit(1);
        if (latestExams && latestExams.length > 0) {
          targetExam = latestExams[0];
        }
      }

      if (targetExam) {
        effectiveExamKey = targetExam.exam_key || targetExam.exam_code;
        if (!effectiveExamKey) {
          effectiveExamKey = `EXAM-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
          await supabase
            .from('exams')
            .update({ exam_key: effectiveExamKey, exam_code: effectiveExamKey })
            .eq('id', targetExam.id);
        }
      }
    } catch (examErr) {
      console.warn('⚠️ Could not resolve target exam for bulk upload:', examErr.message);
    }

    // 4. Validate rows, insert students into database
    const createdStudents = [];
    const errors = [];
    const seenEmails = new Set();
    const seenRolls = new Set();

    for (let i = 0; i < rawRows.length; i++) {
      const rowNum = i + 2; // spreadsheet 1-indexed row accounting for header
      const norm = normalizeRow(rawRows[i]);

      // Skip completely empty rows
      if (!norm.name && !norm.email && !norm.roll_no) {
        continue;
      }

      if (!norm.name) {
        errors.push(`Row ${rowNum}: Student Name is missing.`);
        continue;
      }
      if (!norm.email) {
        errors.push(`Row ${rowNum} (${norm.name}): Email address is missing.`);
        continue;
      }
      if (!norm.email.includes('@') || !norm.email.includes('.')) {
        errors.push(`Row ${rowNum} (${norm.name}): Invalid email address "${norm.email}".`);
        continue;
      }
      if (!norm.roll_no) {
        errors.push(`Row ${rowNum} (${norm.name}): Roll Number is missing.`);
        continue;
      }

      const cleanEmail = norm.email.toLowerCase();
      const cleanRoll = norm.roll_no;

      if (seenEmails.has(cleanEmail)) {
        errors.push(`Row ${rowNum}: Duplicate email "${cleanEmail}" in uploaded file.`);
        continue;
      }
      if (seenRolls.has(cleanRoll)) {
        errors.push(`Row ${rowNum}: Duplicate roll number "${cleanRoll}" in uploaded file.`);
        continue;
      }

      // Check if student already exists in this college
      const existingCheck = await pool.query(
        'SELECT id, email, roll_no FROM students WHERE (LOWER(email) = $1 OR roll_no = $2) AND college_id = $3 LIMIT 1',
        [cleanEmail, cleanRoll, collegeId]
      );

      if (existingCheck.rows.length > 0) {
        const match = existingCheck.rows[0];
        const matchReason = match.email?.toLowerCase() === cleanEmail ? `Email ${cleanEmail}` : `Roll number ${cleanRoll}`;
        errors.push(`Row ${rowNum} (${norm.name}): ${matchReason} is already registered in your institution.`);
        continue;
      }

      seenEmails.add(cleanEmail);
      seenRolls.add(cleanRoll);

      try {
        const studentId = await generateStudentId(collegeId);
        const password = generatePassword();
        const hashedPassword = await bcrypt.hash(password, 12);
        const newUuid = uuidv4();

        // If semester is provided and batch is provided, preserve both
        const batchValue = norm.batch ? norm.batch : (norm.semester ? `Sem ${norm.semester}` : null);

        const insertRes = await pool.query(
          `INSERT INTO students (id, student_id, name, email, roll_no, department, batch, password, college_id, is_active, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true, NOW(), NOW())
           RETURNING *`,
          [newUuid, studentId, norm.name, cleanEmail, cleanRoll, norm.department || null, batchValue, hashedPassword, collegeId]
        );

        const createdStudent = insertRes.rows[0];

        // Assign to target exam if present
        if (targetExam) {
          try {
            await supabase
              .from('exam_assignments')
              .insert([{
                exam_id: targetExam.id,
                student_id: createdStudent.id,
                status: 'assigned',
                created_at: new Date().toISOString()
              }]);
          } catch (assignErr) {
            console.warn(`[bulkUpload] Exam assignment error for ${cleanEmail}:`, assignErr.message);
          }
        }

        createdStudents.push({
          id: createdStudent.id,
          student_id: studentId,
          name: norm.name,
          email: cleanEmail,
          roll_no: cleanRoll,
          department: norm.department,
          batch: batchValue,
          password
        });
      } catch (insertErr) {
        errors.push(`Row ${rowNum} (${norm.name}): Database insert failed - ${insertErr.message}`);
      }
    }

    // 5. Send credentials email to EACH created student in parallel batches
    let emailsSent = 0;
    let emailsFailed = 0;
    const collegeName = req.user?.name || req.user?.college_name || 'Your Institution';
    const loginUrl = process.env.STUDENT_LOGIN_URL || 'https://exam.nexifyforge.in/student/login';

    if (createdStudents.length > 0) {
      console.log(`\n📧 [bulkUpload] Dispatched emails for ${createdStudents.length} students to ${collegeName}...`);
      const BATCH_SIZE = 5;
      for (let i = 0; i < createdStudents.length; i += BATCH_SIZE) {
        const batch = createdStudents.slice(i, i + BATCH_SIZE);
        const results = await Promise.allSettled(
          batch.map(student =>
            sendStudentCredentials({
              name: student.name,
              email: student.email,
              studentId: student.student_id,
              password: student.password,
              collegeName: collegeName,
              loginUrl: loginUrl,
              examName: targetExam?.title || targetExam?.name || 'Scheduled Examination',
              examKey: effectiveExamKey,
              examDate: targetExam?.date_time,
              examDuration: targetExam?.duration,
              subject: targetExam?.subject,
              isReset: false
            })
          )
        );

        results.forEach((outcome, idx) => {
          if (outcome.status === 'fulfilled') {
            emailsSent++;
            console.log(`   ✅ [bulkUpload] Email delivered to: ${batch[idx].email}`);
          } else {
            emailsFailed++;
            console.error(`   ❌ [bulkUpload] Email failed for ${batch[idx].email}:`, outcome.reason?.message);
          }
        });
      }
    }

    res.json({
      success: true,
      message: `Bulk upload completed. ${createdStudents.length} student(s) added, ${emailsSent} email(s) sent.${errors.length > 0 ? ` ${errors.length} row(s) skipped.` : ''}`,
      data: {
        created: createdStudents.length,
        emailsSent,
        emailsFailed,
        failed: errors.length,
        uploaded: createdStudents,
        errors
      }
    });

  } catch (error) {
    console.error('Bulk upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Bulk upload failed: ' + error.message,
      error: error.message
    });
  } finally {
    // 6. Guarantee cleanup of temporary uploaded spreadsheet file
    if (uploadedFilePath && fs.existsSync(uploadedFilePath)) {
      try {
        fs.unlinkSync(uploadedFilePath);
      } catch (unlinkErr) {
        console.warn('⚠️ Could not remove temp upload file:', unlinkErr.message);
      }
    }
  }
};

/**
 * POST /api/admin/students/:id/reset-password
 * College Admin resets password for a student (auto-generated or manual)
 */
exports.resetStudentPassword = async (req, res) => {
  try {
    const studentId = req.params.id;
    const collegeId = req.user.id;
    const { newPassword, autoGenerate = true, notifyStudent = true, notifyEmail } = req.body;

    // Check if student belongs to this college
    const studentCheck = await pool.query(
      'SELECT id, student_id, name, email, roll_no FROM students WHERE id = $1 AND college_id = $2',
      [studentId, collegeId]
    );

    if (studentCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Student not found in your institution.' });
    }

    const student = studentCheck.rows[0];

    // Determine password
    let passwordToSet = newPassword;
    if (autoGenerate || !passwordToSet || !passwordToSet.trim()) {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#$';
      passwordToSet = '';
      for (let i = 0; i < 10; i++) {
        passwordToSet += chars.charAt(Math.floor(Math.random() * chars.length));
      }
    }

    if (passwordToSet.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }

    const hashedPassword = await bcrypt.hash(passwordToSet, 10);

    // Update in database
    await pool.query(
      'UPDATE students SET password = $1, updated_at = NOW() WHERE id = $2 AND college_id = $3',
      [hashedPassword, studentId, collegeId]
    );

    // Mark any pending password reset requests for this student as resolved
    await pool.query(
      `UPDATE student_password_requests 
       SET status = 'resolved', admin_notes = 'Password reset by College Admin directly', resolved_by = $1, resolved_at = NOW(), updated_at = NOW() 
       WHERE (student_uuid = $2 OR student_id = $3 OR student_email = $4) AND college_id = $1 AND status = 'pending'`,
      [collegeId, studentId, student.student_id, student.email]
    );

    // Email dispatch: respect notifyEmail (passed from frontend) or notifyStudent
    const shouldNotify = (notifyEmail !== undefined ? notifyEmail : notifyStudent) !== false;
    let emailSent = false;
    if (shouldNotify && student.email) {
      try {
        await sendStudentCredentials({
          name: student.name,
          email: student.email,
          studentId: student.student_id,
          password: passwordToSet,
          collegeName: req.user?.name || req.user?.college_name || 'Your Institution',
          loginUrl: process.env.STUDENT_LOGIN_URL || 'https://exam.nexifyforge.in/student/login',
          isReset: true
        });
        emailSent = true;
        console.log(`✅ Password reset credentials successfully sent to student: ${student.email}`);
      } catch (mailErr) {
        console.warn('Student credential dispatch warning (non-fatal):', mailErr.message);
      }
    }

    res.json({
      success: true,
      message: `Password for ${student.name} (${student.student_id}) has been reset successfully!`,
      emailSent,
      data: {
        student: {
          id: student.id,
          name: student.name,
          studentId: student.student_id,
          email: student.email,
        },
        temporaryPassword: passwordToSet,
        newPassword: passwordToSet,
        emailSent,
        loginUrl: process.env.STUDENT_LOGIN_URL || 'https://exam.nexifyforge.in/student/login'
      }
    });

  } catch (error) {
    console.error('Reset student password error:', error);
    res.status(500).json({ success: false, message: 'Failed to reset student password', error: error.message });
  }
};

/**
 * GET /api/admin/students/password-requests
 * Fetch all student password reset assistance requests for college
 */
exports.getPasswordRequests = async (req, res) => {
  try {
    const collegeId = req.user.id;
    const { status = 'all' } = req.query;

    let query = `
      SELECT r.*, s.name as current_name, s.email as current_email, s.is_active
      FROM student_password_requests r
      LEFT JOIN students s ON r.student_uuid = s.id
      WHERE r.college_id = $1
    `;
    const params = [collegeId];

    if (status && status !== 'all') {
      params.push(status);
      query += ` AND r.status = $${params.length}`;
    }

    query += ` ORDER BY r.created_at DESC LIMIT 100`;

    const result = await pool.query(query, params);
    const requests = result.rows || [];
    const pendingCount = requests.filter(r => r.status === 'pending').length;

    res.json({
      success: true,
      data: {
        requests,
        pendingCount
      }
    });
  } catch (error) {
    console.error('Get password requests error:', error);
    res.status(500).json({ success: false, message: 'Failed to load password requests', error: error.message });
  }
};

/**
 * POST /api/admin/students/password-requests/:id/resolve
 * College Admin resolves or dismisses a student password reset request
 */
exports.resolvePasswordRequest = async (req, res) => {
  try {
    const requestId = req.params.id;
    const collegeId = req.user.id;
    const { action = 'reset', newPassword, notes = '' } = req.body;

    const requestRes = await pool.query(
      'SELECT * FROM student_password_requests WHERE id = $1 AND college_id = $2',
      [requestId, collegeId]
    );

    if (requestRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Password reset request not found.' });
    }

    const reqData = requestRes.rows[0];

    if (action === 'dismiss' || action === 'reject') {
      await pool.query(
        `UPDATE student_password_requests 
         SET status = 'rejected', admin_notes = $1, resolved_by = $2, resolved_at = NOW(), updated_at = NOW() 
         WHERE id = $3`,
        [notes || 'Dismissed by administrator', collegeId, requestId]
      );

      return res.json({
        success: true,
        message: 'Password reset request dismissed.'
      });
    }

    // Action: reset
    let passwordToSet = newPassword;
    if (!passwordToSet || !passwordToSet.trim()) {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#$';
      passwordToSet = '';
      for (let i = 0; i < 10; i++) {
        passwordToSet += chars.charAt(Math.floor(Math.random() * chars.length));
      }
    }

    const hashedPassword = await bcrypt.hash(passwordToSet, 10);

    // Update student
    await pool.query(
      'UPDATE students SET password = $1, updated_at = NOW() WHERE id = $2 AND college_id = $3',
      [hashedPassword, reqData.student_uuid, collegeId]
    );

    // Mark request as resolved
    await pool.query(
      `UPDATE student_password_requests 
       SET status = 'resolved', admin_notes = $1, resolved_by = $2, resolved_at = NOW(), updated_at = NOW() 
       WHERE id = $3`,
      [notes || 'Approved & Reset by Administrator', collegeId, requestId]
    );

    // Also mark any other pending requests for the same student as resolved
    await pool.query(
      `UPDATE student_password_requests 
       SET status = 'resolved', admin_notes = 'Batch resolved with active request', resolved_by = $1, resolved_at = NOW(), updated_at = NOW() 
       WHERE student_uuid = $2 AND college_id = $1 AND status = 'pending'`,
      [collegeId, reqData.student_uuid]
    );

    // Send email to student
    let emailSent = false;
    if (reqData.student_email) {
      try {
        await sendStudentCredentials({
          name: reqData.student_name,
          email: reqData.student_email,
          studentId: reqData.student_id,
          password: passwordToSet,
          collegeName: req.user?.name || req.user?.college_name || 'Your Institution',
          loginUrl: process.env.STUDENT_LOGIN_URL || 'https://exam.nexifyforge.in/student/login',
          isReset: true
        });
        emailSent = true;
        console.log(`✅ Password reset email sent via request resolution to: ${reqData.student_email}`);
      } catch (err) {
        console.warn('Email send warning (non-fatal):', err.message);
      }
    }

    res.json({
      success: true,
      message: `Password for ${reqData.student_name} (${reqData.student_id}) has been reset!`,
      emailSent,
      data: {
        temporaryPassword: passwordToSet,
        newPassword: passwordToSet,
        studentId: reqData.student_id,
        studentName: reqData.student_name,
        email: reqData.student_email,
        emailSent
      }
    });

  } catch (error) {
    console.error('Resolve password request error:', error);
    res.status(500).json({ success: false, message: 'Failed to resolve request', error: error.message });
  }
};

/**
 * POST /api/admin/students/:id/resend-credentials
 * Resend credentials email to student
 */
exports.resendStudentCredentials = async (req, res) => {
  try {
    const { id } = req.params;
    const collegeId = req.user.id;

    const checkRes = await pool.query(
      'SELECT id, student_id, name, email, roll_no FROM students WHERE (id::text = $1 OR student_id = $1) AND college_id = $2',
      [id, collegeId]
    );

    if (checkRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Student not found in your institution' });
    }

    const student = checkRes.rows[0];

    // Generate a fresh temporary password so the student can definitely log in
    const newPassword = generatePassword();
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await pool.query(
      'UPDATE students SET password = $1, updated_at = NOW() WHERE id = $2 AND college_id = $3',
      [hashedPassword, student.id, collegeId]
    );

    // Look up assigned exam if any
    let targetExam = null;
    let effectiveExamKey = null;

    try {
      const { data: assignments } = await supabase
        .from('exam_assignments')
        .select('exam_id, exams(*)')
        .eq('student_id', student.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (assignments && assignments[0]?.exams) {
        targetExam = assignments[0].exams;
        effectiveExamKey = targetExam.exam_key || targetExam.exam_code;
      }
    } catch (_) {}

    let emailSent = false;
    try {
      // Safe timeout guard: never let email delays block the API response past 8 seconds
      const emailPromise = sendStudentCredentials({
        name: student.name,
        email: student.email,
        studentId: student.student_id,
        password: newPassword,
        collegeName: req.user?.name || req.user?.college_name || 'Your Institution',
        loginUrl: process.env.STUDENT_LOGIN_URL || 'https://exam.nexifyforge.in/student/login',
        examName: targetExam?.title || targetExam?.name || 'Scheduled Examination',
        examKey: effectiveExamKey,
        examDate: targetExam?.date_time,
        examDuration: targetExam?.duration,
        subject: targetExam?.subject,
        isReset: false
      });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Email dispatch timed out (8s limit)')), 8000)
      );

      await Promise.race([emailPromise, timeoutPromise]);
      emailSent = true;
      console.log(`✅ Credentials email resent to: ${student.email}`);
    } catch (mailErr) {
      console.error('Failed to send credentials email:', mailErr.message);
    }

    res.json({
      success: true,
      message: emailSent
        ? `Credentials email sent successfully to ${student.email}`
        : `Password generated for ${student.name}, but email delivery failed. Please copy credentials manually.`,
      emailSent,
      data: {
        id: student.id,
        student_id: student.student_id,
        name: student.name,
        email: student.email,
        password: newPassword,
        exam_key: effectiveExamKey,
        emailSent
      }
    });

  } catch (err) {
    console.error('Resend credentials error:', err);
    res.status(500).json({ success: false, message: 'Failed to resend credentials email', error: err.message });
  }
};
