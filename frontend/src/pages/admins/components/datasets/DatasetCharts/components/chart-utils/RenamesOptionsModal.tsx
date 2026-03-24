import { FormInput } from "@/components/forms/FormInput/FormInput";
import { Button } from "@/components/ui/Button/Button";
import { Modal } from "@/components/ui/Modal/Modal";
import { useState } from "react";

interface RenamesOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  values: Record<string, Record<string, string>>; // map imbriquée
  onChange: (newValues: Record<string, Record<string, string>>) => void;
}

export const RenamesOptionsModal = ({ isOpen, onClose, values, onChange }: RenamesOptionsModalProps) => {
  const [tempCol, setTempCol] = useState("");
  const [tempKey, setTempKey] = useState("");
  const [tempVal, setTempVal] = useState("");
  const [localValues, setLocalValues] = useState<Record<string, Record<string, string>>>({ ...values });

  const addColumn = () => {
    const col = tempCol.trim();
    if (!col || localValues[col]) return;
    setLocalValues({ ...localValues, [col]: {} });
    setTempCol("");
  };

  const addEntry = (col: string) => {
    const key = tempKey.trim();
    const val = tempVal.trim();
    if (!key) return;
    const updatedCol = { ...localValues[col], [key]: val };
    setLocalValues({ ...localValues, [col]: updatedCol });
    setTempKey("");
    setTempVal("");
  };

  const removeEntry = (col: string, key: string) => {
    const updatedCol = { ...localValues[col] };
    delete updatedCol[key];
    setLocalValues({ ...localValues, [col]: updatedCol });
  };

  const removeColumn = (col: string) => {
    const updated = { ...localValues };
    delete updated[col];
    setLocalValues(updated);
  };

  const saveChanges = () => {
    onChange(localValues);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Modal title="Edit Map Values" isOpen={true} onClose={onClose} size="md">
      {/* --- Ajouter une nouvelle colonne --- */}
      <div className="flex gap-2 mb-2">
        <FormInput placeholder="New Column" value={tempCol} onChange={(e) => setTempCol(e.target.value)} />
        <Button style={{"height": "30px"}} size="sm" onClick={addColumn}>Add Column</Button>
      </div>

      {Object.keys(localValues).length === 0 && <p>No columns yet.</p>}

      {Object.entries(localValues).map(([colName, colValues]) => (
        <div key={colName} className="mb-4 border p-2 rounded">
          <div className="flex justify-between items-center mb-2">
            <strong>{colName}</strong>
            <Button style={{"height": "20px"}} size="sm" variant="danger" onClick={() => removeColumn(colName)}>Delete Column</Button>
          </div>

          {/* --- Ajouter une clé/valeur à cette colonne --- */}
          <div className="flex gap-2 mb-2">
            <FormInput placeholder="Key" value={tempKey} onChange={(e) => setTempKey(e.target.value)} />
            <FormInput placeholder="Value" value={tempVal} onChange={(e) => setTempVal(e.target.value)} />
            <Button style={{"height": "30px"}} size="sm" onClick={() => addEntry(colName)}>Add</Button>
          </div>

          {/* --- Tableau des clés/valeurs --- */}
          {Object.keys(colValues).length === 0 && <p>No entries yet.</p>}
          <table className="w-full">
            <tbody>
              {Object.entries(colValues).map(([key, val]) => (
                <tr key={key}>
                  <td>{key}</td>
                  <td>{val}</td>
                  <td><Button size="sm" variant="danger" onClick={() => removeEntry(colName, key)}>✕</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      {/* --- Footer --- */}
      <div className="flex justify-end gap-2 mt-4">
        <Button size="sm" variant="outline" onClick={onClose}>Cancel</Button>
        <Button size="sm" onClick={saveChanges}>Save</Button>
      </div>
    </Modal>
  );
};