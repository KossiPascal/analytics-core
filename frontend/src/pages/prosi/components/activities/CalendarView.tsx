import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Activity, ActivityStatus } from '../../types';
import { ACTIVITY_STATUS_LABELS, PRIORITY_LABELS } from '../../types';
import styles from '../../Prosi.module.css';

const MONTHS_FR = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
const DAYS_FR   = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

const PRIORITY_COLORS: Record<string, string> = {
  LOW: '#3b82f6', MEDIUM: '#6366f1', HIGH: '#f59e0b', CRITICAL: '#ef4444',
};

const STATUS_BG: Record<ActivityStatus, string> = {
  TODO: '#f1f5f9', IN_PROGRESS: '#ede9fe', DONE: '#d1fae5', BLOCKED: '#fee2e2', CANCELLED: '#f1f5f9',
};

interface Props {
  activities: Activity[];
  onOpenDetail: (a: Activity) => void;
}

export function CalendarView({ activities, onOpenDetail }: Props) {
  const today = new Date();
  const [year, setYear]   = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth()); // 0-indexed

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

  // Build calendar grid: start on Monday
  const firstDay   = new Date(year, month, 1);
  const lastDay    = new Date(year, month + 1, 0);
  const startDow   = (firstDay.getDay() + 6) % 7; // Mon=0 … Sun=6
  const totalCells = Math.ceil((startDow + lastDay.getDate()) / 7) * 7;

  const cells: (number | null)[] = [];
  for (let i = 0; i < totalCells; i++) {
    const d = i - startDow + 1;
    cells.push(d >= 1 && d <= lastDay.getDate() ? d : null);
  }

  // Index activities by due_date day
  const byDay: Record<number, Activity[]> = {};
  activities.forEach((a) => {
    if (!a.due_date) return;
    const d = new Date(a.due_date);
    if (d.getFullYear() === year && d.getMonth() === month) {
      const day = d.getDate();
      (byDay[day] ??= []).push(a);
    }
  });

  const isToday = (d: number) =>
    d === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  return (
    <div className={styles.calendarWrapper}>
      {/* Navigation */}
      <div className={styles.calendarNav}>
        <button className={styles.calNavBtn} onClick={prevMonth}><ChevronLeft size={16} /></button>
        <span className={styles.calNavTitle}>{MONTHS_FR[month]} {year}</span>
        <button className={styles.calNavBtn} onClick={nextMonth}><ChevronRight size={16} /></button>
      </div>

      {/* Day headers */}
      <div className={styles.calGrid}>
        {DAYS_FR.map((d) => (
          <div key={d} className={styles.calDayHeader}>{d}</div>
        ))}

        {/* Day cells */}
        {cells.map((day, i) => (
          <div
            key={i}
            className={`${styles.calCell} ${day === null ? styles.calCellEmpty : ''} ${day !== null && isToday(day) ? styles.calCellToday : ''}`}
          >
            {day !== null && (
              <>
                <span className={styles.calDayNum}>{day}</span>
                <div className={styles.calTaskList}>
                  {(byDay[day] ?? []).slice(0, 3).map((a) => (
                    <motion.div
                      key={a.id}
                      className={styles.calTask}
                      style={{
                        background: STATUS_BG[a.status],
                        borderLeft: `3px solid ${PRIORITY_COLORS[a.priority] ?? '#94a3b8'}`,
                      }}
                      whileHover={{ scale: 1.02 }}
                      onClick={() => onOpenDetail(a)}
                      title={`${a.name} — ${ACTIVITY_STATUS_LABELS[a.status]} · ${PRIORITY_LABELS[a.priority]}`}
                    >
                      {a.name}
                    </motion.div>
                  ))}
                  {(byDay[day]?.length ?? 0) > 3 && (
                    <span className={styles.calMore}>+{byDay[day].length - 3} autres</span>
                  )}
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className={styles.calLegend}>
        {Object.entries(PRIORITY_COLORS).map(([p, c]) => (
          <span key={p} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', color: '#64748b' }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: c, display: 'inline-block' }} />
            {PRIORITY_LABELS[p as keyof typeof PRIORITY_LABELS]}
          </span>
        ))}
      </div>
    </div>
  );
}
