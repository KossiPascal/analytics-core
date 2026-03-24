import { FormInput } from "@/components/forms/FormInput/FormInput";
import { FormSelect } from "@/components/forms/FormSelect/FormSelect";
import { FormSwitch } from "@/components/forms/FormSwitch/FormSwitch";
import { FormTextarea } from "@/components/forms/FormTextarea/FormTextarea";
import { Dispatch, SetStateAction, useMemo } from "react";
import { getAggregationIcon, getDataTypeIcon, getFieldTypeIcon } from "./utils";
import { AGGRAGATE_TYPES, DatasetColumn, DatasetField, SqlAggType, SqlDataType } from "@/models/dataset.models";


interface FormProps {
    columns: DatasetColumn[]
    field: DatasetField
    showColumns: boolean;
    dataTypes: SqlDataType[];
    errors: Record<string,any>;
    setShowColumns: (val: boolean) => void;
    handleDataTypeChange: (val: SqlDataType) => void
    setValue: (key: keyof DatasetField, value: any) => void;
    validateField: (param?: Partial<DatasetField>) => void;
    setManuallyEdited: Dispatch<SetStateAction<boolean>>
}


export const NotMultipleInputForm = ({ field, columns, dataTypes, errors, showColumns, setValue, validateField, handleDataTypeChange, setShowColumns, setManuallyEdited }: FormProps) => {

    const handleExpressionChange = (val: string) => {
        setValue("expression", val);
        validateField({ expression: val });
    };

    const handleAggregationChange = (val: SqlAggType | null) => {
        setValue("aggregation", val);
        validateField({ aggregation: val });
    };

    const isNew = useMemo(() => {
        return !field.id;
    }, [field.id]);


    return (
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

            {field.field_type && columns.length > 0 && (
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
    )
}