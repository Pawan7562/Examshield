// backend/coding-engine/adapters/BaseLanguageAdapter.js
// Base class for Language Adapters in the ExamShield Coding Engine

class BaseLanguageAdapter {
  constructor(languageId, name, judge0LanguageId, compileRequired = false) {
    this.languageId = languageId;
    this.name = name;
    this.judge0LanguageId = judge0LanguageId;
    this.compileRequired = compileRequired;
  }

  /**
   * Generates complete compilable source code based on mode and question metadata
   */
  generateSource(studentCode, executionMode = 'FUNCTION_BASED', metadata = {}) {
    throw new Error('generateSource must be implemented by language adapter');
  }

  /**
   * Generates clean starter boilerplate template for student editor and admin preview
   */
  generateStarterCode(metadata = {}) {
    throw new Error('generateStarterCode must be implemented by language adapter');
  }

  /**
   * Formats a testcase input into lines piped into standard input of runner
   */
  formatTestInput(rawInput, metadata = {}) {
    if (rawInput === undefined || rawInput === null) return '';

    const params = metadata.parameters || [];
    const paramNames = params.map(p => p.name).filter(Boolean);

    // If input is an object
    if (typeof rawInput === 'object' && rawInput !== null) {
      if (params.length > 0) {
        return params.map(p => {
          const val = rawInput[p.name];
          return val !== undefined ? (typeof val === 'object' ? JSON.stringify(val) : String(val)) : '';
        }).join('\n');
      }
      return Object.values(rawInput).map(v => typeof v === 'object' ? JSON.stringify(v) : String(v)).join('\n');
    }

    const str = String(rawInput).trim();

    // Check if input is a JSON string of an object
    try {
      const parsedObj = JSON.parse(str);
      if (typeof parsedObj === 'object' && parsedObj !== null && !Array.isArray(parsedObj)) {
        return this.formatTestInput(parsedObj, metadata);
      }
    } catch (_) {}

    // If string has "param = value" format
    if (str.includes('=') && paramNames.length > 0) {
      const extracted = parseNamedParameters(str, paramNames);
      const extractedKeys = Object.keys(extracted);
      if (extractedKeys.length > 0) {
        return paramNames.map(name => extracted[name] !== undefined ? extracted[name] : '').join('\n');
      }
    }

    return str;
  }
}

/**
 * Bracket-aware parser for key-value strings like "nums = [2,7,11,15], target = 9"
 */
function parseNamedParameters(str, paramNames = []) {
  const result = {};
  if (!str || typeof str !== 'string') return result;

  const trimmed = str.trim();
  for (const pName of paramNames) {
    const regex = new RegExp(`(?:^|[,;\\s])${pName}\\s*=`, 'i');
    const match = trimmed.match(regex);
    if (match && match.index !== undefined) {
      const valStartIndex = match.index + match[0].length;
      let valEndIndex = trimmed.length;
      let bracketDepth = 0;
      let inQuotes = false;
      let quoteChar = '';

      for (let i = valStartIndex; i < trimmed.length; i++) {
        const ch = trimmed[i];

        if (inQuotes) {
          if (ch === quoteChar && trimmed[i - 1] !== '\\') {
            inQuotes = false;
          }
        } else {
          if (ch === '"' || ch === "'") {
            inQuotes = true;
            quoteChar = ch;
          } else if (ch === '[' || ch === '{' || ch === '(') {
            bracketDepth++;
          } else if (ch === ']' || ch === '}' || ch === ')') {
            bracketDepth--;
          } else if ((ch === ',' || ch === ';' || ch === '\n') && bracketDepth === 0) {
            valEndIndex = i;
            break;
          }
        }
      }

      result[pName] = trimmed.slice(valStartIndex, valEndIndex).trim();
    }
  }

  return result;
}

module.exports = BaseLanguageAdapter;
