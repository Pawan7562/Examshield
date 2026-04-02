// controllers/resultController.js
const { query } = require('../config/database-simple');
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
      `SELECT r.*, s.name as student_name, s.student_id, s.roll_no, s.email,
              e.name as exam_name, e.type as exam_type, e.total_marks as exam_total_marks
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
      `SELECT r.*, s.name, s.email, e.name as exam_name
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
      `SELECT r.*, e.name as exam_name, e.type as exam_type, e.subject, e.date_time
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
      `SELECT r.*, e.name as exam_name, e.type, e.total_marks, e.passing_marks, e.subject
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
