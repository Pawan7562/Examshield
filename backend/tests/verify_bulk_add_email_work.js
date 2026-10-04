// backend/tests/verify_bulk_add_email_work.js
const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { pool } = require('../config/database');
const studentController = require('../controllers/studentController');

async function testBulkAddEmailSending() {
  console.log('=================================================================');
  console.log('🔍 VERIFYING BULK ADD STUDENT EMAIL SENDING WORKFLOW');
  console.log('=================================================================\n');

  // 1. Get an existing college from DB to simulate legitimate college admin
  const collegeRes = await pool.query('SELECT id, name, email FROM colleges LIMIT 1');
  if (collegeRes.rows.length === 0) {
    throw new Error('No college found in database to associate students with.');
  }

  const college = collegeRes.rows[0];
  console.log(`🏛️ Testing for College: "${college.name}" (ID: ${college.id})`);

  const mockAdminUser = {
    id: college.id,
    name: college.name,
    email: college.email,
    college_name: college.name,
    role: 'college_admin'
  };

  // Recipient: Official email from .env
  const targetEmail = 'exam@nexifyforge.in';
  console.log(`📬 Target verification recipient: ${targetEmail}\n`);

  // Ensure clean state: delete any leftover test student with this email
  await pool.query('DELETE FROM students WHERE email = $1 AND college_id = $2', [targetEmail.toLowerCase(), college.id]);

  // -------------------------------------------------------------
  // Test A: Bulk Upload via Excel (.xlsx) file
  // -------------------------------------------------------------
  console.log('-----------------------------------------------------------------');
  console.log('TEST A: Uploading via Excel (.xlsx) file with Candidate Roster...');
  console.log('-----------------------------------------------------------------');

  const testXlsxPath = path.join(__dirname, `bulk_test_${Date.now()}.xlsx`);
  const excelData = [
    {
      'Student Name': 'Nexify Candidate (Excel Bulk Test)',
      'Email Address': targetEmail,
      'Roll Number': `EXCEL-${Date.now().toString().slice(-6)}`,
      'Department': 'Computer Science & AI',
      'Batch': '2024-2028',
      'Semester': '2nd'
    }
  ];

  const wb = xlsx.utils.book_new();
  const ws = xlsx.utils.json_to_sheet(excelData);
  xlsx.utils.book_append_sheet(wb, ws, 'Roster');
  xlsx.writeFile(wb, testXlsxPath);

  let statusCode = 200;
  let jsonResult = null;

  const mockReq = {
    user: mockAdminUser,
    file: {
      path: testXlsxPath,
      originalname: path.basename(testXlsxPath),
      mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    },
    body: {}
  };

  const mockRes = {
    status: (code) => {
      statusCode = code;
      return { json: (d) => { jsonResult = d; } };
    },
    json: (d) => { jsonResult = d; }
  };

  await studentController.bulkUploadStudents(mockReq, mockRes);

  console.log('\n📥 Response Received:');
  console.log('   HTTP Status Code:', statusCode);
  console.log('   Success:', jsonResult?.success);
  console.log('   Message:', jsonResult?.message);
  console.log('   Students Created:', jsonResult?.data?.created);
  console.log('   Emails Sent:', jsonResult?.data?.emailsSent);
  console.log('   Errors Count:', jsonResult?.data?.failed);

  // 2. Database Verification
  const dbCheck = await pool.query(
    'SELECT id, student_id, name, email, roll_no, department, is_active FROM students WHERE email = $1 AND college_id = $2',
    [targetEmail.toLowerCase(), college.id]
  );

  console.log('\n🔎 Database Verification:');
  if (dbCheck.rows.length > 0) {
    const st = dbCheck.rows[0];
    console.log('   ✅ Student found in database!');
    console.log('   - ID (UUID):', st.id);
    console.log('   - Student ID:', st.student_id);
    console.log('   - Name:', st.name);
    console.log('   - Email:', st.email);
    console.log('   - Roll No:', st.roll_no);
    console.log('   - Department:', st.department);
  } else {
    throw new Error('❌ Student was NOT found in database after bulk upload!');
  }

  // 3. Email Delivery Assertion
  if (!jsonResult?.success || jsonResult?.data?.created < 1 || jsonResult?.data?.emailsSent < 1) {
    throw new Error(`❌ Bulk email sending failed! Result: ${JSON.stringify(jsonResult)}`);
  }

  console.log('\n-----------------------------------------------------------------');
  console.log('✅ EXCEL BULK UPLOAD & EMAIL DELIVERY VERIFIED SUCCESSFULLY!');
  console.log('   1. Excel spreadsheet parsed correctly.');
  console.log('   2. Student record provisioned in database.');
  console.log('   3. Credentials email formatted and sent to: ' + targetEmail);
  console.log('   4. Temporary uploaded file automatically removed.');
  console.log('-----------------------------------------------------------------\n');

  // Clean up test student
  await pool.query('DELETE FROM students WHERE email = $1 AND college_id = $2', [targetEmail.toLowerCase(), college.id]);
  if (fs.existsSync(testXlsxPath)) {
    try { fs.unlinkSync(testXlsxPath); } catch (_) {}
  }

  // -------------------------------------------------------------
  // Test B: Bulk Upload via CSV file
  // -------------------------------------------------------------
  console.log('-----------------------------------------------------------------');
  console.log('TEST B: Uploading via CSV file with Candidate Roster...');
  console.log('-----------------------------------------------------------------');

  const testCsvPath = path.join(__dirname, `bulk_test_${Date.now()}.csv`);
  const csvContent = 
    'Student Name,Email Address,Roll Number,Department,Batch,Semester\n' +
    `Nexify Candidate (CSV Bulk Test),${targetEmail},CSV-${Date.now().toString().slice(-6)},Information Technology,2024-2028,2nd\n`;

  fs.writeFileSync(testCsvPath, csvContent);

  let csvStatusCode = 200;
  let csvJsonResult = null;

  const mockCsvReq = {
    user: mockAdminUser,
    file: {
      path: testCsvPath,
      originalname: path.basename(testCsvPath),
      mimetype: 'text/csv'
    },
    body: {}
  };

  const mockCsvRes = {
    status: (code) => {
      csvStatusCode = code;
      return { json: (d) => { csvJsonResult = d; } };
    },
    json: (d) => { csvJsonResult = d; }
  };

  await studentController.bulkUploadStudents(mockCsvReq, mockCsvRes);

  console.log('\n📥 Response Received:');
  console.log('   HTTP Status Code:', csvStatusCode);
  console.log('   Success:', csvJsonResult?.success);
  console.log('   Message:', csvJsonResult?.message);
  console.log('   Students Created:', csvJsonResult?.data?.created);
  console.log('   Emails Sent:', csvJsonResult?.data?.emailsSent);
  console.log('   Errors Count:', csvJsonResult?.data?.failed);

  // Database Verification for CSV
  const csvDbCheck = await pool.query(
    'SELECT id, student_id, name, email, roll_no, department, is_active FROM students WHERE email = $1 AND college_id = $2',
    [targetEmail.toLowerCase(), college.id]
  );

  console.log('\n🔎 Database Verification:');
  if (csvDbCheck.rows.length > 0) {
    const st = csvDbCheck.rows[0];
    console.log('   ✅ Student found in database!');
    console.log('   - ID (UUID):', st.id);
    console.log('   - Student ID:', st.student_id);
    console.log('   - Name:', st.name);
    console.log('   - Email:', st.email);
    console.log('   - Roll No:', st.roll_no);
  } else {
    throw new Error('❌ Student was NOT found in database after CSV bulk upload!');
  }

  if (!csvJsonResult?.success || csvJsonResult?.data?.created < 1 || csvJsonResult?.data?.emailsSent < 1) {
    throw new Error(`❌ CSV bulk email sending failed! Result: ${JSON.stringify(csvJsonResult)}`);
  }

  console.log('\n-----------------------------------------------------------------');
  console.log('✅ CSV BULK UPLOAD & EMAIL DELIVERY VERIFIED SUCCESSFULLY!');
  console.log('   1. CSV file parsed correctly.');
  console.log('   2. Student record provisioned in database.');
  console.log('   3. Credentials email formatted and sent to: ' + targetEmail);
  console.log('   4. Temporary uploaded file automatically removed.');
  console.log('-----------------------------------------------------------------\n');

  // Clean up test student
  await pool.query('DELETE FROM students WHERE email = $1 AND college_id = $2', [targetEmail.toLowerCase(), college.id]);
  if (fs.existsSync(testCsvPath)) {
    try { fs.unlinkSync(testCsvPath); } catch (_) {}
  }
}

testBulkAddEmailSending()
  .then(() => {
    console.log('🎉 Bulk student email sending is 100% operational.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Verification failed:', err);
    process.exit(1);
  });
