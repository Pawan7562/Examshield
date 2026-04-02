// controllers/studentController.js
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const csv = require('csv-parser');
const fs = require('fs');
const { query, transaction } = require('../config/database-simple');
const { sendStudentCredentials } = require('../services/emailService');

/**
 * Generate unique student ID: ES-YEAR-XXXXX
 */
const generateStudentId = async (collegeId) => {
  const year = new Date().getFullYear();
  const countResult = await query(
    `SELECT COUNT(*) FROM students WHERE college_id = $1 AND EXTRACT(YEAR FROM created_at) = $2`,
    [collegeId, year]
  );
  const count = parseInt(countResult.rows[0].count) + 1;
  return `ES-${year}-${String(count).padStart(5, '0')}`;
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
 * Get all students for the college
 */
exports.getStudents = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, isActive, department, batch } = req.query;
    const offset = (page - 1) * limit;
    const collegeId = req.user.id;

    let whereClause = 'WHERE s.college_id = $1';
    const params = [collegeId];
    let paramIndex = 2;

    if (search) {
      whereClause += ` AND (s.name ILIKE $${paramIndex} OR s.email ILIKE $${paramIndex} OR s.roll_no ILIKE $${paramIndex} OR s.student_id ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }
    if (isActive !== undefined) {
      whereClause += ` AND s.is_active = $${paramIndex}`;
      params.push(isActive === 'true');
      paramIndex++;
    }
    if (department) {
      whereClause += ` AND s.department = $${paramIndex}`;
      params.push(department);
      paramIndex++;
    }

    const countResult = await query(
      `SELECT COUNT(*) FROM students s ${whereClause}`,
      params
    );

    const studentsResult = await query(
      `SELECT s.id, s.student_id, s.name, s.email, s.roll_no, s.department, 
              s.semester, s.batch, s.phone, s.is_active, s.last_login, s.created_at
       FROM students s ${whereClause}
       ORDER BY s.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );

    res.json({
      success: true,
      data: {
        students: studentsResult.rows,
        pagination: {
          total: parseInt(countResult.rows[0].count),
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(countResult.rows[0].count / limit),
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch students', error: error.message });
  }
};

/**
 * POST /api/admin/students
 * Add single student
 */
exports.addStudent = async (req, res) => {
  try {
    const { name, email, rollNo, department, semester, batch, phone } = req.body;
    const collegeId = req.user.id;

    if (!name || !email || !rollNo) {
      return res.status(400).json({ success: false, message: 'Name, email, and roll number are required.' });
    }

    // Check for duplicates within college
    const existing = await query(
      'SELECT id FROM students WHERE (email = $1 OR roll_no = $2) AND college_id = $3',
      [email, rollNo, collegeId]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ success: false, message: 'Student with this email or roll number already exists.' });
    }

    // Check subscription limits
    const countResult = await query('SELECT COUNT(*) FROM students WHERE college_id = $1 AND is_active = true', [collegeId]);
    const currentCount = parseInt(countResult.rows[0].count);
    
    const subResult = await query(
      'SELECT max_students FROM subscriptions WHERE college_id = $1 AND status = $2 ORDER BY created_at DESC LIMIT 1',
      [collegeId, 'active']
    );
    const maxStudents = subResult.rows[0]?.max_students;
    
    if (maxStudents && currentCount >= maxStudents) {
      return res.status(403).json({
        success: false,
        message: `Student limit reached (${maxStudents}). Please upgrade your subscription.`,
        code: 'LIMIT_EXCEEDED',
      });
    }

    const studentId = await generateStudentId(collegeId);
    const plainPassword = generatePassword();
    const hashedPassword = await bcrypt.hash(plainPassword, 12);

    const result = await query(
      `INSERT INTO students (student_id, name, email, password, roll_no, department, semester, batch, phone, college_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id, student_id, name, email, roll_no, department, is_active, created_at`,
      [studentId, name, email, hashedPassword, rollNo, department, semester, batch, phone, collegeId]
    );

    const student = result.rows[0];

    // Get college name for email
    const collegeResult = await query('SELECT name FROM colleges WHERE id = $1', [collegeId]);

    // Send credentials email
    await sendStudentCredentials({
      name,
      email,
      studentId,
      password: plainPassword,
      collegeName: collegeResult.rows[0].name,
      loginUrl: process.env.STUDENT_LOGIN_URL,
    }).catch((err) => console.error('Email send failed:', err));

    res.status(201).json({
      success: true,
      message: `Student created successfully. Credentials sent to ${email}.`,
      data: { student },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to add student', error: error.message });
  }
};

/**
 * POST /api/admin/students/bulk
 * Bulk upload students via CSV
 * CSV format: name,email,roll_no,department,semester,batch
 */
exports.bulkUploadStudents = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'CSV file is required.' });
  }

  const collegeId = req.user.id;
  const results = [];
  const errors = [];
  let rowIndex = 0;

  try {
    const collegeResult = await query('SELECT name FROM colleges WHERE id = $1', [collegeId]);
    const collegeName = collegeResult.rows[0].name;

    await new Promise((resolve, reject) => {
      fs.createReadStream(req.file.path)
        .pipe(csv())
        .on('data', (data) => results.push({ ...data, rowIndex: ++rowIndex }))
        .on('end', resolve)
        .on('error', reject);
    });

    const created = [];
    const failed = [];

    for (const row of results) {
      const { name, email, roll_no, department, semester, batch } = row;
      
      if (!name || !email || !roll_no) {
        failed.push({ row: row.rowIndex, reason: 'Missing required fields (name, email, roll_no)' });
        continue;
      }

      try {
        const existing = await query(
          'SELECT id FROM students WHERE (email = $1 OR roll_no = $2) AND college_id = $3',
          [email.trim(), roll_no.trim(), collegeId]
        );
        
        if (existing.rows.length > 0) {
          failed.push({ row: row.rowIndex, email, reason: 'Duplicate email or roll number' });
          continue;
        }

        const studentId = await generateStudentId(collegeId);
        const plainPassword = generatePassword();
        const hashedPassword = await bcrypt.hash(plainPassword, 12);

        await query(
          `INSERT INTO students (student_id, name, email, password, roll_no, department, semester, batch, college_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [studentId, name.trim(), email.trim(), hashedPassword, roll_no.trim(), department, semester, batch, collegeId]
        );

        // Send email (non-blocking)
        sendStudentCredentials({
          name: name.trim(),
          email: email.trim(),
          studentId,
          password: plainPassword,
          collegeName,
          loginUrl: process.env.STUDENT_LOGIN_URL,
        }).catch(() => {});

        created.push({ name: name.trim(), email: email.trim(), studentId });
      } catch (err) {
        failed.push({ row: row.rowIndex, email, reason: err.message });
      }
    }

    // Cleanup uploaded file
    fs.unlink(req.file.path, () => {});

    res.json({
      success: true,
      message: `Bulk upload complete. ${created.length} created, ${failed.length} failed.`,
      data: { created: created.length, failed: failed.length, errors: failed },
    });
  } catch (error) {
    fs.unlink(req.file?.path, () => {});
    res.status(500).json({ success: false, message: 'Bulk upload failed', error: error.message });
  }
};

/**
 * PUT /api/admin/students/:id
 * Update student
 */
exports.updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const collegeId = req.user.id;
    const { name, department, semester, batch, phone } = req.body;

    const result = await query(
      `UPDATE students SET name = COALESCE($1, name), department = COALESCE($2, department),
       semester = COALESCE($3, semester), batch = COALESCE($4, batch), phone = COALESCE($5, phone)
       WHERE id = $6 AND college_id = $7
       RETURNING id, student_id, name, email, roll_no, department, semester, batch`,
      [name, department, semester, batch, phone, id, collegeId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    res.json({ success: true, message: 'Student updated.', data: { student: result.rows[0] } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Update failed', error: error.message });
  }
};

/**
 * PATCH /api/admin/students/:id/toggle-status
 * Activate/Deactivate student
 */
exports.toggleStudentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const collegeId = req.user.id;

    const result = await query(
      `UPDATE students SET is_active = NOT is_active WHERE id = $1 AND college_id = $2
       RETURNING id, name, is_active`,
      [id, collegeId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    const student = result.rows[0];
    res.json({
      success: true,
      message: `Student ${student.is_active ? 'activated' : 'deactivated'} successfully.`,
      data: { student },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Status update failed', error: error.message });
  }
};

/**
 * DELETE /api/admin/students/:id
 */
exports.deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const collegeId = req.user.id;

    const result = await query(
      'DELETE FROM students WHERE id = $1 AND college_id = $2 RETURNING id, name',
      [id, collegeId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    res.json({ success: true, message: 'Student deleted successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Delete failed', error: error.message });
  }
};

/**
 * GET /api/student/profile
 * Student's own profile
 */
exports.getStudentProfile = async (req, res) => {
  try {
    const result = await query(
      `SELECT s.id, s.student_id, s.name, s.email, s.roll_no, s.department, 
              s.semester, s.batch, s.phone, s.profile_photo, s.last_login, s.created_at,
              c.name as college_name
       FROM students s JOIN colleges c ON s.college_id = c.id
       WHERE s.id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Profile not found.' });
    }

    res.json({ success: true, data: { profile: result.rows[0] } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch profile', error: error.message });
  }
};

/**
 * POST /api/student/change-password
 */
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword || newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'Valid passwords are required. New password must be at least 8 characters.' });
    }

    const result = await query('SELECT password FROM students WHERE id = $1', [req.user.id]);
    const student = result.rows[0];

    if (!await bcrypt.compare(currentPassword, student.password)) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await query('UPDATE students SET password = $1 WHERE id = $2', [hashedPassword, req.user.id]);

    res.json({ success: true, message: 'Password changed successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Password change failed', error: error.message });
  }
};
