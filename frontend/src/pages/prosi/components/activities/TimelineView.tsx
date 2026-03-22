import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Calendar, AlertCircle, Clock } from 'lucide-react';
import type { Activity, ActivityStatus } from '../../types';
import { ACTIVITY_STATUS_LABELS, ACTIVITY_STATUS_VARIANT, PRIORITY_LABELS, PRIORITY_VARIANT } from '../../types';
import { Badge } from '@components/ui/Badge/Badge';
import styles from '../../Prosi.module.css';

const MONTHS_FR = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

const STATUS_ICON_COLOR: Record<ActivityStatus, string> = {
  TODO: '#94a3b8', IN_PROGRESS: '#6366f1', DONE: '#10b981', BLOCKED: '#ef4444', CANCELLED: '#cbd5e1',
};

interface Props {
  activities: Activity[];
  onOpenDetail: (a: Activity) => void;
}

export function TimelineView({ activities, onOpenDetail }: Props) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Sort by due_date (nulls last), group by month
  const groups = useMemo(() => {
    const withDate    = activities.filter((a) => a.due_date).sort((a, b) => a.due_date! < b.due_date! ? -1 : 1);
    const withoutDate = activities.filter((a) => !a.due_date);

    const map = new Map<string, Activity[]>();
    withDate.forEach((a) => {
      const d     = new Date(a.due_date!);
      const key   = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = `${MONTHS_FR[d.getMonth()]} ${d.getFullYear()}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(a);
    });

    const result: { key: string; label: string; tasks: Activity[] }[] = [];
    map.forEach((tasks, key) => {
      const [y, m] = key.split('-').map(Number);
      result.push({ key, label: `${MONTHS_FR[m - 1]} ${y}`, tasks });
    });

    if (withoutDate.length) result.push({ key: 'none', label: 'Sans date', tasks: withoutDate });
    return result;
  }, [activities]);

  const isOverdue = (a: Activity) =>
    !!a.due_date && new Date(a.due_date) < today && !['DONE', 'CANCELLED'].includes(a.status);

  if (activities.length === 0) {
    return (
      <div className={styles.emptyState}>
        <Clock size={40} className={styles.emptyStateIcon} />
        <span className={styles.emptyStateText}>Aucune tâche à afficher</span>
      </div>
    );
  }

  return (
    <div className={styles.timelineWrapper}>
      {groups.map((group) => (
        <div key={group.key} className={styles.timelineGroup}>
          {/* Month heading */}
          <div className={styles.timelineMonthHeader}>
            <div className={styles.timelineMonthDot} />
            <span className={styles.timelineMonthLabel}>{group.label}</span>
            <span className={styles.timelineMonthCount}>{group.tasks.length}</span>
          </div>

          {/* Task cards */}
          <div className={styles.timelineItems}>
            {group.tasks.map((a, i) => {
              const overdue = isOverdue(a);
              const d = a.due_date ? new Date(a.due_date) : null;

              return (
                <motion.div
                  key={a.id}
                  className={`${styles.timelineCard} ${overdue ? styles.timelineCardOverdue : ''}`}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => onOpenDetail(a)}
                >
                  {/* Left timeline line + dot */}
                  <div className={styles.timelineDotCol}>
                    <div
                      className={styles.timelineDot}
                      style={{ background: STATUS_ICON_COLOR[a.status] }}
                    />
                    <div className={styles.timelineLine} />
                  </div>

                  {/* Content */}
                  <div className={styles.timelineContent}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <span className={styles.timelineTaskName}>{a.name}</span>
                          {overdue && <AlertCircle size={13} color="#ef4444" />}
                        </div>
                        {(a.project_name || a.orc_name) && (
                          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.15rem' }}>
                            {a.project_name}{a.orc_name ? ` · ${a.orc_name}` : ''}
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '0.375rem', flexShrink: 0, flexWrap: 'wrap' }}>
                        <Badge variant={ACTIVITY_STATUS_VARIANT[a.status] as any} size="sm">
                          {ACTIVITY_STATUS_LABELS[a.status]}
                        </Badge>
                        <Badge variant={PRIORITY_VARIANT[a.priority] as any} size="sm">
                          {PRIORITY_LABELS[a.priority]}
                        </Badge>
                      </div>
                    </div>

                    {/* Progress bar */}
                    {a.progress > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                        <div className={styles.progressBar} style={{ flex: 1 }}>
                          <div
                            className={`${styles.progressFill} ${a.progress >= 100 ? styles.done : a.progress >= 50 ? styles.medium : styles.low}`}
                            style={{ width: `${a.progress}%` }}
                          />
                        </div>
                        <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#6366f1', whiteSpace: 'nowrap' }}>
                          {a.progress}%
                        </span>
                      </div>
                    )}

                    {/* Footer */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                      {d && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: overdue ? '#ef4444' : '#94a3b8', fontWeight: overdue ? 600 : 400 }}>
                          <Calendar size={11} />
                          {d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                      )}
                      {a.assignee_name && (
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          👤 {a.assignee_name}
                        </span>
                      )}
                      {a.tags.length > 0 && a.tags.map((t) => (
                        <span key={t} className={styles.tagBadge}>{t}</span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
