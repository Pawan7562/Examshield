// backend/utils/timezone.js — Centralized India Standard Time (IST — Asia/Kolkata) Helper
const TIMEZONE = 'Asia/Kolkata';
const TIMEZONE_OFFSET = '+05:30';
const TIMEZONE_OFFSET_MINUTES = 330; // 5 hours 30 minutes

/**
 * Accurately parses any date string, timestamp, or datetime-local input
 * into a Date object strictly anchored to India Standard Time (Asia/Kolkata).
 *
 * Prevents UTC drift where 10:30 AM IST was getting stored or read as 10:30 AM UTC (4:00 PM IST).
 */
function parseToIST(dateInput) {
  if (!dateInput) return null;
  if (dateInput instanceof Date) {
    if (isNaN(dateInput.getTime())) return null;
    return dateInput;
  }

  let str = String(dateInput).trim();
  if (!str) return null;

  // Replace space separator with standard ISO 'T'
  str = str.replace(' ', 'T');

  // Handle invalid hour 24 if sent by any client (e.g. 2026-10-25T24:33)
  if (str.includes('T24:')) {
    str = str.replace('T24:', 'T00:');
    const d = new Date(str.includes('+') || str.endsWith('Z') ? str : `${str}+05:30`);
    if (!isNaN(d.getTime())) {
      d.setDate(d.getDate() + 1);
      return d;
    }
  }

  // If input is YYYY-MM-DDTHH:mm (HTML5 datetime-local without seconds/tz)
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(str)) {
    str = `${str}:00+05:30`;
  } else if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(str)) {
    // YYYY-MM-DDTHH:mm:ss without timezone offset
    str = `${str}+05:30`;
  } else if (!str.endsWith('Z') && !str.includes('+') && !/T\d{2}:\d{2}:\d{2}-\d{2}/.test(str)) {
    // If no timezone offset is present anywhere, append IST offset
    str = `${str}+05:30`;
  }

  const date = new Date(str);
  return isNaN(date.getTime()) ? new Date(dateInput) : date;
}

/**
 * Returns an ISO-formatted string explicitly carrying the +05:30 IST offset.
 * Example: 2026-09-27T10:30:00.000+05:30
 * Uses exact UTC arithmetic (+330 minutes) to guarantee standard ISO 8601
 * representation where hour is strictly 00..23 (preventing PostgreSQL 'hour 24' errors).
 */
function toISTISOString(dateInput) {
  const date = parseToIST(dateInput) || new Date();
  if (isNaN(date.getTime())) return new Date().toISOString();

  // Shift UTC time by exactly +05:30 (IST offset: 330 minutes)
  const istOffsetMs = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(date.getTime() + istOffsetMs);

  const year = istDate.getUTCFullYear();
  const month = String(istDate.getUTCMonth() + 1).padStart(2, '0');
  const day = String(istDate.getUTCDate()).padStart(2, '0');
  const hour = String(istDate.getUTCHours()).padStart(2, '0');
  const minute = String(istDate.getUTCMinutes()).padStart(2, '0');
  const second = String(istDate.getUTCSeconds()).padStart(2, '0');
  const ms = String(istDate.getUTCMilliseconds()).padStart(3, '0');

  return `${year}-${month}-${day}T${hour}:${minute}:${second}.${ms}+05:30`;
}

/**
 * Format any date into India Standard Time string.
 * Completely immune to server / client OS timezone discrepancies.
 */
function formatIST(dateInput, formatType = 'full') {
  const date = parseToIST(dateInput);
  if (!date) return 'Invalid Date';

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
}

/**
 * Returns current timestamp in milliseconds
 */
function nowIST() {
  return Date.now();
}

/**
 * Calculates start, end, and window evaluation in IST
 */
function getExamWindowStatus(dateTimeInput, durationMinutes = 60, earlyAccessMinutes = 15) {
  const start = parseToIST(dateTimeInput);
  if (!start) return { isValid: false };

  const startTime = start.getTime();
  const endTime = startTime + (durationMinutes || 60) * 60000;
  const earlyAccessTime = startTime - (earlyAccessMinutes * 60000);
  const now = Date.now();

  const isBeforeEarlyAccess = now < earlyAccessTime;
  const isBeforeStart = now < startTime;
  const isLive = now >= earlyAccessTime && now <= endTime;
  const isEnded = now > endTime;

  return {
    isValid: true,
    startTime,
    endTime,
    earlyAccessTime,
    now,
    isBeforeEarlyAccess,
    isBeforeStart,
    isLive,
    isEnded,
    formattedStart: formatIST(start, 'full'),
    formattedEnd: formatIST(new Date(endTime), 'full'),
  };
}

module.exports = {
  TIMEZONE,
  TIMEZONE_OFFSET,
  TIMEZONE_OFFSET_MINUTES,
  parseToIST,
  toISTISOString,
  formatIST,
  nowIST,
  getExamWindowStatus,
};
