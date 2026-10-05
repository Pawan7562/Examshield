// backend/coding-engine/runners/java/functionRunner.js
// Java Automatic Wrapper Generator for FUNCTION_BASED (LeetCode style) evaluation

function getJavaDeserializer(type, varName, lineVar) {
  const normType = (type || 'int').trim().toLowerCase().replace(/\s+/g, '');

  if (normType === 'int') {
    return `int ${varName} = parseInt(${lineVar});`;
  }
  if (normType === 'long') {
    return `long ${varName} = parseLong(${lineVar});`;
  }
  if (normType === 'double' || normType === 'float') {
    return `double ${varName} = parseDouble(${lineVar});`;
  }
  if (normType === 'boolean' || normType === 'bool') {
    return `boolean ${varName} = parseBoolean(${lineVar});`;
  }
  if (normType === 'string') {
    return `String ${varName} = parseString(${lineVar});`;
  }
  if (normType === 'int[]' || normType === 'vector<int>') {
    return `int[] ${varName} = parseIntArray(${lineVar});`;
  }
  if (normType === 'string[]' || normType === 'vector<string>') {
    return `String[] ${varName} = parseStringArray(${lineVar});`;
  }

  return `String ${varName} = parseString(${lineVar});`;
}

function wrapJavaFunction(studentCode, metadata = {}) {
  const className = metadata.className || 'Solution';
  const functionName = metadata.functionName || 'twoSum';
  const parameters = Array.isArray(metadata.parameters) && metadata.parameters.length > 0
    ? metadata.parameters
    : [
        { name: 'nums', type: 'int[]' },
        { name: 'target', type: 'int' }
      ];

  const paramParsingLines = parameters.map((param, idx) => {
    const pName = param.name || `arg_${idx}`;
    const pType = param.type || 'int';
    const lineVar = `line_${idx}`;
    const deserializer = getJavaDeserializer(pType, pName, lineVar);

    return `        String ${lineVar} = sc.hasNextLine() ? sc.nextLine().trim() : "";
        ${deserializer}`;
  }).join('\n\n');

  const paramCallArgs = parameters.map((param, idx) => param.name || `arg_${idx}`).join(', ');

  return `// ============================================================================
// Auto-Generated ExamShield Java LeetCode Test Harness
// Mode: FUNCTION_BASED
// ============================================================================
import java.util.*;
import java.io.*;

// ── STUDENT IMPLEMENTATION START ────────────────────────────────────────────
${studentCode}
// ── STUDENT IMPLEMENTATION END ──────────────────────────────────────────────

// ── GENERATED TEST RUNNER ───────────────────────────────────────────────────
public class Main {
    static int parseInt(String s) {
        s = s.trim();
        if (s.isEmpty()) return 0;
        try { return Integer.parseInt(s); } catch (Exception e) { return 0; }
    }

    static long parseLong(String s) {
        s = s.trim();
        if (s.isEmpty()) return 0L;
        try { return Long.parseLong(s); } catch (Exception e) { return 0L; }
    }

    static double parseDouble(String s) {
        s = s.trim();
        if (s.isEmpty()) return 0.0;
        try { return Double.parseDouble(s); } catch (Exception e) { return 0.0; }
    }

    static boolean parseBoolean(String s) {
        s = s.trim().toLowerCase();
        return s.equals("true") || s.equals("1");
    }

    static String parseString(String s) {
        s = s.trim();
        if (s.startsWith("\\\"") && s.endsWith("\\\"") && s.length() >= 2) {
            return s.substring(1, s.length() - 1);
        }
        return s;
    }

    static int[] parseIntArray(String s) {
        s = s.trim();
        if (s.startsWith("[")) s = s.substring(1);
        if (s.endsWith("]")) s = s.substring(0, s.length() - 1);
        s = s.trim();
        if (s.isEmpty()) return new int[0];
        String[] parts = s.split(",");
        int[] res = new int[parts.length];
        for (int i = 0; i < parts.length; i++) {
            res[i] = parseInt(parts[i]);
        }
        return res;
    }

    static String[] parseStringArray(String s) {
        s = s.trim();
        if (s.startsWith("[")) s = s.substring(1);
        if (s.endsWith("]")) s = s.substring(0, s.length() - 1);
        s = s.trim();
        if (s.isEmpty()) return new String[0];
        String[] parts = s.split(",");
        String[] res = new String[parts.length];
        for (int i = 0; i < parts.length; i++) {
            res[i] = parseString(parts[i]);
        }
        return res;
    }

    static void printResult(Object obj) {
        if (obj == null) {
            System.out.println("null");
        } else if (obj instanceof int[]) {
            System.out.println(Arrays.toString((int[]) obj));
        } else if (obj instanceof long[]) {
            System.out.println(Arrays.toString((long[]) obj));
        } else if (obj instanceof double[]) {
            System.out.println(Arrays.toString((double[]) obj));
        } else if (obj instanceof Object[]) {
            System.out.println(Arrays.deepToString((Object[]) obj));
        } else {
            System.out.println(String.valueOf(obj));
        }
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
${paramParsingLines}

        ${className} sol = new ${className}();
        Object res = sol.${functionName}(${paramCallArgs});
        printResult(res);
    }
}
`;
}

module.exports = {
  wrapJavaFunction,
};
