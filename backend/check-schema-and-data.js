// Test what actually happens when the upsert fires for ALL answers
// This simulates what the postgres-client's upsert does
const { Pool } = require('pg');
require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const pool = new Pool({ connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_k1oy6KOnUBxW@ep-withered-fog-aoapan2z.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require' });

async function main() {
  // The exam has 10 questions. Simulate a bulk upsert for all 10
  // Using the same logic as postgres-client.js executeMutation
  const examId = '91e61328-4be0-4db8-b8d9-c561b55385d8';
  const sessionId = 'test-diagnose-' + Date.now();
  // We need a real student_id
  const r0 = await pool.query('SELECT id FROM students LIMIT 1');
  const studentId = r0.rows[0]?.id;
  console.log('studentId:', studentId);

  // Get question IDs
  const r1 = await pool.query('SELECT id FROM questions WHERE exam_id = $1 ORDER BY order_index LIMIT 10', [examId]);
  const questionIds = r1.rows.map(q => q.id);
  console.log('questionIds count:', questionIds.length);

  // Simulate creating a session
  const r_session = await pool.query(
    `INSERT INTO exam_sessions (exam_id, student_id, ip_address, browser_info, status)
     VALUES ($1, $2, '127.0.0.1', 'TestAgent', 'active')
     RETURNING id`,
    [examId, studentId]
  );
  const newSessionId = r_session.rows[0].id;
  console.log('Created test session:', newSessionId);

  // Simulate the BULK upsert - same way postgres-client does it
  // The payload: rows for all 10 questions
  const now = new Date().toISOString();
  const answers = questionIds.map((qId, i) => ({
    session_id: newSessionId,
    question_id: qId,
    student_id: studentId,
    exam_id: examId,
    answer_text: null,
    selected_option: ['Option A', 'Option B', 'Option C', 'Option D'][ i % 4],
    code_submission: null,
    selected_language: null,
    updated_at: now
    // Note: NO created_at, NO id - relying on defaults
  }));

  const conflictColumns = ['session_id', 'question_id'];
  const columns = [...new Set(answers.flatMap(row => Object.keys(row)))];
  console.log('Columns to upsert:', columns);

  const params = [];
  const values = answers.map(row => `(${columns.map(col => {
    params.push(row[col] === undefined ? null : row[col]);
    return `$${params.length}`;
  }).join(', ')})`);

  const updatedColumns = columns.filter(col => !conflictColumns.includes(col));
  const conflictAction = updatedColumns.length
    ? `DO UPDATE SET ${updatedColumns.map(col => `"${col}" = EXCLUDED."${col}"`).join(', ')}`
    : 'DO NOTHING';

  const sql = `INSERT INTO answers (${columns.map(c => `"${c}"`).join(', ')}) VALUES ${values.join(', ')} ON CONFLICT ("session_id", "question_id") ${conflictAction}`;
  console.log('SQL:', sql.substring(0, 200));
  console.log('Params count:', params.length);

  try {
    const result = await pool.query(sql, params);
    console.log('SUCCESS! Rows affected:', result.rowCount);
  } catch(e) {
    console.error('UPSERT ERROR:', e.message);
  }

  // Verify
  const r_check = await pool.query('SELECT COUNT(*) as cnt FROM answers WHERE session_id = $1', [newSessionId]);
  console.log('Answers saved for test session:', r_check.rows[0].cnt);

  // Clean up test data
  await pool.query('DELETE FROM exam_sessions WHERE id = $1', [newSessionId]);
  console.log('Cleaned up test session');

  await pool.end();
}
main().catch(e => { console.error('Error:', e.message, '\n', e.stack); pool.end(); });
