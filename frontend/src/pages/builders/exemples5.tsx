import React, { useState, useEffect, useMemo } from "react";
import "./QueryBuilder.css"
// Types
type JoinType = "LEFT" | "RIGHT" | "INNER" | "FULL";
type OrderDirection = "ASC" | "DESC";
type LogicalOperator = "AND" | "OR";
type Aggregation = "" | "COUNT" | "COUNT(DISTINCT)" | "SUM" | "SUM(DISTINCT)" | "AVG" | "AVG(DISTINCT)" | "MIN" | "MAX"
// type Operator = "" | "=" | "!=" | ">" | "<" | ">=" | "<=" | "LIKE" | "IN" | "NOT IN" | "IS TRUE" | "IS NOT TRUE" | "BETWEEN" | "IS" | "IS NOT" | "IS NULL" | "IS NOT NULL" | "EXISTS";
type Operator = "" | "=" | "!=" | ">" | "<" | ">=" | "<=" | "LIKE" | "IN" | "NOT IN" | "IS TRUE" | "IS NOT TRUE" | "BETWEEN" | "IS NULL" | "IS NOT NULL" | "EXISTS";


interface CaseWhen {
    table: string;
    column: string;
    operator: Operator;
    value?: string;
    secondValue?: string; // BETWEEN
    // result?: string;
    // else?: string;
}
interface TableField {
    name: string,
    distinct?: boolean,
    alias?: string,
}
interface SelectField {
    table: string;
    column: string;
    alias?: string;
    agg?: Aggregation;
    distinct?: boolean;
    use_case_when?: boolean;
    case_when?: CaseWhen;
}
interface JoinCondition {
    left: string;
    right: string;
}
interface JoinClause {
    type: JoinType;
    table: string;
    alias?: string;
    conditions: JoinCondition[];
}
interface WhereClause {
    table: string;
    column: string;
    operator: Operator;
    value?: string;
    secondValue?: string; // BETWEEN
    logic?: LogicalOperator;
}
interface HavingClause {
    table: string;
    column: string;
    use_metric?: boolean;
    metric_calculated?: string; // alias du metric deja calculé 
    agg?: Aggregation;
    distinct?: boolean;
    use_case_when?: boolean;
    case_when?: CaseWhen;
    operator: Operator;
    value?: string;
    secondValue?: string; // BETWEEN
    logic?: LogicalOperator;
}
interface GroupByClause {
    table: string;
    column: string;
}
interface OrderByClause {
    table: string;
    column: string;
    use_metric?: boolean;
    metric_calculated: string; // alias du metric deja calculé 
    direction: OrderDirection;
}
interface QueryState {
    table: TableField;
    select: SelectField[];
    joins: JoinClause[];
    where: WhereClause[];
    group_by: GroupByClause[];
    having: HavingClause[];
    order_by: OrderByClause[];
    limit?: number;
    offset?: number;
}
interface Column {
    name: string,
    label: string,
    type: "dimension" | "metric"
}
interface Tables {
    name: string,
    label?: string,
    alias?: string,
    columns: Column[]
}
interface SectionState {
    key: keyof QueryState,
    label: string,
    component: string, // "Declare Component"
    visible: boolean
}

const DISTINCT_AGGR = ["COUNT(DISTINCT)", "SUM(DISTINCT)", "AVG(DISTINCT)"];
const SIMPLE_AGGR = ["COUNT", "SUM", "AVG"];
const OTHERS_AGGR = ["MIN", "MAX"];
const AGGREGATIONS: Aggregation[] = ["", ...SIMPLE_AGGR, ...DISTINCT_AGGR, ...OTHERS_AGGR] as any;
const NO_VALUE_OPERATOR = ["IS NULL", "IS NOT NULL", "EXISTS", "IS TRUE", "IS NOT TRUE"]
const OPERATORS: Operator[] = ["", "=", "!=", ">", "<", ">=", "<=", "LIKE", "IN", "NOT IN", "BETWEEN", ...NO_VALUE_OPERATOR] as any;

const defaultCaseWhen: CaseWhen = {
    table: "",
    column: "",
    operator: "",
    value: "",
    secondValue: ""
};

const defaultQuery: QueryState = {
    "table": { "name": "" },
    "select": [],
    "joins": [],
    "where": [],
    "group_by": [],
    "having": [],
    "order_by": [],
    "limit": undefined,
    "offset": undefined
};

interface BuilderProps {
    label: string;
    query: QueryState;
    tables: Tables[];
    metricsAlias?: string[]
    updateField: <T extends keyof QueryState>(key: T, value: QueryState[T]) => void;
    addItem?: <K extends keyof QueryState>(key: K, item: QueryState[K] extends Array<infer U> ? U : never) => void;
    removeItem?: <K extends keyof QueryState>(key: K, index: number) => void;
}

const getTableColumns = (tables: Tables[], name: string | undefined): Column[] | undefined => {
    return tables.find(t => t.name === name)?.columns;
}

const BuildMainTable: React.FC<BuilderProps> = ({ label, query, tables, updateField }) => {
    const tableKey = "table"
    const mainTable = query[tableKey];

    return mainTable ? (
        <div className="qb-section" key={tableKey}>
            <h3>{label}</h3>
            <div className="qb-row" key={tableKey} style={{ marginBottom: 10 }}>

                <select className="qb-select qb-medium"
                    value={mainTable.name}
                    onChange={(e) => {
                        const updated = { ...mainTable };
                        updated.name = e.target.value;
                        updateField(tableKey, updated);
                    }}
                >
                    {/* <option value="">None</option> */}
                    {tables.map((tb) => (
                        <option key={tb.name} value={tb.name}>{tb.label ?? tb.name}</option>
                    ))}
                </select>

                <label className="qb-checkbox" htmlFor={"table_distinct"}>
                    <input
                        id={"table_distinct"}
                        type="checkbox"
                        checked={mainTable.distinct || false}
                        onChange={(e) => {
                            const updated = { ...mainTable };
                            updated.distinct = e.target.checked;
                            updateField(tableKey, updated)
                        }}
                    />
                    DISTINCT (global)
                </label>

                <input className="qb-input qb-medium"
                    placeholder="Alias"
                    value={mainTable.alias || ""}
                    onChange={(e) => {
                        const updated = { ...mainTable };
                        updated.alias = e.target.value;
                        updateField(tableKey, updated);
                    }}
                />
            </div>
        </div>) : null;
}

