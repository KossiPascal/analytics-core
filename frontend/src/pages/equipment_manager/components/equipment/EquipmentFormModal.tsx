import { useState, useEffect } from 'react';
import { Modal } from '@components/ui/Modal/Modal';
import { Button } from '@components/ui/Button/Button';
import { Badge } from '@components/ui/Badge/Badge';
import { FormInput } from '@/components/forms/FormInput/FormInput';
import { FormSelect } from '@/components/forms/FormSelect/FormSelect';
import { FormTextarea } from '@/components/forms/FormTextarea/FormTextarea';
import { Save, Plus, X } from 'lucide-react';
import shared from '@components/ui/styles/shared.module.css';
import toast from 'react-hot-toast';
import { equipmentApi } from '../../api';
import type { Equipment, ASC, Accessory, EquipmentCategory, EquipmentBrand } from '../../types';
import { AccessoryFormModal } from './AccessoryFormModal';
import { QuickCreateModal } from './QuickCreateModal';

const ACCESSORY_STATUS_LABEL: Record<string, string> = {
  FUNCTIONAL: 'Fonctionnel',
  FAULTY: 'Defectueux',
  MISSING: 'Manquant',
};

const ACCESSORY_STATUS_VARIANT: Record<string, 'success' | 'danger' | 'warning'> = {
  FUNCTIONAL: 'success',
  FAULTY: 'danger',
  MISSING: 'warning',
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editData?: Equipment | null;
  ascs: ASC[];
  categories: EquipmentCategory[];
  brands: EquipmentBrand[];
}

