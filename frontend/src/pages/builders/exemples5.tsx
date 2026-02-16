import React, { useState, useEffect, useMemo } from "react";
import "./QueryBuilder.css"
// Types
type JoinType = "LEFT" | "RIGHT" | "INNER" | "FULL";
type OrderDirection = "ASC" | "DESC";
type LogicalOperator = "AND" | "OR";

// 1️⃣ Règle de base
//     Dans une requête avec GROUP BY :
//     Dans SELECT :
//         soit une colonne apparaît dans le GROUP BY,
//         soit elle est utilisée dans une fonction d’agrégation (SUM, COUNT, AVG, etc.)
//     Dans ORDER BY :
//         soit une colonne agrégée (SUM(...))
//         soit une colonne présente dans le GROUP BY
//         soit toute colonn si pas de GROUP BY
//     Tout autre usage direct provoque une erreur SQL.



interface CaseWhen {
    table: string;
    column: string;
    alias?: string;
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
interface JoinClause {
    type: JoinType;
    left: { table: string, column: string, alias?: string };
    right: { table: string, column: string, alias?: string };
}
interface WhereClause {
    id: string;
    table: string;
    column: string;
    alias?: string;
    operator: Operator;
    value?: string;
    secondValue?: string; // BETWEEN
    logic?: LogicalOperator;
}
interface WhereGroup {
    id: string;
    logic?: LogicalOperator;  // logique AVANT ce groupe (entre groupes)
    conditions: WhereClause[];
}
interface HavingClause {
    table: string;
    column: string;
    alias?: string;
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
    alias?: string;
}
interface OrderByClause {
    table: string;
    column: string;
    alias?: string;
    use_metric?: boolean;
    metric_calculated: string; // alias du metric deja calculé 
    direction: OrderDirection;
}
interface QueryState {
    table: TableField;
    select: SelectField[];
    joins: JoinClause[];
    where: WhereGroup[];
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

const AGGREGATIONS = ["", "COUNT", "SUM", "AVG", "MIN", "MAX"] as const;
type Aggregation = (typeof AGGREGATIONS)[number];

const NO_VALUE_OPERATOR = ["IS NULL", "IS NOT NULL", "EXISTS", "IS TRUE", "IS NOT TRUE"];
type NoValueOperator = (typeof NO_VALUE_OPERATOR)[number];

const OPERATORS = ["", "=", "!=", ">", "<", ">=", "<=", "LIKE", "IN", "NOT IN", "BETWEEN", ...NO_VALUE_OPERATOR];
type Operator = (typeof OPERATORS)[number];

const defaultCaseWhen: CaseWhen = {
    table: "",
    column: "",
    operator: "=",
    value: "",
    secondValue: ""
};

const defaultJoin: JoinClause = {
    type: "INNER",
    left: { table: "", column: "", alias: "" },
    right: { table: "", column: "", alias: "" }
}

const createEmptyCondition = (): WhereClause => ({
    id: crypto.randomUUID(),
    table: "",
    column: "",
    operator: "=",
    logic: "AND",
});

const createEmptyGroup = (): WhereGroup => ({
    id: crypto.randomUUID(),
    logic: "AND",
    conditions: [createEmptyCondition()],
});

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
    groupByElements?: GroupByClause[];
    updateField: <T extends keyof QueryState>(key: T, value: QueryState[T]) => void;
    addItem?: <K extends keyof QueryState>(key: K, item: QueryState[K] extends Array<infer U> ? U : never) => void;
    removeItem?: <K extends keyof QueryState>(key: K, index: number) => void;
}

const getTableColumns = (tables: Tables[], name: string | undefined): Column[] | undefined => {
    return tables.find(t => t.name === name)?.columns;
}

const getTableAlias = (tables: Tables[], name: string | undefined): string | undefined => {
    return tables.find(t => t.name === name)?.alias;
}

const notNull = (val: any) => {
    return (val ?? "") !== "";
}


const TableColumnSelector: React.FC<{ table: string; column: string; alias?: string; tables: Tables[]; onChange: (field: "table" | "column" | "alias", value: string) => void; }> = ({ table, column, alias, tables, onChange }) => (
    <>
        <select value={table} onChange={e => onChange("table", e.target.value)}>
            {tables.map(tb => <option key={tb.name} value={tb.name}>{tb.label ?? tb.name}</option>)}
        </select>
        <select value={column} onChange={e => onChange("column", e.target.value)}>
            {getTableColumns(tables, table)?.map(c => <option key={c.name} value={c.name}>{c.label ?? c.name}</option>)}
        </select>
        <input value={alias ?? ""} placeholder="Alias" onChange={e => onChange("alias", e.target.value)} />
    </>
);


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
                        updated.alias = getTableAlias(tables, e.target.value);
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
                    addItem?.(selectKey, { table: "", column: "" })
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

                        {notNull(s.table) && (<select className="qb-select qb-medium"
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
                        </select>)}

