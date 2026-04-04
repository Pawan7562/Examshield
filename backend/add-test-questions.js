// Add test questions to the exam you're trying to start
const { supabase } = require('./config/supabase-clean');

async function addTestQuestions() {
  try {
    const examId = '8d8de83b-81d8-4aca-a4d9-f79772457e04'; // The exam you're trying to start
    
    console.log('🔧 Adding test questions to exam:', examId);
    
    // Sample questions
    const testQuestions = [
      {
        exam_id: examId,
        question_text: 'What is the capital of France?',
        type: 'mcq',
        marks: 5,
        options: JSON.stringify([
          { id: 'a', text: 'London' },
          { id: 'b', text: 'Paris' },
          { id: 'c', text: 'Berlin' },
          { id: 'd', text: 'Madrid' }
        ]),
        correct_answer: 'b',
        order_index: 1
      },
      {
        exam_id: examId,
        question_text: 'What is 2 + 2?',
        type: 'mcq', 
        marks: 5,
        options: JSON.stringify([
          { id: 'a', text: '3' },
          { id: 'b', text: '4' },
          { id: 'c', text: '5' },
          { id: 'd', text: '6' }
        ]),
        correct_answer: 'b',
        order_index: 2
      },
      {
        exam_id: examId,
        question_text: 'What is the largest planet in our solar system?',
        type: 'mcq',
        marks: 5,
        options: JSON.stringify([
          { id: 'a', text: 'Earth' },
          { id: 'b', text: 'Mars' },
          { id: 'c', text: 'Jupiter' },
          { id: 'd', text: 'Saturn' }
        ]),
        correct_answer: 'c',
        order_index: 3
      }
    ];
    
    // Insert questions
    const { data: insertedQuestions, error: insertError } = await supabase
      .from('questions')
      .insert(testQuestions)
      .select();
    
    if (insertError) {
      console.error('❌ Failed to insert questions:', insertError);
    } else {
      console.log('✅ Successfully added questions:', insertedQuestions?.length || 0);
      console.log('Questions:', insertedQuestions?.map(q => ({
        id: q.id,
        question_text: q.question_text,
        type: q.type,
        hasOptions: !!q.options,
        optionsCount: q.options?.length || 0
      })));
    }
    
    // Verify the questions were added
    const { data: verifyQuestions, error: verifyError } = await supabase
      .from('questions')
      .select('*')
      .eq('exam_id', examId);
    
    console.log('🔍 Verification:', {
      error: verifyError,
      count: verifyQuestions?.length || 0,
      questions: verifyQuestions?.map(q => ({
        id: q.id,
        question_text: q.question_text?.substring(0, 30) + '...',
        type: q.type,
        hasOptions: !!q.options
      }))
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

addTestQuestions();
