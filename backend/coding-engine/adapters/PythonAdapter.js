// backend/coding-engine/adapters/PythonAdapter.js
const BaseLanguageAdapter = require('./BaseLanguageAdapter');
const { wrapPythonFunction } = require('../runners/python/functionRunner');
const { wrapPythonStdin } = require('../runners/python/stdinRunner');

class PythonAdapter extends BaseLanguageAdapter {
  constructor() {
    super('python', 'Python', 71, false);
  }

  generateSource(studentCode, executionMode = 'FUNCTION_BASED', metadata = {}) {
    const mode = (executionMode || metadata.executionMode || 'FUNCTION_BASED').toUpperCase();
    if (mode === 'STANDARD_INPUT_OUTPUT' || mode === 'STDIN_STDOUT') {
      return wrapPythonStdin(studentCode);
    }
    return wrapPythonFunction(studentCode, metadata);
  }

  generateStarterCode(metadata = {}) {
    const className = metadata.className || 'Solution';
    const functionName = metadata.functionName || 'twoSum';
    const returnType = metadata.returnType || 'list[int]';
    const parameters = metadata.parameters || [
      { name: 'nums', type: 'list[int]' },
      { name: 'target', type: 'int' }
    ];

    const paramStr = ['self', ...parameters.map(p => `${p.name}: ${p.type || 'Any'}`)].join(', ');

    return `class ${className}:
    def ${functionName}(${paramStr}) -> ${returnType}:
        # Write your solution here
        pass
`;
  }
}

module.exports = PythonAdapter;
