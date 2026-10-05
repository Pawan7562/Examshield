// backend/coding-engine/adapters/index.js
const CppAdapter = require('./CppAdapter');
const PythonAdapter = require('./PythonAdapter');
const JavaScriptAdapter = require('./JavaScriptAdapter');
const JavaAdapter = require('./JavaAdapter');

const registry = new Map();

// Register built-in language adapters
const cpp = new CppAdapter();
const python = new PythonAdapter();
const javascript = new JavaScriptAdapter();
const java = new JavaAdapter();

[cpp, python, javascript, java].forEach(adapter => {
  registry.set(adapter.languageId.toLowerCase(), adapter);
});

// Aliases
registry.set('c++', cpp);
registry.set('py', python);
registry.set('python3', python);
registry.set('js', javascript);
registry.set('node', javascript);

/**
 * Retrieves the language adapter for a given language string
 */
function getAdapter(language) {
  const key = (language || 'javascript').toLowerCase().trim();
  const adapter = registry.get(key);
  if (!adapter) {
    // Default to JavaScript if unsupported, or throw descriptive error
    return registry.get('javascript');
  }
  return adapter;
}

/**
 * Extension point: Register a new language adapter at runtime
 */
function registerAdapter(languageId, adapterInstance) {
  registry.set(languageId.toLowerCase().trim(), adapterInstance);
}

module.exports = {
  getAdapter,
  registerAdapter,
  CppAdapter,
  PythonAdapter,
  JavaScriptAdapter,
  JavaAdapter,
};
