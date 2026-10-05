// backend/coding-engine/comparator.js
// Production-grade output normalizer & multi-mode comparator for ExamShield coding engine

/**
 * Normalizes string outputs by:
 * - Converting all line breaks (CRLF, CR) to standard LF (\n)
 * - Trimming trailing whitespace from individual lines
 * - Trimming overall leading and trailing whitespace
 * - Stripping outer matching quotes if present
 */
function normalizeOutput(val) {
  if (val === undefined || val === null) return '';
  if (typeof val === 'boolean') return val ? 'true' : 'false';
  if (typeof val === 'number') {
    return Number.isInteger(val) ? String(val) : String(parseFloat(val.toFixed(6)));
  }
  if (typeof val === 'object') {
    try {
      return JSON.stringify(val);
    } catch (_) {
      return String(val).trim();
    }
  }

  let str = String(val).replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = str.split('\n').map(l => l.trimEnd());
  str = lines.join('\n').trim();

  // If wrapped in matching quotes, unwrap
  if ((str.startsWith('"') && str.endsWith('"')) || (str.startsWith("'") && str.endsWith("'"))) {
    return str.slice(1, -1).trim();
  }
  return str;
}

/**
 * Extracts array items from a string representation like "[0, 1]", "0, 1", "[0,1]" or "0 1"
 */
function parseTokensOrArray(val) {
  if (Array.isArray(val)) return val.map(String);
  const norm = normalizeOutput(val);
  try {
    const parsed = JSON.parse(norm);
    if (Array.isArray(parsed)) return parsed.map(String);
  } catch (_) {}

  // Strip brackets and split by comma or whitespace
  const clean = norm.replace(/^\[|\]$/g, '').trim();
  if (!clean) return [];
  if (clean.includes(',')) {
    return clean.split(',').map(s => s.trim()).filter(Boolean);
  }
  return clean.split(/\s+/).filter(Boolean);
}

/**
 * Multi-mode output comparator
 * Supported Modes:
 * - EXACT: Strict trimmed line-by-line comparison
 * - ARRAY: Ordered array/vector comparison (elements match in exact sequence)
 * - UNORDERED_ARRAY: Multi-set array comparison (elements match regardless of order)
 * - INTEGER: Integer numerical equivalence
 * - FLOAT_WITH_TOLERANCE: Floating point comparison with epsilon (default 1e-6)
 * - STRING: String match (case-sensitive or insensitive)
 * - BOOLEAN: Boolean equivalence (true/false, 1/0, True/False)
 * - CUSTOM: Multiple valid outputs separated by '||' or 'OR'
 */
function compareOutputs(actual, expected, mode = 'ARRAY', options = {}) {
  if (typeof mode === 'object' && mode !== null) {
    options = mode;
    mode = options.comparisonMode || options.mode || 'ARRAY';
  }

  const normActual = normalizeOutput(actual);
  const normExpected = normalizeOutput(expected);

  if (normActual === normExpected) return true;

  // 1. Support multiple valid alternatives if expected contains '||' or ' OR '
  if (normExpected.includes('||')) {
    const optionsList = normExpected.split('||').map(s => s.trim());
    return optionsList.some(opt => compareOutputs(actual, opt, mode, options));
  }
  if (normExpected.includes(' OR ')) {
    const optionsList = normExpected.split(' OR ').map(s => s.trim());
    return optionsList.some(opt => compareOutputs(actual, opt, mode, options));
  }

  const compMode = (typeof mode === 'string' ? mode : 'ARRAY').toUpperCase();

  switch (compMode) {
    case 'EXACT':
      return normActual === normExpected;

    case 'INTEGER': {
      const a = parseInt(normActual.replace(/[^\d-]/g, ''), 10);
      const b = parseInt(normExpected.replace(/[^\d-]/g, ''), 10);
      if (!isNaN(a) && !isNaN(b)) return a === b;
      return normActual === normExpected;
    }

    case 'FLOAT_WITH_TOLERANCE': {
      const epsilon = options.tolerance !== undefined ? options.tolerance : (options.epsilon || 1e-6);
      const numA = Number(normActual);
      const numB = Number(normExpected);
      if (!isNaN(numA) && !isNaN(numB)) {
        return Math.abs(numA - numB) <= epsilon;
      }
      // Vector of floats comparison
      const arrA = parseTokensOrArray(normActual).map(Number);
      const arrB = parseTokensOrArray(normExpected).map(Number);
      if (arrA.length > 0 && arrA.length === arrB.length) {
        return arrA.every((v, i) => !isNaN(v) && !isNaN(arrB[i]) && Math.abs(v - arrB[i]) <= epsilon);
      }
      return false;
    }

    case 'BOOLEAN': {
      const boolVal = (s) => {
        const lower = String(s).toLowerCase().trim();
        if (lower === 'true' || lower === '1' || lower === 'yes') return true;
        if (lower === 'false' || lower === '0' || lower === 'no') return false;
        return null;
      };
      const bA = boolVal(normActual);
      const bB = boolVal(normExpected);
      if (bA !== null && bB !== null) return bA === bB;
      return normActual === normExpected;
    }

    case 'UNORDERED_ARRAY': {
      const listA = parseTokensOrArray(normActual);
      const listB = parseTokensOrArray(normExpected);
      if (listA.length !== listB.length) return false;
      const sortedA = [...listA].sort();
      const sortedB = [...listB].sort();
      return sortedA.every((val, i) => val === sortedB[i]);
    }

    case 'STRING': {
      if (options.caseInsensitive) {
        return normActual.toLowerCase() === normExpected.toLowerCase();
      }
      return normActual === normExpected;
    }

    case 'ARRAY':
    default: {
      // 1. Direct JSON parse match
      try {
        const parsedA = JSON.parse(normActual);
        const parsedB = JSON.parse(normExpected);
        if (typeof parsedA === 'object' && typeof parsedB === 'object') {
          return JSON.stringify(parsedA) === JSON.stringify(parsedB);
        }
      } catch (_) {}

      // 2. Tokenized comparison (e.g. "[0, 1]" vs "[0,1]" vs "0 1")
      const tokensA = parseTokensOrArray(normActual);
      const tokensB = parseTokensOrArray(normExpected);
      if (tokensA.length > 0 && tokensA.length === tokensB.length) {
        const matches = tokensA.every((tok, idx) => {
          if (tok === tokensB[idx]) return true;
          const nA = Number(tok);
          const nB = Number(tokensB[idx]);
          if (!isNaN(nA) && !isNaN(nB)) return Math.abs(nA - nB) < 1e-6;
          return false;
        });
        if (matches) return true;
      }

      return normActual === normExpected;
    }
  }
}

module.exports = {
  normalizeOutput,
  parseTokensOrArray,
  compareOutputs,
};
