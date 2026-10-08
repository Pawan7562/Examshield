// controllers/examController.js
const { pool } = require('../config/database');
const { supabase } = require('../config/supabase-clean');
const { sendExamNotification, sendExamReminder } = require('../services/emailService');
const { v4: uuidv4 } = require('uuid');
const { parseToIST, toISTISOString, formatIST, getExamWindowStatus } = require('../utils/timezone');
const { evaluateMCQAnswer, calculateGrade } = require('../utils/evaluation');
const { autoCloseExpiredExams, checkAndCloseSpecificExam } = require('../services/examLifecycleService');

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

/**
 * Format and normalize question for student exam room
 * Guarantees all coding metadata (problem statement, input/output format, constraints, examples, test cases)
 * are thoroughly unpacked and accessible.
 */
const formatQuestionForStudent = (q) => {
  if (!q) return null;
  let parsedOptions = q.options;
  let meta = {};

  if (typeof parsedOptions === 'string') {
    try {
      const parsed = JSON.parse(parsedOptions);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        meta = parsed;
        parsedOptions = [];
      } else if (Array.isArray(parsed)) {
        parsedOptions = parsed;
      }
    } catch (e) {
      parsedOptions = [];
    }
  } else if (parsedOptions && typeof parsedOptions === 'object') {
    if (Array.isArray(parsedOptions)) {
      parsedOptions = parsedOptions;
    } else {
      meta = parsedOptions;
      parsedOptions = [];
    }
  }

  let parsedTestCases = q.test_cases || q.testCases || meta.testCases || meta.test_cases || [];
  if (typeof parsedTestCases === 'string') {
    try {
      parsedTestCases = JSON.parse(parsedTestCases);
    } catch (e) {
      parsedTestCases = [];
    }
  }

  let parsedExamples = q.examples || meta.examples || [];
  if (typeof parsedExamples === 'string') {
    try {
      parsedExamples = JSON.parse(parsedExamples);
    } catch (e) {
      parsedExamples = [];
    }
  }

  // Cross-pollinate: if no test cases but examples exist, use examples as test cases; if no examples, use test cases
  if ((!parsedTestCases || parsedTestCases.length === 0) && Array.isArray(parsedExamples) && parsedExamples.length > 0) {
    parsedTestCases = parsedExamples;
  }
  if ((!parsedExamples || parsedExamples.length === 0) && Array.isArray(parsedTestCases) && parsedTestCases.length > 0) {
    parsedExamples = parsedTestCases;
  }

  // Strictly filter for public test cases for the student payload
  let studentVisibleCases = [];
  if (Array.isArray(parsedTestCases) && parsedTestCases.length > 0) {
    const explicitlyPublic = parsedTestCases.filter(tc => !tc.is_hidden && !tc.isHidden);
    if (explicitlyPublic.length > 0) {
      studentVisibleCases = explicitlyPublic;
    } else {
      studentVisibleCases = parsedTestCases.slice(0, 2).map(tc => ({ ...tc, is_hidden: false }));
    }
  } else if (Array.isArray(parsedExamples) && parsedExamples.length > 0) {
    studentVisibleCases = parsedExamples;
  }

  // If studentVisibleCases only has 1 case, check if parsedTestCases has more cases to show as sample cases
  if (studentVisibleCases.length === 1 && Array.isArray(parsedTestCases) && parsedTestCases.length > 1) {
    studentVisibleCases = parsedTestCases.slice(0, 2).map(tc => ({ ...tc, is_hidden: false }));
  }

  // Sanitize studentVisibleCases so that only input, output, and explanation are exposed
  const sanitizedSampleCases = studentVisibleCases.map(tc => ({
    input: tc.input !== undefined ? tc.input : '',
    output: tc.output !== undefined ? tc.output : (tc.expectedOutput || tc.expected_output || ''),
    explanation: tc.explanation || '',
    is_hidden: false
  }));

  const isCoding = q.type === 'coding' ||
    !!q.problemStatement ||
    !!meta.problemStatement ||
    (Array.isArray(parsedTestCases) && parsedTestCases.length > 0) ||
    (Array.isArray(parsedExamples) && parsedExamples.length > 0);

  // Clean, concise LeetCode title
  let cleanTitle = q.title || meta.title || '';
  if (!cleanTitle && q.question_text) {
    const firstLine = q.question_text.split('\n')[0].replace(/^#+\s*/, '').replace(/^[Q0-9:.-]+\s*/, '').trim();
    if (firstLine.length > 50) {
      if (/two\s*sum|indices of two|sum is equal to target|pair.*sum/i.test(q.question_text)) {
        cleanTitle = 'Two Sum';
      } else if (/palindrome/i.test(q.question_text)) {
        cleanTitle = 'Valid Palindrome';
      } else if (/parenthes/i.test(q.question_text)) {
        cleanTitle = 'Valid Parentheses';
      } else if (/binary\s*search/i.test(q.question_text)) {
        cleanTitle = 'Binary Search';
      } else {
        const periodIdx = firstLine.indexOf('.');
        cleanTitle = periodIdx > 10 && periodIdx < 45 ? firstLine.slice(0, periodIdx).trim() : 'Coding Assessment Problem';
      }
    } else {
      cleanTitle = firstLine;
    }
  }
  if (!cleanTitle) cleanTitle = 'Coding Challenge';

  const problemStatement = q.problemStatement || meta.problemStatement || q.question_text || 'Problem Statement';
  const totalTestCasesCount = Array.isArray(parsedTestCases) ? parsedTestCases.length : sanitizedSampleCases.length;

  const difficulty = (q.difficulty || meta.difficulty || 'medium').toLowerCase();
  const timeComplexity = q.timeComplexity || meta.timeComplexity || (difficulty === 'easy' ? 'O(n)' : difficulty === 'hard' ? 'O(n log n)' : 'O(n)');
  const spaceComplexity = q.spaceComplexity || meta.spaceComplexity || (difficulty === 'easy' ? 'O(1)' : 'O(n)');

  // Normalize constraints into an array of clean strings
  let rawConstraints = Array.isArray(q.constraints) && q.constraints.length > 0
    ? q.constraints
    : (Array.isArray(meta.constraints) ? meta.constraints : (meta.constraints ? [meta.constraints] : (q.constraints ? [q.constraints] : [])));
  let normalizedConstraints = [];
  rawConstraints.forEach(c => {
    if (typeof c === 'string' && c.includes('\n')) {
      c.split('\n').map(s => s.trim()).filter(Boolean).forEach(s => normalizedConstraints.push(s));
    } else if (c) {
      normalizedConstraints.push(String(c).trim());
    }
  });
  if (normalizedConstraints.length === 0) {
    normalizedConstraints = [
      '2 ≤ nums.length ≤ 10⁴',
      '-10⁹ ≤ nums[i] ≤ 10⁹',
      '-10⁹ ≤ target ≤ 10⁹',
      'Only one valid answer exists.'
    ];
  }

  return {
    id: q.id,
    title: cleanTitle,
    question_text: q.question_text || problemStatement,
    problemStatement: problemStatement,
    inputFormat: q.inputFormat || meta.inputFormat || '',
    outputFormat: q.outputFormat || meta.outputFormat || '',
    constraints: normalizedConstraints,
    examples: sanitizedSampleCases,
    sampleTestCases: sanitizedSampleCases,
    testCases: sanitizedSampleCases,
    totalTestCases: totalTestCasesCount,
    total_test_cases: totalTestCasesCount,
    hiddenTestCasesCount: Math.max(0, totalTestCasesCount - sanitizedSampleCases.length),
    hints: Array.isArray(q.hints) ? q.hints : (meta.hints || []),
    solutionApproach: q.solutionApproach || meta.solutionApproach || '',
    timeComplexity: timeComplexity,
    spaceComplexity: spaceComplexity,
    allowedLanguages: q.allowedLanguages || meta.allowedLanguages || ['javascript', 'python', 'java', 'cpp'],
    executionFormat: q.executionFormat || meta.executionFormat || 'stdin_stdout',
    type: isCoding ? 'coding' : (q.type || 'mcq'),
    options: isCoding ? {
      ...meta,
      title: cleanTitle,
      inputFormat: q.inputFormat || meta.inputFormat || '',
      outputFormat: q.outputFormat || meta.outputFormat || '',
      constraints: normalizedConstraints,
      examples: sanitizedSampleCases,
      testCases: sanitizedSampleCases,
      totalTestCases: totalTestCasesCount,
      timeComplexity: timeComplexity,
      spaceComplexity: spaceComplexity,
      executionFormat: q.executionFormat || meta.executionFormat || 'stdin_stdout',
      allowedLanguages: q.allowedLanguages || meta.allowedLanguages || ['javascript', 'python', 'java', 'cpp']
    } : parsedOptions,
    marks: q.marks || (isCoding ? 10 : 1),
    order_index: q.order_index,
    code_template: q.code_template || q.codeTemplate || meta.codeTemplate || null,
    time_limit: q.time_limit || q.timeLimit || meta.timeLimit || 2000,
    memory_limit: q.memory_limit || q.memoryLimit || meta.memoryLimit || 256,
    difficulty: difficulty
  };
};

