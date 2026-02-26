import { useState, useEffect } from 'react';
import { FormModal } from '@/components/forms/FormModal/FormModal';
import { FormInput } from '@/components/forms/FormInput/FormInput';
import { FormSelect } from '@/components/forms/FormSelect/FormSelect';
import { FormTextarea } from '@/components/forms/FormTextarea/FormTextarea';
import { useFormValidation } from '@/components/forms/useFormValidation';
import { Save } from 'lucide-react';
import shared from '@components/ui/styles/shared.module.css';
import toast from 'react-hot-toast';
import { ascsApi } from '../../api';
import type { ASC, Site, Supervisor } from '../../types';

const VALIDATION_RULES = {
  firstName: { required: true, message: 'Le prenom est requis' },
  lastName: { required: true, message: 'Le nom est requis' },
  code: { required: true, message: 'Le code est requis' },
};

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
  const { touchField, validateAll, getFieldError, getErrorMessages, isFormValid, reset } = useFormValidation(VALIDATION_RULES);

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
    reset();
  }, [editData, isOpen]);

  const canSubmit = isFormValid({ firstName, lastName, code });
  const errorMessages = getErrorMessages();

  const handleSave = async () => {
    if (!validateAll({ firstName, lastName, code })) return;

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
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title={`${isEdit ? 'Modifier' : 'Nouvel'} ASC`}
      size="lg"
      errors={errorMessages}
      onSubmit={handleSave}
      isSubmitDisabled={!canSubmit}
      isLoading={saving}
      submitLabel="Enregistrer"
      submitIcon={<Save size={16} />}
    >
      <form className={shared.form} onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
        <div className={shared.formRow}>
          <FormInput
            label="Prenom"
            required
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            onBlur={() => touchField('firstName', firstName)}
            error={getFieldError('firstName')}
          />
          <FormInput
            label="Nom"
            required
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            onBlur={() => touchField('lastName', lastName)}
            error={getFieldError('lastName')}
          />
        </div>
        <div className={shared.formRow}>
          <FormInput
            label="Code"
            required
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onBlur={() => touchField('code', code)}
            error={getFieldError('code')}
          />
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
        <FormInput label="Date de debut" type={"date" as any} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        <FormTextarea label="Notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </form>
    </FormModal>
  );
}
