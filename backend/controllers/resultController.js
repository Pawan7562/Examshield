// controllers/resultController.js
const { query, pool } = require('../config/database');
const { sendResultNotification } = require('../services/emailService');
const { evaluateMCQAnswer, calculateGrade } = require('../utils/evaluation');

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

    res.json({ 
      success: true, 
      results: result.rows,
      data: { results: result.rows } 
    });
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

/**
 * GET /api/admin/results/:id/submission
 * Full submitted copy / answer sheet for a student result (accessible to college admin)
 */
exports.getAdminStudentSubmission = async (req, res) => {
  try {
    const { id } = req.params; // result id
    const collegeId = req.user.id;

    // Fetch result and verify it belongs to this college's exam
    const resultRes = await query(
      `SELECT r.*, 
              s.name as student_name, s.email, s.student_id as student_code, s.roll_no, s.department, s.batch,
              COALESCE(e.title, e.name, 'Examination') as exam_title, e.type as exam_type, e.subject as exam_subject,
              COALESCE(NULLIF(r.total_marks, 0), e.total_marks, 100) as exam_total_marks,
              e.passing_marks as exam_passing_marks, e.duration as exam_duration,
              e.date_time as exam_date,
              es.started_at as session_started_at, es.submitted_at as session_submitted_at,
              es.violation_count as session_violation_count, es.is_auto_submitted, es.auto_submit_reason,
              es.ip_address as session_ip, es.browser_info as session_browser
       FROM results r
       JOIN exams e ON r.exam_id = e.id
       JOIN students s ON r.student_id = s.id
       LEFT JOIN exam_sessions es ON r.session_id = es.id
       WHERE r.id = $1 AND e.college_id = $2`,
      [id, collegeId]
    );

    if (resultRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Result not found or unauthorized' });
    }

    const row = resultRes.rows[0];
    const examId = row.exam_id;
    const studentId = row.student_id;

    // Fetch all questions for this exam with student's answers (LEFT JOIN answers on session or student+exam)
    const questionsRes = await query(
      `SELECT 
         q.id as question_id,
         q.question_text,
         q.type as question_type,
         q.options,
         q.correct_answer,
         q.marks as question_marks,
         q.negative_marks,
         q.difficulty,
         q.order_index,
         q.code_template,
         q.test_cases,
         a.id as answer_id,
         a.selected_option,
         a.answer_text,
         a.code_submission,
         a.selected_language,
         a.marks_obtained as answer_marks_obtained,
         a.is_correct as answer_is_correct,
         a.is_evaluated as answer_is_evaluated,
         a.evaluator_remarks,
         a.submitted_at as answer_submitted_at,
         a.updated_at as answer_updated_at
       FROM questions q
       LEFT JOIN answers a ON q.id = a.question_id AND (a.session_id = $3 OR (a.student_id = $1 AND a.exam_id = $2))
       WHERE q.exam_id = $2
       ORDER BY q.order_index ASC, q.created_at ASC`,
      [studentId, examId, row.session_id]
    );

    // Build structured response
    const questions = questionsRes.rows.map((q, idx) => {
      let isAnswered = false;
      if (q.question_type === 'mcq' || q.question_type === 'true_false') {
        isAnswered = q.selected_option !== null && q.selected_option !== undefined && String(q.selected_option).trim() !== '';
      } else if (q.question_type === 'coding') {
        isAnswered = q.code_submission !== null && q.code_submission !== undefined && String(q.code_submission).trim() !== '';
      } else {
        isAnswered = q.answer_text !== null && q.answer_text !== undefined && String(q.answer_text).trim() !== '';
      }

      return {
        question_id: q.question_id,
        order_index: q.order_index !== null ? q.order_index : idx + 1,
        question_text: q.question_text,
        type: q.question_type,
        options: q.options,
        correct_answer: q.correct_answer,
        marks: Number(q.question_marks) || 1,
        negative_marks: Number(q.negative_marks) || 0,
        difficulty: q.difficulty,
        code_template: q.code_template,
        test_cases: q.test_cases,
        is_answered: isAnswered,
        answer: {
          id: q.answer_id,
          selected_option: q.selected_option,
          answer_text: q.answer_text,
          code_submission: q.code_submission,
          selected_language: q.selected_language,
          marks_obtained: q.answer_marks_obtained !== null ? Number(q.answer_marks_obtained) : null,
          is_correct: q.answer_is_correct,
          is_evaluated: q.answer_is_evaluated,
          evaluator_remarks: q.evaluator_remarks,
          submitted_at: q.answer_submitted_at || q.answer_updated_at
        }
      };
    });

    const fullResult = {
      id: row.id,
      student_id: row.student_id,
      exam_id: row.exam_id,
      session_id: row.session_id,
      marks_obtained: Number(row.marks_obtained) || 0,
      total_marks: Number(row.total_marks) || Number(row.exam_total_marks) || 100,
      exam_total_marks: Number(row.total_marks) || Number(row.exam_total_marks) || 100,
      exam_passing_marks: Number(row.exam_passing_marks) || 40,
      percentage: Number(row.percentage) || 0,
      grade: row.grade,
      status: row.status,
      student_name: row.student_name,
      student_code: row.student_code,
      roll_no: row.roll_no,
      email: row.email,
      department: row.department,
      batch: row.batch,
      exam_title: row.exam_title,
      exam_name: row.exam_title,
      exam_type: row.exam_type,
      exam_subject: row.exam_subject,
      exam_duration: row.exam_duration,
      exam_date: row.exam_date,
      session_started_at: row.session_started_at,
      session_submitted_at: row.session_submitted_at,
      session_violation_count: row.session_violation_count || 0,
      is_auto_submitted: row.is_auto_submitted,
      auto_submit_reason: row.auto_submit_reason,
      session_ip: row.session_ip,
      session_browser: row.session_browser,
      mcq_marks: Number(row.mcq_marks) || 0,
      coding_marks: Number(row.coding_marks) || 0,
      subjective_marks: Number(row.subjective_marks) || 0,
      is_published: row.is_published,
      submitted_at: row.submitted_at || row.created_at,
      created_at: row.created_at,
      updated_at: row.updated_at
    };

    res.json({
      success: true,
      data: {
        result: fullResult,
        student: {
          id: row.student_id,
          name: row.student_name,
          email: row.email,
          student_id: row.student_code,
          roll_no: row.roll_no,
          department: row.department,
          batch: row.batch
        },
        exam: {
          id: row.exam_id,
          title: row.exam_title,
          type: row.exam_type,
          subject: row.exam_subject,
          total_marks: Number(row.exam_total_marks) || 100,
          passing_marks: Number(row.exam_passing_marks) || 40,
          duration: row.exam_duration,
          date_time: row.exam_date
        },
        session: {
          id: row.session_id,
          started_at: row.session_started_at,
          submitted_at: row.session_submitted_at,
          violation_count: row.session_violation_count || 0,
          is_auto_submitted: row.is_auto_submitted,
          auto_submit_reason: row.auto_submit_reason,
          ip_address: row.session_ip,
          browser_info: row.session_browser
        },
        questions
      }
    });
  } catch (error) {
    console.error('getAdminStudentSubmission error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch student submission', error: error.message });
  }
};