// Async function to process exam data without blocking the response
const processExamDataAsync = async (examId, questions, studentQuestionSets, studentIds, examQuestionRandomization) => {
  console.log('Processing exam data asynchronously for exam:', examId);
  
  try {
    // Handle questions if provided
    if (questions && questions.length > 0) {
      try {
        const questionsToInsert = questions.map((q, index) => {
          // Robustly detect coding questions vs MCQ
          const isCoding = q.type === 'coding' || !!q.problemStatement || !!q.problem_statement ||
            (Array.isArray(q.testCases) && q.testCases.length > 0) ||
            (Array.isArray(q.test_cases) && q.test_cases.length > 0) ||
            (Array.isArray(q.examples) && q.examples.length > 0);
          const type = isCoding ? 'coding' : (q.type || 'mcq');
          const marks = q.marks || (type === 'coding' ? 10 : 1);
          const correctAnswer = q.correctAnswer || q.answer || q.correct_answer || null;
          const codeTemplate = q.codeTemplate || q.code_template || q.solutionCode || null;
          const timeLimit = q.timeLimit || q.time_limit || (type === 'coding' ? 2000 : null);
          const difficulty = q.difficulty || 'medium';

          // Extract primary question text
          const questionText = q.problemStatement || q.problem_statement || q.questionText || q.question_text || q.description || q.title || q.question || 'Coding Problem';

          // Test cases payload
          const rawTestCases = q.testCases || q.test_cases || q.examples || [];
          const testCasesJson = Array.isArray(rawTestCases) && rawTestCases.length > 0
            ? JSON.stringify(rawTestCases)
            : (typeof rawTestCases === 'string' ? rawTestCases : null);

          // Rich options payload (stores structured coding fields for pristine rendering)
          let optionsPayload;
          if (isCoding) {
            const execMode = q.executionMode || q.execution_mode || (q.executionFormat === 'stdin_stdout' ? 'STANDARD_INPUT_OUTPUT' : 'FUNCTION_BASED');
            optionsPayload = JSON.stringify({
              title: q.title || '',
              problemStatement: q.problemStatement || q.problem_statement || questionText,
              inputFormat: q.inputFormat || q.input_format || '',
              outputFormat: q.outputFormat || q.output_format || '',
              constraints: Array.isArray(q.constraints) ? q.constraints : (q.constraints ? [q.constraints] : []),
              examples: Array.isArray(q.examples) ? q.examples : [],
              testCases: Array.isArray(q.testCases) ? q.testCases : (Array.isArray(q.test_cases) ? q.test_cases : []),
              hints: Array.isArray(q.hints) ? q.hints : [],
              solutionApproach: q.solutionApproach || q.solution_approach || '',
              timeComplexity: q.timeComplexity || '',
              spaceComplexity: q.spaceComplexity || '',
              allowedLanguages: q.allowedLanguages || ['javascript', 'python', 'java', 'cpp'],
              executionFormat: q.executionFormat || (execMode === 'FUNCTION_BASED' ? 'function' : 'stdin_stdout'),
              executionMode: execMode,
              className: q.className || q.class_name || 'Solution',
              functionName: q.functionName || q.function_name || '',
              parameters: Array.isArray(q.parameters) ? q.parameters : [],
              returnType: q.returnType || q.return_type || 'void',
              comparisonMode: q.comparisonMode || q.comparison_mode || 'EXACT',
              tolerance: q.tolerance !== undefined ? Number(q.tolerance) : 0.0001,
            });
          } else {
            const options = q.options || [];
            optionsPayload = typeof options === 'string' ? options : JSON.stringify(options);
          }

          return {
            exam_id: examId,
            question_text: questionText,
            type: type,
            marks: marks,
            options: optionsPayload,
            correct_answer: correctAnswer,
            order_index: index + 1,
            code_template: codeTemplate,
            time_limit: timeLimit,
            memory_limit: q.memoryLimit || q.memory_limit || (type === 'coding' ? 256 : null),
            difficulty: difficulty,
            test_cases: testCasesJson,
            section_id: q.sectionId || null,
            section_name: q.sectionName || null
          };
        });

        console.log(`Inserting ${questionsToInsert.length} questions for exam ${examId}`);
        const { error: questionsError } = await supabase
          .from('questions')
          .insert(questionsToInsert);

        if (questionsError) {
          console.error('Questions insertion error:', questionsError);
          // Fallback: Always store questions in exam table mapping for safety
          const qJson = JSON.stringify(questions);
          await supabase
            .from('exams')
            .update({ 
               description: '\n\nQuestions: ' + qJson
            })
            .eq('id', examId);
          console.log('Questions stored in exam description as fallback due to table error');
        } else {
          console.log('Successfully inserted', questions.length, 'questions into the questions table');
        }
      } catch (error) {
        console.error('Error in question processing:', error);
      }
    }

    // Store student question sets if randomization is enabled
    if (examQuestionRandomization && studentQuestionSets && Object.keys(studentQuestionSets).length > 0) {
      try {
        const studentSetsToInsert = [];
        
        Object.entries(studentQuestionSets).forEach(([studentId, questionSet]) => {
          questionSet.forEach((q, index) => {
            studentSetsToInsert.push({
              exam_id: examId,
              student_id: studentId,
              question_id: q.id,
              question_order: index + 1,
              question_data: q,
              random_seed: q.randomSeed
            });
          });
        });

        if (studentSetsToInsert.length > 0) {
          const { error: setsError } = await supabase
            .from('student_question_sets')
            .insert(studentSetsToInsert);

          if (setsError) {
            console.error('Student question sets insertion error:', setsError);
          } else {
            console.log('Successfully created question sets for', Object.keys(studentQuestionSets).length, 'students');
          }
        }
      } catch (error) {
        console.error('Error inserting student question sets:', error);
      }
    }

    // Handle student assignments if provided
    if (studentIds && studentIds.length > 0) {
      try {
        // Strict multi-tenant isolation: only assign students belonging to this college
        const { rows: validStudentRows } = await pool.query(
          'SELECT id FROM students WHERE id = ANY($1) AND college_id = $2',
          [studentIds, collegeId]
        );
        const validStudentIds = validStudentRows.map(r => r.id);

        if (validStudentIds.length > 0) {
          const studentAssignments = validStudentIds.map(studentId => ({
            exam_id: examId,
            student_id: studentId,
            status: 'assigned'
          }));

          const { error: assignmentError } = await supabase
            .from('exam_assignments')
            .insert(studentAssignments);

          if (assignmentError) {
            console.error('Student assignment error:', assignmentError);
          } else {
            console.log('Successfully assigned', validStudentIds.length, 'students to exam');
          }
        }
      } catch (error) {
        console.error('Error assigning students:', error);
      }
    }
    
    // Send email notifications to assigned students
    if (studentIds && studentIds.length > 0) {
      try {
        const { sendExamNotification } = require('../services/emailService');
        
        // Get assigned students' details
        const { data: students, error: studentsError } = await supabase
          .from('students')
          .select('name, email')
          .in('id', studentIds);

        if (!studentsError && students && students.length > 0) {
          // Get exam details for email
          const { data: examData } = await supabase
            .from('exams')
            .select('title, subject, date_time, duration, exam_code, college_id')
            .eq('id', examId)
            .maybeSingle();

          let resolvedCollegeName = 'Your Institution';
          if (examData?.college_id) {
            const { data: collegeRec } = await supabase
              .from('colleges')
              .select('name')
              .eq('id', examData.college_id)
              .maybeSingle();
            if (collegeRec?.name) {
              resolvedCollegeName = collegeRec.name;
            }
          }

          const loginUrl = process.env.STUDENT_LOGIN_URL || 
            (process.env.NODE_ENV === 'development' ? 'http://localhost:3002/student/login' : 'https://exam.nexifyforge.in/student/login');

          // Send email to each assigned student
          for (const student of students) {
            try {
              // Note: sendExamNotification is non-blocking (setImmediate)
              sendExamNotification({
                name: student.name,
                email: student.email,
                examName: examData?.title || 'Upcoming Exam',
                examDate: examData?.date_time || new Date(),
                examDuration: examData?.duration || 60,
                examKey: examData?.exam_code || 'TBD',
                subject: examData?.subject || 'General',
                type: 'exam',
                collegeName: resolvedCollegeName,
                loginUrl: loginUrl
              });
            } catch (emailError) {
              console.error(`❌ BACKGROUND: Failed to queue email to ${student.email}:`, emailError.message);
            }
          }
          console.log(`📧 SYSTEM: Queued notification for ${students.length} students in background.`);
        } else if (studentsError) {
          console.error('Error fetching students for email:', studentsError);
        }
      } catch (emailError) {
        console.error('Email notification error:', emailError);
      }
    }
    
    console.log('Async processing completed for exam:', examId);
  } catch (error) {
    console.error('Error in async processing:', error);
  }
};

// =====================================================
// ADMIN - EXAM MANAGEMENT
// =====================================================

/**
 * GET /api/admin/debug/schema
 * Debug endpoint to check database schema
 */
