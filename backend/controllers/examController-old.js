// controllers/examController.js
const { supabase } = require('../config/supabase');
const { sendExamNotification, sendExamReminder } = require('../services/emailService');
const { v4: uuidv4 } = require('uuid');

/**
 * Generate unique exam code
 */
const generateExamCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code;
  let exists = true;
  let attempts = 0;
  
  while (exists && attempts < 10) {
    code = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    // For now, just return a code without checking existence
    exists = false;
    attempts++;
  }
  
  return code;
};

// =====================================================
// ADMIN - EXAM MANAGEMENT
// =====================================================

/**
 * GET /api/admin/exams
 */
exports.getExams = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, type, search } = req.query;
    const collegeId = req.user.id;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('exams')
      .select('*', { count: 'exact' })
      .eq('college_id', collegeId)
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    if (type) {
      query = query.eq('type', type);
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,subject.ilike.%${search}%`);
    }
    
    const { data: exams, error, count } = await query;

    if (error) throw error;

    res.json({
      success: true,
      data: { 
        exams: exams || [], 
        total: count || 0,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil((count || 0) / parseInt(limit)),
          hasNext: parseInt(page) < Math.ceil((count || 0) / parseInt(limit)),
          hasPrev: parseInt(page) > 1
        }
      }
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

/**
 * POST /api/admin/exams
 * Create exam
 */
exports.createExam = async (req, res) => {
  try {
    const {
      title, name, description, type, subject, dateTime, duration, totalMarks,
      passingMarks, instructions, isProctored, maxViolations, studentIds, questions
    } = req.body;
    const collegeId = req.user.id;

    // Accept both title and name for flexibility
    const examTitle = title || name;

    if (!examTitle || !type || !dateTime || !duration || !totalMarks) {
      return res.status(400).json({ success: false, message: 'Required fields missing.' });
    }

    const examCode = await generateExamCode();

    // Create exam using Supabase
    const { data: exam, error } = await supabase
      .from('exams')
      .insert({
        title: examTitle,
        description,
        exam_code: examCode,
        type,
        subject,
        date_time: dateTime,
        duration,
        total_marks: totalMarks,
        passing_marks: passingMarks || Math.floor(totalMarks * 0.4),
        instructions,
        is_proctored: isProctored !== false,
        max_violations: maxViolations || 3,
        college_id: collegeId,
        status: 'draft'
      })
      .select()
      .single();

    if (error) {
      console.error('Exam creation error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create exam',
        error: error.message
      });
    }

    res.status(201).json({
      success: true,
      message: 'Exam created successfully',
      data: {
        id: exam.id,
        exam_code: examCode,
        title: examTitle,
        description,
        type,
        subject,
        date_time: exam.date_time,
        duration,
        total_marks: exam.total_marks,
        passing_marks: exam.passing_marks,
        instructions,
        is_proctored: exam.is_proctored,
        status: exam.status
      }
    });

  } catch (error) {
    console.error('Create exam error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create exam',
      error: error.message
    });
  }
};

/**
 * PUT /api/admin/exams/:id
 */
exports.updateExam = async (req, res) => {
  try {
    const { id } = req.params;
    const collegeId = req.user.id;
    const { name, description, subject, dateTime, duration, totalMarks, passingMarks, instructions, status } = req.body;

    const result = await query(
      `UPDATE exams SET
       name = COALESCE($1, name), description = COALESCE($2, description),
       subject = COALESCE($3, subject), date_time = COALESCE($4, date_time),
       duration = COALESCE($5, duration), total_marks = COALESCE($6, total_marks),
       passing_marks = COALESCE($7, passing_marks), instructions = COALESCE($8, instructions),
       status = COALESCE($9, status)
       WHERE id = $10 AND college_id = $11
       RETURNING *`,
      [name, description, subject, dateTime, duration, totalMarks, passingMarks, instructions, status, id, collegeId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Exam not found.' });
    }

    res.json({ success: true, message: 'Exam updated.', data: { exam: result.rows[0] } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Update failed', error: error.message });
  }
};

/**
 * POST /api/admin/exams/:id/publish
 * Publish exam and notify students
 */
exports.publishExam = async (req, res) => {
  try {
    const { id } = req.params;
    const collegeId = req.user.id;

    const examResult = await query(
      'SELECT * FROM exams WHERE id = $1 AND college_id = $2',
      [id, collegeId]
    );
    if (examResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Exam not found.' });
    }
    
    const exam = examResult.rows[0];

    // Check if exam has questions
    const questionCount = await query('SELECT COUNT(*) FROM questions WHERE exam_id = $1', [id]);
    if (parseInt(questionCount.rows[0].count) === 0) {
      return res.status(400).json({ success: false, message: 'Cannot publish exam without questions.' });
    }

    await query("UPDATE exams SET status = 'published' WHERE id = $1", [id]);

    // Notify assigned students
    const students = await query(
      `SELECT s.name, s.email FROM exam_students es 
       JOIN students s ON es.student_id = s.id 
       WHERE es.exam_id = $1`,
      [id]
    );

    for (const student of students.rows) {
      sendExamNotification({
        name: student.name,
        email: student.email,
        examName: exam.name,
        examDate: exam.date_time,
        examDuration: exam.duration,
        examKey: exam.exam_code,
        subject: exam.subject,
        type: exam.type,
        loginUrl: process.env.STUDENT_LOGIN_URL,
      }).catch(() => {});

      // Create notification
      await query(
        `INSERT INTO notifications (recipient_id, recipient_type, title, message, type, link)
         VALUES ((SELECT id FROM students WHERE email = $1), 'student', $2, $3, 'exam', $4)`,
        [student.email, `Exam Scheduled: ${exam.name}`, `Your exam "${exam.name}" has been scheduled.`, `/student/exams`]
      );
    }

    res.json({
      success: true,
      message: `Exam published. ${students.rows.length} students notified.`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Publish failed', error: error.message });
  }
};

/**
 * GET /api/admin/exams/:id/questions
 */
exports.getExamQuestions = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(
      'SELECT * FROM questions WHERE exam_id = $1 ORDER BY order_index ASC',
      [id]
    );
    res.json({ success: true, data: { questions: result.rows } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch questions', error: error.message });
  }
};

/**
 * POST /api/admin/exams/:id/questions
 * Add questions to exam
 */
exports.addQuestions = async (req, res) => {
  try {
    const { id } = req.params;
    const { questions } = req.body;
    
    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ success: false, message: 'Questions array is required.' });
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      await query(
        `INSERT INTO questions (exam_id, question_text, type, options, correct_answer, marks, negative_marks, difficulty, order_index, code_template, test_cases, time_limit)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [id, q.questionText, q.type, q.options ? JSON.stringify(q.options) : null,
         q.correctAnswer, q.marks || 1, q.negativeMarks || 0, q.difficulty || 'medium',
         i, q.codeTemplate, q.testCases ? JSON.stringify(q.testCases) : null, q.timeLimit || 2000]
      );
    }

    res.json({ success: true, message: `${questions.length} questions added.` });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to add questions', error: error.message });
  }
};

