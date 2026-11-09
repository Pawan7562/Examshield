const { Client } = require('../backend/node_modules/ssh2');

const conn = new Client();
conn.on('ready', () => {
  const script = `
    docker exec examshield_postgres psql -U examshield_admin -d examshield_prod << 'EOF'
      BEGIN;

      -- 1. Identify demo student IDs
      CREATE TEMP TABLE demo_student_ids AS
      SELECT id FROM students
      WHERE email LIKE '%@virtualexam.test'
         OR email LIKE '%@load.test'
         OR email LIKE '%@examshield.test'
         OR email LIKE '%@example.com'
         OR email ILIKE '%demo%'
         OR name ILIKE 'Virtual Student%'
         OR name ILIKE 'Load Test%'
         OR name ILIKE 'Test Student%';

      SELECT count(*) AS total_demo_students_to_remove FROM demo_student_ids;

      -- 2. Identify demo / benchmark exams
      CREATE TEMP TABLE demo_exam_ids AS
      SELECT id FROM exams
      WHERE title ILIKE '%benchmark%'
         OR title ILIKE '%load test%'
         OR title ILIKE '%simulation%'
         OR title ILIKE '%verification exam%'
         OR title ILIKE '%journey audit%'
         OR id = 'c0012026-2000-4000-8000-000000002026';

      SELECT count(*) AS total_demo_exams_to_remove FROM demo_exam_ids;

      -- 3. Delete dependent rows for demo exams
      DELETE FROM answers WHERE exam_id IN (SELECT id FROM demo_exam_ids) OR student_id IN (SELECT id FROM demo_student_ids);
      DELETE FROM violations WHERE exam_id IN (SELECT id FROM demo_exam_ids) OR student_id IN (SELECT id FROM demo_student_ids);
      DELETE FROM results WHERE exam_id IN (SELECT id FROM demo_exam_ids) OR student_id IN (SELECT id FROM demo_student_ids);
      DELETE FROM exam_sessions WHERE exam_id IN (SELECT id FROM demo_exam_ids) OR student_id IN (SELECT id FROM demo_student_ids);
      DELETE FROM exam_students WHERE exam_id IN (SELECT id FROM demo_exam_ids) OR student_id IN (SELECT id FROM demo_student_ids);
      DELETE FROM student_question_sets WHERE exam_id IN (SELECT id FROM demo_exam_ids) OR student_id IN (SELECT id FROM demo_student_ids);
      DELETE FROM student_password_requests WHERE student_id IN (SELECT id FROM demo_student_ids);
      DELETE FROM questions WHERE exam_id IN (SELECT id FROM demo_exam_ids);
      DELETE FROM exams WHERE id IN (SELECT id FROM demo_exam_ids);

      -- 4. Delete demo students
      DELETE FROM students WHERE id IN (SELECT id FROM demo_student_ids);

      -- 5. Delete demo college 'Oxford Tech Institute' if it has no remaining students
      DELETE FROM colleges WHERE email = 'admin@oxfordtech.edu' AND id NOT IN (SELECT DISTINCT college_id FROM students WHERE college_id IS NOT NULL);

      COMMIT;

      -- Verification
      SELECT count(*) AS remaining_real_students FROM students;
      SELECT split_part(email, '@', 2) AS domain, count(*) FROM students GROUP BY domain ORDER BY count DESC LIMIT 10;
EOF
  `;

  conn.exec(script, (err, stream) => {
    if (err) throw err;
    stream.pipe(process.stdout);
    stream.stderr.pipe(process.stderr);
    stream.on('close', () => conn.end());
  });
}).connect({
  host: '147.93.19.252',
  port: 22,
  username: 'root',
  password: 'a?2n,rVia15/Qqih'
});
