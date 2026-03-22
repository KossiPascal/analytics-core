import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Edit2, Trash2, ListChecks, TrendingUp, AlertCircle,
  X, LayoutList, Kanban, ChevronDown, ChevronRight,
  Calendar, User, FolderOpen, Target, Tag, Clock,
  BarChart2,
} from 'lucide-react';
import { activitiesApi, projectsApi, orcsApi } from '../../api';
import type { Activity, ActivityStatus, Priority, Project, ORC, ProgressLog } from '../../types';
import {
  ACTIVITY_STATUS_LABELS, ACTIVITY_STATUS_VARIANT,
  PRIORITY_LABELS, PRIORITY_VARIANT,
} from '../../types';
import { Button } from '@components/ui/Button/Button';
import { Badge } from '@components/ui/Badge/Badge';
import { Modal } from '@components/ui/Modal/Modal';
import { Spinner } from '@components/ui/Spinner/Spinner';
import { BoardView }    from './BoardView';
import { CalendarView } from './CalendarView';
import { GanttView }    from './GanttView';
import { TimelineView } from './TimelineView';
import styles from '../../Prosi.module.css';

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_OPTIONS: ActivityStatus[] = ['TODO', 'IN_PROGRESS', 'DONE', 'BLOCKED', 'CANCELLED'];
const PRIORITY_OPTIONS: Priority[]     = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

const STATUS_COLORS: Record<ActivityStatus, string> = {
  TODO: '#94a3b8', IN_PROGRESS: '#6366f1', DONE: '#10b981', BLOCKED: '#ef4444', CANCELLED: '#cbd5e1',
};

const PRIORITY_ROW_CLASS: Record<Priority, string> = {
  LOW:      styles.priorityLow,
  MEDIUM:   styles.priorityMedium,
  HIGH:     styles.priorityHigh,
  CRITICAL: styles.priorityCritical,
};