/**
 * GET /api/admin/exams/:id/monitor
 * Live monitoring data
 */
exports.getLiveMonitoringData = async (req, res) => {
  try {
    const { id } = req.params;
    const collegeId = req.user.id;

    const exam = await query('SELECT * FROM exams WHERE id = $1 AND college_id = $2', [id, collegeId]);
    if (exam.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Exam not found.' });
    }

    const sessions = await query(
      `SELECT es.*, s.name, s.student_id, s.email,
              (SELECT COUNT(*) FROM violations v WHERE v.session_id = es.id) as violation_count,
              (SELECT COUNT(*) FROM answers a WHERE a.session_id = es.id) as answers_count,
              (SELECT MAX(v.occurred_at) FROM violations v WHERE v.session_id = es.id) as last_violation_at
       FROM exam_sessions es
       JOIN students s ON es.student_id = s.id
       WHERE es.exam_id = $1
       ORDER BY es.started_at DESC`,
      [id]
    );

    const recentViolations = await query(
      `SELECT v.*, s.name as student_name, s.student_id
       FROM violations v
       JOIN students s ON v.student_id = s.id
       WHERE v.exam_id = $1
       ORDER BY v.occurred_at DESC LIMIT 20`,
      [id]
    );

    const stats = {
      total: sessions.rows.length,
      active: sessions.rows.filter(s => s.status === 'active').length,
      submitted: sessions.rows.filter(s => s.status === 'submitted').length,
      terminated: sessions.rows.filter(s => s.status === 'terminated').length,
      totalViolations: sessions.rows.reduce((sum, s) => sum + parseInt(s.violation_count || 0), 0),
    };

    res.json({
      success: true,
      data: {
        exam: exam.rows[0],
        sessions: sessions.rows,
        recentViolations: recentViolations.rows,
        stats,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch monitoring data', error: error.message });
  }
};

// =====================================================
// STUDENT - EXAM FLOW
// =====================================================

/**
 * GET /api/student/exams
 * Student's upcoming and past exams
 */
exports.getStudentExams = async (req, res) => {
  try {
    const studentId = req.user.id;
    const collegeId = req.user.college_id;

    const result = await query(
      `SELECT e.id, e.name, e.type, e.subject, e.date_time, e.duration, e.total_marks,
              e.status, e.is_proctored, e.instructions,
              es_session.status as session_status,
              es_session.started_at,
              es_session.submitted_at,
              r.marks_obtained, r.percentage, r.grade, r.status as result_status, r.is_published
       FROM exams e
       JOIN exam_students es ON e.id = es.exam_id AND es.student_id = $1
       LEFT JOIN exam_sessions es_session ON es_session.exam_id = e.id AND es_session.student_id = $1
       LEFT JOIN results r ON r.exam_id = e.id AND r.student_id = $1
       WHERE e.college_id = $2 AND e.status IN ('published', 'active', 'completed')
       ORDER BY e.date_time DESC`,
      [studentId, collegeId]
    );

    res.json({ success: true, data: { exams: result.rows } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch exams', error: error.message });
  }
};

/**
 * POST /api/student/exams/:id/start
 * Start exam (validate exam key, create session)
 */
exports.startExam = async (req, res) => {
  try {
    const { id } = req.params;
    const { examKey } = req.body;
    const studentId = req.user.id;

    // Validate exam
    const examResult = await query(
      `SELECT e.* FROM exams e
       JOIN exam_students es ON e.id = es.exam_id
       WHERE e.id = $1 AND es.student_id = $2`,
      [id, studentId]
    );

    if (examResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Exam not found or you are not registered for this exam.' });
    }

    const exam = examResult.rows[0];

    // Validate exam key
    if (exam.exam_code !== examKey) {
      return res.status(401).json({ success: false, message: 'Invalid exam key.' });
    }

    // Check if exam is active (within time window)
    const now = new Date();
    const examStart = new Date(exam.date_time);
    const examEnd = new Date(examStart.getTime() + exam.duration * 60000);

    // Allow 15 min early access, must start before exam ends
    if (now < new Date(examStart.getTime() - 15 * 60000)) {
      return res.status(400).json({ success: false, message: `Exam starts at ${examStart.toLocaleString()}. You can join 15 minutes before.` });
    }
    if (now > examEnd) {
      return res.status(400).json({ success: false, message: 'This exam has ended.' });
    }

    // Check for existing session
    const existingSession = await query(
      'SELECT * FROM exam_sessions WHERE exam_id = $1 AND student_id = $2',
      [id, studentId]
    );

    if (existingSession.rows.length > 0) {
      const session = existingSession.rows[0];
      if (session.status === 'submitted' || session.status === 'terminated') {
        return res.status(400).json({ success: false, message: 'You have already submitted this exam.' });
      }
      // Resume existing session
      const questions = await query(
        'SELECT id, question_text, type, options, marks, order_index, code_template, time_limit FROM questions WHERE exam_id = $1 ORDER BY order_index',
        [id]
      );
      const answers = await query(
        'SELECT question_id, answer_text, selected_option, code_submission, selected_language FROM answers WHERE session_id = $1',
        [session.id]
      );

      return res.json({
        success: true,
        message: 'Resuming exam session.',
        data: {
          session,
          exam: { ...exam, exam_code: undefined },
          questions: questions.rows,
          savedAnswers: answers.rows,
          timeRemaining: Math.max(0, Math.floor((examEnd - now) / 1000)),
        },
      });
    }

    // Create new session
    const sessionResult = await query(
      `INSERT INTO exam_sessions (exam_id, student_id, ip_address, browser_info)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [id, studentId, req.ip, req.get('User-Agent')]
    );

    // Update exam status to active
    await query("UPDATE exams SET status = 'active' WHERE id = $1 AND status = 'published'", [id]);

    const questions = await query(
      'SELECT id, question_text, type, options, marks, order_index, code_template, time_limit FROM questions WHERE exam_id = $1 ORDER BY order_index',
      [id]
    );

    res.json({
      success: true,
      message: 'Exam started. Good luck!',
      data: {
        session: sessionResult.rows[0],
        exam: { ...exam, exam_code: undefined },
        questions: questions.rows,
        savedAnswers: [],
        timeRemaining: Math.floor((examEnd - now) / 1000),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to start exam', error: error.message });
  }
};

/**
 * POST /api/student/exams/:id/save-answer
 * Auto-save answer
 */
exports.saveAnswer = async (req, res) => {
  try {
    const { id } = req.params;
    const { sessionId, questionId, answerText, selectedOption, codeSubmission, selectedLanguage } = req.body;
    const studentId = req.user.id;

    await query(
      `INSERT INTO answers (session_id, question_id, student_id, exam_id, answer_text, selected_option, code_submission, selected_language)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (session_id, question_id) DO UPDATE SET
       answer_text = EXCLUDED.answer_text, selected_option = EXCLUDED.selected_option,
       code_submission = EXCLUDED.code_submission, selected_language = EXCLUDED.selected_language,
       updated_at = NOW()`,
      [sessionId, questionId, studentId, id, answerText, selectedOption, codeSubmission, selectedLanguage]
    );

    res.json({ success: true, message: 'Answer saved.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to save answer', error: error.message });
  }
};

/**
 * POST /api/student/exams/:id/submit
 * Submit exam (auto-evaluate MCQ)
 */
exports.submitExam = async (req, res) => {
  try {
    const { id } = req.params;
    const { sessionId } = req.body;
    const studentId = req.user.id;

    const sessionResult = await query(
      'SELECT * FROM exam_sessions WHERE id = $1 AND student_id = $2 AND exam_id = $3 AND status = $4',
      [sessionId, studentId, id, 'active']
    );

    if (sessionResult.rows.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid or already submitted session.' });
    }

    // Evaluate MCQ answers
    const answers = await query(
      `SELECT a.*, q.type, q.correct_answer, q.marks, q.negative_marks
       FROM answers a JOIN questions q ON a.question_id = q.id
       WHERE a.session_id = $1`,
      [sessionId]
    );

    let mcqMarks = 0;
    for (const answer of answers.rows) {
      if (answer.type === 'mcq' || answer.type === 'true_false') {
        const isCorrect = answer.selected_option === answer.correct_answer;
        const marksObtained = isCorrect ? answer.marks : -Math.abs(answer.negative_marks || 0);
        mcqMarks += marksObtained;
        await query(
          'UPDATE answers SET is_correct = $1, marks_obtained = $2, is_evaluated = true WHERE id = $3',
          [isCorrect, Math.max(0, marksObtained), answer.id]
        );
      }
    }

    // Get exam details
    const exam = await query('SELECT * FROM exams WHERE id = $1', [id]);
    const examData = exam.rows[0];

    // Create result
    const hasSubjective = answers.rows.some(a => a.type === 'subjective');
    const hasCoding = answers.rows.some(a => a.type === 'coding');

    const resultStatus = (!hasSubjective && !hasCoding)
      ? (mcqMarks >= examData.passing_marks ? 'pass' : 'fail')
      : 'pending';

    const percentage = examData.total_marks > 0
      ? Math.round((mcqMarks / examData.total_marks) * 100 * 10) / 10
      : 0;

    const getGrade = (pct) => {
      if (pct >= 90) return 'A+';
      if (pct >= 80) return 'A';
      if (pct >= 70) return 'B+';
      if (pct >= 60) return 'B';
      if (pct >= 50) return 'C';
      return 'F';
    };

    await query(
      `INSERT INTO results (student_id, exam_id, session_id, total_marks, marks_obtained, percentage, grade, status, mcq_marks, is_published)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (student_id, exam_id) DO UPDATE SET
       marks_obtained = EXCLUDED.marks_obtained, percentage = EXCLUDED.percentage,
       grade = EXCLUDED.grade, status = EXCLUDED.status`,
      [studentId, id, sessionId, examData.total_marks, Math.max(0, mcqMarks), 
       percentage, getGrade(percentage), resultStatus, Math.max(0, mcqMarks), resultStatus !== 'pending']
    );

    // Mark session as submitted
    await query(
      "UPDATE exam_sessions SET status = 'submitted', submitted_at = NOW() WHERE id = $1",
      [sessionId]
    );

    res.json({
      success: true,
      message: 'Exam submitted successfully!',
      data: {
        status: resultStatus,
        marksObtained: Math.max(0, mcqMarks),
        totalMarks: examData.total_marks,
        percentage,
        grade: getGrade(percentage),
        isPending: resultStatus === 'pending',
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Submission failed', error: error.message });
  }
};

/**
 * POST /api/student/violations
 * Report a violation
 */
exports.reportViolation = async (req, res) => {
  try {
    const { sessionId, examId, type, description } = req.body;
    const studentId = req.user.id;

    // Insert violation
    await query(
      `INSERT INTO violations (session_id, student_id, exam_id, type, description, severity)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [sessionId, studentId, examId, type, description,
       type === 'multiple_faces' ? 'critical' : 'warning']
    );

    // Count violations for this session
    const countResult = await query(
      'SELECT violation_count FROM exam_sessions WHERE id = $1',
      [sessionId]
    );

    const newCount = (parseInt(countResult.rows[0].violation_count || 0)) + 1;
    await query('UPDATE exam_sessions SET violation_count = $1 WHERE id = $2', [newCount, sessionId]);

    // Get max violations limit
    const examResult = await query('SELECT max_violations FROM exams WHERE id = $1', [examId]);
    const maxViolations = examResult.rows[0]?.max_violations || 3;

    let action = 'warning';
    let message = `Warning ${newCount}/${maxViolations}: ${type} detected.`;
    let autoTerminate = false;

    if (newCount >= maxViolations) {
      // Auto terminate
      await query(
        "UPDATE exam_sessions SET status = 'terminated', submitted_at = NOW(), is_auto_submitted = true, auto_submit_reason = 'max_violations_exceeded' WHERE id = $1",
        [sessionId]
      );
      action = 'terminate';
      message = 'Your exam has been automatically terminated due to repeated violations.';
      autoTerminate = true;
    }

    res.json({
      success: true,
      data: { action, message, violationCount: newCount, maxViolations, autoTerminate },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to report violation', error: error.message });
  }
};