                        {notNull(s.table) && (<select className="qb-select qb-small"
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
                        </select>)}

                        {notNull(s.table) && (<label className="qb-checkbox" htmlFor={selectDistinctId}>
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


                        {notNull(s.table) && (<label className="qb-checkbox" htmlFor={selectUseCaseId}>
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

                        {notNull(s.table) && s.use_case_when && (
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

                        {notNull(s.table) && s.use_case_when && (
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

                        {notNull(s.table) && s.use_case_when && (<select className="qb-select qb-small"
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

                        {notNull(s.table) && s.use_case_when && s.case_when && !NO_VALUE_OPERATOR.includes(s.case_when.operator) && (
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

                        {notNull(s.table) && s.use_case_when && s.case_when?.operator === "BETWEEN" && (
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

                        {notNull(s.table) && (<input className="qb-input qb-medium"
                            placeholder="Alias"
                            value={s.alias || ""}
                            onChange={(e) => {
                                const updated = [...query[selectKey]];
                                updated[i].alias = e.target.value;
                                updateField(selectKey, updated);
                            }}
                        />)}
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
                    addItem?.(joinsKey, defaultJoin)
                }
            >
                + Add Join
            </button>
            {query[joinsKey].map((j, i) => (
                <div className="qb-row" key={i} style={{ marginBottom: 10 }}>
                    <select className="qb-select qb-small"
                        value={j.type}
                        onChange={(e) => {
                            const updated = [...query[joinsKey]];
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
                        value={j.left.table}
                        onChange={(e) => {
                            const updated = [...query[joinsKey]];
                            updated[i].left.table = e.target.value;
                            updated[i].left.alias = getTableAlias(tables, e.target.value);
                            updateField(joinsKey, updated);
                        }}
                    >
                        {/* <option value="">None</option> */}
                        {tables.map((tb) => (
                            <option key={tb.name} value={tb.name}>{tb.label ?? tb.name}</option>
                        ))}
                    </select>

                    <select className="qb-select qb-medium"
                        value={j.left.column}
                        onChange={(e) => {
                            const updated = [...query[joinsKey]];
                            updated[i].left.column = e.target.value;
                            updateField(joinsKey, updated);
                        }}
                    >
                        {getTableColumns(tables, j.left.table)?.map(col => (
                            <option key={col.name} value={col.name}>
                                {col.label ?? col.name}
                            </option>
                        ))}
                    </select>

                    {(<input className="qb-input qb-medium"
                        placeholder="Alias"
                        value={j.left.alias || ""}
                        onChange={(e) => {
                            const updated = [...query[joinsKey]];
                            updated[i].left.alias = e.target.value;
                            updateField(joinsKey, updated);
                        }}
                    />)}

                    =


                    <select className="qb-select qb-medium"
                        value={j.right.table}
                        onChange={(e) => {
                            const updated = [...query[joinsKey]];
                            updated[i].right.table = e.target.value;
                            updated[i].right.alias = getTableAlias(tables, e.target.value);
                            updateField(joinsKey, updated);
                        }}
                    >
                        {/* <option value="">None</option> */}
                        {tables.map((tb) => (
                            <option key={tb.name} value={tb.name}>{tb.label ?? tb.name}</option>
                        ))}
                    </select>

                    <select className="qb-select qb-medium"
                        value={j.right.column}
                        onChange={(e) => {
                            const updated = [...query[joinsKey]];
                            updated[i].right.column = e.target.value;
                            updateField(joinsKey, updated);
                        }}
                    >
                        {getTableColumns(tables, j.right.table)?.map(col => (
                            <option key={col.name} value={col.name}>
                                {col.label ?? col.name}
                            </option>
                        ))}
                    </select>

                    {(<input className="qb-input qb-medium"
                        placeholder="Alias"
                        value={j.right.alias || ""}
                        onChange={(e) => {
                            const updated = [...query[joinsKey]];
                            updated[i].right.alias = e.target.value;
                            updateField(joinsKey, updated);
                        }}
                    />)}
                    <button className="qb-btn qb-btn-danger" onClick={() => removeItem?.(joinsKey, i)}>X</button>
                </div>
            ))}
        </div>
    );
}

// const BuildWhere: React.FC<BuilderProps> = ({ label, query, tables, updateField, addItem, removeItem }) => {
//     const whereKey = "where";

//     return (
//         <div className="qb-section" key={whereKey}>
//             <h3>{label}</h3>
//             <button className="qb-btn qb-btn-primary"
//                 onClick={() => {
//                     addItem?.(whereKey, { "table": "", column: "", operator: "=", value: "", logic: "AND" })
//                 }}
//             >
//                 + Add Condition
//             </button>
//             {query[whereKey].map((w, i) => (
//                 <div className="qb-row" key={i}>

//                     <select className="qb-select qb-medium"
//                         value={w.table}
//                         onChange={(e) => {
//                             const updated = [...query[whereKey]];
//                             updated[i].table = e.target.value;
//                             updateField(whereKey, updated);
//                         }}
//                     >
//                         {/* <option value="">None</option> */}
//                         {tables.map((tb) => (
//                             <option key={tb.name} value={tb.name}>{tb.label ?? tb.name}</option>
//                         ))}
//                     </select>

//                     <select className="qb-select qb-medium"
//                         value={w.column}
//                         onChange={(e) => {
//                             const updated = [...query[whereKey]];
//                             updated[i].column = e.target.value;
//                             updateField(whereKey, updated);
//                         }}
//                     >
//                         {/* <option value="">None</option> */}
//                         {getTableColumns(tables, w.table)?.map((tb) => (
//                             <option key={tb.name} value={tb.name}>{tb.label ?? tb.name}</option>
//                         ))}
//                     </select>

//                     <select className="qb-select qb-small"
//                         value={w.operator}
//                         onChange={(e) => {
//                             const updated = [...query[whereKey]];
//                             updated[i].operator = e.target.value as Operator;
//                             updateField(whereKey, updated);
//                         }}
//                     >
//                         {OPERATORS.map((op: string) => (
//                             <option key={op} value={op}>
//                                 {op}
//                             </option>
//                         ))}
//                     </select>
//                     {!NO_VALUE_OPERATOR.includes(w.operator) && (
//                         <input className="qb-input qb-medium"
//                             placeholder="Value"
//                             value={w.value || ""}
//                             onChange={(e) => {
//                                 const updated = [...query[whereKey]];
//                                 updated[i].value = e.target.value;
//                                 updateField(whereKey, updated);
//                             }}
//                         />
//                     )}
//                     {w.operator === "BETWEEN" && (
//                         <input className="qb-input qb-medium"
//                             placeholder="Second Value"
//                             value={w.secondValue || ""}
//                             onChange={(e) => {
//                                 const updated = [...query[whereKey]];
//                                 updated[i].secondValue = e.target.value;
//                                 updateField(whereKey, updated);
//                             }}
//                         />
//                     )}
//                     <select className="qb-select qb-small"
//                         value={w.logic || "AND"}
//                         onChange={(e) => {
//                             const updated = [...query[whereKey]];
//                             updated[i].logic = e.target.value as LogicalOperator;
//                             updateField(whereKey, updated);
//                         }}
//                     >
//                         <option value="AND">AND</option>
//                         <option value="OR">OR</option>
//                     </select>
//                     <button className="qb-btn qb-btn-danger" onClick={() => removeItem?.(whereKey, i)}>X</button>
//                 </div>
//             ))}
//         </div>
//     );
// }

const BuildWhere: React.FC<BuilderProps> = ({ label, query, tables, updateField }) => {

    const updateWhere = (groups: WhereGroup[]) => {
        updateField("where", groups);
    };

    const addGroup = () => {
        updateWhere([...query.where, createEmptyGroup()]);
    };

    const removeGroup = (groupId: string) => {
        updateWhere(query.where.filter(g => g.id !== groupId));
    };

    const addCondition = (groupId: string) => {
        updateWhere(
            query.where.map(g =>
                g.id === groupId
                    ? { ...g, conditions: [...g.conditions, createEmptyCondition()] }
                    : g
            )
        );
    };

    const removeCondition = (groupId: string, conditionId: string) => {
        updateWhere(
            query.where.map(g =>
                g.id === groupId
                    ? {
                        ...g,
                        conditions: g.conditions.filter(c => c.id !== conditionId),
                    }
                    : g
            )
        );
    };

    const updateCondition = (
        groupId: string,
        conditionId: string,
        field: keyof WhereClause,
        value: any
    ) => {
        updateWhere(
            query.where.map(g =>
                g.id === groupId
                    ? {
                        ...g,
                        conditions: g.conditions.map(c =>
                            c.id === conditionId
                                ? { ...c, [field]: value }
                                : c
                        ),
                    }
                    : g
            )
        );
    };

    const updateGroupLogic = (groupId: string, value: LogicalOperator) => {
        updateWhere(query.where.map(g => g.id === groupId ? { ...g, logic: value } : g));
    };


    const updateConditionLogic = (groupId: string, conditionId: string, value: LogicalOperator) => {
        updateWhere(query.where.map(g => g.id === groupId ? { ...g, conditions: g.conditions.map(c => c.id === conditionId ? { ...c, logic: value } : c) } : g));
    };


    return (
        <div className="qb-section">
            <h3>{label}</h3>

            <button className="qb-btn qb-btn-primary" onClick={addGroup}>
                + Add Group
            </button>

            {query.where.map((group, groupIndex) => (
                <div key={group.id} className="qb-group">

                    {groupIndex > 0 && (
                        <div className="qb-group-logic">
                            <select className="qb-select qb-medium"
                                value={group.logic}
                                onChange={(e) =>
                                    updateGroupLogic(group.id, e.target.value as LogicalOperator)
                                }
                            >
                                <option value="AND">AND</option>
                                <option value="OR">OR</option>
                            </select>
                        </div>
                    )}
                    <div className="qb-group-header">
                        <strong>Group {groupIndex + 1}</strong>

                        <button className="qb-btn qb-btn-danger" onClick={() => removeGroup(group.id)}>
                            Remove Group
                        </button>
                    </div>

                    {group.conditions.map(c => (
                        <div key={c.id} className="qb-row">

                            <select className="qb-select qb-medium"
                                value={c.table}
                                onChange={(e) => updateCondition(group.id, c.id, "table", e.target.value)}
                            >
                                {tables.map(tb => (
                                    <option key={tb.name} value={tb.name}>
                                        {tb.label ?? tb.name}
                                    </option>
                                ))}
                            </select>

                            <select className="qb-select qb-medium"
                                value={c.column}
                                onChange={(e) => updateCondition(group.id, c.id, "column", e.target.value)}
                            >
                                {getTableColumns(tables, c.table)?.map(col => (
                                    <option key={col.name} value={col.name}>
                                        {col.label ?? col.name}
                                    </option>
                                ))}
                            </select>

                            <select className="qb-select qb-medium"
                                value={c.operator}
                                onChange={(e) => updateCondition(group.id, c.id, "operator", e.target.value as Operator)}
                            >
                                {OPERATORS.map(op => (
                                    <option key={op} value={op}>
                                        {op}
                                    </option>
                                ))}
                            </select>

                            {!NO_VALUE_OPERATOR.includes(c.operator) && (
                                <input className="qb-input qb-medium"
                                    value={c.value || ""}
                                    onChange={(e) => updateCondition(group.id, c.id, "value", e.target.value)}
                                />
                            )}


                            {c.operator === "BETWEEN" && (
                                <input className="qb-input qb-medium"
                                    placeholder="Second Value"
                                    value={c.secondValue || ""}
                                    onChange={(e) => updateCondition(group.id, c.id, "secondValue", e.target.value)}
                                />
                            )}

                            <button className="qb-btn qb-btn-danger" onClick={() => removeCondition(group.id, c.id)}>
                                X
                            </button>


                            {<select className="qb-select qb-small"
                                value={c.logic} onChange={(e) => updateConditionLogic(group.id, c.id, e.target.value as LogicalOperator)}>
                                <option value="AND">AND</option>
                                <option value="OR">OR</option>
                            </select>}
                        </div>
                    ))}

                    <button
                        className="qb-btn qb-btn-secondary"
                        onClick={() => addCondition(group.id)}
                    >
                        + Add Condition
                    </button>
                </div>
            ))}
        </div>
    );
};

const BuildHaving: React.FC<BuilderProps> = ({ label, query, tables, metricsAlias, updateField, addItem, removeItem }) => {
    const havingKey = "having";

    return (
        <div className="qb-section" key={havingKey}>
            <h3>{label}</h3>
            <button className="qb-btn qb-btn-primary"
                onClick={() => {
                    addItem?.(havingKey, { "table": "", "column": "", use_metric: false, "metric_calculated": "", "distinct": false, "operator": "=", "value": "" })
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

                        {!h.use_metric && (
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

const BuildGroupBy: React.FC<BuilderProps> = ({ label, query, groupByElements, tables, updateField, addItem, removeItem }) => {
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
                    <h3>{"Limit"}</h3>
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
                    <h3>{'Offset'}</h3>
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
const formatBetween = (startInput: unknown, endInput: unknown): string => {
    if (startInput == null || endInput == null) {
        // throw new Error("BETWEEN requires two non-null values.");
        return `'' AND ''`;
    }

    const start = String(startInput).trim();
    const end = String(endInput).trim();

    if (!start || !end) {
        // throw new Error("BETWEEN requires two non-empty values.");
        return `'' AND ''`;
    }

    const formattedStart = isNumeric(start) ? normalizeNumber(start) : `'${escapeSqlString(start)}'`;
    const formattedEnd = isNumeric(end) ? normalizeNumber(end) : `'${escapeSqlString(end)}'`;

    return `${formattedStart} AND ${formattedEnd}`;
};

// MAIN FORMAT FUNCTION
const formatSqlValue = (operator: Operator, rawValue: unknown, rawSecondValue?: unknown): string | number => {

    // NULL direct
    if (rawValue === null || rawValue === undefined) return "NULL";
    // Boolean
    if (typeof rawValue === "boolean") return rawValue ? "TRUE" : "FALSE";
    // Number direct
    if (typeof rawValue === "number") return rawValue;

    const value = String(rawValue).trim();
    if (!value) return "''";
    /* -------------------- NO VALUE OPERATORS -------------------- */
    if (operator === "IS NULL" || operator === "IS NOT NULL") return "";
    /* -------------------- IN -------------------- */
    if (operator === "IN") return formatInClause(rawValue);
    /* ------------------ BETWEEN ------------------ */
    if (operator === "BETWEEN") return formatBetween(rawValue, rawSecondValue);
    /* --------------- AUTO NUMBER ----------------- */
    if (isNumeric(value)) return normalizeNumber(value);
    /* ------------------ DATE --------------------- */
    if (isISODate(value)) return `'${escapeSqlString(value)}'`;
    /* ---------------- DEFAULT STRING ------------- */
    return `'${escapeSqlString(removeQuotes(value))}'`;
};

const getCondition = (requete: string, operator: Operator, value?: unknown, secondValue?: unknown): string => {

    const operation = operator.toUpperCase() as Operator;

    if (!operation) {
        const formatted = formatSqlValue("=", value);
        return `${requete} = ${formatted}`;
    }

    if (operation === "BETWEEN") {
        const betweenValue = formatBetween(value, secondValue);
        return `${requete} BETWEEN ${betweenValue}`;
    }

    if (NO_VALUE_OPERATOR.includes(operation)) {
        return `${requete} ${operation}`;
    }

    const formatted = formatSqlValue(operation, value);
    return `${requete} ${operation} ${formatted}`;
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
                    "left": { "table": "pcimne_data_view", "column": "facility_id", "alias": "p" },
                    "right": { "table": "facility", "column": "id", "alias": "f" }
                },
                {
                    "type": "INNER",
                    "left": { "table": "pcimne_data_view", "column": "doctor_id", "alias": "p" },
                    "right": { "table": "doctor", "column": "id", "alias": "d" }
                }
            ],
            "where": [
                {
                    "id": "1",
                    "logic": "AND",
                    "conditions": [
                        { "id": "1", "table": "pcimne_data_view", "column": "age_in_years", "operator": ">=", "value": "5" },
                        { "id": "2", "table": "pcimne_data_view", "column": "age_in_years", "operator": "<=", "value": "65", "logic": "AND" },
                        { "id": "3", "table": "pcimne_data_view", "column": "sex", "operator": "IN", "value": "('M','F')", "logic": "AND" }
                    ]
                }
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

    // const toAlias = (left_right: string) => {
    //     const lr = left_right.split('.');
    //     if (lr.length === 2) {
    //         const table_name = lr[0];
    //         const col_name = lr[1];

    //         if (query.table.name === table_name && query.table.alias) {
    //             return `${query.table.alias}.${col_name}`
    //         }

    //         const lr_table = tables.find(t => t.name === table_name);

    //         if (lr_table && lr_table.alias) {
    //             return `${lr_table.alias}.${col_name}`
    //         }
    //     }
    //     return left_right;
    // }

    // const toAlias = (qualified: string): string => {
    //     if (!qualified) return qualified;

    //     const parts = qualified.split(".").map(p => p.trim());
    //     // On supporte uniquement table.column
    //     if (parts.length !== 2) return qualified;

    //     const [tableName, columnName] = parts;
    //     if (!tableName || !columnName) return qualified;

    //     // 1️⃣ Table principale
    //     if (query.table.name === tableName) {
    //         const alias = query.table.alias ?? query.table.name;
    //         return `${alias}.${columnName}`;
    //     }

    //     // 2️⃣ Tables des joins (depuis ton modèle joins)
    //     const joinMatch = query.joins.find(j =>
    //         j.left.table === tableName || j.right.table === tableName
    //     );

    //     if (joinMatch) {
    //         if (joinMatch.left.table === tableName) {
    //             const alias = joinMatch.left.alias ?? joinMatch.left.table;
    //             return `${alias}.${columnName}`;
    //         }

    //         if (joinMatch.right.table === tableName) {
    //             const alias = joinMatch.right.alias ?? joinMatch.right.table;
    //             return `${alias}.${columnName}`;
    //         }
    //     }

    //     // 3️⃣ Fallback sur tables globales si alias défini
    //     const tableMatch = tables.find(t => t.name === tableName);

    //     if (tableMatch?.alias) {
    //         return `${tableMatch.alias}.${columnName}`;
    //     }

    //     return qualified;
    // };

    const aliasMap = useMemo(() => {
        const map: Record<string, string> = {};
        // table principale
        map[query.table.name] = query.table.alias ?? query.table.name;
        // joins
        query.joins.forEach(j => {
            map[j.left.table] = j.left.alias ?? j.left.table;
            map[j.right.table] = j.right.alias ?? j.right.table;
        });
        return map;
    }, [query.table, query.joins]);


    const toAlias = (qualified: string): string => {
        if (!qualified) return qualified;

        const parts = qualified.split(".").map(p => p.trim());
        if (parts.length !== 2) return qualified;

        const [tableName, columnName] = parts;

        // 1️⃣ lookup rapide dans aliasMap (O(1))
        if (aliasMap[tableName]) {
            return `${aliasMap[tableName]}.${columnName}`;
        }

        // 2️⃣ fallback vers liste des tables globales
        const tableMeta = tables.find(t => t.name === tableName);

        if (tableMeta) {
            const alias = tableMeta.alias ?? tableMeta.name;
            return `${alias}.${columnName}`;
        }

        // 3️⃣ fallback final (ne casse jamais)
        return qualified;
    };

    const metricsAlias = useMemo(() => {
        return query.select
            .filter(s => notNull(s.alias) && (notNull(s.agg) || s.use_case_when))
            .map(sa => sa.alias!)
    }, [query.select]);

    const groupByElements = useMemo(() => {
        const groupsBy = metricsAlias.length > 0 ? query.select
            .filter(s => !(notNull(s.agg) || s.use_case_when))
            .map(sa => ({ table: sa.table, column: sa.column, alias: sa.alias }) as GroupByClause) : [];

        const groupByNameList: string[] = groupsBy.map(g => `${g.table}_${g.column}`)
        const groupByList: GroupByClause[] = [...groupsBy];

        for (const gp of (query.group_by ?? [])) {
            const name = `${gp.table}_${gp.column}`;
            if (!groupByNameList.includes(name)) {
                groupByList.push(gp);
                groupByNameList.push(name);
            }
        }
        return groupByList;
    }, [query.select]);


    // const orderByElements: OrderByClause[] = useMemo(() => {
    //     // 1️⃣ Colonnes du GROUP BY autorisées
    //     const groupByCols = groupByElements.map(g => g.alias ?? toAlias(`${g.table}.${g.column}`)).filter(notNull);

    //     // 2️⃣ Colonnes d’agrégats autorisées (metrics)
    //     const aggCols = metricsAlias.filter(notNull);

    //     // 3️⃣ Filtrer les order_by existants dans query
    //     return (query.order_by ?? [])
    //         .filter(ob => {
    //             const columnAlias = toAlias(`${ob.table}.${ob.column}`);
    //             const allowedCols = [...groupByCols, ...aggCols];

    //             if (ob.use_metric) {
    //                 // Si c’est un metric calculé, on vérifie que son alias est autorisé
    //                 return allowedCols.includes(ob.metric_calculated);
    //             }

    //             // Sinon on autorise soit l’alias, soit la colonne avec table
    //             return allowedCols.includes(ob.alias ?? '') || allowedCols.includes(columnAlias);
    //         })
    //         .map(ob => ({
    //             ...ob,
    //             direction: ob.direction ?? "ASC"
    //         }));
    // }, [groupByElements, metricsAlias, query.order_by]);


    const orderByElements: OrderByClause[] = useMemo(() => {
        const groupByCols = groupByElements.map(g => g.alias ?? toAlias(`${g.table}.${g.column}`)).filter(notNull);
        const aggCols = metricsAlias.filter(notNull);

        return (query.order_by ?? [])
            .filter(ob => {
                if (ob.use_metric) return !!ob.metric_calculated && aggCols.includes(ob.metric_calculated);
                const aliasOrCol = ob.alias ?? toAlias(`${ob.table}.${ob.column}`);
                return groupByCols.includes(aliasOrCol) || aggCols.includes(aliasOrCol);
            })
            .map(ob => ({ ...ob, direction: ob.direction ?? "ASC" }));
    }, [groupByElements, metricsAlias, query.order_by]);


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
            const aggr = notNull(s.agg) ? s.agg!.toLocaleUpperCase() : null;
            let aliasCond = notNull(s.alias) ? s.alias : `${tableName}_${s.column}`;

            let QUERY1 = "";
            let QUERY2 = "";

            if (s.distinct) {
                if (aggr) {
                    aliasCond = notNull(s.alias) ? s.alias : `${aggr.toLocaleLowerCase()}_unique_${aliasCond}`;
                    QUERY1 = `${aggr}(DISTINCT ${tableColumn})`;
                    QUERY2 = `${aggr}(DISTINCT `;
                } else {
                    QUERY1 = `(DISTINCT ${tableColumn}`;
                    QUERY2 = `(DISTINCT `;
                }
            } else {
                if (aggr) {
                    aliasCond = notNull(s.alias) ? s.alias : `${aggr.toLocaleLowerCase()}_${aliasCond}`;
                    QUERY1 = `${aggr}(${tableColumn})`;
                    QUERY2 = `${aggr}(`;
                } else {
                    QUERY1 = `${tableColumn}`;
                    QUERY2 = ``;
                }
            }

            if (s.use_case_when && s.case_when) {
                const ConditionTableColumn = toAlias(`${s.case_when.table}.${s.case_when.column}`);
                const condition = getCondition(ConditionTableColumn, s.case_when.operator, s.case_when.value, s.case_when.secondValue);
                // const thenCond = `${s.case_when.result}${s.case_when.else ? ` ELSE ${s.case_when.else}` : ""}`;

                return `(${QUERY1} FILTER (WHERE ${condition})) AS "${aliasCond}"`;
                // return `${QUERY2}CASE WHEN ${condition} THEN ${tableColumn} END) AS "${aliasCond}"`
                // return `(CASE WHEN ${condition} THEN ${thenCond} END) AS "${aliasCond}"`;
            }

            return aliasCond ? `${QUERY1} AS "${aliasCond}"` : QUERY1;
        }).join(", \n");

        // const joinClause = query.joins
        //     .map((j) => {
        //         const joinColumn = toAlias(`${j.alias??j.table}.${j.column}`);
        //         const joinElmt = `${j.table}${j.alias ? " " + j.alias : ""}`;

        //         const onElmtJoint = j.conditions.map((c) => `${toAlias(c.left)} = ${toAlias(c.right)}`);
        //         return `${j.type} JOIN ${joinElmt} ON ${onElmtJoint.join(" AND ")}`;
        //     }).join("\n");

        const joinClause = query.joins.length
            ? query.joins
                .map((j) => {
                    const rightTable = j.right.alias
                        ? `${j.right.table} ${j.right.alias}`
                        : j.right.table;

                    const leftColumn = toAlias(`${j.left.table}.${j.left.column}`);

                    const rightColumn = toAlias(`${j.right.table}.${j.right.column}`);

                    return `${j.type} JOIN ${rightTable} ON ${leftColumn} = ${rightColumn}`;
                })
                .join("\n")
            : "";


        // const whereClause = query.where.length
        //     ? "WHERE " +
        //     query.where
        //         .map((w, i) => {
        //             let cond = "";
        //             const tableColumn = toAlias(`${w.alias??w.table}.${w.column}`)
        //             cond = getCondition(tableColumn, w.operator, w.value, w.secondValue);

        //             return i === 0 ? cond : `${w.logic ?? "AND"} ${cond}`;
        //             return ""
        //         })
        //         .join(" \n")
        //     : "";

        const whereClause = query.where.length
            ? "WHERE " + (query.where.length > 1 ? "\n" : "") +
            query.where
                .map((g, i) => {
                    if (!g.conditions.length) return "";
                    const groupConditions = g.conditions
                        .map((c, j) => {
                            const tableColumn = toAlias(`${c.table}.${c.column}`);
                            const cond = getCondition(tableColumn, c.operator, c.value, c.secondValue);
                            if (!cond) return "";
                            return (j === 0 ? cond : `${c.logic ?? "AND"} ${cond}`);
                        })
                        .filter(Boolean)
                        .join("\n    ");

                    if (!groupConditions) return "";
                    const wrappedGroup = query.where.length > 1 ? `(\n    ${groupConditions}\n)` : groupConditions;
                    return i === 0 ? wrappedGroup : `${g.logic ?? "AND"} ${wrappedGroup}`;
                })
                .filter(Boolean)
                .join("\n")
            : "";


        const groupByClause = groupByElements.length
            ? "GROUP BY " +
            groupByElements
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

                        const aggr = notNull(h.agg) ? h.agg!.toLocaleUpperCase() : null;

                        let QUERY1 = "";
                        let QUERY2 = "";

                        if (h.distinct) {
                            if (aggr) {
                                QUERY1 = `${aggr}(DISTINCT ${tableColumn})`;
                                QUERY2 = `${aggr}(DISTINCT`;
                            } else {
                                QUERY1 = `DISTINCT ${tableColumn}`;
                                QUERY2 = `DISTINCT`;
                            }
                        } else {
                            if (aggr) {
                                QUERY1 = `${aggr}(${tableColumn})`;
                                QUERY2 = `${aggr}`;
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

        // ------------------------
        // ORDER BY CLAUSE SQL
        // ------------------------
        const orderByClause = orderByElements.length
            ? "ORDER BY " + orderByElements
                .map(o => {
                    const columnRef = o.use_metric
                        ? o.metric_calculated // utiliser alias du metric calculé
                        : toAlias(`${o.table}.${o.column}`);
                    return `${columnRef} ${o.direction}`;
                })
                .join(", ")
            : "";

        const limitClause = notNull(query.limit) ? `LIMIT ${query.limit}` : "";
        const offsetClause = notNull(query.offset) ? `OFFSET ${query.offset}` : "";

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
            <pre className="qb-sql" style={{ background: "#111", color: "#0f0", padding: 15, borderRadius: 6 }}>
                {compileSQL}
            </pre>
        </div>
    );
};


// --- Helpers SQL sécurisés ---
export const sanitizeIdentifier = (name: string) => {
    // Autorise uniquement lettres, chiffres, underscore, pas de SQL injection
    if (!name) throw new Error("Identifier cannot be empty");
    return name.replace(/[^a-zA-Z0-9_]/g, "_");
};

export const escapeSqlValue = (value: any) => {
    if (value === null || value === undefined) return "NULL";
    if (typeof value === "number") return value.toString();
    return `'${value.toString().replace(/'/g, "''")}'`;
};

export const formatInClauses = (values: any[]) => {
    if (!values.length) return "(NULL)"; // safe fallback
    return `(${values.map(escapeSqlValue).join(", ")})`;
};

export const formatBetweenClause = (start: any, end: any) => {
    if (start === undefined || end === undefined) return "1=0"; // safe fallback
    return `${escapeSqlValue(start)} AND ${escapeSqlValue(end)}`;
};


const compileSelectField = (field: SelectField) => {
    const table = sanitizeIdentifier(field.table);
    const column = sanitizeIdentifier(field.column);
    let sql = `${table}.${column}`;

    if (field.use_case_when && field.case_when) {
        sql = `(${field.case_when})`;
    }

    if (field.agg) {
        sql = `${field.agg}(${field.distinct ? "DISTINCT " : ""}${sql})`;
    } else if (field.distinct) {
        sql = `DISTINCT ${sql}`;
    }

    const alias = sanitizeIdentifier(field.alias || `${table}_${column}`);
    return `${sql} AS ${alias}`;
}


interface Condition {
    table: string;
    column: string;
    operator: string; // =, !=, >, <, IN, BETWEEN, IS NULL, LIKE ...
    value?: any;
    secondValue?: any; // pour BETWEEN
    logical?: "AND" | "OR";
}


export const compileCondition = (cond: Condition) => {
    const table = sanitizeIdentifier(cond.table);
    const column = sanitizeIdentifier(cond.column);
    const op = cond.operator.toUpperCase();

    switch (op) {
        case "IN":
            return `${table}.${column} IN ${formatInClause(cond.value || [])}`;
        case "BETWEEN":
            return `${table}.${column} BETWEEN ${formatBetweenClause(cond.value, cond.secondValue)}`;
        case "IS NULL":
        case "IS NOT NULL":
            return `${table}.${column} ${op}`;
        default:
            if (cond.value === undefined || cond.value === null) return "1=0"; // safe fallback
            return `${table}.${column} ${op} ${escapeSqlValue(cond.value)}`;
    }
};

export const compileConditions = (conds: Condition[]) => {
    if (!conds.length) return "";
    return conds
        .map((c, idx) => {
            const prefix = idx === 0 ? "" : (c.logical || "AND") + " ";
            return prefix + compileCondition(c);
        })
        .join(" ");
};


interface Join {
    type: "INNER" | "LEFT" | "RIGHT" | "FULL";
    table: string;
    on: string; // déjà formaté sécurisée par sanitizeIdentifier
}

export const compileJoin = (join: Join) => {
    return `${join.type} JOIN ${sanitizeIdentifier(join.table)} ON ${join.on}`;
};

export const compileGroupBy = (fields: SelectField[]) =>
    fields.length ? fields.map(f => `${sanitizeIdentifier(f.table)}.${sanitizeIdentifier(f.column)}`).join(", ") : "";

export const compileOrderBy = (fields: { table: string; column: string; direction?: "ASC" | "DESC" }[]) =>{
    return fields.map(f => {
        return `${sanitizeIdentifier(f.table)}.${sanitizeIdentifier(f.column)} ${f.direction || "ASC"}`;
    }).join(", ");
}


const compileJoinClause = () => {
    return ""
}

const compileWhereClause = () => {
    return ""
}

const compileHavingClause = () => {
    return ""
}

const compileGroupByClause = () => {
    return ""
}

const compileOrderByClause = () => {
    return ""
}

const compileLimitOffset = () => {
    return ""
}

interface Query {
  select: SelectField[];
  from: string;
  joins?: Join[];
  where?: Condition[];
  groupBy?: SelectField[];
  having?: Condition[];
  orderBy?: { table: string; column: string; direction?: "ASC" | "DESC" }[];
  limit?: number;
  offset?: number;
}

export const compileSQL = (query: Query) => {
  if (!query.select.length) return "-- No columns selected";

  return [
    `SELECT ${query.select.map(compileSelectField).join(", ")}`,
    `FROM ${sanitizeIdentifier(query.from)}`,
    query.joins?.map(compileJoin).join(" ") || "",
    query.where?.length ? `WHERE ${compileConditions(query.where)}` : "",
    query.groupBy?.length ? `GROUP BY ${compileGroupBy(query.groupBy)}` : "",
    query.having?.length ? `HAVING ${compileConditions(query.having)}` : "",
    query.orderBy?.length ? `ORDER BY ${compileOrderBy(query.orderBy)}` : "",
    query.limit ? `LIMIT ${query.limit}` : "",
    query.offset ? `OFFSET ${query.offset}` : "",
  ]
    .filter(Boolean)
    .join("\n");
};


export default ExempleQueryBuilder;