function initials(name: string | null) {
  if (!name) return '?';
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

const EMPTY_FORM = {
  name: '', description: '', project_id: '', orc_id: '',
  start_date: '', end_date: '', due_date: '',
  status: 'TODO' as ActivityStatus, priority: 'MEDIUM' as Priority,
  progress: '0', notes: '', tags: '',
};

type ViewMode = 'list' | 'board' | 'calendar' | 'gantt' | 'timeline';

// ─── Component ────────────────────────────────────────────────────────────────

export function ActivitiesTab() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [projects, setProjects]     = useState<Project[]>([]);
  const [orcs, setOrcs]             = useState<ORC[]>([]);
  const [loading, setLoading]       = useState(true);
  const [view, setView]             = useState<ViewMode>('list');

  // Edit modal
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing]     = useState<Activity | null>(null);
  const [form, setForm]           = useState({ ...EMPTY_FORM });
  const [saving, setSaving]       = useState(false);

  // Progress modal
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [progressActivity, setProgressActivity]   = useState<Activity | null>(null);
  const [progressForm, setProgressForm]           = useState({ progress_percent: 0, notes: '' });

  // Detail panel
  const [detailTask, setDetailTask]   = useState<Activity | null>(null);
  const [detailFull, setDetailFull]   = useState<Activity | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Filters
  const [filterProject, setFilterProject]   = useState('');
  const [filterStatus, setFilterStatus]     = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterOverdue, setFilterOverdue]   = useState(false);
  const [search, setSearch]                 = useState('');
  const [searchInput, setSearchInput]       = useState('');
  const searchTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Collapsible sections in list view
  const [collapsed, setCollapsed] = useState<Set<ActivityStatus>>(new Set(['CANCELLED']));

  // ── Load ──────────────────────────────────────────────────────────────────

  const load = () => {
    setLoading(true);
    Promise.allSettled([
      activitiesApi.getAll({
        project_id: filterProject || undefined,
        status:     filterStatus  || undefined,
        priority:   filterPriority || undefined,
        search:     search || undefined,
        overdue:    filterOverdue || undefined,
      }),
      projectsApi.getAll(),
    ]).then(([actRes, projRes]) => {
      if (actRes.status  === 'fulfilled' && actRes.value.success)  setActivities(actRes.value.data!);
      if (projRes.status === 'fulfilled' && projRes.value.success) setProjects(projRes.value.data!);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filterProject, filterStatus, filterPriority, filterOverdue, search]);

  useEffect(() => {
    if (form.project_id) {
      orcsApi.getAll({ project_id: form.project_id }).then((r) => {
        if (r.success) setOrcs(r.data!);
      });
    } else {
      setOrcs([]);
    }
  }, [form.project_id]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleSearchChange = (val: string) => {
    setSearchInput(val);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setSearch(val), 350);
  };

  const openCreate = (defaultStatus?: ActivityStatus) => {
    setEditing(null);
    setForm({ ...EMPTY_FORM, status: defaultStatus ?? 'TODO' });
    setShowModal(true);
  };

  const openEdit = (a: Activity) => {
    setEditing(a);
    setForm({
      name: a.name, description: a.description,
      project_id: a.project_id, orc_id: a.orc_id || '',
      start_date: a.start_date || '', end_date: a.end_date || '',
      due_date:   a.due_date   || '',
      status: a.status, priority: a.priority,
      progress: String(a.progress), notes: a.notes,
      tags: a.tags.join(', '),
    });
    setShowModal(true);
    setDetailTask(null);
    setDetailFull(null);
  };

  const openProgress = (a: Activity) => {
    setProgressActivity(a);
    setProgressForm({ progress_percent: a.progress, notes: '' });
    setShowProgressModal(true);
  };

  const handleOpenDetail = async (a: Activity) => {
    setDetailTask(a);
    setDetailFull(null);
    setDetailLoading(true);
    const r = await activitiesApi.get(a.id);
    setDetailLoading(false);
    if (r.success) setDetailFull(r.data!);
  };

  const closeDetail = () => { setDetailTask(null); setDetailFull(null); };

  const handleDelete = async (a: Activity) => {
    if (!confirm(`Supprimer "${a.name}" ?`)) return;
    await activitiesApi.delete(a.id);
    if (detailTask?.id === a.id) closeDetail();
    load();
  };

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.project_id) return;
    setSaving(true);
    const tags = form.tags.split(',').map((t) => t.trim()).filter(Boolean);
    const payload = {
      ...form,
      orc_id:     form.orc_id     || null,
      progress:   parseInt(form.progress) || 0,
      start_date: form.start_date || null,
      end_date:   form.end_date   || null,
      due_date:   form.due_date   || null,
      tags,
    };
    const r = editing
      ? await activitiesApi.update(editing.id, payload)
      : await activitiesApi.create(payload);
    setSaving(false);
    if (r.success) { setShowModal(false); load(); }
  };

  const handleLogProgress = async () => {
    if (!progressActivity) return;
    setSaving(true);
    const r = await activitiesApi.logProgress(progressActivity.id, progressForm);
    setSaving(false);
    if (r.success) {
      setShowProgressModal(false);
      load();
      if (detailTask?.id === progressActivity.id) {
        const dr = await activitiesApi.get(progressActivity.id);
        if (dr.success) setDetailFull(dr.data!);
      }
    }
  };

  const handleUpdateStatus = async (id: string, status: ActivityStatus) => {
    await activitiesApi.update(id, { status });
    load();
  };

  const handleQuickCreate = async (status: ActivityStatus, name: string) => {
    const proj = projects[0];
    if (!proj) return;
    await activitiesApi.create({ name, project_id: proj.id, status, priority: 'MEDIUM' });
    load();
  };

  const toggleSection = (s: ActivityStatus) =>
    setCollapsed((prev) => { const n = new Set(prev); n.has(s) ? n.delete(s) : n.add(s); return n; });

  const f = (key: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const today = new Date();
  const isOverdue = (a: Activity) =>
    !!a.due_date && new Date(a.due_date) < today && !['DONE', 'CANCELLED'].includes(a.status);

  // Group for list sections
  const grouped = STATUS_OPTIONS.reduce((acc, s) => {
    acc[s] = activities.filter((a) => a.status === s);
    return acc;
  }, {} as Record<ActivityStatus, Activity[]>);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div>
      {/* ── Toolbar ─────────────────────────────────────────────────────── */}
      <div className={styles.filterBar} style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', flex: 1, alignItems: 'flex-end' }}>
          <div style={{ minWidth: 200 }}>
            <input
              className={styles.formInput}
              placeholder="🔍 Rechercher…"
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </div>
          <div className={styles.filterItem}>
            <select className={styles.formSelect} value={filterProject} onChange={(e) => setFilterProject(e.target.value)}>
              <option value="">Tous projets</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className={styles.filterItem}>
            <select className={styles.formSelect} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="">Tous statuts</option>
              {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{ACTIVITY_STATUS_LABELS[s]}</option>)}
            </select>
          </div>
          <div className={styles.filterItem}>
            <select className={styles.formSelect} value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
              <option value="">Toutes priorités</option>
              {PRIORITY_OPTIONS.map((p) => <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>)}
            </select>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8125rem', cursor: 'pointer', color: filterOverdue ? '#ef4444' : '#64748b', whiteSpace: 'nowrap' }}>
            <input type="checkbox" checked={filterOverdue} onChange={(e) => setFilterOverdue(e.target.checked)} />
            <AlertCircle size={13} /> En retard
          </label>
        </div>

        <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'center' }}>
          <div className={styles.viewToggle}>
            <button className={`${styles.viewToggleBtn} ${view === 'list'     ? styles.active : ''}`} onClick={() => setView('list')}>
              <LayoutList size={13} /> Liste
            </button>
            <button className={`${styles.viewToggleBtn} ${view === 'board'    ? styles.active : ''}`} onClick={() => setView('board')}>
              <Kanban size={13} /> Tableau
            </button>
            <button className={`${styles.viewToggleBtn} ${view === 'calendar' ? styles.active : ''}`} onClick={() => setView('calendar')}>
              <Calendar size={13} /> Calendrier
            </button>
            <button className={`${styles.viewToggleBtn} ${view === 'gantt'    ? styles.active : ''}`} onClick={() => setView('gantt')}>
              <BarChart2 size={13} /> Gantt
            </button>
            <button className={`${styles.viewToggleBtn} ${view === 'timeline' ? styles.active : ''}`} onClick={() => setView('timeline')}>
              <Clock size={13} /> Chronologie
            </button>
          </div>
          <Button size="sm" onClick={() => openCreate()}>
            <Plus size={16} /> Nouvelle tâche
          </Button>
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────────────────────── */}
      {loading ? (
        <div className={styles.emptyState}><Spinner size="md" /></div>
      ) : activities.length === 0 ? (
        <div className={styles.emptyState}>
          <ListChecks size={40} className={styles.emptyStateIcon} />
          <span className={styles.emptyStateText}>Aucune tâche trouvée</span>
          <Button size="sm" onClick={() => openCreate()}><Plus size={14} /> Créer la première tâche</Button>
        </div>
      ) : view === 'board' ? (
        <BoardView
          activities={activities}
          onUpdateStatus={handleUpdateStatus}
          onOpenDetail={handleOpenDetail}
          onQuickCreate={handleQuickCreate}
        />
      ) : view === 'calendar' ? (
        <CalendarView activities={activities} onOpenDetail={handleOpenDetail} />
      ) : view === 'gantt' ? (
        <GanttView activities={activities} onOpenDetail={handleOpenDetail} />
      ) : view === 'timeline' ? (
        <TimelineView activities={activities} onOpenDetail={handleOpenDetail} />
      ) : (
        /* ── List view ───────────────────────────────────────────────── */
        <div className={styles.listView}>
          {/* Table header */}
          <div className={styles.listHeader}>
            <span>Tâche</span>
            <span>Statut</span>
            <span>Priorité</span>
            <span>Responsable</span>
            <span>Échéance</span>
            <span>Actions</span>
          </div>

          {STATUS_OPTIONS.map((status) => {
            const rows = grouped[status];
            if (rows.length === 0 && filterStatus) return null;
            const isCollapsed = collapsed.has(status);

            return (
              <div key={status}>
                {/* Section header */}
                <div className={styles.listSectionHeader} onClick={() => toggleSection(status)}>
                  {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                  <span className={styles.boardColDot} style={{ background: STATUS_COLORS[status] }} />
                  <span>{ACTIVITY_STATUS_LABELS[status]}</span>
                  <span style={{ background: '#e2e8f0', borderRadius: '9999px', padding: '0.05rem 0.45rem', fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>
                    {rows.length}
                  </span>
                </div>

                {/* Rows */}
                <AnimatePresence initial={false}>
                  {!isCollapsed && rows.map((a) => {
                    const overdue = isOverdue(a);
                    return (
                      <motion.div
                        key={a.id}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.15 }}
                      >
                        <div
                          className={`${styles.listRow} ${PRIORITY_ROW_CLASS[a.priority]} ${overdue ? styles.overdueRow : ''}`}
                          onClick={() => handleOpenDetail(a)}
                        >
                          {/* Name + context */}
                          <div style={{ minWidth: 0, paddingLeft: '0.75rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span className={styles.statusDot} style={{ background: STATUS_COLORS[a.status] }} />
                              <span className={styles.listRowName}>{a.name}</span>
                              {overdue && <AlertCircle size={13} color="#ef4444" />}
                            </div>
                            <div className={styles.listRowSub} style={{ paddingLeft: '1.25rem' }}>
                              {a.project_name}{a.orc_name ? ` · ${a.orc_name}` : ''}
                              {a.tags.map((t) => (
                                <span key={t} className={styles.tagBadge} style={{ marginLeft: '0.3rem' }}>{t}</span>
                              ))}
                            </div>
                          </div>

                          {/* Status */}
                          <div>
                            <Badge variant={ACTIVITY_STATUS_VARIANT[a.status] as any} size="sm">
                              {ACTIVITY_STATUS_LABELS[a.status]}
                            </Badge>
                          </div>

                          {/* Priority */}
                          <div>
                            <Badge variant={PRIORITY_VARIANT[a.priority] as any} size="sm">
                              {PRIORITY_LABELS[a.priority]}
                            </Badge>
                          </div>

                          {/* Assignee */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                            {a.assignee_name ? (
                              <>
                                <div className={styles.avatarCircle}>{initials(a.assignee_name)}</div>
                                <span style={{ fontSize: '0.8125rem', color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 90 }}>
                                  {a.assignee_name}
                                </span>
                              </>
                            ) : <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>—</span>}
                          </div>

                          {/* Due date */}
                          <div>
                            {a.due_date ? (
                              <span style={{ fontSize: '0.8125rem', color: overdue ? '#ef4444' : '#64748b', fontWeight: overdue ? 600 : 400, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                <Calendar size={12} />
                                {new Date(a.due_date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                              </span>
                            ) : <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>—</span>}
                          </div>

                          {/* Actions (visible on hover) */}
                          <div className={styles.listRowActions} onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="sm" onClick={() => openProgress(a)} title="Progression">
                              <TrendingUp size={13} />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => openEdit(a)} title="Modifier">
                              <Edit2 size={13} />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDelete(a)} title="Supprimer">
                              <Trash2 size={13} />
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>

                {/* Inline quick-add */}
                {!isCollapsed && !filterStatus && (
                  <div className={styles.listQuickAdd} onClick={() => openCreate(status)}>
                    <Plus size={13} /> Ajouter une tâche
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Detail Panel ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {detailTask && (
          <>
            <motion.div
              className={styles.detailOverlay}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={closeDetail}
            />
            <motion.div
              className={styles.detailPanel}
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 260 }}
            >
              {/* Header */}
              <div className={styles.detailPanelHeader}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', gap: '0.375rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                    <Badge variant={ACTIVITY_STATUS_VARIANT[detailTask.status] as any} size="sm">
                      {ACTIVITY_STATUS_LABELS[detailTask.status]}
                    </Badge>
                    <Badge variant={PRIORITY_VARIANT[detailTask.priority] as any} size="sm">
                      {PRIORITY_LABELS[detailTask.priority]}
                    </Badge>
                    {isOverdue(detailTask) && (
                      <Badge variant="danger" size="sm"><AlertCircle size={10} /> En retard</Badge>
                    )}
                  </div>
                  <div className={styles.detailPanelTitle}>{detailTask.name}</div>
                </div>
                <div style={{ display: 'flex', gap: '0.25rem', flexShrink: 0 }}>
                  <Button variant="ghost" size="sm" onClick={() => openProgress(detailTask)} title="Progression">
                    <TrendingUp size={14} />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => openEdit(detailTask)} title="Modifier">
                    <Edit2 size={14} />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(detailTask)} title="Supprimer">
                    <Trash2 size={14} />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={closeDetail}>
                    <X size={16} />
                  </Button>
                </div>
              </div>

              {/* Body */}
              <div className={styles.detailPanelBody}>
                {/* Meta fields */}
                <div>
                  {detailTask.project_name && (
                    <div className={styles.detailField}>
                      <div className={styles.detailFieldLabel}><FolderOpen size={11} /> Projet</div>
                      <div className={styles.detailFieldValue}>{detailTask.project_name}</div>
                    </div>
                  )}
                  {detailTask.orc_name && (
                    <div className={styles.detailField}>
                      <div className={styles.detailFieldLabel}><Target size={11} /> ORC</div>
                      <div className={styles.detailFieldValue}>{detailTask.orc_name}</div>
                    </div>
                  )}
                  {detailTask.assignee_name && (
                    <div className={styles.detailField}>
                      <div className={styles.detailFieldLabel}><User size={11} /> Responsable</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div className={styles.avatarCircle}>{initials(detailTask.assignee_name)}</div>
                        <span className={styles.detailFieldValue}>{detailTask.assignee_name}</span>
                      </div>
                    </div>
                  )}
                  {detailTask.start_date && (
                    <div className={styles.detailField}>
                      <div className={styles.detailFieldLabel}><Clock size={11} /> Début</div>
                      <div className={styles.detailFieldValue}>
                        {new Date(detailTask.start_date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                      </div>
                    </div>
                  )}
                  {detailTask.due_date && (
                    <div className={styles.detailField}>
                      <div className={styles.detailFieldLabel}><Calendar size={11} /> Échéance</div>
                      <div className={styles.detailFieldValue} style={{ color: isOverdue(detailTask) ? '#ef4444' : undefined, fontWeight: isOverdue(detailTask) ? 600 : undefined }}>
                        {new Date(detailTask.due_date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                        {isOverdue(detailTask) && ' ⚠ En retard'}
                      </div>
                    </div>
                  )}
                  {detailTask.tags.length > 0 && (
                    <div className={styles.detailField}>
                      <div className={styles.detailFieldLabel}><Tag size={11} /> Tags</div>
                      <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                        {detailTask.tags.map((t) => <span key={t} className={styles.tagBadge}>{t}</span>)}
                      </div>
                    </div>
                  )}
                </div>

                {/* Progress */}
                <div className={styles.detailSection}>
                  <div className={styles.detailSectionTitle}>Progression</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div className={styles.progressBar} style={{ flex: 1, height: 8 }}>
                      <div
                        className={`${styles.progressFill} ${detailTask.progress >= 100 ? styles.done : detailTask.progress >= 50 ? styles.medium : styles.low}`}
                        style={{ width: `${detailTask.progress}%` }}
                      />
                    </div>
                    <span style={{ fontWeight: 700, color: '#6366f1', minWidth: 38, textAlign: 'right' }}>
                      {detailTask.progress}%
                    </span>
                  </div>
                </div>

                {/* Description */}
                {detailTask.description && (
                  <div className={styles.detailSection}>
                    <div className={styles.detailSectionTitle}>Description</div>
                    <p style={{ fontSize: '0.875rem', color: '#475569', lineHeight: 1.6, margin: 0 }}>{detailTask.description}</p>
                  </div>
                )}

                {/* Notes */}
                {detailTask.notes && (
                  <div className={styles.detailSection}>
                    <div className={styles.detailSectionTitle}>Notes</div>
                    <p style={{ fontSize: '0.875rem', color: '#475569', lineHeight: 1.6, margin: 0 }}>{detailTask.notes}</p>
                  </div>
                )}

                {/* Progress history */}
                <div className={styles.detailSection}>
                  <div className={styles.detailSectionTitle}>Historique de progression</div>
                  {detailLoading ? (
                    <div style={{ textAlign: 'center', padding: '0.75rem' }}><Spinner size="sm" /></div>
                  ) : (detailFull?.progress_logs?.length ?? 0) === 0 ? (
                    <p style={{ fontSize: '0.8125rem', color: '#94a3b8', fontStyle: 'italic', margin: 0 }}>Aucun historique</p>
                  ) : (
                    <div>
                      {(detailFull!.progress_logs as ProgressLog[]).map((log) => (
                        <div key={log.id} className={styles.progressLogItem}>
                          <span className={styles.progressLogBadge}>{log.progress_percent}%</span>
                          <div style={{ flex: 1 }}>
                            {log.notes && <div className={styles.progressLogNote}>{log.notes}</div>}
                            <div className={styles.progressLogDate}>
                              {new Date(log.log_date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Modal Tâche ─────────────────────────────────────────────────── */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editing ? 'Modifier la tâche' : 'Nouvelle tâche'}
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
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Projet *</label>
              <select className={styles.formSelect} value={form.project_id} onChange={f('project_id')}>
                <option value="">— Sélectionner —</option>
                {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>ORC lié</label>
              <select className={styles.formSelect} value={form.orc_id} onChange={f('orc_id')}>
                <option value="">— Aucun —</option>
                {orcs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
            </div>
          </div>

          <div className={styles.formGroup} style={{ marginBottom: '0.875rem' }}>
            <label className={styles.formLabel}>Nom de la tâche *</label>
            <input className={styles.formInput} value={form.name} onChange={f('name')} placeholder="Ex: Formation des agents de santé" />
          </div>

          <div className={styles.formGroup} style={{ marginBottom: '0.875rem' }}>
            <label className={styles.formLabel}>Description</label>
            <textarea className={styles.formTextarea} value={form.description} onChange={f('description')} placeholder="Décrivez la tâche…" />
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Statut</label>
              <select className={styles.formSelect} value={form.status} onChange={f('status')}>
                {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{ACTIVITY_STATUS_LABELS[s]}</option>)}
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
              <label className={styles.formLabel}>Début</label>
              <input type="date" className={styles.formInput} value={form.start_date} onChange={f('start_date')} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Fin prévue</label>
              <input type="date" className={styles.formInput} value={form.end_date} onChange={f('end_date')} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Date limite</label>
              <input type="date" className={styles.formInput} value={form.due_date} onChange={f('due_date')} />
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Progression : {form.progress}%</label>
              <input type="range" min="0" max="100" step="5" value={form.progress} onChange={f('progress')} style={{ width: '100%' }} />
              <div className={styles.progressBar} style={{ marginTop: '0.25rem' }}>
                <div
                  className={`${styles.progressFill} ${parseInt(form.progress) >= 100 ? styles.done : parseInt(form.progress) >= 50 ? styles.medium : styles.low}`}
                  style={{ width: `${form.progress}%` }}
                />
              </div>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Tags (virgule-séparés)</label>
              <input className={styles.formInput} value={form.tags} onChange={f('tags')} placeholder="ex: formation, urgence" />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Notes</label>
            <textarea className={styles.formTextarea} value={form.notes} onChange={f('notes')} placeholder="Notes…" />
          </div>
        </div>
      </Modal>

      {/* ── Modal Progression ───────────────────────────────────────────── */}
      <Modal
        isOpen={showProgressModal}
        onClose={() => setShowProgressModal(false)}
        title={`Progression — ${progressActivity?.name ?? ''}`}
        size="sm"
        footer={
          <div className={styles.actionsRow}>
            <Button variant="outline" size="sm" onClick={() => setShowProgressModal(false)}>Annuler</Button>
            <Button size="sm" onClick={handleLogProgress} disabled={saving}>
              {saving ? <Spinner size="sm" /> : 'Enregistrer'}
            </Button>
          </div>
        }
      >
        <div style={{ padding: '0.5rem 0' }}>
          <div className={styles.formGroup} style={{ marginBottom: '1rem' }}>
            <label className={styles.formLabel}>Progression : {progressForm.progress_percent}%</label>
            <input
              type="range" min="0" max="100" step="5"
              value={progressForm.progress_percent}
              onChange={(e) => setProgressForm((p) => ({ ...p, progress_percent: parseInt(e.target.value) }))}
              style={{ width: '100%' }}
            />
            <div className={styles.progressBar} style={{ marginTop: '0.5rem' }}>
              <div
                className={`${styles.progressFill} ${progressForm.progress_percent >= 100 ? styles.done : progressForm.progress_percent >= 50 ? styles.medium : styles.low}`}
                style={{ width: `${progressForm.progress_percent}%` }}
              />
            </div>
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Commentaire</label>
            <textarea
              className={styles.formTextarea}
              value={progressForm.notes}
              onChange={(e) => setProgressForm((p) => ({ ...p, notes: e.target.value }))}
              placeholder="Décrivez l'avancement…"
              style={{ minHeight: 60 }}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
