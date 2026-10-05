// backend/coding-engine/index.js
// Main entrypoint for ExamShield Modern Coding Engine

const { getAdapter, registerAdapter } = require('./adapters');
const { resolveExecutionMode, generateCompleteSource } = require('./wrapperGenerator');
const { compileOnce, sanitizeCompilerError, executeOnJudge0 } = require('./secureSandbox');
const { compareOutputs, normalizeOutput } = require('./comparator');
const { evaluateSubmission, normalizeTestCaseList } = require('./testRunner');

module.exports = {
  getAdapter,
  registerAdapter,
  resolveExecutionMode,
  generateCompleteSource,
  compileOnce,
  sanitizeCompilerError,
  executeOnJudge0,
  compareOutputs,
  normalizeOutput,
  evaluateSubmission,
  normalizeTestCaseList,
};
