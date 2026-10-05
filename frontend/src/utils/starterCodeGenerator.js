// frontend/src/utils/starterCodeGenerator.js
// Enterprise Multi-Language Starter Code Generator for ExamShield IDE

/**
 * Parses function signatures from code templates (C++, Java, Python, JS)
 * e.g., "int findMax(vector<int>& nums)" or "def twoSum(self, nums: List[int], target: int) -> List[int]:"
 */
export function parseTemplateSignature(templateStr) {
  if (!templateStr || typeof templateStr !== 'string') return null;

  // 1. C++ / Java / C# signature inside or outside class
  // e.g., "int findMax(vector<int>& nums)" or "public int[] twoSum(vector<int>& nums, int target)"
  const cppJavaRegex = /(?:public\s+|private\s+|protected\s+)?(?:static\s+)?([a-zA-Z0-9_<>,:&*]+)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(([^)]*)\)/;
  const matchCpp = templateStr.match(cppJavaRegex);
  if (matchCpp) {
    const rawRet = matchCpp[1].trim();
    const fnName = matchCpp[2].trim();
    const rawParams = matchCpp[3].trim();

    // Ignore control flow keywords or constructors
    const ignored = new Set(['main', 'if', 'while', 'for', 'switch', 'class', 'struct', 'catch']);
    if (!ignored.has(fnName)) {
      const parsedParams = [];
      if (rawParams) {
        const parts = rawParams.split(',');
        for (const part of parts) {
          const trimmed = part.trim();
          if (!trimmed) continue;
          const lastSpace = trimmed.lastIndexOf(' ');
          if (lastSpace !== -1) {
            const pType = trimmed.slice(0, lastSpace).trim();
            const pName = trimmed.slice(lastSpace + 1).replace(/[&*]/g, '').trim();
            parsedParams.push({ name: pName, type: pType });
          } else {
            parsedParams.push({ name: trimmed, type: 'int' });
          }
        }
      }

      return {
        functionName: fnName,
        returnType: rawRet,
        parameters: parsedParams
      };
    }
  }

  // 2. Python signature: def functionName(self, arg1: type, ...):
  const pyRegex = /def\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(([^)]*)\)(?:\s*->\s*([a-zA-Z0-9_\[\], ]+))?/;
  const matchPy = templateStr.match(pyRegex);
  if (matchPy) {
    const fnName = matchPy[1].trim();
    const rawParams = matchPy[2].trim();
    const rawRet = matchPy[3] ? matchPy[3].trim() : 'Any';

    const parsedParams = [];
    if (rawParams) {
      const parts = rawParams.split(',');
      for (let part of parts) {
        part = part.trim();
        if (!part || part === 'self' || part === 'cls') continue;
        const [pName, pType] = part.split(':').map(s => s.trim());
        parsedParams.push({ name: pName, type: pType || 'int' });
      }
    }

    return {
      functionName: fnName,
      returnType: rawRet,
      parameters: parsedParams
    };
  }

  // 3. JavaScript signature: var functionName = function(...) or function functionName(...)
  const jsRegex = /(?:var|let|const|function)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*(?:=\s*function\s*)?\(([^)]*)\)/;
  const matchJs = templateStr.match(jsRegex);
  if (matchJs) {
    const fnName = matchJs[1].trim();
    const rawParams = matchJs[2].trim();
    const parsedParams = [];
    if (rawParams) {
      const parts = rawParams.split(',');
      for (let part of parts) {
        const pName = part.trim();
        if (pName) parsedParams.push({ name: pName, type: 'int' });
      }
    }
    return {
      functionName: fnName,
      returnType: 'int',
      parameters: parsedParams
    };
  }

  return null;
}

/**
 * Normalizes question options/metadata into a clean structured object
 */
