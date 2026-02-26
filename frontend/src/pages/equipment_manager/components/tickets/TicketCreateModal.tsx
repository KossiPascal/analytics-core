import { useState, useEffect } from 'react';
import { FormModal } from '@/components/forms/FormModal/FormModal';
import { FormSelect } from '@/components/forms/FormSelect/FormSelect';
import { FormInput } from '@/components/forms/FormInput/FormInput';
import { FormTextarea } from '@/components/forms/FormTextarea/FormTextarea';
import { FormMultiSelect } from '@/components/forms/FormSelect/FormMultiSelect';
import { FormDatePicker } from '@/components/forms/FormDatePicker/FormDatePicker';
import { useFormValidation } from '@/components/forms/useFormValidation';
import { useAuth } from '@/contexts/AuthContext';
import { Save, Plus } from 'lucide-react';
import shared from '@components/ui/styles/shared.module.css';
import formStyles from '@/components/forms/styles/forms.module.css';
import toast from 'react-hot-toast';
import { ticketsApi, employeesApi, equipmentApi } from '../../api';
import type { Employee, Equipment, ProblemType } from '../../types';

const VALIDATION_RULES = {
  employeeId:  { required: true, message: "Sélectionner un employé" },
  equipmentId: { required: true, message: "Sélectionner un équipement" },
  description: { required: true, message: 'La description du problème est requise' },
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function TicketCreateModal({ isOpen, onClose, onSuccess }: Props) {
  const { user } = useAuth();
  const [employees, setEmployees]           = useState<Employee[]>([]);
  const [equipment, setEquipment]           = useState<Equipment[]>([]);
  const [problemTypes, setProblemTypes]     = useState<ProblemType[]>([]);
  const [employeeId, setEmployeeId]         = useState('');
  const [equipmentId, setEquipmentId]       = useState('');
  const [selectedProblemIds, setSelectedProblemIds] = useState<string[]>([]);
  const [description, setDescription]       = useState('');
  const [ticketDate, setTicketDate]         = useState(() => new Date().toISOString().slice(0, 10));
  const [saving, setSaving]                 = useState(false);
  const [equipLoading, setEquipLoading]     = useState(false);
  const [creatingProblem, setCreatingProblem] = useState(false);

  // New problem type popup
  const [showProblemPopup, setShowProblemPopup] = useState(false);
  const [newProblemName, setNewProblemName]     = useState('');
  const [newProblemCode, setNewProblemCode]     = useState('');
  const [newProblemCat, setNewProblemCat]       = useState('OTHER');
  const [savingProblem, setSavingProblem]       = useState(false);

  const { touchField, validateAll, getFieldError, getErrorMessages, isFormValid, reset } = useFormValidation(VALIDATION_RULES);

  useEffect(() => {
    if (isOpen) loadData();
  }, [isOpen]);

  // Recharger les équipements quand l'employé change
  useEffect(() => {
    if (!employeeId) {
      setEquipment([]);
      setEquipmentId('');
      return;
    }
    setEquipLoading(true);
    setEquipmentId('');
    equipmentApi.getAll({ employee_id: employeeId }).then((res) => {
      if (res.success) setEquipment(res.data ?? []);
    }).finally(() => setEquipLoading(false));
  }, [employeeId]);

  const loadData = async () => {
    const [empRes, ptRes] = await Promise.all([
      employeesApi.getAll({ active: 'true', ...(user?.department_code ? { department_code: user.department_code } : {}) }),
      ticketsApi.getProblemTypes(),
    ]);
    if (empRes.success) setEmployees(empRes.data ?? []);
    if (ptRes.success) setProblemTypes(ptRes.data ?? []);
    reset();
    setEmployeeId(''); setEquipmentId(''); setSelectedProblemIds([]); setDescription('');
    setTicketDate(new Date().toISOString().slice(0, 10));
  };

  const addCreatedProblem = (pt: ProblemType) => {
    setProblemTypes((prev) => [...prev, pt]);
    setSelectedProblemIds((prev) => [...prev, pt.id]);
  };

  // Called from dropdown inline creation
  const handleCreateProblem = async (name: string) => {
    setCreatingProblem(true);
    try {
      const code = name.toUpperCase().replace(/\s+/g, '_').replace(/[^A-Z0-9_]/g, '').slice(0, 50);
      const res = await ticketsApi.createProblemType({ name, code, category: 'OTHER' });
      if (res.success && res.data) {
        addCreatedProblem(res.data as ProblemType);
        toast.success(`Type de problème "${name}" créé`);
      } else {
        toast.error(res.message || 'Erreur lors de la création');
      }
    } catch {
      toast.error('Erreur lors de la création du type de problème');
    } finally {
      setCreatingProblem(false);
    }
  };

  // Called from popup
  const handleSaveProblemPopup = async () => {
    if (!newProblemName.trim() || !newProblemCode.trim()) return;
    setSavingProblem(true);
    try {
      const res = await ticketsApi.createProblemType({
        name: newProblemName.trim(),
        code: newProblemCode.trim().toUpperCase(),
        category: newProblemCat,
      });
      if (res.success && res.data) {
        addCreatedProblem(res.data as ProblemType);
        toast.success(`Type de problème "${newProblemName}" créé`);
        setShowProblemPopup(false);
        setNewProblemName(''); setNewProblemCode(''); setNewProblemCat('OTHER');
      } else {
        toast.error(res.message || 'Erreur lors de la création');
      }
    } catch {
      toast.error('Erreur lors de la création du type de problème');
    } finally {
      setSavingProblem(false);
    }
  };

  const canSubmit = isFormValid({ employeeId, equipmentId, description });
  const errorMessages = getErrorMessages();

  const handleSave = async () => {
    if (!validateAll({ employeeId, equipmentId, description })) return;

    setSaving(true);
    try {
      const res = await ticketsApi.create({
        employee_id: employeeId,
        equipment_id: equipmentId,
        problem_description: description,
        problem_type_ids: selectedProblemIds,
        initial_send_date: ticketDate,
      });
      if (res.success) {
        toast.success('Ticket créé avec succès');
        onSuccess();
        onClose();
        setEmployeeId(''); setEquipmentId(''); setSelectedProblemIds([]); setDescription('');
        setTicketDate(new Date().toISOString().slice(0, 10)); reset();
      } else {
        toast.error(res.message || 'Erreur');
      }
    } catch {
      toast.error('Erreur lors de la création');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title="Nouveau Ticket de Réparation"
      size="lg"
      errors={errorMessages}
      onSubmit={handleSave}
      isSubmitDisabled={!canSubmit}
      isLoading={saving}
      submitLabel="Créer le ticket"
      submitIcon={<Save size={16} />}
    >
      <form className={shared.form} onSubmit={(e) => { e.preventDefault(); handleSave(); }}>

        {/* Employé */}
        <FormSelect
          label="Employé"
          required
          value={employeeId}
          onChange={(v) => { setEmployeeId(v); touchField('employeeId', v); }}
          error={getFieldError('employeeId')}
          options={[
            { value: '', label: 'Sélectionner un employé' },
            ...employees.map((e) => ({
              value: e.id,
              label: `${e.full_name} (${e.employee_id_code ?? ''})${e.position_name ? ` — ${e.position_name}` : ''}`,
            })),
          ]}
        />

        {/* Équipement (filtré par employé sélectionné) */}
        <FormSelect
          label="Équipement"
          required
          value={equipmentId}
          onChange={(v) => { setEquipmentId(v); touchField('equipmentId', v); }}
          error={getFieldError('equipmentId')}
          options={[
            {
              value: '',
              label: equipLoading
                ? 'Chargement...'
                : employeeId
                ? equipment.length === 0
                  ? 'Aucun équipement pour cet employé'
                  : 'Sélectionner un équipement'
                : "Sélectionner d'abord un employé",
            },
            ...equipment.map((e) => ({
              value: e.id,
              label: `${e.equipment_code} — ${e.brand || ''} ${e.model_name}`.trim(),
            })),
          ]}
        />

        {/* Date du ticket */}
        <FormDatePicker
          label="Date du ticket"
          required
          value={ticketDate}
          onChange={(e) => setTicketDate((e.target as HTMLInputElement).value)}
          max={new Date().toISOString().slice(0, 10)}
        />

        {/* Types de problèmes */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.375rem' }}>
            <span className={formStyles.label}>Problèmes</span>
            <button
              type="button"
              onClick={() => setShowProblemPopup(true)}
              title="Ajouter un nouveau type de problème"
              style={{
                display: 'flex', alignItems: 'center', gap: '0.25rem',
                padding: '0.2rem 0.6rem', borderRadius: '6px', border: '1px solid var(--form-border)',
                background: 'var(--form-bg)', color: 'var(--form-text)', cursor: 'pointer',
                fontSize: '0.75rem', fontWeight: 600,
              }}
            >
              <Plus size={13} /> Nouveau
            </button>
          </div>
          <FormMultiSelect
            placeholder="Sélectionner ou créer des problèmes..."
            searchable
            searchPlaceholder="Rechercher un problème..."
            creatable
            onCreateOption={handleCreateProblem}
            isCreating={creatingProblem}
            createLabel={(term) => `Ajouter "${term}" comme nouveau problème`}
            value={selectedProblemIds}
            onChange={setSelectedProblemIds}
            options={problemTypes.map((pt) => ({
              value: pt.id,
              label: `${pt.name} (${pt.category})`,
            }))}
          />
        </div>

        {/* Description */}
        <FormTextarea
          label="Description du problème"
          required
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onBlur={() => touchField('description', description)}
          error={getFieldError('description')}
        />
      </form>
    </FormModal>

    {/* Popup : nouveau type de problème */}
    <FormModal
      isOpen={showProblemPopup}
      onClose={() => { setShowProblemPopup(false); setNewProblemName(''); setNewProblemCode(''); setNewProblemCat('OTHER'); }}
      title="Nouveau type de problème"
      size="sm"
      onSubmit={handleSaveProblemPopup}
      isSubmitDisabled={!newProblemName.trim() || !newProblemCode.trim() || savingProblem}
      isLoading={savingProblem}
      submitLabel="Créer"
      submitIcon={<Save size={16} />}
    >
      <form className={shared.form} onSubmit={(e) => { e.preventDefault(); handleSaveProblemPopup(); }}>
        <FormInput
          label="Nom"
          required
          value={newProblemName}
          onChange={(e) => {
            const name = e.target.value;
            setNewProblemName(name);
            setNewProblemCode(name.toUpperCase().replace(/\s+/g, '_').replace(/[^A-Z0-9_]/g, '').slice(0, 50));
          }}
          placeholder="Ex : Écran cassé"
        />
        <FormInput
          label="Code"
          required
          value={newProblemCode}
          onChange={(e) => setNewProblemCode(e.target.value.toUpperCase())}
          placeholder="Ex : ECRAN_CASSE"
        />
        <FormSelect
          label="Catégorie"
          required
          value={newProblemCat}
          onChange={setNewProblemCat}
          options={[
            { value: 'HARDWARE', label: 'Matériel (HARDWARE)' },
            { value: 'SOFTWARE', label: 'Logiciel (SOFTWARE)' },
            { value: 'OTHER',    label: 'Autre (OTHER)' },
          ]}
        />
      </form>
    </FormModal>
    </>
  );
}
