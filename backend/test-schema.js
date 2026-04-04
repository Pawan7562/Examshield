// Test script to check database schema
const { supabase } = require('./config/supabase-clean');

async function testSchema() {
  try {
    console.log('🔍 Testing database schema...');
    
    // Check exam_questions table
    console.log('\n📋 Checking exam_questions table...');
    const { data: examQuestions, error: examQuestionsError } = await supabase
      .from('exam_questions')
      .select('*')
      .limit(1);
    
    console.log('exam_questions:', {
      exists: !examQuestionsError,
      error: examQuestionsError?.message,
      count: examQuestions?.length || 0
    });
    
    // Check questions table
    console.log('\n📋 Checking questions table...');
    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select('*')
      .limit(1);
    
    console.log('questions:', {
      exists: !questionsError,
      error: questionsError?.message,
      count: questions?.length || 0
    });
    
    // Check exams table
    console.log('\n📋 Checking exams table...');
    const { data: exams, error: examsError } = await supabase
      .from('exams')
      .select('id, title, description')
      .limit(3);
    
    console.log('exams:', {
      exists: !examsError,
      error: examsError?.message,
      count: exams?.length || 0,
      samples: exams?.map(e => ({
        id: e.id,
        title: e.title,
        hasDescription: !!e.description,
        descriptionLength: e.description?.length || 0
      }))
    });
    
    // Check if any exam has questions in exam_questions
    if (exams && exams.length > 0) {
      console.log('\n📋 Checking questions for exam:', exams[0].id);
      const { data: examQuestionsForExam, error: examQuestionsForExamError } = await supabase
        .from('exam_questions')
        .select('*')
        .eq('exam_id', exams[0].id);
      
      console.log('Questions for exam:', {
        examId: exams[0].id,
        exists: !examQuestionsForExamError,
        error: examQuestionsForExamError?.message,
        count: examQuestionsForExam?.length || 0,
        firstQuestion: examQuestionsForExam?.[0] ? {
          id: examQuestionsForExam[0].id,
          questionType: examQuestionsForExam[0].question_type,
          hasText: !!examQuestionsForExam[0].question_text,
          hasData: !!examQuestionsForExam[0].question_data
        } : null
      });
    }
    
  } catch (error) {
    console.error('Test error:', error);
  }
}

testSchema();
