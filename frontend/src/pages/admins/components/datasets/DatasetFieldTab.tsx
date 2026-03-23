import { Shield } from 'lucide-react';
import { forwardRef, useEffect, useMemo, useRef, useState } from 'react';
import { StatusBadge } from '@components/ui/Badge/Badge';
import { Table, type Column } from '@components/ui/Table/Table';
import { FormInput } from '@components/forms/FormInput/FormInput';
import { FormTextarea } from '@components/forms/FormTextarea/FormTextarea';
import { Tenant } from '@models/identity.model';
import { FormSelect } from '@components/forms/FormSelect/FormSelect';
import { AdminEntityCrudModuleRef, AdminEntityCrudModule } from '@pages/admins/AdminEntityCrudModule';
import { Dataset, DatasetColumn, DatasetField, SqlAggType, AGGRAGATE_TYPES, NUMERIC_DATA_TYPES, SqlDataType, FULL_DATA_TYPES, SqlFieldType, SqlFieldTypeList, NUMERIC_DATA_TYPE } from '@/models/dataset.models';
import { datasetService, fieldService } from '@/services/dataset.service';
import { FaCalculator, FaCalendarAlt, FaCode, FaDatabase, FaHashtag, FaLayerGroup, FaTable, FaToggleOn, FaRuler, FaChartLine, FaAlignLeft } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { Sigma, Calculator } from 'lucide-react';
import { FormSwitch } from '@/components/forms/FormSwitch/FormSwitch';
import { Modal } from '@/components/ui/Modal/Modal';
import { Button } from '@/components/ui/Button/Button';
import { FormRadio } from '@/components/forms/FormRadio/FormRadio';
import { InlineEditCell } from '@components/ui/InlineEditCell';

const createDefaultForm = (tenant_id: number): DatasetField => ({
    id: null,
    name: "",
    expression: "",
    aggregation: null,
    tenant_id: tenant_id,
    dataset_id: null,
    field_type: null,
    data_type: "string",
    description: "",
    format: {},
    dimensions: [],
    select_multiple: undefined,
    is_public: false,
    is_filterable: false,
    is_groupable: false,
    is_sortable: false,
    is_selectable: false,
    is_hidden: false,
    is_active: true,
    raw_field: null,
});


const datafieldColumns: Column<DatasetField>[] = [
    {
        key: "name",
        header: "Nom",
        sortable: true,
        searchable: true,
    },
    {
        key: "expression",
        header: "Expression",
        sortable: true,
        searchable: true,
    },
    {
        key: "aggregation",
        header: "Aggregation",
        sortable: true,
        searchable: true,
    },
    {
        key: "tenant",
        header: "Tenant",
        render: (ds) => ds.tenant ? ds.tenant.name : "",
        sortable: true,
        searchable: true,
    },
    {
        key: "dataset",
        header: "Dataset",
        render: (ds) => ds.dataset ? ds.dataset.name : "",
        sortable: true,
        searchable: true,
    },
    {
        key: "field_type",
        header: "Field type",
        sortable: true,
        render: (r) =>
            r.field_type === "dimension" ?
                (<div className="flex items-center gap-2"><Sigma size={16} /> Dimension</div>) :
                (<div className="flex items-center gap-2"><Calculator size={16} /> Metric</div>),
    },
    {
        key: "data_type",
        header: "Data type",
        sortable: true,
        searchable: true,
    },
    {
        key: "description",
        header: "Description",
        sortable: true,
        searchable: true,
    },
    {
        key: "is_public",
        header: "Public",
        align: "center",
        render: (r) => <StatusBadge isActive={r.is_public} />,
    },
    {
        key: "is_active",
        header: "is_active",
        sortable: true,
        align: "center",
        render: (ou) => (<StatusBadge isActive={ou.is_active} />),
        searchable: false,
    },
    {
        key: "is_filterable",
        header: "is_filterable",
        sortable: true,
        align: "center",
        render: (ou) => (<StatusBadge isActive={ou.is_filterable} />),
        searchable: false,
    },
    {
        key: "is_groupable",
        header: "is_groupable",
        sortable: true,
        align: "center",
        render: (ou) => (<StatusBadge isActive={ou.is_groupable} />),
        searchable: false,
    },
    {
        key: "is_sortable",
        header: "is_sortable",
        sortable: true,
        align: "center",
        render: (ou) => (<StatusBadge isActive={ou.is_sortable} />),
        searchable: false,
    },
    {
        key: "is_selectable",
        header: "is_selectable",
        sortable: true,
        align: "center",
        render: (ou) => (<StatusBadge isActive={ou.is_selectable} />),
        searchable: false,
    },
    {
        key: "is_hidden",
        header: "is_hidden",
        sortable: true,
        align: "center",
        render: (ou) => (<StatusBadge isActive={ou.is_hidden} />),
        searchable: false,
    },
    {
        key: "raw_field",
        header: "raw_field",
        render: (ou) => JSON.stringify(ou.raw_field),
        sortable: true,
        searchable: true,
    },
];

