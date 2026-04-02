// debug-question-display.js - Debug script for question display issue
const { supabase } = require('./config/supabase-clean');

async function debugQuestionDisplay() {
  console.log('🔍 DEBUGGING QUESTION DISPLAY ISSUE');
  console.log('=====================================');

  try {
    console.log('\n1. Checking all exams in database...');
    const { data: allExams, error: allExamsError } = await supabase
      .from('exams')
      .select('*');

    console.log('📊 All exams:', {
      allExamsError: allExamsError,
      totalExams: allExams?.length || 0
    });

    if (allExams && allExams.length > 0) {
      console.log('\n📝 All exams in database:');
      allExams.forEach((exam, index) => {
        console.log(`${index + 1}. ID: ${exam.id}, Title: ${exam.title}, Status: ${exam.status}`);
      });
    }

    console.log('\n2. Checking all questions in database...');
    const { data: allQuestions, error: allQuestionsError } = await supabase
      .from('questions')
      .select('*');

    console.log('📊 All questions:', {
      allQuestionsError: allQuestionsError,
      totalQuestions: allQuestions?.length || 0
    });

    if (allQuestions && allQuestions.length > 0) {
      console.log('\n📝 All questions with exam associations:');
      allQuestions.forEach((q, index) => {
        console.log(`${index + 1}. Question ID: ${q.id}, Exam ID: ${q.exam_id}, Text: ${q.question_text?.substring(0, 50)}...`);
      });
    }

    console.log('\n3. Checking questions by exam...');
    if (allExams) {
      for (const exam of allExams) {
        console.log(`\n📋 Questions for exam: ${exam.title} (${exam.id})`);
        
        const { data: examQuestions, error: examQuestionsError } = await supabase
          .from('questions')
          .select('*')
          .eq('exam_id', exam.id)
          .order('order_index', { ascending: true });

        console.log(`📊 Questions count: ${examQuestions?.length || 0}`);
        
        if (examQuestions && examQuestions.length > 0) {
          examQuestions.forEach((q, index) => {
            console.log(`  ${index + 1}. ${q.question_text?.substring(0, 60)}...`);
          });
        } else {
          console.log('  ❌ No questions found');
        }
      }
    }

    console.log('\n4. Checking startExam function logic...');
    // Simulate what happens when a student starts an exam
    const examId = '7e2d649a-1e31-402e-b7f6-6cda14412097'; // Use one of our test exams
    
    console.log(`\n📝 Simulating start exam for: ${examId}`);
    
    const { data: startExamQuestions, error: startExamError } = await supabase
      .from('questions')
      .select('*')
      .eq('exam_id', examId)
      .order('order_index', { ascending: true });

    console.log('📊 Start exam questions result:', {
      startExamError: startExamError,
      questionsFound: startExamQuestions?.length || 0,
      questions: startExamQuestions
    });

    console.log('\n5. Checking if there are any sample questions being created...');
    // Look for any hardcoded sample questions in the startExam function
    console.log('📝 Checking startExam function for sample question logic...');
    
    console.log('\n✅ DEBUGGING COMPLETE');
    console.log('\n🔧 Next steps:');
    console.log('1. Check if startExam function is creating sample questions instead of using real ones');
    console.log('2. Verify the exam_id association is correct');
    console.log('3. Check if frontend is requesting the correct exam ID');

  } catch (error) {
    console.error('❌ Debug error:', error);
  }
}

// Run the debug script
debugQuestionDisplay();