const BuildSelect: React.FC<BuilderProps> = ({ label, query, tables, updateField, addItem, removeItem }) => {

    const selectKey = "select"
    return (
        <div className="qb-section" key={selectKey}>
            <h3>{label}</h3>
            <button className="qb-btn qb-btn-primary"
                onClick={() =>
                    addItem?.(selectKey, { table: "", column: "", agg: "", distinct: false })
                }
            >
                + Add Column
            </button>
            {query[selectKey].map((s, i) => {
                const selectDistinctId = `${i}_select_distinct`;
                const selectUseCaseId = `${i}_select_use_case`;
                return (
                    <div className="qb-row" key={i} style={{ marginBottom: 10 }}>
                        <select className="qb-select qb-medium"
                            value={s.table}
                            onChange={(e) => {
                                const updated = [...query[selectKey]];
                                updated[i].table = e.target.value;
                                updateField(selectKey, updated);
                            }}
                        >
                            {/* <option value="">None</option> */}
                            {tables.map((tb) => (
                                <option key={tb.name} value={tb.name}>{tb.label ?? tb.name}</option>
                            ))}
                        </select>

                        <select className="qb-select qb-medium"
                            value={s.column}
                            onChange={(e) => {
                                const updated = [...query[selectKey]];
                                updated[i].column = e.target.value;
                                updateField(selectKey, updated);
                            }}
                        >
                            {/* <option value="">None</option> */}
                            {getTableColumns(tables, s.table)?.map((tb) => (
                                <option key={tb.name} value={tb.name}>{tb.label ?? tb.name}</option>
                            ))}
                        </select>

                        <select className="qb-select qb-small"
                            value={s.agg || ""}
                            onChange={(e) => {
                                const updated = [...query[selectKey]];
                                updated[i].agg = e.target.value as Aggregation;
                                updateField(selectKey, updated);
                            }}
                        >
                            {/* <option value="">None</option> */}
                            {AGGREGATIONS.map((agg: Aggregation) => (
                                <option key={agg} value={agg}>{agg}</option>
                            ))}
                        </select>
                        {s.agg && (
                            <label className="qb-checkbox" htmlFor={selectDistinctId}>
                                <input
                                    id={selectDistinctId}
                                    type="checkbox"
                                    checked={s.distinct || false}
                                    onChange={(e) => {
                                        const updated = [...query[selectKey]];
                                        updated[i].distinct = e.target.checked;
                                        updateField(selectKey, updated);
                                    }}
                                />
                                DISTINCT
                            </label>)}

                        {s.agg && (
                            <label className="qb-checkbox" htmlFor={selectUseCaseId}>
                                <input
                                    id={selectUseCaseId}
                                    type="checkbox"
                                    checked={s.use_case_when || false}
                                    onChange={(e) => {
                                        const updated = [...query[selectKey]];
                                        updated[i].use_case_when = e.target.checked;
                                        updateField(selectKey, updated);
                                    }}
                                />
                                Cas_où
                            </label>)}

                        {s.agg && s.use_case_when && (
                            <select className="qb-select qb-medium"
                                value={s.case_when?.table}
                                onChange={(e) => {
                                    const updated = [...query[selectKey]];
                                    if (!updated[i].case_when) {
                                        updated[i].case_when = { ...defaultCaseWhen };
                                    }
                                    updated[i].case_when.table = e.target.value;
                                    updateField(selectKey, updated);
                                }}
                            >
                                {/* <option value="">None</option> */}
                                {tables.map((tb) => (
                                    <option key={tb.name} value={tb.name}>{tb.label ?? tb.name}</option>
                                ))}
                            </select>
                        )}

                        {s.agg && s.use_case_when && (
                            <select className="qb-select qb-medium"
                                value={s.case_when?.column}
                                onChange={(e) => {
                                    const updated = [...query[selectKey]];
                                    if (!updated[i].case_when) {
                                        updated[i].case_when = { ...defaultCaseWhen };;
                                    }
                                    updated[i].case_when.column = e.target.value;
                                    updateField(selectKey, updated);
                                }}
                            >
                                {/* <option value="">None</option> */}
                                {getTableColumns(tables, s.case_when?.table)?.map((tb) => (
                                    <option key={tb.name} value={tb.name}>{tb.label ?? tb.name}</option>
                                ))}
                            </select>
                        )}

                        {s.agg && s.use_case_when && (<select className="qb-select qb-small"
                            value={s.case_when?.operator}
                            onChange={(e) => {
                                const updated = [...query[selectKey]];
                                if (!updated[i].case_when) {
                                    updated[i].case_when = { ...defaultCaseWhen };;
                                }
                                updated[i].case_when.operator = e.target.value as Operator;
                                updateField(selectKey, updated);
                            }}
                        >
                            {OPERATORS.map((op: string) => (
                                <option key={op} value={op}>
                                    {op}
                                </option>
                            ))}
                        </select>)}

                        {s.agg && s.case_when && !NO_VALUE_OPERATOR.includes(s.case_when.operator) && (
                            <input className="qb-input qb-medium"
                                placeholder="Value"
                                value={s.case_when?.value || ""}
                                onChange={(e) => {
                                    const updated = [...query[selectKey]];
                                    if (!updated[i].case_when) {
                                        updated[i].case_when = { ...defaultCaseWhen };;
                                    }
                                    updated[i].case_when.value = e.target.value;
                                    updateField(selectKey, updated);
                                }}
                            />
                        )}

                        {s.agg && s.case_when?.operator === "BETWEEN" && (
                            <input className="qb-input qb-medium"
                                placeholder="Second Value"
                                value={s.case_when.secondValue || ""}
                                onChange={(e) => {
                                    const updated = [...query[selectKey]];
                                    if (!updated[i].case_when) {
                                        updated[i].case_when = { ...defaultCaseWhen };;
                                    }
                                    updated[i].case_when.secondValue = e.target.value;
                                    updateField(selectKey, updated);
                                }}
                            />
                        )}

                        <input className="qb-input qb-medium"
                            placeholder="Alias"
                            value={s.alias || ""}
                            onChange={(e) => {
                                const updated = [...query[selectKey]];
                                updated[i].alias = e.target.value;
                                updateField(selectKey, updated);
                            }}
                        />
                        <button className="qb-btn qb-btn-danger" onClick={() => removeItem?.(selectKey, i)}>X</button>
                    </div>
                )
            })}
        </div>
    );
}

