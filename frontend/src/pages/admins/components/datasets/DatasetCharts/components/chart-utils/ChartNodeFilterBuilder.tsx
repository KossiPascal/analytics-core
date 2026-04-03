import { FormInput } from "@/components/forms/FormInput/FormInput";
import { FormSelect } from "@/components/forms/FormSelect/FormSelect";
import { FormSwitch } from "@/components/forms/FormSwitch/FormSwitch";
import { FormTextarea } from "@/components/forms/FormTextarea/FormTextarea";
import { Button } from "@/components/ui/Button/Button";
import { Modal } from "@/components/ui/Modal/Modal";
import { ChartFilter, getOperatorsForField, getInputTypeForField, NO_VALUE_OPERATORS, SqlDataType } from "@/models/dataset.models";
import { useState } from "react";



export interface DimMetricFieldMap {
  field_name: string;
  data_type: SqlDataType;
  field_id: number;
  alias?: string;
}

interface FilterNodeBuilderProps {
  index: number
  node: ChartFilter;
  fields: DimMetricFieldMap[];
  onChange: (node: ChartFilter) => void;
  onRemove?: () => void;
  error: string | undefined;
}

interface InValuesModalProps {
  isOpen: boolean;
  onClose: () => void;
  values: string[];
  onChange: (values: string[]) => void;
  inputType: string;
}

const InValuesModal = ({ isOpen, onClose, values, onChange, inputType }: InValuesModalProps) => {

  const [tempValue, setTempValue] = useState("");

  const addValue = () => {
    if (!tempValue.trim()) return;
    onChange([...values, tempValue.trim()]);
    setTempValue("");
  };

  const removeValue = (index: number) => {
    onChange(values.filter((_, i) => i !== index));
  };

  if (!isOpen) return null;

  return (
    <Modal title="Add IN values" isOpen={true} onClose={onClose} size="sm">
      <div style={{ "height": "30px" }} className="flex gap-2">
        <FormInput
          type={inputType} value={tempValue}
          onChange={(e) => setTempValue(e.target.value)} />
        <Button
          size="sm" style={{ "padding": "0px 5px" }}
          onClick={addValue}>Add</Button>
      </div>

      <br />

      <table>
        <tbody>
          {values.map((v, i) => (
            <tr key={i}>
              <td>{v}</td>
              <td><Button size="sm" style={{ "padding": "1px 5px" }} onClick={() => removeValue(i)} variant="danger">✕</Button></td>
            </tr>
          ))}
        </tbody>
      </table>

      <br />

      <div className="flex justify-end">
        <Button size="sm" style={{ "padding": "5px 10px" }} variant="outline" onClick={onClose}>
          Close
        </Button>
      </div>
    </Modal>
  );
};

export const ChartNodeFilterBuilder = ({ index, node, fields, onChange, onRemove }: FilterNodeBuilderProps) => {
  const [isInModalOpen, setIsInModalOpen] = useState(false);

  const field = fields.find(f => f.field_id === node.field_id);

  const operators = getOperatorsForField(field?.data_type);
  const inputType = getInputTypeForField(field?.data_type);

  const renderValueInput = () => {

    if (NO_VALUE_OPERATORS.includes(node.operator) || node.field_id <= 0) return null;

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
      const values = Array.isArray(node.value) ? node.value : [];

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
          options={fields.map(f => ({ value: f.field_id, label: f.field_name }))}
          // onChange={(v) => onChange({ ...node, field_id: v })}
          onChange={(v) => {
            const newField = fields.find(f => f.field_id === v);
            const newOperators = getOperatorsForField(newField?.data_type);

            onChange({
              ...node,
              field_id: v,
              operator: newOperators[0] ?? "=",
              value: "",
              value2: undefined
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

            onChange({
              ...node,
              operator: v,
              value: isIn
                ? (Array.isArray(node.value) ? node.value : [])
                : "",
              value2: isBetween ? "" : undefined
            });
          }}
        />
      </td>

      <td colSpan={2} className="flex gap-2 items-center">
        {renderValueInput()}
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
};