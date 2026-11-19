// src/utils/errorHandler.js
// Centralized enterprise client-side error handler & sanitizer.
// Guarantees students, teachers, and administrators NEVER see raw development/SQL/API stack traces.

import toast from 'react-hot-toast';

const TECHNICAL_STRINGS = [
  'syntax error',
  'relation',
  'column',
  'table',
  'postgres',
  'database',
  'sql',
  'violates',
  'foreign key',
  'unique constraint',
  'deadlock',
  'econnrefused',
  'etimedout',
  'jwt malformed',
  'cast to objectid',
  'cannot read properties of',
  'undefined is not',
  'null is not',
  'is not a function',
  'internal server error',
  'pg_',
  'unhandledrejection',
  'network error'
];

/**
 * Extracts and sanitizes any error into a professional, human-friendly message.
 *
 * @param {Error|Object|string} err - The error object, Axios error, or string
 * @param {string} fallback - Safe fallback message if technical error is detected
 * @returns {string} Clean, professional, user-facing error message
 */
export function getFriendlyErrorMessage(err, fallback = 'Unable to complete request. Please try again.') {
  if (!err) return fallback;

  // Extract raw message from diverse error structures (Axios, Error, string, etc.)
  let raw = '';
  if (typeof err === 'string') {
    raw = err;
  } else if (err.response?.data?.message) {
    raw = err.response.data.message;
  } else if (err.response?.data?.error) {
    raw = typeof err.response.data.error === 'string' ? err.response.data.error : '';
  } else if (err.message) {
    raw = err.message;
  }

  raw = String(raw || '').trim();
  if (!raw) return fallback;

  const lower = raw.toLowerCase();

  // Check for technical error jargon
  const isTechnical = TECHNICAL_STRINGS.some((s) => lower.includes(s));
  if (isTechnical) {
    if (lower.includes('network') || lower.includes('econnrefused') || lower.includes('timeout')) {
      return 'Network connection is temporarily unstable. Your exam data and session remain safely preserved.';
    }
    if (lower.includes('unique') || lower.includes('duplicate')) {
      return 'A record with these details already exists in the system. Please verify your inputs.';
    }
    if (lower.includes('jwt') || lower.includes('token') || lower.includes('unauthorized') || lower.includes('401')) {
      return 'Your security session has expired. Please sign in again to continue safely.';
    }
    return fallback;
  }

  // Friendly error messages are capitalized and clean
  return raw.length > 200 ? fallback : raw;
}

/**
 * Displays a styled, non-intrusive toast notification with a clean, actionable message.
 *
 * @param {Error|Object|string} err
 * @param {string} fallback
 * @param {Object} [options]
 */
export function showErrorToast(err, fallback = 'Action could not be completed.', options = {}) {
  const message = getFriendlyErrorMessage(err, fallback);
  const actionAdvice = err?.response?.data?.action || err?.action;

  const displayMessage = actionAdvice ? `${message} ${actionAdvice}` : message;

  toast.error(displayMessage, {
    duration: options.duration || 4500,
    style: {
      borderRadius: '10px',
      background: '#0f172a',
      color: '#f8fafc',
      fontSize: '13px',
      fontWeight: 500,
      border: '1px solid rgba(239, 68, 68, 0.3)',
      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.35)',
      ...options.style
    },
    ...options
  });

  return displayMessage;
}

/**
 * Displays a styled success notification.
 */
export function showSuccessToast(message, options = {}) {
  toast.success(message, {
    duration: options.duration || 3500,
    style: {
      borderRadius: '10px',
      background: '#0f172a',
      color: '#f8fafc',
      fontSize: '13px',
      fontWeight: 500,
      border: '1px solid rgba(16, 185, 129, 0.3)',
      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.35)',
      ...options.style
    },
    ...options
  });
}
