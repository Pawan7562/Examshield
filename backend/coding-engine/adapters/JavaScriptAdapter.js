// backend/coding-engine/adapters/JavaScriptAdapter.js
const BaseLanguageAdapter = require('./BaseLanguageAdapter');
const { wrapJavaScriptFunction } = require('../runners/javascript/functionRunner');
const { wrapJavaScriptStdin } = require('../runners/javascript/stdinRunner');

class JavaScriptAdapter extends BaseLanguageAdapter {
  constructor() {
    super('javascript', 'JavaScript', 63, false);
  }

  generateSource(studentCode, executionMode = 'FUNCTION_BASED', metadata = {}) {
    const mode = (executionMode || metadata.executionMode || 'FUNCTION_BASED').toUpperCase();
    if (mode === 'STANDARD_INPUT_OUTPUT' || mode === 'STDIN_STDOUT') {
      return wrapJavaScriptStdin(studentCode);
    }
    return wrapJavaScriptFunction(studentCode, metadata);
  }

  generateStarterCode(metadata = {}) {
    const className = metadata.className || 'Solution';
    const functionName = metadata.functionName || 'twoSum';
    const parameters = metadata.parameters || [
      { name: 'nums', type: 'number[]' },
      { name: 'target', type: 'number' }
    ];

    const jsDocParams = parameters.map(p => ` * @param {${p.type || 'any'}} ${p.name}`).join('\n');
    const paramNames = parameters.map(p => p.name).join(', ');

    return `/**
${jsDocParams}
 * @return {${metadata.returnType || 'any'}}
 */
var ${functionName} = function(${paramNames}) {
    // Write your solution here
    
};`;
  }
}

module.exports = JavaScriptAdapter;