/**
 * POST /api/admin/results/:id/re-evaluate
 * Auto re-grades a submission using the intelligent evaluation engine
 */
exports.reevaluateResult = async (req, res) => {
  try {
    const { id } = req.params;
    const collegeId = req.user.id;

    const resCheck = await query(
      `SELECT r.*, e.total_marks as exam_total, e.passing_marks as exam_passing
       FROM results r
       JOIN exams e ON r.exam_id = e.id
       WHERE r.id = $1 AND e.college_id = $2`,
      [id, collegeId]
    );

    if (resCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Result not found or unauthorized' });
    }

    const { student_id, exam_id } = resCheck.rows[0];

    // Fetch questions and answers
    const questionsRes = await query('SELECT * FROM questions WHERE exam_id = $1', [exam_id]);
    const answersRes = await query('SELECT * FROM answers WHERE exam_id = $1 AND student_id = $2', [exam_id, student_id]);

    const questionMap = new Map(questionsRes.rows.map(q => [q.id, q]));
    let mcqMarks = 0;
    let codingMarks = 0;
    let subjectiveMarks = 0;

    for (const ans of answersRes.rows) {
      const q = questionMap.get(ans.question_id);
      if (!q) continue;

      if (q.type === 'mcq' || q.type === 'true_false') {
        const isCor = evaluateMCQAnswer(ans.selected_option, q.correct_answer, q.options);
        const marks = isCor ? (Number(q.marks) || 1) : -Math.abs(Number(q.negative_marks) || 0);
        const finalQMarks = Math.max(0, marks);
        mcqMarks += finalQMarks;

        await query(
          'UPDATE answers SET is_correct = $1, marks_obtained = $2, is_evaluated = true, updated_at = NOW() WHERE id = $3',
          [isCor, finalQMarks, ans.id]
        );
      } else if (q.type === 'coding') {
        const maxM = Number(q.marks) || 10;
        let earned = 0;
        if (ans.marks_obtained !== null && ans.marks_obtained !== undefined) {
          earned = Number(ans.marks_obtained);
        } else if (ans.code_submission && ans.code_submission.trim().length > 10) {
          earned = maxM;
        }
        codingMarks += earned;
        await query(
          'UPDATE answers SET is_correct = $1, marks_obtained = $2, is_evaluated = true, updated_at = NOW() WHERE id = $3',
          [earned > 0, earned, ans.id]
        );
      } else if (q.type === 'subjective') {
        if (ans.marks_obtained !== null && ans.marks_obtained !== undefined) {
          subjectiveMarks += Number(ans.marks_obtained);
        }
      }
    }

    const totalPossible = Number(resCheck.rows[0].exam_total) || questionsRes.rows.reduce((sum, q) => sum + (Number(q.marks) || 1), 0);
    const configuredPassing = Number(resCheck.rows[0].exam_passing);
    const passThreshold = (configuredPassing && configuredPassing <= totalPossible)
      ? configuredPassing
      : Math.max(1, Math.round(totalPossible * 0.4));

    const totalObtained = Math.round((mcqMarks + codingMarks + subjectiveMarks) * 100) / 100;
    const pct = totalPossible > 0 ? Math.round((totalObtained / totalPossible) * 100 * 100) / 100 : 0;
    const grade = calculateGrade(pct);
    const hasSubjective = questionsRes.rows.some(q => q.type === 'subjective');
    const isPassed = (totalObtained >= passThreshold) || (pct >= 40);
    const status = isPassed ? 'pass' : (hasSubjective ? 'pending' : 'fail');

    await query(
      `UPDATE results 
       SET marks_obtained = $1, mcq_marks = $2, coding_marks = $3, subjective_marks = $4,
           total_marks = $5, percentage = $6, grade = $7, status = $8, evaluated_at = NOW(), updated_at = NOW()
       WHERE id = $9`,
      [totalObtained, mcqMarks, codingMarks, subjectiveMarks, totalPossible, pct, grade, status, id]
    );

    res.json({
      success: true,
      message: 'Result successfully re-evaluated with updated auto-marking.',
      data: { 
        marks_obtained: totalObtained, 
        total_marks: totalPossible, 
        percentage: pct, 
        grade, 
        status, 
        mcq_marks: mcqMarks, 
        coding_marks: codingMarks, 
        subjective_marks: subjectiveMarks 
      }
    });
  } catch (error) {
    console.error('reevaluateResult error:', error);
    res.status(500).json({ success: false, message: 'Failed to re-evaluate result', error: error.message });
  }
};

