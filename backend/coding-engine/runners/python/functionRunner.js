// backend/coding-engine/runners/python/functionRunner.js
// Python Automatic Wrapper Generator for FUNCTION_BASED (LeetCode style) evaluation

function wrapPythonFunction(studentCode, metadata = {}) {
  const className = metadata.className || 'Solution';
  const functionName = metadata.functionName || 'twoSum';
  const parameters = Array.isArray(metadata.parameters) && metadata.parameters.length > 0
    ? metadata.parameters
    : [
        { name: 'nums', type: 'list[int]' },
        { name: 'target', type: 'int' }
      ];

  const allPrimitives = parameters.every(p => {
    const t = (p.type || 'int').toLowerCase().replace(/\s+/g, '').trim();
    return ['int', 'long', 'float', 'double', 'bool', 'boolean', 'str', 'string'].includes(t) && !t.includes('list') && !t.includes('[]');
  });

  const paramParsingLines = parameters.map((param, idx) => {
    const pName = param.name || `arg_${idx}`;
    const pType = (param.type || '').toLowerCase();

    let conversion = `__parsed_${idx}`;
    if (pType.includes('int') && !pType.includes('list') && !pType.includes('[]')) {
      conversion = `int(__parsed_${idx})`;
    } else if (pType.includes('float') || pType.includes('double')) {
      conversion = `float(__parsed_${idx})`;
    } else if (pType.includes('bool')) {
      conversion = `bool(__parsed_${idx})`;
    } else if (pType.includes('str') && !pType.includes('list')) {
      conversion = `str(__parsed_${idx})`;
    }

    if (allPrimitives) {
      return `    __line_${idx} = tokens[${idx}] if ${idx} < len(tokens) else ""
    __parsed_${idx} = _parse_val(__line_${idx})
    ${pName} = ${conversion}`;
    }

    return `    __line_${idx} = lines[${idx}] if ${idx} < len(lines) else ""
    __parsed_${idx} = _parse_val(__line_${idx})
    ${pName} = ${conversion}`;
  }).join('\n');

  const paramCallArgs = parameters.map((param, idx) => param.name || `arg_${idx}`).join(', ');

  const inputExtraction = allPrimitives
    ? `    raw_input_data = sys.stdin.read().strip()
    tokens = raw_input_data.split()`
    : `    raw_input_data = sys.stdin.read().strip()
    lines = [l.strip() for l in raw_input_data.splitlines() if l.strip()]
    if len(lines) >= 2 and len(lines[0].split()) == 1 and len(lines[1].split()) > 1:
        lines = [lines[1]] + lines[2:]`;

  return `# ============================================================================
# Auto-Generated ExamShield Python LeetCode Test Harness
# Mode: FUNCTION_BASED
# ============================================================================
from __future__ import annotations
import sys
import json
import math
import collections
import heapq
import itertools
from typing import *

# ── STUDENT IMPLEMENTATION START ────────────────────────────────────────────
${studentCode}
# ── STUDENT IMPLEMENTATION END ──────────────────────────────────────────────

# ── GENERATED TEST RUNNER ───────────────────────────────────────────────────
def _parse_val(raw_str):
    raw = str(raw_str).strip()
    if not raw:
        return ""
    try:
        return json.loads(raw)
    except Exception:
        # Check if space or comma separated numbers
        clean = raw.strip("[]").strip()
        if clean:
            sep = "," if "," in clean else None
            parts = clean.split(sep)
            try:
                return [int(p.strip()) for p in parts if p.strip()]
            except Exception:
                return [p.strip() for p in parts if p.strip()]
        return raw

if __name__ == '__main__':
${inputExtraction}

${paramParsingLines}

    res = None
    if '${className}' in globals():
        sol = ${className}()
        if hasattr(sol, '${functionName}'):
            fn = getattr(sol, '${functionName}')
            res = fn(${paramCallArgs})
    elif '${functionName}' in globals():
        fn = globals()['${functionName}']
        res = fn(${paramCallArgs})
    else:
        raise AttributeError(f"Could not find function '${functionName}' or class '${className}' in submitted solution.")

    # Safe serialization
    if isinstance(res, (list, tuple, dict, bool, int, float)) or res is None:
        print(json.dumps(res, separators=(',', ' ')))
    else:
        print(str(res))
`;
}

module.exports = {
  wrapPythonFunction,
};
