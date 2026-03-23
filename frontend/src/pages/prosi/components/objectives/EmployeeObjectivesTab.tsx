import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Edit2, Trash2, Send, CheckCircle, XCircle, Award,
  Users, User, ChevronDown, ChevronRight, Target, TrendingUp,
  Clock, AlertTriangle, BarChart3,
} from 'lucide-react';
import { employeeObjectivesApi, projectsApi, orcsApi } from '../../api';
import { useAuthStore } from '@/stores/auth.store';
import type {
  EmployeeObjective, ObjectiveStatus, Priority, Project, ORC,
  Quarter, TeamSummary,
} from '../../types';
import {
  OBJECTIVE_STATUS_LABELS, OBJECTIVE_STATUS_VARIANT,
  PRIORITY_LABELS, PRIORITY_VARIANT,
  QUARTER_LABELS,
} from '../../types';
import { Button } from '@components/ui/Button/Button';
import { Badge } from '@components/ui/Badge/Badge';
import { Modal } from '@components/ui/Modal/Modal';
import { Spinner } from '@components/ui/Spinner/Spinner';
import styles from '../../Prosi.module.css';

// ─── Constantes ───────────────────────────────────────────────────────────────
const PRIORITY_OPTIONS: Priority[]         = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const QUARTER_OPTIONS: Quarter[]           = ['T1', 'T2', 'T3', 'T4'];
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 4 }, (_, i) => CURRENT_YEAR - 1 + i);

