import { useState, useEffect } from 'react';
import { FormModal } from '@/components/forms/FormModal/FormModal';
import { Button } from '@components/ui/Button/Button';
import { Badge } from '@components/ui/Badge/Badge';
import { FormInput } from '@/components/forms/FormInput/FormInput';
import { FormSelect } from '@/components/forms/FormSelect/FormSelect';
import { FormTextarea } from '@/components/forms/FormTextarea/FormTextarea';
import { FormImei, validateImei } from '@/components/forms/FormImei/FormImei';
import { useFormValidation } from '@/components/forms/useFormValidation';
import { Save, Plus, X } from 'lucide-react';
import shared from '@components/ui/styles/shared.module.css';
import toast from 'react-hot-toast';
import { equipmentApi } from '../../api';
import type { Equipment, ASC, Accessory, EquipmentCategory, EquipmentCategoryGroup, EquipmentBrand } from '../../types';
import { AccessoryFormModal } from './AccessoryFormModal';
import { EquipmentTypeFormModal } from './EquipmentTypeFormModal';
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

const VALIDATION_RULES = {
  modelName: { required: true, message: 'Le modèle / désignation est requis' },
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editData?: Equipment | null;
  ascs: ASC[];
  categories: EquipmentCategory[];
  categoryGroups: EquipmentCategoryGroup[];
  brands: EquipmentBrand[];
}

