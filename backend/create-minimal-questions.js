// create-minimal-questions.js - Create test questions with minimal columns
const { supabase } = require('./config/supabase-clean');

async function createMinimalQuestions() {
  console.log('🔧 CREATING MINIMAL TEST QUESTIONS');
  console.log('=====================================');

  try {
    const examId = 'b2ea2dc0-6593-42ff-a6d3-44869709a6ce';

    // Create sample questions with minimal columns
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

    console.log('\n📝 Inserting minimal sample questions...');
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
      console.log('🔍 Trying to identify the issue...');
      
      // Try to insert just one question to see what columns are required
      const minimalQuestion = {
        exam_id: examId,
        question_text: 'Test question'
      };
      
      console.log('\n📝 Trying minimal insert...');
      const { data: minimalInsert, error: minimalError } = await supabase
        .from('questions')
        .insert(minimalQuestion)
        .select();
      
      console.log('📊 Minimal insert result:', {
        minimalError: minimalError,
        minimalInsert: minimalInsert
      });
      
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
createMinimalQuestions();