exports.debugSchema = async (req, res) => {
  try {
    console.log('🔍 Debug: Checking database schema');
    
    // Check if exam_questions table exists
    const { data: examQuestionsTable, error: examQuestionsError } = await supabase
      .from('exam_questions')
      .select('*')
      .limit(1);
    
    console.log('📋 exam_questions table check:', {
      error: examQuestionsError,
      exists: !examQuestionsError,
      count: examQuestionsTable?.length || 0
    });
    
    // Check if questions table exists
    const { data: questionsTable, error: questionsError } = await supabase
      .from('questions')
      .select('*')
      .limit(1);
    
    console.log('📋 questions table check:', {
      error: questionsError,
      exists: !questionsError,
      count: questionsTable?.length || 0
    });
    
    // Get sample exam data
    const { data: sampleExam, error: examError } = await supabase
      .from('exams')
      .select('id, title, description')
      .limit(3);
    
    console.log('📋 Sample exams:', {
      error: examError,
      count: sampleExam?.length || 0,
      exams: sampleExam?.map(e => ({ id: e.id, title: e.title, hasDescription: !!e.description }))
    });
    
    res.json({
      success: true,
      data: {
        exam_questions: {
          exists: !examQuestionsError,
          error: examQuestionsError?.message,
          sampleCount: examQuestionsTable?.length || 0
        },
        questions: {
          exists: !questionsError,
          error: questionsError?.message,
          sampleCount: questionsTable?.length || 0
        },
        exams: {
          count: sampleExam?.length || 0,
          samples: sampleExam?.map(e => ({ 
            id: e.id, 
            title: e.title, 
            hasDescription: !!e.description,
            descriptionLength: e.description?.length || 0
          }))
        }
      }
    });
    
  } catch (error) {
    console.error('Debug schema error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
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
 * GET /api/admin/exams/health-check
 * Health check endpoint
 */
exports.healthCheck = async (req, res) => {
  try {
    console.log('Health check request received');
    res.status(200).json({ 
      success: true, 
      message: 'Backend is running',
      timestamp: new Date().toISOString(),
      user: req.user ? { id: req.user.id } : null
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Health check failed',
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
    console.log('=== CREATE EXAM REQUEST ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    const {
      title, name, description, type, subject, dateTime, duration, totalMarks,
      passingMarks, instructions, isProctored, maxViolations, studentIds, questions,
      studentQuestionSets, questionRandomization, aiGenerated,
      monitoringConfig, monitoring_config,
      sections
    } = req.body;
    const collegeId = req.user?.id;

    console.log('User info:', { user: req.user, collegeId });

    if (!collegeId) {
      console.log('No college ID found in request');
      return res.status(401).json({ 
        success: false, 
        message: 'Unauthorized - No college ID found' 
      });
    }

    console.log('Extracted fields:', {
      title, name, type, subject, dateTime, duration, totalMarks,
      passingMarks, isProctored, maxViolations,
      questionsCount: questions?.length || 0,
      studentIdsCount: studentIds?.length || 0,
      hasStudentQuestionSets: !!studentQuestionSets,
      questionRandomization,
      aiGenerated,
      monitoringConfig: monitoringConfig || monitoring_config
    });

    // Accept both title and name for flexibility
    const examTitle = title || name || 'Untitled Exam';

    // Set default values for missing required fields
    const examType = type || 'mcq';
    const examDateTime = dateTime ? toISTISOString(dateTime) : toISTISOString(new Date());
    const examDuration = duration || 60;
    const examTotalMarks = totalMarks || 100;
    const examSubject = subject || 'General';
    const examDescription = description || '';
    const examInstructions = instructions || '';
    const examIsProctored = isProctored !== false;
    const examMaxViolations = maxViolations || 3;
    const examQuestionRandomization = questionRandomization || false;
    const examAiGenerated = aiGenerated || false;

    // Granular proctoring / monitoring settings (per-exam)
    const defaultMonitoringConfig = {
      face_detection: true,
      voice_detection: true,
      tab_switch: true,
      fullscreen: true,
      device_camera: true
    };
    const resolvedMonitoringConfig = (monitoringConfig || monitoring_config) 
      ? { ...defaultMonitoringConfig, ...(monitoringConfig || monitoring_config) }
      : defaultMonitoringConfig;

    console.log('Processed exam data:', {
      examTitle, examType, examDateTime, examDuration, examTotalMarks,
      examSubject, examIsProctored, examQuestionRandomization, examAiGenerated,
      resolvedMonitoringConfig
    });

    if (!examType || !examDateTime || !examDuration || !examTotalMarks) {
      console.log('Validation failed - missing required fields');
      return res.status(400).json({ success: false, message: 'Required fields missing.' });
    }

    const examCode = await generateExamCode();

    console.log('Generated exam code:', examCode);

    // Create exam using Supabase
    const examData = {
      title: examTitle,
      description: examDescription,
      exam_code: examCode,
      type: examType,
      subject: examSubject,
      date_time: examDateTime,
      duration: examDuration,
      total_marks: examTotalMarks,
      passing_marks: (() => {
        const num = passingMarks !== undefined && passingMarks !== null && !isNaN(passingMarks) ? Number(passingMarks) : null;
        if (num !== null && num > 0) {
          if (num <= examTotalMarks) return num;
          if (num <= 100) return Math.round((examTotalMarks * num) / 100);
        }
        return Math.floor(examTotalMarks * 0.4);
      })(),
      instructions: examInstructions,
      is_proctored: examIsProctored,
      max_violations: examMaxViolations,
      monitoring_config: resolvedMonitoringConfig,
      college_id: collegeId,
      department: req.body.department || req.body.targetDepartment || null,
      status: req.body.status || (questions && questions.length > 0 ? 'published' : 'draft')
    };

    // Only add new fields if they exist in the database
    try {
      // Check if question_randomization column exists
      const { error: checkError } = await supabase
        .from('exams')
        .select('question_randomization')
        .limit(1);
      
      if (!checkError) {
        examData.question_randomization = examQuestionRandomization;
        examData.ai_generated = examAiGenerated;
        console.log('New columns exist, adding them to insert');
      } else {
        console.log('New columns do not exist, using fallback');
      }
    } catch (checkError) {
      console.log('Could not check for new columns, using fallback');
    }

    // Store sections data if provided
    if (sections && Array.isArray(sections) && sections.length > 0) {
      try {
        const { error: secCheckError } = await supabase
          .from('exams')
          .select('sections')
          .limit(1);
        if (!secCheckError) {
          examData.sections = JSON.stringify(sections);
          console.log('Sections column exists, storing', sections.length, 'sections');
        } else {
          console.log('Sections column does not exist, skipping');
        }
      } catch (secCheckError) {
        console.log('Could not check for sections column, skipping');
      }
    }

    console.log('Final exam data to insert:', examData);

    const { data: exam, error } = await supabase
      .from('exams')
      .insert(examData)
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

    console.log('Exam created successfully:', exam.id);

    // Return immediately after creating the exam, handle questions asynchronously
    if (questions && questions.length > 0 || studentIds && studentIds.length > 0) {
      // Process questions and assignments in background
      processExamDataAsync(exam.id, questions, studentQuestionSets, studentIds, examQuestionRandomization);
    }

    console.log('Sending exam creation response');

    res.status(201).json({
      success: true,
      message: examAiGenerated ? 'AI-generated exam created successfully with question randomization' : 'Exam created successfully',
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
        monitoring_config: exam.monitoring_config || resolvedMonitoringConfig,
        status: exam.status,
        question_randomization: examQuestionRandomization,
        ai_generated: examAiGenerated,
        questions_count: questions ? questions.length : 0,
        assigned_students: studentIds ? studentIds.length : 0
      }
    });

  } catch (error) {
    console.error('=== CREATE EXAM ERROR ===');
    console.error('Error type:', typeof error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Full error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to create exam',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
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
    const { 
      name, title, description, subject, dateTime, date_time, 
      duration, totalMarks, total_marks, passingMarks, passing_marks, 
      instructions, status, type,
      monitoringConfig, monitoring_config, isProctored, is_proctored
    } = req.body;

    const examTitle = title || name;
    const examDuration = duration !== undefined ? parseInt(duration) : undefined;
    let examPass = passingMarks !== undefined ? parseInt(passingMarks) : (passing_marks !== undefined ? parseInt(passing_marks) : undefined);
    if (examPass !== undefined && !isNaN(examPass) && examTotal !== undefined && examTotal > 0) {
      if (examPass > examTotal && examPass <= 100) {
        examPass = Math.round((examTotal * examPass) / 100);
      } else if (examPass > examTotal) {
        examPass = Math.round(examTotal * 0.4);
      }
    }

    const updateFields = [];
    const updateValues = [id, collegeId];
    let idx = 3;

    if (examTitle !== undefined) {
      updateFields.push(`title = $${idx}`, `name = $${idx}`);
      updateValues.push(examTitle);
      idx++;
    }
    if (description !== undefined) {
      updateFields.push(`description = $${idx}`);
      updateValues.push(description);
      idx++;
    }
    if (subject !== undefined) {
      updateFields.push(`subject = $${idx}`);
      updateValues.push(subject);
      idx++;
    }
    if (examDuration !== undefined && !isNaN(examDuration)) {
      updateFields.push(`duration = $${idx}`);
      updateValues.push(examDuration);
      idx++;
    }
    if (examTotal !== undefined && !isNaN(examTotal)) {
      updateFields.push(`total_marks = $${idx}`);
      updateValues.push(examTotal);
      idx++;
    }
    if (examPass !== undefined && !isNaN(examPass)) {
      updateFields.push(`passing_marks = $${idx}`);
      updateValues.push(examPass);
      idx++;
    }
    if (status !== undefined) {
      updateFields.push(`status = $${idx}`);
      updateValues.push(status);
      idx++;
    }
    if (type !== undefined) {
      updateFields.push(`type = $${idx}`);
      updateValues.push(type);
      idx++;
    }
    if (instructions !== undefined) {
      updateFields.push(`instructions = $${idx}`);
      updateValues.push(instructions);
      idx++;
    }
    if (examDate) {
      updateFields.push(`date_time = $${idx}`);
      updateValues.push(new Date(examDate));
      idx++;
    }
    const monConfig = monitoringConfig !== undefined ? monitoringConfig : monitoring_config;
    if (monConfig !== undefined) {
      updateFields.push(`monitoring_config = $${idx}`);
      updateValues.push(typeof monConfig === 'string' ? monConfig : JSON.stringify(monConfig));
      idx++;
    }
    if (isProctored !== undefined || is_proctored !== undefined) {
      updateFields.push(`is_proctored = $${idx}`);
      updateValues.push(isProctored !== undefined ? isProctored : is_proctored);
      idx++;
    }

    if (updateFields.length === 0) {
      return res.json({ success: true, message: 'Nothing to update' });
    }

    const queryText = `
      UPDATE exams 
      SET ${updateFields.join(', ')}, updated_at = NOW() 
      WHERE id = $1 AND college_id = $2 
      RETURNING *, COALESCE(title, name) as title, COALESCE(title, name) as name
    `;
    const { rows } = await pool.query(queryText, updateValues);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Exam not found or unauthorized' });
    }

    res.json({ success: true, message: 'Exam updated.', data: { exam: rows[0] } });
  } catch (error) {
    console.error('Update exam error:', error);
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

    console.log('🚀 Backend: Publishing exam request:', {
      examId: id,
      collegeId: collegeId
    });

    // Check if exam exists and belongs to college using Supabase
    const { data: examData, error: examError } = await supabase
      .from('exams')
      .select('*')
      .eq('id', id)
      .eq('college_id', collegeId)
      .single();

    console.log('📊 Backend: Exam check for publish:', {
      examError: examError,
      examData: examData,
      examFound: !!examData
    });

    if (examError || !examData) {
      console.log('❌ Backend: Exam not found for publishing');
      return res.status(404).json({ success: false, message: 'Exam not found.' });
    }

    // Check if exam has questions using Supabase
    const { data: questions, error: questionsError } = await supabase
      .from('questions') // Use existing questions table
      .select('id')
      .eq('exam_id', id);

    console.log('📊 Backend: Questions check for publish:', {
      questionsError: questionsError,
      questionsFound: questions,
      questionsCount: questions?.length || 0
    });

    if (questionsError) {
      console.error('❌ Backend: Error checking questions:', questionsError);
      // Fallback: check if exam was AI generated and has questions in description
      if (examData.description && examData.description.includes('Questions:')) {
        console.log('📊 Backend: Found AI-generated questions in description, allowing publish');
      } else {
        return res.status(500).json({ success: false, message: 'Failed to check questions', error: questionsError.message });
      }
    }

    if (!questions || questions.length === 0) {
      // Check if this is an AI-generated exam with questions stored in description or just marked AI generated
      if ((examData.description && examData.description.includes('Questions:')) || examData.ai_generated || examData.question_randomization) {
        console.log('📊 Backend: Found AI-generated exam flag or description fallback, allowing publish');
      } else {
        console.log('❌ Backend: Cannot publish exam without questions');
        return res.status(400).json({ success: false, message: 'Cannot publish exam without questions.' });
      }
    }

    // Update exam status to published using Supabase
    const { data: updatedExam, error: updateError } = await supabase
      .from('exams')
      .update({ status: 'published' })
      .eq('id', id)
      .select()
      .single();

    console.log('📊 Backend: Exam update result:', {
      updateError: updateError,
      updatedExam: updatedExam
    });

    if (updateError) {
      console.error('❌ Backend: Error updating exam status:', updateError);
      return res.status(500).json({ success: false, message: 'Failed to publish exam', error: updateError.message });
    }

    // Get the complete exam data including exam_code for email notifications
    const { data: completeExamData, error: completeExamError } = await supabase
      .from('exams')
      .select('*')
      .eq('id', id)
      .single();

    if (completeExamError) {
      console.error('❌ Backend: Error retrieving complete exam data:', completeExamError);
      return res.status(500).json({ success: false, message: 'Failed to retrieve exam data', error: completeExamError.message });
    }

    console.log('✅ Backend: Exam published successfully');

    // Notify assigned students
    try {
      const { data: assignments } = await supabase
        .from('exam_assignments')
        .select('student_id')
        .eq('exam_id', id);
      if (assignments && assignments.length > 0) {
        const studentIds = assignments.map(a => a.student_id);
        const { data: assignedStudents } = await supabase
          .from('students')
          .select('name, email')
          .in('id', studentIds);

        if (assignedStudents && assignedStudents.length > 0) {
          const { sendExamNotification } = require('../services/emailService');
          const loginUrl = process.env.STUDENT_LOGIN_URL || 
            (process.env.NODE_ENV === 'development' ? 'http://localhost:3002/student/login' : 'https://exam.nexifyforge.in/student/login');

          let resolvedCollegeName = req.user?.name || req.user?.college_name;
          if (!resolvedCollegeName && completeExamData?.college_id) {
            const { data: col } = await supabase
              .from('colleges')
              .select('name')
              .eq('id', completeExamData.college_id)
              .maybeSingle();
            if (col?.name) resolvedCollegeName = col.name;
          }

          console.log('📧 Backend: Sending exam notifications to students:', {
            totalStudents: assignedStudents.length,
            collegeName: resolvedCollegeName || 'Your Institution',
            examCode: completeExamData?.exam_code,
            examTitle: completeExamData?.title
          });

          for (const student of assignedStudents) {
            // Note: sendExamNotification is now non-blocking (uses setImmediate internally)
            sendExamNotification({
              name: student.name,
              email: student.email,
              examName: completeExamData?.title || 'Upcoming Exam',
              examDate: completeExamData?.date_time || new Date(),
              examDuration: completeExamData?.duration || 60,
              examKey: completeExamData?.exam_code || 'N/A',
              subject: completeExamData?.subject || 'Exam',
              type: completeExamData?.type || 'exam',
              collegeName: resolvedCollegeName || 'Your Institution',
              loginUrl: loginUrl
            });
          }
          console.log(`📧 SYSTEM: Queued notifications for ${assignedStudents.length} students in background.`);
        } else {
          console.log('⚠️ Backend: No students assigned to this exam');
        }
      }
    } catch (notifyError) {
      console.error('❌ NOTIFICATION ERROR:', notifyError.message);
      // We don't return 500 here because the exam itself IS published.
    }

    res.json({
      success: true,
      message: `Exam published successfully. ${questions.length} questions available. Assigned students have been notified.`,
    });

  } catch (error) {
    console.error('❌ Backend: Publish exam error:', error);
    res.status(500).json({ success: false, message: 'Publish failed', error: error.message });
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
    
    console.log('🚀 Backend: Adding questions request:', {
      examId: id,
      questionsCount: questions?.length || 0
    });
    
    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ success: false, message: 'Questions array is required.' });
    }

    // Get existing questions count before inserting
    const { data: existingQuestions, error: existingQuestionsError } = await supabase
      .from('questions')
      .select('id')
      .eq('exam_id', id);

    if (existingQuestionsError) {
      console.error('❌ Backend: Error fetching existing questions:', existingQuestionsError);
    }

    const existingQuestionCount = existingQuestions?.length || 0;
    console.log('📊 Backend: Existing questions count:', existingQuestionCount);

    // Prepare questions for insertion (with full coding metadata support)
    const questionsToInsert = questions.map((q, i) => {
      let qType = (q.type || q.questionType || q.question_type || 'mcq').toLowerCase();
      if (qType === 'multiple_choice' || qType === 'multiple-choice') qType = 'mcq';
      if (!['mcq', 'subjective', 'coding', 'true_false'].includes(qType)) qType = 'mcq';

      const isCoding = qType === 'coding' || !!q.problemStatement || !!q.testCases || !!q.test_cases;
      const type = isCoding ? 'coding' : qType;
      const marks = q.marks || (type === 'coding' ? 10 : 1);
      const questionText = q.problemStatement || q.questionText || q.question_text || q.text || 'Question';
      const codeTemplate = q.codeTemplate || q.code_template || null;
      const timeLimit = q.timeLimit || q.time_limit || (type === 'coding' ? 2000 : null);
      const memoryLimit = q.memoryLimit || q.memory_limit || (type === 'coding' ? 256 : null);
      const difficulty = q.difficulty || 'medium';

      const rawTestCases = q.testCases || q.test_cases || q.examples || [];
      const testCasesJson = Array.isArray(rawTestCases) && rawTestCases.length > 0
        ? JSON.stringify(rawTestCases)
        : (typeof rawTestCases === 'string' ? rawTestCases : null);

      let optionsPayload;
      if (isCoding) {
        optionsPayload = JSON.stringify({
          title: q.title || '',
          problemStatement: q.problemStatement || questionText,
          inputFormat: q.inputFormat || q.input_format || '',
          outputFormat: q.outputFormat || q.output_format || '',
          constraints: Array.isArray(q.constraints) ? q.constraints : (q.constraints ? [q.constraints] : []),
          examples: Array.isArray(q.examples) ? q.examples : [],
          testCases: Array.isArray(rawTestCases) ? rawTestCases : [],
          hints: Array.isArray(q.hints) ? q.hints : [],
          solutionApproach: q.solutionApproach || '',
          timeComplexity: q.timeComplexity || '',
          spaceComplexity: q.spaceComplexity || '',
          allowedLanguages: q.allowedLanguages || ['javascript', 'python', 'java', 'cpp'],
          executionFormat: q.executionFormat || q.execution_format || 'stdin_stdout'
        });
      } else {
        const options = q.options || [];
        optionsPayload = typeof options === 'string' ? options : JSON.stringify(options);
      }

      return {
        exam_id: id,
        question_text: questionText,
        type: type,
        options: optionsPayload,
        correct_answer: q.correctAnswer || q.correct_answer || '',
        marks: marks,
        order_index: q.orderIndex || q.order_index || (existingQuestionCount + i + 1),
        code_template: codeTemplate,
        time_limit: timeLimit,
        memory_limit: memoryLimit,
        difficulty: difficulty,
        test_cases: testCasesJson
      };
    });

    console.log('📝 Backend: Prepared questions for insertion:', questionsToInsert.length);

    // Insert questions using Supabase
    const { data: insertedQuestions, error: insertError } = await supabase
      .from('questions')
      .insert(questionsToInsert)
      .select();

    console.log('🗄️ Backend: Questions insertion result:', {
      insertError: insertError,
      insertedQuestions: insertedQuestions,
      insertedCount: insertedQuestions?.length || 0
    });

    if (insertError) {
      console.error('❌ Backend: Error inserting questions:', insertError);
      return res.status(500).json({ success: false, message: 'Failed to add questions', error: insertError.message });
    }

    // Update the exam's question_count field
    const newQuestionCount = (insertedQuestions?.length || 0) + (existingQuestions?.length || 0);
    console.log('📊 Backend: Updating exam question count to:', newQuestionCount);
    
    const { data: updateError } = await supabase
      .from('exams')
      .update({ question_count: newQuestionCount })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Backend: Error updating question count:', updateError);
    } else {
      console.log('✅ Backend: Exam question count updated successfully');
    }

    console.log('✅ Backend: Questions added successfully');
    res.json({ success: true, message: `${questions.length} questions added.` });
  } catch (error) {
    console.error('❌ Backend: Add questions error:', error);
    res.status(500).json({ success: false, message: 'Failed to add questions', error: error.message });
  }
};

