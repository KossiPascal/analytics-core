import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Activity } from '../../types';
import { ACTIVITY_STATUS_LABELS } from '../../types';
import styles from '../../Prosi.module.css';

const PRIORITY_COLORS: Record<string, string> = {
  LOW: '#3b82f6', MEDIUM: '#6366f1', HIGH: '#f59e0b', CRITICAL: '#ef4444',
};

const STATUS_OPACITY: Record<string, number> = {
  TODO: 0.55, IN_PROGRESS: 1, DONE: 0.7, BLOCKED: 0.9, CANCELLED: 0.3,
};

const MONTHS_FR = ['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Aoû','Sep','Oct','Nov','Déc'];

function addDays(d: Date, n: number) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function diffDays(a: Date, b: Date) {
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

interface Props {
  activities: Activity[];
  onOpenDetail: (a: Activity) => void;
}

export function GanttView({ activities, onOpenDetail }: Props) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Window: 8 weeks by default, navigable
  const [offset, setOffset] = useState(0); // weeks offset from today
  const WEEKS = 10;
  const DAYS  = WEEKS * 7;

  const windowStart = useMemo(() => {
    const d = new Date(today);
    d.setDate(d.getDate() + offset * 7);
    // Snap to Monday
    const dow = (d.getDay() + 6) % 7;
    d.setDate(d.getDate() - dow);
    return d;
  }, [offset]);

  const windowEnd = addDays(windowStart, DAYS);

  // Only activities that have at least a start or end date in window
  const visible = activities.filter((a) => {
    const start = a.start_date ? new Date(a.start_date) : null;
    const end   = a.due_date   ? new Date(a.due_date)   : (a.end_date ? new Date(a.end_date) : null);
    if (!start && !end) return false;
    const s = start ?? end!;
    const e = end   ?? start!;
    return s <= windowEnd && e >= windowStart;
  });

  // Build week labels
  const weekLabels: { label: string; left: number }[] = [];
  for (let w = 0; w < WEEKS; w++) {
    const d = addDays(windowStart, w * 7);
    weekLabels.push({ label: `${d.getDate()} ${MONTHS_FR[d.getMonth()]}`, left: (w / WEEKS) * 100 });
  }

  // Today marker position
  const todayOffset = diffDays(windowStart, today);
  const todayPct    = (todayOffset / DAYS) * 100;

  const ROW_H = 40; // px

  return (
    <div className={styles.ganttWrapper}>
      {/* Navigation */}
      <div className={styles.ganttNav}>
        <button className={styles.calNavBtn} onClick={() => setOffset((o) => o - 1)}><ChevronLeft size={16} /></button>
        <span className={styles.calNavTitle}>
          {windowStart.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
          {' — '}
          {windowEnd.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
        </span>
        <button className={styles.calNavBtn} onClick={() => setOffset((o) => o + 1)}><ChevronRight size={16} /></button>
        <button className={styles.calNavBtn} onClick={() => setOffset(0)} style={{ marginLeft: '0.25rem', fontSize: '0.75rem', fontWeight: 600, padding: '0.25rem 0.625rem' }}>
          Aujourd'hui
        </button>
      </div>

      <div style={{ display: 'flex', overflowX: 'auto' }}>
        {/* Task name column */}
        <div className={styles.ganttLabels} style={{ minWidth: 220 }}>
          <div className={styles.ganttHeaderRow} />
          {visible.length === 0 ? (
            <div style={{ padding: '2rem 1rem', color: '#94a3b8', fontSize: '0.875rem' }}>
              Aucune tâche avec des dates dans cette fenêtre.
            </div>
          ) : visible.map((a) => (
            <div
              key={a.id}
              className={styles.ganttLabelRow}
              style={{ height: ROW_H }}
              onClick={() => onOpenDetail(a)}
            >
              <span
                className={styles.ganttLabelDot}
                style={{ background: PRIORITY_COLORS[a.priority] ?? '#94a3b8' }}
              />
              <span className={styles.ganttLabelName}>{a.name}</span>
            </div>
          ))}
        </div>

        {/* Timeline area */}
        <div className={styles.ganttTimeline} style={{ flex: 1, minWidth: `${WEEKS * 80}px`, position: 'relative' }}>
          {/* Week headers */}
          <div className={styles.ganttHeaderRow} style={{ display: 'flex', position: 'relative' }}>
            {weekLabels.map((w, i) => (
              <div key={i} className={styles.ganttWeekLabel} style={{ width: `${100 / WEEKS}%` }}>
                {w.label}
              </div>
            ))}
          </div>

          {/* Grid + bars */}
          <div style={{ position: 'relative' }}>
            {/* Column grid lines */}
            {weekLabels.map((_, i) => (
              <div
                key={i}
                style={{
                  position: 'absolute', top: 0, bottom: 0,
                  left: `${(i / WEEKS) * 100}%`,
                  width: 1, background: '#f1f5f9', pointerEvents: 'none',
                }}
              />
            ))}

            {/* Today line */}
            {todayPct >= 0 && todayPct <= 100 && (
              <div
                style={{
                  position: 'absolute', top: 0, bottom: 0,
                  left: `${todayPct}%`, width: 2,
                  background: '#ef4444', opacity: 0.7,
                  pointerEvents: 'none', zIndex: 5,
                }}
              />
            )}

            {visible.length === 0 ? (
              <div style={{ height: ROW_H }} />
            ) : visible.map((a) => {
              const rawStart = a.start_date ? new Date(a.start_date) : (a.due_date ? new Date(a.due_date) : null);
              const rawEnd   = a.due_date   ? new Date(a.due_date)   : (a.end_date ? new Date(a.end_date) : rawStart);
              if (!rawStart || !rawEnd) return null;

              const clampedStart = rawStart < windowStart ? windowStart : rawStart;
              const clampedEnd   = rawEnd   > windowEnd   ? windowEnd   : rawEnd;

              const leftPct  = (diffDays(windowStart, clampedStart) / DAYS) * 100;
              const widthPct = Math.max((diffDays(clampedStart, clampedEnd) / DAYS) * 100, 0.5);

              const color   = PRIORITY_COLORS[a.priority] ?? '#94a3b8';
              const opacity = STATUS_OPACITY[a.status] ?? 1;

              return (
                <div
                  key={a.id}
                  style={{ height: ROW_H, display: 'flex', alignItems: 'center', padding: '0 0' }}
                >
                  <div
                    className={styles.ganttBar}
                    style={{
                      left: `${leftPct}%`,
                      width: `${widthPct}%`,
                      background: color,
                      opacity,
                    }}
                    onClick={() => onOpenDetail(a)}
                    title={`${a.name}\n${ACTIVITY_STATUS_LABELS[a.status]}\n${a.progress}%`}
                  >
                    <div
                      style={{
                        position: 'absolute', top: 0, left: 0,
                        height: '100%',
                        width: `${a.progress}%`,
                        background: 'rgba(255,255,255,0.35)',
                        borderRadius: '0.375rem',
                      }}
                    />
                    <span className={styles.ganttBarLabel}>{a.name}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
