import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Edit2, Trash2, ChevronRight, ChevronDown, Target,
  Upload, FileSpreadsheet, CheckCircle2, AlertCircle, X,
  Flag, Layers, Building2, TrendingUp,
} from 'lucide-react';
import { orcsApi, pillarsApi, projectsApi, importApi } from '../../api';
import type { ORC, StrategicPillar, Project, ORCStatus, Priority, OrcType, Quarter } from '../../types';
import {
  ORC_STATUS_LABELS, ORC_STATUS_VARIANT,
  ORC_TYPE_LABELS, ORC_TYPE_VARIANT,
  PRIORITY_LABELS, PRIORITY_VARIANT,
  QUARTER_LABELS,
} from '../../types';
import { Button } from '@components/ui/Button/Button';
import { Badge } from '@components/ui/Badge/Badge';
import { Modal } from '@components/ui/Modal/Modal';
import { Spinner } from '@components/ui/Spinner/Spinner';
import styles from '../../Prosi.module.css';

const STATUS_OPTIONS: ORCStatus[] = ['DRAFT', 'ACTIVE', 'AT_RISK', 'COMPLETED', 'CANCELLED'];
const PRIORITY_OPTIONS: Priority[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const ORC_TYPE_OPTIONS: OrcType[]  = ['OBJECTIF', 'RESULTAT_CLE'];
const QUARTER_OPTIONS: Quarter[]   = ['T1', 'T2', 'T3', 'T4', 'YEARLY'];
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - 1 + i);

const EMPTY_FORM = {
  name: '', description: '', project_id: '', pillar_id: '',
  parent_id: '', orc_type: 'OBJECTIF' as OrcType,
  code: '', target_indicator: '',
  target_value: '', current_value: '', unit: '',
  status: 'DRAFT' as ORCStatus, priority: 'MEDIUM' as Priority,
  weight: '1', start_date: '', end_date: '',
  fiscal_year: String(CURRENT_YEAR), quarter: '' as Quarter | '',
  notes: '',
};

function scoreColor(score: number | null): string {
  if (score === null) return '#94a3b8';
  if (score >= 0.7) return '#10b981';
  if (score >= 0.4) return '#f59e0b';
  return '#ef4444';
}

function scoreLabel(score: number | null): string {
  if (score === null) return '—';
  return `${Math.round(score * 100)}%`;
}

// ─── ORC item récursif ────────────────────────────────────────────────────────
interface ORCItemProps {
  orc: ORC;
  depth: number;
  onEdit: (o: ORC) => void;
  onDelete: (o: ORC) => void;
  onAddChild: (o: ORC) => void;
}

