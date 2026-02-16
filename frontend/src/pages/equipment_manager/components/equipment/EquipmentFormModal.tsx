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
import type { Equipment, ASC } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editData?: Equipment | null;
  ascs: ASC[];
}

export function EquipmentFormModal({ isOpen, onClose, onSuccess, editData, ascs }: Props) {
  const [equipmentType, setEquipmentType] = useState('PHONE');
  const [brand, setBrand] = useState('');
  const [modelName, setModelName] = useState('');
  const [imei, setImei] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [status, setStatus] = useState('FUNCTIONAL');
  const [ownerId, setOwnerId] = useState('');
  const [acquisitionDate, setAcquisitionDate] = useState('');
  const [warrantyDate, setWarrantyDate] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const isEdit = !!editData;

  useEffect(() => {
    if (editData) {
      setEquipmentType(editData.equipment_type);
      setBrand(editData.brand);
      setModelName(editData.model_name);
      setImei(editData.imei);
      setSerialNumber(editData.serial_number);
      setStatus(editData.status);
      setOwnerId(editData.owner_id || '');
      setAcquisitionDate(editData.acquisition_date || '');
      setWarrantyDate(editData.warranty_expiry_date || '');
      setNotes(editData.notes);
    } else {
      setEquipmentType('PHONE'); setBrand(''); setModelName(''); setImei('');
      setSerialNumber(''); setStatus('FUNCTIONAL'); setOwnerId('');
      setAcquisitionDate(''); setWarrantyDate(''); setNotes('');
    }
  }, [editData, isOpen]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brand.trim() || !modelName.trim() || !imei.trim()) {
      toast.error('Marque, modele et IMEI sont requis');
      return;
    }

    setSaving(true);
    try {
      const data = {
        equipment_type: equipmentType, brand, model_name: modelName, imei,
        serial_number: serialNumber, status,
        owner_id: ownerId || null,
        acquisition_date: acquisitionDate || null,
        warranty_expiry_date: warrantyDate || null,
        notes,
      };
      const res = isEdit
        ? await equipmentApi.update(editData!.id, data)
        : await equipmentApi.create(data);

      if (res.success) {
        toast.success(`Equipement ${isEdit ? 'mis a jour' : 'cree'} avec succes`);
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
      title={`${isEdit ? 'Modifier' : 'Nouvel'} Equipement`}
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
          <FormSelect
            label="Type"
            required
            value={equipmentType}
            onChange={(v) => setEquipmentType(v)}
            options={[
              { value: 'PHONE', label: 'Telephone' },
              { value: 'TABLET', label: 'Tablette' },
              { value: 'OTHER', label: 'Autre' },
            ]}
          />
          <FormSelect
            label="Statut"
            value={status}
            onChange={(v) => setStatus(v)}
            options={[
              { value: 'FUNCTIONAL', label: 'Fonctionnel' },
              { value: 'FAULTY', label: 'Defaillant' },
              { value: 'UNDER_REPAIR', label: 'En reparation' },
            ]}
          />
        </div>
        <div className={shared.formRow}>
          <FormInput label="Marque" required value={brand} onChange={(e) => setBrand(e.target.value)} />
          <FormInput label="Modele" required value={modelName} onChange={(e) => setModelName(e.target.value)} />
        </div>
        <div className={shared.formRow}>
          <FormInput label="IMEI" required value={imei} onChange={(e) => setImei(e.target.value)} />
          <FormInput label="Numero de serie" value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)} />
        </div>
        <FormSelect
          label="Proprietaire ASC"
          value={ownerId}
          onChange={(v) => setOwnerId(v)}
          options={[{ value: '', label: 'Aucun' }, ...ascs.map((a) => ({ value: a.id, label: `${a.full_name} (${a.code})` }))]}
        />
        <div className={shared.formRow}>
          <FormInput label="Date d'acquisition" type={"date" as any} value={acquisitionDate} onChange={(e) => setAcquisitionDate(e.target.value)} />
          <FormInput label="Fin de garantie" type={"date" as any} value={warrantyDate} onChange={(e) => setWarrantyDate(e.target.value)} />
        </div>
        <FormTextarea label="Notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </form>
    </Modal>
  );
}
