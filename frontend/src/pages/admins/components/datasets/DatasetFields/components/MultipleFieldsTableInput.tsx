import { Column, Table } from "@/components/ui/Table/Table";
import {
    AGGREGATE_BY_SQL_TYPE,
    DatasetColumn,
    DatasetField,
    SqlAggType,
    SqlDataType,
} from "@/models/dataset.models";
import { Dispatch, SetStateAction, useMemo } from "react";

interface TableProps {
    field: DatasetField;
    columns: DatasetColumn[];
    fields: DatasetColumn[];
    selectFields: Dispatch<SetStateAction<DatasetColumn[]>>;
}

export const MultipleFieldsTableInput = ({ field, columns, fields, selectFields }: TableProps) => {
    const formatedTableColumns = useMemo(() => {
        // 🔥 Optimisation lookup
        const selectedMap = new Map(fields.map((f) => [f.name, f]));

        const isAllSelected = columns.length > 0 && fields.length === columns.length;

        const isIndeterminate = fields.length > 0 && fields.length < columns.length;

        const tableColumns: Column<DatasetColumn>[] = [
            {
                key: "select",
                header: (
                    <input
                        type="checkbox"
                        className="rounded"
                        checked={isAllSelected}
                        ref={(el) => { if (el) el.indeterminate = isIndeterminate; }}
                        onChange={(e) => selectFields(e.target.checked ? columns : [])}
                        title="Tout sélectionner"
                    />
                ),
                width: 40,
                render: (c) => {
                    const isChecked = selectedMap.has(c.name);

                    return (
                        <input
                            type="checkbox"
                            checked={isChecked}
                            className="rounded"
                            onChange={() =>
                                selectFields((prev) => {
                                    if (isChecked) return prev.filter((s) => s.name !== c.name);
                                    // 👉 ajout avec aggregation par défaut si metric
                                    if (field.field_type === "metric") {
                                        const aggType = c.type as SqlDataType;
                                        const aggregates: SqlAggType[] = AGGREGATE_BY_SQL_TYPE[aggType] ?? ["count"];
                                        return [...prev, { ...c, aggregation: aggregates[0], field_type: "metric" }];
                                    }
                                    return [...prev, { ...c, field_type: "dimension" }];
                                })
                            }
                        />
                    );
                },
            },
            {
                key: "name",
                header: "Nom",
                sortable: true,
                searchable: true,
                render: (c) => (
                    <span className="font-medium text-gray-800">
                        {c.name}
                    </span>
                ),
            },
            {
                key: "type",
                header: "Type",
                sortable: true,
                searchable: true,
                render: (c) => (
                    <span className="text-gray-400">{c.type}</span>
                ),
            },
        ];

        // ✅ Aggregation (metrics uniquement)
        if (field.field_type === "metric") {
            tableColumns.push({
                key: "aggregation",
                header: "Aggregation",
                render: (c) => {
                    const isChecked = selectedMap.has(c.name);
                    if (!isChecked)
                        return <span className="text-xs text-gray-300">—</span>;

                    const selected = selectedMap.get(c.name)!;
                    const aggType = c.type as SqlDataType;

                    const aggregates: SqlAggType[] =
                        AGGREGATE_BY_SQL_TYPE[aggType] ?? ["count"];

                    const aggregation =
                        selected.aggregation ?? aggregates[0];

                    return (
                        <select
                            value={aggregation}
                            className="w-full text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:border-blue-400"
                            onChange={(e) =>
                                selectFields((prev) =>
                                    prev.map((s) =>
                                        s.name === c.name
                                            ? {
                                                ...s,
                                                aggregation:
                                                    e.target.value as SqlAggType,
                                            }
                                            : s
                                    )
                                )
                            }
                        >
                            {aggregates.map((agg) => (
                                <option key={agg} value={agg}>
                                    {agg}
                                </option>
                            ))}
                        </select>
                    );
                },
            });
        }

        // ✅ Description
        tableColumns.push({
            key: "description",
            header: "Description",
            render: (c) => {
                const selected = selectedMap.get(c.name);
                if (!selected)
                    return <span className="text-xs text-gray-300">—</span>;

                return (
                    <input
                        type="text"
                        value={selected.description ?? ""}
                        onChange={(e) =>
                            selectFields((prev) =>
                                prev.map((s) =>
                                    s.name === c.name
                                        ? { ...s, description: e.target.value }
                                        : s
                                )
                            )
                        }
                        placeholder="Description..."
                        className="w-full text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:border-blue-400"
                    />
                );
            },
        });

        return tableColumns;
    }, [fields, columns, field.field_type, selectFields]);

    return (
        <Table
            data={columns}
            keyExtractor={(c) => c.name}
            scrollable
            maxHeight={340}
            features={{
                search: true,
                pagination: false,
                animate: false,
            }}
            searchPlaceholder="Rechercher une colonne..."
            columns={formatedTableColumns}
        />
    );
};