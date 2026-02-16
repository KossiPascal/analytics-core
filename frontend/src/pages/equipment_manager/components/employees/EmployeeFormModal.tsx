import { useState, useEffect } from 'react';
import { Modal } from '@components/ui/Modal/Modal';
import { Button } from '@components/ui/Button/Button';
import { FormInput } from '@/components/forms/FormInput/FormInput';
import { FormSelect } from '@/components/forms/FormSelect/FormSelect';
import { FormTextarea } from '@/components/forms/FormTextarea/FormTextarea';
import { Save } from 'lucide-react';
import shared from '@components/ui/styles/shared.module.css';
import toast from 'react-hot-toast';
import { employeesApi } from '../../api';
import type { Employee, Department } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editData?: Employee | null;
  departments: Department[];
}

export function EmployeeFormModal({ isOpen, onClose, onSuccess, editData, departments }: Props) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [code, setCode] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [gender, setGender] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [position, setPosition] = useState('');
  const [hireDate, setHireDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const isEdit = !!editData;

  // Build flat list of departments
  const allDepts: { id: string; name: string }[] = [];
  const flattenDepts = (items: (Department & { children?: Department[] })[]) => {
    for (const d of items) {
      allDepts.push({ id: d.id, name: d.name });
      if (d.children) flattenDepts(d.children);
    }
  };
  flattenDepts(departments as (Department & { children?: Department[] })[]);

  useEffect(() => {
    if (editData) {
      setFirstName(editData.first_name);
      setLastName(editData.last_name);
      setCode(editData.employee_id_code);
      setDepartmentId(editData.department_id);
      setGender(editData.gender);
      setPhone(editData.phone);
      setEmail(editData.email);
      setPosition(editData.position);
      setHireDate(editData.hire_date || '');
      setEndDate(editData.end_date || '');
      setNotes(editData.notes);
    } else {
      setFirstName(''); setLastName(''); setCode(''); setDepartmentId('');
      setGender(''); setPhone(''); setEmail(''); setPosition('');
      setHireDate(''); setEndDate(''); setNotes('');
    }
  }, [editData, isOpen]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !code.trim() || !departmentId || !position.trim() || !hireDate) {
      toast.error('Prenom, nom, code, departement, poste et date embauche sont requis');
      return;
    }

    setSaving(true);
    try {
      const data = {
        first_name: firstName, last_name: lastName, employee_id_code: code,
        department_id: departmentId, gender, phone, email, position,
        hire_date: hireDate, end_date: endDate || null, notes,
      };
      const res = isEdit
        ? await employeesApi.update(editData!.id, data)
        : await employeesApi.create(data);

      if (res.success) {
        toast.success(`Employe ${isEdit ? 'mis a jour' : 'cree'} avec succes`);
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
      title={`${isEdit ? 'Modifier' : 'Nouvel'} Employe`}
      size="lg"
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
          <FormInput label="Prenom" required value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          <FormInput label="Nom" required value={lastName} onChange={(e) => setLastName(e.target.value)} />
        </div>
        <div className={shared.formRow}>
          <FormInput label="Code employe" required value={code} onChange={(e) => setCode(e.target.value)} />
          <FormSelect
            label="Genre"
            value={gender}
            onChange={(v) => setGender(v)}
            options={[{ value: '', label: '-' }, { value: 'M', label: 'Masculin' }, { value: 'F', label: 'Feminin' }]}
          />
        </div>
        <div className={shared.formRow}>
          <FormSelect
            label="Departement"
            required
            value={departmentId}
            onChange={(v) => setDepartmentId(v)}
            options={[{ value: '', label: 'Selectionner' }, ...allDepts.map((d) => ({ value: d.id, label: d.name }))]}
          />
          <FormInput label="Poste" required value={position} onChange={(e) => setPosition(e.target.value)} />
        </div>
        <div className={shared.formRow}>
          <FormInput label="Telephone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <FormInput label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className={shared.formRow}>
          <FormInput label="Date d'embauche" type="date" required value={hireDate} onChange={(e) => setHireDate(e.target.value)} />
          <FormInput label="Date de fin" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
        <FormTextarea label="Notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </form>
    </Modal>
  );
}
