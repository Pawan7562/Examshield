// controllers/studentController.js - Fixed with Supabase integration
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const csv = require('csv-parser');
const fs = require('fs');
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
    const { page = 1, limit = 20, search } = req.query;
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
      await sendStudentCredentials({
        name,
        email,
        studentId,
        password,
        collegeName: req.user.name || 'Your Institution',
        loginUrl: process.env.STUDENT_LOGIN_URL || 'http://localhost:3000/student/login',
        examName: targetExam?.title || targetExam?.name || 'Scheduled Examination',
        examKey: effectiveExamKey,
        examDate: targetExam?.date_time,
        examDuration: targetExam?.duration,
        subject: targetExam?.subject
      });
      emailSent = true;
    } catch (emailError) {
      console.error('Student credentials email failed:', {
        code: emailError.code,
        message: emailError.message,
      });
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

    const updatePayload = {
      ...(name && { name }),
      ...(email && { email }),
      ...(rollNumber && { roll_no: rollNumber }),
      ...(department !== undefined && { department }),
      ...(batch !== undefined && { batch }),
      ...(is_active !== undefined && { is_active }),
      updated_at: new Date().toISOString()
    };

    const { data: student, error } = await supabase
      .from('students')
      .update(updatePayload)
      .eq('id', id)
      .eq('college_id', collegeId)
      .select()
      .single();

    if (error) {
      console.error('Student update error:', error);
      throw error;
    }

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    res.json({
      success: true,
      message: 'Student updated successfully',
      data: student
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

    const { data: currentStudent } = await supabase
      .from('students')
      .select('is_active')
      .eq('id', id)
      .eq('college_id', collegeId)
      .single();

    if (!currentStudent) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    const { data: student, error } = await supabase
      .from('students')
      .update({
        is_active: !currentStudent.is_active,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('college_id', collegeId)
      .select()
      .single();

    if (error) {
      console.error('Toggle student status error:', error);
      throw error;
    }

    res.json({
      success: true,
      message: `Student ${student.is_active ? 'activated' : 'deactivated'} successfully`,
      data: student
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
 * Delete student
 */
exports.deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const collegeId = req.user.id;

    const { data: student, error } = await supabase
      .from('students')
      .delete()
      .eq('id', id)
      .eq('college_id', collegeId)
      .select()
      .single();

    if (error) {
      console.error('Delete student error:', error);
      throw error;
    }

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    res.json({
      success: true,
      message: 'Student deleted successfully'
    });

  } catch (error) {
    console.error('Delete student error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete student',
      error: error.message
    });
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
 * Bulk upload students from CSV
 */
exports.bulkUploadStudents = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No CSV file uploaded'
      });
    }

    const collegeId = req.user.id;
    const students = [];
    const errors = [];

    // Parse CSV
    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on('data', (data) => {
        try {
          students.push({
            name: data.name?.trim(),
            email: data.email?.trim(),
            roll_no: data.roll_no?.trim(),
            department: data.department?.trim(),
            batch: data.batch?.trim()
          });
        } catch (err) {
          errors.push(`Invalid data: ${JSON.stringify(data)}`);
        }
      })
      .on('end', async () => {
        try {
          // Process students
          const results = [];
          
          for (const studentData of students) {
            try {
              if (!studentData.email || !studentData.roll_no || !studentData.name) {
                errors.push(`Skipped row: Name, email, and roll number are required.`);
                continue;
              }
              const cleanEmail = studentData.email.trim().toLowerCase();
              const cleanRoll = studentData.roll_no.trim();

              // Check if student already exists in THIS college
              const existingCheck = await pool.query(
                'SELECT id FROM students WHERE (LOWER(email) = $1 OR roll_no = $2) AND college_id = $3 LIMIT 1',
                [cleanEmail, cleanRoll, collegeId]
              );

              if (existingCheck.rows.length > 0) {
                errors.push(`Student ${cleanEmail} (${cleanRoll}) is already registered in your college`);
                continue;
              }

              // Generate unique student ID and password
              const studentId = await generateStudentId(collegeId);
              const password = generatePassword();
              const hashedPassword = await bcrypt.hash(password, 12);
              const newUuid = uuidv4();

              // Insert student strictly associated with this college
              const insertRes = await pool.query(
                `INSERT INTO students (id, student_id, name, email, roll_no, department, batch, password, college_id, is_active, created_at, updated_at)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true, NOW(), NOW())
                 RETURNING *`,
                [newUuid, studentId, studentData.name.trim(), cleanEmail, cleanRoll, studentData.department?.trim() || null, studentData.batch?.trim() || null, hashedPassword, collegeId]
              );

              const createdStudent = insertRes.rows[0];
              results.push({
                ...createdStudent,
                password
              });

              // Send credentials email
              sendStudentCredentials({
                name: studentData.name,
                email: cleanEmail,
                studentId,
                password,
                collegeName: req.user.name || 'Your Institution',
                loginUrl: process.env.STUDENT_LOGIN_URL || 'https://www.exam.nexifyforge.in/student/login'
              }).catch(emailError => {
                console.error(`❌ Bulk Upload Email Error for ${cleanEmail}:`, emailError.message);
              });
            } catch (err) {
              errors.push(`Failed to process ${studentData.email}: ${err.message}`);
            }
          }

          // Clean up uploaded file
          fs.unlinkSync(req.file.path);

          res.json({
            success: true,
            message: `Bulk upload completed. ${results.length} students added, ${errors.length} errors.`,
            data: {
              uploaded: results,
              errors: errors
            }
          });

        } catch (error) {
          console.error('Bulk upload error:', error);
          res.status(500).json({
            success: false,
            message: 'Bulk upload failed',
            error: error.message
          });
        }
      });

  } catch (error) {
    console.error('Bulk upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Bulk upload failed',
      error: error.message
    });
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
    const { newPassword, autoGenerate = true, notifyStudent = true } = req.body;

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

    // Optional email dispatch
    if (notifyStudent && student.email) {
      try {
        await sendStudentCredentials(student.email, {
          name: student.name,
          studentId: student.student_id,
          password: passwordToSet,
          loginUrl: process.env.STUDENT_LOGIN_URL || 'http://localhost:3000/student/login',
        });
      } catch (mailErr) {
        console.warn('Student credential dispatch warning (non-fatal):', mailErr.message);
      }
    }

    res.json({
      success: true,
      message: `Password for ${student.name} (${student.student_id}) has been reset successfully!`,
      data: {
        student: {
          id: student.id,
          name: student.name,
          studentId: student.student_id,
          email: student.email,
        },
        temporaryPassword: passwordToSet,
        loginUrl: process.env.STUDENT_LOGIN_URL || 'http://localhost:3000/student/login'
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
    if (reqData.student_email) {
      try {
        await sendStudentCredentials(reqData.student_email, {
          name: reqData.student_name,
          studentId: reqData.student_id,
          password: passwordToSet,
          loginUrl: process.env.STUDENT_LOGIN_URL || 'http://localhost:3000/student/login',
        });
      } catch (err) {
        console.warn('Email send warning (non-fatal):', err.message);
      }
    }

    res.json({
      success: true,
      message: `Password for ${reqData.student_name} (${reqData.student_id}) has been reset!`,
      data: {
        temporaryPassword: passwordToSet,
        studentId: reqData.student_id,
        studentName: reqData.student_name,
        email: reqData.student_email
      }
    });

  } catch (error) {
    console.error('Resolve password request error:', error);
    res.status(500).json({ success: false, message: 'Failed to resolve request', error: error.message });
  }
};
