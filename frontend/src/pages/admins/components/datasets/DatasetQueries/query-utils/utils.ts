import { SqlDataType, NUMERIC_DATA_TYPES, DATETIME_DATA_TYPES, SqlAggType, SqlOperators, NULL_ONLY_OPERATORS, BOOLEAN_ONLY_OPERATORS, RANGE_REQUIRED_OPERATORS, ARRAY_REQUIRED_OPERATORS, NUMERIC_OPERATORS, DATE_OPERATORS, STRING_OPERATORS } from "@/models/dataset.models";


// ---------- SANITIZE & IDENTIFIERS ----------
export const sanitizeIdentifier = (name: string) => {
    // Autorise uniquement lettres, chiffres, underscore, pas de SQL injection
    if (!name) throw new Error("Identifier cannot be empty");
    return name.replace(/[^a-zA-Z0-9_]/g, "_");
};

export const quoteIdentifier = (name: string) => {
    return `"${name.replace(/"/g, "")}"`;
};

// ---------- NULL / EMPTY CHECK ----------
export const isNullLike = (val: unknown): boolean => {
    if (val === null || val === undefined) return true;
    const s = String(val).trim().toLowerCase();
    return s === "null" || s === "undefined" || s === "";
};

// ---------- STRING / SQL ----------
export const removeQuotes = (val: string) => {
    return val.replace(/^['"]+|['"]+$/g, "").trim();
};

export const stripWrappers = (val: string) => {
    return val.replace(/^[\(\[\{]\s*/, "").replace(/\s*[\)\]\}]$/, "");
};

export const escapeSqlString = (val: string) => {
    return val.replace(/'/g, "''");
};

// ---------- NUMERIC ----------
export const isNumeric = (val: string) => {
    if (!val.trim()) return false;
    const normalized = val.replace(",", ".").replace(" ", "");
    return !Number.isNaN(Number(normalized));
};

export const normalizeNumber = (val: string): number => {
    const normalized = Number(val.replace(",", ".").replace(" ", "."));
    return Number(normalized);
};

// ---------- BOOLEAN ----------
export const parseBoolean = (val: unknown): boolean | null => {
    if (typeof val === "boolean") return val;
    if (val === null || val === undefined) return null;
    const v = String(val).trim().toLowerCase();
    if (["true", "1", "yes"].includes(v)) return true;
    if (["false", "0", "no"].includes(v)) return false;
    return null;
};

// ---------- DATE & JSON ----------
export const isValidDate = (val: string) => {
    return !Number.isNaN(Date.parse(val));
};

export const isValidJSON = (val: string) => {
    try { JSON.parse(val); return true; } catch { return false; }
};

// ---------- PARSE VALUE & FORMAT SQL ----------
export const parseValue = (raw: unknown, dataType: SqlDataType): unknown => {
    if (isNullLike(raw)) return null;

    const value = String(raw).trim();

    if (NUMERIC_DATA_TYPES.includes(dataType)) {
        if (!isNumeric(value)) throw new Error(`Invalid numeric value: ${raw}`);
        const numericValue = normalizeNumber(value);
        if (!Number.isFinite(numericValue)) throw new Error(`Invalid numeric value: ${raw}`);
        return numericValue;
    }

    if (dataType === "boolean") {
        const b = parseBoolean(value);
        if (b === null) throw new Error(`Invalid boolean value: ${raw}`);
        return b;
    }

    if (DATETIME_DATA_TYPES.includes(dataType)) {
        if (!isValidDate(value)) throw new Error(`Invalid date value: ${raw}`);
        return value;
    }

    if (dataType === "json") {
        const str = typeof raw === "object" ? JSON.stringify(raw) : value;
        if (!isValidJSON(str)) throw new Error(`Invalid JSON value: ${raw}`);
        return str;
    }

    // Default string
    return removeQuotes(value);
};

export const formatSqlValue = (raw: unknown, dataType: SqlDataType): string | number => {
    if (isNullLike(raw)) return "NULL";
    const parsed = parseValue(raw, dataType);

    if (typeof parsed === "number") return parsed;
    if (typeof parsed === "boolean") return parsed ? "TRUE" : "FALSE";

    return escapeSqlString(String(parsed));
};

// ---------- NORMALISE LIST & FORMAT IN CLAUSE ----------
export const normalizeListInput = (input: unknown, dataType: SqlDataType): unknown[] => {
    const values = Array.isArray(input) ? input : String(input ?? "").split(/[, ]+/);
    return values.map(v => parseValue(v, dataType)).filter(v => v !== null);
};

export const formatInClause = (input: unknown, dataType: SqlDataType): string => {
    const values = normalizeListInput(input, dataType);
    if (values.length === 0) return "()";
    const formatted = values.map(v =>
        typeof v === "number" ? v : escapeSqlString(String(v))
    );
    return `(${formatted.join(", ")})`;
};

export const generateSqlExpression = (expression: string, aggregation: SqlAggType | null, isDistinct: boolean = false) => {
    if (!expression) return "";
    const DISTINCT = isDistinct ? "DISTINCT " : ""
    if (aggregation) {
        return `${aggregation}(${DISTINCT}${expression})`;
    } else {
        return `${DISTINCT}${expression}`;
    }
};

export const assertOperatorCompatibility = (operator: SqlOperators, dataType: SqlDataType, value: any, value2?: any) => {
    // NULL operators accept any type
    if (NULL_ONLY_OPERATORS.includes(operator)) return;

    // BOOLEAN specific
    if (BOOLEAN_ONLY_OPERATORS.includes(operator)) {
        if (dataType !== "boolean") {
            throw new Error(`Operator "${operator}" only allowed on boolean fields`);
        }
        return;
    }

    // BETWEEN requires two values
    if (RANGE_REQUIRED_OPERATORS.includes(operator)) {
        if (value === undefined || value2 === undefined) {
            throw new Error(`Operator "${operator}" requires two values`);
        }
    }

    // IN requires array
    if (ARRAY_REQUIRED_OPERATORS.includes(operator)) {
        if (!Array.isArray(normalizeListInput(value, dataType))) {
            throw new Error(`Operator "${operator}" requires list value`);
        }
    }

    // Numeric
    if (NUMERIC_DATA_TYPES.includes(dataType)) {
        if (!NUMERIC_OPERATORS.includes(operator)) {
            throw new Error(`Operator "${operator}" not compatible with numeric type`);
        }
        return;
    }

    // Date
    if (DATETIME_DATA_TYPES.includes(dataType)) {
        if (!DATE_OPERATORS.includes(operator)) {
            throw new Error(`Operator "${operator}" not compatible with date type`);
        }
        return;
    }

    // String
    if (["string", "json", "jsonb"].includes(dataType)) {
        if (!STRING_OPERATORS.includes(operator)) {
            throw new Error(`Operator "${operator}" not compatible with string type`);
        }
        return;
    }

    // Boolean normal comparisons
    if (dataType === "boolean") {
        if (!["=", "!=", "<>"].includes(operator) && !BOOLEAN_ONLY_OPERATORS.includes(operator)) {
            throw new Error(`Operator "${operator}" not compatible with boolean type`);
        }
        return;
    }
};
