import { useState, useEffect } from 'react';
import { Modal } from '@components/ui/Modal/Modal';
import { Button } from '@components/ui/Button/Button';
import { FormInput } from '@/components/forms/FormInput/FormInput';
import { FormSelect } from '@/components/forms/FormSelect/FormSelect';
import { FormTextarea } from '@/components/forms/FormTextarea/FormTextarea';
import { FormCheckbox } from '@/components/forms/FormCheckbox/FormCheckbox';
import { Save } from 'lucide-react';
import shared from '@components/ui/styles/shared.module.css';
import toast from 'react-hot-toast';
import { employeesApi } from '../../api';
import type { Department } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editData?: Department | null;
  departments: Department[];
}

export function DepartmentFormModal({ isOpen, onClose, onSuccess, editData, departments }: Props) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [parentId, setParentId] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  const isEdit = !!editData;

  useEffect(() => {
    if (editData) {
      setName(editData.name);
      setCode(editData.code);
      setDescription(editData.description);
      setParentId(editData.parent_id || '');
      setIsActive(editData.is_active);
    } else {
      setName(''); setCode(''); setDescription(''); setParentId(''); setIsActive(true);
    }
  }, [editData, isOpen]);

  // Build flat list of departments for parent select
  const allDepts: { id: string; name: string }[] = [];
  const flattenDepts = (items: (Department & { children?: Department[] })[]) => {
    for (const d of items) {
      if (!editData || d.id !== editData.id) {
        allDepts.push({ id: d.id, name: d.name });
      }
      if (d.children) flattenDepts(d.children);
    }
  };
  flattenDepts(departments as (Department & { children?: Department[] })[]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) { toast.error('Nom et code requis'); return; }

    setSaving(true);
    try {
      const data = { name, code, description, parent_id: parentId || null, is_active: isActive };
      const res = isEdit
        ? await employeesApi.updateDepartment(editData!.id, data)
        : await employeesApi.createDepartment(data);

      if (res.success) {
        toast.success(`Departement ${isEdit ? 'mis a jour' : 'cree'} avec succes`);
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
      title={`${isEdit ? 'Modifier' : 'Nouveau'} Departement`}
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
        <FormSelect
          label="Parent"
          value={parentId}
          onChange={(v) => setParentId(v)}
          options={[{ value: '', label: 'Aucun (departement principal)' }, ...allDepts.map((d) => ({ value: d.id, label: d.name }))]}
        />
        <FormCheckbox label="Actif" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
      </form>
    </Modal>
  );
}
