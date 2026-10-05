// backend/coding-engine/runners/javascript/functionRunner.js
// JavaScript Automatic Wrapper Generator for FUNCTION_BASED (LeetCode style) evaluation

function wrapJavaScriptFunction(studentCode, metadata = {}) {
  const className = metadata.className || 'Solution';
  const functionName = metadata.functionName || 'twoSum';
  const parameters = Array.isArray(metadata.parameters) && metadata.parameters.length > 0
    ? metadata.parameters
    : [
        { name: 'nums', type: 'number[]' },
        { name: 'target', type: 'number' }
      ];

  const paramParsingLines = parameters.map((param, idx) => {
    const pName = param.name || `arg_${idx}`;
    const pType = (param.type || '').toLowerCase();

    let conv = `parsed_${idx}`;
    if (pType.includes('int') || pType.includes('number') || pType.includes('float')) {
      if (!pType.includes('[]') && !pType.includes('array')) {
        conv = `Number(parsed_${idx})`;
      }
    } else if (pType.includes('bool')) {
      conv = `Boolean(parsed_${idx})`;
    } else if (pType.includes('str') && !pType.includes('[]')) {
      conv = `String(parsed_${idx})`;
    }

    return `    const line_${idx} = lines[${idx}] || "";
    const parsed_${idx} = parseLine(line_${idx});
    const ${pName} = ${conv};`;
  }).join('\n');

  const paramCallArgs = parameters.map((param, idx) => param.name || `arg_${idx}`).join(', ');

  return `// ============================================================================
// Auto-Generated ExamShield JavaScript LeetCode Test Harness
// Mode: FUNCTION_BASED
// ============================================================================
const fs = require('fs');

// ── STUDENT IMPLEMENTATION START ────────────────────────────────────────────
${studentCode}
// ── STUDENT IMPLEMENTATION END ──────────────────────────────────────────────

// ── GENERATED TEST RUNNER ───────────────────────────────────────────────────
function parseLine(raw) {
  const str = String(raw || '').trim();
  if (!str) return '';
  try {
    return JSON.parse(str);
  } catch (_) {
    // Check if bracket array or comma numbers
    const clean = str.replace(/^\\[|\\]$/g, '').trim();
    if (clean.includes(',')) {
      const parts = clean.split(',').map(s => s.trim()).filter(Boolean);
      const nums = parts.map(Number);
      if (nums.every(n => !isNaN(n))) return nums;
      return parts;
    }
    return str;
  }
}

try {
  const inputBuffer = fs.readFileSync(0, 'utf8');
  const lines = inputBuffer.split('\\n').map(l => l.trim()).filter(Boolean);

${paramParsingLines}

  let result;
  if (typeof ${className} !== 'undefined') {
    const instance = new ${className}();
    if (typeof instance.${functionName} === 'function') {
      result = instance.${functionName}(${paramCallArgs});
    } else if (typeof ${functionName} === 'function') {
      result = ${functionName}(${paramCallArgs});
    } else {
      throw new Error("Method '${functionName}' not found on class '${className}'.");
    }
  } else if (typeof ${functionName} === 'function') {
    result = ${functionName}(${paramCallArgs});
  } else {
    throw new Error("Function '${functionName}' not declared in submitted solution.");
  }

  // Safe JSON serialization
  if (typeof result === 'object' && result !== null) {
    console.log(JSON.stringify(result));
  } else {
    console.log(String(result));
  }
} catch (err) {
  console.error(err.message || String(err));
  process.exit(1);
}
`;
}

module.exports = {
  wrapJavaScriptFunction,
};
