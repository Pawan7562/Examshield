// frontend/src/utils/codeParamParser.js
// Enterprise LeetCode-style parameter & I/O decomposition parser

/**
 * Parses raw input string into structured parameter objects:
 * [{ name: 'nums', value: '[2, 7, 11, 15]' }, { name: 'target', value: '9' }]
 */
export function parseParameters(rawInput, questionText = '', knownParams = []) {
  if (rawInput === undefined || rawInput === null) return [];

  // If knownParams passed as list of objects or strings
  const paramNames = Array.isArray(knownParams)
    ? knownParams.map(p => (typeof p === 'object' ? p?.name : p)).filter(Boolean)
    : [];

  // If already an object (and not array)
  if (typeof rawInput === 'object' && !Array.isArray(rawInput)) {
    return Object.entries(rawInput).map(([name, val]) => ({
      name,
      value: typeof val === 'object' ? JSON.stringify(val) : String(val)
    }));
  }

  const str = String(rawInput).trim();
  if (!str) return [];

  // Try JSON object parse
  try {
    const parsed = JSON.parse(str);
    if (typeof parsed === 'object' && !Array.isArray(parsed) && parsed !== null) {
      return Object.entries(parsed).map(([name, val]) => ({
        name,
        value: typeof val === 'object' ? JSON.stringify(val) : String(val)
      }));
    }
  } catch (_) {}

  // 1. Match explicit assignments like:
  // nums = [2,7,11,15], target = 9
  // Nums:[2 7 11 15 3] target=9
  // nums = [3,2,4] \n target = 6
  const kvRegex = /(?:^|[\s,;\n])([a-zA-Z_][a-zA-Z0-9_]*)\s*(?:=|:)\s*(\[[^\]]*\]|\{[^}]*\}|'[^']*'|"[^"]*"|[^\s,;\n]+(?:\s+[^\s,;\n=:]+)*?)(?=(?:[\s,;\n]+[a-zA-Z_][a-zA-Z0-9_]*\s*(?:=|:))|$)/gi;
  const matches = [];
  let m;
  while ((m = kvRegex.exec(str)) !== null) {
    const name = m[1].trim();
    let val = m[2].trim();
    // Normalize space-separated arrays like [2 7 11 15 3] -> [2, 7, 11, 15, 3]
    if (val.startsWith('[') && val.endsWith(']') && !val.includes(',')) {
      const inner = val.slice(1, -1).trim();
      if (inner) val = '[' + inner.split(/\s+/).join(', ') + ']';
    }
    matches.push({ name: name.toLowerCase(), rawName: name, value: val });
  }

  if (matches.length > 0) {
    return matches;
  }

  // 2. Multiline inputs or raw values
  const lines = str.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  // Use knownParams if available
  const detectedParams = [...paramNames];

  // Attempt to deduce variable names from question text (e.g., "integer array nums", "integer target")
  if (detectedParams.length === 0 && questionText) {
    const pRegex = /\b(?:array of (?:integers|numbers|strings)|integer\s+array|string\s+array|array|integer|string|vector|matrix|list|number)\s+([a-zA-Z_][a-zA-Z0-9_]*)\b/gi;
    let pm;
    while ((pm = pRegex.exec(questionText)) !== null) {
      const p = pm[1].toLowerCase();
      if (p !== 'of' && p !== 'the' && p !== 'in' && p !== 'and' && !detectedParams.includes(p)) {
        detectedParams.push(p);
      }
    }
  }

  // If question is clearly Two Sum
  if (detectedParams.length < 2 && /two\s*sum|indices of two|sum.*target/i.test(questionText)) {
    if (!detectedParams.includes('nums')) detectedParams.push('nums');
    if (!detectedParams.includes('target')) detectedParams.push('target');
  }

  return lines.map((l, idx) => {
    let cleanVal = l;
    if (cleanVal.startsWith('[') && cleanVal.endsWith(']') && !cleanVal.includes(',')) {
      const inner = cleanVal.slice(1, -1).trim();
      if (inner) cleanVal = '[' + inner.split(/\s+/).join(', ') + ']';
    }
    return {
      name: detectedParams[idx] || (lines.length > 1 ? `param${idx + 1}` : 'input'),
      value: cleanVal
    };
  });
}

/**
 * Formats parsed parameters into a canonical LeetCode input string
 * e.g. "nums = [2,7,11,15], target = 9"
 */
export function formatLeetCodeInput(params) {
  if (!params || params.length === 0) return '';
  if (params.length === 1 && params[0].name === 'input') {
    return params[0].value;
  }
  return params.map(p => `${p.name} = ${p.value}`).join(', ');
}

/**
 * Normalizes output string for display (e.g., space-separated integers "0 1" -> "[0, 1]")
 */
export function formatLeetCodeOutput(rawOutput) {
  if (rawOutput === undefined || rawOutput === null) return '';
  if (typeof rawOutput === 'object') {
    try {
      return JSON.stringify(rawOutput);
    } catch (_) {
      return String(rawOutput);
    }
  }
  const s = String(rawOutput).trim();
  // If it's space-separated numbers like "0 1", format as "[0, 1]"
  if (/^\d+(\s+\d+)+$/.test(s)) {
    return '[' + s.split(/\s+/).join(', ') + ']';
  }
  return s;
}