/**
 * DELETE /api/admin/exams/:id/questions/:questionId
 * Delete a specific question from an exam
 */
exports.deleteQuestion = async (req, res) => {
  try {
    const { id, questionId } = req.params;
    const collegeId = req.user.id;

    console.log('🚀 Backend: Deleting question request:', {
      examId: id,
      questionId: questionId,
      collegeId: collegeId
    });

    // First verify that the exam belongs to the college
    const { data: examData, error: examError } = await supabase
      .from('exams')
      .select('*')
      .eq('id', id)
      .eq('college_id', collegeId)
      .single();

    console.log('📊 Backend: Exam ownership check:', {
      examError: examError,
      examData: examData,
      examFound: !!examData
    });

    if (examError || !examData) {
      console.log('❌ Backend: Exam not found or access denied');
      return res.status(404).json({ success: false, message: 'Exam not found or access denied.' });
    }

    // Check if the question exists and belongs to the exam
    const { data: questionData, error: questionCheckError } = await supabase
      .from('questions')
      .select('*')
      .eq('id', questionId)
      .eq('exam_id', id)
      .single();

    console.log('📊 Backend: Question existence check:', {
      questionCheckError: questionCheckError,
      questionData: questionData,
      questionFound: !!questionData
    });

    if (questionCheckError || !questionData) {
      console.log('❌ Backend: Question not found or does not belong to exam');
      return res.status(404).json({ success: false, message: 'Question not found or does not belong to this exam.' });
    }

    // Delete the question
    const { data: deletedQuestion, error: deleteError } = await supabase
      .from('questions')
      .delete()
      .eq('id', questionId)
      .eq('exam_id', id)
      .select()
      .single();

    console.log('📊 Backend: Question deletion result:', {
      deleteError: deleteError,
      deletedQuestion: deletedQuestion
    });

    if (deleteError || !deletedQuestion) {
      console.log('❌ Backend: Question not found or deletion failed');
      return res.status(404).json({ success: false, message: 'Question not found or deletion failed.' });
    }

    // Update exam's question_count after deletion
    const { data: examDataForCount, error: examDataError } = await supabase
      .from('exams')
      .select('question_count')
      .eq('id', id)
      .single();

    if (examDataError) {
      console.error('❌ Backend: Error fetching exam for question count update:', examDataError);
    }

    const currentQuestionCount = examData?.question_count || 0;
    const newQuestionCount = Math.max(0, currentQuestionCount - 1);
    
    console.log('📊 Backend: Updating exam question count after deletion:', {
      currentCount: currentQuestionCount,
      newCount: newQuestionCount
    });

    const { data: updateError } = await supabase
      .from('exams')
      .update({ question_count: newQuestionCount })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Backend: Error updating question count after deletion:', updateError);
    } else {
      console.log('✅ Backend: Exam question count updated after deletion');
    }

    console.log('✅ Backend: Question deleted successfully');
    res.json({ success: true, message: 'Question deleted successfully.' });

  } catch (error) {
    console.error('❌ Backend: Delete question error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete question', error: error.message });
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

    console.log('🚀 Backend: Fetching monitoring data request:', {
      examId: id,
      collegeId: collegeId
    });

    // Check if exam exists and belongs to college using Supabase
    const { data: examData, error: examError } = await supabase
      .from('exams')
      .select('*')
      .eq('id', id)
      .eq('college_id', collegeId)
      .single();

    console.log('📊 Backend: Exam check for monitoring:', {
      examError: examError,
      examData: examData,
      examFound: !!examData
    });

    if (examError || !examData) {
      console.log('❌ Backend: Exam not found for monitoring');
      return res.status(404).json({ success: false, message: 'Exam not found.' });
    }

    // For now, return basic monitoring data without complex joins
    // In production, you might want to create views or use RPC for complex queries
    const { data: sessions, error: sessionsError } = await supabase
      .from('exam_sessions')
      .select(`
        *,
        students!inner(name, student_id, email)
      `)
      .eq('exam_id', id)
      .order('started_at', { ascending: false });

    console.log('📊 Backend: Sessions fetch result:', {
      sessionsError: sessionsError,
      sessionsFound: sessions,
      sessionsCount: sessions?.length || 0
    });

    if (sessionsError) {
      console.error('❌ Backend: Error fetching sessions:', sessionsError);
      return res.status(500).json({ success: false, message: 'Failed to fetch sessions', error: sessionsError.message });
    }

    // For now, return empty violations data
    // In production, you would implement proper violation tracking
    const violations = [];

    console.log('✅ Backend: Monitoring data fetched successfully');
    res.json({
      success: true,
      data: {
        exam: examData,
        sessions: sessions || [],
        violations: violations,
        stats: {
          totalSessions: sessions?.length || 0,
          activeSessions: sessions?.filter(s => s.status === 'active').length || 0,
          completedSessions: sessions?.filter(s => s.status === 'submitted').length || 0,
          totalViolations: violations.length
        }
      }
    });

  } catch (error) {
    console.error('❌ Backend: Get monitoring data error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch monitoring data', error: error.message });
  }
};