/**
 * POST /api/admin/results/re-evaluate/:examId
 * Batch re-evaluate all students in an exam
 */
exports.reevaluateExam = async (req, res) => {
  try {
    const { examId } = req.params;
    const collegeId = req.user.id;

    const examRes = await query('SELECT * FROM exams WHERE id = $1 AND college_id = $2', [examId, collegeId]);
    if (examRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Exam not found or unauthorized' });
    }

    const resultsRes = await query('SELECT id FROM results WHERE exam_id = $1', [examId]);
    let evaluatedCount = 0;

    for (const r of resultsRes.rows) {
      // Re-evaluate each result
      const questionsRes = await query('SELECT * FROM questions WHERE exam_id = $1', [examId]);
      const resCheck = await query('SELECT student_id FROM results WHERE id = $1', [r.id]);
      const studentId = resCheck.rows[0].student_id;
      const answersRes = await query('SELECT * FROM answers WHERE exam_id = $1 AND student_id = $2', [examId, studentId]);

      const questionMap = new Map(questionsRes.rows.map(q => [q.id, q]));
      let mcqMarks = 0;
      let codingMarks = 0;
      let subjectiveMarks = 0;

      for (const ans of answersRes.rows) {
        const q = questionMap.get(ans.question_id);
        if (!q) continue;

        if (q.type === 'mcq' || q.type === 'true_false') {
          const isCor = evaluateMCQAnswer(ans.selected_option, q.correct_answer, q.options);
          const marks = isCor ? (Number(q.marks) || 1) : -Math.abs(Number(q.negative_marks) || 0);
          const finalQMarks = Math.max(0, marks);
          mcqMarks += finalQMarks;

          await query(
            'UPDATE answers SET is_correct = $1, marks_obtained = $2, is_evaluated = true, updated_at = NOW() WHERE id = $3',
            [isCor, finalQMarks, ans.id]
          );
        } else if (q.type === 'coding') {
          const maxM = Number(q.marks) || 10;
          let earned = 0;
          if (ans.marks_obtained !== null && ans.marks_obtained !== undefined) {
            earned = Number(ans.marks_obtained);
          } else if (ans.code_submission && ans.code_submission.trim().length > 10) {
            earned = maxM;
          }
          codingMarks += earned;
          await query(
            'UPDATE answers SET is_correct = $1, marks_obtained = $2, is_evaluated = true, updated_at = NOW() WHERE id = $3',
            [earned > 0, earned, ans.id]
          );
        } else if (q.type === 'subjective') {
          if (ans.marks_obtained !== null && ans.marks_obtained !== undefined) {
            subjectiveMarks += Number(ans.marks_obtained);
          }
        }
      }

      const totalPossible = Number(examRes.rows[0].total_marks) || questionsRes.rows.reduce((sum, q) => sum + (Number(q.marks) || 1), 0);
      const configuredPassing = Number(examRes.rows[0].passing_marks);
      const passThreshold = (configuredPassing && configuredPassing <= totalPossible)
        ? configuredPassing
        : Math.max(1, Math.round(totalPossible * 0.4));

      const totalObtained = Math.round((mcqMarks + codingMarks + subjectiveMarks) * 100) / 100;
      const pct = totalPossible > 0 ? Math.round((totalObtained / totalPossible) * 100 * 100) / 100 : 0;
      const grade = calculateGrade(pct);
      const hasSubjective = questionsRes.rows.some(q => q.type === 'subjective');
      const isPassed = (totalObtained >= passThreshold) || (pct >= 40);
      const status = isPassed ? 'pass' : (hasSubjective ? 'pending' : 'fail');

      await query(
        `UPDATE results 
         SET marks_obtained = $1, mcq_marks = $2, coding_marks = $3, subjective_marks = $4,
             total_marks = $5, percentage = $6, grade = $7, status = $8, evaluated_at = NOW(), updated_at = NOW()
         WHERE id = $9`,
        [totalObtained, mcqMarks, codingMarks, subjectiveMarks, totalPossible, pct, grade, status, r.id]
      );

      evaluatedCount++;
    }

    res.json({
      success: true,
      message: `Successfully re-evaluated ${evaluatedCount} submissions for this exam.`
    });
  } catch (error) {
    console.error('reevaluateExam error:', error);
    res.status(500).json({ success: false, message: 'Failed to batch re-evaluate exam', error: error.message });
  }
};

