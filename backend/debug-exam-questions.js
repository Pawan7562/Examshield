// debug-exam-questions.js - Debug exam questions display issue
const { supabase } = require('./config/supabase-clean');

async function debugExamQuestions() {
  console.log('🔍 DEBUGGING EXAM QUESTIONS DISPLAY');
  console.log('=====================================');

  try {
    // Check all exams and their question counts
    const { data: exams, error: examsError } = await supabase
      .from('exams')
      .select('id, name, question_count, status');

    console.log('📊 All exams with question counts:');
    if (exams && exams.length > 0) {
      exams.forEach((exam, index) => {
        console.log(`${index + 1}. Exam: ${exam.name}`);
        console.log(`   ID: ${exam.id}`);
        console.log(`   Status: ${exam.status}`);
        console.log(`   Question Count: ${exam.question_count || 0}`);
        console.log(`   Created: ${exam.created_at}`);
        console.log('---');
      });
    }

    // Check actual questions in database
    const { data: allQuestions, error: allQuestionsError } = await supabase
      .from('questions')
      .select('exam_id, id');

    console.log('\n📊 All questions in database:');
    if (allQuestions && allQuestions.length > 0) {
      const questionCounts = {};
      allQuestions.forEach(q => {
        questionCounts[q.exam_id] = (questionCounts[q.exam_id] || 0) + 1;
      });

      Object.entries(questionCounts).forEach(([examId, count]) => {
        console.log(`Exam ${examId}: ${count} questions`);
      });
    }

    // Check specific exams that should have questions
    const examIdsToCheck = [
      'b2ea2dc0-6593-42ff-a6d3-44869709a6ce', // Should have 0 questions
      'b73a233f-1d78-4faa-b8c2-c3e6b8bdaa60', // College admin
      '30894455-1c7d-42f5-865a-e551411210df', // Should have 2 questions
      '7e2d649a-1e31-402e-b7f6-6cda14412097', // Should have 2 questions
      'b2ea2dc0-6593-42ff-a6d3-44869709a6ce' // Should have 0 questions
    ];

    console.log('\n🔍 Checking specific exams:');
    for (const examId of examIdsToCheck) {
      const exam = exams?.find(e => e.id === examId);
      const questionCount = allQuestions?.filter(q => q.exam_id === examId).length;
      
      console.log(`Exam ${examId}:`);
      console.log(`  Found: ${exam ? 'YES' : 'NO'}`);
      console.log(`  Name: ${exam?.name || 'NOT FOUND'}`);
      console.log(`  Status: ${exam?.status || 'UNKNOWN'}`);
      console.log(`  DB Question Count: ${questionCount}`);
      console.log(`  Exam Question Count: ${exam?.question_count || 0}`);
      console.log(`  Match: ${questionCount === (exam?.question_count || 0) ? 'YES' : 'NO'}`);
      console.log('---');
    }

  } catch (error) {
    console.error('❌ Debug error:', error);
  }
}

// Run the debug script
debugExamQuestions();