const EMPTY_FORM = {
  employee_id: '', user_id: '', project_id: '', orc_id: '',
  title: '', description: '', target_indicator: '',
  target_value: '', current_value: '0', unit: '',
  priority: 'MEDIUM' as Priority,
  fiscal_year: String(CURRENT_YEAR),
  quarter: 'T1' as Quarter,
  notes: '',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function scoreColor(score: number | null): string {
  if (score === null) return '#94a3b8';
  if (score >= 0.7) return '#10b981';
  if (score >= 0.4) return '#f59e0b';
  return '#ef4444';
}

function statusIcon(status: ObjectiveStatus) {
  switch (status) {
    case 'DRAFT':     return <Clock size={14} style={{ color: '#94a3b8' }} />;
    case 'SUBMITTED': return <Send size={14} style={{ color: '#f59e0b' }} />;
    case 'APPROVED':  return <CheckCircle size={14} style={{ color: '#10b981' }} />;
    case 'REJECTED':  return <XCircle size={14} style={{ color: '#ef4444' }} />;
    case 'COMPLETED': return <Award size={14} style={{ color: '#6366f1' }} />;
  }
}

// ─── Carte objectif ───────────────────────────────────────────────────────────
interface ObjCardProps {
  obj: EmployeeObjective;
  isManager: boolean;
  onEdit:     (o: EmployeeObjective) => void;
  onDelete:   (o: EmployeeObjective) => void;
  onSubmit:   (o: EmployeeObjective) => void;
  onReview:   (o: EmployeeObjective) => void;
  onComplete: (o: EmployeeObjective) => void;
}

function ObjectiveCard({ obj, isManager, onEdit, onDelete, onSubmit, onReview, onComplete }: ObjCardProps) {
  const [open, setOpen] = useState(false);
  const borderColor = {
    DRAFT: '#94a3b8', SUBMITTED: '#f59e0b',
    APPROVED: '#10b981', REJECTED: '#ef4444', COMPLETED: '#6366f1',
  }[obj.status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        border: `1px solid #e2e8f0`,
        borderLeft: `4px solid ${borderColor}`,
        borderRadius: 8,
        background: 'white',
        marginBottom: '0.625rem',
        overflow: 'hidden',
      }}
    >
      {/* En-tête */}
      <div
        style={{ padding: '0.75rem 1rem', cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}
        onClick={() => setOpen(!open)}
      >
        {/* Toggle */}
        <div style={{ marginTop: 2, flexShrink: 0, color: '#94a3b8' }}>
          {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </div>

        {/* Corps */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.3rem' }}>
            {statusIcon(obj.status)}
            <Badge variant={OBJECTIVE_STATUS_VARIANT[obj.status] as any} size="sm">
              {OBJECTIVE_STATUS_LABELS[obj.status]}
            </Badge>
            <Badge variant={PRIORITY_VARIANT[obj.priority] as any} size="sm">
              {PRIORITY_LABELS[obj.priority]}
            </Badge>
            <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600 }}>
              FY{obj.fiscal_year} · {obj.quarter}
            </span>
            {obj.project_name && (
              <span style={{ fontSize: '0.72rem', color: '#6366f1', background: '#eef2ff', borderRadius: 4, padding: '1px 5px' }}>
                {obj.project_name}
              </span>
            )}
          </div>

          <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#1e293b', marginBottom: '0.2rem' }}>
            {obj.title}
          </div>

          {obj.employee_name && (
            <div style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <User size={12} /> {obj.employee_name}
            </div>
          )}

          {/* Barre de progression */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.4rem' }}>
            <div className={styles.progressBar} style={{ flex: 1, maxWidth: 200 }}>
              <div
                className={`${styles.progressFill} ${obj.progress_percent >= 100 ? styles.done : obj.progress_percent >= 50 ? styles.medium : styles.low}`}
                style={{ width: `${obj.progress_percent}%` }}
              />
            </div>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#6366f1' }}>
              {obj.current_value}{obj.unit ? ` ${obj.unit}` : ''} / {obj.target_value ?? '?'}{obj.unit ? ` ${obj.unit}` : ''}
            </span>
            {obj.score !== null && (
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: scoreColor(obj.score) }}>
                Score : {Math.round(obj.score * 100)}%
              </span>
            )}
          </div>
        </div>

        {/* Actions rapides */}
        <div style={{ display: 'flex', gap: '0.25rem', flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
          {obj.status === 'DRAFT' && (
            <>
              <Button variant="ghost" size="sm" onClick={() => onEdit(obj)} title="Modifier"><Edit2 size={13} /></Button>
              <Button variant="ghost" size="sm" onClick={() => onSubmit(obj)} title="Soumettre pour validation">
                <Send size={13} style={{ color: '#f59e0b' }} />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => onDelete(obj)} title="Supprimer"><Trash2 size={13} /></Button>
            </>
          )}
          {obj.status === 'REJECTED' && (
            <>
              <Button variant="ghost" size="sm" onClick={() => onEdit(obj)} title="Corriger"><Edit2 size={13} /></Button>
              <Button variant="ghost" size="sm" onClick={() => onSubmit(obj)} title="Resoumettre">
                <Send size={13} style={{ color: '#f59e0b' }} />
              </Button>
            </>
          )}
          {obj.status === 'SUBMITTED' && isManager && (
            <Button variant="ghost" size="sm" onClick={() => onReview(obj)} title="Évaluer">
              <CheckCircle size={13} style={{ color: '#10b981' }} />
            </Button>
          )}
          {obj.status === 'APPROVED' && (
            <Button variant="ghost" size="sm" onClick={() => onComplete(obj)} title="Marquer complété">
              <Award size={13} style={{ color: '#6366f1' }} />
            </Button>
          )}
        </div>
      </div>

      {/* Détail déployable */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ borderTop: '1px solid #f1f5f9', padding: '0.75rem 1rem', background: '#fafafe' }}
          >
            {obj.target_indicator && (
              <div style={{ marginBottom: '0.5rem', fontSize: '0.82rem', color: '#475569' }}>
                <Target size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                <strong>Indicateur :</strong> {obj.target_indicator}
              </div>
            )}
            {obj.description && (
              <div style={{ marginBottom: '0.5rem', fontSize: '0.82rem', color: '#475569' }}>
                {obj.description}
              </div>
            )}
            {obj.orc_name && (
              <div style={{ marginBottom: '0.5rem', fontSize: '0.8rem', color: '#6366f1' }}>
                🎯 ORC lié : <strong>{obj.orc_name}</strong>
              </div>
            )}
            {obj.review_notes && (
              <div style={{
                marginTop: '0.5rem', padding: '0.5rem 0.75rem',
                background: obj.status === 'REJECTED' ? '#fef2f2' : '#f0fdf4',
                border: `1px solid ${obj.status === 'REJECTED' ? '#fca5a5' : '#86efac'}`,
                borderRadius: 6, fontSize: '0.8rem',
                color: obj.status === 'REJECTED' ? '#991b1b' : '#065f46',
              }}>
                <strong>{obj.reviewer_name || 'Manager'} :</strong> {obj.review_notes}
              </div>
            )}
            {obj.notes && (
              <div style={{ marginTop: '0.4rem', fontSize: '0.78rem', color: '#94a3b8', fontStyle: 'italic' }}>
                {obj.notes}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────
export function EmployeeObjectivesTab() {
  const currentUser = useAuthStore((s) => s.user);
  const [objectives, setObjectives] = useState<EmployeeObjective[]>([]);
  const [projects, setProjects]     = useState<Project[]>([]);
  const [orcs, setOrcs]             = useState<ORC[]>([]);
  const [teamSummary, setTeamSummary] = useState<TeamSummary | null>(null);
  const [loading, setLoading]       = useState(true);

  // Modes
  const [viewMode, setViewMode] = useState<'my' | 'team'>('my');
  const [showModal, setShowModal]         = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [editing, setEditing]             = useState<EmployeeObjective | null>(null);
  const [reviewing, setReviewing]         = useState<EmployeeObjective | null>(null);
  const [completing, setCompleting]       = useState<EmployeeObjective | null>(null);
  const [saving, setSaving]               = useState(false);

  // Formulaire principal
  const [form, setForm] = useState({ ...EMPTY_FORM });

  // Formulaire review
  const [reviewForm, setReviewForm] = useState({
    decision: 'APPROVED' as 'APPROVED' | 'REJECTED',
    review_notes: '',
    score: '',
    current_value: '',
  });

  // Formulaire complétion
  const [completeForm, setCompleteForm] = useState({ score: '', current_value: '' });

  // Filtres
  const [filterYear, setFilterYear]       = useState(String(CURRENT_YEAR));
  const [filterQuarter, setFilterQuarter] = useState<Quarter>('T1');
  const [filterStatus, setFilterStatus]   = useState('');
  const [filterEmployee, setFilterEmployee] = useState('');

  const load = async () => {
    setLoading(true);
    const params: Parameters<typeof employeeObjectivesApi.getAll>[0] = {
      fiscal_year: parseInt(filterYear),
      quarter: filterQuarter,
    };
    if (filterStatus) params.status = filterStatus;
    if (viewMode === 'my') {
      // Filtre sur l'employé connecté
      if (currentUser?.employee_id) params.employee_id = currentUser.employee_id;
      else if (currentUser?.id)     params.user_id     = currentUser.id;
    } else {
      if (filterEmployee) params.employee_id = filterEmployee;
      if (filterStatus === 'SUBMITTED') params.pending_review = true;
    }

    const [objRes, projRes] = await Promise.allSettled([
      employeeObjectivesApi.getAll(params),
      projectsApi.getAll(),
    ]);
    if (objRes.status  === 'fulfilled' && objRes.value.success)  setObjectives(objRes.value.data!);
    if (projRes.status === 'fulfilled' && projRes.value.success) setProjects(projRes.value.data!);

    // Résumé équipe
    const summaryRes = await employeeObjectivesApi.teamSummary(parseInt(filterYear), filterQuarter);
    if (summaryRes.success) setTeamSummary(summaryRes.data!);

    setLoading(false);
  };

  useEffect(() => { load(); }, [filterYear, filterQuarter, filterStatus, viewMode, filterEmployee]);

  useEffect(() => {
    if (form.project_id) {
      orcsApi.getAll({ project_id: form.project_id }).then((r) => { if (r.success) setOrcs(r.data!); });
    } else setOrcs([]);
  }, [form.project_id]);

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const openCreate = () => {
    setEditing(null);
    setForm({
      ...EMPTY_FORM,
      fiscal_year: filterYear,
      quarter: filterQuarter,
      employee_id: currentUser?.employee_id ?? '',
      user_id: currentUser?.id ?? '',
    });
    setShowModal(true);
  };
  const openEdit   = (o: EmployeeObjective) => {
    setEditing(o);
    setForm({
      employee_id: o.employee_id, user_id: o.user_id || '',
      project_id: o.project_id || '', orc_id: o.orc_id || '',
      title: o.title, description: o.description,
      target_indicator: o.target_indicator,
      target_value: o.target_value !== null ? String(o.target_value) : '',
      current_value: String(o.current_value), unit: o.unit,
      priority: o.priority, fiscal_year: String(o.fiscal_year),
      quarter: o.quarter, notes: o.notes,
    });
    setShowModal(true);
  };

  const handleSubmitForm = async () => {
    if (!form.title.trim() || !form.employee_id || !form.fiscal_year || !form.quarter) {
      if (!form.employee_id) alert('Votre compte n\'est pas lié à une fiche employé. Contactez un administrateur.');
      return;
    }
    setSaving(true);
    const payload = {
      ...form,
      project_id:    form.project_id || null,
      orc_id:        form.orc_id     || null,
      user_id:       form.user_id    || null,
      target_value:  form.target_value  ? parseFloat(form.target_value)  : null,
      current_value: form.current_value ? parseFloat(form.current_value) : 0,
      fiscal_year:   parseInt(form.fiscal_year),
    };
    const r = editing
      ? await employeeObjectivesApi.update(editing.id, payload)
      : await employeeObjectivesApi.create(payload);
    setSaving(false);
    if (r.success) { setShowModal(false); load(); }
  };

  const handleSubmitObjective = async (o: EmployeeObjective) => {
    await employeeObjectivesApi.submit(o.id);
    load();
  };

  const handleDelete = async (o: EmployeeObjective) => {
    if (!confirm(`Supprimer l'objectif "${o.title}" ?`)) return;
    await employeeObjectivesApi.delete(o.id);
    load();
  };

  const openReview = (o: EmployeeObjective) => {
    setReviewing(o);
    setReviewForm({ decision: 'APPROVED', review_notes: '', score: '', current_value: '' });
    setShowReviewModal(true);
  };

  const handleReview = async () => {
    if (!reviewing) return;
    setSaving(true);
    await employeeObjectivesApi.review(reviewing.id, {
      decision: reviewForm.decision,
      review_notes: reviewForm.review_notes,
      score: reviewForm.score ? parseFloat(reviewForm.score) : undefined,
      current_value: reviewForm.current_value ? parseFloat(reviewForm.current_value) : undefined,
    });
    setSaving(false);
    setShowReviewModal(false);
    load();
  };

  const openComplete = (o: EmployeeObjective) => {
    setCompleting(o);
    setCompleteForm({ score: o.score !== null ? String(o.score) : '', current_value: String(o.current_value) });
    setShowCompleteModal(true);
  };

  const handleComplete = async () => {
    if (!completing) return;
    setSaving(true);
    await employeeObjectivesApi.complete(completing.id, {
      score: completeForm.score ? parseFloat(completeForm.score) : undefined,
      current_value: completeForm.current_value ? parseFloat(completeForm.current_value) : undefined,
    });
    setSaving(false);
    setShowCompleteModal(false);
    load();
  };

  const f = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  // ── Groupement par employé (vue team) ──────────────────────────────────────
  const grouped = new Map<string, { name: string; items: EmployeeObjective[] }>();
  objectives.forEach((o) => {
    if (!grouped.has(o.employee_id)) {
      grouped.set(o.employee_id, { name: o.employee_name || o.employee_id, items: [] });
    }
    grouped.get(o.employee_id)!.items.push(o);
  });

  return (
    <div>
      {/* ── Résumé équipe ── */}
      {teamSummary && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}
        >
          {([
            { label: 'Total', value: teamSummary.total, color: '#6366f1', bg: '#eef2ff' },
            { label: 'Soumis', value: teamSummary.by_status.SUBMITTED, color: '#f59e0b', bg: '#fef9c3' },
            { label: 'Approuvés', value: teamSummary.by_status.APPROVED, color: '#10b981', bg: '#f0fdf4' },
            { label: 'Rejetés', value: teamSummary.by_status.REJECTED, color: '#ef4444', bg: '#fef2f2' },
            { label: 'Complétés', value: teamSummary.by_status.COMPLETED, color: '#8b5cf6', bg: '#f5f3ff' },
            { label: 'Score moy.', value: teamSummary.avg_score !== null ? `${Math.round(teamSummary.avg_score * 100)}%` : '—', color: '#0ea5e9', bg: '#f0f9ff' },
            { label: 'Taux', value: `${teamSummary.completion_rate}%`, color: '#64748b', bg: '#f8fafc' },
          ] as Array<{ label: string; value: number | string; color: string; bg: string }>).map((kpi) => (
            <div key={kpi.label} style={{ background: kpi.bg, border: `1px solid ${kpi.color}22`, borderRadius: 8, padding: '0.5rem 1rem', textAlign: 'center', minWidth: 80 }}>
              <div style={{ fontWeight: 800, fontSize: '1.2rem', color: kpi.color }}>{kpi.value}</div>
              <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{kpi.label}</div>
            </div>
          ))}
        </motion.div>
      )}

      {/* ── Toolbar ── */}
      <div className={styles.filterBar}>
        {/* Toggle vue */}
        <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: 6, padding: 2 }}>
          <button
            onClick={() => setViewMode('my')}
            style={{ padding: '0.3rem 0.75rem', borderRadius: 5, border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600,
              background: viewMode === 'my' ? 'white' : 'transparent',
              color: viewMode === 'my' ? '#6366f1' : '#64748b',
              boxShadow: viewMode === 'my' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
            }}
          >
            <User size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />Mes objectifs
          </button>
          <button
            onClick={() => setViewMode('team')}
            style={{ padding: '0.3rem 0.75rem', borderRadius: 5, border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600,
              background: viewMode === 'team' ? 'white' : 'transparent',
              color: viewMode === 'team' ? '#6366f1' : '#64748b',
              boxShadow: viewMode === 'team' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
            }}
          >
            <Users size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />Équipe
          </button>
        </div>

        <div className={styles.filterItem}>
          <select className={styles.formSelect} value={filterYear} onChange={(e) => setFilterYear(e.target.value)}>
            {YEARS.map((y) => <option key={y} value={String(y)}>FY{y}</option>)}
          </select>
        </div>
        <div className={styles.filterItem}>
          <select className={styles.formSelect} value={filterQuarter} onChange={(e) => setFilterQuarter(e.target.value as Quarter)}>
            {QUARTER_OPTIONS.map((q) => <option key={q} value={q}>{QUARTER_LABELS[q]}</option>)}
          </select>
        </div>
        <div className={styles.filterItem}>
          <select className={styles.formSelect} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">Tous statuts</option>
            {(['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'COMPLETED'] as ObjectiveStatus[]).map((s) => (
              <option key={s} value={s}>{OBJECTIVE_STATUS_LABELS[s]}</option>
            ))}
          </select>
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus size={14} /> Nouvel objectif
        </Button>
      </div>

      {/* ── Liste ── */}
      {loading ? (
        <div className={styles.emptyState}><Spinner size="md" /></div>
      ) : objectives.length === 0 ? (
        <div className={styles.emptyState}>
          <Target size={40} className={styles.emptyStateIcon} />
          <span className={styles.emptyStateText}>Aucun objectif pour {QUARTER_LABELS[filterQuarter]} FY{filterYear}</span>
          <Button size="sm" onClick={openCreate}><Plus size={14} /> Planifier mes objectifs</Button>
        </div>
      ) : viewMode === 'team' ? (
        /* Vue équipe — groupée par employé */
        <div>
          {Array.from(grouped.entries()).map(([empId, group]) => (
            <motion.div key={empId} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '1.5rem' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
                color: 'white', borderRadius: '8px 8px 0 0',
                padding: '0.5rem 0.875rem', marginBottom: '0.5rem',
              }}>
                <User size={15} />
                <span style={{ fontWeight: 700, fontSize: '0.9rem', flex: 1 }}>{group.name}</span>
                <span style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.2)', borderRadius: 4, padding: '1px 6px' }}>
                  {group.items.length} objectif{group.items.length > 1 ? 's' : ''}
                </span>
                {group.items.some((o) => o.status === 'SUBMITTED') && (
                  <span style={{ fontSize: '0.7rem', background: '#f59e0b', color: 'white', borderRadius: 4, padding: '1px 6px', fontWeight: 700 }}>
                    <AlertTriangle size={10} style={{ verticalAlign: 'middle', marginRight: 2 }} />
                    En attente
                  </span>
                )}
              </div>
              {group.items.map((o) => (
                <ObjectiveCard
                  key={o.id} obj={o} isManager={true}
                  onEdit={openEdit} onDelete={handleDelete}
                  onSubmit={handleSubmitObjective} onReview={openReview} onComplete={openComplete}
                />
              ))}
            </motion.div>
          ))}
        </div>
      ) : (
        /* Vue personnelle */
        <div>
          {objectives.map((o) => (
            <ObjectiveCard
              key={o.id} obj={o} isManager={false}
              onEdit={openEdit} onDelete={handleDelete}
              onSubmit={handleSubmitObjective} onReview={openReview} onComplete={openComplete}
            />
          ))}
        </div>
      )}

      {/* ── Modal Créer / Modifier ── */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)}
        title={editing ? 'Modifier l\'objectif' : 'Planifier un objectif trimestriel'}
        size="lg"
        footer={
          <div className={styles.actionsRow}>
            <Button variant="outline" size="sm" onClick={() => setShowModal(false)}>Annuler</Button>
            <Button size="sm" onClick={handleSubmitForm} disabled={saving}>
              {saving ? <Spinner size="xs" /> : editing ? 'Enregistrer' : 'Créer'}
            </Button>
          </div>
        }
      >
        <div style={{ padding: '0.25rem 0' }}>
          {/* Bandeau employé connecté */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            background: '#eef2ff', border: '1px solid #c7d2fe',
            borderRadius: 8, padding: '0.5rem 0.875rem',
            marginBottom: '1rem', fontSize: '0.85rem', color: '#4338ca',
          }}>
            <User size={15} />
            <span>Planification pour : <strong>{currentUser?.fullname || currentUser?.username}</strong></span>
            {!currentUser?.employee_id && (
              <span style={{ marginLeft: 'auto', color: '#ef4444', fontWeight: 600, fontSize: '0.78rem' }}>
                ⚠ Aucune fiche employé liée à ce compte
              </span>
            )}
          </div>

          <div className={styles.formGroup} style={{ marginBottom: '0.75rem' }}>
            <label className={styles.formLabel}>Titre de l'objectif *</label>
            <input className={styles.formInput} value={form.title} onChange={f('title')} placeholder="Ex: Augmenter le taux de visites à domicile de 20%" />
          </div>

          <div className={styles.formGroup} style={{ marginBottom: '0.75rem' }}>
            <label className={styles.formLabel}>Indicateur mesurable</label>
            <input className={styles.formInput} value={form.target_indicator} onChange={f('target_indicator')} placeholder="Ex: Nombre de visites / mois" />
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Projet lié</label>
              <select className={styles.formSelect} value={form.project_id} onChange={f('project_id')}>
                <option value="">— Aucun —</option>
                {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>ORC de référence</label>
              <select className={styles.formSelect} value={form.orc_id} onChange={f('orc_id')} disabled={!form.project_id}>
                <option value="">— Aucun —</option>
                {orcs.map((o) => <option key={o.id} value={o.id}>{o.code ? `${o.code} — ` : ''}{o.name}</option>)}
              </select>
            </div>
          </div>

          <div className={`${styles.formRow} ${styles.triple}`}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Valeur cible</label>
              <input type="number" className={styles.formInput} value={form.target_value} onChange={f('target_value')} placeholder="Ex: 100" />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Valeur initiale</label>
              <input type="number" className={styles.formInput} value={form.current_value} onChange={f('current_value')} placeholder="0" />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Unité</label>
              <input className={styles.formInput} value={form.unit} onChange={f('unit')} placeholder="visites, %, FCFA…" />
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Priorité</label>
              <select className={styles.formSelect} value={form.priority} onChange={f('priority')}>
                {PRIORITY_OPTIONS.map((p) => <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>)}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Année fiscale</label>
              <select className={styles.formSelect} value={form.fiscal_year} onChange={f('fiscal_year')}>
                {YEARS.map((y) => <option key={y} value={String(y)}>FY{y}</option>)}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Trimestre</label>
              <select className={styles.formSelect} value={form.quarter} onChange={f('quarter')}>
                {QUARTER_OPTIONS.map((q) => <option key={q} value={q}>{QUARTER_LABELS[q]}</option>)}
              </select>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Description / Plan d'action</label>
            <textarea className={styles.formTextarea} value={form.description} onChange={f('description')} placeholder="Décrivez comment vous comptez atteindre cet objectif…" />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Notes</label>
            <textarea className={styles.formTextarea} value={form.notes} onChange={f('notes')} style={{ minHeight: 50 }} />
          </div>
        </div>
      </Modal>

      {/* ── Modal Évaluation manager ── */}
      <Modal isOpen={showReviewModal} onClose={() => setShowReviewModal(false)}
        title={`Évaluer : ${reviewing?.title || ''}`} size="md"
        footer={
          <div className={styles.actionsRow}>
            <Button variant="outline" size="sm" onClick={() => setShowReviewModal(false)}>Annuler</Button>
            <Button
              size="sm"
              onClick={handleReview}
              disabled={saving}
              style={{ background: reviewForm.decision === 'APPROVED' ? '#10b981' : '#ef4444' }}
            >
              {saving ? <Spinner size="xs" /> : reviewForm.decision === 'APPROVED' ? <><CheckCircle size={14} /> Approuver</> : <><XCircle size={14} /> Rejeter</>}
            </Button>
          </div>
        }
      >
        <div style={{ padding: '0.25rem 0', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          {/* Toggle Approuver / Rejeter */}
          <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: 8, padding: 3 }}>
            <button
              onClick={() => setReviewForm((p) => ({ ...p, decision: 'APPROVED' }))}
              style={{ flex: 1, padding: '0.5rem', borderRadius: 6, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.875rem',
                background: reviewForm.decision === 'APPROVED' ? '#10b981' : 'transparent',
                color: reviewForm.decision === 'APPROVED' ? 'white' : '#64748b',
              }}
            >
              <CheckCircle size={15} style={{ verticalAlign: 'middle', marginRight: 5 }} />Approuver
            </button>
            <button
              onClick={() => setReviewForm((p) => ({ ...p, decision: 'REJECTED' }))}
              style={{ flex: 1, padding: '0.5rem', borderRadius: 6, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.875rem',
                background: reviewForm.decision === 'REJECTED' ? '#ef4444' : 'transparent',
                color: reviewForm.decision === 'REJECTED' ? 'white' : '#64748b',
              }}
            >
              <XCircle size={15} style={{ verticalAlign: 'middle', marginRight: 5 }} />Rejeter
            </button>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Score (0.00 – 1.00)</label>
              <input type="number" min="0" max="1" step="0.01" className={styles.formInput}
                value={reviewForm.score} onChange={(e) => setReviewForm((p) => ({ ...p, score: e.target.value }))}
                placeholder="Ex: 0.85"
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Valeur réalisée</label>
              <input type="number" className={styles.formInput}
                value={reviewForm.current_value} onChange={(e) => setReviewForm((p) => ({ ...p, current_value: e.target.value }))}
                placeholder={reviewing?.unit || ''}
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Commentaire {reviewForm.decision === 'REJECTED' ? '(requis)' : ''}</label>
            <textarea className={styles.formTextarea}
              value={reviewForm.review_notes}
              onChange={(e) => setReviewForm((p) => ({ ...p, review_notes: e.target.value }))}
              placeholder={reviewForm.decision === 'APPROVED' ? 'Félicitations, bon travail…' : 'Expliquez pourquoi cet objectif est rejeté et ce qui doit être corrigé…'}
              style={{ minHeight: 70 }}
            />
          </div>
        </div>
      </Modal>

      {/* ── Modal Complétion ── */}
      <Modal isOpen={showCompleteModal} onClose={() => setShowCompleteModal(false)}
        title={`Clôturer : ${completing?.title || ''}`} size="sm"
        footer={
          <div className={styles.actionsRow}>
            <Button variant="outline" size="sm" onClick={() => setShowCompleteModal(false)}>Annuler</Button>
            <Button size="sm" onClick={handleComplete} disabled={saving}>
              {saving ? <Spinner size="xs" /> : <><Award size={14} /> Clôturer</>}
            </Button>
          </div>
        }
      >
        <div style={{ padding: '0.25rem 0', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Score final (0.00 – 1.00)</label>
              <input type="number" min="0" max="1" step="0.01" className={styles.formInput}
                value={completeForm.score} onChange={(e) => setCompleteForm((p) => ({ ...p, score: e.target.value }))}
                placeholder="Ex: 0.90"
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Valeur finale atteinte</label>
              <input type="number" className={styles.formInput}
                value={completeForm.current_value} onChange={(e) => setCompleteForm((p) => ({ ...p, current_value: e.target.value }))}
                placeholder={completing?.unit || ''}
              />
            </div>
          </div>
          {completeForm.score && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: scoreColor(parseFloat(completeForm.score)) }}>
                {Math.round(parseFloat(completeForm.score) * 100)}%
              </div>
              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Score de réalisation</div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
