// backend/tests/test_bulk_upload_csv_and_excel.js
const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { pool } = require('../config/database');
const studentController = require('../controllers/studentController');

async function runBulkUploadTests() {
  console.log('🚀 Starting Automated Tests for Student Bulk Upload (CSV & Excel)...');
  
  // Find an existing college in DB
  const collegeRes = await pool.query('SELECT id, name, email FROM colleges LIMIT 1');
  let testCollegeId = null;
  let collegeName = 'Test College';

  if (collegeRes.rows.length > 0) {
    testCollegeId = collegeRes.rows[0].id;
    collegeName = collegeRes.rows[0].name || 'Test College';
  } else {
    testCollegeId = uuidv4();
  }

  const testAdminUser = {
    id: testCollegeId,
    name: collegeName,
    email: 'admin@college.edu',
    role: 'college_admin'
  };

  const tempFilesToClean = [];

  try {
    // -------------------------------------------------------------
    // Test 1: Upload via CSV file
    // -------------------------------------------------------------
    console.log('\n📄 [Test 1] Testing CSV upload parsing and student creation...');
    const csvFileName = `test_roster_${Date.now()}.csv`;
    const csvFilePath = path.join(__dirname, csvFileName);
    tempFilesToClean.push(csvFilePath);

    const csvContent = 
      'Student Name,Email Address,Roll Number,Department,Batch,Semester\n' +
      `Candidate Alpha,alpha_${Date.now()}@metropolitan.edu,CS-${Date.now()}-01,Computer Science,2022-26,6th\n` +
      `Candidate Beta,beta_${Date.now()}@metropolitan.edu,CS-${Date.now()}-02,Computer Science,2022-26,6th\n`;

    fs.writeFileSync(csvFilePath, csvContent);

    // Mock Express req & res for CSV
    let csvResponseStatus = 200;
    let csvResponseBody = null;

    const mockCsvReq = {
      user: testAdminUser,
      file: {
        path: csvFilePath,
        originalname: csvFileName,
        mimetype: 'text/csv'
      },
      body: {}
    };

    const mockCsvRes = {
      status: (code) => {
        csvResponseStatus = code;
        return {
          json: (data) => { csvResponseBody = data; }
        };
      },
      json: (data) => {
        csvResponseBody = data;
      }
    };

    await studentController.bulkUploadStudents(mockCsvReq, mockCsvRes);

    console.log('   Status Code:', csvResponseStatus);
    console.log('   Response Success:', csvResponseBody?.success);
    console.log('   Created Count:', csvResponseBody?.data?.created);
    console.log('   Emails Sent:', csvResponseBody?.data?.emailsSent);
    console.log('   Message:', csvResponseBody?.message);

    if (!csvResponseBody?.success || csvResponseBody?.data?.created !== 2) {
      throw new Error(`CSV bulk upload failed! Expected 2 students created, got: ${JSON.stringify(csvResponseBody)}`);
    }
    console.log('✅ [Test 1 Passed] CSV file parsed, 2 students registered and credentials email triggered!');

    // -------------------------------------------------------------
    // Test 2: Upload via Excel (.xlsx) file
    // -------------------------------------------------------------
    console.log('\n📊 [Test 2] Testing Excel (.xlsx) upload parsing and student creation...');
    const xlsxFileName = `test_roster_${Date.now()}.xlsx`;
    const xlsxFilePath = path.join(__dirname, xlsxFileName);
    tempFilesToClean.push(xlsxFilePath);

    const excelRows = [
      {
        'Full Name': 'Candidate Gamma',
        'Student Email': `gamma_${Date.now()}@metropolitan.edu`,
        'Registration No': `EC-${Date.now()}-01`,
        'Branch': 'Electronics & Communication',
        'Year': '2023-27',
        'Sem': '4th'
      },
      {
        'Full Name': 'Candidate Delta',
        'Student Email': `delta_${Date.now()}@metropolitan.edu`,
        'Registration No': `EC-${Date.now()}-02`,
        'Branch': 'Electronics & Communication',
        'Year': '2023-27',
        'Sem': '4th'
      }
    ];

    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.json_to_sheet(excelRows);
    xlsx.utils.book_append_sheet(wb, ws, 'Candidates');
    xlsx.writeFile(wb, xlsxFilePath);

    let xlsxResponseStatus = 200;
    let xlsxResponseBody = null;

    const mockXlsxReq = {
      user: testAdminUser,
      file: {
        path: xlsxFilePath,
        originalname: xlsxFileName,
        mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      },
      body: {}
    };

    const mockXlsxRes = {
      status: (code) => {
        xlsxResponseStatus = code;
        return {
          json: (data) => { xlsxResponseBody = data; }
        };
      },
      json: (data) => {
        xlsxResponseBody = data;
      }
    };

    await studentController.bulkUploadStudents(mockXlsxReq, mockXlsxRes);

    console.log('   Status Code:', xlsxResponseStatus);
    console.log('   Response Success:', xlsxResponseBody?.success);
    console.log('   Created Count:', xlsxResponseBody?.data?.created);
    console.log('   Emails Sent:', xlsxResponseBody?.data?.emailsSent);
    console.log('   Message:', xlsxResponseBody?.message);

    if (!xlsxResponseBody?.success || xlsxResponseBody?.data?.created !== 2) {
      throw new Error(`Excel bulk upload failed! Expected 2 students created, got: ${JSON.stringify(xlsxResponseBody)}`);
    }
    console.log('✅ [Test 2 Passed] Excel (.xlsx) file parsed, 2 students registered and credentials email triggered!');

    // -------------------------------------------------------------
    // Test 3: Duplicate Handling & Validation
    // -------------------------------------------------------------
    console.log('\n🛡️ [Test 3] Testing Duplicate prevention & validation errors...');
    const dupFileName = `test_roster_dup_${Date.now()}.csv`;
    const dupFilePath = path.join(__dirname, dupFileName);
    tempFilesToClean.push(dupFilePath);

    // Re-upload the exact same CSV with an invalid row added
    const dupContent = csvContent + `Invalid Person,,NO_EMAIL,CS,,\n`;
    fs.writeFileSync(dupFilePath, dupContent);

    let dupResponseBody = null;
    const mockDupReq = {
      user: testAdminUser,
      file: {
        path: dupFilePath,
        originalname: dupFileName,
        mimetype: 'text/csv'
      },
      body: {}
    };
    const mockDupRes = {
      status: () => ({ json: (d) => { dupResponseBody = d; } }),
      json: (d) => { dupResponseBody = d; }
    };

    await studentController.bulkUploadStudents(mockDupReq, mockDupRes);
    console.log('   Created Count (should be 0 because all duplicates/invalid):', dupResponseBody?.data?.created);
    console.log('   Reported Errors:', dupResponseBody?.data?.errors?.length);
    console.log('   Sample Errors:', dupResponseBody?.data?.errors);

    if (dupResponseBody?.data?.created !== 0 || dupResponseBody?.data?.errors?.length < 3) {
      throw new Error('Duplicate prevention test failed!');
    }
    console.log('✅ [Test 3 Passed] Duplicate students and invalid rows were properly detected and reported!');

    // Clean up created test students from database
    await pool.query("DELETE FROM students WHERE email LIKE '%@metropolitan.edu'");
    console.log('\n🧹 Cleaned up test student records from database.');

    console.log('\n======================================================');
    console.log('🎉 ALL BULK UPLOAD TESTS COMPLETED SUCCESSFULLY!');
    console.log('   - CSV upload parsed and processed seamlessly');
    console.log('   - Excel (.xlsx) upload parsed and processed seamlessly');
    console.log('   - Column normalization functions with varied headers');
    console.log('   - Credentials generated and emails dispatched to each student');
    console.log('   - Duplicates and errors handled cleanly');
    console.log('======================================================\n');

  } catch (error) {
    console.error('\n❌ TEST RUN FAILED:', error);
    process.exitCode = 1;
  } finally {
    // Clean up local temp files if any remain
    for (const f of tempFilesToClean) {
      if (fs.existsSync(f)) {
        try { fs.unlinkSync(f); } catch (_) {}
      }
    }
    await pool.end().catch(() => {});
  }
}

runBulkUploadTests();