export function EquipmentFormModal({
  isOpen, onClose, onSuccess, editData,
  ascs, categories, categoryGroups, brands,
}: Props) {
  const [categoryId, setCategoryId] = useState('');
  const [brandId, setBrandId] = useState('');
  const [modelName, setModelName] = useState('');
  const [imeis, setImeis] = useState<string[]>(['']);
  const [hasSim, setHasSim] = useState(false);
  const [serialNumber, setSerialNumber] = useState('');
  const [status, setStatus] = useState('PENDING');
  const [isUnique, setIsUnique] = useState(true);
  const [ownerId, setOwnerId] = useState('');
  const [acquisitionDate, setAcquisitionDate] = useState('');
  const [warrantyDate, setWarrantyDate] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  // Auto-generated code preview
  const [equipmentCode, setEquipmentCode] = useState('');
  const [loadingCode, setLoadingCode] = useState(false);

  // Accessories
  const [pendingAccessories, setPendingAccessories] = useState<Accessory[]>([]);
  const [accFormOpen, setAccFormOpen] = useState(false);

  // Quick-create modals
  const [catCreateOpen, setCatCreateOpen] = useState(false);
  const [brandCreateOpen, setBrandCreateOpen] = useState(false);
  const [localCategories, setLocalCategories] = useState<EquipmentCategory[]>([]);
  const [localBrands, setLocalBrands] = useState<EquipmentBrand[]>([]);
  const [localGroups, setLocalGroups] = useState<EquipmentCategoryGroup[]>([]);

  const isEdit = !!editData;
  const { touchField, validateAll, getFieldError, getErrorMessages, isFormValid, reset } = useFormValidation(VALIDATION_RULES);

  const allCategories = [...categories, ...localCategories.filter((lc) => !categories.find((c) => c.id === lc.id))];
  const activeCategories = allCategories.filter((c) => c.is_active);
  const allBrands = [...brands, ...localBrands.filter((lb) => !brands.find((b) => b.id === lb.id))];
  const activeBrands = allBrands.filter((b) => b.is_active);
  const allGroups = [...categoryGroups, ...localGroups.filter((lg) => !categoryGroups.find((g) => g.id === lg.id))];

  // Catégorie sélectionnée
  const selectedCategory = activeCategories.find((c) => c.id === categoryId);
  const isElectronic = selectedCategory?.category_group_code === 'ELECTRONIQUE';

  // Pour les téléphones, has_sim est implicite
  const isPhone = isElectronic && selectedCategory?.code?.toUpperCase().includes('TEL');
  const showSimSection = isElectronic || hasSim;
  const imeiRequired = isPhone || (hasSim && !isElectronic) || (isElectronic && hasSim);

  useEffect(() => {
    if (editData) {
      setCategoryId(editData.category_id || '');
      setBrandId(editData.brand_id || '');
      setModelName(editData.model_name);
      setImeis(editData.imeis?.map((i) => i.imei) ?? (editData.imei ? [editData.imei] : ['']));
      setHasSim(editData.has_sim ?? false);
      setSerialNumber(editData.serial_number);
      setStatus(editData.status);
      setIsUnique(editData.is_unique ?? true);
      setOwnerId(editData.owner_id || '');
      setAcquisitionDate(editData.acquisition_date || '');
      setWarrantyDate(editData.warranty_expiry_date || '');
      setNotes(editData.notes);
      setPendingAccessories(editData.accessories || []);
      setEquipmentCode(editData.equipment_code || '');
    } else {
      setCategoryId(''); setBrandId(''); setModelName('');
      setImeis(['']); setHasSim(false); setSerialNumber('');
      setStatus('PENDING'); setIsUnique(true); setOwnerId('');
      setAcquisitionDate(''); setWarrantyDate(''); setNotes('');
      setPendingAccessories([]); setEquipmentCode('');
    }
    setLocalCategories([]);
    setLocalBrands([]);
    setLocalGroups([]);
    reset();
  }, [editData, isOpen]);

  // Charger le prochain code quand la catégorie change (création uniquement)
  useEffect(() => {
    if (isEdit || !categoryId) {
      if (!isEdit) setEquipmentCode('');
      return;
    }
    setLoadingCode(true);
    equipmentApi.getNextEquipmentCode(categoryId).then((res) => {
      if (res.success && res.data) setEquipmentCode(res.data.code);
    }).finally(() => setLoadingCode(false));
  }, [categoryId, isEdit]);

  const canSubmit = isFormValid({ modelName }) && (
    !imeiRequired || (imeis.length > 0 && imeis.every((v) => !validateImei(v)))
  );
  const errorMessages = getErrorMessages();

  const handleSave = async () => {
    if (!validateAll({ modelName })) return;
    if (imeiRequired && imeis.some((v) => validateImei(v))) {
      toast.error('Veuillez corriger les erreurs IMEI');
      return;
    }

    setSaving(true);
    try {
      const validImeis = imeis.filter((v) => v.trim().length > 0);
      const data: Record<string, unknown> = {
        category_id: categoryId || null,
        brand: brandId ? (activeBrands.find((b) => b.id === brandId)?.name || '') : '',
        brand_id: brandId || null,
        model_name: modelName,
        imeis: validImeis,
        has_sim: hasSim || isElectronic,
        serial_number: serialNumber,
        status,
        is_unique: isUnique,
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
        const newAccessories = pendingAccessories.filter((a) => a.id.startsWith('temp_'));
        for (const acc of newAccessories) {
          await equipmentApi.createAccessory(eqId, {
            name: acc.name,
            description: acc.description,
            serial_number: acc.serial_number,
            status: acc.status,
          });
        }
        toast.success(`Equipement ${isEdit ? 'mis à jour' : 'créé'} avec succès`);
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
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title={`${isEdit ? 'Modifier' : 'Nouvel'} Equipement`}
      size="lg"
      errors={errorMessages}
      onSubmit={handleSave}
      isSubmitDisabled={!canSubmit}
      isLoading={saving}
      submitLabel="Enregistrer"
      submitIcon={<Save size={16} />}
    >
      <form className={shared.form} onSubmit={(e) => { e.preventDefault(); handleSave(); }}>

        {/* ── Type + Code ────────────────────────────────────────────────── */}
        <div className={shared.formRow}>
          {/* Type avec bouton "+" */}
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end', flex: 1 }}>
            <div style={{ flex: 1 }}>
              <FormSelect
                label="Type d'équipement"
                value={categoryId}
                onChange={(v) => setCategoryId(v)}
                options={[
                  { value: '', label: 'Sélectionner' },
                  ...activeCategories.map((c) => ({
                    value: c.id,
                    label: c.category_group_name ? `${c.category_group_name} — ${c.name}` : c.name,
                  })),
                ]}
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCatCreateOpen(true)}
              style={{ marginBottom: '0.25rem', flexShrink: 0 }}
              title="Nouveau type"
            >
              <Plus size={16} />
            </Button>
          </div>

          {/* Code auto-généré (non modifiable) */}
          <FormInput
            label="Code équipement"
            value={loadingCode ? '...' : (equipmentCode || '—')}
            readOnly
            disabled
            hint="Généré automatiquement"
            style={{ background: 'var(--bg-secondary, #f8fafc)', cursor: 'not-allowed' }}
          />
        </div>

        {/* ── Statut + Unicité ───────────────────────────────────────────── */}
        <div className={shared.formRow}>
          <FormSelect
            label="Statut"
            value={status}
            onChange={(v) => setStatus(v)}
            options={[
              ...(!ownerId ? [{ value: 'PENDING', label: 'En attente' }] : []),
              { value: 'FUNCTIONAL', label: 'Fonctionnel' },
              { value: 'FAULTY', label: 'Défaillant' },
            ]}
          />
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', cursor: 'pointer', fontSize: '0.875rem', userSelect: 'none', paddingTop: '1.75rem' }}>
            <input
              type="checkbox"
              checked={isUnique}
              onChange={(e) => setIsUnique(e.target.checked)}
              style={{ width: '1rem', height: '1rem', cursor: 'pointer' }}
            />
            <span>
              <strong>Équipement unique</strong>{' '}
              <span style={{ color: 'var(--text-secondary)' }}>(non partageable)</span>
            </span>
          </label>
        </div>

        {/* ── Modèle / désignation ───────────────────────────────────────── */}
        <FormInput
          label="Modèle / Désignation"
          required
          value={modelName}
          onChange={(e) => setModelName(e.target.value)}
          onBlur={() => touchField('modelName', modelName)}
          error={getFieldError('modelName')}
        />

        {/* ── Champs spécifiques aux électroniques ───────────────────────── */}
        {isElectronic && (
          <>
            <div className={shared.formRow}>
              {/* Marque avec "+" */}
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end', flex: 1 }}>
                <div style={{ flex: 1 }}>
                  <FormSelect
                    label="Marque"
                    value={brandId}
                    onChange={(v) => setBrandId(v)}
                    options={[{ value: '', label: 'Sélectionner' }, ...activeBrands.map((b) => ({ value: b.id, label: b.name }))]}
                  />
                </div>
                <Button type="button" variant="outline" size="sm" onClick={() => setBrandCreateOpen(true)} style={{ marginBottom: '0.25rem', flexShrink: 0 }}>
                  <Plus size={16} />
                </Button>
              </div>
              <FormInput label="Numéro de série" value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)} />
            </div>
          </>
        )}

        {/* ── Carte SIM (pour non-électronique) ─────────────────────────── */}
        {!isElectronic && (
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', cursor: 'pointer', fontSize: '0.875rem', userSelect: 'none' }}>
            <input
              type="checkbox"
              checked={hasSim}
              onChange={(e) => {
                setHasSim(e.target.checked);
                if (!e.target.checked) setImeis(['']);
              }}
              style={{ width: '1rem', height: '1rem', cursor: 'pointer' }}
            />
            <span>
              <strong>Prend une carte SIM</strong>{' '}
              <span style={{ color: 'var(--text-secondary)' }}>(IMEI requis)</span>
            </span>
          </label>
        )}

        {/* ── IMEI(s) ────────────────────────────────────────────────────── */}
        {(isElectronic || hasSim) && (
          <FormImei
            values={imeis}
            onChange={setImeis}
            required={imeiRequired}
            label={isPhone ? 'IMEI(s) du téléphone' : 'IMEI(s)'}
          />
        )}

        {/* ── Propriétaire ASC ───────────────────────────────────────────── */}
        <FormSelect
          label="Propriétaire ASC"
          value={ownerId}
          onChange={(v) => {
            setOwnerId(v);
            if (v && status === 'PENDING') setStatus('FUNCTIONAL');
          }}
          options={[{ value: '', label: 'Aucun' }, ...ascs.map((a) => ({ value: a.id, label: `${a.full_name} (${a.code})` }))]}
        />

        {/* ── Dates ──────────────────────────────────────────────────────── */}
        <div className={shared.formRow}>
          <FormInput label="Date d'acquisition" type={"date" as any} value={acquisitionDate} onChange={(e) => setAcquisitionDate(e.target.value)} />
          <FormInput label="Fin de garantie" type={"date" as any} value={warrantyDate} onChange={(e) => setWarrantyDate(e.target.value)} />
        </div>

        <FormTextarea label="Notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />

        {/* ── Accessoires ────────────────────────────────────────────────── */}
        <div style={{ marginTop: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <label style={{ fontWeight: 500, fontSize: '0.875rem' }}>
              Accessoires ({pendingAccessories.length})
            </label>
            <Button type="button" variant="outline" size="sm" leftIcon={<Plus size={14} />} onClick={() => setAccFormOpen(true)}>
              Ajouter
            </Button>
          </div>
          {pendingAccessories.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              {pendingAccessories.map((acc) => (
                <div
                  key={acc.id}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0.5rem 0.75rem', borderRadius: '0.375rem',
                    border: '1px solid var(--border-color, #e2e8f0)', fontSize: '0.875rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontWeight: 500 }}>{acc.name}</span>
                    {acc.serial_number && (
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>S/N: {acc.serial_number}</span>
                    )}
                    <Badge variant={ACCESSORY_STATUS_VARIANT[acc.status] || 'secondary'}>
                      {ACCESSORY_STATUS_LABEL[acc.status] || acc.status}
                    </Badge>
                  </div>
                  {acc.id.startsWith('temp_') && (
                    <button type="button" className={shared.actionBtn} onClick={() => handleRemoveAccessory(acc.id)}>
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

      {/* Nouveau type d'équipement (avec groupe + "+" pour groupe) */}
      <EquipmentTypeFormModal
        isOpen={catCreateOpen}
        onClose={() => setCatCreateOpen(false)}
        categoryGroups={allGroups}
        onCategoryGroupCreated={(g) => setLocalGroups((prev) => [...prev, g])}
        onCreated={(item) => {
          setLocalCategories((prev) => [...prev, item]);
          setCategoryId(item.id);
        }}
      />

      <QuickCreateModal
        isOpen={brandCreateOpen}
        onClose={() => setBrandCreateOpen(false)}
        title="Nouvelle Marque"
        onSave={(data) => equipmentApi.createBrand(data)}
        onCreated={(item) => { setLocalBrands((prev) => [...prev, item]); setBrandId(item.id); }}
      />
    </FormModal>
  );
}
