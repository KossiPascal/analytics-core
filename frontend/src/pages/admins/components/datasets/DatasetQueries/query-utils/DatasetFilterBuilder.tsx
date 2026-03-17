import { FormSelect } from "@/components/forms/FormSelect/FormSelect";
import { QueryFilter, QueryFilterGroup, LOGICAL_OPERATORS } from "@/models/dataset.models";
import { FilterBuilderProps } from "./model";
import { FilterNodeBuilder } from "./FilterNodeBuilder";
import { Button } from "@/components/ui/Button/Button";


export const DatasetFilterBuilder = ({ name, fields, node, onChange }: FilterBuilderProps) => {

    const updateLinkedGroup = (index: number, updatedFilters: QueryFilter | QueryFilterGroup) => {
        const updated = [...node];
        updated[index] = {
            ...updated[index],
            node: updatedFilters
        };
        onChange(updated);
    };

    const removeLinkedGroup = (index: number) => {
        if (node.length <= 0) return;
        onChange(node.filter((_, i) => i !== index));
    };

    const addLinkedGroup = () => {
        onChange([
            ...node,
            {
                linkWithPrevious: "AND",
                node: {
                    type: "group",
                    operator: "AND",
                    children: []
                }
            }
        ]);
    };

    return (
        <div className="space-y-6">
            <h6 className="font-semibold">{name}</h6>

            {node.map((linkedGroup, i) => {
                return (
                    <div key={i} className="p-4 border rounded-xl bg-gray-50">

                        {i > 0 && (
                            <FormSelect
                                value={linkedGroup.linkWithPrevious || "AND"}
                                options={LOGICAL_OPERATORS.map(o => ({ value: o, label: o }))}
                                onChange={(v) => {
                                    const updated = [...node];
                                    updated[i] = { ...updated[i], linkWithPrevious: v };
                                    onChange(updated);
                                }}
                            />
                        )}

                        <FilterNodeBuilder
                            index={i + 1}
                            node={linkedGroup.node}
                            fields={fields}
                            onChange={(updated) => updateLinkedGroup(i, updated)}
                            onRemove={() => removeLinkedGroup(i)}
                            error={undefined}
                        />
                    </div>
                );
            })}

            <Button size="sm" variant="dark-success" onClick={addLinkedGroup}>
                + New {name} Group
            </Button>
        </div>
    );
};