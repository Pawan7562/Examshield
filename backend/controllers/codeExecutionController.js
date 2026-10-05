// backend/controllers/codeExecutionController.js
// Production-grade multi-language sandboxed execution controller for ExamShield Coding Assessments

const { pool } = require('../config/database');
const { supabase } = require('../config/supabase-clean');
const {
  evaluateTestCases,
  normalizeOutput,
  areOutputsEqual,
} = require('../services/codeExecutionService');

/**
 * Extracts and parses test cases from question record or raw inputs
 */
function extractQuestionTestCases(questionRow) {
  if (!questionRow) return [];

  let testCases = [];
  if (questionRow.test_cases) {
    if (Array.isArray(questionRow.test_cases)) {
      testCases = questionRow.test_cases;
    } else if (typeof questionRow.test_cases === 'string') {
      try {
        testCases = JSON.parse(questionRow.test_cases);
      } catch (_) {}
    }
  }

  // Fallback to options JSON if test_cases column was empty
  if ((!testCases || testCases.length === 0) && questionRow.options) {
    try {
      const opts = typeof questionRow.options === 'string'
        ? JSON.parse(questionRow.options)
        : questionRow.options;
      if (opts && Array.isArray(opts.testCases)) {
        testCases = opts.testCases;
      } else if (opts && Array.isArray(opts.test_cases)) {
        testCases = opts.test_cases;
      } else if (opts && Array.isArray(opts.examples)) {
        testCases = opts.examples;
      }
    } catch (_) {}
  }

  return Array.isArray(testCases) ? testCases : [];
}

/**
 * Extracts structured metadata (executionMode, className, functionName, parameters, etc.)
 */
function extractQuestionMetadata(questionRow, reqBodyMetadata = {}) {
  let opts = {};
  if (questionRow && questionRow.options) {
    try {
      opts = typeof questionRow.options === 'string'
        ? JSON.parse(questionRow.options)
        : (questionRow.options || {});
    } catch (_) {}
  }
  const bodyMeta = (reqBodyMetadata && typeof reqBodyMetadata === 'object') ? reqBodyMetadata : {};
  return {
    executionMode: bodyMeta.executionMode || bodyMeta.execution_mode || bodyMeta.executionFormat || opts.executionMode || opts.execution_mode || opts.executionFormat,
    className: bodyMeta.className || bodyMeta.class_name || opts.className || opts.class_name,
    functionName: bodyMeta.functionName || bodyMeta.function_name || opts.functionName || opts.function_name,
    parameters: (Array.isArray(bodyMeta.parameters) && bodyMeta.parameters.length > 0) ? bodyMeta.parameters : opts.parameters,
    returnType: bodyMeta.returnType || bodyMeta.return_type || opts.returnType || opts.return_type,
    comparisonMode: bodyMeta.comparisonMode || bodyMeta.comparison_mode || opts.comparisonMode || opts.comparison_mode,
    tolerance: bodyMeta.tolerance ?? opts.tolerance ?? 0.0001,
  };
}

/**
 * POST /api/student/run-code
 * Runs code against sample test cases or custom student input
 */
exports.runCode = async (req, res) => {
  try {
    const {
      questionId,
      code,
      language = 'javascript',
      testCases = [],
      sessionId,
    } = req.body;
    const customInput = req.body.customInput !== undefined ? req.body.customInput : (req.body.input !== undefined ? req.body.input : null);

    const studentId = req.user?.id;

    if (!code || typeof code !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Code is required for execution.',
      });
    }

    let casesToRun = [];
    let timeLimitMs = 2000;
    let memoryLimitMb = 256;
    let qRow = null;

    if (questionId) {
      try {
        const qRes = await pool.query(
          'SELECT id, test_cases, options, time_limit, memory_limit FROM questions WHERE id = $1',
          [questionId]
        );
        if (qRes.rows.length > 0) {
          qRow = qRes.rows[0];
          timeLimitMs = qRow.time_limit || 2000;
          memoryLimitMb = qRow.memory_limit || 256;
        }
      } catch (err) {
        console.warn('Failed to query question in runCode:', err.message);
      }
    }

    const questionMetadata = extractQuestionMetadata(qRow, req.body.questionMetadata || req.body.options || req.body.metadata);

    // If custom test case input is provided
    if (customInput !== null && customInput !== undefined && String(customInput).trim() !== '') {
      casesToRun = [{ input: String(customInput).trim(), output: '', is_hidden: false }];
    } else if (Array.isArray(testCases) && testCases.length > 0) {
      // Only run public sample cases (never run hidden cases in run-code)
      casesToRun = testCases.filter(tc => !tc.is_hidden && !tc.isHidden).slice(0, 4);
      if (casesToRun.length === 0) {
        casesToRun = testCases.slice(0, 2).map(tc => ({ ...tc, is_hidden: false }));
      }
    } else if (qRow) {
      // Fetch public sample test cases from database
      const allCases = extractQuestionTestCases(qRow);
      casesToRun = allCases.filter(tc => !tc.is_hidden && !tc.isHidden).slice(0, 4);
      if (casesToRun.length === 0 && allCases.length > 0) {
        // If none explicitly marked, treat first 2 as sample
        casesToRun = allCases.slice(0, 2).map(tc => ({ ...tc, is_hidden: false }));
      }
    }

    if (casesToRun.length === 0) {
      casesToRun = [{ input: '', output: '', is_hidden: false }];
    }

    const result = await evaluateTestCases(code, language, casesToRun, {
      timeLimitMs,
      memoryLimitMb,
      isSampleOnly: true,
      questionMarks: 10,
      questionMetadata,
    });

    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Run code error:', error);
    return res.status(500).json({
      success: false,
      message: 'Execution error: ' + error.message,
    });
  }
};

