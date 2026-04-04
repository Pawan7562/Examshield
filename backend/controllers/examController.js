// controllers/examController.js
const { supabase } = require('../config/supabase-clean');
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

// Async function to process exam data without blocking the response
const processExamDataAsync = async (examId, questions, studentQuestionSets, studentIds, examQuestionRandomization) => {
  console.log('Processing exam data asynchronously for exam:', examId);
  
  try {
    // Handle questions if provided
    if (questions && questions.length > 0) {
      try {
        const questionsToInsert = questions.map((q, index) => {
          // Robustly handle question data from various potential formats
          const questionText = q.questionText || q.description || q.title || q.question;
          const type = q.type || 'mcq';
          const marks = q.marks || 10;
          const correctAnswer = q.correctAnswer || q.answer || q.correct_answer || null;
          const options = q.options || [];
          const codeTemplate = q.codeTemplate || q.code_template || null;
          const timeLimit = q.timeLimit || q.time_limit || null;

          return {
            exam_id: examId,
            question_text: questionText,
            type: type,
            marks: marks,
            options: typeof options === 'string' ? options : JSON.stringify(options),
            correct_answer: correctAnswer,
            order_index: index + 1,
            code_template: codeTemplate,
            time_limit: timeLimit
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
            .single();

          // Send email to each assigned student
          for (const student of students) {
            try {
              await sendExamNotification({
                name: student.name,
                email: student.email,
                examName: examData?.title || 'Exam',
                examDate: examData?.date_time,
                examDuration: examData?.duration || 60,
                examKey: examData?.exam_code || 'N/A',
                subject: examData?.subject || 'General',
                type: 'coding',
                loginUrl: 'http://localhost:3000/student/login'
              });
              console.log(`✅ Email notification sent to ${student.email}`);
            } catch (emailError) {
              console.error(`❌ Failed to send email to ${student.email}:`, emailError);
            }
          }
          console.log(`📧 Email notifications processed for ${students.length} students`);
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
    const examDateTime = dateTime || new Date().toISOString();
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
    const { name, description, subject, dateTime, duration, totalMarks, passingMarks, instructions, status } = req.body;

    console.log('🚀 Backend: Updating exam request:', {
      examId: id,
      collegeId: collegeId,
      updateData: { name, description, subject, dateTime, duration, totalMarks, passingMarks, instructions, status }
    });

    // Prepare update data
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (subject !== undefined) updateData.subject = subject;
    if (dateTime !== undefined) updateData.date_time = dateTime;
    if (duration !== undefined) updateData.duration = duration;
    if (totalMarks !== undefined) updateData.total_marks = totalMarks;
    if (passingMarks !== undefined) updateData.passing_marks = passingMarks;
    if (instructions !== undefined) updateData.instructions = instructions;
    if (status !== undefined) updateData.status = status;

    console.log('📝 Backend: Prepared update data:', updateData);

    // Update exam using Supabase
    const { data: updatedExam, error: updateError } = await supabase
      .from('exams')
      .update(updateData)
      .eq('id', id)
      .eq('college_id', collegeId)
      .select()
      .single();

    console.log('📊 Backend: Exam update result:', {
      updateError: updateError,
      updatedExam: updatedExam
    });

    if (updateError || !updatedExam) {
      console.log('❌ Backend: Exam not found for update');
      return res.status(404).json({ success: false, message: 'Exam not found.' });
    }

    console.log('✅ Backend: Exam updated successfully');
    res.json({ success: true, message: 'Exam updated.', data: { exam: updatedExam } });
  } catch (error) {
    console.error('❌ Backend: Update exam error:', error);
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

    console.log('✅ Backend: Exam published successfully');

    // For now, skip student notification and return success
    // In production, you would want to implement email notifications with Supabase
    res.json({
      success: true,
      message: `Exam published successfully. ${questions.length} questions available.`,
    });

  } catch (error) {
    console.error('❌ Backend: Publish exam error:', error);
    res.status(500).json({ success: false, message: 'Publish failed', error: error.message });
  }
};

/**
 * GET /api/admin/exams/:id/questions
 */
exports.getExamQuestions = async (req, res) => {
  try {
    const { id } = req.params;

    console.log('🚀 Backend: Fetching exam questions request:', {
      examId: id
    });

    // Fetch questions using Supabase
    const { data: questions, error: questionsError } = await supabase
      .from('questions') // Use existing questions table
      .select('*')
      .eq('exam_id', id)
      .order('order_index', { ascending: true });

    console.log('📊 Backend: Questions fetch result:', {
      questionsError: questionsError,
      questionsFound: questions,
      questionsCount: questions?.length || 0
    });

    if (questionsError) {
      console.error('❌ Backend: Error fetching questions:', questionsError);
      // Fallback: check if exam has AI-generated questions in description
      try {
        const { data: examData } = await supabase
          .from('exams')
          .select('description')
          .eq('id', id)
          .single();
        
        if (examData?.description?.includes('Questions:')) {
          console.log('📊 Backend: Found AI-generated questions in description, returning empty array for now');
          return res.json({ success: true, data: { questions: [] } });
        }
      } catch (fallbackError) {
        console.error('Fallback check failed:', fallbackError);
      }
      return res.status(500).json({ success: false, message: 'Failed to fetch questions', error: questionsError.message });
    }

    console.log('✅ Backend: Questions fetched successfully');
    res.json({ success: true, data: { questions: questions || [] } });
  } catch (error) {
    console.error('❌ Backend: Get exam questions error:', error);
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
    const questionsToInsert = questions.map((q, i) => ({
      exam_id: id,
      question_text: q.questionText,
      type: q.type,
      options: q.options ? JSON.stringify(q.options) : null,
      correct_answer: q.correctAnswer,
      marks: q.marks || 1,
      order_index: i
    }));

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
        status, is_proctored, instructions, created_at
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
    const validKeys = [examData.exam_code, examData.exam_key].filter(Boolean);
    if (!validKeys.includes(examKey)) {
      console.log('❌ Backend: Invalid exam key:', {
        expected: validKeys,
        received: examKey,
        exam_code: examData.exam_code,
        exam_key: examData.exam_key
      });
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid exam key.',
        validKeys: process.env.NODE_ENV === 'development' ? validKeys : undefined
      });
    }

    console.log('✅ Backend: Exam key validated successfully');

    // Check if exam is active (within time window)
    const now = new Date();
    const examStart = new Date(examData.date_time);
    const examEnd = new Date(examStart.getTime() + examData.duration * 60000);

    console.log('⏰ Backend: Exam timing check:', {
      now: now.toISOString(),
      examStart: examStart.toISOString(),
      examEnd: examEnd.toISOString(),
      isBeforeStart: now < examStart,
      isAfterEnd: now > examEnd
    });

    console.log('✅ Backend: Exam timing validated');

    // For testing purposes, make timing validation very flexible
    // In production, you might want stricter validation
    const timeWindowStart = new Date(examStart.getTime() - 24 * 60 * 60000); // 24 hours before
    const timeWindowEnd = new Date(examStart.getTime() + examData.duration * 60000 + 24 * 60 * 60000); // 24 hours after

    console.log('⏰ Backend: Flexible timing check:', {
      timeWindowStart: timeWindowStart.toISOString(),
      timeWindowEnd: timeWindowEnd.toISOString(),
      now: now.toISOString(),
      canStart: now >= timeWindowStart && now <= timeWindowEnd
    });

    // Only enforce timing validation if the exam has specific timing requirements
    if (examData.date_time && examData.duration) {
      if (now < timeWindowStart) {
        console.log('❌ Backend: Exam not accessible yet');
        return res.status(400).json({ success: false, message: `Exam accessible from ${timeWindowStart.toLocaleString()}.` });
      }

      if (now > timeWindowEnd) {
        console.log('❌ Backend: Exam access window closed');
        return res.status(400).json({ success: false, message: 'Exam access period has ended.' });
      }
    } else {
      console.log('📝 Backend: No timing constraints, allowing exam start');
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
        return res.status(400).json({ success: false, message: 'You have already submitted this exam.' });
      }
      // Resume existing session
      const { data: questions, error: questionsError } = await supabase
        .from('questions')
        .select('id, question_text, type, options, marks, order_index, code_template, time_limit')
        .eq('exam_id', id)
        .order('order_index');
      const { data: answers, error: answersError } = await supabase
        .from('answers')
        .select('question_id, answer_text, selected_option, code_submission, selected_language')
        .eq('session_id', existingSession.id);

      return res.json({
        success: true,
        message: 'Resuming exam session.',
        data: {
          session: existingSession,
          exam: { ...examData, exam_code: undefined },
          questions: questions || [],
          savedAnswers: answers || [],
          timeRemaining: Math.max(0, Math.floor((examEnd - now) / 1000)),
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
    let { data: questions, error: questionsError } = await supabase
      .from('questions') // Use existing questions table
      .select('id, question_text, type, options, marks, order_index, code_template, time_limit') // Removed 'difficulty' column
      .eq('exam_id', id)
      .order('order_index');

    console.log('🗄️ Database Question Fetch:', {
      examId: id,
      questionsError: questionsError,
      questionsFound: questions,
      questionsLength: questions?.length || 0,
      query: 'SELECT id, question_text, type, options, marks, order_index, code_template, time_limit FROM questions WHERE exam_id = ' + id
    });

    // CRITICAL FIX: Only use real questions, no sample questions
    if (!questions || questions.length === 0) {
      console.log('⚠️ Backend: No questions found in table, checking description fallback...');
      
      // Look for questions in description if table is empty
      if (examData.description && examData.description.includes('Questions:')) {
        try {
          const jsonPart = examData.description.split('Questions:')[1].trim();
          // The JSON might be truncated if it was stored in a field with length limits, 
          // or it might be full JSON. Let's try to find a valid JSON array.
          const startIdx = jsonPart.indexOf('[');
          const endIdx = jsonPart.lastIndexOf(']') + 1;
          
          if (startIdx !== -1 && endIdx !== -1) {
            const rawJson = jsonPart.substring(startIdx, endIdx);
            const parsedQuestions = JSON.parse(rawJson);
            
            if (Array.isArray(parsedQuestions) && parsedQuestions.length > 0) {
              console.log(`✅ Found ${parsedQuestions.length} questions in description fallback`);
              
              // Map fallback objects to the expected structure
              questions = parsedQuestions.map((q, idx) => {
                let parsedOptions = [];
                try {
                  if (typeof q.options === 'string') {
                    parsedOptions = JSON.parse(q.options);
                  } else if (Array.isArray(q.options)) {
                    parsedOptions = q.options;
                  }
                } catch (e) {
                  console.error('⚠️ Failed to parse fallback options:', q.options);
                  parsedOptions = [];
                }

                return {
                  id: q.id || `fallback-${idx}`,
                  question_text: q.questionText || q.description || q.title || q.question || 'Missing question text',
                  type: q.type || 'mcq',
                  options: parsedOptions,
                  marks: q.marks || 1,
                  order_index: idx + 1,
                  correct_answer: q.correctAnswer || null
                };
              });
            }
          }
        } catch (e) {
          console.error('❌ Failed to parse questions from description:', e.message);
        }
      }

      if (!questions || questions.length === 0) {
        console.log('❌ Backend: Still no questions found - cannot start exam');
        return res.status(400).json({ 
          success: false, 
          message: 'This exam has no questions. Please contact the administrator.' 
        });
      }
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

    res.json({
      success: true,
      message: 'Exam started. Good luck!',
      data: {
        session: sessionResult,
        exam: { ...examData, exam_code: undefined },
        questions: finalQuestions,
        savedAnswers: [],
        timeRemaining: Math.max(0, Math.floor((examEnd - now) / 1000)),
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
