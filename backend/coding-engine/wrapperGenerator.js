// backend/coding-engine/wrapperGenerator.js
// Automatic Wrapper Generator for ExamShield Coding Engine

const { getAdapter } = require('./adapters');

/**
 * Resolves whether the submission should run in FUNCTION_BASED or STANDARD_INPUT_OUTPUT mode
 */
function resolveExecutionMode(studentCode = '', questionMetadata = {}) {
  // 1. Explicit metadata priority
  const explicitMode = questionMetadata.executionMode || questionMetadata.execution_mode;
  if (explicitMode) {
    const norm = String(explicitMode).toUpperCase().trim();
    if (norm === 'FUNCTION_BASED' || norm === 'FUNCTION') return 'FUNCTION_BASED';
    if (norm === 'STANDARD_INPUT_OUTPUT' || norm === 'STDIN_STDOUT' || norm === 'STANDARD_IO') return 'STANDARD_INPUT_OUTPUT';
  }

  const execFormat = questionMetadata.executionFormat || questionMetadata.execution_format;
  if (execFormat) {
    const norm = String(execFormat).toLowerCase().trim();
    if (norm === 'function' || norm === 'function_based') return 'FUNCTION_BASED';
    if (norm === 'stdin_stdout' || norm === 'standard_io') return 'STANDARD_INPUT_OUTPUT';
  }

  // If questionMetadata explicitly specifies functionName or className, it's FUNCTION_BASED
  if (questionMetadata.functionName || questionMetadata.className) {
    return 'FUNCTION_BASED';
  }

  // 2. Intelligent heuristics from student code
  const code = String(studentCode || '').trim();
  const hasClassSolution = /class\s+Solution/i.test(code);
  const hasStdIn = /(sys\.stdin|input\s*\(|cin\s*>>|scanf\s*\(|Scanner|System\.in|BufferedReader|fs\.readFileSync|process\.stdin|readline)/i.test(code);
  const hasMain = /(int|void)\s+main\s*\(|def\s+main\s*\(|public\s+static\s+void\s+main/i.test(code);

  if (hasClassSolution && !hasStdIn) {
    return 'FUNCTION_BASED';
  }

  if (hasMain || hasStdIn) {
    return 'STANDARD_INPUT_OUTPUT';
  }

  if (hasClassSolution) {
    return 'FUNCTION_BASED';
  }

  // If no function signature/class is given (e.g. top-level print/script), default to standard I/O
  return 'STANDARD_INPUT_OUTPUT';
}

/**
 * Splits parameter string by top-level commas, respecting template brackets < >
 */
function splitParamTokens(rawParams) {
  const tokens = [];
  let depth = 0;
  let cur = '';
  for (let i = 0; i < rawParams.length; i++) {
    const ch = rawParams[i];
    if (ch === '<' || ch === '(' || ch === '[' || ch === '{') {
      depth++;
      cur += ch;
    } else if (ch === '>' || ch === ')' || ch === ']' || ch === '}') {
      depth = Math.max(0, depth - 1);
      cur += ch;
    } else if (ch === ',' && depth === 0) {
      if (cur.trim()) tokens.push(cur.trim());
      cur = '';
    } else {
      cur += ch;
    }
  }
  if (cur.trim()) tokens.push(cur.trim());
  return tokens;
}

/**
 * Intelligently infers function metadata from student code when missing from question options
 */
function inferMetadataFromCode(studentCode = '', language = 'cpp') {
  const code = String(studentCode || '').trim();
  const lang = String(language || '').toLowerCase().trim();

  // 1. C++
  if (lang === 'cpp' || lang === 'c++') {
    const classMatch = code.match(/class\s+([a-zA-Z_][a-zA-Z0-9_]*)/);
    const className = classMatch ? classMatch[1] : 'Solution';

    const fnRegex = /(?:public\s*:[\s\S]*?)?([a-zA-Z0-9_<>:&* ]+?)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(([^)]*)\)\s*\{/;
    const fnMatch = code.match(fnRegex);
    if (fnMatch) {
      const returnType = fnMatch[1].trim().replace(/^public\s*:\s*/, '').trim();
      const functionName = fnMatch[2].trim();
      const rawParams = fnMatch[3].trim();
      const parameters = [];

      if (rawParams) {
        const tokens = splitParamTokens(rawParams);
        for (const tok of tokens) {
          const parts = tok.trim().split(/\s+/);
          if (parts.length >= 2) {
            let name = parts[parts.length - 1];
            let type = parts.slice(0, parts.length - 1).join(' ');
            if (name.startsWith('&') || name.startsWith('*')) {
              type += name[0];
              name = name.slice(1);
            }
            parameters.push({ name: name.replace(/[^a-zA-Z0-9_]/g, ''), type });
          }
        }
      }

      if (functionName && functionName !== 'main' && functionName !== className) {
        return { className, functionName, returnType, parameters };
      }
    }
  }

  // 2. Python
  if (lang === 'python' || lang === 'py') {
    const pyFnMatch = code.match(/def\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(([^)]*)\)(?:\s*->\s*([a-zA-Z0-9_[\] ]+))?:/);
    if (pyFnMatch) {
      const functionName = pyFnMatch[1].trim();
      const rawParams = pyFnMatch[2].trim();
      const returnType = pyFnMatch[3] ? pyFnMatch[3].trim() : 'Any';
      const parameters = [];

      if (rawParams) {
        const tokens = rawParams.split(',').map(s => s.trim()).filter(Boolean);
        for (const tok of tokens) {
          if (tok === 'self' || tok === 'cls') continue;
          const [pName, pType] = tok.split(':').map(s => s.trim());
          parameters.push({ name: pName, type: pType || 'any' });
        }
      }

      if (functionName && functionName !== 'main') {
        return { className: 'Solution', functionName, returnType, parameters };
      }
    }
  }

  // 3. Java
  if (lang === 'java') {
    const classMatch = code.match(/class\s+([a-zA-Z_][a-zA-Z0-9_]*)/);
    const className = classMatch ? classMatch[1] : 'Solution';
    const javaFnMatch = code.match(/(?:public|protected|private)?\s*(?:static\s+)?([a-zA-Z0-9_<>[\] ]+?)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(([^)]*)\)\s*\{/);
    if (javaFnMatch) {
      const returnType = javaFnMatch[1].trim();
      const functionName = javaFnMatch[2].trim();
      const rawParams = javaFnMatch[3].trim();
      const parameters = [];

      if (rawParams) {
        const tokens = splitParamTokens(rawParams);
        for (const tok of tokens) {
          const parts = tok.trim().split(/\s+/);
          if (parts.length >= 2) {
            const name = parts[parts.length - 1];
            const type = parts.slice(0, parts.length - 1).join(' ');
            parameters.push({ name: name.replace(/[^a-zA-Z0-9_]/g, ''), type });
          }
        }
      }

      if (functionName && functionName !== 'main' && functionName !== className) {
        return { className, functionName, returnType, parameters };
      }
    }
  }

  // 4. JavaScript
  if (lang === 'javascript' || lang === 'js') {
    const jsFnMatch = code.match(/(?:function\s+([a-zA-Z_][a-zA-Z0-9_]*)|var\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*function|const\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(?:\([^)]*\)|[a-zA-Z_][a-zA-Z0-9_]*)\s*=>)\s*\(?([^)]*)\)?/);
    if (jsFnMatch) {
      const functionName = (jsFnMatch[1] || jsFnMatch[2] || jsFnMatch[3] || '').trim();
      const rawParams = (jsFnMatch[4] || '').trim();
      const parameters = [];

      if (rawParams) {
        const tokens = rawParams.split(',').map(s => s.trim()).filter(Boolean);
        for (const tok of tokens) {
          const pName = tok.split('=')[0].trim().replace(/[^a-zA-Z0-9_]/g, '');
          if (pName) parameters.push({ name: pName, type: 'any' });
        }
      }

      if (functionName && functionName !== 'main') {
        return { className: 'Solution', functionName, returnType: 'any', parameters };
      }
    }
  }

  return {};
}

/**
 * Generates the complete, compilable, and executable source code
 */
function generateCompleteSource(studentCode, language = 'cpp', questionMetadata = {}) {
  const adapter = getAdapter(language);
  const inferred = inferMetadataFromCode(studentCode, language);

  const resolvedMetadata = {
    ...inferred,
    ...questionMetadata,
    functionName: questionMetadata.functionName || inferred.functionName,
    className: questionMetadata.className || inferred.className,
    returnType: questionMetadata.returnType || inferred.returnType,
    parameters: (Array.isArray(questionMetadata.parameters) && questionMetadata.parameters.length > 0)
      ? questionMetadata.parameters
      : (inferred.parameters && inferred.parameters.length > 0 ? inferred.parameters : []),
  };

  const mode = resolveExecutionMode(studentCode, resolvedMetadata);
  if (mode === 'FUNCTION_BASED' && !resolvedMetadata.className) {
    resolvedMetadata.className = 'Solution';
  }
  const completeSource = adapter.generateSource(studentCode, mode, resolvedMetadata);

  return {
    completeSource,
    executionMode: mode,
    resolvedMetadata,
    adapter,
  };
}

module.exports = {
  resolveExecutionMode,
  generateCompleteSource,
  inferMetadataFromCode,
};