// =====================================================
// STUDENT - EXAM MANAGEMENT
// =====================================================

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

    // Run auto-close on expired exams first
    await autoCloseExpiredExams().catch(() => {});

    // Get all candidate-accessible exams for the student's college
    const { data: exams, error } = await supabase
      .from('exams')
      .select(`
        id, title, type, subject, date_time, duration, total_marks, passing_marks,
        status, is_proctored, instructions, created_at, exam_code, exam_key
      `)
      .eq('college_id', collegeId)
      .in('status', ['published', 'active', 'completed'])
      .order('date_time', { ascending: false });

    if (error) {
      console.error('Student exams error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch exams',
        error: error.message
      });
    }

    // Get all student's sessions to attach accurate session_status
    const { data: studentSessions } = await supabase
      .from('exam_sessions')
      .select('exam_id, status, submitted_at')
      .eq('student_id', studentId);

    const sessionMap = new Map();
    (studentSessions || []).forEach(s => {
      const existing = sessionMap.get(s.exam_id);
      if (!existing || s.status === 'submitted' || s.status === 'terminated') {
        sessionMap.set(s.exam_id, s);
      }
    });

    const now = Date.now();
    const enrichedExams = (exams || []).map(exam => {
      const session = sessionMap.get(exam.id);
      let effectiveStatus = exam.status;

      if (exam.date_time) {
        const start = parseToIST(exam.date_time);
        if (start) {
          const endTime = start.getTime() + (Number(exam.duration) || 60) * 60000;
          if (now > endTime) {
            effectiveStatus = 'completed';
          }
        }
      }

      return {
        ...exam,
        status: effectiveStatus,
        session_status: session?.status || null,
        submitted_at: session?.submitted_at || null,
      };
    });

    res.json({ success: true, data: { exams: enrichedExams } });
  } catch (error) {
    console.error('Student exams error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch exams', error: error.message });
  }
};

/**
 * GET /api/student/exams/:id
 * Get specific exam details for student
 */
exports.getExamDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const studentId = req.user.id;
    const collegeId = req.user.college_id;

    console.log('📊 Backend: Getting exam details:', { examId: id, studentId, collegeId });

    // Get exam details
    const { data: exam, error: examError } = await supabase
      .from('exams')
      .select(`
        id, title, type, subject, date_time, duration, total_marks,
        passing_marks, status, is_proctored, instructions,
        max_violations, created_at, updated_at, exam_code, exam_key, monitoring_config, college_id
      `)
      .eq('id', id)
      .maybeSingle();

    if (examError) {
      console.error('Exam details error:', examError);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch exam details',
        error: examError.message
      });
    }

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found or unauthorized'
      });
    }

    // Verify college or explicit assignment authorization
    if (collegeId && exam.college_id && exam.college_id !== collegeId) {
      const { data: assignments } = await supabase
        .from('exam_assignments')
        .select('student_id')
        .eq('exam_id', id)
        .eq('student_id', studentId)
        .limit(1);

      if (!assignments || assignments.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'You are not authorized for this examination.'
        });
      }
    }

    // Get exam questions for this exam (never leak correct_answer to student)
    const { data: rawQuestions, error: questionsError } = await supabase
      .from('questions')
      .select(`
        id, question_text, type, options,
        marks, order_index, code_template, time_limit, memory_limit, difficulty, test_cases
      `)
      .eq('exam_id', id)
      .order('order_index', { ascending: true });

    const questions = (rawQuestions || []).map(formatQuestionForStudent);

    if (questionsError) {
      console.error('Exam questions error:', questionsError);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch exam questions',
        error: questionsError.message
      });
    }

    // Check if student has access to this exam
    const { data: assignments, error: assignmentError } = await supabase
      .from('exam_assignments')
      .select('student_id')
      .eq('exam_id', id)
      .eq('student_id', studentId);

    let hasAccess = false;
    if (!assignmentError && assignments && assignments.length > 0) {
      hasAccess = true;
    }

    // Check if student already has a session (active or submitted)
    const { data: existingSession } = await supabase
      .from('exam_sessions')
      .select('id, status, submitted_at, started_at, violation_count, is_auto_submitted, auto_submit_reason')
      .eq('exam_id', id)
      .eq('student_id', studentId)
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    let studentResult = null;
    if (existingSession) {
      const { data: resRow } = await supabase
        .from('results')
        .select('*')
        .eq('exam_id', id)
        .eq('student_id', studentId)
        .maybeSingle();
      studentResult = resRow;
    }

    // Check timing strictly
    const windowStatus = getExamWindowStatus(exam.date_time, exam.duration || 60, 15);
    let effectiveStatus = exam.status;
    const isEnded = exam.status === 'completed' || !!windowStatus?.isEnded;
    if (isEnded) {
      effectiveStatus = 'completed';
      if (exam.status !== 'completed') {
        checkAndCloseSpecificExam(id).catch(() => {});
      }
    }

    console.log('📊 Backend: Exam access check:', { hasAccess, examId: id, studentId, existingStatus: existingSession?.status, isEnded });

    res.json({
      success: true,
      data: {
        exam: { ...exam, status: effectiveStatus },
        isEnded: isEnded,
        questions: questions || [],
        hasAccess: hasAccess,
        existingSession: existingSession ? {
          ...existingSession,
          total_score: studentResult?.marks_obtained !== undefined && studentResult?.marks_obtained !== null ? Number(studentResult.marks_obtained) : null,
          percentage: studentResult?.percentage !== undefined && studentResult?.percentage !== null ? Number(studentResult.percentage) : null,
          result_status: studentResult?.status ?? null,
          questionsTotal: questions?.length || 0,
          questionsAttempted: questions?.length || 0
        } : null,
      }
    });

  } catch (error) {
    console.error('Get exam details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch exam details',
      error: error.message
    });
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

    console.log('🚀 Backend: Starting exam request:', {
      examId: id,
      examKey: examKey,
      studentId: studentId
    });

    // Validate exam using Supabase
    const { data: examData, error: examError } = await supabase
      .from('exams')
      .select('*')
      .eq('id', id)
      .single();

    console.log('📊 Backend: Exam data check:', {
      examError: examError,
      examData: examData,
      examFound: !!examData,
      examCode: examData?.exam_code,
      providedKey: examKey
    });

    if (examError || !examData) {
      console.log('❌ Backend: Exam not found');
      return res.status(404).json({ success: false, message: 'Exam not found.' });
    }

    // Validate exam key (check both exam_code and exam_key)
    const validKeys = [examData.exam_code, examData.exam_key]
      .filter(Boolean)
      .map(k => String(k).trim().toUpperCase());
      
    if (!validKeys.includes(String(examKey || '').trim().toUpperCase())) {
      console.log('❌ Backend: Invalid exam key:', {
        expected: validKeys,
        received: examKey,
        exam_code: examData.exam_code,
        exam_key: examData.exam_key,
        returning: '400 ERROR INVALID KEY'
      });
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid exam key.',
        validKeys: process.env.NODE_ENV === 'development' ? validKeys : undefined
      });
    }

    console.log('✅ Backend: Exam key validated successfully');

    // Check if exam is active (within time window) strictly evaluated in IST
    const windowStatus = getExamWindowStatus(examData.date_time, examData.duration || 60, 15);

    console.log('⏰ Backend: Exam timing check (IST):', {
      nowIST: formatIST(windowStatus.now, 'full'),
      examStartIST: windowStatus.formattedStart,
      examEndIST: windowStatus.formattedEnd,
      isBeforeStart: windowStatus.isBeforeStart,
      isBeforeEarlyAccess: windowStatus.isBeforeEarlyAccess,
      isLive: windowStatus.isLive,
      isEnded: windowStatus.isEnded,
    });

    // 1. Strict End Time Check: Students must NOT be allowed to enter or start after scheduled time has expired
    if (examData.status === 'completed' || windowStatus.isEnded) {
      console.log('❌ Backend: Attempt to start an exam that has ended. Blocking entry.');
      await checkAndCloseSpecificExam(id).catch(() => {});
      return res.status(400).json({
        success: false,
        isEnded: true,
        message: 'This examination has ended. Students are not allowed to enter or start an exam after its scheduled time has expired.'
      });
    }

    // 2. Early Access Check: Cannot start before early access window
    if (examData.date_time && windowStatus.isBeforeEarlyAccess) {
      console.log('❌ Backend: Exam not accessible yet. Returning 400 ERROR.');
      return res.status(400).json({
        success: false,
        message: `Exam scheduled for ${windowStatus.formattedStart}. Accessible from ${formatIST(windowStatus.earlyAccessTime, 'timeOnly')} IST.`
      });
    }

    // Check for existing session for THIS student using Supabase
    const { data: existingSession, error: sessionError } = await supabase
      .from('exam_sessions')
      .select('*')
      .eq('exam_id', id)
      .eq('student_id', studentId)
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingSession) {
      if (existingSession.status === 'submitted' || existingSession.status === 'terminated') {
        console.log('ℹ️ Backend: Session already submitted or terminated.');
        return res.status(200).json({
          success: false,
          alreadySubmitted: true,
          status: existingSession.status,
          message: 'You have already completed and submitted this examination. Your responses are recorded.',
          data: {
            session: existingSession,
            submittedAt: existingSession.submitted_at || existingSession.updated_at,
          }
        });
      }
      // Resume existing session
      const { data: rawQuestions, error: questionsError } = await supabase
        .from('questions')
        .select('id, question_text, type, options, marks, order_index, code_template, time_limit, memory_limit, difficulty, test_cases')
        .eq('exam_id', id)
        .order('order_index');
      const { data: answers, error: answersError } = await supabase
        .from('answers')
        .select('question_id, answer_text, selected_option, code_submission, selected_language, updated_at')
        .eq('session_id', existingSession.id);

      const questions = (rawQuestions || []).map(formatQuestionForStudent);

      const nowMs = Date.now();
      const sessionDurationMs = (examData.duration || 60) * 60 * 1000;
      const sessionStartMs = new Date(existingSession.started_at || existingSession.start_time || existingSession.created_at || nowMs).getTime();
      const sessionRemainingSec = Math.max(0, Math.floor((sessionDurationMs - (nowMs - sessionStartMs)) / 1000));
      const windowRemainingSec = windowStatus?.endTime ? Math.max(0, Math.floor((windowStatus.endTime - nowMs) / 1000)) : sessionRemainingSec;
      const timeRemaining = Math.min(sessionRemainingSec, windowRemainingSec);

      if (timeRemaining <= 0) {
        console.log('❌ Backend: Resuming session but window has ended. Auto-submitting session.');
        await supabase
          .from('exam_sessions')
          .update({
            status: 'submitted',
            is_auto_submitted: true,
            auto_submit_reason: 'scheduled_time_expired',
            submitted_at: new Date().toISOString()
          })
          .eq('id', existingSession.id);

        return res.status(400).json({
          success: false,
          isEnded: true,
          message: 'The scheduled examination duration has expired and your session has concluded.'
        });
      }

      return res.json({
        success: true,
        message: 'Resuming exam session.',
        data: {
          session: existingSession,
          exam: { ...examData, exam_code: undefined },
          questions: questions || [],
          savedAnswers: answers || [],
          timeRemaining,
        },
      });
    }

    // Create new session using Supabase
    let sessionResult = null;
    const { data: createdSession, error: sessionCreateError } = await supabase
      .from('exam_sessions')
      .insert({
        exam_id: id,
        student_id: studentId,
        ip_address: req.ip,
        browser_info: req.get('User-Agent'),
        status: 'active'
      })
      .select()
      .maybeSingle();

    if (sessionCreateError) {
      // Concurrency / duplicate key safety: fetch existing session if already inserted by parallel request
      console.warn('Session create notice (attempting retry lookup):', sessionCreateError.message);
      const { data: retrySession } = await supabase
        .from('exam_sessions')
        .select('*')
        .eq('exam_id', id)
        .eq('student_id', studentId)
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (retrySession) {
        sessionResult = retrySession;
      } else {
        console.error('Session creation error:', sessionCreateError);
        return res.status(500).json({ success: false, message: 'Failed to create exam session', error: sessionCreateError.message });
      }
    } else {
      sessionResult = createdSession;
    }

    // Update exam status to active
    await supabase
      .from('exams')
      .update({ status: 'active' })
      .eq('id', id)
      .in('status', ['published', 'draft']);

    // Get questions for the exam
    let questions = [];
    let questionsError = null;

    // 1. Check if randomization is enabled and fetch student-specific set
    if (examData.question_randomization) {
      console.log('🎲 Backend: Randomization enabled, fetching student question set for:', studentId);
      const { data: randomizedSet, error: setErr } = await supabase
        .from('student_question_sets')
        .select('*')
        .eq('exam_id', id)
        .eq('student_id', studentId)
        .order('question_order');
      
      if (!setErr && randomizedSet && randomizedSet.length > 0) {
        console.log(`✅ Backend: Found ${randomizedSet.length} randomized questions`);
        questions = randomizedSet.map(item => {
          const qData = item.question_data || {};
          return formatQuestionForStudent({
            ...qData,
            id: qData.id || item.id,
            order_index: item.question_order,
          });
        });
      } else {
        console.log('⚠️ Backend: No randomized set found for student, falling back to master list');
      }
    }

    // 2. Fetch from master questions table if still no questions
    if (!questions || questions.length === 0) {
      console.log('🗄️ Backend: Fetching questions from master table...');
      const { data: masterQuestions, error: mErr } = await supabase
        .from('questions')
        .select('id, question_text, type, options, marks, order_index, code_template, time_limit, memory_limit, difficulty, test_cases')
        .eq('exam_id', id)
        .order('order_index');
      
      questions = (masterQuestions || []).map(formatQuestionForStudent);
      questionsError = mErr;
    }

    console.log('🗄️ Database Question Fetch Result:', {
      examId: id,
      questionsFound: !!questions,
      questionsLength: questions?.length || 0,
    });

    // 3. Fallback: Check description for AI-generated JSON if still empty
    if (!questions || questions.length === 0) {
      console.log('⚠️ Backend: No questions found anywhere, checking description fallback...');
      
      if (examData.description && examData.description.includes('Questions:')) {
        try {
          const jsonPart = examData.description.split('Questions:')[1].trim();
          const startIdx = jsonPart.indexOf('[');
          const endIdx = jsonPart.lastIndexOf(']') + 1;
          
          if (startIdx !== -1 && endIdx !== -1) {
            const rawJson = jsonPart.substring(startIdx, endIdx);
            const parsedQuestions = JSON.parse(rawJson);
            
            if (Array.isArray(parsedQuestions) && parsedQuestions.length > 0) {
              console.log(`✅ Found ${parsedQuestions.length} questions in description fallback`);
              questions = parsedQuestions.map(formatQuestionForStudent);
            }
          }
        } catch (e) {
          console.error('❌ Failed to parse questions from description:', e.message);
        }
      }
    }

    // Still no questions? Error out.
    if (!questions || questions.length === 0) {
      console.log('❌ Backend: Still no questions found after all attempts - cannot start exam. Returning 400 ERROR NO QUESTIONS.');
      return res.status(400).json({ 
        success: false, 
        message: 'This exam has no questions. Please contact the administrator.' 
      });
    }

    console.log('✅ Found real questions:', questions.length);
    
    // Transform questions to match frontend expectations
    const finalQuestions = questions.map(q => {
      // If it's a coding question, preserve the full formatted object from formatQuestionForStudent
      if (q.type === 'coding') {
        return q;
      }

      console.log('🔍 Transforming question:', {
        originalId: q.id,
        originalType: q.type,
        originalText: q.question_text?.substring(0, 50) + '...',
        hasOptions: !!q.options,
        optionsCount: q.options?.length || 0,
        marks: q.marks,
        optionsType: typeof q.options
      });
      
      // Parse options if it's a string, otherwise use as-is
      let parsedOptions = [];
      if (typeof q.options === 'string') {
        try {
          parsedOptions = JSON.parse(q.options);
        } catch (e) {
          console.log('⚠️ Failed to parse options JSON:', q.options);
          parsedOptions = [];
        }
      } else if (Array.isArray(q.options)) {
        parsedOptions = q.options;
      }
      
      const transformedQuestion = {
        id: q.id,
        type: q.type || 'mcq',
        question_text: q.question_text || 'No question text',
        marks: q.marks || 1,
        difficulty: q.difficulty || 'medium',
        options: parsedOptions,
        correctAnswer: q.correct_answer || null,
        order_index: q.order_index
      };
      
      return transformedQuestion;
    });

    console.log('📋 Final questions structure:', {
      count: finalQuestions.length,
      firstQuestion: finalQuestions[0] ? {
        id: finalQuestions[0].id,
        type: finalQuestions[0].type,
        hasText: !!finalQuestions[0].question_text,
        textLength: finalQuestions[0].question_text?.length || 0,
        hasOptions: !!finalQuestions[0].options,
        optionsCount: finalQuestions[0].options?.length || 0
      } : null
    });

    const nowMs = Date.now();
    const sessionDurationMs = (examData.duration || 60) * 60 * 1000;
    const sessionRemainingSec = Math.floor(sessionDurationMs / 1000);
    const windowRemainingSec = windowStatus?.endTime ? Math.max(0, Math.floor((windowStatus.endTime - nowMs) / 1000)) : sessionRemainingSec;
    const timeRemaining = Math.min(sessionRemainingSec, windowRemainingSec);

    if (timeRemaining <= 0) {
      console.log('❌ Backend: Calculated time remaining is 0 or negative. Blocking start.');
      return res.status(400).json({
        success: false,
        isEnded: true,
        message: 'This examination has ended. Scheduled duration has expired.'
      });
    }

    res.json({
      success: true,
      message: 'Exam started. Good luck!',
      data: {
        session: sessionResult,
        exam: { ...examData, exam_code: undefined },
        questions: finalQuestions,
        savedAnswers: [],
        timeRemaining,
      },
    });
  } catch (error) {
    console.error('Start exam error:', error);
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

    if (!sessionId || !questionId) {
      return res.status(400).json({ success: false, message: 'sessionId and questionId are required' });
    }

    const { detectLanguageFromCode } = require('../services/codeExecutionService');
    const resolvedLanguage = selectedLanguage || req.body.language || req.body.selected_language || (codeSubmission ? detectLanguageFromCode(codeSubmission) : null);

    // Use Supabase upsert with explicit onConflict constraint
    const { error: saveError } = await supabase
      .from('answers')
      .upsert({
        session_id: sessionId,
        question_id: questionId,
        student_id: studentId,
        exam_id: id,
        answer_text: answerText ?? null,
        selected_option: selectedOption ?? null,
        code_submission: codeSubmission ?? null,
        selected_language: resolvedLanguage,
        updated_at: new Date().toISOString()
      }, { 
        onConflict: 'session_id,question_id' 
      });

    if (saveError) {
      console.error('❌ Backend: Error saving answer:', saveError);
      return res.status(500).json({ success: false, message: 'Failed to save answer efficiently', error: saveError.message });
    }

    res.json({ success: true, message: 'Answer saved.' });
  } catch (error) {
    console.error('❌ Backend: Save answer exception:', error);
    res.status(500).json({ success: false, message: 'Failed to save answer', error: error.message });
  }
};

