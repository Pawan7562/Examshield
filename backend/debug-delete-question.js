// debug-delete-question.js - Debug script for delete question issue
const { supabase } = require('./config/supabase-clean');

async function debugDeleteQuestion() {
  console.log('🔍 DEBUGGING DELETE QUESTION ISSUE');
  console.log('=====================================');

  try {
    // The exam ID from the error
    const examId = 'b2ea2dc0-6593-42ff-a6d3-44869709a6ce';
    const questionId = '8a3190f7-bbd8-40d3-8960-66b3f1478c43';

    console.log('\n1. Checking exam existence...');
    const { data: examData, error: examError } = await supabase
      .from('exams')
      .select('*')
      .eq('id', examId)
      .single();

    console.log('📊 Exam check result:', {
      examError: examError,
      examData: examData,
      examFound: !!examData
    });

    if (examError || !examData) {
      console.log('❌ Exam not found');
      return;
    }

    console.log('\n2. Checking all questions for this exam...');
    const { data: allQuestions, error: allQuestionsError } = await supabase
      .from('questions')
      .select('*')
      .eq('exam_id', examId);

    console.log('📊 All questions result:', {
      allQuestionsError: allQuestionsError,
      questionsFound: allQuestions?.length || 0,
      questions: allQuestions
    });

    console.log('\n3. Checking specific question...');
    const { data: specificQuestion, error: specificQuestionError } = await supabase
      .from('questions')
      .select('*')
      .eq('id', questionId)
      .single();

    console.log('📊 Specific question check:', {
      specificQuestionError: specificQuestionError,
      specificQuestion: specificQuestion,
      questionFound: !!specificQuestion
    });

    console.log('\n4. Checking if question belongs to exam...');
    const { data: questionInExam, error: questionInExamError } = await supabase
      .from('questions')
      .select('*')
      .eq('id', questionId)
      .eq('exam_id', examId)
      .single();

    console.log('📊 Question in exam check:', {
      questionInExamError: questionInExamError,
      questionInExam: questionInExam,
      belongsToExam: !!questionInExam
    });

    console.log('\n✅ DEBUGGING COMPLETE');
    
    if (allQuestions && allQuestions.length > 0) {
      console.log('\n📝 Available questions for this exam:');
      allQuestions.forEach((q, index) => {
        console.log(`${index + 1}. ID: ${q.id}, Text: ${q.question_text?.substring(0, 50)}...`);
      });
    }

  } catch (error) {
    console.error('❌ Debug error:', error);
  }
}

// Run the debug script
debugDeleteQuestion();
