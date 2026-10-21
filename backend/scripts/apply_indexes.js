const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 2,
});

const indexQueries = [
  // 1. Questions lookup
  `CREATE INDEX IF NOT EXISTS idx_questions_exam_id ON questions(exam_id);`,
  `CREATE INDEX IF NOT EXISTS idx_questions_exam_order ON questions(exam_id, order_index ASC);`,
  
  // 2. Student fast lookups (case-insensitive & whitespace-stripped)
  `CREATE INDEX IF NOT EXISTS idx_students_roll_no ON students(roll_no);`,
  `CREATE INDEX IF NOT EXISTS idx_students_lower_roll ON students(LOWER(roll_no));`,
  `CREATE INDEX IF NOT EXISTS idx_students_lower_email ON students(LOWER(email));`,
  `CREATE INDEX IF NOT EXISTS idx_students_lower_student_id ON students(LOWER(student_id));`,
  `CREATE INDEX IF NOT EXISTS idx_students_clean_roll ON students(LOWER(REPLACE(roll_no, ' ', '')));`,
  `CREATE INDEX IF NOT EXISTS idx_students_clean_student_id ON students(LOWER(REPLACE(student_id, ' ', '')));`,

  // 3. Exam student assignments
  `CREATE INDEX IF NOT EXISTS idx_exam_students_student_id ON exam_students(student_id);`,

  // 4. Exam status and scheduling
  `CREATE INDEX IF NOT EXISTS idx_exams_status_datetime ON exams(status, date_time);`,
  `CREATE INDEX IF NOT EXISTS idx_exams_college_status ON exams(college_id, status);`,

  // 5. Active session and result lookups
  `CREATE INDEX IF NOT EXISTS idx_exam_sessions_student_exam ON exam_sessions(student_id, exam_id);`,
  `CREATE INDEX IF NOT EXISTS idx_results_exam_student ON results(exam_id, student_id);`,
];

async function applyIndexes() {
  const client = await pool.connect();
  try {
    console.log('Applying high-concurrency database index optimizations...');
    for (const sql of indexQueries) {
      const start = Date.now();
      await client.query(sql);
      console.log(`  ✓ Created index in ${Date.now() - start}ms: ${sql.split('ON')[1]?.trim() || sql}`);
    }
    console.log('✅ All indexes applied successfully!');
  } catch (err) {
    console.error('Error applying indexes:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

applyIndexes();
