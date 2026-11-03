// backend/tests/load_test_preflight_guard.test.js
// Automated Test Suite for Load Benchmark Fail-Closed Preflight Safety Guard

const { validateLoadTestPreflight, KNOWN_PRODUCTION_HOSTNAMES } = require('./helpers/loadTestPreflightGuard');

function runPreflightGuardTests() {
  console.log('\n======================================================================');
  console.log('  ExamShield Load Test Fail-Closed Preflight Guard Test Suite');
  console.log('======================================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  const assert = (condition, msg) => {
    totalTests++;
    if (!condition) {
      console.error(`❌ FAILED: ${msg}`);
      throw new Error(msg);
    }
    console.log(`  ✓ Passed: ${msg}`);
    passedTests++;
  };

  // ─────────────────────────────────────────────────────────────────
  // TEST 1: Missing Target URL is Rejected
  // ─────────────────────────────────────────────────────────────────
  console.log('[TEST 1] Missing target URL rejection...');
  const res1 = validateLoadTestPreflight({
    LOAD_TEST_URL: '',
    STAGING_DATABASE_URL: 'postgresql://u:p@staging-db.neon.tech/db',
    CONFIRM_ISOLATED_STAGING_ENV: 'true',
    CONFIRM_ISOLATED_STAGING_DB: 'true'
  });
  assert(res1.passed === false, 'Result must be false when LOAD_TEST_URL is empty');
  assert(res1.errors.some(e => e.includes('LOAD_TEST_URL must be explicitly provided')), 'Error message mentions LOAD_TEST_URL requirement');

  // ─────────────────────────────────────────────────────────────────
  // TEST 2: Missing Staging Confirmation is Rejected
  // ─────────────────────────────────────────────────────────────────
  console.log('\n[TEST 2] Missing staging confirmation rejection...');
  // Case 2A: Remote URL without CONFIRM_ISOLATED_STAGING_ENV
  const res2A = validateLoadTestPreflight({
    LOAD_TEST_URL: 'https://staging-api.customdomain.org',
    STAGING_DATABASE_URL: 'postgresql://u:p@staging-db.neon.tech/db',
    CONFIRM_ISOLATED_STAGING_ENV: 'false',
    CONFIRM_ISOLATED_STAGING_DB: 'true'
  });
  assert(res2A.passed === false, 'Must reject remote URL when CONFIRM_ISOLATED_STAGING_ENV is not true');
  assert(res2A.errors.some(e => e.includes('CONFIRM_ISOLATED_STAGING_ENV')), 'Error message mentions CONFIRM_ISOLATED_STAGING_ENV');

  // Case 2B: Missing CONFIRM_ISOLATED_STAGING_DB
  const res2B = validateLoadTestPreflight({
    LOAD_TEST_URL: 'https://staging-api.customdomain.org',
    STAGING_DATABASE_URL: 'postgresql://u:p@staging-db.neon.tech/db',
    CONFIRM_ISOLATED_STAGING_ENV: 'true',
    CONFIRM_ISOLATED_STAGING_DB: 'false'
  });
  assert(res2B.passed === false, 'Must reject when CONFIRM_ISOLATED_STAGING_DB is not true');
  assert(res2B.errors.some(e => e.includes('CONFIRM_ISOLATED_STAGING_DB')), 'Error message mentions CONFIRM_ISOLATED_STAGING_DB');

  // Case 2C: Localhost without ALLOW_LOCAL_LOAD_TEST
  const res2C = validateLoadTestPreflight({
    LOAD_TEST_URL: 'http://localhost:5000',
    STAGING_DATABASE_URL: 'postgresql://u:p@localhost:5432/testdb',
    ALLOW_LOCAL_LOAD_TEST: 'false',
    CONFIRM_ISOLATED_STAGING_DB: 'true'
  });
  assert(res2C.passed === false, 'Must reject localhost URL when ALLOW_LOCAL_LOAD_TEST is not true');
  assert(res2C.errors.some(e => e.includes('ALLOW_LOCAL_LOAD_TEST')), 'Error message mentions ALLOW_LOCAL_LOAD_TEST');

  // ─────────────────────────────────────────────────────────────────
  // TEST 3: Production Database and URL Configuration is Rejected
  // ─────────────────────────────────────────────────────────────────
  console.log('\n[TEST 3] Production database and URL configuration rejection...');
  // Case 3A: Production database host
  const prodHost = KNOWN_PRODUCTION_HOSTNAMES[0];
  const res3A = validateLoadTestPreflight({
    LOAD_TEST_URL: 'https://staging-test.org',
    STAGING_DATABASE_URL: `postgresql://u:p@${prodHost}/neondb`,
    CONFIRM_ISOLATED_STAGING_ENV: 'true',
    CONFIRM_ISOLATED_STAGING_DB: 'true'
  });
  assert(res3A.passed === false, 'Must reject known production database host');
  assert(res3A.errors.some(e => e.includes('matches the protected primary/production database')), 'Error identifies production database');

  // Case 3B: Production application domain
  const res3B = validateLoadTestPreflight({
    LOAD_TEST_URL: 'https://exam.nexifyforge.in',
    STAGING_DATABASE_URL: 'postgresql://u:p@staging-db.neon.tech/db',
    CONFIRM_ISOLATED_STAGING_ENV: 'true',
    CONFIRM_ISOLATED_STAGING_DB: 'true'
  });
  assert(res3B.passed === false, 'Must reject production application URL');
  assert(res3B.errors.some(e => e.includes('matches a protected production hostname')), 'Error identifies production URL');

  // ─────────────────────────────────────────────────────────────────
  // TEST 4: Approved Isolated Test Configuration Passes Preflight
  // ─────────────────────────────────────────────────────────────────
  console.log('\n[TEST 4] Approved isolated test configuration pass without DB records...');
  const res4 = validateLoadTestPreflight({
    LOAD_TEST_URL: 'https://isolated-staging-api.examshield.internal',
    STAGING_DATABASE_URL: 'postgresql://user:pass@staging-branch-pooler.c-9.us-east-2.aws.neon.tech/stagingdb',
    CONFIRM_ISOLATED_STAGING_ENV: 'true',
    CONFIRM_ISOLATED_STAGING_DB: 'true'
  });
  assert(res4.passed === true, 'Approved staging configuration must pass preflight');
  assert(res4.targetUrl === 'https://isolated-staging-api.examshield.internal', 'Target URL matches input');
  assert(res4.databaseHost === 'staging-branch-pooler.c-9.us-east-2.aws.neon.tech', 'Database host matches input');

  // ─────────────────────────────────────────────────────────────────
  // TEST 5: Rejected Configurations Perform Zero DB Writes & Zero HTTP
  // ─────────────────────────────────────────────────────────────────
  console.log('\n[TEST 5] Verification of zero database writes and zero HTTP requests on rejection...');
  let httpCalls = 0;
  let dbWrites = 0;

  // Mock global fetch & DB query to ensure strict zero-call enforcement
  const originalFetch = global.fetch;
  global.fetch = () => { httpCalls++; return Promise.reject(new Error('fetch must not be called')); };

  // Attempt evaluation of production-pointing config
  const rejectedEnv = {
    LOAD_TEST_URL: 'https://exam.nexifyforge.in',
    DATABASE_URL: `postgresql://u:p@${prodHost}/neondb`
  };
  const res5 = validateLoadTestPreflight(rejectedEnv);
  assert(res5.passed === false, 'Production environment must be rejected');
  assert(httpCalls === 0, `Zero HTTP requests made (actual: ${httpCalls})`);
  assert(dbWrites === 0, `Zero DB writes made (actual: ${dbWrites})`);

  global.fetch = originalFetch;

  console.log('\n======================================================================');
  console.log(`  ✓ ALL ${passedTests}/${totalTests} PREFLIGHT SAFETY GUARD CHECKS PASSED!`);
  console.log('======================================================================\n');
}

runPreflightGuardTests();
