// controllers/examController.js
const { pool } = require('../config/database');
const { supabase } = require('../config/supabase-clean');
const { sendExamNotification, sendExamReminder } = require('../services/emailService');
const { v4: uuidv4 } = require('uuid');
const { parseToIST, toISTISOString, formatIST, getExamWindowStatus } = require('../utils/timezone');

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

  const isCoding = q.type === 'coding' ||
    !!q.problemStatement ||
    !!meta.problemStatement ||
    (Array.isArray(parsedTestCases) && parsedTestCases.length > 0) ||
    (Array.isArray(parsedExamples) && parsedExamples.length > 0);

  const cleanTitle = q.title || meta.title ||
    (q.question_text ? q.question_text.split('\n')[0].replace(/^#+\s*/, '').replace(/^[Q0-9:.-]+\s*/, '') : 'Coding Challenge');

  const problemStatement = q.problemStatement || meta.problemStatement || q.question_text || 'Problem Statement';

  return {
    id: q.id,
    title: cleanTitle,
    question_text: q.question_text || problemStatement,
    problemStatement: problemStatement,
    inputFormat: q.inputFormat || meta.inputFormat || '',
    outputFormat: q.outputFormat || meta.outputFormat || '',
    constraints: Array.isArray(q.constraints) ? q.constraints : (meta.constraints || []),
    examples: parsedExamples,
    testCases: parsedTestCases,
    hints: Array.isArray(q.hints) ? q.hints : (meta.hints || []),
    solutionApproach: q.solutionApproach || meta.solutionApproach || '',
    timeComplexity: q.timeComplexity || meta.timeComplexity || '',
    spaceComplexity: q.spaceComplexity || meta.spaceComplexity || '',
    allowedLanguages: q.allowedLanguages || meta.allowedLanguages || ['javascript', 'python', 'java', 'cpp'],
    type: isCoding ? 'coding' : (q.type || 'mcq'),
    options: parsedOptions,
    marks: q.marks || (isCoding ? 10 : 1),
    order_index: q.order_index,
    code_template: q.code_template || q.codeTemplate || meta.codeTemplate || null,
    time_limit: q.time_limit || q.timeLimit || meta.timeLimit || 2000,
    difficulty: q.difficulty || meta.difficulty || 'medium'
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
              allowedLanguages: q.allowedLanguages || ['javascript', 'python', 'java', 'cpp']
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
            difficulty: difficulty,
            test_cases: testCasesJson
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
        const studentAssignments = studentIds.map(studentId => ({
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
          console.log('Successfully assigned', studentIds.length, 'students to exam');
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
            .select('title, subject, date_time, duration, exam_code')
            .eq('id', examId)
            .maybeSingle();

          const loginUrl = process.env.STUDENT_LOGIN_URL || 
            (process.env.NODE_ENV === 'development' ? 'http://localhost:3002/student/login' : 'https://www.exam.nexifyforge.in/student/login');

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
      studentQuestionSets, questionRandomization, aiGenerated
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
      aiGenerated
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

    console.log('Processed exam data:', {
      examTitle, examType, examDateTime, examDuration, examTotalMarks,
      examSubject, examIsProctored, examQuestionRandomization, examAiGenerated
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
      passing_marks: passingMarks || Math.floor(examTotalMarks * 0.4),
      instructions: examInstructions,
      is_proctored: examIsProctored,
      max_violations: examMaxViolations,
      college_id: collegeId,
      status: 'draft'
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
      instructions, status, type 
    } = req.body;

    const examTitle = title || name;
    const examDuration = duration !== undefined ? parseInt(duration) : undefined;
    const examTotal = totalMarks !== undefined ? parseInt(totalMarks) : (total_marks !== undefined ? parseInt(total_marks) : undefined);
    const examPass = passingMarks !== undefined ? parseInt(passingMarks) : (passing_marks !== undefined ? parseInt(passing_marks) : undefined);
    const examDate = dateTime || date_time;

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
            (process.env.NODE_ENV === 'development' ? 'http://localhost:3002/student/login' : 'https://www.exam.nexifyforge.in/student/login');

          console.log('📧 Backend: Sending exam notifications to students:', {
            totalStudents: assignedStudents.length,
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

    // Prepare questions for Supabase insertion (only using existing columns)
    const questionsToInsert = questions.map((q, i) => {
      let qType = (q.type || q.questionType || q.question_type || 'mcq').toLowerCase();
      if (qType === 'multiple_choice' || qType === 'multiple-choice') qType = 'mcq';
      if (!['mcq', 'subjective', 'coding', 'true_false'].includes(qType)) qType = 'mcq';

      return {
        exam_id: id,
        question_text: q.questionText || q.question_text || q.text,
        type: qType,
        options: q.options ? (typeof q.options === 'string' ? q.options : JSON.stringify(q.options)) : null,
        correct_answer: q.correctAnswer || q.correct_answer || '',
        marks: q.marks || 1,
        order_index: q.orderIndex || q.order_index || i
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

    // Get all exams for the student's college (simplified for now)
    const { data: exams, error } = await supabase
      .from('exams')
      .select(`
        id, title, type, subject, date_time, duration, total_marks,
        status, is_proctored, instructions, created_at, exam_code, exam_key
      `)
      .eq('college_id', collegeId)
      .in('status', ['draft', 'published', 'active', 'completed'])
      .order('date_time', { ascending: false });

    if (error) {
      console.error('Student exams error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch exams',
        error: error.message
      });
    }

    res.json({ success: true, data: { exams: exams || [] } });
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
        max_violations, created_at, updated_at, exam_code, exam_key
      `)
      .eq('id', id)
      .eq('college_id', collegeId)
      .single();

    if (examError) {
      console.error('Exam details error:', examError);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch exam details',
        error: examError.message
      });
    }

    // Get exam questions for this exam
    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select(`
        id, question_text, type, options, correct_answer,
        marks, order_index
      `)
      .eq('exam_id', id)
      .order('created_at', { ascending: true });

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

    // Check if student has already completed this exam
    const { data: existingSession } = await supabase
      .from('exam_sessions')
      .select('id, status, submitted_at, started_at')
      .eq('exam_id', id)
      .eq('student_id', studentId)
      .maybeSingle();

    const isSubmitted = existingSession?.status === 'submitted' || existingSession?.status === 'terminated';
    let examResult = null;
    if (isSubmitted) {
      const { data: resultData } = await supabase
        .from('results')
        .select('*')
        .eq('exam_id', id)
        .eq('student_id', studentId)
        .maybeSingle();
      examResult = resultData || null;
    }

    res.json({
      success: true,
      data: {
        exam: exam,
        questions: questions || [],
        hasAccess: hasAccess,
        isSubmitted: isSubmitted,
        session: existingSession || null,
        result: examResult
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

    console.log('✅ Backend: Exam timing validated');

    // Timing validation:
    // Allow starting if:
    // 1. In development mode OR
    // 2. Exam is in draft/active/published status OR
    // 3. Current time is within acceptable start window
    const isDev = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
    const canBypassStrictWindow = isDev || examData.status === 'draft' || examData.status === 'active';

    if (examData.date_time && !canBypassStrictWindow) {
      if (windowStatus.isBeforeEarlyAccess) {
        console.log('❌ Backend: Exam not accessible yet. Returning 400 ERROR.');
        return res.status(400).json({
          success: false,
          message: `Exam scheduled for ${windowStatus.formattedStart}. Accessible from ${formatIST(windowStatus.earlyAccessTime, 'timeOnly')} IST.`
        });
      }

      // Allow access throughout the exam day / 24 hours window unless exam is explicitly marked completed
      const generousWindowEnd = windowStatus.startTime + Math.max((examData.duration || 60) * 60000 * 4, 24 * 3600000);
      if (windowStatus.now > generousWindowEnd && examData.status !== 'published') {
        console.log('❌ Backend: Exam access window closed. Returning 400 ERROR.');
        return res.status(400).json({ success: false, message: 'Exam access period has ended.' });
      }
    } else {
      console.log('📝 Backend: Flexible / active timing mode, allowing exam start');
    }

    // Check for existing session using Supabase
    const { data: existingSession, error: sessionError } = await supabase
      .from('exam_sessions')
      .select('*')
      .eq('exam_id', id)
      .eq('student_id', studentId)
      .single();

    if (existingSession) {
      if (existingSession.status === 'submitted' || existingSession.status === 'terminated') {
        console.log('ℹ️ Backend: Session already submitted or terminated. Returning completed state.');
        const { data: resultData } = await supabase
          .from('results')
          .select('*')
          .eq('exam_id', id)
          .eq('student_id', studentId)
          .maybeSingle();

        return res.status(200).json({ 
          success: true,
          isSubmitted: true,
          message: 'You have already completed and submitted this examination.',
          data: {
            isSubmitted: true,
            session: existingSession,
            result: resultData || null,
            exam: { ...examData, exam_code: undefined }
          }
        });
      }
      // Resume existing session
      const { data: rawQuestions, error: questionsError } = await supabase
        .from('questions')
        .select('id, question_text, type, options, marks, order_index, code_template, time_limit, difficulty, test_cases')
        .eq('exam_id', id)
        .order('order_index');
      const { data: answers, error: answersError } = await supabase
        .from('answers')
        .select('question_id, answer_text, selected_option, code_submission, selected_language')
        .eq('session_id', existingSession.id);

      const questions = (rawQuestions || []).map(formatQuestionForStudent);

      const nowMs = Date.now();
      const sessionDurationMs = (examData.duration || 60) * 60 * 1000;
      const sessionStartMs = new Date(existingSession.start_time || existingSession.created_at || nowMs).getTime();
      const sessionRemainingSec = Math.max(0, Math.floor((sessionDurationMs - (nowMs - sessionStartMs)) / 1000));
      const windowRemainingSec = windowStatus?.endTime ? Math.max(0, Math.floor((windowStatus.endTime - nowMs) / 1000)) : sessionRemainingSec;
      const timeRemaining = Math.min(sessionRemainingSec, windowRemainingSec);

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
    const { data: sessionResult, error: sessionCreateError } = await supabase
      .from('exam_sessions')
      .insert({
        exam_id: id,
        student_id: studentId,
        ip_address: req.ip,
        browser_info: req.get('User-Agent'),
        status: 'active'
      })
      .select()
      .single();

    if (sessionCreateError) {
      console.error('Session creation error:', sessionCreateError);
      return res.status(500).json({ success: false, message: 'Failed to create exam session' });
    }

    // Update exam status to active
    await supabase
      .from('exams')
      .update({ status: 'active' })
      .eq('id', id)
      .eq('status', 'published');

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
        .select('id, question_text, type, options, marks, order_index, code_template, time_limit, difficulty, test_cases')
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
        difficulty: 'medium', // Default since table doesn't have difficulty column
        options: parsedOptions,
        correctAnswer: q.correct_answer || null,
        order_index: q.order_index
      };
      
      console.log('📋 Transformed question:', {
        id: transformedQuestion.id,
        type: transformedQuestion.type,
        hasText: !!transformedQuestion.question_text,
        textLength: transformedQuestion.question_text?.length || 0,
        hasOptions: !!transformedQuestion.options,
        optionsCount: transformedQuestion.options?.length || 0,
        firstOption: transformedQuestion.options?.[0]?.text || 'No options'
      });
      
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

    // Use Supabase upsert with explicit onConflict constraint
    const { data: saveData, error: saveError } = await supabase
      .from('answers')
      .upsert({
        session_id: sessionId,
        question_id: questionId,
        student_id: studentId,
        exam_id: id,
        answer_text: answerText,
        selected_option: selectedOption,
        code_submission: codeSubmission,
        selected_language: selectedLanguage,
        updated_at: new Date().toISOString()
      }, { 
        onConflict: 'session_id,question_id' 
      })
      .select();

    if (saveError) {
      console.error('❌ Backend: Error saving answer:', saveError);
      return res.status(500).json({ success: false, message: 'Failed to save answer efficiently', error: saveError.message });
    }

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

    console.log('🚀 [PROFESSIONAL] Submit exam request:', { examId: id, sessionId, studentId });

    // 1. Fetch Session (Verifying it's active and belongs to the student)
    const { data: sessionData, error: sessionError } = await supabase
      .from('exam_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('student_id', studentId)
      .eq('exam_id', id)
      .eq('status', 'active')
      .single();

    if (sessionError || !sessionData) {
      console.log('❌ [PROFESSIONAL] Invalid session or session already submitted:', { sessionError, sessionFound: !!sessionData });
      return res.status(400).json({ success: false, message: 'Invalid or already submitted session. Please contact administrator.' });
    }

    console.log('📊 [PROFESSIONAL] Session validated for submission');

    // 2. Fetch ALL questions for this exam (Reliable fetch, no join)
    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select('*')
      .eq('exam_id', id);

    if (questionsError || !questions) {
      console.error('❌ [PROFESSIONAL] Error fetching questions for marking:', questionsError);
      return res.status(500).json({ success: false, message: 'CRITICAL ERROR: Failed to retrieve questions for evaluation', error: questionsError.message });
    }

    // 3. Fetch ALL answers for this session
    const { data: answers, error: answersError } = await supabase
      .from('answers')
      .select('*')
      .eq('session_id', sessionId);

    if (answersError) {
      console.error('❌ [PROFESSIONAL] Error fetching answers for marking:', answersError);
      return res.status(500).json({ success: false, message: 'CRITICAL ERROR: Failed to fetch student answers', error: answersError.message });
    }

    console.log(`📊 [PROFESSIONAL] Marking Engine starting: ${questions.length} questions, ${answers?.length || 0} answers found`);

    // 4. MANUAL MARKING ENGINE (memory-based for 100% reliability)
    let mcqMarks = 0;
    const questionMap = new Map(questions.map(q => [q.id, q]));

    for (const answer of answers || []) {
      const question = questionMap.get(answer.question_id);
      if (!question) {
        console.warn(`⚠️ [PROFESSIONAL] Answer for unknown question ID: ${answer.question_id}`);
        continue;
      }

      if (question.type === 'mcq' || question.type === 'true_false') {
        const isCorrect = (answer.selected_option === question.correct_answer);
        const marksObtained = isCorrect ? (question.marks || 1) : -Math.abs(question.negative_marks || 0);
        mcqMarks += marksObtained;

        // Perform evaluation update defensively
        try {
          await supabase
            .from('answers')
            .update({
              is_correct: isCorrect,
              marks_obtained: Math.max(0, marksObtained),
              is_evaluated: true
            })
            .eq('id', answer.id);
        } catch (updateErr) {
          console.warn(`⚠️ [PROFESSIONAL] Could not save evaluation for answer ${answer.id}:`, updateErr.message);
        }
      }
    }

    // 5. Fetch Exam Meta for Final Result Status
    const { data: examData, error: examMetaError } = await supabase
      .from('exams')
      .select('*')
      .eq('id', id)
      .single();

    const totalPossibleMarks = examData?.total_marks || questions.reduce((sum, q) => sum + (q.marks || 1), 0);
    const passingMarks = examData?.passing_marks || 40;

    const hasIncompleteEvaluation = questions.some(q => q.type === 'subjective' || q.type === 'coding');
    const finalStatus = (mcqMarks >= passingMarks) ? 'pass' : 'fail';
    const resultStatus = hasIncompleteEvaluation ? 'pending' : finalStatus;

    const percentage = totalPossibleMarks > 0 ? (mcqMarks / totalPossibleMarks) * 100 : 0;

    console.log('📊 [PROFESSIONAL] Marking complete:', { mcqMarks, totalPossibleMarks, resultStatus, percentage });

    // 6. Update Session Status FIRST (to prevent double submission)
    const { error: sessionUpdateError } = await supabase
      .from('exam_sessions')
      .update({
        status: 'submitted',
        submitted_at: new Date().toISOString()
      })
      .eq('id', sessionId);

    if (sessionUpdateError) {
      console.error('❌ [PROFESSIONAL] CRITICAL: Failed to seal session:', sessionUpdateError);
      return res.status(500).json({ success: false, message: 'Failed to close exam session properly. Your progress is saved but session status is unclear.', error: sessionUpdateError.message });
    }

    // 7. Create Result Record
    console.log('📊 [PROFESSIONAL] Creating result record for session', sessionId);
    const { data: resultData, error: resultError } = await supabase
      .from('results')
      .insert({
        session_id: sessionId,
        student_id: studentId,
        exam_id: id,
        mcq_marks: mcqMarks,
        total_marks: mcqMarks, // Evaluate from memory for now
        percentage: Math.round(percentage * 100) / 100,
        status: resultStatus,
        submitted_at: new Date().toISOString()
      })
      .select()
      .single();

    if (resultError) {
      console.error('⚠️ [PROFESSIONAL] Result recorded failure:', resultError);
      // We still return true because the session IS submitted and answers are evaluated
      return res.json({
        success: true,
        message: 'Exam submitted successfully, but your result profile is being generated. Please check back in a few minutes.',
        data: {
          result: {
            status: resultStatus,
            percentage: Math.round(percentage * 100) / 100,
            totalMarks: mcqMarks,
            isPending: resultStatus === 'pending'
          }
        }
      });
    }

    console.log('✅ [PROFESSIONAL] Submission sequence complete.');
    res.json({
      success: true,
      message: 'Congratulations! Your exam has been submitted successfully.',
      data: {
        result: {
          id: resultData.id,
          status: resultStatus,
          percentage: resultData.percentage,
          totalMarks: resultData.total_marks,
          submittedAt: resultData.submitted_at,
          isPending: resultStatus === 'pending'
        }
      }
    });

  } catch (error) {
    console.error('❌ [PROFESSIONAL] CRITICAL Submission Fault:', error);
    res.status(500).json({ success: false, message: 'A professional-level fault occurred during submission. Your answers are safe.', error: error.message });
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

    // Get max violations limit from exam
    const { data: examData, error: examError } = await supabase
      .from('exams')
      .select('max_violations')
      .eq('id', examId)
      .single();

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

    // Professional violation thresholds — 3 strikes and you're out
    if (type === 'multiple_faces' && typeCount >= 3) {
      action = 'terminate';
      message = '🚨 EXAM TERMINATED: Multiple persons detected 3 times. Your exam has been automatically submitted.';
      autoTerminate = true;
    } else if (type === 'tab_switch' && typeCount >= 3) {
      action = 'terminate';
      message = '🚨 EXAM TERMINATED: You switched tabs 3 times. Your exam has been automatically submitted.';
      autoTerminate = true;
    } else if (type === 'no_face_detected' && typeCount >= 3) {
      action = 'terminate';
      message = '🚨 EXAM TERMINATED: No face detected 3 times. Your exam has been automatically submitted.';
      autoTerminate = true;
    } else if (type === 'fullscreen_exit' && typeCount >= 3) {
      action = 'terminate';
      message = '🚨 EXAM TERMINATED: You exited full-screen 3 times. Your exam has been automatically submitted.';
      autoTerminate = true;
    } else if (newCount >= maxViolations) {
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

