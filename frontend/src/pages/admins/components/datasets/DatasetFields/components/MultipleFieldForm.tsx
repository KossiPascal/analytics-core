import { useMemo } from "react";
import { DatasetField, DatasetColumn, SqlFieldType } from "@/models/dataset.models";
import { Button } from "@/components/ui/Button/Button";
import { InlineEditCell } from "@/components/ui/InlineEditCell/InlineEditCell";
import { Column, Table } from "@/components/ui/Table/Table";

interface FormProps {
    field: DatasetField;
    setSelectedFields: (data: DatasetColumn[]) => void;
    showModal: (val: boolean) => void;
    setValue: (key: "dimensions" | "metrics", data: DatasetColumn[]) => void;
}

interface BuildTableProps {
    field_type: SqlFieldType | null;
    fields: DatasetColumn[];
    setValue: (key: "dimensions" | "metrics", data: DatasetColumn[]) => void;
}

const BuildTable = ({ field_type, fields, setValue }: BuildTableProps) => {
    if (!field_type || fields.length === 0) return null;

    const setTableValue = (data: DatasetColumn[]) => {
        setValue(field_type === "metric" ? "metrics" : "dimensions", data);
    };

    const columns: Column<DatasetColumn>[] = [
        {
            key: "name",
            header: "Nom",
            sortable: true,
            render: (d) => (<span className="font-medium text-gray-800">{d.name}</span>),
        },
        {
            key: "type",
            header: "Type",
            sortable: true,
            render: (d) => (<span className="text-blue-500">{d.type}</span>),
        },
    ];

    // ✅ Colonne aggregation (metrics uniquement)
    if (field_type === "metric") {
        columns.push({
            key: "aggregation",
            header: "Aggregation",
            sortable: true,
            render: (d) => (<span className="text-blue-500">{d.aggregation ?? '—'}</span>),
        });
    }

    // ✅ Description
    columns.push({
        key: "description",
        header: "Description",
        sortable: true,
        render: (d, i) => (
            <InlineEditCell
                value={d.description ?? ""}
                onChange={(v) => {
                    const updated = [...fields];
                    updated[i] = { ...d, description: v };
                    setTableValue(updated);
                }}
            />
        ),
    });

    return (
        <div className="mt-2">
            <Table
                data={fields}
                keyExtractor={(row, i) => row.name ?? i} // ⚠️ évite index si possible
                scrollable
                maxHeight={220}
                features={{ search: false, pagination: false, animate: false }}
                columns={columns}
            />
        </div>
    );
};

export const MultipleFieldForm = ({ field, setSelectedFields, showModal, setValue }: FormProps) => {

    const selectedFields = useMemo(() => {
        if (field.field_type === "metric") return field.metrics ?? [];
        if (field.field_type === "dimension") return field.dimensions ?? [];
        return [];
    }, [field.field_type, field.metrics, field.dimensions]);

    const fieldType = field.field_type;

    return (
        <div className="space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                        setSelectedFields(selectedFields);
                        showModal(true);
                    }}
                >
                    {`+ Sélectionner les ${fieldType ?? ""}s`}
                </Button>

                {selectedFields.length > 0 && (
                    <span className="text-xs text-gray-500">
                        {selectedFields.length} sélectionnée
                        {selectedFields.length > 1 ? "s" : ""}
                    </span>
                )}
            </div>

            <BuildTable
                field_type={fieldType}
                fields={selectedFields}
                setValue={setValue}
            />
        </div>
    );
};