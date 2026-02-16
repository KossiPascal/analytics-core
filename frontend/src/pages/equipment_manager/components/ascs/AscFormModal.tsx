import { useState, useEffect } from 'react';
import { Modal } from '@components/ui/Modal/Modal';
import { Button } from '@components/ui/Button/Button';
import { FormInput } from '@/components/forms/FormInput/FormInput';
import { FormSelect } from '@/components/forms/FormSelect/FormSelect';
import { FormTextarea } from '@/components/forms/FormTextarea/FormTextarea';
import { Save } from 'lucide-react';
import shared from '@components/ui/styles/shared.module.css';
import toast from 'react-hot-toast';
import { ascsApi } from '../../api';
import type { ASC, Site, Supervisor } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editData?: ASC | null;
  sites: Site[];
  supervisors: Supervisor[];
}

export function AscFormModal({ isOpen, onClose, onSuccess, editData, sites, supervisors }: Props) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [code, setCode] = useState('');
  const [gender, setGender] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [siteId, setSiteId] = useState('');
  const [supervisorId, setSupervisorId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const isEdit = !!editData;

  useEffect(() => {
    if (editData) {
      setFirstName(editData.first_name);
      setLastName(editData.last_name);
      setCode(editData.code);
      setGender(editData.gender);
      setPhone(editData.phone);
      setEmail(editData.email);
      setSiteId(editData.site_id || '');
      setSupervisorId(editData.supervisor_id || '');
      setStartDate(editData.start_date || '');
      setNotes(editData.notes);
    } else {
      setFirstName(''); setLastName(''); setCode(''); setGender('');
      setPhone(''); setEmail(''); setSiteId(''); setSupervisorId('');
      setStartDate(''); setNotes('');
    }
  }, [editData, isOpen]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !code.trim()) {
      toast.error('Prenom, nom et code sont requis');
      return;
    }

    setSaving(true);
    try {
      const data = {
        first_name: firstName, last_name: lastName, code, gender, phone, email,
        site_id: siteId || null, supervisor_id: supervisorId || null,
        start_date: startDate || null, notes,
      };
      const res = isEdit
        ? await ascsApi.update(editData!.id, data)
        : await ascsApi.create(data);

      if (res.success) {
        toast.success(`ASC ${isEdit ? 'mis a jour' : 'cree'} avec succes`);
        onSuccess();
        onClose();
      } else {
        toast.error(res.message || 'Erreur');
      }
    } catch {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${isEdit ? 'Modifier' : 'Nouvel'} ASC`}
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
          <FormInput label="Code" required value={code} onChange={(e) => setCode(e.target.value)} />
          <FormSelect
            label="Genre"
            value={gender}
            onChange={(v) => setGender(v)}
            options={[{ value: '', label: '-' }, { value: 'M', label: 'Masculin' }, { value: 'F', label: 'Feminin' }]}
          />
        </div>
        <div className={shared.formRow}>
          <FormInput label="Telephone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <FormInput label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className={shared.formRow}>
          <FormSelect
            label="Site"
            value={siteId}
            onChange={(v) => setSiteId(v)}
            options={[{ value: '', label: 'Aucun' }, ...sites.map((s) => ({ value: s.id, label: `${s.name} (${s.district_name})` }))]}
          />
          <FormSelect
            label="Superviseur"
            value={supervisorId}
            onChange={(v) => setSupervisorId(v)}
            options={[{ value: '', label: 'Aucun' }, ...supervisors.map((s) => ({ value: s.user_id, label: s.full_name }))]}
          />
        </div>
        <FormInput label="Date de debut" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        <FormTextarea label="Notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </form>
    </Modal>
  );
}
