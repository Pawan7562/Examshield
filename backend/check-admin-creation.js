// Check if admin question creation is working properly
const { supabase } = require('./config/supabase-clean');

async function checkAdminCreation() {
  console.log('🔍 CHECKING ADMIN QUESTION CREATION FLOW');
  console.log('='.repeat(60));
  
  try {
    // 1. Find the most recent exam that should have AI questions
    console.log('\n📋 1. FINDING MOST RECENT EXAM WITH QUESTIONS');
    
    const { data: recentExams, error: examsError } = await supabase
      .from('exams')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(3);
    
    if (!examsError && recentExams) {
      for (const exam of recentExams) {
        console.log(`\n🔍 Exam: ${exam.title || 'No title'} (${exam.id})`);
        console.log(`  Status: ${exam.status}`);
        console.log(`  Created: ${exam.created_at}`);
        console.log(`  Description: ${exam.description?.substring(0, 100) || 'No description'}...`);
        
        // Check questions table
        const { data: examQuestions, error: examQuestionsError } = await supabase
          .from('questions')
          .select('*')
          .eq('exam_id', exam.id);
        
        console.log(`  Questions in 'questions' table: ${examQuestions?.length || 0}`);
        
        // Check exam_questions table  
        const { data: examExamQuestions, error: examExamQuestionsError } = await supabase
          .from('exam_questions')
          .select('*')
          .eq('exam_id', exam.id);
        
        console.log(`  Questions in 'exam_questions' table: ${examExamQuestions?.length || 0}`);
        
        if (examQuestions && examQuestions.length > 0) {
          console.log(`  ✅ This exam has questions in the 'questions' table`);
          console.log(`  Sample question: ${examQuestions[0].question_text?.substring(0, 50)}...`);
        } else if (examExamQuestions && examExamQuestions.length > 0) {
          console.log(`  ⚠️ This exam has questions in the 'exam_questions' table but NOT in 'questions' table`);
          console.log(`  This suggests admin creation is saving to the wrong table!`);
        } else {
          console.log(`  ❌ This exam has no questions in either table`);
        }
      }
    }
    
    // 2. Simulate admin question creation
    console.log('\n📋 2. SIMULATING ADMIN QUESTION CREATION');
    
    const testExamId = recentExams?.[0]?.id;
    if (testExamId) {
      console.log(`Testing question creation for exam: ${testExamId}`);
      
      const sampleQuestion = {
        exam_id: testExamId,
        question_text: 'What is the capital of Japan?',
        type: 'mcq',
        marks: 5,
        options: JSON.stringify([
          { id: 'a', text: 'Tokyo' },
          { id: 'b', text: 'Beijing' },
          { id: 'c', text: 'Seoul' },
          { id: 'd', text: 'Bangkok' }
        ]),
        correct_answer: 'a',
        order_index: 999 // Use high number to identify test question
      };
      
      // Try to insert into questions table
      const { data: insertedQuestion, error: insertError } = await supabase
        .from('questions')
        .insert(sampleQuestion)
        .select();
      
      if (insertError) {
        console.log(`❌ Failed to insert into 'questions' table: ${insertError.message}`);
      } else {
        console.log(`✅ Successfully inserted into 'questions' table: ${insertedQuestion[0].id}`);
        
        // Clean up test question
        await supabase
          .from('questions')
          .delete()
          .eq('id', insertedQuestion[0].id);
        
        console.log(`🧹 Test question cleaned up`);
      }
    }
    
    // 3. Check the AI question generation flow
    console.log('\n📋 3. AI QUESTION GENERATION ANALYSIS');
    console.log('Current AI generation process:');
    console.log('  1. Admin generates questions in frontend');
    console.log('  2. Questions sent to backend createExam API');
    console.log('  3. Backend saves to processExamDataAsync function');
    console.log('  4. processExamDataAsync inserts into "questions" table');
    console.log('');
    console.log('Potential issues:');
    console.log('  - AI generation might be saving to "exam_questions" table');
    console.log('  - Student startExam fetches from "questions" table');
    console.log('  - Mismatch causes questions not to load');
    
  } catch (error) {
    console.error('Check error:', error);
  }
}

checkAdminCreation();