const BuildJoin: React.FC<BuilderProps> = ({ label, query, tables, updateField, addItem, removeItem }) => {
    const joinsKey = "joins";
    return (
        <div className="qb-section" key={joinsKey}>
            <h3>{label}</h3>
            <button className="qb-btn qb-btn-primary"
                onClick={() =>
                    addItem?.(joinsKey, { type: "INNER", table: "", alias: "", conditions: [] })
                }
            >
                + Add Join
            </button>
            {query.joins.map((j, i) => (
                <div className="qb-row" key={i} style={{ marginBottom: 10 }}>
                    <select className="qb-select qb-small"
                        value={j.type}
                        onChange={(e) => {
                            const updated = [...query.joins];
                            updated[i].type = e.target.value as JoinType;
                            updateField(joinsKey, updated);
                        }}
                    >
                        <option value="INNER">INNER</option>
                        <option value="LEFT">LEFT</option>
                        <option value="RIGHT">RIGHT</option>
                        <option value="FULL">FULL</option>
                    </select>
                    <select className="qb-select qb-medium"
                        value={j.table}
                        onChange={(e) => {
                            const updated = [...query.joins];
                            updated[i].table = e.target.value;
                            updateField(joinsKey, updated);
                        }}
                    >
                        {/* <option value="">None</option> */}
                        {tables.map((tb) => (
                            <option key={tb.name} value={tb.name}>{tb.label ?? tb.name}</option>
                        ))}
                    </select>

                    <input className="qb-input qb-medium"
                        placeholder="Alias"
                        value={j.alias || ""}
                        onChange={(e) => {
                            const updated = [...query.joins];
                            updated[i].alias = e.target.value;
                            updateField(joinsKey, updated);
                        }}
                    />
                    <button className="qb-btn qb-btn-danger" onClick={() => removeItem?.(joinsKey, i)}>X</button>
                </div>
            ))}
        </div>
    );
}

const BuildWhere: React.FC<BuilderProps> = ({ label, query, tables, updateField, addItem, removeItem }) => {
    const whereKey = "where";

    return (
        <div className="qb-section" key={whereKey}>
            <h3>{label}</h3>
            <button className="qb-btn qb-btn-primary"
                onClick={() => {
                    addItem?.(whereKey, { "table": "", column: "", operator: "=", value: "", logic: "AND" })
                }}
            >
                + Add Condition
            </button>
            {query[whereKey].map((w, i) => (
                <div className="qb-row" key={i}>

                    <select className="qb-select qb-medium"
                        value={w.table}
                        onChange={(e) => {
                            const updated = [...query[whereKey]];
                            updated[i].table = e.target.value;
                            updateField(whereKey, updated);
                        }}
                    >
                        {/* <option value="">None</option> */}
                        {tables.map((tb) => (
                            <option key={tb.name} value={tb.name}>{tb.label ?? tb.name}</option>
                        ))}
                    </select>

                    <select className="qb-select qb-medium"
                        value={w.column}
                        onChange={(e) => {
                            const updated = [...query[whereKey]];
                            updated[i].column = e.target.value;
                            updateField(whereKey, updated);
                        }}
                    >
                        {/* <option value="">None</option> */}
                        {getTableColumns(tables, w.table)?.map((tb) => (
                            <option key={tb.name} value={tb.name}>{tb.label ?? tb.name}</option>
                        ))}
                    </select>

                    <select className="qb-select qb-small"
                        value={w.operator}
                        onChange={(e) => {
                            const updated = [...query[whereKey]];
                            updated[i].operator = e.target.value as Operator;
                            updateField(whereKey, updated);
                        }}
                    >
                        {OPERATORS.map((op: string) => (
                            <option key={op} value={op}>
                                {op}
                            </option>
                        ))}
                    </select>
                    {!NO_VALUE_OPERATOR.includes(w.operator) && (
                        <input className="qb-input qb-medium"
                            placeholder="Value"
                            value={w.value || ""}
                            onChange={(e) => {
                                const updated = [...query[whereKey]];
                                updated[i].value = e.target.value;
                                updateField(whereKey, updated);
                            }}
                        />
                    )}
                    {w.operator === "BETWEEN" && (
                        <input className="qb-input qb-medium"
                            placeholder="Second Value"
                            value={w.secondValue || ""}
                            onChange={(e) => {
                                const updated = [...query[whereKey]];
                                updated[i].secondValue = e.target.value;
                                updateField(whereKey, updated);
                            }}
                        />
                    )}
                    <select className="qb-select qb-small"
                        value={w.logic || "AND"}
                        onChange={(e) => {
                            const updated = [...query[whereKey]];
                            updated[i].logic = e.target.value as LogicalOperator;
                            updateField(whereKey, updated);
                        }}
                    >
                        <option value="AND">AND</option>
                        <option value="OR">OR</option>
                    </select>
                    <button className="qb-btn qb-btn-danger" onClick={() => removeItem?.(whereKey, i)}>X</button>
                </div>
            ))}
        </div>
    );
}

