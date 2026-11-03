// backend/tests/helpers/loadTestPreflightGuard.js
// Fail-Closed Preflight Validation for Load Benchmarks

const KNOWN_PRODUCTION_HOSTNAMES = [
  'ep-withered-fog-aoapan2z-pooler.c-2.ap-southeast-1.aws.neon.tech',
  'ep-withered-fog-aoapan2z.c-2.ap-southeast-1.aws.neon.tech',
  'ep-rough-unit-b4oz8f5l-pooler.c-6.us-east-2.aws.neon.tech',
  'ep-rough-unit-b4oz8f5l.c-6.us-east-2.aws.neon.tech',
  'nexifyforge.in',
  'www.nexifyforge.in',
  'exam.nexifyforge.in',
  'pkthenexgenexam.xyz',
  'examshield-3-wydj.onrender.com'
];

/**
 * Validates whether the current environment is safely authorized to run load benchmarks.
 * Fails closed on any ambiguity, missing target, or production connection.
 * Zero database writes or HTTP requests are performed during validation.
 *
 * @param {Object} env - Environment variables to validate (defaults to process.env)
 * @returns {Object} { passed: boolean, errors: string[], targetUrl?: string, databaseHost?: string, message: string }
 */
function validateLoadTestPreflight(env = process.env) {
  const errors = [];

  // 1. Explicit Target URL Check
  const loadTestUrl = env.LOAD_TEST_URL;
  if (!loadTestUrl || typeof loadTestUrl !== 'string' || loadTestUrl.trim() === '') {
    errors.push('LOAD_TEST_URL must be explicitly provided. Defaulting to localhost or production is strictly forbidden.');
  } else {
    try {
      const parsedUrl = new URL(loadTestUrl.trim());
      const hostname = parsedUrl.hostname.toLowerCase();

      // Check against known production hostnames
      for (const prodHost of KNOWN_PRODUCTION_HOSTNAMES) {
        if (hostname === prodHost || hostname.endsWith(`.${prodHost}`)) {
          errors.push(`Target URL (${hostname}) matches a protected production hostname (${prodHost}). Load testing against production is strictly forbidden.`);
        }
      }

      // Check localhost / local loopback safety
      const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
      if (isLocalhost && env.ALLOW_LOCAL_LOAD_TEST !== 'true') {
        errors.push(`Target URL points to localhost (${hostname}), but ALLOW_LOCAL_LOAD_TEST is not set to 'true'. Set ALLOW_LOCAL_LOAD_TEST=true to test against an approved local instance.`);
      }

      // If not localhost and not flagged as approved staging
      if (!isLocalhost && env.CONFIRM_ISOLATED_STAGING_ENV !== 'true') {
        errors.push(`Target URL is a remote host (${hostname}), but CONFIRM_ISOLATED_STAGING_ENV is not set to 'true'. Remote testing requires explicit confirmation.`);
      }
    } catch (e) {
      errors.push(`Invalid LOAD_TEST_URL format: ${e.message}`);
    }
  }

  // 2. Database Isolation Verification
  const dbUrl = env.STAGING_DATABASE_URL || env.DATABASE_URL;
  if (!dbUrl || typeof dbUrl !== 'string' || dbUrl.trim() === '') {
    errors.push('No database URL provided (STAGING_DATABASE_URL or DATABASE_URL).');
  } else {
    try {
      const parsedDb = new URL(dbUrl.trim());
      const dbHost = parsedDb.hostname.toLowerCase();

      // Ensure not pointing to production database
      for (const prodHost of KNOWN_PRODUCTION_HOSTNAMES) {
        if (dbHost === prodHost || dbHost.endsWith(`.${prodHost}`)) {
          errors.push(`Database host (${dbHost}) matches the protected primary/production database. Load testing against this database is prohibited.`);
        }
      }

      // Explicit confirmation of isolated test database is required
      if (env.CONFIRM_ISOLATED_STAGING_DB !== 'true') {
        errors.push('CONFIRM_ISOLATED_STAGING_DB is not set to "true". An explicit confirmation that the database is an isolated non-production staging database is mandatory.');
      }
    } catch (e) {
      errors.push(`Invalid database URL format: ${e.message}`);
    }
  }

  if (errors.length > 0) {
    const errorMsg = [
      '❌ [FAIL-CLOSED PREFLIGHT REJECTED]',
      'The load test was aborted before initiating any HTTP requests or database operations:',
      ...errors.map((err, i) => `  ${i + 1}. ${err}`)
    ].join('\n');

    return {
      passed: false,
      errors,
      message: errorMsg
    };
  }

  const validDbUrl = (env.STAGING_DATABASE_URL || env.DATABASE_URL).trim();
  const dbHost = (new URL(validDbUrl)).hostname;

  return {
    passed: true,
    targetUrl: loadTestUrl.trim(),
    databaseHost: dbHost,
    databaseUrl: validDbUrl,
    message: '✅ Preflight check passed: Target URL and isolated staging database verified.'
  };
}

module.exports = {
  validateLoadTestPreflight,
  KNOWN_PRODUCTION_HOSTNAMES
};