/**
 * POST /api/student/exams/:id/save-answers-bulk
 * High-performance bulk answer autosave for concurrent students
 */
exports.saveAnswersBulk = async (req, res) => {
  try {
    const { id } = req.params;
    const { sessionId, answers } = req.body;
    const studentId = req.user.id;

    if (!sessionId) {
      return res.status(400).json({ success: false, message: 'sessionId is required' });
    }

    if (!Array.isArray(answers) || answers.length === 0) {
      return res.json({ success: true, count: 0, message: 'No answers to save.' });
    }

    const { detectLanguageFromCode } = require('../services/codeExecutionService');
    const now = new Date().toISOString();
    const rows = answers
      .filter(a => a && a.questionId)
      .map(a => {
        const resolvedLang = a.selectedLanguage || a.language || a.selected_language || (a.codeSubmission ? detectLanguageFromCode(a.codeSubmission) : null);
        return {
          session_id: sessionId,
          question_id: a.questionId,
          student_id: studentId,
          exam_id: id,
          answer_text: a.answerText ?? null,
          selected_option: a.selectedOption ?? null,
          code_submission: a.codeSubmission ?? null,
          selected_language: resolvedLang,
          updated_at: now
        };
      });

    if (rows.length === 0) {
      return res.json({ success: true, count: 0, message: 'No valid answers to save.' });
    }

    const { error: bulkError } = await supabase
      .from('answers')
      .upsert(rows, { onConflict: 'session_id,question_id' });

    if (bulkError) {
      console.error('❌ Backend: Error in bulk answer save:', bulkError);
      return res.status(500).json({ success: false, message: 'Failed to bulk save answers', error: bulkError.message });
    }

    res.json({ success: true, count: rows.length, message: `${rows.length} answers saved.` });
  } catch (error) {
    console.error('Bulk save answers error:', error);
    res.status(500).json({ success: false, message: 'Failed to bulk save answers', error: error.message });
  }
};

/**
 * POST /api/student/exams/:id/submit
 * Submit exam (auto-evaluate MCQ)
 */
