import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, Target, ChevronRight, ChevronDown, Crosshair, KeyRound } from 'lucide-react';
import { orcsApi, projectsApi } from '../../api';
import type { ORC, OrcType, ORCStatus, Project } from '../../types';
import { ORC_STATUS_LABELS, ORC_STATUS_VARIANT, ORC_TYPE_LABELS } from '../../types';
import { Button } from '@components/ui/Button/Button';
import { Badge } from '@components/ui/Badge/Badge';
import { Modal } from '@components/ui/Modal/Modal';
import { Spinner } from '@components/ui/Spinner/Spinner';
import styles from '../../Prosi.module.css';

const STATUS_OPTIONS: ORCStatus[] = ['DRAFT', 'ACTIVE', 'AT_RISK', 'COMPLETED', 'CANCELLED'];

const EMPTY_FORM = {
  name: '', description: '', project_id: '', parent_id: '',
  orc_type: 'OBJECTIF' as OrcType,
  target_value: '', current_value: '', unit: '%',
  status: 'DRAFT' as ORCStatus, weight: '1',
  start_date: '', end_date: '', notes: '',
};

export function ORCsTab() {
  const [orcs, setOrcs] = useState<ORC[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<ORC | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [filterProject, setFilterProject] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const load = () => {
    setLoading(true);
    Promise.allSettled([
      orcsApi.getAll({ project_id: filterProject || undefined, status: filterStatus || undefined, orc_type: filterType || undefined, root_only: true }),
      projectsApi.getAll({ active: true }),
    ]).then(([orcsRes, projRes]) => {
      if (orcsRes.status === 'fulfilled' && orcsRes.value.success) setOrcs(orcsRes.value.data!);
      if (projRes.status === 'fulfilled' && projRes.value.success)  setProjects(projRes.value.data!);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filterProject, filterStatus, filterType]);

  const openCreate = (parent?: ORC) => {
    setEditing(null);
    setForm({
      ...EMPTY_FORM,
      parent_id: parent?.id || '',
      project_id: parent?.project_id || '',
      orc_type: parent ? 'RESULTAT_CLE' : 'OBJECTIF',
    });
    setShowModal(true);
  };
  const openEdit = (o: ORC) => {
    setEditing(o);
    setForm({
      name: o.name, description: o.description,
      project_id: o.project_id, parent_id: o.parent_id || '',
      orc_type: o.orc_type,
      target_value: o.target_value != null ? String(o.target_value) : '',
      current_value: String(o.current_value),
      unit: o.unit, status: o.status,
      weight: String(o.weight),
      start_date: o.start_date || '', end_date: o.end_date || '',
      notes: o.notes,
    });
    setShowModal(true);
  };

  const handleDelete = async (o: ORC) => {
    if (!confirm(`Supprimer l'ORC "${o.name}" ?`)) return;
    await orcsApi.delete(o.id);
    load();
  };

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.project_id) return;
    setSaving(true);
    const payload = {
      ...form,
      target_value: form.target_value ? parseFloat(form.target_value) : null,
      current_value: form.current_value ? parseFloat(form.current_value) : 0,
      weight: parseFloat(form.weight) || 1,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      parent_id: form.parent_id || null,
    };
    const r = editing
      ? await orcsApi.update(editing.id, payload)
      : await orcsApi.create(payload);
    setSaving(false);
    if (r.success) { setShowModal(false); load(); }
  };

  const f = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const toggleExpand = (id: string) =>
    setExpanded((prev) => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });

  return (
    <div>
      {/* Toolbar */}
      <div className={styles.filterBar}>
        <div className={styles.filterItem}>
          <select className={styles.formSelect} value={filterProject} onChange={(e) => setFilterProject(e.target.value)}>
            <option value="">Tous les projets</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div className={styles.filterItem}>
          <select className={styles.formSelect} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">Tous les statuts</option>
            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{ORC_STATUS_LABELS[s]}</option>)}
          </select>
        </div>
        <div className={styles.filterItem}>
          <select className={styles.formSelect} value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            <option value="">Tous les types</option>
            <option value="OBJECTIF">Objectifs</option>
            <option value="RESULTAT_CLE">Résultats Clés</option>
          </select>
        </div>
        <Button size="sm" onClick={() => openCreate()}>
          <Plus size={16} /> Nouvel ORC
        </Button>
      </div>

      {loading ? (
        <div className={styles.emptyState}><Spinner size="md" /></div>
      ) : orcs.length === 0 ? (
        <div className={styles.emptyState}>
          <Target size={40} className={styles.emptyStateIcon} />
          <span className={styles.emptyStateText}>Aucun ORC défini</span>
          <Button size="sm" onClick={() => openCreate()}><Plus size={14} /> Créer le premier ORC</Button>
        </div>
      ) : (
        <div>
          <AnimatePresence>
            {orcs.map((orc, i) => (
              <motion.div key={orc.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <ORCItem
                  orc={orc}
                  expanded={expanded}
                  onToggle={toggleExpand}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                  onAddChild={openCreate}
                  depth={0}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editing ? 'Modifier l\'ORC' : 'Nouvel ORC'}
        size="lg"
        footer={
          <div className={styles.actionsRow}>
            <Button variant="outline" size="sm" onClick={() => setShowModal(false)}>Annuler</Button>
            <Button size="sm" onClick={handleSubmit} disabled={saving}>
              {saving ? <Spinner size="sm" /> : editing ? 'Enregistrer' : 'Créer'}
            </Button>
          </div>
        }
      >
        <div style={{ padding: '0.5rem 0' }}>
          <div className={styles.formGroup} style={{ marginBottom: '0.875rem' }}>
            <label className={styles.formLabel}>Projet *</label>
            <select className={styles.formSelect} value={form.project_id} onChange={f('project_id')} disabled={!!editing}>
              <option value="">— Sélectionner un projet —</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          <div className={styles.formRow} style={{ marginBottom: '0.875rem' }}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Type *</label>
              <select className={styles.formSelect} value={form.orc_type} onChange={f('orc_type')}>
                <option value="OBJECTIF">🎯 Objectif</option>
                <option value="RESULTAT_CLE">🔑 Résultat Clé</option>
              </select>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Statut</label>
              <select className={styles.formSelect} value={form.status} onChange={f('status')}>
                {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{ORC_STATUS_LABELS[s]}</option>)}
              </select>
            </div>
          </div>

          <div className={styles.formGroup} style={{ marginBottom: '0.875rem' }}>
            <label className={styles.formLabel}>Nom *</label>
            <input className={styles.formInput} value={form.name} onChange={f('name')} placeholder="Ex: Augmenter la couverture vaccinale" />
          </div>

          <div className={styles.formGroup} style={{ marginBottom: '0.875rem' }}>
            <label className={styles.formLabel}>Description</label>
            <textarea className={styles.formTextarea} value={form.description} onChange={f('description')} placeholder="Décrivez l'objectif..." />
          </div>

          <div className={`${styles.formRow} ${styles.triple}`}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Valeur cible</label>
              <input type="number" className={styles.formInput} value={form.target_value} onChange={f('target_value')} placeholder="100" />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Valeur actuelle</label>
              <input type="number" className={styles.formInput} value={form.current_value} onChange={f('current_value')} placeholder="0" />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Unité</label>
              <input className={styles.formInput} value={form.unit} onChange={f('unit')} placeholder="%, nb, km…" />
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Pondération</label>
              <input type="number" step="0.1" min="0.1" className={styles.formInput} value={form.weight} onChange={f('weight')} placeholder="1" />
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Date de début</label>
              <input type="date" className={styles.formInput} value={form.start_date} onChange={f('start_date')} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Date de fin</label>
              <input type="date" className={styles.formInput} value={form.end_date} onChange={f('end_date')} />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Notes</label>
            <textarea className={styles.formTextarea} value={form.notes} onChange={f('notes')} placeholder="Notes..." />
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ─── Composant récursif ORC item ───────────────────────────────────────────────

function ORCItem({
  orc, expanded, onToggle, onEdit, onDelete, onAddChild, depth,
}: {
  orc: ORC;
  expanded: Set<string>;
  onToggle: (id: string) => void;
  onEdit: (o: ORC) => void;
  onDelete: (o: ORC) => void;
  onAddChild: (parent: ORC) => void;
  depth: number;
}) {
  const hasChildren = (orc.children?.length || 0) > 0;
  const isExpanded = expanded.has(orc.id);
  const isObjectif = orc.orc_type === 'OBJECTIF';
  const progressColor =
    orc.progress_percent >= 80 ? styles.done :
    orc.progress_percent >= 50 ? styles.medium :
    orc.status === 'AT_RISK'   ? styles.risk  : styles.low;

  const cardClass = [
    styles.orcCard,
    isObjectif ? styles.objectif : styles.resultatCle,
  ].join(' ');

  const typeTagClass = [
    styles.orcTypeTag,
    isObjectif ? styles.objectif : styles.resultatCle,
  ].join(' ');

  const TypeIcon = isObjectif ? Crosshair : KeyRound;
  const chevronColor = isObjectif ? '#7c3aed' : '#2563eb';

  return (
    <div className={cardClass} style={{ marginLeft: depth * 24 }}>
      <div className={styles.orcCardHeader}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
          {hasChildren && (
            <button
              onClick={() => onToggle(orc.id)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', color: chevronColor }}
            >
              {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
          )}
          {!hasChildren && <div style={{ width: 16 }} />}
          <TypeIcon size={14} style={{ color: chevronColor, flexShrink: 0 }} />
          <span className={styles.orcName}>{orc.name}</span>
          {orc.project_name && <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>· {orc.project_name}</span>}
        </div>
        <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center' }}>
          <span className={typeTagClass}>{ORC_TYPE_LABELS[orc.orc_type]}</span>
          <Badge variant={ORC_STATUS_VARIANT[orc.status] as any} size="sm">{ORC_STATUS_LABELS[orc.status]}</Badge>
          <Button variant="ghost" size="sm" onClick={() => onAddChild(orc)} title="Ajouter un Résultat Clé"><Plus size={13} /></Button>
          <Button variant="ghost" size="sm" onClick={() => onEdit(orc)} title="Modifier"><Edit2 size={13} /></Button>
          <Button variant="ghost" size="sm" onClick={() => onDelete(orc)} title="Supprimer"><Trash2 size={13} /></Button>
        </div>
      </div>

      {orc.description && (
        <p style={{ fontSize: '0.8125rem', color: '#64748b', marginBottom: '0.5rem' }}>{orc.description}</p>
      )}

      <div className={styles.orcProgress}>
        <div className={styles.orcProgressLabel}>
          <span>
            {orc.current_value} / {orc.target_value ?? '—'} {orc.unit}
          </span>
          <span style={{ fontWeight: 600, color: orc.progress_percent >= 80 ? '#10b981' : orc.status === 'AT_RISK' ? '#f59e0b' : '#6366f1' }}>
            {orc.progress_percent}%
          </span>
        </div>
        <div className={styles.progressBar}>
          <div className={`${styles.progressFill} ${progressColor}`} style={{ width: `${orc.progress_percent}%` }} />
        </div>
      </div>

      {/* Children */}
      <AnimatePresence>
        {isExpanded && hasChildren && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={styles.orcChildren}
          >
            {orc.children!.map((child) => (
              <ORCItem
                key={child.id}
                orc={child}
                expanded={expanded}
                onToggle={onToggle}
                onEdit={onEdit}
                onDelete={onDelete}
                onAddChild={onAddChild}
                depth={depth + 1}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
