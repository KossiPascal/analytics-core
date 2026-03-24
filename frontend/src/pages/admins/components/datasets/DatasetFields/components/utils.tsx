import { SqlFieldType, SqlDataType, NUMERIC_DATA_TYPE, SqlAggType, DatasetColumn } from "@/models/dataset.models";
import { Sigma } from "lucide-react";
import { FaRuler, FaChartLine, FaLayerGroup, FaHashtag, FaAlignLeft, FaToggleOn, FaTable, FaCode, FaCalendarAlt, FaCalculator } from "react-icons/fa";
import { UNIQUE_AGG_FUNCTIONS, NUMERIC_LITERAL_REGEX, AGG_WITH_DISTINCT_REGEX, FORBIDDEN_PATTERNS, FUNCTION_REGEX, ALLOWED_FUNCTIONS, SQL_KEYWORDS } from "./constantes";
import { parse } from "pgsql-ast-parser";

interface GenerateNameParams {
    fieldType: SqlFieldType | null;
    expression: string;
    aggregation: SqlAggType | null;
};

interface ValidateExpressionProps {
    expr: string;
    fieldType: SqlFieldType | null;
    columns: DatasetColumn[];
    dataType: SqlDataType;
    aggregation: SqlAggType | null;
}


type ValidateExpressionUltra = {
    valid: boolean;
    error?: string;
    meta?: {
        columnName: string;
        dataType: SqlDataType
        usedColumns: string[];
        functions: string[];
        hasAggregation: boolean;
    };
}

const generateStableName = (expr: string, usedColsArray?: string[]) => {
    let hash = 0;
    for (let i = 0; i < expr.length; i++) {
        hash = ((hash << 5) - hash) + expr.charCodeAt(i);
        hash |= 0;
    }
    return `col_${Math.abs(hash)}`;


    // const baseName = [...usedColumns].join("_") || "expr";
    // if (fieldType === "metric" && aggregation) {
    //     return `${aggregation}_${baseName}`;
    // } else if (fieldType === "calculated_metric") {
    //     return `calc_${baseName}`;
    // } else {
    //     return baseName;
    // }
};

