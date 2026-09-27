// controllers/resultController.js
const { query, pool } = require('../config/database');
const { sendResultNotification } = require('../services/emailService');

/**
 * GET /api/admin/results
 * Get all results for college
 */
exports.getResults = async (req, res) => {
  try {
    const { examId, page = 1, limit = 30 } = req.query;
    const collegeId = req.user.id;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE e.college_id = $1';
    const params = [collegeId];
    let paramIndex = 2;

    if (examId) {
      whereClause += ` AND r.exam_id = $${paramIndex++}`;
      params.push(examId);
    }

    const result = await query(
      `SELECT r.id, r.student_id, r.exam_id, r.session_id,
              r.marks_obtained, r.percentage, r.grade, r.status,
              r.mcq_marks, r.subjective_marks, r.coding_marks,
              r.rank, r.is_published, r.evaluated_at, r.created_at, r.updated_at, r.submitted_at,
              s.name as student_name, s.student_id as student_code, s.roll_no, s.email,
              COALESCE(e.title, e.name, 'Examination') as exam_name, 
              COALESCE(e.name, e.title, 'Examination') as exam_title,
              COALESCE(NULLIF(r.total_marks, 0), e.total_marks, 100) as total_marks,
              e.total_marks as exam_total_marks, e.passing_marks as exam_passing_marks, e.type as exam_type
       FROM results r
       JOIN students s ON r.student_id = s.id
       JOIN exams e ON r.exam_id = e.id
       ${whereClause}
       ORDER BY r.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );

    res.json({ success: true, data: { results: result.rows } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch results', error: error.message });
  }
};

/**
 * PUT /api/admin/results/:id
 * Direct update for marks, grade, status
 */
exports.updateResult = async (req, res) => {
  try {
    const { id } = req.params;
    const { marks_obtained, status, grade } = req.body;
    const collegeId = req.user.id;

    const existing = await query(`
      SELECT r.*, e.total_marks, e.passing_marks 
      FROM results r 
      JOIN exams e ON r.exam_id = e.id 
      WHERE r.id = $1 AND e.college_id = $2
    `, [id, collegeId]);

    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Result not found or unauthorized' });
    }

    const total = existing.rows[0].total_marks || existing.rows[0].exam_total_marks || 100;
    const marks = parseFloat(marks_obtained) || 0;
    const pct = Math.round((marks / total) * 100 * 10) / 10;
    const passMarks = existing.rows[0].passing_marks || (total * 0.4);
    const computedStatus = status || (marks >= passMarks ? 'pass' : 'fail');

    const getGrade = (p) => {
      if (p >= 90) return 'A+'; if (p >= 80) return 'A';
      if (p >= 70) return 'B+'; if (p >= 60) return 'B';
      if (p >= 50) return 'C'; return 'F';
    };
    const computedGrade = grade || getGrade(pct);

    await query(`
      UPDATE results 
      SET marks_obtained = $1, percentage = $2, status = $3, grade = $4, evaluated_at = NOW()
      WHERE id = $5
    `, [marks, pct, computedStatus, computedGrade, id]);

    res.json({
      success: true,
      message: 'Result updated successfully',
      data: { marks_obtained: marks, percentage: pct, status: computedStatus, grade: computedGrade }
    });
  } catch (error) {
    console.error('Update result error:', error);
    res.status(500).json({ success: false, message: 'Failed to update result', error: error.message });
  }
};

/**
 * POST /api/admin/results/:id/evaluate
 * Manually evaluate subjective/coding answers
 */
exports.evaluateResult = async (req, res) => {
  try {
    const { id } = req.params; // result id
    const { evaluations } = req.body; // [{answerId, marksObtained, remarks}]
    const collegeId = req.user.id;

    let subjectiveMarks = 0;
    let codingMarks = 0;

    for (const ev of evaluations) {
      const answerResult = await query(
        `UPDATE answers SET marks_obtained = $1, evaluator_remarks = $2, is_evaluated = true
         WHERE id = $3
         RETURNING type`,
        [ev.marksObtained, ev.remarks, ev.answerId]
      );
      const answerType = answerResult.rows[0]?.type;
      if (answerType === 'subjective') subjectiveMarks += ev.marksObtained;
      if (answerType === 'coding') codingMarks += ev.marksObtained;
    }

    // Recalculate total
    const resultData = await query('SELECT *, mcq_marks FROM results WHERE id = $1', [id]);
    const result = resultData.rows[0];
    
    const totalObtained = (result.mcq_marks || 0) + subjectiveMarks + codingMarks;
    const percentage = result.total_marks > 0
      ? Math.round((totalObtained / result.total_marks) * 100 * 10) / 10
      : 0;

    const getGrade = (pct) => {
      if (pct >= 90) return 'A+'; if (pct >= 80) return 'A';
      if (pct >= 70) return 'B+'; if (pct >= 60) return 'B';
      if (pct >= 50) return 'C'; return 'F';
    };

    // Get passing marks
    const examData = await query('SELECT passing_marks FROM exams WHERE id = $1', [result.exam_id]);
    const status = totalObtained >= examData.rows[0].passing_marks ? 'pass' : 'fail';

    await query(
      `UPDATE results SET marks_obtained = $1, subjective_marks = $2, coding_marks = $3,
       percentage = $4, grade = $5, status = $6, evaluated_at = NOW()
       WHERE id = $7`,
      [totalObtained, subjectiveMarks, codingMarks, percentage, getGrade(percentage), status, id]
    );

    res.json({ success: true, message: 'Evaluation saved.', data: { totalObtained, percentage, status } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Evaluation failed', error: error.message });
  }
};

/**
 * POST /api/admin/results/exam/:examId/publish
 * Publish results and notify students
 */
exports.publishResults = async (req, res) => {
  try {
    const { examId } = req.params;
    const collegeId = req.user.id;

    await query(
      `UPDATE results SET is_published = true
       WHERE exam_id = $1 AND (SELECT college_id FROM exams WHERE id = $1) = $2`,
      [examId, collegeId]
    );
    await query("UPDATE exams SET result_published = true WHERE id = $1", [examId]);

    // Notify students
    const results = await query(
      `SELECT r.*, s.name, s.email, COALESCE(e.title, e.name, 'Examination') as exam_name
       FROM results r JOIN students s ON r.student_id = s.id
       JOIN exams e ON r.exam_id = e.id WHERE r.exam_id = $1`,
      [examId]
    );

    for (const r of results.rows) {
      sendResultNotification({
        name: r.name,
        email: r.email,
        examName: r.exam_name,
        marksObtained: r.marks_obtained,
        totalMarks: r.total_marks,
        percentage: r.percentage,
        grade: r.grade,
        status: r.status,
      }).catch(() => {});
    }

    res.json({ success: true, message: `Results published. ${results.rows.length} students notified.` });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Publish failed', error: error.message });
  }
};

/**
 * GET /api/student/results
 * Student's results
 */
exports.getStudentResults = async (req, res) => {
  try {
    const studentId = req.user.id;

    const result = await query(
      `SELECT r.*, COALESCE(e.title, e.name, 'Examination') as exam_name, e.type as exam_type, e.subject, e.date_time
       FROM results r JOIN exams e ON r.exam_id = e.id
       WHERE r.student_id = $1 AND r.is_published = true
       ORDER BY r.created_at DESC`,
      [studentId]
    );

    res.json({ success: true, data: { results: result.rows } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch results', error: error.message });
  }
};

/**
 * GET /api/student/results/:examId
 * Detailed result for one exam
 */
exports.getStudentExamResult = async (req, res) => {
  try {
    const { examId } = req.params;
    const studentId = req.user.id;

    const result = await query(
      `SELECT r.*, COALESCE(e.title, e.name, 'Examination') as exam_name, e.type, e.total_marks, e.passing_marks, e.subject
       FROM results r JOIN exams e ON r.exam_id = e.id
       WHERE r.exam_id = $1 AND r.student_id = $2 AND r.is_published = true`,
      [examId, studentId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Result not found or not yet published.' });
    }

    const answers = await query(
      `SELECT a.*, q.question_text, q.type, q.options, q.correct_answer, q.marks, q.order_index
       FROM answers a JOIN questions q ON a.question_id = q.id
       WHERE a.exam_id = $1 AND a.student_id = $2
       ORDER BY q.order_index`,
      [examId, studentId]
    );

    res.json({
      success: true,
      data: { result: result.rows[0], answers: answers.rows },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch result', error: error.message });
  }
};

/**
 * GET /api/student/results/by-key/:examKey
 * Fetch detailed result data for a specific exam code
 */
exports.getStudentResultByKey = async (req, res) => {
  try {
    const { examKey } = req.params;
    const studentId = req.user.id;
    const cleanKey = (examKey || '').trim().toUpperCase();

    // 1. Search for published result by exam_code or exam_key (case-insensitive)
    const result = await query(
      `SELECT r.*, COALESCE(e.title, e.name, 'Examination') as exam_name, e.type, e.total_marks, e.passing_marks, e.subject, e.exam_code, e.date_time as exam_date, s.name as student_name, s.student_id as student_roll_no
       FROM results r 
       JOIN exams e ON r.exam_id = e.id
       JOIN students s ON r.student_id = s.id
       WHERE (UPPER(e.exam_code) = $1 OR UPPER(e.exam_key) = $1) AND r.student_id = $2`,
      [cleanKey, studentId]
    );

    if (result.rows.length > 0) {
      if (!result.rows[0].is_published) {
        return res.status(200).json({
          success: false,
          isPending: true,
          message: 'Evaluation Under Review: Your exam has been completed. Official transcripts will be released once grading is approved by your institution.'
        });
      }

      return res.json({
        success: true,
        data: { result: result.rows[0] },
      });
    }

    // 2. If no result record, check if student completed a session for this exam
    const sessionCheck = await query(
      `SELECT es.status, es.submitted_at, COALESCE(e.title, e.name, 'Examination') as exam_name
       FROM exam_sessions es
       JOIN exams e ON es.exam_id = e.id
       WHERE (UPPER(e.exam_code) = $1 OR UPPER(e.exam_key) = $1) AND es.student_id = $2
       LIMIT 1`,
      [cleanKey, studentId]
    );

    if (sessionCheck.rows.length > 0) {
      return res.status(200).json({
        success: false,
        isPending: true,
        message: 'Evaluation in Progress: Your examination submission is recorded. Official transcripts will be available once results are published.'
      });
    }

    // 3. Check if exam exists at all
    const examCheck = await query(
      `SELECT id, COALESCE(title, name, 'Examination') as title FROM exams WHERE UPPER(exam_code) = $1 OR UPPER(exam_key) = $1 LIMIT 1`,
      [cleanKey]
    );

    if (examCheck.rows.length > 0) {
      return res.status(200).json({
        success: false,
        isPending: true,
        message: 'No examination attempt found for this access key with your student account.'
      });
    }

    return res.status(200).json({
      success: false,
      message: 'Access Key Not Found: Please verify the examination code on your admission ticket.'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch result by key', error: error.message });
  }
};