interface GenerateNameParams {
    fieldType: SqlFieldType | null;
    expression: string;
    aggregation: SqlAggType | null;
}
interface ValidateResult {
    valid: boolean;
    error?: string;
}
interface DatasetFieldFormProps {
    field: DatasetField;
    setValue: (key: keyof DatasetField, value: any) => void;
    tenants: Tenant[];
    tenant_id: number;
    datasets: Dataset[];
    dataset_id: number | undefined;
    datasetMap: Map<number, Dataset>;
    saving: boolean;
    showColumns: boolean;
    setShowColumns: (val: boolean) => void;
    onValidationChange: (hasError: boolean) => void;
}

// Icons helpers
const getFieldTypeIcon = (type: SqlFieldType | null) => {
    if (type === "dimension") return <FaRuler className="w-4 h-4" />;
    if (type === "metric") return <FaChartLine className="w-4 h-4" />;
    return <FaLayerGroup className="w-4 h-4" />;
};

const getDataTypeIcon = (dataType: SqlDataType) => {
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

const getExpressionIcon = (expression?: string) => {
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

const getAggregationIcon = (aggregation: SqlAggType | null) => {
    if (!aggregation) return <FaCalculator />;

    const agg = aggregation.toLowerCase();
    if (["sum", "avg", "count", "min", "max"].includes(agg))
        return <FaCalculator size={14} />;

    return <FaCalculator size={14} />;
};

// Field name generation
function generateFieldName({ fieldType, expression, aggregation }: GenerateNameParams): string {

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
}

// 2️⃣ Setup
const AGG_FUNCTIONS = ["SUM", "AVG", "COUNT", "MIN", "MAX"] as const;
const UNIQUE_AGG_FUNCTIONS: Set<string> = new Set(AGG_FUNCTIONS);
const SAFE_SQL_FUNCTIONS = new Set([...AGG_FUNCTIONS, "COALESCE", "NULLIF", "ROUND", "LOWER", "UPPER", "DATE_TRUNC", "EXTRACT"]);
const ALLOWED_FUNCTIONS: Set<string> = new Set([...SAFE_SQL_FUNCTIONS, "FILTER"]);


const FULL_SQL_KEYWORDS: Set<string> = new Set([

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

const SQL_KEYWORDS: Set<string> = new Set([
    "DISTINCT", "CASE", "WHEN", "THEN", "ELSE", "END", "WHERE",
    "BETWEEN", "AND", "OR", "IN", "IS", "NULL", "TRUE", "FALSE",
    "LIKE", "NOT", "EXISTS", "ALL", "ANY", "JOIN", "ON",
    "GROUP", "BY", "ORDER", "HAVING", "AS"
]);

const NUMERIC_LITERAL_REGEX = /^[0-9+\-*/().\s]+$/;
const FUNCTION_REGEX = /\b([A-Z_]+)\s*\(/g;
const AGG_WITH_DISTINCT_REGEX = /\b(SUM|AVG|COUNT|MIN|MAX)\s*\(\s*(DISTINCT\s+)?/i;
const FORBIDDEN_PATTERNS = [
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

const isNumericExpression = (expr: string, aggregation: SqlAggType | null, columns: DatasetColumn[]): boolean => {

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

const validateExpression = ({ expr, fieldType, columns, dataType, aggregation }: { expr: string; fieldType: SqlFieldType | null; columns: DatasetColumn[]; dataType: SqlDataType; aggregation: SqlAggType | null; }): ValidateResult => {

    const trimmed = expr?.trim();
    if (!trimmed) {
        return { valid: false, error: "Expression vide." };
    }

    if (FORBIDDEN_PATTERNS.some(p => p.test(trimmed))) {
        return { valid: false, error: "Expression contient des mots-clés SQL interdits." };
    }

    const upperExpr = trimmed.toUpperCase();

    let hasAggregation = false;
    let hasFilter = false;

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

    if (hasFilter && !hasAggregation) {
        return { valid: false, error: "FILTER doit être utilisé avec une fonction d'agrégation." };
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

    const exprWithoutStrings = trimmed.replace(/'[^']*'/g, "").replace(/"[^"]*"/g, "");

    const identifiers = exprWithoutStrings.match(/\b[a-zA-Z_][a-zA-Z0-9_]*\b/g);

    const normalizedColumns = new Set(columns.filter(c => c.name).map(c => c.name!.toLowerCase()));

    if (identifiers) {
        for (const id of identifiers) {
            const upper = id.toUpperCase();
            const lower = id.toLowerCase();

            if (
                !normalizedColumns.has(lower) &&
                !ALLOWED_FUNCTIONS.has(upper) &&
                !SQL_KEYWORDS.has(upper)) {
                console.log(normalizedColumns)
                return { valid: false, error: `Colonne inconnue ou non autorisée : ${id}` };
            }
        }
    }

    const caseCount = (upperExpr.match(/\bCASE\b/g) || []).length;
    const endCount = (upperExpr.match(/\bEND\b/g) || []).length;
    if (caseCount > 0 && endCount === 0) {
        return { valid: false, error: "Expression contient CASE mais pas de END." };
    }
    if (endCount !== caseCount) {
        return { valid: false, error: "Nombre de CASE et END non équilibré." };
    }

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

    const isNumeric = isNumericExpression(trimmed, aggregation, columns);
    if (isNumeric && !NUMERIC_DATA_TYPE.has(dataType?.toLowerCase() as SqlDataType)) {
        return { valid: false, error: "Data Type non compatible avec expression numérique." };
    }

    return { valid: true };
}

const DatasetFieldForm = ({ field, setValue, tenants, tenant_id, dataset_id, datasets, datasetMap, saving, showColumns, setShowColumns, onValidationChange }: DatasetFieldFormProps) => {

    const [errors, setErrors] = useState<{ expression?: string, data_type?: string }>({});
    const [disabled, setDisabled] = useState<{ expression?: boolean, data_type?: boolean }>({});
    const [dataTypes, setDataTypes] = useState<SqlDataType[]>([]);
    const [autoName, setAutoName] = useState<string | null>(null);
    const [manuallyEdited, setManuallyEdited] = useState(false);
    const [showDimensionsModal, setShowDimensionsModal] = useState(false);
    const [tempSelected, setTempSelected] = useState<{ name: string; type: string; description: string }[]>([]);

    const isNew = useMemo(() => {
        return !field.id;
    }, [field.id]);

    const isDimensionMultiple = useMemo(() => {
        return isNew && field.field_type === "dimension" && field.select_multiple === true;
    }, [isNew, field.field_type, field.select_multiple]);

    const isNotDimensionMultiple = useMemo(() => {
        return field.field_type !== "dimension" || field.select_multiple == false || !isNew && !field.select_multiple
    }, [isNew, field.field_type, field.select_multiple]);

    const isDimensionHidden = useMemo(() => {
        return isNew && field.field_type === "dimension" && field.select_multiple !== false;
    }, [isNew, field.field_type, field.select_multiple]);

    const datasetId = useMemo(() => {
        return field.dataset_id || dataset_id;
    }, [field.dataset_id, dataset_id]);

    const datasetColumns = useMemo(() => {
        if (!datasetId) return [];
        return datasetMap.get(datasetId)?.columns ?? [];
    }, [datasetId, datasetMap]);

    const mappedColumns = useMemo(() => {
        const mapped: Record<string, SqlDataType> = {};
        for (const c of datasetColumns) {
            mapped[c.name] = c.type as SqlDataType
        }
        return mapped;
    }, [datasetColumns]);

    useEffect(() => {
        setDataTypes(FULL_DATA_TYPES);
    }, [FULL_DATA_TYPES]);

    // Réinitialiser les erreurs quand les champs sont cachés (dimension non-false)
    useEffect(() => {
        if (isDimensionHidden) {
            setErrors({});
            onValidationChange?.(false);
        }
    }, [isDimensionHidden]);

    // Génération automatique contrôlée
    useEffect(() => {
        if (isDimensionMultiple) return;

        const generated = generateFieldName({
            fieldType: field.field_type,
            expression: field.expression,
            aggregation: field.aggregation
        });

        if (!generated) return;

        if (!autoName) {
            setAutoName(generated);
            if (!field.name) {
                setValue("name", generated);
            }
            return;
        }

        if (!manuallyEdited && field.name === autoName) {
            setValue("name", generated);
            setAutoName(generated);
        }
    }, [field.field_type, field.expression, field.aggregation]);


    const validateField = ({ expression = field.expression, field_type = field.field_type, aggregation = field.aggregation, data_type = field.data_type, dataset_id = field.dataset_id }: Partial<DatasetField> = {}) => {
        if (isDimensionMultiple) {
            setErrors({});
            onValidationChange?.(false);
            return;
        }
        const datasetColumns = datasetId ? datasetMap.get(datasetId)?.columns ?? [] : [];

        const { valid, error } = validateExpression({
            expr: expression,
            fieldType: field_type,
            columns: datasetColumns,
            dataType: data_type,
            aggregation: aggregation
        });


        const isNumeric = isNumericExpression(expression, aggregation, datasetColumns);
        const isValidNumeric = NUMERIC_DATA_TYPE.has(data_type?.toLowerCase() as SqlDataType);
        if (isNumeric && !isValidNumeric) {
            handleDataTypeChange("bigint");
        }

        const numericDataTypeError = isNumeric && !isValidNumeric ? "Le type est incorrect" : undefined;
        setErrors({ expression: valid ? undefined : error, data_type: numericDataTypeError });

        setDataTypes(numericDataTypeError ? Array.from(NUMERIC_DATA_TYPE) : FULL_DATA_TYPES);

        const hasError = Boolean((!valid) || numericDataTypeError);

        onValidationChange?.(hasError);
    };

    const handleExpressionChange = (val: string) => {
        setValue("expression", val);
        validateField({ expression: val });
    };

    const handleAggregationChange = (val: SqlAggType | null) => {
        setValue("aggregation", val);
        validateField({ aggregation: val });
    };

    const handleDataTypeChange = (val: SqlDataType) => {
        setValue("data_type", val);
        validateField({ data_type: val });
    };

    const handleFieldTypeChange = (val: SqlFieldType | null, fieldId: number | null) => {
        setValue("field_type", val);
        // Reset select_multiple when changing field type
        setValue("select_multiple", null);
        setValue("dimensions", []);

        if (val === "dimension") {
            setValue("aggregation", null);
        }

        if (fieldId === null) {
            setValue("is_filterable", true);
            setValue("is_selectable", true);
            setValue("is_hidden", false);
            setValue("is_public", false);

            if (val === "dimension") {
                setValue("is_groupable", true);
                setValue("is_sortable", true);
            }

            if (["metric", "calculated_metric"].includes(val as string)) {
                setValue("is_groupable", false);
                setValue("is_sortable", false);
                setValue("is_filterable", false);
            }
        }

        validateField({ field_type: val });
    };

    useEffect(() => {
        if (isDimensionMultiple) return;
        const dataType = mappedColumns[field.expression];
        if (field.expression in mappedColumns && field.data_type !== dataType) {
            handleDataTypeChange(dataType);
        }
    }, [field.expression, mappedColumns]);

    const handleValidateDimensions = () => {
        setValue("dimensions", tempSelected);
        if (!field.name) {
            const autoName = tempSelected.map(s => s.name).join("_") || "multi_dimension";
            setValue("name", autoName.slice(0, 50));
        }
        setShowDimensionsModal(false);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-2xl space-y-4"
        >
            {/* Radio select_multiple — visible uniquement à la création, pour dimension */}
            {isNew && (
                <>
                    <FormSelect
                        label={`Dataset`}
                        value={field.dataset_id || dataset_id}
                        options={datasets.map((c) => ({ value: c.id, label: c.name }))}
                        onChange={(val) => {
                            setValue("dataset_id", val);
                            validateField();
                        }}
                        leftIcon={<FaTable />}
                        required
                    />
                    <FormSelect
                        label={`Field Type`}
                        value={field.field_type}
                        options={SqlFieldTypeList.map((c) => ({ value: c, label: c }))}
                        onChange={(val) => handleFieldTypeChange(val, field.id)}
                        leftIcon={getFieldTypeIcon(field.field_type)}
                        required
                    />

                    {field.field_type === "dimension" && (
                        <>
                            <div className="flex items-center gap-6 py-1">
                                <span className="text-sm font-medium text-gray-700">Sélection multiple</span>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <FormRadio
                                        name="select_multiple"
                                        checked={field.select_multiple}
                                        onChange={() => {
                                            setValue("select_multiple", true);
                                            setValue("dimensions", []);
                                        }}
                                    />
                                    <span className="text-sm">Oui</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="select_multiple"
                                        checked={field.select_multiple !== true}
                                        onChange={() => {
                                            setValue("select_multiple", false);
                                            setValue("dimensions", []);
                                        }}
                                    />
                                    <span className="text-sm">Non</span>
                                </label>
                            </div>
                            <br />
                        </>
                    )}
                </>
            )}

            {/* Champs restants : visibles seulement si field_type != dimension OU select_multiple === false */}
            {isDimensionMultiple ? (
                <div className="space-y-2">
                    <div className="flex items-center gap-3 flex-wrap">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                setTempSelected(field.dimensions ?? []);
                                setShowDimensionsModal(true);
                            }}
                        >
                            + Sélectionner les dimensions
                        </Button>
                        {(field.dimensions?.length ?? 0) > 0 && (
                            <span className="text-xs text-gray-500">{field.dimensions!.length} sélectionnée{field.dimensions!.length > 1 ? "s" : ""}</span>
                        )}
                    </div>
                    {(field.dimensions?.length ?? 0) > 0 && (
                        <div className="mt-2">
                            <Table
                                data={field.dimensions ?? []}
                                keyExtractor={(_, i) => i}
                                scrollable
                                maxHeight={220}
                                features={{ search: false, pagination: false, animate: false }}
                                columns={[
                                    { key: "name", header: "Nom", sortable: true, render: d => <span className="font-medium text-gray-800">{d.name}</span> },
                                    { key: "type", header: "Type", sortable: true, render: d => <span className="text-blue-500">{d.type}</span> },
                                    {
                                        key: "description", header: "Description", sortable: true, render: (d, i) => (
                                            <InlineEditCell
                                                value={d.description || ""}
                                                onChange={(v) => {
                                                    const updated = [...(field.dimensions ?? [])];
                                                    updated[i] = { ...updated[i], description: v };
                                                    setValue("dimensions", updated);
                                                }}
                                            />
                                        )
                                    },
                                ]}
                            />
                        </div>
                    )}
                </div>

            ) : isNotDimensionMultiple ? (
                <>
                    {isNew && (<FormSelect
                        label={`Data Type`}
                        value={field.data_type}
                        options={dataTypes.map((c) => ({ value: c, label: c }))}
                        onChange={handleDataTypeChange}
                        leftIcon={getDataTypeIcon(field.data_type)}
                        error={errors.data_type}
                        required
                    />)}

                    <FormSwitch
                        label={`Voir les colonnes`}
                        checked={showColumns}
                        onChange={(e) => setShowColumns(e.target.checked)}
                    />
                    <br />

                    {field.field_type && datasetColumns.length > 0 && (
                        <FormTextarea
                            label="Expression SQL"
                            value={field.expression}
                            hint="Ex: COUNT(id) CASE WHEN sex = 'M' THEN 1 END | Ex: DATE_TRUNC('month', created_at)"
                            onChange={e => {
                                const val = e.target.value;
                                handleExpressionChange(val);
                            }}
                            error={errors.expression}
                            rows={0} cols={0}
                            required
                        />
                    )}
                    {field.field_type === "metric" && (
                        <FormSelect
                            label="Aggregation"
                            value={field.aggregation}
                            options={AGGRAGATE_TYPES.map((c) => ({ value: c, label: c }))}
                            onChange={handleAggregationChange}
                            leftIcon={getAggregationIcon(field.aggregation)}
                            required
                        />
                    )}
                    <FormInput
                        label="Nom"
                        value={field.name}
                        onChange={(e) => {
                            setManuallyEdited(true);
                            setValue("name", e.target.value);
                        }}
                        leftIcon={getFieldTypeIcon(field.field_type)}
                        required
                    />

                    {/* Flags */}
                    <div className="grid grid-cols-2 gap-4 pt-2">
                        <div className="flex items-center justify-between">
                            <FormSwitch
                                label="Public"
                                checked={Boolean(field.is_public)}
                                onChange={(e) => setValue("is_public", e.target.checked)}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <FormSwitch
                                label="Filterable"
                                checked={Boolean(field.is_filterable)}
                                onChange={(e) => setValue("is_filterable", e.target.checked)}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <FormSwitch
                                label="Groupable"
                                checked={Boolean(field.is_groupable)}
                                onChange={(e) => setValue("is_groupable", e.target.checked)}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <FormSwitch
                                label="Sortable"
                                checked={Boolean(field.is_sortable)}
                                onChange={(e) => setValue("is_sortable", e.target.checked)}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <FormSwitch
                                label="Selectable"
                                checked={Boolean(field.is_selectable)}
                                onChange={(e) => setValue("is_selectable", e.target.checked)}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <FormSwitch
                                label="Hidden"
                                checked={Boolean(field.is_hidden)}
                                onChange={(e) => setValue("is_hidden", e.target.checked)}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <FormSwitch
                                label="Active"
                                checked={Boolean(field.is_active)}
                                onChange={(e) => setValue("is_active", e.target.checked)}
                            />
                        </div>
                    </div>

                    {/* Raw field */}
                    {isNew && (<div className="border rounded-xl p-3 bg-gray-50 space-y-3">
                        <p className="text-sm font-medium text-gray-700">Raw Field <span className="text-gray-400 font-normal">(optionnel)</span></p>
                        <div className="grid grid-cols-2 gap-3">
                            <FormInput
                                label="Nom"
                                value={field.raw_field?.name ?? ""}
                                onChange={(e) => setValue("raw_field", { ...(field.raw_field ?? { type: "" }), name: e.target.value })}
                                placeholder="ex: user_id"
                                disabled={!isNew}
                            />
                            <FormInput
                                label="Type"
                                value={field.raw_field?.type ?? ""}
                                onChange={(e) => setValue("raw_field", { ...(field.raw_field ?? { name: "" }), type: e.target.value })}
                                placeholder="ex: varchar"
                                disabled={!isNew}
                            />
                        </div>
                    </div>)}

                    <FormTextarea
                        label="Description"
                        value={field.description || ""}
                        onChange={(e) => setValue("description", e.target.value)}
                        placeholder="Description du field"
                        rows={0} cols={0}
                    />
                </>
            ) : null}

            {/* Modal sélection des dimensions (multi-select) */}
            <Modal
                isOpen={showDimensionsModal}
                onClose={() => setShowDimensionsModal(false)}
                title="Field - Columns"
                size="lg"
                footer={
                    <div className="flex gap-3">
                        <Button variant="outline" size="sm" onClick={() => setShowDimensionsModal(false)}>
                            Annuler
                        </Button>
                        <Button size="sm" onClick={handleValidateDimensions}>
                            Valider ({tempSelected.length})
                        </Button>
                    </div>
                }
            >
                <div className="p-4">
                    {datasetColumns.length === 0 ? (
                        <p className="text-sm text-gray-400 text-center py-4">Aucune colonne disponible</p>
                    ) : (
                        <Table
                            data={datasetColumns}
                            keyExtractor={(c) => c.name}
                            scrollable
                            maxHeight={340}
                            features={{ search: true, pagination: false, animate: false }}
                            searchPlaceholder="Rechercher une colonne..."
                            columns={[
                                {
                                    key: "select",
                                    header: (
                                        <input
                                            type="checkbox"
                                            className="rounded"
                                            checked={datasetColumns.length > 0 && tempSelected.length === datasetColumns.length}
                                            ref={el => { if (el) el.indeterminate = tempSelected.length > 0 && tempSelected.length < datasetColumns.length; }}
                                            onChange={(e) => {
                                                setTempSelected(e.target.checked
                                                    ? datasetColumns.map(c => ({ name: c.name, type: c.type, description: c.description ?? "" }))
                                                    : []
                                                );
                                            }}
                                            title="Tout sélectionner"
                                        />
                                    ),
                                    width: 40,
                                    render: (c) => {
                                        const isChecked = tempSelected.some(s => s.name === c.name);
                                        return (
                                            <input
                                                type="checkbox"
                                                checked={isChecked}
                                                className="rounded"
                                                onChange={() => setTempSelected(prev =>
                                                    isChecked
                                                        ? prev.filter(s => s.name !== c.name)
                                                        : [...prev, { name: c.name, type: c.type, description: c.description ?? "" }]
                                                )}
                                            />
                                        );
                                    },
                                },
                                {
                                    key: "name", header: "Nom", sortable: true, searchable: true,
                                    render: (c) => <span className="font-medium text-gray-800">{c.name}</span>,
                                },
                                {
                                    key: "type", header: "Type", sortable: true, searchable: true,
                                    render: (c) => <span className="text-gray-400">{c.type}</span>,
                                },
                                {
                                    key: "description", header: "Description",
                                    render: (c) => {
                                        const isChecked = tempSelected.some(s => s.name === c.name);
                                        const selected = tempSelected.find(s => s.name === c.name);
                                        if (!isChecked) return <span className="text-xs text-gray-300">—</span>;
                                        return (
                                            <input
                                                type="text"
                                                value={selected?.description ?? ""}
                                                onChange={(e) => setTempSelected(prev =>
                                                    prev.map(s => s.name === c.name ? { ...s, description: e.target.value } : s)
                                                )}
                                                placeholder="Description..."
                                                className="w-full text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:border-blue-400"
                                            />
                                        );
                                    },
                                },
                            ]}
                        />
                    )}
                </div>
            </Modal>
        </motion.div>
    )
};

interface DatasetFieldTabProps {
    tenants: Tenant[];
    tenant_id: number;

    datasets: Dataset[];
    dataset_id: number;
}
export const DatasetFieldTab = forwardRef<AdminEntityCrudModuleRef, DatasetFieldTabProps>(({ tenants, tenant_id, datasets, dataset_id }, ref) => {
    const [showColumns, setShowColumns] = useState<boolean>(false);
    const [hasFormError, setHasFormError] = useState(false);
    const [loading, setLoading] = useState(true);

    const defaultTenant = useMemo(() => {
        return { required: true, ids: [tenant_id, dataset_id] };
    }, [tenant_id, dataset_id]);

    const datasetMap = useMemo(() => {
        const map = new Map<number, Dataset>();
        datasets.forEach(d => {
            if (d.id != null) map.set(Number(d.id), d);
        });
        return map;
    }, [datasets]);

    const DEFAULT_FORM = useMemo(() => ({
        ...createDefaultForm(tenant_id),
        dataset_id: dataset_id ?? null,
    }), [tenant_id, dataset_id])


    return (
        <>
            <AdminEntityCrudModule<DatasetField>
                ref={ref}
                title="Gestion des Fields"
                icon={<Shield size={20} />}
                entityName="DatasetField"
                columns={datafieldColumns}
                defaultValue={DEFAULT_FORM}
                service={fieldService}
                defaultTenant={defaultTenant}
                onBeforeSave={(df) => ({ ...df, dataset_id: df.dataset_id ?? dataset_id ?? null })}
                isValid={df => !hasFormError && Boolean(df.dataset_id) && (
                    df.field_type === "dimension" && df.select_multiple === true
                        ? (df.dimensions?.length ?? 0) > 0
                        : Boolean(
                            df.name.trim() &&
                            df.expression.trim() &&
                            (
                                (df.field_type === "dimension" && !df.aggregation) ||
                                (df.field_type === "calculated_metric" && !df.aggregation) ||
                                (df.field_type === "metric" && df.aggregation)
                            )
                        )
                )}
                renderForm={(field, setValue, saving) => (
                    <DatasetFieldForm
                        field={field}
                        setValue={setValue}
                        tenants={tenants}
                        tenant_id={tenant_id}
                        datasets={datasets}
                        dataset_id={dataset_id}
                        datasetMap={datasetMap}
                        saving={saving}
                        showColumns={showColumns}
                        setShowColumns={setShowColumns}
                        onValidationChange={setHasFormError}
                    />
                )}
            />

            {/* Modal "Voir les colonnes" (switch général) */}
            <Modal
                isOpen={showColumns}
                onClose={() => setShowColumns(false)}
                title={"Field - Columns"}
                size="sm"
                footer={
                    <div className="flex gap-3">
                        <Button variant="outline" size="sm" onClick={() => setShowColumns(false)}>
                            Fermer
                        </Button>
                    </div>
                }
            >
                <div className="flex-1 overflow-auto bg-[#1e1e1e] p-6">
                    <table className="w-full table-auto border-collapse border border-gray-600">
                        <thead>
                            <tr>
                                <th>Nom</th>
                                <th>Type</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Array.from(datasetMap.values())
                                .flatMap(d => d.columns || [])
                                .map((c, idx) => (
                                    <tr key={idx} className="hover:bg-gray-700">
                                        <td className="border border-gray-600 px-2 py-1">{c.name}</td>
                                        <td className="border border-gray-600 px-2 py-1">{c.type}</td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>
            </Modal>
        </>
    );
});
