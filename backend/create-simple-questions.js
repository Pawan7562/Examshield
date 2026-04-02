// create-simple-questions.js - Create test questions without difficulty column
const { supabase } = require('./config/supabase-clean');

async function createSimpleQuestions() {
  console.log('🔧 CREATING SIMPLE TEST QUESTIONS');
  console.log('=====================================');

  try {
    const examId = 'b2ea2dc0-6593-42ff-a6d3-44869709a6ce';

    // Create sample questions without difficulty column
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
        negative_marks: 0,
        order_index: 0,
        time_limit: 30000
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
        negative_marks: 0,
        order_index: 1,
        time_limit: 30000
      },
      {
        exam_id: examId,
        question_text: 'Explain the concept of gravity in your own words.',
        type: 'subjective',
        options: null,
        correct_answer: null,
        marks: 5,
        negative_marks: 0,
        order_index: 2,
        time_limit: 60000
      }
    ];

    console.log('\n📝 Inserting simple sample questions...');
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
      return;
    }

    console.log('\n✅ Sample questions created successfully!');
    console.log('\n📝 Created questions:');
    insertedQuestions.forEach((q, index) => {
      console.log(`${index + 1}. ID: ${q.id}, Type: ${q.type}, Text: ${q.question_text?.substring(0, 50)}...`);
    });

    console.log('\n🌐 Now you can test the delete functionality!');
    console.log('📋 Go to: http://localhost:3001');
    console.log('📋 Navigate to: Admin > Exams > Select the exam > Questions tab');
    console.log('🗑️ Try deleting any of the created questions');

  } catch (error) {
    console.error('❌ Error creating questions:', error);
  }
}

// Run the script
createSimpleQuestions();
