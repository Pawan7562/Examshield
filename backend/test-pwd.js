const bcrypt = require('bcryptjs');

const hash = '$2a$12$vFfpFJm4eK6Y5c1Cl2SApOdl0yRkjHqbyv4OKVt.IHKRkBeriiK8O';

const candidates = [
  'Admin@123',
  'admin123',
  'SuperAdmin@123',
  'superadmin123',
  'SuperAdmin@1234',
  'Admin@1234',
  'Password@123',
  'password123',
  'password',
  'admin',
  'ExamShield@123',
  'Examshield@123',
  'examshield123',
  'Super@123',
  'root',
  '12345678',
  '123456',
  'Admin#123',
  'Admin123!',
  'CollegeExam@123',
  'collegeexam123'
];

async function check() {
  for (const p of candidates) {
    if (await bcrypt.compare(p, hash)) {
      console.log('MATCH FOUND:', p);
      return;
    }
  }
  console.log('No match found among common candidates');
}

check();
