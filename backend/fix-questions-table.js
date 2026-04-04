// Fix script to handle missing exam_questions table
// We'll use the existing questions table and modify the code to work with it

const { supabase } = require('./config/supabase-clean');

async function fixQuestionsTable() {
  try {
    console.log('🔧 Fixing questions table structure...');
    
    // Check if we can insert into questions table with exam_id
    console.log('\n📋 Testing questions table structure...');
    const { data: questionsTable, error: questionsError } = await supabase
      .from('questions')
      .select('*')
      .limit(1);
    
    console.log('Questions table structure:', {
      exists: !questionsError,
      error: questionsError?.message,
      sample: questionsTable?.[0] ? Object.keys(questionsTable[0]) : null
    });
    
    // Add exam_id column to questions table if it doesn't exist
    if (!questionsError && questionsTable?.[0]) {
      const hasExamId = Object.keys(questionsTable[0]).includes('exam_id');
      console.log('Questions table has exam_id column:', hasExamId);
      
      if (!hasExamId) {
        console.log('⚠️ Questions table missing exam_id column - this needs manual fix in Supabase dashboard');
      }
    }
    
    // Create a test question to verify the structure
    console.log('\n📋 Creating test question...');
    const testQuestion = {
      exam_id: '00000000-0000-0000-0000-000000000000', // Dummy exam_id
      question_text: 'Test question for debugging',
      type: 'mcq',
      marks: 1,
      difficulty: 'medium',
      options: [
        { id: 'a', text: 'Option A' },
        { id: 'b', text: 'Option B' },
        { id: 'c', text: 'Option C' },
        { id: 'd', text: 'Option D' }
      ],
      correctAnswer: 'a',
      order_index: 1
    };
    
    const { data: insertedQuestion, error: insertError } = await supabase
      .from('questions')
      .insert(testQuestion)
      .select()
      .single();
    
    if (insertError) {
      console.log('❌ Failed to insert test question:', insertError);
      console.log('This indicates the questions table structure is incompatible');
    } else {
      console.log('✅ Test question inserted successfully:', insertedQuestion.id);
      
      // Clean up test question
      await supabase
        .from('questions')
        .delete()
        .eq('id', insertedQuestion.id);
      
      console.log('🧹 Test question cleaned up');
    }
    
    console.log('\n📋 Recommendation:');
    console.log('1. Go to Supabase dashboard');
    console.log('2. Open SQL Editor');
    console.log('3. Run the SQL from add-ai-exam-tables.sql');
    console.log('4. This will create the missing tables');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

fixQuestionsTable();