const BuildHaving: React.FC<BuilderProps> = ({ label, query, tables, metricsAlias, updateField, addItem, removeItem }) => {
    const havingKey = "having";

    return (
        <div className="qb-section" key={havingKey}>
            <h3>{label}</h3>
            <button className="qb-btn qb-btn-primary"
                onClick={() => {
                    addItem?.(havingKey, { "table": "", "column": "", use_metric: false, "metric_calculated": "", "agg": "", "distinct": false, "operator": "=", "value": "" })
                }}
            >
                + Add Condition
            </button>


            {query[havingKey].map((h, i) => {
                const havingUseMetricId = `${i}_having_use_metric`;
                const havingDistinctId = `${i}_having_distinct`;

                return (
                    <div className="qb-row" key={i}>

                        <label className="qb-checkbox" htmlFor={havingUseMetricId}>
                            <input
                                id={havingUseMetricId}
                                type="checkbox"
                                checked={h.use_metric || false}
                                onChange={(e) => {
                                    const updated = [...query[havingKey]];
                                    updated[i].use_metric = e.target.checked;
                                    updateField(havingKey, updated);
                                }}
                            />
                            Utiliser métric calculé
                        </label>

                        {!h.use_metric && (
                            <select className="qb-select qb-medium"
                                value={h.table}
                                onChange={(e) => {
                                    const updated = [...query[havingKey]];
                                    updated[i].table = e.target.value;
                                    updateField(havingKey, updated);
                                }}
                            >
                                {/* <option value="">None</option> */}
                                {tables.map((tb) => (
                                    <option key={tb.name} value={tb.name}>{tb.label ?? tb.name}</option>
                                ))}
                            </select>
                        )}

                        {!h.use_metric && (
                            <select className="qb-select qb-medium"
                                value={h.column}
                                onChange={(e) => {
                                    const updated = [...query[havingKey]];
                                    updated[i].column = e.target.value;
                                    updateField(havingKey, updated);
                                }}
                            >
                                {/* <option value="">None</option> */}
                                {getTableColumns(tables, h.table)?.map((tb) => (
                                    <option key={tb.name} value={tb.name}>{tb.label ?? tb.name}</option>
                                ))}
                            </select>
                        )}

                        {!h.use_metric && (<select className="qb-select qb-small"
                            value={h.agg || ""}
                            onChange={(e) => {
                                const updated = [...query[havingKey]];
                                updated[i].agg = e.target.value as Aggregation;
                                updateField(havingKey, updated);
                            }}
                        >
                            {/* <option value="">None</option> */}
                            {AGGREGATIONS.map((agg: Aggregation) => (
                                <option key={agg} value={agg}>{agg}</option>
                            ))}
                        </select>)}

                        {!h.use_metric && h.agg && (
                            <label className="qb-checkbox" htmlFor={havingDistinctId}>
                                <input
                                    id={havingDistinctId}
                                    type="checkbox"
                                    checked={h.distinct || false}
                                    onChange={(e) => {
                                        const updated = [...query[havingKey]];
                                        updated[i].distinct = e.target.checked;
                                        updateField(havingKey, updated);
                                    }}
                                />
                                DISTINCT
                            </label>
                        )}

                        {h.use_metric && (
                            <select className="qb-select qb-small"
                                value={h.metric_calculated}
                                onChange={(e) => {
                                    const updated = [...query[havingKey]];
                                    updated[i].metric_calculated = e.target.value;
                                    updateField(havingKey, updated);
                                }}
                            >
                                {metricsAlias?.map((m) => (
                                    <option key={m} value={m}>{m}</option>
                                ))}
                            </select>
                        )}

                        <select className="qb-select qb-small"
                            value={h.operator}
                            onChange={(e) => {
                                const updated = [...query[havingKey]];
                                updated[i].operator = e.target.value as Operator;
                                updateField(havingKey, updated);
                            }}
                        >
                            {OPERATORS.map((op: string) => (
                                <option key={op} value={op}>
                                    {op}
                                </option>
                            ))}
                        </select>

                        {!NO_VALUE_OPERATOR.includes(h.operator) && (
                            <input className="qb-input qb-medium"
                                placeholder="Value"
                                value={h.value || ""}
                                onChange={(e) => {
                                    const updated = [...query[havingKey]];
                                    updated[i].value = e.target.value;
                                    updateField(havingKey, updated);
                                }}
                            />
                        )}

                        {h.operator === "BETWEEN" && (
                            <input className="qb-input qb-medium"
                                placeholder="Second Value"
                                value={h.secondValue || ""}
                                onChange={(e) => {
                                    const updated = [...query[havingKey]];
                                    updated[i].secondValue = e.target.value;
                                    updateField(havingKey, updated);
                                }}
                            />
                        )}

                        <select className="qb-select qb-small"
                            value={h.logic || "AND"}
                            onChange={(e) => {
                                const updated = [...query[havingKey]];
                                updated[i].logic = e.target.value as LogicalOperator;
                                updateField(havingKey, updated);
                            }}
                        >
                            <option value="AND">AND</option>
                            <option value="OR">OR</option>
                        </select>

                        <button className="qb-btn qb-btn-danger" onClick={() => removeItem?.(havingKey, i)}>X</button>
                    </div>
                )
            })}
        </div>
    );
}

const BuildGroupBy: React.FC<BuilderProps> = ({ label, query, tables, updateField, addItem, removeItem }) => {
    const groupByKey = "group_by";

    return (
        <div className="qb-section" key={groupByKey}>
            <h3>{label}</h3>
            <button className="qb-btn qb-btn-primary" onClick={() => addItem?.(groupByKey, { "table": "", "column": "" })}>
                + Add Group
            </button>
            {query[groupByKey].map((g, i) => (
                <div className="qb-row" key={i}>
                    <select className="qb-select qb-medium"
                        value={g.table}
                        onChange={(e) => {
                            const updated = [...query[groupByKey]];
                            updated[i].table = e.target.value;
                            updateField(groupByKey, updated);
                        }}
                    >
                        {/* <option value="">None</option> */}
                        {tables.map((tb) => (
                            <option key={tb.name} value={tb.name}>{tb.label ?? tb.name}</option>
                        ))}
                    </select>

                    <select className="qb-select qb-medium"
                        value={g.column}
                        onChange={(e) => {
                            const updated = [...query[groupByKey]];
                            updated[i].column = e.target.value;
                            updateField(groupByKey, updated);
                        }}
                    >
                        {/* <option value="">None</option> */}
                        {getTableColumns(tables, g.table)?.map((tb) => (
                            <option key={tb.name} value={tb.name}>{tb.label ?? tb.name}</option>
                        ))}
                    </select>
                    <button className="qb-btn qb-btn-danger" onClick={() => removeItem?.(groupByKey, i)}>X</button>
                </div>
            ))}
        </div>
    );
}

