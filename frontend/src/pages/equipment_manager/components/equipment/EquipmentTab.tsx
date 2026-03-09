import { useState, useEffect } from 'react';
import { Button } from '@components/ui/Button/Button';
import { Modal } from '@components/ui/Modal/Modal';
import { Table, type Column } from '@components/ui/Table/Table';
import { FormInput } from '@/components/forms/FormInput/FormInput';
import { FormSelect } from '@/components/forms/FormSelect/FormSelect';
import { FormTextarea } from '@/components/forms/FormTextarea/FormTextarea';
import { FormSwitch } from '@/components/forms/FormSwitch/FormSwitch';
import { Badge } from '@components/ui/Badge/Badge';
import { Plus, RefreshCw, Save, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { equipmentApi, ascsApi, employeesApi } from '../../api';
import type {
  Equipment, ASC, Employee,
  EquipmentCategory, EquipmentCategoryGroup, EquipmentBrand,
} from '../../types';
import { EquipmentTable } from './EquipmentTable';
import { EquipmentFormModal } from './EquipmentFormModal';
import { EquipmentDetailModal } from './EquipmentDetailModal';
import { AssignEquipmentModal } from './AssignEquipmentModal';
import { DeclareStatusModal } from './DeclareStatusModal';
import styles from '../../EquipmentManager.module.css';
import shared from '@components/ui/styles/shared.module.css';

type SubTab = 'equipment' | 'categories' | 'category_groups';

const SUB_TABS: { key: SubTab; label: string }[] = [
  { key: 'equipment',       label: 'Équipements' },
  { key: 'categories',      label: 'Catégories' },
  { key: 'category_groups', label: 'Types' },
];

export function EquipmentTab() {
  const [subTab, setSubTab] = useState<SubTab>('equipment');

  // ── Equipment ────────────────────────────────────────────────────────────
  const [equipment, setEquipment]           = useState<Equipment[]>([]);
  const [ascs, setAscs]                     = useState<ASC[]>([]);
  const [employees, setEmployees]           = useState<Employee[]>([]);
  const [brands, setBrands]                 = useState<EquipmentBrand[]>([]);
  const [loading, setLoading]               = useState(false);
  const [initialized, setInitialized]       = useState(false);
  const [eqLoading, setEqLoading]           = useState(false);
  const [formOpen, setFormOpen]             = useState(false);
  const [editData, setEditData]             = useState<Equipment | null>(null);
  const [detailOpen, setDetailOpen]         = useState(false);
  const [detailId, setDetailId]             = useState<string | null>(null);
  const [assignOpen, setAssignOpen]         = useState(false);
  const [assignTarget, setAssignTarget]     = useState<Equipment | null>(null);
  const [declareOpen, setDeclareOpen]       = useState(false);
  const [declareTarget, setDeclareTarget]   = useState<Equipment | null>(null);

  // ── Categories ────────────────────────────────────────────────────────────
  const [categories, setCategories]         = useState<EquipmentCategory[]>([]);
  const [catFormOpen, setCatFormOpen]       = useState(false);
  const [catEdit, setCatEdit]               = useState<EquipmentCategory | null>(null);
  const [catName, setCatName]               = useState('');
  const [catCode, setCatCode]               = useState('');
  const [catGroupId, setCatGroupId]         = useState('');
  const [catDesc, setCatDesc]               = useState('');
  const [catActive, setCatActive]           = useState(true);
  const [catSaving, setCatSaving]           = useState(false);

  // ── Category Groups (Types) ───────────────────────────────────────────────
  const [categoryGroups, setCategoryGroups] = useState<EquipmentCategoryGroup[]>([]);
  const [grpFormOpen, setGrpFormOpen]       = useState(false);
  const [grpEdit, setGrpEdit]               = useState<EquipmentCategoryGroup | null>(null);
  const [grpName, setGrpName]               = useState('');
  const [grpCode, setGrpCode]               = useState('');
  const [grpDesc, setGrpDesc]               = useState('');
  const [grpActive, setGrpActive]           = useState(true);
  const [grpSaving, setGrpSaving]           = useState(false);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [eqRes, ascsRes, empRes, catRes, brandRes, groupRes] = await Promise.all([
        equipmentApi.getAll(),
        ascsApi.getAll(),
        employeesApi.getAll(),
        equipmentApi.getCategories(),
        equipmentApi.getBrands(),
        equipmentApi.getCategoryGroups(),
      ]);
      if (eqRes.success)    setEquipment(eqRes.data!);
      if (ascsRes.success)  setAscs(ascsRes.data!);
      if (empRes.success)   setEmployees(empRes.data!);
      if (catRes.success)   setCategories(catRes.data!);
      if (brandRes.success) setBrands(brandRes.data!);
      if (groupRes.success) setCategoryGroups(groupRes.data!);
    } catch {
      toast.error('Erreur de chargement');
    } finally {
      setLoading(false);
      setInitialized(true);
    }
  };

  const loadEquipment = async () => {
    setEqLoading(true);
    try {
      const res = await equipmentApi.getAll();
      if (res.success) setEquipment(res.data!);
    } catch {
      toast.error('Erreur de chargement des équipements');
    } finally {
      setEqLoading(false);
    }
  };

  // ── Category CRUD ─────────────────────────────────────────────────────────
  const openCatForm = (cat: EquipmentCategory | null) => {
    setCatEdit(cat);
    setCatName(cat?.name ?? '');
    setCatCode(cat?.code ?? '');
    setCatGroupId(cat?.category_group_id ?? '');
    setCatDesc(cat?.description ?? '');
    setCatActive(cat?.is_active ?? true);
    setCatFormOpen(true);
  };

  const handleSaveCat = async () => {
    if (!catName.trim() || !catCode.trim()) {
      toast.error('Nom et code sont requis');
      return;
    }
    setCatSaving(true);
    const payload = {
      name: catName.trim(),
      code: catCode.trim().toUpperCase(),
      category_group_id: catGroupId || null,
      description: catDesc.trim(),
      is_active: catActive,
    };
    const res = catEdit
      ? await equipmentApi.updateCategory(catEdit.id, payload)
      : await equipmentApi.createCategory(payload);
    setCatSaving(false);
    if (res.success) {
      toast.success(catEdit ? 'Catégorie mise à jour' : 'Catégorie créée');
      setCatFormOpen(false);
      loadAll();
    } else {
      toast.error(res.message ?? 'Erreur');
    }
  };

  // ── Category Group CRUD ───────────────────────────────────────────────────
  const openGrpForm = (grp: EquipmentCategoryGroup | null) => {
    setGrpEdit(grp);
    setGrpName(grp?.name ?? '');
    setGrpCode(grp?.code ?? '');
    setGrpDesc(grp?.description ?? '');
    setGrpActive(grp?.is_active ?? true);
    setGrpFormOpen(true);
  };

  const handleSaveGrp = async () => {
    if (!grpName.trim() || !grpCode.trim()) {
      toast.error('Nom et code sont requis');
      return;
    }
    setGrpSaving(true);
    const payload = {
      name: grpName.trim(),
      code: grpCode.trim().toUpperCase(),
      description: grpDesc.trim(),
      is_active: grpActive,
    };
    const res = grpEdit
      ? await equipmentApi.updateCategoryGroup(grpEdit.id, payload)
      : await equipmentApi.createCategoryGroup(payload);
    setGrpSaving(false);
    if (res.success) {
      toast.success(grpEdit ? 'Type mis à jour' : 'Type créé');
      setGrpFormOpen(false);
      loadAll();
    } else {
      toast.error(res.message ?? 'Erreur');
    }
  };

  // ── Add button label ──────────────────────────────────────────────────────
  const getAddLabel = () => {
    if (subTab === 'categories')      return 'Nouvelle catégorie';
    if (subTab === 'category_groups') return 'Nouveau type';
    return 'Nouvel équipement';
  };

  const handleAddClick = () => {
    if (subTab === 'categories')      { openCatForm(null); return; }
    if (subTab === 'category_groups') { openGrpForm(null); return; }
    setEditData(null); setFormOpen(true);
  };

  // ── Columns ───────────────────────────────────────────────────────────────
  const catColumns: Column<EquipmentCategory>[] = [
    { key: 'code',  header: 'Code',  render: (c) => <code style={{ fontSize: '0.8rem' }}>{c.code}</code>, sortable: true },
    { key: 'name',  header: 'Nom',   render: (c) => c.name, sortable: true, searchable: true },
    { key: 'group', header: 'Type',  render: (c) => c.category_group_name || '-' },
    { key: 'status', header: 'Statut', align: 'center',
      render: (c) => <Badge variant={c.is_active ? 'success' : 'danger'}>{c.is_active ? 'Actif' : 'Inactif'}</Badge> },
    { key: 'actions', header: 'Actions', align: 'center',
      render: (c) => (
        <div className={shared.actionsCell}>
          <button className={shared.actionBtn} onClick={() => openCatForm(c)} title="Modifier">Modifier</button>
        </div>
      ),
    },
  ];

  const grpColumns: Column<EquipmentCategoryGroup>[] = [
    { key: 'code',  header: 'Code', render: (g) => <code style={{ fontSize: '0.8rem' }}>{g.code}</code>, sortable: true },
    { key: 'name',  header: 'Nom',  render: (g) => g.name, sortable: true, searchable: true },
    { key: 'description', header: 'Description', render: (g) => g.description || '-' },
    { key: 'status', header: 'Statut', align: 'center',
      render: (g) => <Badge variant={g.is_active ? 'success' : 'danger'}>{g.is_active ? 'Actif' : 'Inactif'}</Badge> },
    { key: 'actions', header: 'Actions', align: 'center',
      render: (g) => (
        <div className={shared.actionsCell}>
          <button className={shared.actionBtn} onClick={() => openGrpForm(g)} title="Modifier">Modifier</button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div className={styles.subTabsList}>
          {SUB_TABS.map((t) => (
            <button
              key={t.key}
              className={`${styles.subTabItem} ${subTab === t.key ? styles.active : ''}`}
              onClick={() => setSubTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>
        <Button size="sm" leftIcon={<Plus size={16} />} onClick={handleAddClick}>
          {getAddLabel()}
        </Button>
      </div>

      {/* ── Équipements ── */}
      {subTab === 'equipment' && (
        !initialized ? (
          <div className={styles.loading}><RefreshCw size={28} className="animate-spin" /></div>
        ) : (
          <EquipmentTable
            data={equipment}
            isLoading={eqLoading}
            onEdit={async (e) => {
              const res = await equipmentApi.get(e.id);
              setEditData(res.success && res.data ? res.data : e);
              setFormOpen(true);
            }}
            onView={(e) => { setDetailId(e.id); setDetailOpen(true); }}
            onAssign={(e) => { setAssignTarget(e); setAssignOpen(true); }}
            onDeclare={(e) => { setDeclareTarget(e); setDeclareOpen(true); }}
            onGeneratePdf={async (e) => {
              try { await equipmentApi.downloadReceptionPdf(e.id); }
              catch { toast.error('Erreur lors de la génération du PDF'); }
            }}
          />
        )
      )}

      {/* ── Catégories ── */}
      {subTab === 'categories' && (
        !initialized ? (
          <div className={styles.loading}><RefreshCw size={28} className="animate-spin" /></div>
        ) : (
          <Table<EquipmentCategory>
            data={categories}
            columns={catColumns}
            keyExtractor={(c) => c.id}
            isLoading={loading}
            emptyMessage="Aucune catégorie"
            features={{ search: true, pagination: true }}
            searchPlaceholder="Rechercher une catégorie..."
          />
        )
      )}

      {/* ── Types (Category Groups) ── */}
      {subTab === 'category_groups' && (
        !initialized ? (
          <div className={styles.loading}><RefreshCw size={28} className="animate-spin" /></div>
        ) : (
          <Table<EquipmentCategoryGroup>
            data={categoryGroups}
            columns={grpColumns}
            keyExtractor={(g) => g.id}
            isLoading={loading}
            emptyMessage="Aucun type"
            features={{ search: true, pagination: true }}
            searchPlaceholder="Rechercher un type..."
          />
        )
      )}

      {/* ── Modals équipement ── */}
      <EquipmentFormModal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        onSuccess={loadEquipment}
        editData={editData}
        ascs={ascs}
        categories={categories}
        categoryGroups={categoryGroups}
        brands={brands}
      />
      <EquipmentDetailModal
        isOpen={detailOpen}
        onClose={() => setDetailOpen(false)}
        equipmentId={detailId}
        onStatusChange={loadEquipment}
      />
      <DeclareStatusModal
        isOpen={declareOpen}
        onClose={() => setDeclareOpen(false)}
        onSuccess={loadEquipment}
        equipment={declareTarget}
      />
      <AssignEquipmentModal
        isOpen={assignOpen}
        onClose={() => setAssignOpen(false)}
        onSuccess={loadEquipment}
        equipment={assignTarget}
        employees={employees}
      />

      {/* ── Modal catégorie ── */}
      <Modal
        isOpen={catFormOpen}
        onClose={() => setCatFormOpen(false)}
        title={catEdit ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
        size="sm"
        footer={
          <div className={shared.modalFooter}>
            <Button variant="outline" size="sm" onClick={() => setCatFormOpen(false)}>Annuler</Button>
            <Button size="sm" onClick={handleSaveCat} isLoading={catSaving}>
              <Save size={16} />{catSaving ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </div>
        }
      >
        <div className={shared.form}>
          <div className={shared.formRow}>
            <FormInput label="Nom" required value={catName} onChange={(e) => setCatName(e.target.value)} placeholder="ex: Téléphone" />
            <FormInput label="Code" required value={catCode} onChange={(e) => setCatCode(e.target.value.toUpperCase())} placeholder="ex: TELEPHONE" />
          </div>
          <FormSelect
            label="Type (groupe)"
            value={catGroupId}
            onChange={(v) => setCatGroupId(v)}
            options={[
              { value: '', label: '— Aucun —' },
              ...categoryGroups.map((g) => ({ value: g.id, label: g.name })),
            ]}
          />
          <FormTextarea label="Description" rows={2} value={catDesc} onChange={(e) => setCatDesc(e.target.value)} />
          <FormSwitch label="Catégorie active" checked={catActive} onChange={(e) => setCatActive(e.target.checked)} />
        </div>
      </Modal>

      {/* ── Modal type (category group) ── */}
      <Modal
        isOpen={grpFormOpen}
        onClose={() => setGrpFormOpen(false)}
        title={grpEdit ? 'Modifier le type' : 'Nouveau type'}
        size="sm"
        footer={
          <div className={shared.modalFooter}>
            <Button variant="outline" size="sm" onClick={() => setGrpFormOpen(false)}>Annuler</Button>
            <Button size="sm" onClick={handleSaveGrp} isLoading={grpSaving}>
              <Save size={16} />{grpSaving ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </div>
        }
      >
        <div className={shared.form}>
          <div className={shared.formRow}>
            <FormInput label="Nom" required value={grpName} onChange={(e) => setGrpName(e.target.value)} placeholder="ex: Appareils électroniques" />
            <FormInput label="Code" required value={grpCode} onChange={(e) => setGrpCode(e.target.value.toUpperCase())} placeholder="ex: ELECTRONIQUE" />
          </div>
          <FormTextarea label="Description" rows={2} value={grpDesc} onChange={(e) => setGrpDesc(e.target.value)} />
          <FormSwitch label="Type actif" checked={grpActive} onChange={(e) => setGrpActive(e.target.checked)} />
        </div>
      </Modal>
    </div>
  );
}
