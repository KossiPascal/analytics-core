import { useState, useEffect } from 'react';
import { Modal } from '@components/ui/Modal/Modal';
import { Button } from '@components/ui/Button/Button';
import { FormInput } from '@/components/forms/FormInput/FormInput';
import { FormTextarea } from '@/components/forms/FormTextarea/FormTextarea';
import { FormCheckbox } from '@/components/forms/FormCheckbox/FormCheckbox';
import { Save } from 'lucide-react';
import shared from '@components/ui/styles/shared.module.css';
import toast from 'react-hot-toast';
import { employeesApi } from '../../api';
import type { Position } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editData?: Position | null;
  onCreated?: (position: Position) => void;
}

export function PositionFormModal({ isOpen, onClose, onSuccess, editData, onCreated }: Props) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  const isEdit = !!editData;

  useEffect(() => {
    if (editData) {
      setName(editData.name);
      setCode(editData.code);
      setDescription(editData.description);
      setIsActive(editData.is_active);
    } else {
      setName(''); setCode(''); setDescription(''); setIsActive(true);
    }
  }, [editData, isOpen]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) { toast.error('Nom et code requis'); return; }

    setSaving(true);
    try {
      const data = { name, code, description, is_active: isActive };
      const res = isEdit
        ? await employeesApi.updatePosition(editData!.id, data)
        : await employeesApi.createPosition(data);

      if (res.success) {
        toast.success(`Poste ${isEdit ? 'mis a jour' : 'cree'} avec succes`);
        if (!isEdit && onCreated && res.data) onCreated(res.data);
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
      title={`${isEdit ? 'Modifier' : 'Nouveau'} Poste`}
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
          <FormInput label="Code" required value={code} onChange={(e) => setCode(e.target.value)} />
        </div>
        <FormTextarea label="Description" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
        <FormCheckbox label="Actif" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
      </form>
    </Modal>
  );
}
