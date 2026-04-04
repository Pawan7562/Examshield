// Test the specific exam that has questions
const { supabase } = require('./config/supabase-clean');

async function testSpecificExam() {
  try {
    const examId = '8d8de83b-81d8-4aca-a4d9-f79772457e04'; // The exam with 3 questions
    
    console.log('🔍 Testing exam with questions:', examId);
    
    // Test the exact startExam query
    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select('id, question_text, type, options, marks, order_index, code_template, time_limit')
      .eq('exam_id', examId)
      .order('order_index');
    
    console.log('Query result:', {
      error: questionsError?.message,
      count: questions?.length || 0,
      questions: questions?.map(q => ({
        id: q.id,
        question_text: q.question_text?.substring(0, 50) + '...',
        type: q.type,
        hasOptions: !!q.options,
        optionsType: typeof q.options,
        optionsCount: q.options ? (typeof q.options === 'string' ? JSON.parse(q.options || '[]').length : q.options.length) : 0,
        marks: q.marks
      }))
    });
    
    // Test the transformation logic
    if (questions && questions.length > 0) {
      console.log('\n🔄 Testing transformation logic:');
      
      const transformedQuestions = questions.map(q => {
        // Parse options if it's a string
        let parsedOptions = [];
        if (typeof q.options === 'string') {
          try {
            parsedOptions = JSON.parse(q.options);
          } catch (e) {
            console.log('⚠️ Failed to parse options JSON');
            parsedOptions = [];
          }
        } else if (Array.isArray(q.options)) {
          parsedOptions = q.options;
        }
        
        return {
          id: q.id,
          type: q.type || 'mcq',
          question_text: q.question_text || 'No question text',
          marks: q.marks || 1,
          difficulty: 'medium', // Default since table doesn't have difficulty column
          options: parsedOptions,
          correctAnswer: q.correct_answer || null,
          order_index: q.order_index
        };
      });
      
      console.log('Transformed questions:', transformedQuestions.map(q => ({
        id: q.id,
        type: q.type,
        hasText: !!q.question_text,
        textLength: q.question_text?.length || 0,
        hasOptions: !!q.options,
        optionsCount: q.options?.length || 0,
        firstOption: q.options?.[0]?.text || 'No options'
      })));
      
      console.log('\n✅ SUCCESS: Questions can be fetched and transformed!');
      console.log('📋 This exam should work for students now.');
      
    } else {
      console.log('❌ No questions found to test transformation');
    }
    
  } catch (error) {
    console.error('Test error:', error);
  }
}

testSpecificExam();
