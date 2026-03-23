import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, FolderKanban, Calendar, User } from 'lucide-react';
import { projectsApi } from '../../api';
import type { Project, ProjectStatus, Priority } from '../../types';
import {
  PROJECT_STATUS_LABELS, PROJECT_STATUS_VARIANT,
  PRIORITY_LABELS, PRIORITY_VARIANT,
} from '../../types';
import { Button } from '@components/ui/Button/Button';
import { Badge } from '@components/ui/Badge/Badge';
import { Modal } from '@components/ui/Modal/Modal';
import { Spinner } from '@components/ui/Spinner/Spinner';
import styles from '../../Prosi.module.css';

const STATUS_OPTIONS: ProjectStatus[] = ['DRAFT', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED'];
const PRIORITY_OPTIONS: Priority[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const PROJECT_CARD_CLASS: Record<string, string> = {
  DRAFT: '', ACTIVE: styles.active, ON_HOLD: styles.onHold,
  COMPLETED: styles.completed, CANCELLED: styles.cancelled,
};

const EMPTY_FORM = {
  name: '', code: '', description: '', start_date: '', end_date: '',
  status: 'DRAFT' as ProjectStatus, priority: 'MEDIUM' as Priority,
  budget: '', budget_currency: 'XOF', notes: '',
};

export function ProjectsTab() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [search, setSearch] = useState('');

  const load = () => {
    setLoading(true);
    projectsApi.getAll({ status: filterStatus || undefined, priority: filterPriority || undefined, search: search || undefined })
      .then((r) => { if (r.success) setProjects(r.data!); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filterStatus, filterPriority, search]);

  const openCreate = () => { setEditing(null); setForm({ ...EMPTY_FORM }); setShowModal(true); };
  const openEdit = (p: Project) => {
    setEditing(p);
    setForm({
      name: p.name, code: p.code, description: p.description,
      start_date: p.start_date || '', end_date: p.end_date || '',
      status: p.status, priority: p.priority,
      budget: p.budget != null ? String(p.budget) : '',
      budget_currency: p.budget_currency, notes: p.notes,
    });
    setShowModal(true);
  };

  const handleDelete = async (p: Project) => {
    if (!confirm(`Supprimer le projet "${p.name}" ?`)) return;
    await projectsApi.delete(p.id);
    load();
  };

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.code.trim()) return;
    setSaving(true);
    const payload = {
      ...form,
      budget: form.budget ? parseFloat(form.budget) : null,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
    };
    const r = editing
      ? await projectsApi.update(editing.id, payload)
      : await projectsApi.create(payload);
    setSaving(false);
    if (r.success) { setShowModal(false); load(); }
  };

  const f = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  return (
    <div>
      {/* Toolbar */}
      <div className={styles.filterBar}>
        <div className={styles.filterItem}>
          <input
            className={styles.formInput}
            placeholder="Rechercher un projet..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className={styles.filterItem}>
          <select className={styles.formSelect} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">Tous les statuts</option>
            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{PROJECT_STATUS_LABELS[s]}</option>)}
          </select>
        </div>
        <div className={styles.filterItem}>
          <select className={styles.formSelect} value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
            <option value="">Toutes priorités</option>
            {PRIORITY_OPTIONS.map((p) => <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>)}
          </select>
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus size={16} /> Nouveau projet
        </Button>
      </div>

      {/* Content */}
      {loading ? (
        <div className={styles.emptyState}><Spinner size="md" /></div>
      ) : projects.length === 0 ? (
        <div className={styles.emptyState}>
          <FolderKanban size={40} className={styles.emptyStateIcon} />
          <span className={styles.emptyStateText}>Aucun projet trouvé</span>
          <Button size="sm" onClick={openCreate}><Plus size={14} /> Créer le premier projet</Button>
        </div>
      ) : (
        <div className={styles.projectsGrid}>
          <AnimatePresence>
            {projects.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.05 }}
                className={`${styles.projectCard} ${PROJECT_CARD_CLASS[p.status] || ''}`}
              >
                <div className={styles.projectCardHeader}>
                  <span className={styles.projectCode}>{p.code}</span>
                  <div className={styles.actionsRow}>
                    <Button variant="ghost" size="sm" onClick={() => openEdit(p)} title="Modifier">
                      <Edit2 size={14} />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(p)} title="Supprimer">
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>

                <div className={styles.projectName}>{p.name}</div>
                {p.description && <div className={styles.projectDesc}>{p.description}</div>}

                <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                  <Badge variant={PROJECT_STATUS_VARIANT[p.status] as any} size="sm">
                    {PROJECT_STATUS_LABELS[p.status]}
                  </Badge>
                  <Badge variant={PRIORITY_VARIANT[p.priority] as any} size="sm">
                    {PRIORITY_LABELS[p.priority]}
                  </Badge>
                </div>

                <div className={styles.projectMeta}>
                  {p.start_date && (
                    <span className={styles.projectMetaItem}>
                      <Calendar size={12} />
                      {new Date(p.start_date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                  )}
                  {p.end_date && (
                    <span className={styles.projectMetaItem}>
                      → {new Date(p.end_date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                  )}
                  {p.owner_name && (
                    <span className={styles.projectMetaItem}>
                      <User size={12} /> {p.owner_name}
                    </span>
                  )}
                  {p.budget != null && (
                    <span className={styles.projectMetaItem}>
                      {p.budget.toLocaleString('fr-FR')} {p.budget_currency}
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editing ? 'Modifier le projet' : 'Nouveau projet'}
        size="lg"
        footer={
          <div className={styles.actionsRow}>
            <Button variant="outline" size="sm" onClick={() => setShowModal(false)}>Annuler</Button>
            <Button size="sm" onClick={handleSubmit} disabled={saving}>
              {saving ? <Spinner size="xs" /> : editing ? 'Enregistrer' : 'Créer'}
            </Button>
          </div>
        }
      >
        <div style={{ padding: '0.5rem 0' }}>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Nom *</label>
              <input className={styles.formInput} value={form.name} onChange={f('name')} placeholder="Nom du projet" />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Code *</label>
              <input className={styles.formInput} value={form.code} onChange={f('code')} placeholder="CODE" style={{ textTransform: 'uppercase' }} />
            </div>
          </div>

          <div className={styles.formGroup} style={{ marginBottom: '0.875rem' }}>
            <label className={styles.formLabel}>Description</label>
            <textarea className={styles.formTextarea} value={form.description} onChange={f('description')} placeholder="Description du projet..." />
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Statut</label>
              <select className={styles.formSelect} value={form.status} onChange={f('status')}>
                {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{PROJECT_STATUS_LABELS[s]}</option>)}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Priorité</label>
              <select className={styles.formSelect} value={form.priority} onChange={f('priority')}>
                {PRIORITY_OPTIONS.map((p) => <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>)}
              </select>
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

          <div className={`${styles.formRow} ${styles.triple}`}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Budget</label>
              <input type="number" className={styles.formInput} value={form.budget} onChange={f('budget')} placeholder="0" />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Devise</label>
              <select className={styles.formSelect} value={form.budget_currency} onChange={f('budget_currency')}>
                {['XOF', 'EUR', 'USD', 'GNF', 'XAF'].map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
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
