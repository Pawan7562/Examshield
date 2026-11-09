const { Client } = require('../backend/node_modules/ssh2');

const conn = new Client();
conn.on('ready', () => {
  const sql = `
BEGIN;
DELETE FROM answers WHERE exam_id = '20f0f6da-a254-4c4b-98c6-7231b919506a';
DELETE FROM violations WHERE exam_id = '20f0f6da-a254-4c4b-98c6-7231b919506a';
DELETE FROM results WHERE exam_id = '20f0f6da-a254-4c4b-98c6-7231b919506a';
DELETE FROM exam_sessions WHERE exam_id = '20f0f6da-a254-4c4b-98c6-7231b919506a';
DELETE FROM exam_students WHERE exam_id = '20f0f6da-a254-4c4b-98c6-7231b919506a';
DELETE FROM exam_assignments WHERE exam_id = '20f0f6da-a254-4c4b-98c6-7231b919506a';
DELETE FROM student_question_sets WHERE exam_id = '20f0f6da-a254-4c4b-98c6-7231b919506a';
DELETE FROM questions WHERE exam_id = '20f0f6da-a254-4c4b-98c6-7231b919506a';
DELETE FROM exams WHERE id = '20f0f6da-a254-4c4b-98c6-7231b919506a';
COMMIT;
`;
  conn.exec(`docker exec -i examshield_postgres psql -U examshield_admin -d examshield_prod -c "${sql}"`, (err, stream) => {
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

