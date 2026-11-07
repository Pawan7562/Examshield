const { Client } = require('../backend/node_modules/ssh2');
const bcrypt = require('../backend/node_modules/bcryptjs');

const EXAM_ID = 'c0012026-2000-4000-8000-000000002026';
const COLLEGE_ID = 'e8464577-8d59-41ee-ab13-3d9b69b06d07'; // CGC
const TOTAL_STUDENTS = 2050;
const TEST_PASSWORD = 'VirtualStudent2026!';

async function setupBenchmark() {
  console.log('Generating password hash for VirtualStudent2026!...');
  const passwordHash = await bcrypt.hash(TEST_PASSWORD, 10);
  console.log('Password hash generated:', passwordHash);

  const remoteScript = `
const { pool } = require('./config/database');

async function run() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Clean previous run for benchmark exam if any
    await client.query('DELETE FROM violations WHERE exam_id = $1', ['${EXAM_ID}']);
    await client.query('DELETE FROM results WHERE exam_id = $1', ['${EXAM_ID}']);
    await client.query('DELETE FROM answers WHERE exam_id = $1', ['${EXAM_ID}']);
    await client.query('DELETE FROM exam_sessions WHERE exam_id = $1', ['${EXAM_ID}']);
    await client.query('DELETE FROM exam_students WHERE exam_id = $1', ['${EXAM_ID}']);
    await client.query('DELETE FROM questions WHERE exam_id = $1', ['${EXAM_ID}']);
    await client.query('DELETE FROM exams WHERE id = $1', ['${EXAM_ID}']);
    await client.query("DELETE FROM students WHERE email LIKE '%@virtualexam.test'");

    // 2. Insert Benchmark Exam
    const examNow = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    await client.query(\`
      INSERT INTO exams (
        id, college_id, title, name, description, exam_code, exam_key,
        type, subject, status, duration, total_marks, passing_marks,
        is_proctored, max_violations, date_time, instructions,
        created_at, updated_at
      ) VALUES (
        $1, $2, $3, $3, $4, $5, $5,
        'mixed', 'Computer Science & Engineering', 'published', 180, 50, 20,
        true, 5, $6, $7,
        NOW(), NOW()
      )
    \`, [
      '${EXAM_ID}',
      '${COLLEGE_ID}',
      'National Engineering & Assessment Benchmark 2026 (2,050 Candidates)',
      'National high-concurrency 2,050 concurrent student certification and algorithm examination.',
      'BENCH2026',
      examNow,
      'Welcome to the 2026 National Engineering Assessment. Ensure camera and microphone remain active throughout. Fullscreen is strictly monitored.'
    ]);
    console.log('✅ Exam created: ${EXAM_ID}');

    // 3. Insert 12 Realistic Questions (10 MCQs + 2 Coding)
    const questions = [
      {
        q_id: 'a0010001-0000-4000-8000-000000000001',
        text: 'What is the time complexity of Binary Search on a sorted array of size N?',
        type: 'mcq',
        marks: 2,
        order: 1,
        options: JSON.stringify(['O(1)', 'O(log N)', 'O(N)', 'O(N log N)']),
        correct: 'O(log N)'
      },
      {
        q_id: 'a0010001-0000-4000-8000-000000000002',
        text: 'In PostgreSQL, which transaction isolation level completely prevents phantom reads?',
        type: 'mcq',
        marks: 2,
        order: 2,
        options: JSON.stringify(['Read Uncommitted', 'Read Committed', 'Repeatable Read', 'Serializable']),
        correct: 'Serializable'
      },
      {
        q_id: 'a0010001-0000-4000-8000-000000000003',
        text: 'What is the standard default networking port for PostgreSQL database servers?',
        type: 'mcq',
        marks: 2,
        order: 3,
        options: JSON.stringify(['3306', '5432', '6379', '8080']),
        correct: '5432'
      },
      {
        q_id: 'a0010001-0000-4000-8000-000000000004',
        text: 'Which abstract data structure operates on a Last-In, First-Out (LIFO) principle?',
        type: 'mcq',
        marks: 2,
        order: 4,
        options: JSON.stringify(['Queue', 'Stack', 'Linked List', 'Binary Tree']),
        correct: 'Stack'
      },
      {
        q_id: 'a0010001-0000-4000-8000-000000000005',
        text: 'In HTTP/1.1 networking, which header establishes and maintains persistent TCP connections?',
        type: 'mcq',
        marks: 2,
        order: 5,
        options: JSON.stringify(['Connection: keep-alive', 'Host', 'Cache-Control', 'Accept']),
        correct: 'Connection: keep-alive'
      },
      {
        q_id: 'a0010001-0000-4000-8000-000000000006',
        text: 'Which sorting algorithm guarantees worst-case O(N log N) time complexity?',
        type: 'mcq',
        marks: 2,
        order: 6,
        options: JSON.stringify(['Quick Sort', 'Bubble Sort', 'Merge Sort', 'Selection Sort']),
        correct: 'Merge Sort'
      },
      {
        q_id: 'a0010001-0000-4000-8000-000000000007',
        text: 'What does the acronym ACID represent in transactional relational databases?',
        type: 'mcq',
        marks: 2,
        order: 7,
        options: JSON.stringify([
          'Atomicity, Consistency, Isolation, Durability',
          'Access, Control, Index, Data',
          'Async, Concurrent, Immutable, Distributed',
          'Auto, Commit, Instance, Deploy'
        ]),
        correct: 'Atomicity, Consistency, Isolation, Durability'
      },
      {
        q_id: 'a0010001-0000-4000-8000-000000000008',
        text: 'In Node.js runtime architecture, what manages the asynchronous non-blocking event loop?',
        type: 'mcq',
        marks: 2,
        order: 8,
        options: JSON.stringify(['Single main event loop thread', 'Multiple parallel event loop threads', 'Database background worker', 'Redis proxy thread']),
        correct: 'Single main event loop thread'
      },
      {
        q_id: 'a0010001-0000-4000-8000-000000000009',
        text: 'What is the time complexity to retrieve an element by index in a contiguous memory array?',
        type: 'mcq',
        marks: 2,
        order: 9,
        options: JSON.stringify(['O(1)', 'O(N)', 'O(log N)', 'O(N^2)']),
        correct: 'O(1)'
      },
      {
        q_id: 'a0010001-0000-4000-8000-000000000010',
        text: 'Which HTTP status code signifies client rate limit exceeded (Too Many Requests)?',
        type: 'mcq',
        marks: 2,
        order: 10,
        options: JSON.stringify(['400', '401', '404', '429']),
        correct: '429'
      },
      {
        q_id: 'a0010001-0000-4000-8000-000000000011',
        text: 'Algorithmic Coding 1 (Python): Compute sum of space-separated integers provided on standard input.',
        type: 'coding',
        marks: 15,
        order: 11,
        options: null,
        correct: null,
        language: 'python',
        code_template: 'import sys\\n\\ndef solve():\\n    lines = sys.stdin.read().split()\\n    if not lines: return\\n    nums = [int(x) for x in lines]\\n    print(sum(nums))\\n\\nif __name__ == \"__main__\":\\n    solve()',
        test_cases: JSON.stringify([
          { input: '1 2 3 4 5', expected_output: '15', is_hidden: false },
          { input: '10 20 30', expected_output: '60', is_hidden: false },
          { input: '100 -50 25', expected_output: '75', is_hidden: true }
        ])
      },
      {
        q_id: 'a0010001-0000-4000-8000-000000000012',
        text: 'Algorithmic Coding 2 (C++): Given a string or integer on stdin, output YES if it is a palindrome, otherwise NO.',
        type: 'coding',
        marks: 15,
        order: 12,
        options: null,
        correct: null,
        language: 'cpp',
        code_template: '#include <iostream>\\n#include <string>\\nusing namespace std;\\n\\nint main() {\\n    string s;\\n    if (cin >> s) {\\n        string rev = string(s.rbegin(), s.rend());\\n        cout << (s == rev ? \"YES\" : \"NO\") << endl;\\n    }\\n    return 0;\\n}',
        test_cases: JSON.stringify([
          { input: '121', expected_output: 'YES', is_hidden: false },
          { input: '123', expected_output: 'NO', is_hidden: false },
          { input: 'racecar', expected_output: 'YES', is_hidden: true }
        ])
      }
    ];

    for (const q of questions) {
      await client.query(\`
        INSERT INTO questions (
          id, exam_id, question_text, type, marks, order_index,
          options, correct_answer, language, code_template, test_cases,
          created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
      \`, [
        q.q_id,
        '${EXAM_ID}',
        q.text,
        q.type,
        q.marks,
        q.order,
        q.options,
        q.correct,
        q.language || null,
        q.code_template || null,
        q.test_cases || null
      ]);
    }
    console.log('✅ Inserted 12 comprehensive questions.');

    // 4. Batch Seed / Upsert exactly 2,050 Virtual Students
    console.log('Seeding ${TOTAL_STUDENTS} virtual students in batches...');
    const BATCH_SIZE = 500;
    for (let b = 0; b < ${TOTAL_STUDENTS}; b += BATCH_SIZE) {
      const currentBatchEnd = Math.min(b + BATCH_SIZE, ${TOTAL_STUDENTS});
      const rows = [];
      const values = [];
      let paramIdx = 1;

      for (let i = b + 1; i <= currentBatchEnd; i++) {
        const pad = String(i).padStart(4, '0');
        const stuEmail = 'vstudent_' + pad + '@virtualexam.test';
        const stuId = 'VS-2026-' + pad;
        const stuRoll = 'ROLL-VS-' + pad;
        const stuName = 'Virtual Candidate ' + pad;

        rows.push(\`(\$\${paramIdx++}, \$\${paramIdx++}, \$\${paramIdx++}, \$\${paramIdx++}, \$\${paramIdx++}, \$\${paramIdx++}, \$\${paramIdx++}, true, NOW(), NOW())\`);
        values.push(
          'b0012026-0000-4000-8000-' + String(i).padStart(12, '0'),
          '${COLLEGE_ID}',
          stuName,
          stuEmail,
          stuId,
          stuRoll,
          '${passwordHash}'
        );
      }

      await client.query(\`
        INSERT INTO students (id, college_id, name, email, student_id, roll_no, password, is_active, created_at, updated_at)
        VALUES \${rows.join(', ')}
        ON CONFLICT (student_id) DO UPDATE SET password = EXCLUDED.password, is_active = true
      \`, values);
    }
    console.log('✅ All ${TOTAL_STUDENTS} virtual students seeded/verified in database.');

    // 5. Assign all 2,050 students to exam in exam_students
    await client.query(\`
      INSERT INTO exam_students (exam_id, student_id)
      SELECT '${EXAM_ID}', id FROM students WHERE email LIKE '%@virtualexam.test'
      ON CONFLICT DO NOTHING
    \`);
    console.log('✅ Assigned all 2,050 virtual students to exam.');

    await client.query('COMMIT');
    console.log('🎉 BENCHMARK EXAM & 2,050 STUDENTS FULLY CONFIGURED!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Database error:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
`;

  const conn = new Client();
  conn.on('ready', () => {
    conn.sftp((err, sftp) => {
      if (err) throw err;
      const remotePath = '/tmp/setup_benchmark.js';
      const writeStream = sftp.createWriteStream(remotePath);
      writeStream.on('close', () => {
        console.log('✅ Remote script uploaded to /tmp/setup_benchmark.js');
        const execCmd = 'docker cp /tmp/setup_benchmark.js examshield-backend-1:/app/setup_benchmark.js && docker exec -w /app examshield-backend-1 node setup_benchmark.js && docker exec examshield-backend-1 rm -f /app/setup_benchmark.js';
        conn.exec(execCmd, (execErr, stream) => {
          if (execErr) throw execErr;
          stream.pipe(process.stdout);
          stream.stderr.pipe(process.stderr);
          stream.on('close', (code) => {
            console.log(`Execution finished with code: ${code}`);
            conn.end();
          });
        });
      });
      writeStream.end(remoteScript);
    });
  }).connect({ host: '147.93.19.252', port: 22, username: 'root', password: 'a?2n,rVia15/Qqih' });
}

setupBenchmark().catch(console.error);