const isTopLevelAggregation = (expr: string) => {
    return /^(SUM|AVG|COUNT|MIN|MAX)\s*\(/i.test(expr.trim());
};

// Mapping fonctions SQL vers type de retour (exemple, à compléter selon besoin)
const FUNCTION_RETURN_TYPE: Record<string, SqlDataType> = {
    COUNT: "numeric",
    SUM: "numeric",
    AVG: "numeric",
    MIN: "numeric",
    MAX: "numeric",
    LENGTH: "numeric",
    UPPER: "string",
    LOWER: "string",
    DATE_PART: "numeric",
    DATE_TRUNC: "datetime",
    // ... compléter selon les fonctions autorisées
};

// Icons helpers
export const getFieldTypeIcon = (type: SqlFieldType | null) => {
    if (type === "dimension") return <FaRuler className="w-4 h-4" />;
    if (type === "metric") return <FaChartLine className="w-4 h-4" />;
    return <FaLayerGroup className="w-4 h-4" />;
};
export const getDataTypeIcon = (dataType: SqlDataType) => {
    if (!dataType) return <FaLayerGroup size={14} />;

    const vDataType = dataType.toLowerCase() as SqlDataType

    if (NUMERIC_DATA_TYPE.has(vDataType))
        return <FaHashtag size={14} />;

    if (["varchar", "text", "char", "string"].includes(vDataType))
        return <FaAlignLeft size={14} />;

    if (["date", "time", "datetime", "timestamp"].includes(vDataType))
        return <FaLayerGroup size={14} />;

    if (["boolean", "bool"].includes(vDataType))
        return <FaToggleOn size={14} />;

    if (["json", "jsonb"].includes(vDataType))
        return <FaTable size={14} />;

    return <FaLayerGroup size={14} />;
};
export const getExpressionIcon = (expression?: string) => {
    if (!expression) return <FaCode />;

    const exp = expression.toLowerCase();

    if (exp.includes("count") || exp.includes("sum") || exp.includes("avg")) {
        return <Sigma />;
    }
    if (exp.includes("case")) {
        return <FaCode />;
    }
    if (exp.includes("date") || exp.includes("year") || exp.includes("month")) {
        return <FaCalendarAlt />;
    }
    return <FaCode />;
};
export const getAggregationIcon = (aggregation: SqlAggType | null) => {
    if (!aggregation) return <FaCalculator />;

    const agg = aggregation.toLowerCase();
    if (["sum", "avg", "count", "min", "max"].includes(agg))
        return <FaCalculator size={14} />;

    return <FaCalculator size={14} />;
};
export const generateFieldName = ({ fieldType, expression, aggregation }: GenerateNameParams): string => {

    if (!expression?.trim()) return "";

    const trimmed = expression.trim();

    // 1️⃣ Detect SQL alias first
    const aliasMatch = trimmed.match(/\s+as\s+([a-zA-Z0-9_]+)$/i);
    if (aliasMatch?.[1]) {
        return aliasMatch[1].toLowerCase();
    }

    // 2️⃣ Remove outer aggregation only
    let baseExpression = trimmed;
    const aggMatch = trimmed.match(/^(SUM|AVG|COUNT|MIN|MAX)\s*\(\s*(DISTINCT\s+)?(.+?)\)$/i);
    if (aggMatch) {
        baseExpression = aggMatch[3];
    }

    if (!baseExpression) return "";

    // 3️⃣ Normalize expression safely
    let base = baseExpression
        .toLowerCase()
        .replace(/["'`]/g, "")
        .replace(/\bcase\b.*?\bend\b/gi, "case_expr")
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/_+/g, "_")
        .replace(/^_+|_+$/g, "");

    if (!base) base = "field";

    // 4️⃣ Metric prefix logic
    if (fieldType === "metric" && aggregation) {
        const safeAgg = aggregation.toLowerCase().replace(/[^a-z]/g, "");
        return `${safeAgg}_${base}`;
    }

    return base;
};
export const isNumericExpression = (expr: string, aggregation: SqlAggType | null, columns: DatasetColumn[]): boolean => {

    const trimmed = expr.trim().toUpperCase();

    if (aggregation && UNIQUE_AGG_FUNCTIONS.has(aggregation.toUpperCase())) {
        return true;
    }

    if (NUMERIC_LITERAL_REGEX.test(trimmed)) {
        return true;
    }

    if (AGG_WITH_DISTINCT_REGEX.test(trimmed)) {
        return true;
    }

    const identifiers = trimmed.match(/\b[a-zA-Z_][a-zA-Z0-9_]*\b/g) || [];

    for (const id of identifiers) {
        const col = columns.find(c => c.name?.toLowerCase() === id.toLowerCase());
        if (col && NUMERIC_DATA_TYPE.has(col.type?.toLowerCase() as SqlDataType)) {
            return true;
        }
    }

    return false;
};

export const validateExpression = ({ expr, fieldType, columns, dataType, aggregation }: ValidateExpressionProps): ValidateExpressionUltra => {

    const trimmed = expr?.trim();
    if (!trimmed) {
        return { valid: false, error: "Expression vide." };
    }

    // 🔴🔒 HARD SECURITY LAYER
    if (FORBIDDEN_PATTERNS.some(p => p.test(trimmed))) {
        return { valid: false, error: "Expression SQL interdite." };
    }

    if (/\b(select|with|insert|update|delete|drop|create)\b/i.test(trimmed)) {
        return { valid: false, error: "Requêtes SQL interdites." };
    }

    if (/select\s+.*\s+from/i.test(trimmed)) {
        return { valid: false, error: "Sous-requêtes interdites." };
    }

    if (/with\s+/i.test(trimmed)) {
        return { valid: false, error: "CTE interdit" };
    }

    let ast;
    try {
        // 🔥 on wrap pour parser correctement
        ast = parse(`SELECT ${trimmed} AS col`);
    } catch (e) {
        return { valid: false, error: "Expression SQL invalide." };
    }

    const usedColumns = new Set<string>();
    const functions = new Set<string>();
    // const normalizedColumns = new Set(columns.map(c => c.name?.toLowerCase()));
    const columnsMap = new Map(columns.map(c => [c.name?.toLowerCase(), c]));

    let aggregationDepth = 0;
    let hasAggregation = false;

    // 🔍 🧠 AST WALKER (FULL SAFE)
    const walk = (node: any) => {
        if (!node) return;

        if (Array.isArray(node)) {
            node.forEach(walk);
            return;
        }

        // 🔒 BLOCK WINDOW FUNCTIONS
        if (node.over) {
            throw new Error("Window functions interdites");
        }

        switch (node.type) {

            case "select":
                walk(node.columns);
                // walk(node.from);
                walk(node.where);
                break;

            case "ref":
                if (node.name) {
                    usedColumns.add(node.name.toLowerCase());
                }
                break;

            case "call":
                const fn = node.function?.name?.toUpperCase();

                if (fn) {
                    if (!ALLOWED_FUNCTIONS.has(fn)) {
                        throw new Error(`Fonction non autorisée : ${fn}`);
                    }

                    functions.add(fn);

                    if (UNIQUE_AGG_FUNCTIONS.has(fn)) {
                        aggregationDepth++;
                        hasAggregation = true;

                        if (aggregationDepth > 1) {
                            throw new Error("Nested aggregation interdite");
                        }
                    }
                }

                walk(node.args);

                if (fn && UNIQUE_AGG_FUNCTIONS.has(fn)) {
                    aggregationDepth--;
                }
                break;

            case "binary":
                walk(node.left);
                walk(node.right);
                break;

            case "unary":
                walk(node.operand);
                break;

            case "case":
                walk(node.value);
                walk(node.whens);
                walk(node.else);
                break;

            case "cast":
                walk(node.operand);
                break;

            case "array":
                walk(node.expressions);
                break;

            case "member":
                walk(node.operand);
                break;

            case "subquery":
                throw new Error("Sous-requêtes interdites");

            default:
                // traverse générique
                Object.values(node).forEach(v => {
                    if (typeof v === "object") walk(v);
                });
        }
    };

    try {
        walk(ast[0]);
    } catch (err: any) {
        return { valid: false, error: err.message };
    }

    // 🔍 VALIDATE COLUMNS
    const usedColsArray = [...usedColumns];

    // 🔥 validation colonnes
    for (const col of usedColsArray) {
        if (!columnsMap.has(col)) {
            return { valid: false, error: `Colonne inconnue : ${col}` };
        }
    }

    // 🧠 TYPE INFERENCE (AST-based)
    const isNumeric = usedColsArray.some(col => {
        const c = columnsMap.get(col);
        return c && NUMERIC_DATA_TYPE.has(c.type?.toLowerCase() as SqlDataType);
    });
    // const isNumeric = isNumericExpression(trimmed, aggregation, columns);


    if (isNumeric && !NUMERIC_DATA_TYPE.has(dataType?.toLowerCase() as SqlDataType)) {
        return { valid: false, error: "Type incompatible avec expression numérique." };
    }

    // 📊 règles métier
    if (fieldType === "dimension" && hasAggregation) {
        return { valid: false, error: "Une dimension ne peut pas contenir d'agrégation." };
    }

    if (fieldType === "metric" && hasAggregation) {
        return { valid: false, error: "Ne pas inclure d'agrégation dans un metric simple." };
    }

    if (fieldType === "calculated_metric" && !hasAggregation) {
        return { valid: false, error: "Un calculated_metric doit contenir une agrégation." };
    }

    // 🔢 validation type

    if (isNumeric && !NUMERIC_DATA_TYPE.has(dataType?.toLowerCase() as SqlDataType)) {
        return { valid: false, error: "Type incompatible avec expression numérique." };
    }

    // 🚀 STABLE COLUMN NAME
    const columnName = generateStableName(trimmed, usedColsArray);

    let finalDataType: SqlDataType = "string"; // fallback

    if (hasAggregation) {
        finalDataType = "numeric"; // toutes les agrégations retournent des chiffres
    } else if (usedColsArray.length > 0) {
        const types = usedColsArray
            .map(col => columnsMap.get(col)?.type?.toLowerCase() as SqlDataType)
            .filter(Boolean);

        if (types.every(t => NUMERIC_DATA_TYPE.has(t))) {
            finalDataType = "numeric";
        } else if (types.every(t => ["varchar", "text", "char", "string"].includes(t))) {
            finalDataType = "string";
        } else if (types.every(t => ["date", "datetime", "timestamp", "time"].includes(t))) {
            finalDataType = "datetime";
        } else if (types.every(t => ["boolean", "bool"].includes(t))) {
            finalDataType = "boolean";
        } else {
            finalDataType = "string"; // fallback safe
        }
    }
    return {
        valid: true,
        meta: {
            columnName,
            dataType: finalDataType,
            usedColumns: usedColsArray,
            functions: [...functions],
            hasAggregation,
        },
    };
};

export const old_validateExpression = ({ expr, fieldType, columns, dataType, aggregation, }: ValidateExpressionProps): { valid: boolean; error?: string; columnName?: string; } => {

    const trimmed = expr?.trim();
    if (!trimmed) {
        return { valid: false, error: "Expression vide." };
    }

    // 🔴 sécurité SQL
    if (FORBIDDEN_PATTERNS.some(p => p.test(trimmed))) {
        return { valid: false, error: "Expression contient des mots-clés SQL interdits." };
    }

    const upperExpr = trimmed.toUpperCase();

    let hasAggregation = false;
    let hasFilter = false;

    // ⚠️ IMPORTANT: reset regex (sinon bug)
    FUNCTION_REGEX.lastIndex = 0;

    let match;
    while ((match = FUNCTION_REGEX.exec(upperExpr)) !== null) {
        const fnName = match[1];

        if (!ALLOWED_FUNCTIONS.has(fnName)) {
            return { valid: false, error: `Fonction non autorisée : ${fnName}` };
        }

        if (UNIQUE_AGG_FUNCTIONS.has(fnName)) {
            hasAggregation = true;
        }

        if (fnName === "FILTER") {
            hasFilter = true;
        }
    }

    // 🔥 règles métier
    if (hasFilter && !hasAggregation) {
        return { valid: false, error: "FILTER doit être utilisé avec une agrégation." };
    }

    if (fieldType === "dimension" && hasAggregation) {
        return { valid: false, error: "Une dimension ne peut pas contenir d'agrégation." };
    }

    if (fieldType === "metric" && hasAggregation) {
        return { valid: false, error: "Ne pas inclure l'agrégation dans un metric simple." };
    }

    if (fieldType === "calculated_metric" && !hasAggregation) {
        return { valid: false, error: "Un calculated_metric doit contenir une agrégation." };
    }

    // 🔍 extraction identifiants
    const exprWithoutStrings = trimmed.replace(/'[^']*'/g, "").replace(/"[^"]*"/g, "");

    const identifiers = exprWithoutStrings.match(/\b[a-zA-Z_][a-zA-Z0-9_]*\b/g);

    const normalizedColumns = new Set(
        columns
            .filter(c => c.name)
            .map(c => c.name!.toLowerCase())
    );

    if (identifiers) {
        for (const id of identifiers) {
            const upper = id.toUpperCase();
            const lower = id.toLowerCase();

            if (
                !normalizedColumns.has(lower) &&
                !ALLOWED_FUNCTIONS.has(upper) &&
                !SQL_KEYWORDS.has(upper)
            ) {
                return { valid: false, error: `Colonne inconnue : ${id}` };
            }
        }
    }

    // 🔥 CASE / END check
    const caseCount = (upperExpr.match(/\bCASE\b/g) || []).length;
    const endCount = (upperExpr.match(/\bEND\b/g) || []).length;

    if (caseCount !== endCount) {
        return { valid: false, error: "CASE / END non équilibré." };
    }

    // 🔥 parenthèses
    let balance = 0;
    for (const char of trimmed) {
        if (char === "(") balance++;
        if (char === ")") balance--;
        if (balance < 0) {
            return { valid: false, error: "Parenthèses mal fermées." };
        }
    }
    if (balance !== 0) {
        return { valid: false, error: "Parenthèses mal fermées." };
    }

    // 🔢 type numérique
    const isNumeric = isNumericExpression(trimmed, aggregation, columns);

    if (isNumeric && !NUMERIC_DATA_TYPE.has(dataType?.toLowerCase() as SqlDataType)) {
        return {
            valid: false,
            error: "Data Type incompatible avec une expression numérique.",
        };
    }

    // 🚀 GENERATION DU NOM DE COLONNE

    let columnName = "";

    const baseName = trimmed
        .replace(/[^a-zA-Z0-9_]/g, "_")
        .replace(/_+/g, "_")
        .replace(/^_|_$/g, "")
        .toLowerCase();

    if (fieldType === "metric" && aggregation) {
        columnName = `${aggregation.toLowerCase()}_${baseName}`;
    } else if (fieldType === "calculated_metric") {
        columnName = `calc_${baseName}`;
    } else {
        columnName = baseName;
    }

    return {
        valid: true,
        columnName,
    };
};