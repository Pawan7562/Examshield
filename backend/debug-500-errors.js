// debug-500-errors.js - Comprehensive error diagnostic script
const { supabase } = require('./config/supabase-clean');

async function debugBackendErrors() {
  console.log('🔍 DEBUGGING BACKEND 500 ERRORS');
  console.log('=====================================');

  try {
    // Test 1: Supabase connection
    console.log('\n1. Testing Supabase connection...');
    const { data: testData, error: testError } = await supabase
      .from('exams')
      .select('count')
      .limit(1);
    
    console.log('Supabase Test Result:', {
      error: testError,
      data: testData,
      connection: testError ? '❌ Failed' : '✅ Success'
    });

    // Test 2: Get exams
    console.log('\n2. Testing get exams...');
    const { data: exams, error: examsError } = await supabase
      .from('exams')
      .select('*')
      .limit(5);
    
    console.log('Get Exams Result:', {
      error: examsError,
      count: exams?.length || 0,
      success: examsError ? '❌ Failed' : '✅ Success'
    });

    // Test 3: Get questions for a specific exam
    console.log('\n3. Testing get questions...');
    if (exams && exams.length > 0) {
      const examId = exams[0].id;
      const { data: questions, error: questionsError } = await supabase
        .from('questions')
        .select('*')
        .eq('exam_id', examId);
      
      console.log('Get Questions Result:', {
        examId: examId,
        error: questionsError,
        count: questions?.length || 0,
        success: questionsError ? '❌ Failed' : '✅ Success'
      });
    } else {
      console.log('❌ No exams found to test questions');
    }

    // Test 4: Test publish exam logic
    console.log('\n4. Testing publish exam logic...');
    if (exams && exams.length > 0) {
      const examId = exams[0].id;
      const collegeId = exams[0].college_id;
      
      // Check exam exists
      const { data: examData, error: examError } = await supabase
        .from('exams')
        .select('*')
        .eq('id', examId)
        .eq('college_id', collegeId)
        .single();
      
      console.log('Publish Exam - Check Exam:', {
        examId: examId,
        collegeId: collegeId,
        error: examError,
        examFound: !!examData,
        success: examError ? '❌ Failed' : '✅ Success'
      });

      if (examData) {
        // Check questions exist
        const { data: questions, error: questionsError } = await supabase
          .from('questions')
          .select('id')
          .eq('exam_id', examId);
        
        console.log('Publish Exam - Check Questions:', {
          error: questionsError,
          questionsCount: questions?.length || 0,
          canPublish: questions?.length > 0,
          success: questionsError ? '❌ Failed' : '✅ Success'
        });
      }
    }

    console.log('\n✅ DEBUGGING COMPLETE');
    console.log('If all tests show ✅ Success, the backend should work after restart.');
    console.log('If any test shows ❌ Failed, that\'s the source of the 500 errors.');

  } catch (error) {
    console.error('❌ DEBUGGING ERROR:', error);
    console.log('Error details:', {
      message: error.message,
      stack: error.stack
    });
  }
}

// Run the debug script
debugBackendErrors();
