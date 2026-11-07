const { Client } = require('../backend/node_modules/ssh2');

const EXAM_ID = 'c0012026-2000-4000-8000-000000002026';

const conn = new Client();
conn.on('ready', () => {
  const query = `
    docker exec examshield_postgres psql -U examshield_admin -d examshield_prod -c "
      SELECT 
        (SELECT count(*) FROM exam_students WHERE exam_id = '${EXAM_ID}') AS total_enrolled,
        (SELECT count(*) FROM exam_sessions WHERE exam_id = '${EXAM_ID}') AS total_sessions,
        (SELECT count(*) FROM exam_sessions WHERE exam_id = '${EXAM_ID}' AND status = 'submitted') AS submitted_sessions,
        (SELECT count(*) FROM results WHERE exam_id = '${EXAM_ID}') AS total_results,
        (SELECT count(*) FROM answers WHERE exam_id = '${EXAM_ID}') AS total_answers,
        (SELECT count(*) FROM violations WHERE exam_id = '${EXAM_ID}') AS total_violations;

      SELECT 
        count(*) AS total_graded_students,
        AVG(marks_obtained)::numeric(10,2) AS average_score,
        MIN(marks_obtained)::numeric(10,2) AS minimum_score,
        MAX(marks_obtained)::numeric(10,2) AS maximum_score,
        AVG(percentage)::numeric(10,2) AS average_percentage,
        count(*) FILTER (WHERE marks_obtained >= 20) AS passed_count,
        count(*) FILTER (WHERE marks_obtained < 20) AS failed_count
      FROM results 
      WHERE exam_id = '${EXAM_ID}';

      SELECT 
        s.student_id, 
        s.name, 
        r.marks_obtained, 
        r.total_marks, 
        r.percentage, 
        r.status, 
        r.submitted_at
      FROM results r
      JOIN students s ON s.id = r.student_id
      WHERE r.exam_id = '${EXAM_ID}'
      ORDER BY r.submitted_at DESC
      LIMIT 10;
    "
  `;
  conn.exec(query, (err, stream) => {
    if (err) throw err;
    stream.pipe(process.stdout);
    stream.stderr.pipe(process.stderr);
    stream.on('close', (code) => {
      console.log(`Final audit query finished with code: ${code}`);
      conn.end();
    });
  });
}).connect({ host: '147.93.19.252', port: 22, username: 'root', password: 'a?2n,rVia15/Qqih' });