const BuildOrderBy: React.FC<BuilderProps> = ({ label, query, tables, metricsAlias, updateField, addItem, removeItem }) => {
    const orderByKey = "order_by";


    return (
        <div className="qb-section" key={orderByKey}>
            <h3>{label}</h3>
            <button className="qb-btn qb-btn-primary" onClick={() => addItem?.(orderByKey, { table: "", column: "", use_metric: false, metric_calculated: "", direction: "ASC" })}>
                + Add Order
            </button>
            {query[orderByKey].map((o, i) => {

                const orderByUseMetricId = `${i}_order_by_use_metric`;

                return (
                    <div className="qb-row" key={i}>

                        <label className="qb-checkbox" htmlFor={orderByUseMetricId}>
                            <input
                                id={orderByUseMetricId}
                                type="checkbox"
                                checked={o.use_metric || false}
                                onChange={(e) => {
                                    const updated = [...query[orderByKey]];
                                    updated[i].use_metric = e.target.checked;
                                    updateField(orderByKey, updated);
                                }}
                            />
                            Utiliser métric calculé
                        </label>


                        {!o.use_metric && (
                            <select className="qb-select qb-medium"
                                value={o.table}
                                onChange={(e) => {
                                    const updated = [...query[orderByKey]];
                                    updated[i].table = e.target.value;
                                    updateField(orderByKey, updated);
                                }}
                            >
                                {/* <option value="">None</option> */}
                                {tables.map((tb) => (
                                    <option key={tb.name} value={tb.name}>{tb.label ?? tb.name}</option>
                                ))}
                            </select>
                        )}
                        {!o.use_metric && (
                            <select className="qb-select qb-medium"
                                value={o.column}
                                onChange={(e) => {
                                    const updated = [...query[orderByKey]];
                                    updated[i].column = e.target.value;
                                    updateField(orderByKey, updated);
                                }}
                            >
                                {/* <option value="">None</option> */}
                                {getTableColumns(tables, o.table)?.map((tb) => (
                                    <option key={tb.name} value={tb.name}>{tb.label ?? tb.name}</option>
                                ))}
                            </select>
                        )}
                        {o.use_metric && (
                            <select className="qb-select qb-small"
                                value={o.metric_calculated}
                                onChange={(e) => {
                                    const updated = [...query[orderByKey]];
                                    updated[i].metric_calculated = e.target.value;
                                    updateField(orderByKey, updated);
                                }}
                            >
                                {metricsAlias?.map((m) => (
                                    <option key={m} value={m}>{m}</option>
                                ))}
                            </select>
                        )}
                        <select className="qb-select qb-small"
                            value={o.direction}
                            onChange={(e) => {
                                const updated = [...query[orderByKey]];
                                updated[i].direction = e.target.value as OrderDirection;
                                updateField(orderByKey, updated);
                            }}
                        >
                            <option value="ASC">ASC</option>
                            <option value="DESC">DESC</option>
                        </select>
                        <button className="qb-btn qb-btn-danger" onClick={() => removeItem?.(orderByKey, i)}>X</button>
                    </div>
                )
            })}
        </div>
    );
}

const BuildLimitOffset: React.FC<BuilderProps> = ({ label, query, tables, updateField }) => {
    const limitKey = "limit";
    const offsetKey = "offset";

    return (
        <div className="qb-section" key={"limit_offset"}>
            <h3>{label}</h3>
            <div className="qb-row" key={0}>
                <div className="qb-row">
                    <h3>{label}</h3>
                    <input className="qb-input qb-medium"
                        type="number"
                        value={query[limitKey] || ""}
                        onChange={(e) => {
                            const newValue = e.target.value ? parseInt(e.target.value) : undefined;
                            updateField(limitKey, newValue)
                        }}
                    />
                </div>

                <div className="qb-row">
                    <h3>{label}</h3>
                    <input className="qb-input qb-medium"
                        type="number"
                        value={query[offsetKey] || ""}
                        onChange={(e) => {
                            const newValue = e.target.value ? parseInt(e.target.value) : undefined;
                            updateField(offsetKey, newValue)
                        }}
                    />
                </div>
            </div>
        </div>
    );

}

