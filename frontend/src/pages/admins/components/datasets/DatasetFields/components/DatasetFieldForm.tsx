import { FormRadio } from "@/components/forms/FormRadio/FormRadio";
import { FormSelect } from "@/components/forms/FormSelect/FormSelect";
import { SqlDataType, FULL_DATA_TYPES, DatasetField, NUMERIC_DATA_TYPE, SqlFieldType, SqlFieldTypeList, Dataset, DatasetColumn } from "@/models/dataset.models";
import { motion } from "framer-motion";
import { useState, useMemo, useEffect } from "react";
import { FaTable } from "react-icons/fa";
import { generateFieldName, validateExpression, isNumericExpression, getFieldTypeIcon } from "./utils";
import { Button } from "@/components/ui/Button/Button";
import { Modal } from "@/components/ui/Modal/Modal";
import { Tenant } from "@/models/identity.model";
import { MultipleFieldForm } from "./MultipleFieldForm";
import { MultipleFieldsTableInput } from "./MultipleFieldsTableInput";
import { NotMultipleInputForm } from "./NotMultipleInputForm";


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
};

export const DatasetFieldForm = ({ field, setValue, tenants, tenant_id, dataset_id, datasets, datasetMap, saving, showColumns, setShowColumns, onValidationChange }: DatasetFieldFormProps) => {

    const [errors, setErrors] = useState<{ expression?: string, data_type?: string }>({});
    const [disabled, setDisabled] = useState<{ expression?: boolean, data_type?: boolean }>({});
    const [dataTypes, setDataTypes] = useState<SqlDataType[]>([]);
    const [autoName, setAutoName] = useState<string | null>(null);
    const [manuallyEdited, setManuallyEdited] = useState(false);
    const [showFieldsModal, setShowFieldsModal] = useState(false);
    const [selectedFields, setSelectedFields] = useState<DatasetColumn[]>([]);

    const isNew = useMemo(() => {
        return !field.id;
    }, [field.id]);

    const isDimensionMultiple = useMemo(() => {
        return isNew && field.field_type === "dimension" && field.select_multiple === true;
    }, [isNew, field.field_type, field.select_multiple]);

    const isMetricMultuple = useMemo(() => {
        return isNew && field.field_type === "metric" && field.select_multiple === true;
    }, [isNew, field.field_type, field.select_multiple]);

    const isNotDimensionMultiple = useMemo(() => {
        return (field.field_type !== "dimension" || field.select_multiple == false || !isNew && !field.select_multiple) && !isMetricMultuple;
    }, [isNew, field.field_type, field.select_multiple, isMetricMultuple]);

    const isNotMetricMultiple = useMemo(() => {
        return (field.field_type !== "metric" || field.select_multiple == false || !isNew && !field.select_multiple) && !isDimensionMultiple;
    }, [isNew, field.field_type, field.select_multiple, isMetricMultuple]);

    const isDimensionHidden = useMemo(() => {
        return isNew && field.field_type === "dimension" && field.select_multiple !== false;
    }, [isNew, field.field_type, field.select_multiple]);

    const isMetricHidden = useMemo(() => {
        return isNew && field.field_type === "metric" && field.select_multiple !== false;
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
        if (isDimensionHidden || isMetricHidden) {
            setErrors({});
            onValidationChange?.(false);
        }
    }, [isDimensionHidden,isMetricHidden]);

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


    const validateField = (props: Partial<DatasetField> = {}) => {
        const { expression = field.expression, field_type = field.field_type, aggregation = field.aggregation, data_type = field.data_type, dataset_id = field.dataset_id } = props;

        if (isDimensionMultiple) {
            setErrors({});
            onValidationChange?.(false);
            return;
        }
        const datasetColumns = datasetId ? datasetMap.get(datasetId)?.columns ?? [] : [];

        const { valid, error, meta } = validateExpression({
            expr: expression,
            fieldType: field_type,
            columns: datasetColumns,
            dataType: data_type,
            aggregation: aggregation
        });


        const { columnName, dataType, usedColumns, functions, hasAggregation } = meta ?? {};


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

    const handleDataTypeChange = (val: SqlDataType) => {
        setValue("data_type", val);
        validateField({ data_type: val });
    };

    const handleFieldTypeChange = (val: SqlFieldType | null, fieldId: number | null) => {
        setValue("field_type", val);
        // Reset select_multiple when changing field type
        if (val === "calculated_metric") {
            setValue("select_multiple", undefined);
            setValue("dimensions", []);
            setValue("metrics", []);
        }

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

            if (["metric", "calculated_metric"].includes(`${val}`)) {
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

    const handleValidateFields = () => {
        if (["dimension", "metric"].includes(`${field.field_type}`)) {
            const valKey = field.field_type === "dimension" ? "dimensions" : "metrics";
            setValue(valKey, selectedFields);
            setValue("name", field.name ?? "multi_" + field.field_type);
            setSelectedFields([]);
        }
        setShowFieldsModal(false);
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

                    {["dimension", "metric"].includes(`${field.field_type}`) && (
                        <>
                            <div className="flex items-center gap-6 py-1">
                                <span className="text-sm font-medium text-gray-700">Sélection multiple</span>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <FormRadio
                                        name="select_multiple"
                                        checked={field.select_multiple}
                                        onChange={() => {
                                            setValue("select_multiple", true);

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
                                            setValue("metrics", []);
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
            {isDimensionMultiple || isMetricMultuple ? (
                <MultipleFieldForm
                    field={field}
                    setSelectedFields={setSelectedFields}
                    showModal={setShowFieldsModal}
                    setValue={setValue}
                />
            ) : isNotDimensionMultiple && isNotMetricMultiple ? (
                <NotMultipleInputForm
                    field={field}
                    columns={datasetColumns}
                    dataTypes={dataTypes}
                    handleDataTypeChange={handleDataTypeChange}
                    errors={errors}
                    showColumns={showColumns}
                    setShowColumns={setShowColumns}
                    setValue={setValue}
                    validateField={validateField}
                    setManuallyEdited={setManuallyEdited}
                />
            ) : null}

            {/* Modal sélection des dimensions/metrics (multi-select) */}
            <Modal
                isOpen={showFieldsModal}
                onClose={() => setShowFieldsModal(false)}
                title="Field - Columns"
                size="xl"
                footer={
                    <div className="flex gap-3">
                        <Button variant="outline" size="sm" onClick={() => setShowFieldsModal(false)}>Annuler</Button>
                        <Button size="sm" onClick={handleValidateFields}>Valider ({selectedFields.length})</Button>
                    </div>
                }
            >
                <div className="p-4">
                    {datasetColumns.length === 0 ?
                        (<p className="text-sm text-gray-400 text-center py-4">Aucune colonne disponible</p>) :
                        (<MultipleFieldsTableInput field={field} columns={datasetColumns} fields={selectedFields} selectFields={setSelectedFields} />)}
                </div>
            </Modal>
        </motion.div>
    )
};