export function EquipmentFormModal({ isOpen, onClose, onSuccess, editData, ascs, categories, brands }: Props) {
  const [categoryId, setCategoryId] = useState('');
  const [brandId, setBrandId] = useState('');
  const [modelName, setModelName] = useState('');
  const [imei, setImei] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [status, setStatus] = useState('FUNCTIONAL');
  const [ownerId, setOwnerId] = useState('');
  const [acquisitionDate, setAcquisitionDate] = useState('');
  const [warrantyDate, setWarrantyDate] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  // Accessories
  const [pendingAccessories, setPendingAccessories] = useState<Accessory[]>([]);
  const [accFormOpen, setAccFormOpen] = useState(false);

  // Quick-create modals
  const [catCreateOpen, setCatCreateOpen] = useState(false);
  const [brandCreateOpen, setBrandCreateOpen] = useState(false);
  const [localCategories, setLocalCategories] = useState<EquipmentCategory[]>([]);
  const [localBrands, setLocalBrands] = useState<EquipmentBrand[]>([]);

  const isEdit = !!editData;

  const allCategories = [...categories, ...localCategories.filter((lc) => !categories.find((c) => c.id === lc.id))];
  const activeCategories = allCategories.filter((c) => c.is_active);
  const allBrands = [...brands, ...localBrands.filter((lb) => !brands.find((b) => b.id === lb.id))];
  const activeBrands = allBrands.filter((b) => b.is_active);

  useEffect(() => {
    if (editData) {
      setCategoryId(editData.category_id || '');
      setBrandId(editData.brand_id || '');
      setModelName(editData.model_name);
      setImei(editData.imei);
      setSerialNumber(editData.serial_number);
      setStatus(editData.status);
      setOwnerId(editData.owner_id || '');
      setAcquisitionDate(editData.acquisition_date || '');
      setWarrantyDate(editData.warranty_expiry_date || '');
      setNotes(editData.notes);
      setPendingAccessories(editData.accessories || []);
    } else {
      setCategoryId(''); setBrandId(''); setModelName(''); setImei('');
      setSerialNumber(''); setStatus('FUNCTIONAL'); setOwnerId('');
      setAcquisitionDate(''); setWarrantyDate(''); setNotes('');
      setPendingAccessories([]);
    }
    setLocalCategories([]);
    setLocalBrands([]);
  }, [editData, isOpen]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modelName.trim() || !imei.trim()) {
      toast.error('Modele et IMEI sont requis');
      return;
    }

    setSaving(true);
    try {
      const data = {
        equipment_type: categoryId ? (activeCategories.find((c) => c.id === categoryId)?.code || '') : '',
        category_id: categoryId || null,
        brand: brandId ? (activeBrands.find((b) => b.id === brandId)?.name || '') : '',
        brand_id: brandId || null,
        model_name: modelName, imei,
        serial_number: serialNumber, status,
        owner_id: ownerId || null,
        acquisition_date: acquisitionDate || null,
        warranty_expiry_date: warrantyDate || null,
        notes,
      };
      const res = isEdit
        ? await equipmentApi.update(editData!.id, data)
        : await equipmentApi.create(data);

      if (res.success && res.data) {
        const eqId = res.data.id;

        // Save new pending accessories (those with temp IDs)
        const newAccessories = pendingAccessories.filter((a) => a.id.startsWith('temp_'));
        for (const acc of newAccessories) {
          await equipmentApi.createAccessory(eqId, {
            name: acc.name,
            description: acc.description,
            serial_number: acc.serial_number,
            status: acc.status,
          });
        }

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

  const handleAccessoryCreated = (acc: Accessory) => {
    setPendingAccessories((prev) => [...prev, acc]);
  };

  const handleRemoveAccessory = (accId: string) => {
    setPendingAccessories((prev) => prev.filter((a) => a.id !== accId));
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
          {/* Type (Category) with + button */}
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end', flex: 1 }}>
            <div style={{ flex: 1 }}>
              <FormSelect
                label="Type"
                value={categoryId}
                onChange={(v) => setCategoryId(v)}
                options={[{ value: '', label: 'Selectionner' }, ...activeCategories.map((c) => ({ value: c.id, label: c.name }))]}
              />
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => setCatCreateOpen(true)} style={{ marginBottom: '0.25rem', flexShrink: 0 }}>
              <Plus size={16} />
            </Button>
          </div>
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
          {/* Brand with + button */}
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end', flex: 1 }}>
            <div style={{ flex: 1 }}>
              <FormSelect
                label="Marque"
                value={brandId}
                onChange={(v) => setBrandId(v)}
                options={[{ value: '', label: 'Selectionner' }, ...activeBrands.map((b) => ({ value: b.id, label: b.name }))]}
              />
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => setBrandCreateOpen(true)} style={{ marginBottom: '0.25rem', flexShrink: 0 }}>
              <Plus size={16} />
            </Button>
          </div>
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

        {/* Accessories section */}
        <div style={{ marginTop: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <label style={{ fontWeight: 500, fontSize: '0.875rem' }}>
              Accessoires ({pendingAccessories.length})
            </label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              leftIcon={<Plus size={14} />}
              onClick={() => setAccFormOpen(true)}
            >
              Ajouter
            </Button>
          </div>
          {pendingAccessories.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              {pendingAccessories.map((acc) => (
                <div
                  key={acc.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '0.375rem',
                    border: '1px solid var(--border-color, #e2e8f0)',
                    fontSize: '0.875rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontWeight: 500 }}>{acc.name}</span>
                    {acc.serial_number && (
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                        S/N: {acc.serial_number}
                      </span>
                    )}
                    <Badge variant={ACCESSORY_STATUS_VARIANT[acc.status] || 'secondary'}>
                      {ACCESSORY_STATUS_LABEL[acc.status] || acc.status}
                    </Badge>
                  </div>
                  {acc.id.startsWith('temp_') && (
                    <button
                      type="button"
                      className={shared.actionBtn}
                      onClick={() => handleRemoveAccessory(acc.id)}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: 0 }}>Aucun accessoire</p>
          )}
        </div>
      </form>

      <AccessoryFormModal
        isOpen={accFormOpen}
        onClose={() => setAccFormOpen(false)}
        onSuccess={() => {}}
        localMode={!isEdit}
        equipmentId={isEdit ? editData!.id : null}
        onCreated={handleAccessoryCreated}
      />

      <QuickCreateModal
        isOpen={catCreateOpen}
        onClose={() => setCatCreateOpen(false)}
        title="Nouveau Type d'equipement"
        onSave={(data) => equipmentApi.createCategory(data)}
        onCreated={(item) => { setLocalCategories((prev) => [...prev, item]); setCategoryId(item.id); }}
      />

      <QuickCreateModal
        isOpen={brandCreateOpen}
        onClose={() => setBrandCreateOpen(false)}
        title="Nouvelle Marque"
        onSave={(data) => equipmentApi.createBrand(data)}
        onCreated={(item) => { setLocalBrands((prev) => [...prev, item]); setBrandId(item.id); }}
      />
    </Modal>
  );
}