function ORCItem({ orc, depth, onEdit, onDelete, onAddChild }: ORCItemProps) {
  const [open, setOpen] = useState(depth === 0);
  const hasChildren = orc.children && orc.children.length > 0;

  return (
    <div style={{ marginLeft: depth === 0 ? 0 : '1.5rem', borderLeft: depth > 0 ? '2px solid #e2e8f0' : 'none', paddingLeft: depth > 0 ? '0.75rem' : 0 }}>
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className={styles.orcCard}
        style={{ borderLeft: `4px solid ${orc.orc_type === 'OBJECTIF' ? '#6366f1' : '#06b6d4'}`, marginBottom: '0.5rem' }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
          {hasChildren ? (
            <button onClick={() => setOpen(!open)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: '#6366f1', flexShrink: 0, marginTop: '2px' }}>
              {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
          ) : <div style={{ width: 20, flexShrink: 0 }} />}

          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Badges */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
              <Badge variant={ORC_TYPE_VARIANT[orc.orc_type] as any} size="sm">{ORC_TYPE_LABELS[orc.orc_type]}</Badge>
              {orc.code && (
                <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', fontWeight: 700, color: '#6366f1', background: '#eef2ff', borderRadius: 4, padding: '1px 5px' }}>
                  {orc.code}
                </span>
              )}
              {orc.priority && orc.priority !== 'MEDIUM' && (
                <Badge variant={PRIORITY_VARIANT[orc.priority] as any} size="sm">
                  <Flag size={10} style={{ marginRight: 2 }} />{PRIORITY_LABELS[orc.priority]}
                </Badge>
              )}
              <Badge variant={ORC_STATUS_VARIANT[orc.status] as any} size="sm">{ORC_STATUS_LABELS[orc.status]}</Badge>
              {orc.fiscal_year && (
                <span style={{ fontSize: '0.7rem', color: '#64748b' }}>FY{orc.fiscal_year}{orc.quarter ? ` · ${orc.quarter}` : ''}</span>
              )}
            </div>

            <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#1e293b', marginBottom: '0.2rem' }}>{orc.name}</div>

            {orc.target_indicator && (
              <div style={{ fontSize: '0.78rem', color: '#64748b', fontStyle: 'italic', marginBottom: '0.25rem' }}>
                <Target size={11} style={{ marginRight: 3, verticalAlign: 'middle' }} />{orc.target_indicator}
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', minWidth: 140 }}>
                <div className={styles.progressBar} style={{ flex: 1 }}>
                  <div
                    className={`${styles.progressFill} ${orc.progress_percent >= 100 ? styles.done : orc.progress_percent >= 50 ? styles.medium : styles.low}`}
                    style={{ width: `${orc.progress_percent}%` }}
                  />
                </div>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#6366f1', whiteSpace: 'nowrap' }}>
                  {orc.current_value}{orc.unit ? ` ${orc.unit}` : ''} / {orc.target_value ?? '?'}{orc.unit ? ` ${orc.unit}` : ''}
                </span>
              </div>
              {orc.score !== null && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <TrendingUp size={12} style={{ color: scoreColor(orc.score) }} />
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: scoreColor(orc.score) }}>Score : {scoreLabel(orc.score)}</span>
                </div>
              )}
              {orc.department_name && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.72rem', color: '#64748b' }}>
                  <Building2 size={11} />{orc.department_name}
                </div>
              )}
              {orc.responsible_name && (
                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>👤 {orc.responsible_name}</div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.2rem', flexShrink: 0 }}>
            {orc.orc_type === 'OBJECTIF' && (
              <Button variant="ghost" size="sm" onClick={() => onAddChild(orc)} title="Ajouter un Résultat Clé"><Plus size={13} /></Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => onEdit(orc)} title="Modifier"><Edit2 size={13} /></Button>
            <Button variant="ghost" size="sm" onClick={() => onDelete(orc)} title="Supprimer"><Trash2 size={13} /></Button>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {open && hasChildren && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
            {orc.children!.map((child) => (
              <ORCItem key={child.id} orc={child} depth={depth + 1} onEdit={onEdit} onDelete={onDelete} onAddChild={onAddChild} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────
export function ORCsTab() {
  const [orcs, setOrcs]         = useState<ORC[]>([]);
  const [pillars, setPillars]   = useState<StrategicPillar[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showModal, setShowModal]   = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [editing, setEditing]       = useState<ORC | null>(null);
  const [form, setForm]             = useState({ ...EMPTY_FORM });
  const [saving, setSaving]         = useState(false);

  const [filterProject, setFilterProject] = useState('');
  const [filterType, setFilterType]       = useState('');
  const [filterStatus, setFilterStatus]   = useState('');
  const [filterYear, setFilterYear]       = useState('');
  const [filterQuarter, setFilterQuarter] = useState('');

  const fileRef = useRef<HTMLInputElement>(null);
  const [importFile, setImportFile]         = useState<File | null>(null);
  const [importSheets, setImportSheets]     = useState<string[]>([]);
  const [selectedSheets, setSelectedSheets] = useState<string[]>([]);
  const [importForm, setImportForm] = useState({
    project_id: '', fiscal_year: String(CURRENT_YEAR), quarter: '' as Quarter | '', overwrite: false,
  });
  const [importing, setImporting]       = useState(false);
  const [importResult, setImportResult] = useState<{ message: string; stats: Record<string, number> } | null>(null);
  const [importError, setImportError]   = useState('');
  const [loadingSheets, setLoadingSheets] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.allSettled([
      orcsApi.getAll({ project_id: filterProject || undefined, status: filterStatus || undefined, orc_type: filterType || undefined, root_only: true }),
      pillarsApi.getAll({ project_id: filterProject || undefined }),
      projectsApi.getAll(),
    ]).then(([orcRes, pilRes, projRes]) => {
      if (orcRes.status  === 'fulfilled' && orcRes.value.success)  setOrcs(orcRes.value.data!);
      if (pilRes.status  === 'fulfilled' && pilRes.value.success)  setPillars(pilRes.value.data!);
      if (projRes.status === 'fulfilled' && projRes.value.success) setProjects(projRes.value.data!);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filterProject, filterType, filterStatus, filterYear, filterQuarter]);

  useEffect(() => {
    if (form.project_id) {
      pillarsApi.getAll({ project_id: form.project_id }).then((r) => { if (r.success) setPillars(r.data!); });
    }
  }, [form.project_id]);

  const openCreate = () => { setEditing(null); setForm({ ...EMPTY_FORM }); setShowModal(true); };
  const openEdit   = (o: ORC) => {
    setEditing(o);
    setForm({
      name: o.name, description: o.description,
      project_id: o.project_id, pillar_id: o.pillar_id || '',
      parent_id: o.parent_id || '', orc_type: o.orc_type,
      code: o.code, target_indicator: o.target_indicator,
      target_value: o.target_value !== null ? String(o.target_value) : '',
      current_value: String(o.current_value), unit: o.unit,
      status: o.status, priority: o.priority,
      weight: String(o.weight),
      start_date: o.start_date || '', end_date: o.end_date || '',
      fiscal_year: o.fiscal_year ? String(o.fiscal_year) : String(CURRENT_YEAR),
      quarter: (o.quarter as Quarter | '') || '',
      notes: o.notes,
    });
    setShowModal(true);
  };
  const openAddChild = (parent: ORC) => {
    setEditing(null);
    setForm({ ...EMPTY_FORM, project_id: parent.project_id, pillar_id: parent.pillar_id || '', parent_id: parent.id, orc_type: 'RESULTAT_CLE', fiscal_year: parent.fiscal_year ? String(parent.fiscal_year) : String(CURRENT_YEAR), quarter: (parent.quarter as Quarter | '') || '' });
    setShowModal(true);
  };

  const handleDelete = async (o: ORC) => {
    if (!confirm(`Supprimer "${o.name}" ?`)) return;
    await orcsApi.delete(o.id);
    load();
  };

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.project_id) return;
    setSaving(true);
    const payload = {
      ...form,
      pillar_id:     form.pillar_id    || null,
      parent_id:     form.parent_id    || null,
      target_value:  form.target_value ? parseFloat(form.target_value) : null,
      current_value: parseFloat(form.current_value) || 0,
      weight:        parseFloat(form.weight) || 1,
      fiscal_year:   form.fiscal_year ? parseInt(form.fiscal_year) : null,
      quarter:       form.quarter || null,
      start_date:    form.start_date || null,
      end_date:      form.end_date   || null,
    };
    const r = editing ? await orcsApi.update(editing.id, payload) : await orcsApi.create(payload);
    setSaving(false);
    if (r.success) { setShowModal(false); load(); }
  };

  const f = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  // ── Import Excel ─────────────────────────────────────────────────────────────
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFile(file);
    setImportSheets([]);
    setSelectedSheets([]);
    setImportResult(null);
    setImportError('');
    setLoadingSheets(true);
    try {
      const sheets = await importApi.getSheets(file);
      setImportSheets(sheets);
      setSelectedSheets(sheets);
    } catch (err: any) {
      setImportError(err.message || 'Erreur de lecture du fichier');
    } finally {
      setLoadingSheets(false);
    }
  };

  const toggleSheet = (name: string) =>
    setSelectedSheets((prev) => prev.includes(name) ? prev.filter((s) => s !== name) : [...prev, name]);

  const handleImport = async () => {
    if (!importFile || !importForm.project_id) return;
    setImporting(true);
    setImportError('');
    setImportResult(null);
    try {
      const result = await importApi.importOkr({
        file: importFile,
        project_id:  importForm.project_id,
        fiscal_year: importForm.fiscal_year ? parseInt(importForm.fiscal_year) : undefined,
        quarter:     importForm.quarter || undefined,
        sheets:      selectedSheets.length ? selectedSheets : undefined,
        overwrite:   importForm.overwrite,
      });
      setImportResult(result);
      load();
    } catch (err: any) {
      setImportError(err.message || "Erreur lors de l'import");
    } finally {
      setImporting(false);
    }
  };

  const closeImport = () => { setShowImport(false); setImportFile(null); setImportSheets([]); setImportResult(null); setImportError(''); };

  // ── Groupement par Pilier ─────────────────────────────────────────────────────
  const pillarMap = new Map<string | null, ORC[]>();
  orcs.forEach((o) => {
    const key = o.pillar_id || null;
    if (!pillarMap.has(key)) pillarMap.set(key, []);
    pillarMap.get(key)!.push(o);
  });

  return (
    <div>
      {/* Toolbar */}
      <div className={styles.filterBar}>
        <div className={styles.filterItem}>
          <select className={styles.formSelect} value={filterProject} onChange={(e) => setFilterProject(e.target.value)}>
            <option value="">Tous projets</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div className={styles.filterItem}>
          <select className={styles.formSelect} value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            <option value="">Tous types</option>
            <option value="OBJECTIF">Objectifs</option>
            <option value="RESULTAT_CLE">Résultats Clés</option>
          </select>
        </div>
        <div className={styles.filterItem}>
          <select className={styles.formSelect} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">Tous statuts</option>
            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{ORC_STATUS_LABELS[s]}</option>)}
          </select>
        </div>
        <div className={styles.filterItem}>
          <select className={styles.formSelect} value={filterYear} onChange={(e) => setFilterYear(e.target.value)}>
            <option value="">Toutes années</option>
            {YEARS.map((y) => <option key={y} value={String(y)}>FY{y}</option>)}
          </select>
        </div>
        <div className={styles.filterItem}>
          <select className={styles.formSelect} value={filterQuarter} onChange={(e) => setFilterQuarter(e.target.value)}>
            <option value="">Tous trimestres</option>
            {QUARTER_OPTIONS.map((q) => <option key={q} value={q}>{QUARTER_LABELS[q]}</option>)}
          </select>
        </div>
        <Button size="sm" variant="outline" onClick={() => setShowImport(true)}>
          <FileSpreadsheet size={15} /> Importer Excel
        </Button>
        <Button size="sm" onClick={openCreate}>
          <Plus size={15} /> Nouvel ORC
        </Button>
      </div>

      {/* Liste */}
      {loading ? (
        <div className={styles.emptyState}><Spinner size="md" /></div>
      ) : orcs.length === 0 ? (
        <div className={styles.emptyState}>
          <Target size={40} className={styles.emptyStateIcon} />
          <span className={styles.emptyStateText}>Aucun ORC trouvé</span>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
            <Button size="sm" variant="outline" onClick={() => setShowImport(true)}><FileSpreadsheet size={14} /> Importer Excel</Button>
            <Button size="sm" onClick={openCreate}><Plus size={14} /> Créer le premier ORC</Button>
          </div>
        </div>
      ) : pillars.length > 0 ? (
        /* Vue groupée par Pilier */
        <div>
          {pillars.map((pillar) => {
            const pOrcs = pillarMap.get(pillar.id) || [];
            if (!pOrcs.length) return null;
            return (
              <motion.div key={pillar.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '1.5rem' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  background: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)',
                  color: 'white', borderRadius: '8px 8px 0 0',
                  padding: '0.6rem 1rem', marginBottom: '0.5rem',
                }}>
                  <Layers size={16} />
                  {pillar.code && <span style={{ fontWeight: 700, fontSize: '0.85rem', fontFamily: 'monospace', background: 'rgba(255,255,255,0.2)', padding: '1px 6px', borderRadius: 4 }}>{pillar.code}</span>}
                  <span style={{ fontWeight: 600, fontSize: '0.95rem', flex: 1 }}>{pillar.name}</span>
                  {pillar.fiscal_year && <span style={{ fontSize: '0.75rem', opacity: 0.85 }}>FY{pillar.fiscal_year}</span>}
                  <span style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.2)', borderRadius: 4, padding: '1px 6px' }}>
                    {pOrcs.length} ORC{pOrcs.length > 1 ? 's' : ''}
                  </span>
                </div>
                <div style={{ paddingLeft: '0.25rem' }}>
                  {pOrcs.map((o) => <ORCItem key={o.id} orc={o} depth={0} onEdit={openEdit} onDelete={handleDelete} onAddChild={openAddChild} />)}
                </div>
              </motion.div>
            );
          })}
          {(pillarMap.get(null) || []).length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600, marginBottom: '0.5rem' }}>Sans pilier</div>
              {(pillarMap.get(null) || []).map((o) => <ORCItem key={o.id} orc={o} depth={0} onEdit={openEdit} onDelete={handleDelete} onAddChild={openAddChild} />)}
            </motion.div>
          )}
        </div>
      ) : (
        /* Vue plate */
        <div>{orcs.map((o) => <ORCItem key={o.id} orc={o} depth={0} onEdit={openEdit} onDelete={handleDelete} onAddChild={openAddChild} />)}</div>
      )}

      {/* Modal ORC */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? "Modifier l'ORC" : 'Nouvel ORC'} size="lg"
        footer={
          <div className={styles.actionsRow}>
            <Button variant="outline" size="sm" onClick={() => setShowModal(false)}>Annuler</Button>
            <Button size="sm" onClick={handleSubmit} disabled={saving}>{saving ? <Spinner size="xs" /> : editing ? 'Enregistrer' : 'Créer'}</Button>
          </div>
        }
      >
        <div style={{ padding: '0.25rem 0' }}>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Projet *</label>
              <select className={styles.formSelect} value={form.project_id} onChange={f('project_id')}>
                <option value="">— Sélectionner —</option>
                {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Pilier stratégique</label>
              <select className={styles.formSelect} value={form.pillar_id} onChange={f('pillar_id')}>
                <option value="">— Aucun —</option>
                {pillars.filter((p) => !form.project_id || p.project_id === form.project_id).map((p) => (
                  <option key={p.id} value={p.id}>{p.code ? `${p.code} — ` : ''}{p.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Type</label>
              <select className={styles.formSelect} value={form.orc_type} onChange={f('orc_type')}>
                {ORC_TYPE_OPTIONS.map((t) => <option key={t} value={t}>{ORC_TYPE_LABELS[t]}</option>)}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Code OKR</label>
              <input className={styles.formInput} value={form.code} onChange={f('code')} placeholder="Ex: RC 1.1" />
            </div>
          </div>
          <div className={styles.formGroup} style={{ marginBottom: '0.75rem' }}>
            <label className={styles.formLabel}>Nom *</label>
            <input className={styles.formInput} value={form.name} onChange={f('name')} placeholder="Ex: Atteindre 80% de couverture vaccinale" />
          </div>
          <div className={styles.formGroup} style={{ marginBottom: '0.75rem' }}>
            <label className={styles.formLabel}>Indicateur cible</label>
            <input className={styles.formInput} value={form.target_indicator} onChange={f('target_indicator')} placeholder="Ex: % de ménages couverts par mois" />
          </div>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Statut</label>
              <select className={styles.formSelect} value={form.status} onChange={f('status')}>
                {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{ORC_STATUS_LABELS[s]}</option>)}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Priorité</label>
              <select className={styles.formSelect} value={form.priority} onChange={f('priority')}>
                {PRIORITY_OPTIONS.map((p) => <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>)}
              </select>
            </div>
          </div>
          <div className={`${styles.formRow} ${styles.triple}`}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Valeur cible</label>
              <input type="number" className={styles.formInput} value={form.target_value} onChange={f('target_value')} placeholder="Ex: 100" />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Valeur actuelle</label>
              <input type="number" className={styles.formInput} value={form.current_value} onChange={f('current_value')} placeholder="0" />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Unité</label>
              <input className={styles.formInput} value={form.unit} onChange={f('unit')} placeholder="%, nb, FCFA…" />
            </div>
          </div>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Année fiscale</label>
              <select className={styles.formSelect} value={form.fiscal_year} onChange={f('fiscal_year')}>
                <option value="">—</option>
                {YEARS.map((y) => <option key={y} value={String(y)}>FY{y}</option>)}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Trimestre</label>
              <select className={styles.formSelect} value={form.quarter} onChange={f('quarter')}>
                <option value="">—</option>
                {QUARTER_OPTIONS.map((q) => <option key={q} value={q}>{QUARTER_LABELS[q]}</option>)}
              </select>
            </div>
          </div>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Début</label>
              <input type="date" className={styles.formInput} value={form.start_date} onChange={f('start_date')} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Fin prévue</label>
              <input type="date" className={styles.formInput} value={form.end_date} onChange={f('end_date')} />
            </div>
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Notes</label>
            <textarea className={styles.formTextarea} value={form.notes} onChange={f('notes')} placeholder="Remarques…" />
          </div>
        </div>
      </Modal>

      {/* Modal Import Excel */}
      <Modal isOpen={showImport} onClose={closeImport} title="Importer des OKR depuis Excel" size="lg"
        footer={
          <div className={styles.actionsRow}>
            <Button variant="outline" size="sm" onClick={closeImport}>Fermer</Button>
            {importFile && !importResult && (
              <Button size="sm" onClick={handleImport} disabled={importing || !importForm.project_id}>
                {importing ? <Spinner size="xs" /> : <><Upload size={14} /> Lancer l'import</>}
              </Button>
            )}
          </div>
        }
      >
        <div style={{ padding: '0.25rem 0', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {importResult && (
            <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8, padding: '0.75rem 1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#065f46', fontWeight: 700, marginBottom: '0.5rem' }}>
                <CheckCircle2 size={18} /> {importResult.message}
              </div>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', fontSize: '0.85rem' }}>
                <span>🏛️ Piliers créés : <strong>{importResult.stats.pillars_created}</strong></span>
                <span>✅ ORCs créés : <strong>{importResult.stats.orcs_created}</strong></span>
                <span>🔄 ORCs mis à jour : <strong>{importResult.stats.orcs_updated}</strong></span>
              </div>
            </div>
          )}
          {importError && (
            <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: '0.75rem', color: '#991b1b', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 2 }} /> {importError}
            </div>
          )}

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Projet cible *</label>
              <select className={styles.formSelect} value={importForm.project_id} onChange={(e) => setImportForm((p) => ({ ...p, project_id: e.target.value }))}>
                <option value="">— Sélectionner —</option>
                {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Année fiscale</label>
              <select className={styles.formSelect} value={importForm.fiscal_year} onChange={(e) => setImportForm((p) => ({ ...p, fiscal_year: e.target.value }))}>
                {YEARS.map((y) => <option key={y} value={String(y)}>FY{y}</option>)}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Trimestre</label>
              <select className={styles.formSelect} value={importForm.quarter} onChange={(e) => setImportForm((p) => ({ ...p, quarter: e.target.value as Quarter | '' }))}>
                <option value="">—</option>
                {QUARTER_OPTIONS.map((q) => <option key={q} value={q}>{QUARTER_LABELS[q]}</option>)}
              </select>
            </div>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', cursor: 'pointer' }}>
            <input type="checkbox" checked={importForm.overwrite} onChange={(e) => setImportForm((p) => ({ ...p, overwrite: e.target.checked }))} />
            Mettre à jour les ORCs existants (même code + année + trimestre)
          </label>

          <div
            onClick={() => fileRef.current?.click()}
            style={{ border: '2px dashed #c7d2fe', borderRadius: 8, padding: '1.25rem', textAlign: 'center', cursor: 'pointer', background: '#fafafe' }}
          >
            <FileSpreadsheet size={28} style={{ color: '#6366f1', marginBottom: '0.4rem' }} />
            <div style={{ fontSize: '0.875rem', color: '#6366f1', fontWeight: 600 }}>
              {importFile ? importFile.name : 'Cliquer pour sélectionner un fichier .xlsx'}
            </div>
            {!importFile && (
              <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                Colonnes : Code | Priorité | Objectif/RC | Indicateur | Résultat | Score | Notes
              </div>
            )}
            <input ref={fileRef} type="file" accept=".xlsx,.xlsm" style={{ display: 'none' }} onChange={handleFileChange} />
          </div>

          {loadingSheets && <div style={{ textAlign: 'center' }}><Spinner size="sm" /></div>}

          {importSheets.length > 0 && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <label className={styles.formLabel} style={{ marginBottom: 0 }}>
                  Feuilles à importer ({selectedSheets.length}/{importSheets.length})
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button style={{ fontSize: '0.75rem', color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setSelectedSheets([...importSheets])}>Tout</button>
                  <button style={{ fontSize: '0.75rem', color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setSelectedSheets([])}>Aucun</button>
                </div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {importSheets.map((s) => {
                  const active = selectedSheets.includes(s);
                  return (
                    <label key={s} style={{
                      display: 'flex', alignItems: 'center', gap: '0.3rem',
                      padding: '0.25rem 0.6rem', borderRadius: 6, fontSize: '0.8rem', cursor: 'pointer', userSelect: 'none',
                      background: active ? '#eef2ff' : '#f8fafc',
                      border: `1px solid ${active ? '#6366f1' : '#e2e8f0'}`,
                      color: active ? '#4f46e5' : '#64748b',
                      fontWeight: active ? 600 : 400,
                    }}>
                      <input type="checkbox" checked={active} onChange={() => toggleSheet(s)} style={{ display: 'none' }} />
                      {active ? <CheckCircle2 size={12} /> : <X size={12} />} {s}
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
