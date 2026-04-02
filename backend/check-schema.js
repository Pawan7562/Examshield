// check-schema.js - Check the actual schema of questions table
const { supabase } = require('./config/supabase-clean');

async function checkSchema() {
  console.log('🔍 CHECKING QUESTIONS TABLE SCHEMA');
  console.log('=====================================');

  try {
    // Try to select one question to see the schema
    const { data: sampleQuestion, error: sampleError } = await supabase
      .from('questions')
      .select('*')
      .limit(1);

    console.log('📊 Sample query result:', {
      sampleError: sampleError,
      sampleQuestion: sampleQuestion,
      hasData: sampleQuestion && sampleQuestion.length > 0
    });

    if (sampleError) {
      console.error('❌ Error querying questions:', sampleError);
      return;
    }

    if (sampleQuestion && sampleQuestion.length > 0) {
      console.log('\n📋 Available columns in questions table:');
      console.log('Columns:', Object.keys(sampleQuestion[0]));
      
      console.log('\n📝 Sample question data:');
      console.log(JSON.stringify(sampleQuestion[0], null, 2));
    } else {
      console.log('\n📝 No questions found in database');
    }

    // Also check existing questions for the exam
    const examId = 'b2ea2dc0-6593-42ff-a6d3-44869709a6ce';
    const { data: examQuestions, error: examQuestionsError } = await supabase
      .from('questions')
      .select('*')
      .eq('exam_id', examId);

    console.log('\n📊 Questions for exam:', {
      examQuestionsError: examQuestionsError,
      examQuestions: examQuestions,
      count: examQuestions?.length || 0
    });

  } catch (error) {
    console.error('❌ Schema check error:', error);
  }
}

// Run the script
checkSchema();
