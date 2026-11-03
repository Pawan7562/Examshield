function parseParameters(rawInput, questionText = '') {
  if (!rawInput && rawInput !== 0) return [];
  if (typeof rawInput === 'object' && !Array.isArray(rawInput)) {
    return Object.entries(rawInput).map(([name, val]) => ({
      name,
      value: typeof val === 'object' ? JSON.stringify(val) : String(val)
    }));
  }

  const str = String(rawInput).trim();
  try {
    const parsed = JSON.parse(str);
    if (typeof parsed === 'object' && !Array.isArray(parsed) && parsed !== null) {
      return Object.entries(parsed).map(([name, val]) => ({
        name,
        value: typeof val === 'object' ? JSON.stringify(val) : String(val)
      }));
    }
  } catch (_) {}

  // Check for explicit key-value assignments like: nums = [2,7,11,15], target = 9 OR Nums:[2 7 11 15 3] target=9
  const kvRegex = /(?:^|[\s,;\n])([a-zA-Z_][a-zA-Z0-9_]*)\s*(?:=|:)\s*(\[[^\]]*\]|\{[^}]*\}|'[^']*'|"[^"]*"|[^\s,;\n]+(?:\s+[^\s,;\n=:]+)*?)(?=(?:[\s,;\n]+[a-zA-Z_][a-zA-Z0-9_]*\s*(?:=|:))|$)/gi;
  const matches = [];
  let m;
  while ((m = kvRegex.exec(str)) !== null) {
    const name = m[1].trim();
    let val = m[2].trim();
    if (val.startsWith('[') && val.endsWith(']') && !val.includes(',')) {
      const inner = val.slice(1, -1).trim();
      if (inner) val = '[' + inner.split(/\s+/).join(', ') + ']';
    }
    matches.push({ name: name.toLowerCase(), rawName: name, value: val });
  }

  if (matches.length > 0) {
    return matches;
  }

  // Multiline inputs fallback (e.g. line 1: nums, line 2: target)
  const lines = str.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const detectedParams = [];
  if (questionText) {
    const pRegex = /\b(?:array of (?:integers|numbers|strings)|integer|string|vector|matrix|list|number)\s+([a-zA-Z_][a-zA-Z0-9_]*)\b/gi;
    let pm;
    while ((pm = pRegex.exec(questionText)) !== null) {
      if (!detectedParams.includes(pm[1])) detectedParams.push(pm[1]);
    }
  }

  return lines.map((l, idx) => ({
    name: detectedParams[idx] || (lines.length > 1 ? `param${idx + 1}` : 'input'),
    value: l
  }));
}

console.log('Case 1:', parseParameters('Nums:[2 7 11 15 3]   target=9', 'You are given an array of integers nums and an integer target.'));
console.log('Case 2:', parseParameters('nums = [3,2,4], target = 6'));
console.log('Case 3:', parseParameters('[3,2,4]\n6', 'You are given an array of integers nums and an integer target.'));
