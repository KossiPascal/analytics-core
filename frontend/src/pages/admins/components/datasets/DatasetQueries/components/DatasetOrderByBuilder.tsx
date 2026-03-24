import { FormSelect } from "@/components/forms/FormSelect/FormSelect";
import { OrderByBuilderProps } from "./model";
import { Button } from "@/components/ui/Button/Button";


// ORDER BY
export const DatasetOrderByBuilder = ({ fields, orderBy = [], onChange, error }: OrderByBuilderProps) => {

    const add = () => {
        onChange([...(orderBy || []), { field_id: -1, direction: "asc" }]);
    };

    const update = (index: number, patch: Partial<typeof orderBy[number]>) => {
        const updated = [...(orderBy || [])];
        updated[index] = { ...updated[index], ...patch };
        onChange(updated);
    };

    const remove = (index: number) => {
        onChange(orderBy.filter((_, i) => i !== index));
    };

    return (
        <div className="space-y-4 border rounded-xl p-4 bg-gray-50">
            <div className="flex justify-between items-center">
                <h6 className="font-semibold">
                    Order By ({orderBy?.length || 0})
                </h6>
                <Button size="sm" onClick={add}>+ Add Order</Button>
            </div>

            <table>
                <tbody>
                    {orderBy?.map((o, i) => (
                        // <tr key={i} className="flex gap-2 items-center">
                        <tr key={i}>
                            <th>
                                <span className="text-xs text-gray-500 w-6">
                                    {i + 1}
                                </span>
                            </th>

                            <th>
                                <FormSelect
                                    value={o.field_id}
                                    options={fields.map(f => ({
                                        value: f.id,
                                        label: f.name
                                    }))}
                                    onChange={(v) => update(i, { field_id: v })}
                                    error={error}
                                />
                            </th>

                            <th>
                                <FormSelect
                                    value={o.direction}
                                    options={[
                                        { value: "asc", label: "ASC" },
                                        { value: "desc", label: "DESC" }
                                    ]}
                                    onChange={(v) => update(i, { direction: v })}
                                />
                            </th>

                            <th>
                                <Button style={{ "padding": "6px 8px", "marginBottom": "12px" }} size="sm" variant="danger" onClick={() => remove(i)}>
                                    ✕
                                </Button>
                            </th>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};