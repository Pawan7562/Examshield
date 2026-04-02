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

    if (!examType || !examDateTime || !examDuration || !examTotalMarks) {
      return res.status(400).json({ success: false, message: 'Required fields missing.' });
    }

    const examCode = await generateExamCode();

    // Create exam using Supabase
    const { data: exam, error } = await supabase
      .from('exams')
      .insert({
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

    // Send email notifications to all students in the college
    try {
      const { sendExamNotification } = require('../services/emailService');
      
      // Get all students for this college
      const { data: students, error: studentsError } = await supabase
        .from('students')
        .select('name, email')
        .eq('college_id', collegeId);

      if (!studentsError && students && students.length > 0) {
        // Send email to each student
        for (const student of students) {
          await sendExamNotification({
            name: student.name,
            email: student.email,
            examName: examTitle,
            examDate: exam.date_time,
            examDuration: examDuration,
            examKey: examCode,
            subject: subject || 'General',
            type: examType,
            loginUrl: 'http://localhost:3000/student/login'
          });
        }
        console.log(`✅ Email notifications sent to ${students.length} students`);
      }
    } catch (emailError) {
      console.error('Email notification error:', emailError);
      // Don't fail the exam creation if email fails
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
      .from('questions')
      .select('id')
      .eq('exam_id', id);

    console.log('📊 Backend: Questions check for publish:', {
      questionsError: questionsError,
      questionsFound: questions,
      questionsCount: questions?.length || 0
    });

    if (questionsError) {
      console.error('❌ Backend: Error checking questions:', questionsError);
      return res.status(500).json({ success: false, message: 'Failed to check questions', error: questionsError.message });
    }

    if (!questions || questions.length === 0) {
      console.log('❌ Backend: Cannot publish exam without questions');
      return res.status(400).json({ success: false, message: 'Cannot publish exam without questions.' });
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
      .from('questions')
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

    // Validate exam key
    if (examData.exam_code !== examKey) {
      console.log('❌ Backend: Invalid exam key:', {
        expected: examData.exam_code,
        received: examKey
      });
      return res.status(401).json({ success: false, message: 'Invalid exam key.' });
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
    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select('id, question_text, type, options, marks, order_index, code_template, time_limit')
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
      console.log('❌ Backend: No questions found for exam - cannot start exam');
      return res.status(400).json({ 
        success: false, 
        message: 'This exam has no questions. Please contact the administrator to add questions to this exam before starting.' 
      });
    }

    console.log('✅ Found real questions:', questions.length);
    const finalQuestions = questions;

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

    // Use Supabase instead of query
    const { data, error } = await supabase
      .from('answers')
      .upsert({
        session_id: sessionId,
        question_id: questionId,
        student_id: studentId,
        exam_id: id,
        answer_text: answerText,
        selected_option: selectedOption,
        code_submission: codeSubmission,
        selected_language: selectedLanguage
      })
      .select();

    if (error) {
      console.error('Error saving answer:', error);
      return res.status(500).json({ success: false, message: 'Failed to save answer', error: error.message });
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

    // Use Supabase instead of query
    const { data: sessionData, error: sessionError } = await supabase
      .from('exam_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('student_id', studentId)
      .eq('exam_id', id)
      .eq('status', 'active')
      .single();

    if (sessionError || !sessionData) {
      return res.status(400).json({ success: false, message: 'Invalid or already submitted session.' });
    }

    // Evaluate MCQ answers using Supabase
    const { data: answers, error: answersError } = await supabase
      .from('answers')
      .select(`
        *,
        questions!inner(
          type,
          correct_answer,
          marks,
          negative_marks
        )
      `)
      .eq('session_id', sessionId);

    if (answersError) {
      console.error('Error fetching answers:', answersError);
      return res.status(500).json({ success: false, message: 'Failed to fetch answers', error: answersError.message });
    }

    let mcqMarks = 0;
    for (const answer of answers || []) {
      if (answer.questions.type === 'mcq' || answer.questions.type === 'true_false') {
        const isCorrect = answer.selected_option === answer.questions.correct_answer;
        const marksObtained = isCorrect ? answer.questions.marks : -Math.abs(answer.questions.negative_marks || 0);
        mcqMarks += marksObtained;
        
        // Update answer with evaluation
        await supabase
          .from('answers')
          .update({
            is_correct: isCorrect,
            marks_obtained: Math.max(0, marksObtained),
            is_evaluated: true
          })
          .eq('id', answer.id);
      }
    }

    // Get exam details using Supabase
    const { data: examData, error: examError } = await supabase
      .from('exams')
      .select('*')
      .eq('id', id)
      .single();

    if (examError || !examData) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }

    // Create result
    const hasSubjective = answers?.some(a => a.questions.type === 'subjective') || false;
    const hasCoding = answers?.some(a => a.questions.type === 'coding') || false;

    const resultStatus = (!hasSubjective && !hasCoding)
      ? (mcqMarks >= examData.passing_marks ? 'pass' : 'fail')
      : 'pending';

    const percentage = examData.total_marks > 0
      ? Math.round((mcqMarks / examData.total_marks) * 100 * 10) / 10
      : 0;

    // Update session status using Supabase
    await supabase
      .from('exam_sessions')
      .update({
        status: 'submitted',
        submitted_at: new Date().toISOString()
      })
      .eq('id', sessionId);

    // Create result record using Supabase
    const { data: resultData, error: resultError } = await supabase
      .from('results')
      .insert({
        session_id: sessionId,
        student_id: studentId,
        exam_id: id,
        mcq_marks: mcqMarks,
        total_marks: mcqMarks,
        percentage: percentage,
        status: resultStatus,
        submitted_at: new Date().toISOString()
      })
      .select()
      .single();

    if (resultError) {
      console.error('Error creating result:', resultError);
      return res.status(500).json({ success: false, message: 'Failed to create result', error: resultError.message });
    }

    res.json({
      success: true,
      message: 'Exam submitted successfully!',
      data: {
        result: {
          id: resultData.id,
          status: resultStatus,
          percentage: percentage,
          totalMarks: mcqMarks,
          submittedAt: resultData.submitted_at,
          isPending: resultStatus === 'pending'
        }
      }
    });

  } catch (error) {
    console.error('Submit exam error:', error);
    res.status(500).json({ success: false, message: 'Failed to submit exam', error: error.message });
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

    const maxViolations = examData?.max_violations || 8; // Professional thresholds

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

    let action = 'warning';
    let message = `Warning ${newCount}/${maxViolations}: ${type} detected.`;
    let autoTerminate = false;

    // Professional violation thresholds
    if (type === 'multiple_faces' && violationCounts[type] >= 2) {
      // Terminate after 2 multiple face violations
      action = 'terminate';
      message = 'Your exam has been terminated due to multiple person detection.';
      autoTerminate = true;
    } else if (type === 'tab_switch' && newCount >= 5) {
      // Terminate after 5 tab switches
      action = 'terminate';
      message = 'Your exam has been terminated due to excessive tab switching.';
      autoTerminate = true;
    } else if (type === 'window_blur' && violationCounts[type] >= 3) {
      // Terminate after 3 window blurs
      action = 'terminate';
      message = 'Your exam has been terminated due to repeated window focus loss.';
      autoTerminate = true;
    } else if (newCount >= maxViolations) {
      // Terminate if exceeding max violations
      action = 'terminate';
      message = 'Your exam has been automatically terminated due to repeated violations.';
      autoTerminate = true;
    } else {
      // Warning messages based on violation type
      if (type === 'multiple_faces') {
        message = `⚠️ Multiple faces detected! This is violation ${violationCounts[type]}/2. Please ensure only you are visible.`;
      } else if (type === 'camera_off') {
        message = `⚠️ Camera is off! Please turn on your camera immediately. Violation ${violationCounts[type]}/5.`;
      } else if (type === 'tab_switch') {
        message = `⚠️ Tab switch detected! Violation ${violationCounts[type]}/5. Stay focused on the exam.`;
      } else if (type === 'window_blur') {
        message = `⚠️ Window focus lost! Violation ${violationCounts[type]}/3. Keep the exam window active.`;
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
