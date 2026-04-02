// controllers/studentController.js - Fixed with Supabase integration
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const csv = require('csv-parser');
const fs = require('fs');
const { supabase } = require('../config/supabase');
const { sendStudentCredentials } = require('../services/emailService');

/**
 * Generate unique student ID: ES-YEAR-XXXXX
 */
const generateStudentId = async (collegeId) => {
  const year = new Date().getFullYear();
  const { count } = await supabase
    .from('students')
    .select('*', { count: 'exact', head: true })
    .eq('college_id', collegeId);
  
  const studentCount = (count || 0) + 1;
  return `ES-${year}-${String(studentCount).padStart(5, '0')}`;
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
    const { page = 1, limit = 20, search, isActive, department, batch } = req.query;
    const offset = (page - 1) * limit;
    const collegeId = req.user.id;

    let query = supabase
      .from('students')
      .select('*', { count: 'exact' })
      .eq('college_id', collegeId)
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    // Apply filters
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,roll_no.ilike.%${search}%,student_id.ilike.%${search}%`);
    }
    if (isActive !== undefined) {
      query = query.eq('is_active', isActive === 'true');
    }
    if (department) {
      query = query.eq('department', department);
    }
    if (batch) {
      query = query.eq('batch', batch);
    }

    const { data: students, error, count } = await query;

    if (error) {
      console.error('Students query error:', error);
      throw error;
    }

    res.json({
      success: true,
      data: {
        students: students || [],
        total: count || 0,
        page: parseInt(page),
        totalPages: Math.ceil((count || 0) / limit)
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
    const { name, email, roll_no, department, batch } = req.body;
    const collegeId = req.user.id;

    // Validate required fields
    if (!name || !email || !roll_no || !department || !batch) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    // Check if student already exists
    const { data: existingStudent } = await supabase
      .from('students')
      .select('*')
      .or(`email.eq.${email},roll_no.eq.${roll_no}`)
      .eq('college_id', collegeId)
      .limit(1);

    if (existingStudent && existingStudent.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Student with this email or roll number already exists'
      });
    }

    // Generate student ID and password
    const studentId = await generateStudentId(collegeId);
    const password = generatePassword();
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create student
    const { data: student, error } = await supabase
      .from('students')
      .insert([{
        id: uuidv4(),
        student_id: studentId,
        name,
        email,
        roll_no: roll_no,
        department,
        batch,
        password: hashedPassword,
        college_id: collegeId,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      console.error('Student creation error:', error);
      throw error;
    }

    // Send credentials email (optional - can be skipped for development)
    try {
      await sendStudentCredentials(email, studentId, password, name);
    } catch (emailError) {
      console.error('Email send error:', emailError);
      // Don't fail the request if email fails
    }

    res.status(201).json({
      success: true,
      message: 'Student added successfully',
      data: {
        id: student.id,
        student_id: student.student_id,
        name: student.name,
        email: student.email,
        roll_no: student.roll_no,
        department: student.department,
        batch: student.batch,
        password: password // Return plain password for display
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
    const { name, email, roll_no, department, batch, is_active } = req.body;
    const collegeId = req.user.id;

    const { data: student, error } = await supabase
      .from('students')
      .update({
        name,
        email,
        roll_no,
        department,
        batch,
        is_active,
        updated_at: new Date().toISOString()
      })
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
              // Check if student already exists
              const { data: existing } = await supabase
                .from('students')
                .select('id')
                .or(`email.eq.${studentData.email},roll_no.eq.${studentData.roll_no}`)
                .eq('college_id', collegeId)
                .limit(1);

              if (existing && existing.length > 0) {
                errors.push(`Student ${studentData.email} already exists`);
                continue;
              }

              // Generate student ID and password
              const studentId = await generateStudentId(collegeId);
              const password = generatePassword();
              const hashedPassword = await bcrypt.hash(password, 12);

              // Insert student
              const { data: student, error } = await supabase
                .from('students')
                .insert([{
                  id: uuidv4(),
                  student_id: studentId,
                  name: studentData.name,
                  email: studentData.email,
                  roll_no: studentData.roll_no,
                  department: studentData.department,
                  batch: studentData.batch,
                  password: hashedPassword,
                  college_id: collegeId,
                  is_active: true,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                }])
                .select();

              if (error) {
                errors.push(`Failed to insert ${studentData.email}: ${error.message}`);
              } else {
                results.push({
                  ...student[0],
                  password: password
                });
              }
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
