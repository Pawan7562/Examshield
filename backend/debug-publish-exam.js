// debug-publish-exam.js - Debug script for publish exam issue
const { supabase } = require('./config/supabase-clean');

async function debugPublishExam() {
  console.log('🔍 DEBUGGING PUBLISH EXAM 400 ERROR');
  console.log('=====================================');

  try {
    // The exam ID from the error
    const examId = '7e2d649a-1e31-402e-b7f6-6cda14412097';

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

    console.log('\n2. Checking questions for this exam...');
    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select('*')
      .eq('exam_id', examId);

    console.log('📊 Questions check result:', {
      questionsError: questionsError,
      questionsFound: questions?.length || 0,
      questions: questions
    });

    if (questionsError) {
      console.log('❌ Error fetching questions:', questionsError);
      return;
    }

    console.log('\n3. Checking exam status...');
    console.log('📊 Current exam status:', examData.status);

    console.log('\n4. Checking if exam can be published...');
    const canPublish = questions && questions.length > 0;
    console.log('📊 Can publish:', canPublish);
    console.log('📊 Questions count:', questions?.length || 0);

    if (!canPublish) {
      console.log('❌ Cannot publish exam - no questions found');
      console.log('🔧 Solution: Add questions to the exam first');
    } else {
      console.log('✅ Exam can be published');
    }

    console.log('\n5. Creating sample questions if needed...');
    if (!questions || questions.length === 0) {
      console.log('📝 Creating sample questions...');
      
      const sampleQuestions = [
        {
          exam_id: examId,
          question_text: 'What is the capital of France?',
          type: 'mcq',
          options: JSON.stringify([
            { id: 'a', text: 'London' },
            { id: 'b', text: 'Paris' },
            { id: 'c', text: 'Berlin' },
            { id: 'd', text: 'Madrid' }
          ]),
          correct_answer: 'b',
          marks: 1,
          order_index: 0
        },
        {
          exam_id: examId,
          question_text: 'What is 2 + 2?',
          type: 'mcq',
          options: JSON.stringify([
            { id: 'a', text: '3' },
            { id: 'b', text: '4' },
            { id: 'c', text: '5' },
            { id: 'd', text: '6' }
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
    console.log('\n🌐 Now try publishing the exam again at: http://localhost:3001');

  } catch (error) {
    console.error('❌ Debug error:', error);
  }
}

// Run the debug script
debugPublishExam();
