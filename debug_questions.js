// Debug script to check questions in database
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://your-project.supabase.co';
const supabaseKey = 'your-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugQuestions() {
  try {
    console.log('🔍 Debugging questions in database...');
    
    // Check all questions
    const { data: allQuestions, error: allQuestionsError } = await supabase
      .from('questions')
      .select('*');
    
    console.log('📊 All Questions:', {
      error: allQuestionsError,
      count: allQuestions?.length || 0,
      data: allQuestions
    });
    
    // Check questions for specific exam
    const examId = '7e2d649a-1e31-402e-b7f6-6cda14412097'; // Replace with actual exam ID
    const { data: examQuestions, error: examQuestionsError } = await supabase
      .from('questions')
      .select('*')
      .eq('exam_id', examId);
    
    console.log('📊 Exam Questions:', {
      examId: examId,
      error: examQuestionsError,
      count: examQuestions?.length || 0,
      data: examQuestions
    });
    
    // Check exams
    const { data: exams, error: examsError } = await supabase
      .from('exams')
      .select('*');
    
    console.log('📊 All Exams:', {
      error: examsError,
      count: exams?.length || 0,
      data: exams
    });
    
  } catch (error) {
    console.error('❌ Debug error:', error);
  }
}

debugQuestions();