export function extractQuestionMetadata(question) {
  if (!question) {
    return {
      executionMode: 'FUNCTION_BASED',
      className: 'Solution',
      functionName: 'twoSum',
      returnType: 'vector<int>',
      parameters: [
        { name: 'nums', type: 'vector<int>' },
        { name: 'target', type: 'int' }
      ]
    };
  }

  let opts = {};
  if (question.options) {
    try {
      opts = typeof question.options === 'string' ? JSON.parse(question.options) : question.options;
    } catch (_) {}
  }

  // Execution mode resolution
  let executionMode = opts.executionMode || opts.execution_mode || question.executionMode || question.execution_mode;
  if (!executionMode) {
    const format = opts.executionFormat || opts.execution_format || question.executionFormat || question.execution_format;
    if (format === 'stdin_stdout' || format === 'standard_io') {
      executionMode = 'STANDARD_INPUT_OUTPUT';
    } else {
      executionMode = 'FUNCTION_BASED';
    }
  }

  // Class name
  const className = opts.className || opts.class_name || question.className || 'Solution';

  // Parse signature from template if available
  const templateStr = question.code_template || question.codeTemplate || opts.code_template || opts.codeTemplate || opts.starterCode;
  const sig = parseTemplateSignature(templateStr);

  // Function name
  let functionName = opts.functionName || opts.function_name || question.functionName || (sig && sig.functionName);
  if (!functionName) {
    const text = question.title || question.question_text || question.problemStatement || '';
    if (/two\s*sum/i.test(text)) {
      functionName = 'twoSum';
    } else if (/largest|max/i.test(text) && /element|array/i.test(text)) {
      functionName = 'findMax';
    } else if (/palindrome/i.test(text)) {
      functionName = 'isPalindrome';
    } else if (/parenthes/i.test(text)) {
      functionName = 'isValid';
    } else if (/reverse.*string/i.test(text)) {
      functionName = 'reverseString';
    } else if (/reverse.*array/i.test(text)) {
      functionName = 'reverseArray';
    } else {
      const match = text.match(/(?:function|def|method)\s+([a-zA-Z_][a-zA-Z0-9_]*)/i);
      functionName = match ? match[1] : 'solution';
    }
  }

  // Parameters
  let parameters = opts.parameters || question.parameters || (sig && sig.parameters);
  if (!Array.isArray(parameters) || parameters.length === 0) {
    if (functionName === 'findMax') {
      parameters = [{ name: 'nums', type: 'vector<int>' }];
    } else if (functionName === 'twoSum') {
      parameters = [
        { name: 'nums', type: 'vector<int>' },
        { name: 'target', type: 'int' }
      ];
    } else if (functionName === 'isPalindrome' || functionName === 'reverseString') {
      parameters = [{ name: 's', type: 'string' }];
    } else if (functionName === 'reverseArray') {
      parameters = [{ name: 'arr', type: 'vector<int>' }];
    } else {
      parameters = [{ name: 'nums', type: 'vector<int>' }];
    }
  }

  // Return type
  let returnType = opts.returnType || opts.return_type || question.returnType || (sig && sig.returnType);
  if (!returnType) {
    if (functionName === 'findMax') returnType = 'int';
    else if (functionName === 'twoSum') returnType = 'vector<int>';
    else if (functionName === 'isPalindrome' || functionName === 'isValid') returnType = 'bool';
    else if (functionName === 'reverseString') returnType = 'string';
    else if (functionName === 'reverseArray') returnType = 'void';
    else returnType = 'int';
  }

  const isStdIO = /std|standard|stdin/i.test(String(executionMode || '')) ||
                  /std|standard|stdin/i.test(String(opts.executionFormat || opts.execution_format || ''));

  return {
    executionMode: isStdIO ? 'STANDARD_INPUT_OUTPUT' : 'FUNCTION_BASED',
    className,
    functionName,
    returnType,
    parameters
  };
}

/**
 * Type mapper from C++/generic types to language-specific representations
 */
