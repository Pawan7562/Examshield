// debug-question-management.js - Debug script for question management issue
const { supabase } = require('./config/supabase-clean');

async function debugQuestionManagement() {
  console.log('🔍 DEBUGGING QUESTION MANAGEMENT ISSUE');
  console.log('=====================================');

  try {
    // The exam ID from the error
    const examId = '30894455-1c7d-42f5-865a-e551411210df';

    console.log('\n1. Checking exam existence...');
    const { data: examData, error: examError } = await supabase
      .from('exams')
      .select('*')
      .eq('id', examId)
      .single();

    console.log('📊 Exam check result:', {
      examError: examError,
      examData: examData,
      examFound: !!examData
    });

    if (examError || !examData) {
      console.log('❌ Exam not found');
      return;
    }

    console.log('\n2. Checking all questions in database...');
    const { data: allQuestions, error: allQuestionsError } = await supabase
      .from('questions')
      .select('*');

    console.log('📊 All questions in database:', {
      allQuestionsError: allQuestionsError,
      totalQuestions: allQuestions?.length || 0
    });

    if (allQuestions && allQuestions.length > 0) {
      console.log('\n📝 All questions in database:');
      allQuestions.forEach((q, index) => {
        console.log(`${index + 1}. Exam ID: ${q.exam_id}, Question ID: ${q.id}, Text: ${q.question_text?.substring(0, 50)}...`);
      });
    }

    console.log('\n3. Checking questions for this specific exam...');
    const { data: examQuestions, error: examQuestionsError } = await supabase
      .from('questions')
      .select('*')
      .eq('exam_id', examId);

    console.log('📊 Questions for this exam:', {
      examQuestionsError: examQuestionsError,
      questionsFound: examQuestions?.length || 0,
      questions: examQuestions
    });

    console.log('\n4. Checking if questions are being created but not associated...');
    // Check for any questions that might have null or incorrect exam_id
    const { data: orphanQuestions, error: orphanError } = await supabase
      .from('questions')
      .select('*')
      .is('exam_id', null);

    console.log('📊 Orphan questions (null exam_id):', {
      orphanError: orphanError,
      orphanCount: orphanQuestions?.length || 0
    });

    if (orphanQuestions && orphanQuestions.length > 0) {
      console.log('\n📝 Orphan questions found:');
      orphanQuestions.forEach((q, index) => {
        console.log(`${index + 1}. Question ID: ${q.id}, Text: ${q.question_text?.substring(0, 50)}...`);
      });
    }

    console.log('\n5. Testing the getExamQuestions API logic...');
    // Simulate what the frontend API call does
    const { data: apiQuestions, error: apiError } = await supabase
      .from('questions')
      .select('*')
      .eq('exam_id', examId)
      .order('order_index', { ascending: true });

    console.log('📊 API simulation result:', {
      apiError: apiError,
      apiQuestions: apiQuestions,
      apiCount: apiQuestions?.length || 0
    });

    console.log('\n6. Creating sample questions if needed...');
    if (!examQuestions || examQuestions.length === 0) {
      console.log('📝 Creating sample questions for this exam...');
      
      const sampleQuestions = [
        {
          exam_id: examId,
          question_text: 'What is the capital of Japan?',
          type: 'mcq',
          options: JSON.stringify([
            { id: 'a', text: 'Seoul' },
            { id: 'b', text: 'Tokyo' },
            { id: 'c', text: 'Beijing' },
            { id: 'd', text: 'Bangkok' }
          ]),
          correct_answer: 'b',
          marks: 1,
          order_index: 0
        },
        {
          exam_id: examId,
          question_text: 'What is 5 + 3?',
          type: 'mcq',
          options: JSON.stringify([
            { id: 'a', text: '7' },
            { id: 'b', text: '8' },
            { id: 'c', text: '9' },
            { id: 'd', text: '10' }
          ]),
          correct_answer: 'b',
          marks: 1,
          order_index: 1
        }
      ];

      const { data: insertedQuestions, error: insertError } = await supabase
        .from('questions')
        .insert(sampleQuestions)
        .select();

      console.log('📊 Insert result:', {
        insertError: insertError,
        insertedQuestions: insertedQuestions,
        insertedCount: insertedQuestions?.length || 0
      });

      if (insertError) {
        console.error('❌ Error inserting questions:', insertError);
      } else {
        console.log('✅ Sample questions created successfully!');
        console.log('📝 Created questions:', insertedQuestions?.length || 0);
      }
    }

    console.log('\n✅ DEBUGGING COMPLETE');
    console.log('\n🌐 Now check the question management section at: http://localhost:3001');
    console.log('📋 Go to Admin > Exams > Select exam > Questions tab');

  } catch (error) {
    console.error('❌ Debug error:', error);
  }
}

// Run the debug script
debugQuestionManagement();
