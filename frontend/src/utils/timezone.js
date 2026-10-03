// src/utils/timezone.js — Centralized India Standard Time (IST — Asia/Kolkata) Utility
export const TIMEZONE = 'Asia/Kolkata';
export const TIMEZONE_LABEL = 'IST';
export const TIMEZONE_OFFSET = '+05:30';

/**
 * Safely parses any date string, timestamp, or datetime-local input
 * into a Date object strictly anchored to India Standard Time.
 * Prevents timezone shifting bugs where 10:30 AM IST shifts by 5h 30m.
 */
export function parseToIST(dateInput) {
  if (!dateInput) return null;
  if (dateInput instanceof Date) {
    if (isNaN(dateInput.getTime())) return null;
    return dateInput;
  }

  let str = String(dateInput).trim();
  if (!str) return null;

  // Replace space with standard 'T'
  str = str.replace(' ', 'T');

  // If input is YYYY-MM-DDTHH:mm (HTML5 datetime-local without seconds/tz)
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(str)) {
    str = `${str}:00+05:30`;
  } else if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(str)) {
    str = `${str}+05:30`;
  } else if (!str.endsWith('Z') && !str.includes('+') && !/T\d{2}:\d{2}:\d{2}-\d{2}/.test(str)) {
    // If no timezone offset exists, treat as IST
    str = `${str}+05:30`;
  }

  const date = new Date(str);
  return isNaN(date.getTime()) ? new Date(dateInput) : date;
}

/**
 * Formats any date strictly in India Standard Time (Asia/Kolkata).
 * Works regardless of the user's browser or operating system time zone setting.
 */
export function formatIST(dateInput, formatType = 'full') {
  const date = parseToIST(dateInput);
  if (!date) return 'Flexible Window';

  try {
    switch (formatType) {
      case 'timeOnly':
        return date.toLocaleTimeString('en-IN', {
          timeZone: TIMEZONE,
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        });

      case 'timeOnlySeconds':
        return date.toLocaleTimeString('en-IN', {
          timeZone: TIMEZONE,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        });

      case 'dateOnly':
        return date.toLocaleDateString('en-IN', {
          timeZone: TIMEZONE,
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        });

      case 'dateTime':
        return date.toLocaleString('en-IN', {
          timeZone: TIMEZONE,
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        });

      case 'short':
        return date.toLocaleString('en-IN', {
          timeZone: TIMEZONE,
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        });

      case 'full':
      default:
        return `${date.toLocaleString('en-IN', {
          timeZone: TIMEZONE,
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        })} IST`;
    }
  } catch (e) {
    return date.toLocaleString();
  }
}

/**
 * Converts any date or datetime-local input to an ISO string with +05:30 offset
 * for sending across APIs.
 * Example: "2026-09-27T10:30" -> "2026-09-27T10:30:00.000+05:30"
 */
export function toISTISOString(dateInput) {
  if (!dateInput) return null;
  const str = String(dateInput).trim();
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(str)) {
    return `${str}:00.000+05:30`;
  }
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(str)) {
    return `${str}.000+05:30`;
  }
  const date = parseToIST(dateInput);
  if (!date) return str;

  // Format parts in IST
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const map = {};
  for (const p of parts) map[p.type] = p.value;

  const ms = String(date.getMilliseconds()).padStart(3, '0');
  return `${map.year}-${map.month}-${map.day}T${map.hour}:${map.minute}:${map.second}.${ms}+05:30`;
}

/**
 * Converts a Date or ISO timestamp into value suitable for HTML5 `<input type="datetime-local">` in IST.
 * Output: "YYYY-MM-DDTHH:mm"
 */
export function toDateTimeLocalValue(dateInput) {
  const date = parseToIST(dateInput) || new Date();
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const map = {};
  for (const p of parts) map[p.type] = p.value;

  return `${map.year}-${map.month}-${map.day}T${map.hour}:${map.minute}`;
}

/**
 * Determines whether an examination has concluded according to its scheduled end time
 * or explicit completion status.
 */
export function isExamEnded(exam) {
  if (!exam) return false;
  if (exam.status === 'completed' || exam.status === 'cancelled') return true;
  if (exam.session_status === 'submitted' || exam.session_status === 'terminated') return true;
  if (!exam.date_time) return false;

  const start = parseToIST(exam.date_time);
  if (!start) return false;

  const startTime = start.getTime();
  const durationMs = (Number(exam.duration) || 60) * 60000;
  const endTime = startTime + durationMs;
  return Date.now() > endTime;
}

/**
 * Determines whether an exam is active / startable right now in IST.
 * Strictly bounded by the scheduled end time (startTime + duration).
 * Allows early access window (default 15 minutes before scheduled start).
 * NEVER returns true if the scheduled end time has already expired.
 */
export function isExamStartable(exam, earlyAccessMinutes = 15) {
  if (!exam) return false;
  if (isExamEnded(exam)) return false;
  if (exam.session_status === 'submitted' || exam.session_status === 'terminated') return false;
  if (exam.status === 'completed' || exam.status === 'cancelled') return false;

  if (!exam.date_time) {
    return exam.status === 'published' || exam.status === 'active';
  }

  const start = parseToIST(exam.date_time);
  if (!start) return false;

  const startTime = start.getTime();
  const durationMs = (Number(exam.duration) || 60) * 60000;
  const endTime = startTime + durationMs;
  const now = Date.now();

  // If time has passed the scheduled end time, student CANNOT start or enter
  if (now > endTime) return false;

  // Accessible from early access window up to the scheduled end time
  return now >= (startTime - earlyAccessMinutes * 60000);
}

/**
 * Calculates remaining countdown time in milliseconds until target start time.
 */
export function getCountdownMs(targetDateTime) {
  const target = parseToIST(targetDateTime);
  if (!target) return 0;
  return Math.max(0, target.getTime() - Date.now());
}

/**
 * Calculates remaining seconds until scheduled exam end time.
 */
export function getExamRemainingSeconds(exam, sessionStartedAt = null) {
  if (!exam) return 0;
  const now = Date.now();
  const totalDurationSec = (Number(exam.duration) || 60) * 60;

  // Window remaining based on scheduled end
  let windowRemainingSec = totalDurationSec;
  if (exam.date_time) {
    const start = parseToIST(exam.date_time);
    if (start) {
      const endTime = start.getTime() + totalDurationSec * 1000;
      windowRemainingSec = Math.max(0, Math.floor((endTime - now) / 1000));
    }
  }

  // Session remaining if candidate started at specific time
  let sessionRemainingSec = totalDurationSec;
  if (sessionStartedAt) {
    const sessionStartMs = new Date(sessionStartedAt).getTime();
    if (!isNaN(sessionStartMs)) {
      sessionRemainingSec = Math.max(0, Math.floor((totalDurationSec * 1000 - (now - sessionStartMs)) / 1000));
    }
  }

  return Math.min(sessionRemainingSec, windowRemainingSec);
}