function mapType(rawType = 'int', lang = 'cpp') {
  const norm = rawType.trim().toLowerCase().replace(/\s+/g, '').replace(/[&*]/g, '');

  if (lang === 'cpp') {
    if (norm === 'int') return 'int';
    if (norm === 'long' || norm === 'longlong' || norm === 'int64_t') return 'long long';
    if (norm === 'double' || norm === 'float') return 'double';
    if (norm === 'bool' || norm === 'boolean') return 'bool';
    if (norm === 'string') return 'string';
    if (norm === 'vector<int>' || norm === 'int[]') return 'vector<int>&';
    if (norm === 'vector<string>' || norm === 'string[]') return 'vector<string>&';
    if (norm === 'vector<double>' || norm === 'double[]') return 'vector<double>&';
    if (norm === 'vector<vector<int>>' || norm === 'int[][]') return 'vector<vector<int>>&';
    return rawType;
  }

  if (lang === 'python') {
    if (norm === 'int') return 'int';
    if (norm === 'long' || norm === 'longlong') return 'int';
    if (norm === 'double' || norm === 'float') return 'float';
    if (norm === 'bool' || norm === 'boolean') return 'bool';
    if (norm === 'string') return 'str';
    if (norm === 'vector<int>' || norm === 'int[]') return 'List[int]';
    if (norm === 'vector<string>' || norm === 'string[]') return 'List[str]';
    if (norm === 'vector<double>' || norm === 'double[]') return 'List[float]';
    if (norm === 'vector<vector<int>>' || norm === 'int[][]') return 'List[List[int]]';
    if (norm === 'void') return 'None';
    return 'Any';
  }

  if (lang === 'java') {
    if (norm === 'int') return 'int';
    if (norm === 'long' || norm === 'longlong') return 'long';
    if (norm === 'double') return 'double';
    if (norm === 'float') return 'float';
    if (norm === 'bool' || norm === 'boolean') return 'boolean';
    if (norm === 'string') return 'String';
    if (norm === 'vector<int>' || norm === 'int[]') return 'int[]';
    if (norm === 'vector<string>' || norm === 'string[]') return 'String[]';
    if (norm === 'vector<double>' || norm === 'double[]') return 'double[]';
    if (norm === 'vector<vector<int>>' || norm === 'int[][]') return 'int[][]';
    if (norm === 'void') return 'void';
    return 'Object';
  }

  if (lang === 'javascript') {
    if (norm === 'int' || norm === 'long' || norm === 'double' || norm === 'float') return 'number';
    if (norm === 'bool' || norm === 'boolean') return 'boolean';
    if (norm === 'string') return 'string';
    if (norm === 'vector<int>' || norm === 'int[]') return 'number[]';
    if (norm === 'vector<string>' || norm === 'string[]') return 'string[]';
    if (norm === 'vector<vector<int>>' || norm === 'int[][]') return 'number[][]';
    if (norm === 'void') return 'void';
    return 'any';
  }

  return rawType;
}

/**
 * Return type mapper (without reference & for C++)
 */
function mapReturnType(rawType = 'void', lang = 'cpp') {
  const norm = rawType.trim().toLowerCase().replace(/\s+/g, '').replace(/[&*]/g, '');

  if (lang === 'cpp') {
    if (norm === 'int') return 'int';
    if (norm === 'long' || norm === 'longlong') return 'long long';
    if (norm === 'double' || norm === 'float') return 'double';
    if (norm === 'bool' || norm === 'boolean') return 'bool';
    if (norm === 'string') return 'string';
    if (norm === 'vector<int>' || norm === 'int[]') return 'vector<int>';
    if (norm === 'vector<string>' || norm === 'string[]') return 'vector<string>';
    if (norm === 'vector<vector<int>>' || norm === 'int[][]') return 'vector<vector<int>>';
    if (norm === 'void') return 'void';
    return rawType.replace(/[&*]/g, '');
  }

  return mapType(rawType, lang);
}

/**
 * Generates default starter code for any supported language and question metadata
 */
