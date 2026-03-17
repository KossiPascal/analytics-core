import { useState } from "react";
import { FormSelect } from "@/components/forms/FormSelect/FormSelect";
import { FormTextarea } from "@/components/forms/FormTextarea/FormTextarea";
import { getOperatorsForField, getInputTypeForField, NO_VALUE_OPERATORS, ChartDimension, ChartMetric } from "@/models/dataset.models";
import { FormInput } from "@/components/forms/FormInput/FormInput";
import { Button } from "@/components/ui/Button/Button";
import { FormSwitch } from "@/components/forms/FormSwitch/FormSwitch";
import { InValuesModal } from "../../DatasetQueries/query-utils/InValuesModal";


export interface ChartFilterBuilderProps {
    filter: ChartDimension | ChartMetric;
    onChange: (filter: ChartDimension | ChartMetric) => void;
}


export const ChartFilterBuilder = ({ filter, onChange }: ChartFilterBuilderProps) => {
    const [filterObj, setFilterObj] = useState<ChartDimension | ChartMetric>(filter);
    const [isInModalOpen, setIsInModalOpen] = useState<boolean>(false);

    const operators = getOperatorsForField(filterObj.data_type);
    const inputType = getInputTypeForField(filterObj.data_type);

    const renderValueInput = () => {
        const operator = filterObj.operator ?? "=";

        if (NO_VALUE_OPERATORS.includes(operator)) return null;

        if (operator === "BETWEEN" || operator === "NOT BETWEEN") {
            return (
                <>
                    <FormInput type={inputType} value={filterObj.value}
                        onChange={(e) => setFilterObj({ ...filterObj, value: e.target.value })} />

                    <FormInput type={inputType} value={filterObj.value2 ?? ""}
                        onChange={(e) => setFilterObj({ ...filterObj, value2: e.target.value })} />
                </>
            );
        }

        if (operator === "IN" || operator === "NOT IN") {
            const values = Array.isArray(filterObj.value) ? filterObj.value : [filterObj.value];

            return (
                <>
                    <Button size="sm" variant="outline" onClick={() => setIsInModalOpen(true)} >
                        Edit values ({values.length})
                    </Button>

                    <InValuesModal
                        isOpen={isInModalOpen}
                        onClose={() => setIsInModalOpen(false)}
                        values={values}
                        inputType={inputType}
                        onChange={(newValues) => setFilterObj({ ...filterObj, value: newValues })}
                    />

                    <FormSwitch
                        label={`useSqlInClause`}
                        checked={filterObj.useSqlInClause ?? false}
                        onChange={(e) => setFilterObj({ ...filterObj, useSqlInClause: e.target.checked })}
                    />
                </>
            );
        }

        switch (inputType) {
            case "select":
                if (filterObj.data_type === "boolean" ) {
                    return (<FormSelect 
                        options={[ 
                            { value: "true", label: "TRUE" }, 
                            { value: "false", label: "FALSE" } 
                        ]}
                        value={filterObj.value} onChange={(v) => setFilterObj({ ...filterObj, value: v })} 
                    />);
                }
                return (<>Erreur</>);

            case "textarea":
                return (<FormTextarea value={filterObj.value} onChange={(e) => setFilterObj({ ...filterObj, value: e.target.value })} />);

            default:
                return (<FormInput type={inputType} value={filterObj.value} onChange={(e) => setFilterObj({ ...filterObj, value: e.target.value })} />);
        }
    };

    return (
        <tr>
            <td>
                <FormSelect
                    // label="Operator"
                    value={filterObj.operator}
                    options={operators.map(o => ({ value: o, label: o }))}
                    onChange={(v) => {
                        const isBetween = v === "BETWEEN" || v === "NOT BETWEEN";
                        const isIn = v === "IN" || v === "NOT IN";
                        const value = isIn ? filterObj.value ? (Array.isArray(filterObj.value2) ? filterObj.value2 : [filterObj.value2]) : [] : "";
                        const value2 = isBetween ? (filterObj.value2 ?? "") : undefined;

                        setFilterObj({
                            ...filterObj,
                            operator: v,
                            value,
                            value2,
                            useSqlInClause: isIn ? filterObj.useSqlInClause : undefined
                        });
                    }}
                />
            </td>

            <td colSpan={2} className="flex gap-2 items-center">
                {filterObj.field_id && filterObj.operator ? renderValueInput() : <></>}
            </td>

            <td>
                <Button style={{ "padding": "6px 8px", "marginBottom": "12px" }} size="sm" variant={filter.operator ? "dark-success" : "warning"} onClick={() => {
                    onChange(filterObj);
                }}>
                    {filter.operator ? "Save" : "Update"}
                </Button>
            </td>

            <td>
                <Button style={{ "padding": "6px 8px", "marginBottom": "12px" }} size="sm" variant="danger" onClick={() => {
                    const newFilter = { ...filterObj };
                    delete newFilter.operator;
                    delete newFilter.value;
                    delete newFilter.value2;
                    delete newFilter.useSqlInClause;
                    onChange(newFilter);
                }}>
                    Delete
                </Button>
            </td>
        </tr>
    );

};