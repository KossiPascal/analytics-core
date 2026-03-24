
// 2️⃣ Setup
export const AGG_FUNCTIONS = ["SUM", "AVG", "COUNT", "MIN", "MAX"] as const;
export const UNIQUE_AGG_FUNCTIONS: Set<string> = new Set(AGG_FUNCTIONS);
export const SAFE_SQL_FUNCTIONS = new Set([...AGG_FUNCTIONS, "COALESCE", "NULLIF", "ROUND", "LOWER", "UPPER", "DATE_TRUNC", "EXTRACT"]);
export const ALLOWED_FUNCTIONS: Set<string> = new Set([...SAFE_SQL_FUNCTIONS, "FILTER"]);
export const NUMERIC_LITERAL_REGEX = /^[0-9+\-*/().\s]+$/;
export const FUNCTION_REGEX = /\b([A-Z_]+)\s*\(/g;
export const AGG_WITH_DISTINCT_REGEX = /\b(SUM|AVG|COUNT|MIN|MAX)\s*\(\s*(DISTINCT\s+)?/i;

export const FULL_SQL_KEYWORDS: Set<string> = new Set([

    // 🔹 Clauses principales
    "SELECT", "FROM", "WHERE", "GROUP", "BY", "ORDER", "HAVING",
    "LIMIT", "OFFSET", "FETCH", "FIRST", "NEXT",
    "DISTINCT", "ALL", "AS",

    // 🔹 Conditions logiques
    "AND", "OR", "NOT", "BETWEEN", "IN", "LIKE", "ILIKE",
    "IS", "NULL", "TRUE", "FALSE", "UNKNOWN",
    "EXISTS", "ANY", "SOME",

    // 🔹 Jointures
    "JOIN", "INNER", "LEFT", "RIGHT", "FULL", "OUTER",
    "CROSS", "NATURAL", "ON", "USING",

    // 🔹 Agrégations (même si tu les gères ailleurs)
    "FILTER", "OVER", "PARTITION", "ROWS", "RANGE",
    "UNBOUNDED", "PRECEDING", "FOLLOWING", "CURRENT", "ROW",

    // 🔹 CASE
    "CASE", "WHEN", "THEN", "ELSE", "END",

    // 🔹 Types
    "CAST", "CONVERT",
    "INT", "INTEGER", "BIGINT", "SMALLINT",
    "DECIMAL", "NUMERIC", "FLOAT", "REAL", "DOUBLE",
    "DATE", "TIME", "TIMESTAMP", "INTERVAL",
    "BOOLEAN", "CHAR", "VARCHAR", "TEXT",

    // 🔹 Date helpers
    "EXTRACT", "YEAR", "MONTH", "DAY",
    "HOUR", "MINUTE", "SECOND",

    // 🔹 Set operators
    "UNION", "INTERSECT", "EXCEPT",

    // 🔹 Window
    "WINDOW",

    // 🔹 Comparaisons avancées
    "SIMILAR", "TO",

    // 🔹 Divers
    "WITH", "RECURSIVE",
    "DEFAULT", "COLLATE",

    // 🔹 Null handling
    "COALESCE", "NULLIF",

    // 🔹 Ranking
    "RANK", "DENSE_RANK", "ROW_NUMBER",

    // 🔹 Math operators keywords
    "MOD", "POWER",

    // 🔹 Boolean constructs
    "ISNULL", "NOTNULL",

    // 🔹 Lateral / advanced
    "LATERAL"
]);
export const SQL_KEYWORDS: Set<string> = new Set([
    "DISTINCT", "CASE", "WHEN", "THEN", "ELSE", "END", "WHERE",
    "BETWEEN", "AND", "OR", "IN", "IS", "NULL", "TRUE", "FALSE",
    "LIKE", "NOT", "EXISTS", "ALL", "ANY", "JOIN", "ON",
    "GROUP", "BY", "ORDER", "HAVING", "AS"
]);
export const FORBIDDEN_PATTERNS = [
    /;/,
    /--/,
    /\/\*/,
    /\bUNION\b/i,
    /\bINSERT\b/i,
    /\bDELETE\b/i,
    /\bUPDATE\b/i,
    /\bDROP\b/i,
    /\bALTER\b/i,
    /\bTRUNCATE\b/i,
    /\bEXEC\b/i,
    /\bOVER\b/i,
    /\bFROM\b/i,
    /\bJOIN\b/i
];