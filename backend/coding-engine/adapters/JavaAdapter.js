// backend/coding-engine/adapters/JavaAdapter.js
const BaseLanguageAdapter = require('./BaseLanguageAdapter');
const { wrapJavaFunction } = require('../runners/java/functionRunner');
const { wrapJavaStdin } = require('../runners/java/stdinRunner');

class JavaAdapter extends BaseLanguageAdapter {
  constructor() {
    super('java', 'Java', 62, true);
  }

  generateSource(studentCode, executionMode = 'FUNCTION_BASED', metadata = {}) {
    const mode = (executionMode || metadata.executionMode || 'FUNCTION_BASED').toUpperCase();
    if (mode === 'STANDARD_INPUT_OUTPUT' || mode === 'STDIN_STDOUT') {
      return wrapJavaStdin(studentCode);
    }
    return wrapJavaFunction(studentCode, metadata);
  }

  generateStarterCode(metadata = {}) {
    const className = metadata.className || 'Solution';
    const functionName = metadata.functionName || 'twoSum';
    const returnType = metadata.returnType || 'int[]';
    const parameters = metadata.parameters || [
      { name: 'nums', type: 'int[]' },
      { name: 'target', type: 'int' }
    ];

    const paramStr = parameters.map(p => `${p.type || 'int'} ${p.name}`).join(', ');

    return `class ${className} {
    public ${returnType} ${functionName}(${paramStr}) {
        // Write your solution here
        
    }
}`;
  }
}

module.exports = JavaAdapter;
