// Check what questions exist in the database
const { supabase } = require('./config/supabase-clean');

async function checkQuestions() {
  try {
    console.log('🔍 Checking all questions in database...');
    
    // Check all questions
    const { data: allQuestions, error: allQuestionsError } = await supabase
      .from('questions')
      .select('*');
    
    console.log('All questions:', {
      error: allQuestionsError,
      count: allQuestions?.length || 0,
      questions: allQuestions?.map(q => ({
        id: q.id,
        exam_id: q.exam_id,
        question_text: q.question_text?.substring(0, 50) + '...',
        type: q.type,
        hasOptions: !!q.options,
        optionsCount: q.options?.length || 0
      }))
    });
    
    // Check exam_questions table
    const { data: examQuestions, error: examQuestionsError } = await supabase
      .from('exam_questions')
      .select('*');
    
    console.log('Exam questions:', {
      error: examQuestionsError,
      count: examQuestions?.length || 0,
      questions: examQuestions?.map(q => ({
        id: q.id,
        exam_id: q.exam_id,
        question_text: q.question_text?.substring(0, 50) + '...',
        question_type: q.question_type,
        hasData: !!q.question_data
      }))
    });
    
    // Check which exams have questions
    const { data: exams, error: examsError } = await supabase
      .from('exams')
      .select('id, title, description');
    
    if (!examsError && exams) {
      for (const exam of exams) {
        const { data: examQuestions, error: examQuestionsError } = await supabase
          .from('questions')
          .select('id')
          .eq('exam_id', exam.id);
        
        console.log(`Exam ${exam.id} (${exam.title}):`, {
          questionsCount: examQuestions?.length || 0,
          hasQuestions: (examQuestions?.length || 0) > 0,
          error: examQuestionsError?.message
        });
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkQuestions();