exports.submitExam = async (req, res) => {
  try {
    const { id } = req.params;
    const { sessionId, autoSubmit, violationCount, tabSwitchCount, terminationReason, answers: submittedAnswers } = req.body;
    const studentId = req.user.id;

    console.log('🚀 [SUBMIT-EXAM] Processing submission:', { examId: id, sessionId, studentId, finalAnswersInPayload: Array.isArray(submittedAnswers) ? submittedAnswers.length : 0 });

    // 1. Fetch Session (by sessionId or fallback to latest session for this student & exam)
    let sessionData = null;
    if (sessionId) {
      const { data } = await supabase
        .from('exam_sessions')
        .select('*')
        .eq('id', sessionId)
        .eq('student_id', studentId)
        .maybeSingle();
      sessionData = data;
    }

    if (!sessionData) {
      const { data } = await supabase
        .from('exam_sessions')
        .select('*')
        .eq('exam_id', id)
        .eq('student_id', studentId)
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      sessionData = data;
    }

    if (!sessionData) {
      console.log('❌ [SUBMIT-EXAM] No session found for student:', studentId, 'exam:', id);
      return res.status(404).json({ success: false, message: 'No examination session found for this student.' });
    }

    const activeSessionId = sessionData.id;

    // If session is ALREADY submitted, fetch existing result and return success immediately
    if (sessionData.status === 'submitted') {
      const { data: existingResult } = await supabase
        .from('results')
        .select('*')
        .eq('exam_id', id)
        .eq('student_id', studentId)
        .maybeSingle();

      const { data: totalQs } = await supabase
        .from('questions')
        .select('id')
        .eq('exam_id', id);

      const { data: sessionAnswers } = await supabase
        .from('answers')
        .select('id, selected_option, answer_text, code_submission')
        .eq('session_id', activeSessionId);

      const attemptedCount = (sessionAnswers || []).filter(a => 
        (a.selected_option !== null && a.selected_option !== undefined && String(a.selected_option).trim() !== '') ||
        (a.answer_text !== null && a.answer_text !== undefined && String(a.answer_text).trim() !== '') ||
        (a.code_submission !== null && a.code_submission !== undefined && String(a.code_submission).trim() !== '')
      ).length;

      console.log('ℹ️ [SUBMIT-EXAM] Session already sealed as submitted. Returning existing result.');
      return res.json({
        success: true,
        message: 'Exam has already been submitted successfully.',
        data: {
          score: existingResult?.marks_obtained ?? existingResult?.total_marks ?? 0,
          totalMarks: existingResult?.total_marks ?? 0,
          percentage: existingResult?.percentage ?? 0,
          status: existingResult?.status || 'completed',
          questionsTotal: totalQs?.length || 0,
          questionsAttempted: attemptedCount,
          result: {
            id: existingResult?.id || activeSessionId,
            score: existingResult?.marks_obtained ?? existingResult?.total_marks ?? 0,
            totalMarks: existingResult?.total_marks ?? 0,
            marksObtained: existingResult?.marks_obtained ?? 0,
            percentage: existingResult?.percentage ?? 0,
            status: existingResult?.status || 'completed',
            submittedAt: sessionData.submitted_at || new Date().toISOString(),
            questionsTotal: totalQs?.length || 0,
            questionsAttempted: attemptedCount,
            isPending: existingResult?.status === 'pending'
          }
        }
      });
    }

    // 2. ATOMIC ANSWER UPSERT — If the frontend sent final answers in the payload,
    //    upsert them NOW before evaluation. This is the critical safety net that
    //    ensures no answer is lost due to prior network failures or silent errors.
    if (Array.isArray(submittedAnswers) && submittedAnswers.length > 0) {
      console.log(`💾 [SUBMIT-EXAM] Atomically upserting ${submittedAnswers.length} final answers from payload...`);
      const { detectLanguageFromCode } = require('../services/codeExecutionService');
      const now = new Date().toISOString();
      const answerRows = submittedAnswers
        .filter(a => a && a.questionId)
        .map(a => {
          const resolvedLang = a.selectedLanguage || a.language || a.selected_language || (a.codeSubmission ? detectLanguageFromCode(a.codeSubmission) : null);
          return {
            session_id: activeSessionId,
            question_id: a.questionId,
            student_id: studentId,
            exam_id: id,
            answer_text: a.answerText ?? null,
            selected_option: a.selectedOption ?? null,
            code_submission: a.codeSubmission ?? null,
            selected_language: resolvedLang,
            updated_at: now,
          };
        });

      if (answerRows.length > 0) {
        try {
          const { error: upsertAnswersError } = await supabase
            .from('answers')
            .upsert(answerRows, { onConflict: 'session_id,question_id' });

          if (upsertAnswersError) {
            console.error('❌ [SUBMIT-EXAM] Final answer upsert error:', upsertAnswersError.message);
            // Do NOT abort — proceed with whatever is in DB
          } else {
            console.log(`✅ [SUBMIT-EXAM] Atomically saved ${answerRows.length} final answers.`);
          }
        } catch (upsertErr) {
          console.error('❌ [SUBMIT-EXAM] Final answer upsert exception:', upsertErr.message);
          // Do NOT abort — proceed with whatever is in DB
        }
      }
    }

    // 3. Fetch ALL questions for this exam
    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select('*')
      .eq('exam_id', id);

    if (questionsError || !questions) {
      console.error('❌ [SUBMIT-EXAM] Error fetching questions for marking:', questionsError);
      return res.status(500).json({ success: false, message: 'CRITICAL ERROR: Failed to retrieve questions for evaluation', error: questionsError?.message });
    }

    // 4. Fetch ALL answers for this session from DB (now includes atomically upserted ones)
    const { data: answers, error: answersError } = await supabase
      .from('answers')
      .select('*')
      .eq('session_id', activeSessionId);

    if (answersError) {
      console.error('❌ [SUBMIT-EXAM] Error fetching answers for marking:', answersError);
      return res.status(500).json({ success: false, message: 'CRITICAL ERROR: Failed to fetch student answers', error: answersError?.message });
    }

    console.log(`📊 [SUBMIT-EXAM] Marking Engine starting: ${questions.length} questions, ${answers?.length || 0} answers in DB`);

    // 5. Marking Engine for MCQ, Coding, and Descriptive
    let mcqMarks = 0;
    let codingMarks = 0;
    let subjectiveMarks = 0;
    let questionsAttempted = 0;
    const evaluatedUpdates = [];
    const questionMap = new Map((questions || []).map(q => [String(q.id), q]));

    for (const answer of answers || []) {
      const question = questionMap.get(String(answer.question_id));
      if (!question) {
        console.warn(`⚠️ [SUBMIT-EXAM] Answer for unknown question ID: ${answer.question_id}`);
        continue;
      }

      // Count as attempted if any response was recorded
      const hasResponse = (
        (answer.selected_option !== null && answer.selected_option !== undefined && String(answer.selected_option).trim() !== '') ||
        (answer.answer_text !== null && answer.answer_text !== undefined && String(answer.answer_text).trim() !== '') ||
        (answer.code_submission !== null && answer.code_submission !== undefined && String(answer.code_submission).trim() !== '')
      );
      if (hasResponse) questionsAttempted++;

      if (question.type === 'mcq' || question.type === 'true_false') {
        const candidateAnswer = (answer.selected_option !== null && answer.selected_option !== undefined && String(answer.selected_option).trim() !== '')
          ? answer.selected_option
          : answer.answer_text;
        const isCorrect = evaluateMCQAnswer(candidateAnswer, question.correct_answer, question.options);
        const qMarks = Number(question.marks) || 1;
        const qNegative = Math.abs(Number(question.negative_marks) || 0);
        const marksObtained = isCorrect ? qMarks : -qNegative;
        const finalMarks = Math.max(0, marksObtained);
        mcqMarks += finalMarks;

        evaluatedUpdates.push({
          id: answer.id,
          is_correct: isCorrect,
          marks_obtained: finalMarks,
          selected_language: null
        });
      } else if (question.type === 'coding') {
        const maxQMarks = Number(question.marks) || 10;
        let earnedQMarks = 0;

        if (answer.code_submission && answer.code_submission.trim().length > 0) {
          // Extract question test cases
          let testCases = [];
          if (question.test_cases) {
            testCases = typeof question.test_cases === 'string' ? JSON.parse(question.test_cases) : question.test_cases;
          }
          if ((!testCases || testCases.length === 0) && question.options) {
            try {
              const opts = typeof question.options === 'string' ? JSON.parse(question.options) : question.options;
              testCases = opts?.testCases || opts?.test_cases || opts?.examples || [];
            } catch (_) {}
          }

          if (Array.isArray(testCases) && testCases.length > 0) {
            const { evaluateTestCases, detectLanguageFromCode } = require('../services/codeExecutionService');
            const languageToRun = answer.selected_language || detectLanguageFromCode(answer.code_submission) || 'javascript';
            try {
              const evalRes = await evaluateTestCases(
                answer.code_submission,
                languageToRun,
                testCases,
                {
                  timeLimitMs: question.time_limit || 2000,
                  memoryLimitMb: question.memory_limit || 256,
                  questionMarks: maxQMarks
                }
              );
              earnedQMarks = evalRes.earnedMarks || 0;
            } catch (evalErr) {
              console.error('Server-side code evaluation error in submitExam:', evalErr);
              earnedQMarks = answer.marks_obtained !== null && answer.marks_obtained !== undefined
                ? Number(answer.marks_obtained)
                : 0;
            }
          } else if (answer.marks_obtained !== null && answer.marks_obtained !== undefined) {
            earnedQMarks = Number(answer.marks_obtained);
          }
        }

        codingMarks += earnedQMarks;

        const { detectLanguageFromCode } = require('../services/codeExecutionService');
        const finalLang = answer.selected_language || (answer.code_submission ? detectLanguageFromCode(answer.code_submission) : null);
        evaluatedUpdates.push({
          id: answer.id,
          is_correct: earnedQMarks >= maxQMarks,
          marks_obtained: earnedQMarks,
          selected_language: finalLang
        });
      } else if (question.type === 'subjective') {
        if (answer.marks_obtained !== null && answer.marks_obtained !== undefined) {
          subjectiveMarks += Number(answer.marks_obtained);
        }
      }
    }

    // 6. Parameterized BATCH UPDATE for all evaluated answers in ONE statement!
    if (evaluatedUpdates.length > 0) {
      try {
        await pool.query(
          `UPDATE answers AS a
           SET is_correct = u.is_correct,
               marks_obtained = u.marks_obtained,
               is_evaluated = true,
               selected_language = COALESCE(u.selected_language, a.selected_language),
               updated_at = NOW()
           FROM jsonb_to_recordset($1::jsonb) AS u(
             id uuid,
             is_correct boolean,
             marks_obtained numeric,
             selected_language text
           )
           WHERE a.id = u.id AND a.session_id = $2`,
          [JSON.stringify(evaluatedUpdates), activeSessionId]
        );
      } catch (batchErr) {
        console.warn('⚠️ [SUBMIT-EXAM] Batch answers evaluation update failed, falling back to individual updates:', batchErr.message);
        for (const u of evaluatedUpdates) {
          await supabase.from('answers').update({
            is_correct: u.is_correct,
            marks_obtained: u.marks_obtained,
            is_evaluated: true,
            selected_language: u.selected_language,
            updated_at: new Date().toISOString()
          }).eq('id', u.id).catch(() => {});
        }
      }
    }

    // 6. Fetch Exam Meta for Final Result Status
    const { data: examData } = await supabase
      .from('exams')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    const sumOfQuestionMarks = (questions || []).reduce((sum, q) => sum + (Number(q.marks) || 0), 0);
    const totalPossibleMarks = sumOfQuestionMarks > 0 ? sumOfQuestionMarks : (Number(examData?.total_marks) || 100);
    const configuredPassing = Number(examData?.passing_marks);
    const passThresholdMarks = (configuredPassing && configuredPassing <= totalPossibleMarks)
      ? configuredPassing
      : Math.max(1, Math.round(totalPossibleMarks * 0.4));

    const totalEarnedMarks = Math.round((mcqMarks + codingMarks + subjectiveMarks) * 100) / 100;
    const percentage = totalPossibleMarks > 0 ? (totalEarnedMarks / totalPossibleMarks) * 100 : 0;
    const roundedPct = Math.round(percentage * 100) / 100;
    const computedGrade = calculateGrade(roundedPct);

    const hasSubjective = (questions || []).some(q => q.type === 'subjective');
    const isPassed = (totalEarnedMarks >= passThresholdMarks) || (roundedPct >= 40);
    const finalStatus = isPassed ? 'pass' : 'fail';
    const resultStatus = hasSubjective ? 'pending' : finalStatus;

    console.log('📊 [SUBMIT-EXAM] Marking complete:', { totalEarnedMarks, mcqMarks, codingMarks, subjectiveMarks, totalPossibleMarks, passThresholdMarks, resultStatus, percentage: roundedPct, grade: computedGrade, questionsAttempted, questionsTotal: questions.length, answersInDB: answers?.length || 0 });

    // 7. Update Session Status to 'submitted'
    const submissionTime = new Date().toISOString();
    await supabase
      .from('exam_sessions')
      .update({
        status: 'submitted',
        submitted_at: submissionTime,
        is_auto_submitted: !!autoSubmit,
        auto_submit_reason: terminationReason || sessionData.auto_submit_reason || null
      })
      .eq('id', activeSessionId);

    // 8. Upsert Result Record (prevents constraint conflict on student_id, exam_id)
    console.log('📊 [SUBMIT-EXAM] Saving result record for session', activeSessionId);
    let resultRecord = null;
    try {
      const { data: upsertedResult, error: resultError } = await supabase
        .from('results')
        .upsert({
          session_id: activeSessionId,
          student_id: studentId,
          exam_id: id,
          mcq_marks: mcqMarks,
          coding_marks: codingMarks,
          subjective_marks: subjectiveMarks,
          total_marks: totalPossibleMarks,
          marks_obtained: totalEarnedMarks,
          percentage: roundedPct,
          grade: computedGrade,
          status: resultStatus,
          submitted_at: submissionTime,
          updated_at: submissionTime
        }, {
          onConflict: 'student_id,exam_id'
        })
        .select()
        .maybeSingle();

      if (resultError) {
        console.warn('⚠️ [SUBMIT-EXAM] Results upsert warning:', resultError.message);
      } else {
        resultRecord = upsertedResult;
      }
    } catch (upsertErr) {
      console.warn('⚠️ [SUBMIT-EXAM] Results upsert exception:', upsertErr.message);
    }

    console.log('✅ [SUBMIT-EXAM] Submission sequence complete.');
    res.json({
      success: true,
      message: 'Congratulations! Your exam has been submitted successfully.',
      data: {
        score: totalEarnedMarks,
        totalMarks: totalPossibleMarks,
        percentage: roundedPct,
        status: resultStatus,
        questionsTotal: questions.length,
        questionsAttempted,
        answersRecorded: answers?.length || 0,
        result: {
          id: resultRecord?.id || activeSessionId,
          score: totalEarnedMarks,
          marksObtained: totalEarnedMarks,
          totalMarks: totalPossibleMarks,
          percentage: roundedPct,
          status: resultStatus,
          submittedAt: submissionTime,
          questionsTotal: questions.length,
          questionsAttempted,
          isPending: resultStatus === 'pending'
        }
      }
    });

  } catch (error) {
    console.error('❌ [SUBMIT-EXAM] CRITICAL Submission Fault:', error);
    res.status(500).json({ success: false, message: 'A server error occurred during submission. Your answers are safe.', error: error.message });
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

    // Get exam proctoring configuration
    const { data: examData, error: examError } = await supabase
      .from('exams')
      .select('max_violations, is_proctored, monitoring_config')
      .eq('id', examId)
      .single();

    if (examData?.is_proctored === false) {
      return res.json({
        success: true,
        data: { action: 'ignored', message: 'Proctoring disabled for this exam.' },
        ignored: true
      });
    }

    let monConfig = examData?.monitoring_config;
    if (typeof monConfig === 'string') {
      try { monConfig = JSON.parse(monConfig); } catch (e) { monConfig = null; }
    }
    const defaultMonitoringConfig = {
      face_detection: true,
      voice_detection: true,
      tab_switch: true,
      fullscreen: true,
      device_camera: true
    };
    monConfig = monConfig ? { ...defaultMonitoringConfig, ...monConfig } : defaultMonitoringConfig;

    // If the college admin unchecked/disabled this monitoring feature for this exam, ignore it!
    if (
      (type === 'speech_detected' && monConfig.voice_detection === false) ||
      ((type === 'multiple_faces' || type === 'no_face_detected') && monConfig.face_detection === false) ||
      ((type === 'tab_switch' || type === 'window_blur') && monConfig.tab_switch === false) ||
      (type === 'fullscreen_exit' && monConfig.fullscreen === false) ||
      (type === 'camera_off' && monConfig.device_camera === false)
    ) {
      return res.json({
        success: true,
        data: { action: 'ignored', message: `Monitoring feature for ${type} is disabled by admin for this exam.` },
        ignored: true
      });
    }

    // Insert violation using Supabase
    const { data: violation, error: violationError } = await supabase
      .from('violations')
      .insert({
        session_id: sessionId,
        student_id: studentId,
        exam_id: examId,
        type,
        description,
        severity: type === 'multiple_faces' ? 'critical' : 'warning'
      })
      .select()
      .single();

    if (violationError) {
      console.error('Violation insertion error:', violationError);
    }

    const maxViolations = examData?.max_violations || 3; // 3 warnings then terminate

    // Count violations for this session
    const { data: sessionData, error: sessionError } = await supabase
      .from('violations')
      .select('id, type')
      .eq('session_id', sessionId);

    const violationCounts = sessionData?.reduce((acc, v) => {
      acc[v.type] = (acc[v.type] || 0) + 1;
      acc.total = (acc.total || 0) + 1;
      return acc;
    }, {}) || {};

    const newCount = violationCounts.total || 1;
    const typeCount = violationCounts[type] || 1;

    let action = 'warning';
    let message = `⚠️ Warning ${newCount}/${maxViolations}: ${type} detected.`;
    let autoTerminate = false;

    // Violation thresholds — strict on visual/tab cheating, lenient on ambient audio
    if (type === 'multiple_faces' && typeCount >= 3) {
      action = 'terminate';
      message = '🚨 EXAM TERMINATED: Multiple persons detected 3 times. Your exam has been automatically submitted.';
      autoTerminate = true;
    } else if (type === 'tab_switch' && typeCount >= 3) {
      action = 'terminate';
      message = '🚨 EXAM TERMINATED: You switched tabs 3 times. Your exam has been automatically submitted.';
      autoTerminate = true;
    } else if (type === 'no_face_detected' && typeCount >= 5) {
      action = 'terminate';
      message = '🚨 EXAM TERMINATED: No face detected repeatedly. Your exam has been automatically submitted.';
      autoTerminate = true;
    } else if (type === 'fullscreen_exit' && typeCount >= 3) {
      action = 'terminate';
      message = '🚨 EXAM TERMINATED: You exited full-screen 3 times. Your exam has been automatically submitted.';
      autoTerminate = true;
    } else if (type === 'speech_detected') {
      if (typeCount >= 12) {
        action = 'terminate';
        message = '🚨 EXAM TERMINATED: Sustained voice activity detected repeatedly.';
        autoTerminate = true;
      } else {
        action = 'warning';
        message = `⚠️ Notice (${typeCount}/12): Audio/voice activity detected. Please maintain silence.`;
      }
    } else if (newCount >= Math.max(maxViolations, 6) && type !== 'speech_detected') {
      action = 'terminate';
      message = '🚨 EXAM TERMINATED: Maximum violations reached. Your exam has been automatically submitted.';
      autoTerminate = true;
    } else {
      // Warning messages based on violation type with counts
      if (type === 'multiple_faces') {
        message = `⚠️ Warning ${typeCount}/3: Multiple faces detected! Only you should be visible during the exam.`;
      } else if (type === 'no_face_detected') {
        message = `⚠️ Warning ${typeCount}/3: No face detected! Please stay in front of the camera.`;
      } else if (type === 'camera_off') {
        message = `⚠️ Warning ${typeCount}/3: Camera is off! Please turn on your camera immediately.`;
      } else if (type === 'tab_switch') {
        message = `⚠️ Warning ${typeCount}/3: Tab switch detected! Stay focused on the exam.`;
      } else if (type === 'fullscreen_exit') {
        message = `⚠️ Warning ${typeCount}/3: Full-screen exited! Please stay in full-screen mode.`;
      } else if (type === 'window_blur') {
        message = `⚠️ Warning ${typeCount}/3: Window focus lost! Keep the exam window active.`;
      } else {
        message = `⚠️ Warning ${newCount}/${maxViolations}: ${description || type}`;
      }
    }

    // Auto-terminate if needed
    if (autoTerminate) {
      await supabase
        .from('exam_sessions')
        .update({
          status: 'terminated',
          submitted_at: new Date().toISOString(),
          is_auto_submitted: true,
          auto_submit_reason: `violations_exceeded_${type}`
        })
        .eq('id', sessionId);
    }

    res.json({
      success: true,
      data: { action, message, violationCount: newCount, maxViolations, autoTerminate },
    });
  } catch (error) {
    console.error('Report violation error:', error);
    res.status(500).json({ success: false, message: 'Failed to report violation', error: error.message });
  }
};

