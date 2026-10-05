// backend/coding-engine/runners/cpp/functionRunner.js
// C++ Automatic Wrapper Generator for FUNCTION_BASED (LeetCode style) evaluation

function getCppDeserializer(type, varName, lineVar) {
  const normType = (type || 'int')
    .trim()
    .toLowerCase()
    .replace(/\bconst\b/g, '')
    .replace(/\s+/g, '')
    .replace(/[&*]/g, '');

  if (normType === 'int') {
    return `int ${varName} = parseInt(${lineVar});`;
  }
  if (normType === 'long' || normType === 'longlong' || normType === 'int64_t') {
    return `long long ${varName} = parseLong(${lineVar});`;
  }
  if (normType === 'double' || normType === 'float') {
    return `double ${varName} = parseDouble(${lineVar});`;
  }
  if (normType === 'bool' || normType === 'boolean') {
    return `bool ${varName} = parseBool(${lineVar});`;
  }
  if (normType === 'string' || normType === 'std::string') {
    return `string ${varName} = parseString(${lineVar});`;
  }
  if (normType === 'vector<int>' || normType === 'int[]') {
    return `vector<int> ${varName} = parseVectorInt(${lineVar});`;
  }
  if (normType === 'vector<string>' || normType === 'string[]') {
    return `vector<string> ${varName} = parseVectorString(${lineVar});`;
  }
  if (normType === 'vector<double>' || normType === 'double[]') {
    return `vector<double> ${varName} = parseVectorDouble(${lineVar});`;
  }
  if (normType === 'vector<vector<int>>' || normType === 'int[][]') {
    return `vector<vector<int>> ${varName} = parseVectorVectorInt(${lineVar});`;
  }

  // Fallback
  return `string ${varName} = parseString(${lineVar});`;
}

function wrapCppFunction(studentCode, metadata = {}) {
  const className = metadata.className || 'Solution';
  const functionName = metadata.functionName || 'twoSum';
  const parameters = Array.isArray(metadata.parameters) && metadata.parameters.length > 0
    ? metadata.parameters
    : [
        { name: 'nums', type: 'vector<int>' },
        { name: 'target', type: 'int' }
      ];

  // Parameter parsing statements
  const paramParsingLines = parameters.map((param, idx) => {
    const pName = param.name || `arg_${idx}`;
    const pType = param.type || 'int';
    const lineVar = `__line_${idx}`;
    const deserializer = getCppDeserializer(pType, pName, lineVar);

    return `    string ${lineVar};
    if (!getline(cin, ${lineVar})) {
        ${lineVar} = "";
    }
    ${deserializer}`;
  }).join('\n\n');

  const paramCallArgs = parameters.map((param, idx) => param.name || `arg_${idx}`).join(', ');

  return `// ============================================================================
// Auto-Generated ExamShield C++ LeetCode Test Harness
// Mode: FUNCTION_BASED
// ============================================================================
#include <iostream>
#include <vector>
#include <string>
#include <sstream>
#include <unordered_map>
#include <map>
#include <unordered_set>
#include <set>
#include <queue>
#include <stack>
#include <algorithm>
#include <cmath>
#include <iomanip>
#include <cctype>

using namespace std;

// ── DESERIALIZATION & SERIALIZATION ENGINE ──────────────────────────────────
static inline string trimString(const string& s) {
    size_t start = s.find_first_not_of(" \\t\\r\\n");
    if (start == string::npos) return "";
    size_t end = s.find_last_not_of(" \\t\\r\\n");
    return s.substr(start, end - start + 1);
}

static inline int parseInt(string s) {
    s = trimString(s);
    if (s.empty()) return 0;
    try { return stoi(s); } catch (...) { return 0; }
}

static inline long long parseLong(string s) {
    s = trimString(s);
    if (s.empty()) return 0LL;
    try { return stoll(s); } catch (...) { return 0LL; }
}

static inline double parseDouble(string s) {
    s = trimString(s);
    if (s.empty()) return 0.0;
    try { return stod(s); } catch (...) { return 0.0; }
}

static inline bool parseBool(string s) {
    s = trimString(s);
    for (auto &c : s) c = tolower(c);
    return (s == "true" || s == "1");
}

static inline string parseString(string s) {
    s = trimString(s);
    if (s.size() >= 2 && ((s.front() == '"' && s.back() == '"') || (s.front() == '\\'' && s.back() == '\\''))) {
        return s.substr(1, s.size() - 2);
    }
    return s;
}

static inline vector<int> parseVectorInt(string s) {
    vector<int> res;
    s = trimString(s);
    if (s.empty()) return res;
    if (s.front() == '[') s = s.substr(1);
    if (!s.empty() && s.back() == ']') s.pop_back();
    stringstream ss(s);
    string token;
    while (getline(ss, token, ',')) {
        string t = trimString(token);
        if (!t.empty()) {
            try { res.push_back(stoi(t)); } catch (...) {}
        }
    }
    return res;
}

static inline vector<string> parseVectorString(string s) {
    vector<string> res;
    s = trimString(s);
    if (s.empty()) return res;
    if (s.front() == '[') s = s.substr(1);
    if (!s.empty() && s.back() == ']') s.pop_back();
    stringstream ss(s);
    string token;
    while (getline(ss, token, ',')) {
        res.push_back(parseString(token));
    }
    return res;
}

static inline vector<double> parseVectorDouble(string s) {
    vector<double> res;
    s = trimString(s);
    if (s.empty()) return res;
    if (s.front() == '[') s = s.substr(1);
    if (!s.empty() && s.back() == ']') s.pop_back();
    stringstream ss(s);
    string token;
    while (getline(ss, token, ',')) {
        string t = trimString(token);
        if (!t.empty()) {
            try { res.push_back(stod(t)); } catch (...) {}
        }
    }
    return res;
}

static inline vector<vector<int>> parseVectorVectorInt(string s) {
    vector<vector<int>> res;
    s = trimString(s);
    if (s.empty()) return res;
    size_t i = 0;
    while (i < s.size()) {
        size_t openBracket = s.find('[', i);
        if (openBracket == string::npos) break;
        if (openBracket == 0 && s.rfind(']') == s.size() - 1 && s.find('[', 1) != string::npos) {
            i = 1;
            continue;
        }
        size_t closeBracket = s.find(']', openBracket);
        if (closeBracket == string::npos) break;
        string inner = s.substr(openBracket, closeBracket - openBracket + 1);
        res.push_back(parseVectorInt(inner));
        i = closeBracket + 1;
    }
    return res;
}

// ── SERIALIZERS ─────────────────────────────────────────────────────────────
static inline void printResult(int val) { cout << val; }
static inline void printResult(long long val) { cout << val; }
static inline void printResult(double val) { cout << fixed << setprecision(6) << val; }
static inline void printResult(bool val) { cout << (val ? "true" : "false"); }
static inline void printResult(const string& val) { cout << val; }

template <typename T>
static inline void printResult(const vector<T>& vec) {
    cout << "[";
    for (size_t i = 0; i < vec.size(); i++) {
        printResult(vec[i]);
        if (i + 1 < vec.size()) cout << ", ";
    }
    cout << "]";
}

// ── STUDENT IMPLEMENTATION START ────────────────────────────────────────────
${studentCode}
// ── STUDENT IMPLEMENTATION END ──────────────────────────────────────────────

// ── GENERATED MAIN TEST RUNNER ──────────────────────────────────────────────
int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

${paramParsingLines}

    ${className} solution;
    auto result = solution.${functionName}(${paramCallArgs});

    printResult(result);
    cout << endl;
    return 0;
}
`;
}

module.exports = {
  wrapCppFunction,
};
