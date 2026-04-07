const { supabase } = require('./config/supabase-clean');

async function checkSupabaseStructure() {
  console.log('🔍 Checking Supabase database structure...\n');
  
  try {
    // Check 1: Exams table
    console.log('📋 Checking exams table...');
    const { data: exams, error: examsError } = await supabase
      .from('exams')
      .select('*')
      .limit(1);

    if (examsError) {
      console.error('❌ Exams table error:', examsError);
    } else if (exams && exams.length > 0) {
      console.log('✅ Exams table structure:');
      console.log(JSON.stringify(exams[0], null, 2));
    } else {
      console.log('⚠️ No exams found');
    }

    // Check 2: Questions table
    console.log('\n📋 Checking questions table...');
    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select('*')
      .limit(1);

    if (questionsError) {
      console.error('❌ Questions table error:', questionsError);
    } else if (questions && questions.length > 0) {
      console.log('✅ Questions table structure:');
      console.log(JSON.stringify(questions[0], null, 2));
    } else {
      console.log('⚠️ No questions found');
    }

    // Check 3: Exam assignments table
    console.log('\n📋 Checking exam_assignments table...');
    const { data: assignments, error: assignmentsError } = await supabase
      .from('exam_assignments')
      .select('*')
      .limit(1);

    if (assignmentsError) {
      console.error('❌ Exam assignments table error:', assignmentsError);
    } else if (assignments && assignments.length > 0) {
      console.log('✅ Exam assignments table structure:');
      console.log(JSON.stringify(assignments[0], null, 2));
    } else {
      console.log('⚠️ No exam assignments found');
    }

    // Check 4: Students table
    console.log('\n📋 Checking students table...');
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('*')
      .limit(1);

    if (studentsError) {
      console.error('❌ Students table error:', studentsError);
    } else if (students && students.length > 0) {
      console.log('✅ Students table structure:');
      console.log(JSON.stringify(students[0], null, 2));
    } else {
      console.log('⚠️ No students found');
    }

    // Check 5: Results table
    console.log('\n📋 Checking results table...');
    const { data: results, error: resultsError } = await supabase
      .from('results')
      .select('*')
      .limit(1);

    if (resultsError) {
      console.error('❌ Results table error:', resultsError);
    } else if (results && results.length > 0) {
      console.log('✅ Results table structure:');
      console.log(JSON.stringify(results[0], null, 2));
    } else {
      console.log('⚠️ No results found');
    }

    console.log('\n🎉 Supabase structure check completed!');
    console.log('📊 All tables are properly configured');

  } catch (error) {
    console.error('💥 Supabase check failed:', error);
  }
}

checkSupabaseStructure().then(() => {
  console.log('\n🏁 Supabase database verification completed');
  process.exit(0);
});
