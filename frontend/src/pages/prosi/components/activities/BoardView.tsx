import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Calendar, AlertCircle } from 'lucide-react';
import type { Activity, ActivityStatus } from '../../types';
import { ACTIVITY_STATUS_LABELS, PRIORITY_LABELS } from '../../types';
import styles from '../../Prosi.module.css';

// ─── Config ───────────────────────────────────────────────────────────────────

const COLUMNS: { status: ActivityStatus; dot: string }[] = [
  { status: 'TODO',        dot: '#94a3b8' },
  { status: 'IN_PROGRESS', dot: '#6366f1' },
  { status: 'BLOCKED',     dot: '#ef4444' },
  { status: 'DONE',        dot: '#10b981' },
  { status: 'CANCELLED',   dot: '#cbd5e1' },
];

const PRIORITY_COLORS: Record<string, string> = {
  LOW:      '#3b82f6',
  MEDIUM:   '#94a3b8',
  HIGH:     '#f59e0b',
  CRITICAL: '#ef4444',
};

function initials(name: string | null) {
  if (!name) return '?';
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  activities: Activity[];
  onUpdateStatus: (id: string, status: ActivityStatus) => Promise<void>;
  onOpenDetail: (a: Activity) => void;
  onQuickCreate: (status: ActivityStatus, name: string) => Promise<void>;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function BoardView({ activities, onUpdateStatus, onOpenDetail, onQuickCreate }: Props) {
  const [dragId, setDragId]       = useState<string | null>(null);
  const [dragOver, setDragOver]   = useState<ActivityStatus | null>(null);
  const [quickAdd, setQuickAdd]   = useState<ActivityStatus | null>(null);
  const [quickName, setQuickName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const today = new Date();

  const grouped = COLUMNS.reduce((acc, col) => {
    acc[col.status] = activities.filter((a) => a.status === col.status);
    return acc;
  }, {} as Record<ActivityStatus, Activity[]>);

  const handleDrop = async (status: ActivityStatus) => {
    if (dragId) {
      const task = activities.find((a) => a.id === dragId);
      if (task && task.status !== status) await onUpdateStatus(dragId, status);
    }
    setDragId(null);
    setDragOver(null);
  };

  const submitQuickAdd = async (status: ActivityStatus) => {
    if (!quickName.trim()) { setQuickAdd(null); return; }
    await onQuickCreate(status, quickName.trim());
    setQuickName('');
    setQuickAdd(null);
  };

  const openQuickAdd = (status: ActivityStatus) => {
    setQuickAdd(status);
    setQuickName('');
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  return (
    <div className={styles.boardWrapper}>
      <div className={styles.board}>
        {COLUMNS.map((col) => {
          const tasks    = grouped[col.status] || [];
          const isOver   = dragOver === col.status;

          return (
            <div
              key={col.status}
              className={`${styles.boardCol} ${isOver ? styles.boardColDragOver : ''}`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(col.status); }}
              onDragLeave={() => setDragOver(null)}
              onDrop={() => handleDrop(col.status)}
            >
              {/* ── Column header ─────────────────────────────────────── */}
              <div className={styles.boardColHeader}>
                <div className={styles.boardColTitle}>
                  <span className={styles.boardColDot} style={{ background: col.dot }} />
                  {ACTIVITY_STATUS_LABELS[col.status]}
                </div>
                <span className={styles.boardColCount}>{tasks.length}</span>
              </div>

              {/* ── Cards ─────────────────────────────────────────────── */}
              <div className={styles.boardColBody}>
                <AnimatePresence>
                  {tasks.map((task) => {
                    const overdue = task.due_date
                      && new Date(task.due_date) < today
                      && !['DONE', 'CANCELLED'].includes(task.status);

                    return (
                      <motion.div
                        key={task.id}
                        layout
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className={`${styles.taskCard} ${dragId === task.id ? styles.dragging : ''}`}
                        draggable
                        onDragStart={() => setDragId(task.id)}
                        onDragEnd={() => { setDragId(null); setDragOver(null); }}
                        onClick={() => onOpenDetail(task)}
                        style={{ borderLeft: `3px solid ${PRIORITY_COLORS[task.priority] ?? '#94a3b8'}` }}
                      >
                        <div className={styles.taskCardTitle}>{task.name}</div>

                        {task.project_name && (
                          <div className={styles.taskCardProject}>
                            {task.project_name}{task.orc_name ? ` · ${task.orc_name}` : ''}
                          </div>
                        )}

                        {task.tags.length > 0 && (
                          <div style={{ display: 'flex', gap: '0.25rem', marginTop: '0.25rem', flexWrap: 'wrap' }}>
                            {task.tags.map((t) => (
                              <span key={t} className={styles.tagBadge}>{t}</span>
                            ))}
                          </div>
                        )}

                        {task.progress > 0 && (
                          <div className={styles.progressBar} style={{ marginTop: '0.5rem' }}>
                            <div
                              className={`${styles.progressFill} ${
                                task.progress >= 100 ? styles.done
                                : task.progress >= 50 ? styles.medium
                                : styles.low
                              }`}
                              style={{ width: `${task.progress}%` }}
                            />
                          </div>
                        )}

                        <div className={styles.taskCardFooter}>
                          {task.assignee_name ? (
                            <div className={styles.taskCardAvatar} title={task.assignee_name}>
                              {initials(task.assignee_name)}
                            </div>
                          ) : <div />}

                          {task.due_date ? (
                            <span className={`${styles.taskCardDate} ${overdue ? styles.overdue : ''}`}>
                              <Calendar size={10} />
                              {new Date(task.due_date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                              {overdue && <AlertCircle size={10} />}
                            </span>
                          ) : <span />}
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>

              {/* ── Quick add ─────────────────────────────────────────── */}
              <div className={styles.boardColFooter}>
                {quickAdd === col.status ? (
                  <div style={{ display: 'flex', gap: '0.375rem' }}>
                    <input
                      ref={inputRef}
                      className={styles.quickAddInput}
                      value={quickName}
                      onChange={(e) => setQuickName(e.target.value)}
                      placeholder="Nom de la tâche…"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') submitQuickAdd(col.status);
                        if (e.key === 'Escape') setQuickAdd(null);
                      }}
                    />
                    <button
                      onClick={() => submitQuickAdd(col.status)}
                      style={{
                        background: '#6366f1', color: 'white', border: 'none',
                        borderRadius: '0.375rem', padding: '0.375rem 0.625rem',
                        cursor: 'pointer', fontSize: '0.875rem', fontWeight: 700,
                      }}
                    >↵</button>
                  </div>
                ) : (
                  <button className={styles.boardAddBtn} onClick={() => openQuickAdd(col.status)}>
                    <Plus size={13} /> Ajouter
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
