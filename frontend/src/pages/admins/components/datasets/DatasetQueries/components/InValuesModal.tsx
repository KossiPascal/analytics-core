import { useState } from "react";
import { InValuesModalProps } from "./model";
import { Modal } from "@/components/ui/Modal/Modal";
import { Button } from "@/components/ui/Button/Button";
import { FormInput } from "@/components/forms/FormInput/FormInput";


export const InValuesModal = ({ isOpen, onClose, values, onChange, inputType }: InValuesModalProps) => {

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
                <FormInput type={inputType} value={tempValue} onChange={(e) => setTempValue(e.target.value)} />
                <Button size="sm" style={{ "padding": "0px 5px" }} onClick={addValue}>Add</Button>
            </div>

            <br />

            <table>
                {values.map((v, i) => (
                    <tr key={i}>
                        <th>{v}</th>
                        <th><Button size="sm" style={{ "padding": "1px 5px" }} onClick={() => removeValue(i)} variant="danger">✕</Button></th>
                    </tr>
                ))}
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