/**
 * GET /api/admin/exams/:id/questions
 */
exports.getExamQuestions = async (req, res) => {
  try {
    const { id } = req.params;
    const collegeId = req.user.id;

    // Verify ownership of the exam
    const { rows: examRows } = await pool.query(
      `SELECT id, COALESCE(title, name, 'Untitled Exam') as title, type, duration, total_marks, passing_marks, status FROM exams WHERE id = $1 AND college_id = $2`,
      [id, collegeId]
    );

    if (examRows.length === 0) {
      return res.status(403).json({ success: false, message: 'Unauthorized or exam not found.' });
    }

    const { rows: questions } = await pool.query(
      `SELECT * FROM questions WHERE exam_id = $1 ORDER BY order_index ASC, created_at ASC`,
      [id]
    );

    res.json({ 
      success: true, 
      data: {
        questions: questions || [],
        exam: examRows[0] || null
      },
      questions: questions || [],
      exam: examRows[0] || null
    });
  } catch (error) {
    console.error('getExamQuestions error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

exports.deleteQuestion = async (req, res) => {
  try {
    const { id, questionId } = req.params;
    const collegeId = req.user.id;

    // Verify ownership of the exam
    const { rows: examRows } = await pool.query(
      `SELECT id FROM exams WHERE id = $1 AND college_id = $2`,
      [id, collegeId]
    );

    if (examRows.length === 0) {
      return res.status(403).json({ success: false, message: 'Unauthorized or exam not found.' });
    }

    await pool.query(`DELETE FROM questions WHERE id = $1 AND exam_id = $2`, [questionId, id]);
    res.json({ success: true, message: 'Question deleted successfully' });
  } catch (error) {
    console.error('deleteQuestion error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

