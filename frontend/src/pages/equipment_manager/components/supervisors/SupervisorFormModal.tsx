import { useState, useEffect } from 'react';
import { FormModal } from '@/components/forms/FormModal/FormModal';
import { Button } from '@components/ui/Button/Button';
import { FormInput } from '@/components/forms/FormInput/FormInput';
import { FormSelect } from '@/components/forms/FormSelect/FormSelect';
import { FormCheckbox } from '@/components/forms/FormCheckbox/FormCheckbox';
import { useFormValidation } from '@/components/forms/useFormValidation';
import { Save } from 'lucide-react';
import shared from '@components/ui/styles/shared.module.css';
import styles from '../../EquipmentManager.module.css';
import toast from 'react-hot-toast';
import { supervisorsApi } from '../../api';
import type { Supervisor, District, Site } from '../../types';

const VALIDATION_RULES = {
  firstName: { required: true, message: 'Le prenom est requis' },
  lastName: { required: true, message: 'Le nom est requis' },
  districtId: { required: true, message: 'Le district est requis' },
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editData?: Supervisor | null;
  districts: District[];
  sites: Site[];
}

export function SupervisorFormModal({ isOpen, onClose, onSuccess, editData, districts, sites }: Props) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [districtId, setDistrictId] = useState('');
  const [selectedSiteIds, setSelectedSiteIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [credentials, setCredentials] = useState<{ username: string; password: string } | null>(null);

  const isEdit = !!editData;
  const { touchField, validateAll, getFieldError, getErrorMessages, isFormValid, reset } = useFormValidation(VALIDATION_RULES);

  useEffect(() => {
    if (editData) {
      setFirstName(editData.first_name);
      setLastName(editData.last_name);
      setEmail(editData.email);
      setPhone(editData.phone);
      setSelectedSiteIds(editData.sites.map((s) => s.id));
      setCredentials(null);
      if (editData.sites.length > 0) {
        const firstSite = sites.find((s) => s.id === editData.sites[0].id);
        if (firstSite) setDistrictId(firstSite.district_id);
      }
    } else {
      setFirstName(''); setLastName(''); setEmail(''); setPhone('');
      setDistrictId(''); setSelectedSiteIds([]); setCredentials(null);
    }
    reset();
  }, [editData, isOpen]);

  const filteredSites = districtId ? sites.filter((s) => s.district_id === districtId) : [];

  const toggleSite = (siteId: string) => {
    setSelectedSiteIds((prev) =>
      prev.includes(siteId) ? prev.filter((id) => id !== siteId) : [...prev, siteId]
    );
  };

  const canSubmit = isFormValid({ firstName, lastName, districtId });
  const errorMessages = getErrorMessages();

  const handleSave = async () => {
    if (!validateAll({ firstName, lastName, districtId })) return;

    setSaving(true);
    try {
      const data = {
        first_name: firstName, last_name: lastName, email, phone,
        district_id: districtId, site_ids: selectedSiteIds,
      };

      const res = isEdit
        ? await supervisorsApi.update(editData!.id, data)
        : await supervisorsApi.create(data);

      if (res.success) {
        toast.success(`Superviseur ${isEdit ? 'mis a jour' : 'cree'} avec succes`);
        if (!isEdit && res.data) {
          const d = res.data as Supervisor;
          if (d.username && d.password) {
            setCredentials({ username: d.username, password: d.password });
            onSuccess();
            return; // Don't close - show credentials
          }
        }
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

  // Footer override when showing credentials
  const credentialsFooter = credentials ? (
    <div className={shared.modalFooter}>
      <Button variant="primary" size="sm" onClick={onClose}>Fermer</Button>
    </div>
  ) : undefined;

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title={credentials ? 'Identifiants generes' : `${isEdit ? 'Modifier' : 'Nouveau'} Superviseur`}
      size="md"
      errors={credentials ? undefined : errorMessages}
      onSubmit={handleSave}
      isSubmitDisabled={!canSubmit}
      isLoading={saving}
      submitLabel="Enregistrer"
      submitIcon={<Save size={16} />}
      footer={credentialsFooter}
    >
      {credentials ? (
        <div className={styles.credentialBox}>
          <p><strong>Nom d'utilisateur:</strong> {credentials.username}</p>
          <p><strong>Mot de passe:</strong> {credentials.password}</p>
          <p style={{ marginTop: '0.75rem', fontSize: '0.8125rem', color: '#92400e' }}>
            Notez ces identifiants, ils ne seront plus affiches.
          </p>
        </div>
      ) : (
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
            <FormInput label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <FormInput label="Telephone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <FormSelect
            label="District"
            required
            value={districtId}
            onChange={(v) => {
              setDistrictId(v);
              setSelectedSiteIds([]);
              touchField('districtId', v);
            }}
            error={getFieldError('districtId')}
            options={[{ value: '', label: 'Selectionner' }, ...districts.map((d) => ({ value: d.id, label: `${d.name} (${d.region_name})` }))]}
          />
          {filteredSites.length > 0 && (
            <div>
              <label className={shared.formLabel} style={{ display: 'block', marginBottom: '0.5rem' }}>Sites</label>
              <div className={shared.checkboxGrid}>
                {filteredSites.map((site) => (
                  <FormCheckbox
                    key={site.id}
                    label={site.name}
                    checked={selectedSiteIds.includes(site.id)}
                    onChange={() => toggleSite(site.id)}
                  />
                ))}
              </div>
            </div>
          )}
        </form>
      )}
    </FormModal>
  );
}
