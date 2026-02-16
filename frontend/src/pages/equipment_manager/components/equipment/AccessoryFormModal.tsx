import { useState, useEffect } from 'react';
import { Modal } from '@components/ui/Modal/Modal';
import { Button } from '@components/ui/Button/Button';
import { FormInput } from '@/components/forms/FormInput/FormInput';
import { FormSelect } from '@/components/forms/FormSelect/FormSelect';
import { FormTextarea } from '@/components/forms/FormTextarea/FormTextarea';
import { Save } from 'lucide-react';
import shared from '@components/ui/styles/shared.module.css';
import toast from 'react-hot-toast';
import { equipmentApi } from '../../api';
import type { Accessory } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  equipmentId: string;
  editData?: Accessory | null;
}

export function AccessoryFormModal({ isOpen, onClose, onSuccess, equipmentId, editData }: Props) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [status, setStatus] = useState('FUNCTIONAL');
  const [saving, setSaving] = useState(false);

  const isEdit = !!editData;

  useEffect(() => {
    if (editData) {
      setName(editData.name);
      setDescription(editData.description);
      setSerialNumber(editData.serial_number);
      setStatus(editData.status);
    } else {
      setName(''); setDescription(''); setSerialNumber(''); setStatus('FUNCTIONAL');
    }
  }, [editData, isOpen]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { toast.error('Le nom est requis'); return; }

    setSaving(true);
    try {
      const data = { name, description, serial_number: serialNumber, status };
      const res = isEdit
        ? await equipmentApi.updateAccessory(equipmentId, editData!.id, data)
        : await equipmentApi.createAccessory(equipmentId, data);

      if (res.success) {
        toast.success(`Accessoire ${isEdit ? 'mis a jour' : 'ajoute'} avec succes`);
        onSuccess(); onClose();
      } else {
        toast.error(res.message || 'Erreur');
      }
    } catch {
      toast.error('Erreur');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${isEdit ? 'Modifier' : 'Ajouter'} Accessoire`}
      size="md"
      footer={
        <div className={shared.modalFooter}>
          <Button variant="outline" size="sm" onClick={onClose}>Annuler</Button>
          <Button variant="primary" size="sm" onClick={handleSave} isLoading={saving}>
            <Save size={16} /> Enregistrer
          </Button>
        </div>
      }
    >
      <form className={shared.form} onSubmit={handleSave}>
        <div className={shared.formRow}>
          <FormInput label="Nom" required value={name} onChange={(e) => setName(e.target.value)} />
          <FormInput label="N. Serie" value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)} />
        </div>
        <FormSelect
          label="Statut"
          value={status}
          onChange={(v) => setStatus(v)}
          options={[
            { value: 'FUNCTIONAL', label: 'Fonctionnel' },
            { value: 'FAULTY', label: 'Defectueux' },
            { value: 'MISSING', label: 'Manquant' },
          ]}
        />
        <FormTextarea label="Description" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
      </form>
    </Modal>
  );
}
