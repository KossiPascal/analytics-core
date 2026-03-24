import { FormSelect } from "@/components/forms/FormSelect/FormSelect";
import { FormTextarea } from "@/components/forms/FormTextarea/FormTextarea";
import { QueryFilter, QueryFilterGroup, getOperatorsForField, getInputTypeForField, NO_VALUE_OPERATORS, QueryFilterNode, LOGICAL_OPERATORS } from "@/models/dataset.models";
import { useState } from "react";
import { InValuesModal } from "./InValuesModal";
import { FilterNodeBuilderProps } from "./model";
import { FormInput } from "@/components/forms/FormInput/FormInput";
import { Button } from "@/components/ui/Button/Button";
import { FormSwitch } from "@/components/forms/FormSwitch/FormSwitch";

export const FilterNodeBuilder = ({ index, node, fields, onChange, onRemove }: FilterNodeBuilderProps) => {
    const [isInModalOpen, setIsInModalOpen] = useState(false);

    const defaultCondition: QueryFilter = { type: "condition", field_id: -1, operator: "=", value: "", useSqlInClause: false };

    const defaultGroup: QueryFilterGroup = { type: "group", operator: "AND", children: [] };

    if (!node) return <tr><th>No Node Available !</th></tr>;

    if (node.type === "condition") {
        const field = fields.find(f => f.id === node.field_id);
        const operators = getOperatorsForField(field?.data_type);
        const inputType = getInputTypeForField(field?.data_type);

        const renderValueInput = () => {
            if (NO_VALUE_OPERATORS.includes(node.operator)) return null;

            if (node.operator === "BETWEEN" || node.operator === "NOT BETWEEN") {
                return (
                    <>
                        <FormInput type={inputType} value={node.value}
                            onChange={(e) => onChange({ ...node, value: e.target.value })} />

                        <FormInput type={inputType} value={node.value2 ?? ""}
                            onChange={(e) => onChange({ ...node, value2: e.target.value })} />
                    </>
                );
            }

            if (node.operator === "IN" || node.operator === "NOT IN") {
                const values = Array.isArray(node.value) ? node.value : [node.value];

                return (
                    <>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setIsInModalOpen(true)}
                        >
                            Edit values ({values.length})
                        </Button>

                        <InValuesModal
                            isOpen={isInModalOpen}
                            onClose={() => setIsInModalOpen(false)}
                            values={values}
                            inputType={inputType}
                            onChange={(newValues) => onChange({ ...node, value: newValues })}
                        />

                        <FormSwitch
                            label={`useSqlInClause`}
                            checked={node.useSqlInClause ?? false}
                            onChange={(e) => onChange({ ...node, useSqlInClause: e.target.checked })}
                        />
                    </>
                );
            }

            switch (inputType) {
                case "select":
                    return (
                        <>
                            {field?.data_type === "boolean" ? (
                                <FormSelect
                                    // label="Value"
                                    value={node.value}
                                    options={[
                                        { value: "true", label: "TRUE" },
                                        { value: "false", label: "FALSE" },
                                    ]}
                                    onChange={(v) => onChange({ ...node, value: v })}
                                />
                            ) : (<>Erreur</>)}
                        </>
                    );

                case "textarea":
                    return (
                        <FormTextarea
                            // label="Value"
                            value={node.value}
                            onChange={(e) => onChange({ ...node, value: e.target.value })}
                        />
                    );

                default:
                    return (
                        <FormInput
                            // label="Value"
                            type={inputType}
                            value={node.value}
                            onChange={(e) => onChange({ ...node, value: e.target.value })}
                        />
                    );
            }
        };

        return (
            <tr>
                <th>
                    <span className="text-xs text-gray-500 w-6">{index}</span>
                </th>
                <td>
                    <FormSelect
                        value={node.field_id}
                        options={fields.map(f => ({ value: f.id, label: f.name }))}
                        // onChange={(v) => onChange({ ...node, field: v })}
                        onChange={(v) => {
                            const newField = fields.find(f => f.id === v);
                            const newOperators = getOperatorsForField(newField?.data_type);
                            const operator = newOperators.includes(node.operator) ? node.operator : (newOperators[0] ?? "=");
                            const isBetween = operator === "BETWEEN" || operator === "NOT BETWEEN";
                            const isIn = operator === "IN" || operator === "NOT IN";
                            const value = isIn ? node.value ? (Array.isArray(node.value2) ? node.value2 : [node.value2]) :  [] : "";
                            const value2 = isBetween ? (node.value2 ?? "") : undefined;

                            onChange({
                                ...node,
                                field_id: v,
                                operator,
                                value,
                                value2,
                                useSqlInClause: isIn ? node.useSqlInClause :undefined
                            });
                        }}
                    />
                </td>

                <td>
                    <FormSelect
                        // label="Operator"
                        value={node.operator}
                        options={operators.map(o => ({ value: o, label: o }))}
                        // onChange={(v) => onChange({ ...node, operator: v })}
                        onChange={(v) => {
                            const isBetween = v === "BETWEEN" || v === "NOT BETWEEN";
                            const isIn = v === "IN" || v === "NOT IN";
                            const value = isIn ? node.value ? (Array.isArray(node.value2) ? node.value2 : [node.value2]) :  [] : "";
                            const value2 = isBetween ? (node.value2 ?? "") : undefined;

                            onChange({ 
                                ...node, 
                                operator: v, 
                                value, 
                                value2,
                                useSqlInClause: isIn ? node.useSqlInClause :undefined
                            });
                        }}
                    />
                </td>

                <td colSpan={2} className="flex gap-2 items-center">
                    {node.field_id && node.operator ? renderValueInput() : <></>}
                </td>

                <td>
                    {onRemove && (
                        <Button style={{ "padding": "6px 8px", "marginBottom": "12px" }} size="sm" variant="danger" onClick={onRemove}>
                            ✕
                        </Button>
                    )}
                </td>
            </tr>
        );
    }

    // ----- GROUP NODE

    const updateChild = (index: number, updated: QueryFilterNode) => {
        const children = [...node.children];
        children[index] = updated;
        onChange({ ...node, children });
    };

    const removeChild = (index: number) => {
        const children = node.children.filter((_, i) => i !== index);
        onChange({ ...node, children });
    };

    const addCondition = () => {
        onChange({
            ...node,
            children: [...node.children, defaultCondition]
        });
    };

    const addGroup = () => {
        onChange({
            ...node,
            children: [...node.children, { ...defaultGroup }]
        });
    };

    return (
        <>
            {/* <div className="p-3 border rounded bg-gray-100 space-y-3"> */}
            <div className="flex justify-between items-center">
                <strong className="font-semibold">
                    Group {index} : ({node.children.length})
                </strong>

                <FormSelect
                    value={node.operator}
                    options={LOGICAL_OPERATORS.map(o => ({ value: o, label: o }))}
                    onChange={(v) => onChange({ ...node, operator: v })}
                />

                <div className="flex gap-2">
                    <Button size="sm" onClick={addCondition}>+ Condition</Button>
                    <Button size="sm" variant="outline" onClick={addGroup}>+ Group</Button>
                    {onRemove && (
                        <Button size="sm" variant="danger" onClick={onRemove}>
                            - Group
                        </Button>
                    )}
                </div>
            </div>

            <table className="w-full">
                <tbody>
                    {node.children.map((child, i) => (
                        <FilterNodeBuilder
                            key={i}
                            index={i + 1}
                            node={child}
                            fields={fields}
                            onChange={(updated) => updateChild(i, updated)}
                            onRemove={() => removeChild(i)}
                            error={undefined}
                        />
                    ))}
                </tbody>
            </table>
            {/* </div> */}
        </>
    );
};