/**
 * POST /api/student/submit-code
 * Evaluates candidate code against ALL authoritative test cases (sample + hidden) on server
 * Persists answer and score immediately. Returns sanitized result without leaking hidden inputs.
 */
exports.submitCode = async (req, res) => {
  try {
    const questionId = req.body.questionId || req.body.question_id;
    const examId = req.body.examId || req.body.exam_id;
    const sessionId = req.body.sessionId || req.body.session_id;
    const code = req.body.code;
    const language = req.body.language || 'javascript';

    const studentId = req.user?.id;

    if (!code || typeof code !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Code is required for submission.',
      });
    }

    if (!questionId) {
      return res.status(400).json({
        success: false,
        message: 'Question ID is required for submission.',
      });
    }

    // 1. Fetch Question from database with test cases and configured marks
    const qRes = await pool.query(
      'SELECT id, exam_id, marks, time_limit, memory_limit, test_cases, options FROM questions WHERE id = $1',
      [questionId]
    );

    if (qRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Question not found.',
      });
    }

    const question = qRes.rows[0];
    const targetExamId = examId || question.exam_id;
    const questionMarks = Number(question.marks) || 10;
    const timeLimitMs = question.time_limit || 2000;
    const memoryLimitMb = question.memory_limit || 256;

    // 2. Authorization check: verify student has access to this exam
    if (studentId && targetExamId) {
      const accessCheck = await pool.query(
        `SELECT e.id FROM exams e
         WHERE e.id = $1 AND (
           e.college_id = $2 OR
           EXISTS (SELECT 1 FROM exam_assignments ea WHERE ea.exam_id = $1 AND ea.student_id = $3) OR
           EXISTS (SELECT 1 FROM exam_sessions es WHERE es.exam_id = $1 AND es.student_id = $3)
         )`,
        [targetExamId, req.user?.college_id, studentId]
      );

      if (accessCheck.rows.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'You are not authorized for this examination question.',
        });
      }
    }

    // 3. Extract authoritative test cases (public + hidden)
    const testCases = extractQuestionTestCases(question);
    const casesToRun = testCases.length > 0 ? testCases : [{ input: '', output: '', is_hidden: false }];
    const questionMetadata = extractQuestionMetadata(question, req.body.questionMetadata || req.body.metadata);

    // 4. Run server-side evaluation across all test cases
    const evaluation = await evaluateTestCases(code, language, casesToRun, {
      timeLimitMs,
      memoryLimitMb,
      isSampleOnly: false,
      questionMarks,
      questionMetadata,
    });

    // 5. Persist submission in answers table (atomic upsert)
    // Find active session if sessionId not provided
    let activeSessionId = sessionId;
    if (!activeSessionId && studentId && targetExamId) {
      const sRes = await pool.query(
        'SELECT id FROM exam_sessions WHERE exam_id = $1 AND student_id = $2 ORDER BY started_at DESC LIMIT 1',
        [targetExamId, studentId]
      );
      if (sRes.rows.length > 0) {
        activeSessionId = sRes.rows[0].id;
      }
    }

    if (activeSessionId && studentId) {
      const isCorrect = evaluation.status === 'Accepted';
      await pool.query(
        `INSERT INTO answers (session_id, question_id, student_id, exam_id, code_submission, selected_language, marks_obtained, is_correct, is_evaluated, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, NOW())
         ON CONFLICT (session_id, question_id)
         DO UPDATE SET
           code_submission = EXCLUDED.code_submission,
           selected_language = EXCLUDED.selected_language,
           marks_obtained = EXCLUDED.marks_obtained,
           is_correct = EXCLUDED.is_correct,
           is_evaluated = true,
           updated_at = NOW()`,
        [
          activeSessionId,
          questionId,
          studentId,
          targetExamId,
          code,
          language,
          evaluation.earnedMarks,
          isCorrect,
        ]
      );
    }

    return res.json({
      success: true,
      data: {
        ...evaluation,
        questionId,
        submittedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Submit code error:', error);
    return res.status(500).json({
      success: false,
      message: 'Submission evaluation error: ' + error.message,
    });
  }
};
