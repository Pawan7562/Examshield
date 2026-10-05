// backend/coding-engine/adapters/CppAdapter.js
const BaseLanguageAdapter = require('./BaseLanguageAdapter');
const { wrapCppFunction } = require('../runners/cpp/functionRunner');
const { wrapCppStdin } = require('../runners/cpp/stdinRunner');

class CppAdapter extends BaseLanguageAdapter {
  constructor() {
    super('cpp', 'C++', 54, true);
  }

  generateSource(studentCode, executionMode = 'FUNCTION_BASED', metadata = {}) {
    const mode = (executionMode || metadata.executionMode || 'FUNCTION_BASED').toUpperCase();
    if (mode === 'STANDARD_INPUT_OUTPUT' || mode === 'STDIN_STDOUT') {
      return wrapCppStdin(studentCode);
    }
    return wrapCppFunction(studentCode, metadata);
  }

  generateStarterCode(metadata = {}) {
    const className = metadata.className || 'Solution';
    const functionName = metadata.functionName || 'twoSum';
    const returnType = metadata.returnType || 'vector<int>';
    const parameters = metadata.parameters || [
      { name: 'nums', type: 'vector<int>&' },
      { name: 'target', type: 'int' }
    ];

    const paramStr = parameters.map(p => {
      let t = p.type || 'int';
      if (t.startsWith('vector') && !t.includes('&')) {
        t = `${t}&`;
      }
      return `${t} ${p.name}`;
    }).join(', ');

    return `class ${className} {
public:
    ${returnType} ${functionName}(${paramStr}) {
        // Write your solution here
        
    }
};`;
  }
}

module.exports = CppAdapter;
