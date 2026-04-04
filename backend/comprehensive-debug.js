// Comprehensive debugging for question loading issue
const { supabase } = require('./config/supabase-clean');

async function comprehensiveDebug() {
  console.log('🔍 COMPREHENSIVE QUESTION LOADING DEBUG');
  console.log('='.repeat(60));
  
  try {
    // 1. Check both tables for questions
    console.log('\n📋 1. CHECKING BOTH TABLES FOR QUESTIONS');
    
    const { data: questionsTable, error: questionsError } = await supabase
      .from('questions')
      .select('*');
    
    const { data: examQuestionsTable, error: examQuestionsError } = await supabase
      .from('exam_questions')
      .select('*');
    
    console.log('Questions table:', {
      exists: !questionsError,
      count: questionsTable?.length || 0,
      error: questionsError?.message
    });
    
    console.log('Exam_questions table:', {
      exists: !examQuestionsError,
      count: examQuestionsTable?.length || 0,
      error: examQuestionsError?.message
    });
    
    // 2. Check recent exams
    console.log('\n📋 2. CHECKING RECENT EXAMS');
    
    const { data: recentExams, error: examsError } = await supabase
      .from('exams')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (!examsError && recentExams) {
      console.log('Recent exams:');
      recentExams.forEach((exam, index) => {
        console.log(`  ${index + 1}. ${exam.title || 'No title'} (${exam.id})`);
        console.log(`     Status: ${exam.status}`);
        console.log(`     AI Generated: ${exam.ai_generated}`);
        console.log(`     Created: ${exam.created_at}`);
      });
    }
    
    // 3. Check questions for each recent exam in both tables
    console.log('\n📋 3. CHECKING QUESTIONS FOR RECENT EXAMS');
    
    if (!examsError && recentExams) {
      for (const exam of recentExams) {
        console.log(`\n🔍 Exam: ${exam.title || 'No title'} (${exam.id})`);
        
        // Check questions table
        const { data: examQuestions, error: examQuestionsFetchError } = await supabase
          .from('questions')
          .select('*')
          .eq('exam_id', exam.id);
        
        console.log(`  Questions in 'questions' table: ${examQuestions?.length || 0}`);
        if (examQuestionsFetchError) {
          console.log(`  Error fetching from questions table: ${examQuestionsFetchError.message}`);
        }
        
        // Check exam_questions table
        const { data: examExamQuestions, error: examExamQuestionsFetchError } = await supabase
          .from('exam_questions')
          .select('*')
          .eq('exam_id', exam.id);
        
        console.log(`  Questions in 'exam_questions' table: ${examExamQuestions?.length || 0}`);
        if (examExamQuestionsFetchError) {
          console.log(`  Error fetching from exam_questions table: ${examExamQuestionsFetchError.message}`);
        }
        
        // Show sample question structure if available
        if (examQuestions && examQuestions.length > 0) {
          console.log(`  Sample question structure (questions table):`);
          const sample = examQuestions[0];
          console.log(`    - ID: ${sample.id}`);
          console.log(`    - Text: ${sample.question_text?.substring(0, 50)}...`);
          console.log(`    - Type: ${sample.type}`);
          console.log(`    - Options type: ${typeof sample.options}`);
          console.log(`    - Options count: ${sample.options ? (typeof sample.options === 'string' ? JSON.parse(sample.options || '[]').length : sample.options.length) : 0}`);
        }
        
        if (examExamQuestions && examExamQuestions.length > 0) {
          console.log(`  Sample question structure (exam_questions table):`);
          const sample = examExamQuestions[0];
          console.log(`    - ID: ${sample.id}`);
          console.log(`    - Text: ${sample.question_text?.substring(0, 50)}...`);
          console.log(`    - Type: ${sample.question_type}`);
          console.log(`    - Has question_data: ${!!sample.question_data}`);
        }
      }
    }
    
    // 4. Test the actual startExam API logic
    console.log('\n📋 4. TESTING START EXAM API LOGIC');
    
    if (!examsError && recentExams && recentExams.length > 0) {
      const testExamId = recentExams[0].id;
      console.log(`Testing with exam: ${testExamId}`);
      
      // Simulate the startExam query
      const { data: startExamQuestions, error: startExamError } = await supabase
        .from('questions') // This is what the backend currently uses
        .select('id, question_text, type, options, marks, order_index, code_template, time_limit') // Removed 'difficulty'
        .eq('exam_id', testExamId)
        .order('order_index');
      
      console.log('StartExam query result:', {
        error: startExamError?.message,
        count: startExamQuestions?.length || 0,
        questions: startExamQuestions?.map(q => ({
          id: q.id,
          hasText: !!q.question_text,
          textLength: q.question_text?.length || 0,
          type: q.type,
          hasOptions: !!q.options,
          optionsType: typeof q.options,
          optionsCount: q.options ? (typeof q.options === 'string' ? JSON.parse(q.options || '[]').length : q.options.length) : 0
        }))
      });
    }
    
    // 5. Check backend code configuration
    console.log('\n📋 5. BACKEND CONFIGURATION ANALYSIS');
    console.log('Current backend configuration:');
    console.log('  - startExam function uses: .from("questions")');
    console.log('  - createExam function uses: .from("questions")');
    console.log('  - getExamQuestions uses: .from("questions")');
    console.log('');
    console.log('Available tables:');
    console.log('  - questions (existing, with data)');
    console.log('  - exam_questions (new, possibly empty)');
    console.log('');
    console.log('RECOMMENDATION:');
    console.log('  1. Decide which table to use consistently');
    console.log('  2. Update all backend functions to use the same table');
    console.log('  3. Ensure admin question generation saves to the correct table');
    console.log('  4. Ensure student exam start fetches from the same table');
    
  } catch (error) {
    console.error('Debug error:', error);
  }
}

comprehensiveDebug();