// HELPERS        
const escapeSqlString = (val: string): string => val.replace(/'/g, "''");
const isNumeric = (val: string): boolean => val.trim() !== "" && !isNaN(Number(val.replace(",", ".")));
const normalizeNumber = (val: string): number => Number(val.replace(",", "."));
const isISODate = (val: string): boolean => !isNaN(Date.parse(val));
const stripWrappers = (value: string): string => {
  return value.replace(/^[\(\[\{]\s*/, "").replace(/\s*[\)\]\}]$/, "");
};

const removeQuotes = (value: string): string => {
  return value.replace(/^['"]+/, "").replace(/['"]+$/, "").trim();
};

// SMART LIST NORMALIZER 
const normalizeListInput = (input: unknown): string[] => {
  if (Array.isArray(input)) return input.map(v => String(v).trim()).filter(Boolean);
  let value = String(input).trim();
  if (!value) return [];
  // Remove (), [], {}
  value = stripWrappers(value);
  // Normalize separators
  value = value.replace(/;/g, ",");
  // Collapse multiple spaces
  value = value.replace(/\s+/g, " ").trim();
  let parts: string[];
  if (value.includes(",")) {
    parts = value.split(",");
  } else if (value.includes(" ")) {
    parts = value.split(" ");
  } else {
    parts = [value];
  }
  return parts.map(v => removeQuotes(v)).filter(Boolean);
};

// IN CLAUSE FORMATTER
const formatInClause = (input: unknown): string => {
  const values = normalizeListInput(input);
  if (!values.length) return "()";
  const formatted = values.map(v => {
    if (isNumeric(v)) return normalizeNumber(v);
    return `'${escapeSqlString(v)}'`;
  });
  return `(${formatted.join(", ")})`;
};

// BETWEEN FORMATTER
const formatBetween = (input: string): string => {
  const parts = normalizeListInput(input);
  if (parts.length !== 2) throw new Error("BETWEEN requires exactly two values.");
  const [start, end] = parts;
  const formattedStart = isNumeric(start) ? normalizeNumber(start) : `'${escapeSqlString(start)}'`;
  const formattedEnd = isNumeric(end) ? normalizeNumber(end) : `'${escapeSqlString(end)}'`;
  return `${formattedStart} AND ${formattedEnd}`;
};

// MAIN FORMAT FUNCTION
export const formatSqlValue = (operator: Operator, rawValue: unknown): string | number => {
  // NULL operators
  if (operator === "IS NULL" || operator === "IS NOT NULL") return "";
  if (rawValue === null || rawValue === undefined) return "NULL";
  // Boolean
  if (typeof rawValue === "boolean") return rawValue ? "TRUE" : "FALSE";
  // Direct number
  if (typeof rawValue === "number") return rawValue;
  let value = String(rawValue).trim();
  if (!value) return "''";
  /* -------------------- IN -------------------- */
  if (operator === "IN") return formatInClause(rawValue);
  /* ------------------ BETWEEN ------------------ */
  if (operator === "BETWEEN") return formatBetween(value);
  /* --------------- AUTO NUMBER ----------------- */
  if (isNumeric(value)) return normalizeNumber(value);
  /* ------------------ DATE --------------------- */
  if (isISODate(value)) return `'${escapeSqlString(value)}'`;
  /* ---------------- DEFAULT STRING ------------- */
  return `'${escapeSqlString(removeQuotes(value))}'`;
};



// Component
const ExempleQueryBuilder: React.FC<any> = () => {
    const [query, setQuery] = useState<QueryState>(defaultQuery);
    const [tables, setTables] = useState<Tables[]>([]);

    const loadTable = async () => {
        const tablesFound: Tables[] | null = [
            {
                "name": "pcimne_data_view",
                "label": "Patient Data",
                "columns": [
                    { "name": "id", "label": "Patient ID", "type": "dimension" },
                    { "name": "age_in_years", "label": "Age", "type": "metric" },
                    { "name": "sex", "label": "Sex", "type": "dimension" },
                    { "name": "consultation_date", "label": "Consultation Date", "type": "dimension" },
                    { "name": "has_fever", "label": "Has Fever", "type": "dimension" },
                    { "name": "facility_id", "label": "Facility ID", "type": "dimension" },
                    { "name": "doctor_id", "label": "Doctor ID", "type": "dimension" }
                ]
            },
            {
                "name": "facility",
                "label": "Facility",
                "columns": [
                    { "name": "id", "label": "Facility ID", "type": "dimension" },
                    { "name": "name", "label": "Facility Name", "type": "dimension" },
                    { "name": "region", "label": "Region", "type": "dimension" }
                ]
            },
            {
                "name": "doctor",
                "label": "Doctor",
                "columns": [
                    { "name": "id", "label": "Doctor ID", "type": "dimension" },
                    { "name": "name", "label": "Doctor Name", "type": "dimension" }
                ]
            }
        ]
        setTables(tablesFound);
    }
    const loadQuery = async () => {
        const queryFound: QueryState = {
            "table": {
                "name": "pcimne_data_view",
                "distinct": true,
                "alias": "p",
            },
            "select": [
                { "table": "pcimne_data_view", "column": "id", "alias": "patient_id" },
                { "table": "pcimne_data_view", "column": "age_in_years", "alias": "avg_age", "agg": "AVG" },
                { "table": "pcimne_data_view", "column": "id", "alias": "unique_patients", "agg": "COUNT", "distinct": true },
                {
                    "table": "pcimne_data_view",
                    "column": "has_fever",
                    "alias": "fever_cases",
                    "agg": "COUNT",
                    "use_case_when": true,
                    "case_when": {
                        "table": "pcimne_data_view",
                        "column": "has_fever",
                        "operator": "IS TRUE",
                        "value": "",
                        "secondValue": ""
                    }
                }
            ],
            "joins": [
                {
                    "type": "LEFT",
                    "table": "facility",
                    "alias": "f",
                    "conditions": [{ "left": "pcimne_data_view.facility_id", "right": "f.id" }]
                },
                {
                    "type": "INNER",
                    "table": "doctor",
                    "alias": "d",
                    "conditions": [{ "left": "pcimne_data_view.doctor_id", "right": "d.id" }]
                }
            ],
            "where": [
                { "table": "pcimne_data_view", "column": "age_in_years", "operator": ">=", "value": "5" },
                { "table": "pcimne_data_view", "column": "age_in_years", "operator": "<=", "value": "65", "logic": "AND" },
                { "table": "pcimne_data_view", "column": "sex", "operator": "IN", "value": "('M','F')", "logic": "AND" }
            ],
            "group_by": [
                { "table": "pcimne_data_view", "column": "sex" },
                { "table": "pcimne_data_view", "column": "facility_id" },
                { "table": "facility", "column": "region" }
            ],
            "having": [
                { "table": "pcimne_data_view", "column": "id", "metric_calculated": "unique_patients", "agg": "COUNT", "distinct": true, "operator": ">", "value": "10" },
            ],
            "order_by": [
                { "table": "pcimne_data_view", "column": "id", "metric_calculated": "avg_age", "direction": "DESC" },
                { "table": "pcimne_data_view", "column": "id", "metric_calculated": "fever_cases", "direction": "ASC" }
            ],
            "limit": 1000,
            "offset": 50
        };
        setQuery(queryFound);
    }
    const getTableName = (tableName: string) => {
        const tb = tables.find(t => t.name === tableName);
        return tb?.alias ?? tb?.name;
    }

    useEffect(() => {
        loadTable();
        loadQuery();
    }, []);

    const toAlias = (left_right: string) => {
        const lr = left_right.split('.');
        if (lr.length === 2) {
            const table_name = lr[0];
            const col_name = lr[1];

            if (query.table.name === table_name && query.table.alias) {
                return `${query.table.alias}.${col_name}`
            }

            const lr_table = tables.find(t => t.name === table_name);

            if (lr_table && lr_table.alias) {
                return `${lr_table.alias}.${col_name}`
            }
        }
        return left_right;
    }

    const getCondition = (requete: string, operator: Operator, value: string | undefined, secondValue: string | undefined) => {
        let operation = operator.toLocaleUpperCase() as Operator;

        const cValue = formatSqlValue(operator, value);
        const cSecondValue = formatSqlValue(operator, secondValue);

        if (operation === "") {
            return `${requete} = ${cValue}`
        } else if (operation === "BETWEEN") {
            return `${requete} BETWEEN ${cValue} AND ${cSecondValue}`
        } else if (NO_VALUE_OPERATOR.includes(operation)) {
            return `${requete} ${operation}`
        } else {
            return `${requete} ${operation} ${cValue}`
        }
    }

    const metricsAlias = useMemo(() => {
        return query.select
            .filter(s => s.alias && s.alias !== "" && ((s.agg ?? "") !== "" || s.use_case_when))
            .map(sa => sa.alias!)
    }, [query.select])

    // Generic update helpers
    const updateField = <K extends keyof QueryState>(key: K, value: QueryState[K]) => {
        setQuery((prev) => ({ ...prev, [key]: value }));
    }
    const addItem = <K extends keyof QueryState>(key: K, item: QueryState[K] extends Array<infer U> ? U : never) => {
        const arr = query[key] as unknown as any[];
        updateField(key, [...arr, item] as any);
    };
    const removeItem = <K extends keyof QueryState>(key: K, index: number) => {
        const arr = query[key] as unknown as any[];
        updateField(key, arr.filter((_, i) => i !== index) as any);
    };

    // SQL Compiler
    const compileSQL = useMemo(() => {
        if (!query.select.length) return "-- No columns selected";

        const selectClause = query.select.map((s) => {
            const tableName = getTableName(s.table);
            if (!tableName) return; //throw new Error("No alias found")

            const tableColumn = toAlias(`${s.table}.${s.column}`)
            const aggr = (s.agg ?? "") !== "" ? s.agg!.toLocaleUpperCase() : null;
            const isDistinct = s.distinct ? true : (aggr ? DISTINCT_AGGR.includes(aggr) : false);
            let aliasCond = (s.alias ?? '') !== "" ? s.alias : `${tableName}_${s.column}`;

            let QUERY1 = "";
            let QUERY2 = "";

            if (isDistinct) {
                if (aggr) {
                    aliasCond = (s.alias ?? '') !== "" ? s.alias : `${aggr.toLocaleLowerCase()}_unique_${aliasCond}`;
                    if (!s.distinct) {
                        const distinctMethodFormated = aggr.replace(")", "")
                        QUERY1 = `${distinctMethodFormated} ${tableColumn})`;
                        QUERY2 = `${distinctMethodFormated}`;
                    } else if (s.distinct && SIMPLE_AGGR.includes(aggr)) {
                        QUERY1 = `${aggr}(DISTINCT ${tableColumn})`;
                        QUERY2 = `${aggr}(DISTINCT `;
                    } else {
                        QUERY1 = `COUNT(DISTINCT ${tableColumn})`;
                        QUERY2 = `COUNT(DISTINCT `;
                        // throw new Error("Impossible de faire un distinct sur Min & Max")
                    }
                } else {
                    QUERY1 = `(DISTINCT ${tableColumn}`;
                    QUERY2 = `(DISTINCT `;
                }
            } else {
                if (aggr) {
                    aliasCond = (s.alias ?? '') !== "" ? s.alias : `${aggr.toLocaleLowerCase()}_${aliasCond}`;
                    if ([...SIMPLE_AGGR, ...OTHERS_AGGR].includes(aggr)) {
                        QUERY1 = `${aggr}(${tableColumn})`;
                        QUERY2 = `${aggr}(`;
                    } else {
                        QUERY1 = `COUNT(${tableColumn})`;
                        QUERY2 = ``;
                    }
                } else {
                    QUERY1 = `${tableColumn}`;
                    QUERY2 = ``;
                }
            }

            if (s.use_case_when && s.case_when) {
                const ConditionTableColumn = toAlias(`${s.case_when.table}.${s.case_when.column}`);
                const condition = getCondition(ConditionTableColumn, s.case_when.operator, s.case_when.value, s.case_when.secondValue);
                // const thenCond = `${s.case_when.result}${s.case_when.else ? ` ELSE ${s.case_when.else}` : ""}`;

                // return `(${QUERY1} FILTER (WHERE ${condition})) AS "${aliasCond}"`;
                return `${QUERY2}CASE WHEN ${condition} THEN ${tableColumn} END) AS "${aliasCond}"`
                // return `(CASE WHEN ${condition} THEN ${thenCond} END) AS "${aliasCond}"`;
            }

            return aliasCond ? `${QUERY1} AS "${aliasCond}"` : QUERY1;
        }).join(", \n");

        const joinClause = query.joins
            .map((j) => {
                const joinElmt = `${j.table}${j.alias ? " " + j.alias : ""}`;

                const onElmtJoint = j.conditions.map((c) => `${toAlias(c.left)} = ${toAlias(c.right)}`);
                return `${j.type} JOIN ${joinElmt} ON ${onElmtJoint.join(" AND ")}`;
            }).join("\n");

        const whereClause = query.where.length
            ? "WHERE " +
            query.where
                .map((w, i) => {
                    let cond = "";
                    const tableColumn = toAlias(`${w.table}.${w.column}`)
                    cond = getCondition(tableColumn, w.operator, w.value, w.secondValue);

                    return i === 0 ? cond : `${w.logic ?? "AND"} ${cond}`;
                })
                .join(" \n")
            : "";

        const groupByClause = query.group_by.length
            ? "GROUP BY " +
            query.group_by
                .map((g, i) => {
                    return toAlias(`${g.table}.${g.column}`);
                }).join(", ")
            : "";

        const havingClause = query.having.length
            ? "HAVING " +
            query.having
                .map((h, i) => {

                    let COND = "";

                    if (h.use_metric && h.metric_calculated) {
                        COND = getCondition(h.metric_calculated, h.operator, h.value, h.secondValue)
                    } else {
                        const tableName = getTableName(h.table);
                        if (!tableName) return; //throw new Error("No alias found")

                        const tableColumn = toAlias(`${h.table}.${h.column}`)

                        const aggr = (h.agg ?? "") !== "" ? h.agg!.toLocaleUpperCase() : null;
                        const isDistinct = h.distinct ? true : (aggr ? DISTINCT_AGGR.includes(aggr) : false);

                        let QUERY1 = "";
                        let QUERY2 = "";

                        if (isDistinct) {
                            if (aggr) {
                                if (!h.distinct) {
                                    const distinctMethodFormated = aggr.replace(")", "")
                                    QUERY1 = `${distinctMethodFormated} ${tableColumn})`;
                                    QUERY2 = `${distinctMethodFormated}`;
                                } else if (h.distinct && SIMPLE_AGGR.includes(aggr)) {
                                    QUERY1 = `${aggr}(DISTINCT ${tableColumn})`;
                                    QUERY2 = `${aggr}(DISTINCT`;
                                } else {
                                    QUERY1 = `COUNT(DISTINCT ${tableColumn})`;
                                    QUERY2 = `COUNT(DISTINCT`;
                                    // throw new Error("Impossible de faire un distinct sur Min & Max")
                                }
                            } else {
                                QUERY1 = `DISTINCT ${tableColumn}`;
                                QUERY2 = `DISTINCT`;
                            }
                        } else {
                            if (aggr) {
                                if ([...SIMPLE_AGGR, ...OTHERS_AGGR].includes(aggr)) {
                                    QUERY1 = `${aggr}(${tableColumn})`;
                                    QUERY2 = `${aggr}`;
                                } else {
                                    QUERY1 = `COUNT(${tableColumn})`;
                                    QUERY2 = ``;
                                }
                            } else {
                                QUERY1 = `${tableColumn}`;
                                QUERY2 = ``;
                            }
                        }

                        if (h.use_case_when && h.case_when) {
                            const CaseWhenTableColumn = toAlias(`${h.case_when.table}.${h.case_when.column}`);
                            let CaseWhenOperation = h.case_when.operator.toLocaleUpperCase() as Operator;
                            const condition = getCondition(CaseWhenTableColumn, CaseWhenOperation, h.case_when.value, h.case_when.secondValue);
                            // const thenCond = `${s.case_when.result}${s.case_when.else ? ` ELSE ${s.case_when.else}` : ""}`;

                            const QueryCondition = `((${QUERY1}) FILTER (WHERE ${condition}))`
                            // const QueryCondition = `((${QUERY2} CASE WHEN ${condition} THEN ${tableColumn} END))`
                            // const QueryCondition = `(CASE WHEN ${condition} THEN ${thenCond} END)`;
                            COND = getCondition(QueryCondition, h.operator, h.value, h.secondValue);
                        } else {
                            COND = getCondition(QUERY1, h.operator, h.value, h.secondValue);
                        }
                    }

                    return i === 0 ? COND : `${h.logic ?? "AND"} ${COND}`;

                })
                .join(" \n")
            : "";

        const orderByClause = query.order_by.length
            ? "ORDER BY " +
            query.order_by.map((o) => {
                const tableAlias = toAlias(`${o.table}.${o.column}`);
                return `${tableAlias} ${o.direction}`
            }).join(", ")
            : "";

        const limitClause = query.limit ? `LIMIT ${query.limit}` : "";
        const offsetClause = query.offset ? `OFFSET ${query.offset}` : "";

        return `
SELECT ${query.table.distinct ? "DISTINCT " : ""}${selectClause}
FROM ${query.table.name}${query.table.alias ? " " + query.table.alias : ""}
${joinClause}
${whereClause}
${groupByClause}
${havingClause}
${orderByClause}
${limitClause}
${offsetClause};
`.trim();
    }, [query]);


    return (
        <div className="qb-container" style={{ padding: 20, maxWidth: 1400, margin: "auto" }}>
            <h2>Dynamic SQL Query Builder</h2>

            <BuildMainTable label={"Select Table"} query={query} tables={tables} updateField={updateField} />
            <BuildSelect label={"Select Columns"} query={query} tables={tables} updateField={updateField} addItem={addItem} removeItem={removeItem} />
            <BuildJoin label={"Joins"} query={query} tables={tables} updateField={updateField} addItem={addItem} removeItem={removeItem} />
            <BuildWhere label={"Filters"} query={query} tables={tables} updateField={updateField} addItem={addItem} removeItem={removeItem} />
            <BuildHaving label={"Having"} query={query} tables={tables} metricsAlias={metricsAlias} updateField={updateField} addItem={addItem} removeItem={removeItem} />
            <BuildGroupBy label={"Group By"} query={query} tables={tables} updateField={updateField} addItem={addItem} removeItem={removeItem} />
            <BuildOrderBy label={"Order By"} query={query} tables={tables} metricsAlias={metricsAlias} updateField={updateField} addItem={addItem} removeItem={removeItem} />
            <BuildLimitOffset label={"Limit/Offset"} query={query} tables={tables} updateField={updateField} />

            <h3>Generated SQL</h3>
            <pre className="qb-sql"
                style={{ background: "#111", color: "#0f0", padding: 15, borderRadius: 6 }}
            >
                {compileSQL}
            </pre>
        </div>
    );
};

export default ExempleQueryBuilder;
