// backend/utils/errorSanitizer.js
// Centralized enterprise error sanitizer & professional message mapper.
// Prevents exposing database errors, stack traces, and internal technical jargon to students and teachers.

let logger = console;
try {
  const loggerModule = require('../config/logger');
  if (loggerModule && loggerModule.logger) {
    logger = loggerModule.logger;
  }
} catch {
  logger = console;
}

/**
 * Patterns that indicate raw internal technical details which must NEVER be shown to users.
 */
const TECHNICAL_PATTERNS = [
  /syntax error/i,
  /relation ".*" does not exist/i,
  /column ".*" does not exist/i,
  /violates foreign key constraint/i,
  /violates unique constraint/i,
  /violates not-null constraint/i,
  /invalid input syntax for type/i,
  /invalid byte sequence/i,
  /connection refused/i,
  /econnrefused/i,
  /etimedout/i,
  /ehostunreach/i,
  /enotfound/i,
  /pool has ended/i,
  /client has already been released/i,
  /timeout exceeded/i,
  /deadlock detected/i,
  /jwt malformed/i,
  /jwt expired/i,
  /invalid signature/i,
  /cannot read properties of/i,
  /is not a function/i,
  /unexpected token/i,
  /cast to objectid failed/i,
  /null value in column/i,
  /error: insert into/i,
  /error: select/i,
  /error: update/i,
  /error: delete/i,
  /pg_/i,
  /psql/i
];

/**
 * Maps common database and system error codes into helpful, actionable messages.
 */
function mapSystemError(err, defaultMessage = 'An unexpected server issue occurred.') {
  if (!err) return { message: defaultMessage, action: 'Please try again in a few moments.' };

  const rawMsg = String(err.message || err.error || err || '');
  const code = String(err.code || '');

  // 1. PostgreSQL Unique Constraint (duplicate record)
  if (code === '23505' || rawMsg.includes('unique constraint') || rawMsg.includes('duplicate key')) {
    if (rawMsg.includes('email')) {
      return {
        message: 'An account with this email address is already registered.',
        action: 'Please use a different email address or log in using your existing credentials.',
        code: 'DUPLICATE_EMAIL'
      };
    }
    if (rawMsg.includes('roll_no') || rawMsg.includes('rollNo')) {
      return {
        message: 'A candidate with this Roll Number is already registered in this department.',
        action: 'Please verify the candidate roll number before submitting.',
        code: 'DUPLICATE_ROLL_NO'
      };
    }
    if (rawMsg.includes('exam_code') || rawMsg.includes('exam_key')) {
      return {
        message: 'This examination key is already assigned to another test.',
        action: 'Please generate or enter a new unique exam key.',
        code: 'DUPLICATE_EXAM_KEY'
      };
    }
    return {
      message: 'A record with these details already exists in the system.',
      action: 'Please check your inputs and try again.',
      code: 'DUPLICATE_RECORD'
    };
  }

  // 2. PostgreSQL Foreign Key Constraint
  if (code === '23503' || rawMsg.includes('foreign key constraint')) {
    return {
      message: 'The selected parent record (such as college, exam, or department) could not be verified.',
      action: 'Please refresh the page and verify the selected options.',
      code: 'INVALID_REFERENCE'
    };
  }

  // 3. PostgreSQL Not-Null Constraint
  if (code === '23502' || rawMsg.includes('not-null constraint')) {
    return {
      message: 'One or more required fields are missing.',
      action: 'Please ensure all required form fields are completed before submitting.',
      code: 'MISSING_REQUIRED_FIELDS'
    };
  }

  // 4. Network / DB Connection Timeout or Refused
  if (
    code === 'ECONNREFUSED' ||
    code === 'ETIMEDOUT' ||
    code === 'EHOSTUNREACH' ||
    rawMsg.includes('Connection refused') ||
    rawMsg.includes('timeout')
  ) {
    return {
      message: 'The examination service is momentarily busy synchronizing records.',
      action: 'Your progress is securely preserved. Please try again in a few seconds.',
      code: 'SERVICE_TEMPORARILY_BUSY'
    };
  }

  // 5. JWT / Authentication Errors
  if (rawMsg.includes('jwt expired') || rawMsg.includes('Token expired')) {
    return {
      message: 'Your security session has expired.',
      action: 'Please log in again to continue your session safely.',
      code: 'SESSION_EXPIRED'
    };
  }

  if (rawMsg.includes('jwt') || rawMsg.includes('Invalid token') || rawMsg.includes('Authentication failed')) {
    return {
      message: 'Authentication could not be validated.',
      action: 'Please log in again with valid credentials.',
      code: 'INVALID_CREDENTIALS'
    };
  }

  // 6. Check if message contains any other internal technical strings
  const isTechnical = TECHNICAL_PATTERNS.some(pattern => pattern.test(rawMsg));
  if (isTechnical) {
    return {
      message: defaultMessage,
      action: 'If this persists, please contact your examination administrator or support.',
      code: 'INTERNAL_ERROR'
    };
  }

  // If message looks human-friendly, return it with a polite action
  return {
    message: rawMsg || defaultMessage,
    action: 'Please review your inputs or try again.',
    code: 'CLIENT_ERROR'
  };
}

/**
 * Logs technical error internally and returns a clean, sanitized response.
 *
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code (e.g. 400, 404, 500)
 * @param {Error|Object|string} err - Original technical error
 * @param {string} fallbackMessage - User-friendly message if error is technical
 * @param {Object} [options] - Optional custom action, metadata, or status code override
 */
function sendErrorResponse(res, statusCode = 500, err, fallbackMessage = 'An unexpected server issue occurred.', options = {}) {
  const rawMsg = err?.message || (typeof err === 'string' ? err : 'Unknown error');
  const stack = err?.stack;

  // Log full detailed technical telemetry to internal server logs for engineers
  try {
    if (logger && typeof logger.error === 'function') {
      logger.error(`[SYSTEM-ERROR] Status ${statusCode}: ${rawMsg}`, {
        stack,
        code: err?.code,
        path: res?.req?.originalUrl,
        method: res?.req?.method,
        userId: res?.req?.user?.id,
        userRole: res?.req?.user?.role,
        extra: options?.extra
      });
    } else {
      console.error(`[SYSTEM-ERROR] Status ${statusCode}: ${rawMsg}`);
      if (stack) console.error(stack);
    }
  } catch (_) {}

  // Sanitize for human users
  const mapped = mapSystemError(err, fallbackMessage);

  return res.status(statusCode).json({
    success: false,
    message: options.message || mapped.message,
    action: options.action || mapped.action,
    code: options.code || mapped.code
  });
}

module.exports = {
  TECHNICAL_PATTERNS,
  mapSystemError,
  sendErrorResponse
};