export function generateStarterCode(language = 'cpp', metadata = {}) {
  const mode = metadata.executionMode || 'FUNCTION_BASED';
  const className = metadata.className || 'Solution';
  const functionName = metadata.functionName || 'twoSum';
  const rawParams = Array.isArray(metadata.parameters) && metadata.parameters.length > 0
    ? metadata.parameters
    : [{ name: 'nums', type: 'vector<int>' }];
  const rawReturnType = metadata.returnType || 'int';

  // 1. C++
  if (language === 'cpp' || language === 'c++') {
    if (mode === 'STANDARD_INPUT_OUTPUT') {
      return `#include <iostream>
#include <vector>
#include <string>
#include <algorithm>

using namespace std;

int main() {
    // Fast I/O
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    // Write your solution here: read with cin and output with cout
    

    return 0;
}`;
    }

    const retType = mapReturnType(rawReturnType, 'cpp');
    const paramStr = rawParams.map(p => `${mapType(p.type || 'int', 'cpp')} ${p.name}`).join(', ');

    return `#include <iostream>
#include <vector>
#include <string>
#include <algorithm>
#include <unordered_map>
#include <unordered_set>

using namespace std;

class ${className} {
public:
    ${retType} ${functionName}(${paramStr}) {
        // Write your code here
        
    }
};`;
  }

  // 2. Python 3
  if (language === 'python' || language === 'py') {
    if (mode === 'STANDARD_INPUT_OUTPUT') {
      return `import sys

def main():
    # Read input from standard input
    input_data = sys.stdin.read().strip()
    if not input_data:
        return
    
    # Write your solution here: process input_data and print result
    

if __name__ == '__main__':
    main()`;
    }

    const pyRet = mapReturnType(rawReturnType, 'python');
    const pyParams = ['self']
      .concat(rawParams.map(p => `${p.name}: ${mapType(p.type || 'int', 'python')}`))
      .join(', ');

    return `from typing import List, Optional

class ${className}:
    def ${functionName}(${pyParams}) -> ${pyRet}:
        # Write your code here
        pass`;
  }

  // 3. Java
  if (language === 'java') {
    if (mode === 'STANDARD_INPUT_OUTPUT') {
      return `import java.util.*;
import java.io.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        // Write your solution here: read from sc and print to System.out
        
    }
}`;
    }

    const javaRet = mapReturnType(rawReturnType, 'java');
    const javaParams = rawParams.map(p => `${mapType(p.type || 'int', 'java')} ${p.name}`).join(', ');
    
    let defaultReturn = '';
    if (javaRet === 'int' || javaRet === 'long') defaultReturn = 'return 0;';
    else if (javaRet === 'boolean') defaultReturn = 'return false;';
    else if (javaRet.endsWith('[]')) defaultReturn = `return new ${javaRet}{};`;
    else if (javaRet === 'String') defaultReturn = 'return "";';
    else if (javaRet === 'double' || javaRet === 'float') defaultReturn = 'return 0.0;';

    return `import java.util.*;

class ${className} {
    public ${javaRet} ${functionName}(${javaParams}) {
        // Write your code here
        ${defaultReturn ? `\n        ${defaultReturn}` : ''}
    }
}`;
  }

  // 4. JavaScript (Node.js)
  if (language === 'javascript' || language === 'js') {
    if (mode === 'STANDARD_INPUT_OUTPUT') {
      return `const fs = require('fs');

function main() {
  const input = fs.readFileSync(0, 'utf-8').trim();
  if (!input) return;

  // Write your solution here: process input and output with console.log
  
}

main();`;
    }

    const jsRet = mapReturnType(rawReturnType, 'javascript');
    const jsDocParams = rawParams.map(p => ` * @param {${mapType(p.type || 'int', 'javascript')}} ${p.name}`).join('\n');
    const paramNames = rawParams.map(p => p.name).join(', ');

    return `/**
${jsDocParams}
 * @return {${jsRet}}
 */
var ${functionName} = function(${paramNames}) {
  // Write your code here
  
};`;
  }

  return '// Language starter template';
}
