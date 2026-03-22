import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  FolderKanban, Target, ListChecks, FileBarChart2,
  AlertTriangle, TrendingUp, CheckCircle2, Clock,
} from 'lucide-react';
import { dashboardApi } from '../../api';
import type { DashboardStats } from '../../types';
import { MONTHS_FR } from '../../types';
import { Badge } from '@components/ui/Badge/Badge';
import { Spinner } from '@components/ui/Spinner/Spinner';
import styles from '../../Prosi.module.css';

interface Props {
  onNavigate?: (tab: 'projects' | 'orcs' | 'activities' | 'reports') => void;
}

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.07, duration: 0.35 } }),
};

export function DashboardTab({ onNavigate }: Props) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardApi.getStats().then((r) => {
      if (r.success) setStats(r.data!);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className={styles.emptyState}><Spinner size="md" /></div>;
  if (!stats)  return <div className={styles.emptyState}><span>Erreur de chargement</span></div>;

  const { projects, orcs, activities, reports_count, activity_trend } = stats;

  // Trend des 6 derniers mois pour affichage simple
  const trendData = activity_trend.slice(-6);

  return (
    <div>
      {/* ── KPI Row ─────────────────────────────────────────────────────────── */}
      <div className={styles.statsGrid}>
        {[
          {
            label: 'Projets actifs', value: projects.active, sub: `${projects.total} total`,
            variant: 'primary', icon: <FolderKanban size={15} />, tab: 'projects' as const,
          },
          {
            label: 'ORCs', value: orcs.total, sub: `${orcs.avg_progress}% moy. avancement`,
            variant: 'purple', icon: <Target size={15} />, tab: 'orcs' as const,
          },
          {
            label: 'Activités', value: activities.total, sub: `${activities.avg_progress}% moy. progression`,
            variant: 'info', icon: <ListChecks size={15} />, tab: 'activities' as const,
          },
          {
            label: 'En retard', value: activities.overdue, sub: 'activités dépassées',
            variant: 'danger', icon: <AlertTriangle size={15} />, tab: 'activities' as const,
          },
          {
            label: 'ORCs à risque', value: orcs.at_risk, sub: `${orcs.completed} atteints`,
            variant: 'warning', icon: <TrendingUp size={15} />, tab: 'orcs' as const,
          },
          {
            label: 'Rapports', value: reports_count, sub: 'rapports générés',
            variant: 'success', icon: <FileBarChart2 size={15} />, tab: 'reports' as const,
          },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            custom={i}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className={`${styles.statCard} ${styles[s.variant]}`}
            style={{ cursor: onNavigate ? 'pointer' : 'default' }}
            onClick={() => onNavigate?.(s.tab)}
          >
            <div className={styles.statLabel}>{s.icon} {s.label}</div>
            <div className={styles.statValue}>{s.value}</div>
            <div className={styles.statSub}>{s.sub}</div>
          </motion.div>
        ))}
      </div>

      {/* ── Bottom Row ──────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>

        {/* Activités à venir */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <div className={styles.sectionTitle}><Clock size={16} /> Activités à venir</div>
          {activities.due_soon.length === 0 ? (
            <div className={styles.emptyState} style={{ padding: '1.5rem' }}>
              <CheckCircle2 size={32} className={styles.emptyStateIcon} />
              <span className={styles.emptyStateText}>Aucune activité urgente</span>
            </div>
          ) : (
            <div className={styles.dueSoonList}>
              {activities.due_soon.map((a) => {
                const due = a.due_date ? new Date(a.due_date) : null;
                const today = new Date();
                const isOverdue = due && due < today;
                return (
                  <div key={a.id} className={`${styles.dueSoonItem} ${isOverdue ? styles.overdue : ''}`}>
                    <div
                      style={{
                        width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                        background: isOverdue ? '#ef4444' : a.priority === 'CRITICAL' ? '#ef4444' : a.priority === 'HIGH' ? '#f59e0b' : '#6366f1',
                      }}
                    />
                    <span className={styles.dueSoonName}>{a.name}</span>
                    <span className={`${styles.dueSoonDate} ${isOverdue ? styles.overdue : ''}`}>
                      {due ? due.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) : '—'}
                    </span>
                    <Badge variant={(a.status === 'DONE' ? 'success' : a.status === 'IN_PROGRESS' ? 'primary' : 'secondary') as any} size="sm">
                      {a.status === 'TODO' ? 'À faire' : a.status === 'IN_PROGRESS' ? 'En cours' : a.status}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Tendance activités */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <div className={styles.sectionTitle}><TrendingUp size={16} /> Tendance activités (6 mois)</div>
          {trendData.length === 0 ? (
            <div className={styles.emptyState} style={{ padding: '1.5rem' }}>
              <span className={styles.emptyStateText}>Pas encore de données</span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {trendData.map((t) => {
                const doneRate = t.total > 0 ? Math.round((t.done / t.total) * 100) : 0;
                return (
                  <div key={`${t.year}-${t.month}`}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '0.2rem' }}>
                      <span style={{ color: '#64748b' }}>{MONTHS_FR[t.month]} {t.year}</span>
                      <span style={{ color: '#1e293b', fontWeight: 600 }}>{t.done}/{t.total} ({doneRate}%)</span>
                    </div>
                    <div className={styles.progressBar}>
                      <div
                        className={`${styles.progressFill} ${doneRate >= 80 ? styles.done : doneRate >= 50 ? styles.medium : styles.low}`}
                        style={{ width: `${doneRate}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>

      {/* ── Répartition par statut ────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.25rem', marginTop: '1.25rem' }}>
        <StatusBreakdown title="Projets par statut" data={projects.by_status} colorMap={PROJECT_COLORS} />
        <StatusBreakdown title="ORCs par statut"    data={orcs.by_status}     colorMap={ORC_COLORS} />
        <StatusBreakdown title="Activités par statut" data={activities.by_status} colorMap={ACT_COLORS} />
      </div>
    </div>
  );
}

// ─── Composant répartition ────────────────────────────────────────────────────

const PROJECT_COLORS: Record<string, string> = {
  DRAFT: '#94a3b8', ACTIVE: '#10b981', ON_HOLD: '#f59e0b', COMPLETED: '#3b82f6', CANCELLED: '#ef4444',
};
const ORC_COLORS: Record<string, string> = {
  DRAFT: '#94a3b8', ACTIVE: '#6366f1', AT_RISK: '#f59e0b', COMPLETED: '#10b981', CANCELLED: '#ef4444',
};
const ACT_COLORS: Record<string, string> = {
  TODO: '#94a3b8', IN_PROGRESS: '#6366f1', DONE: '#10b981', BLOCKED: '#ef4444', CANCELLED: '#cbd5e1',
};

const LABELS: Record<string, string> = {
  DRAFT: 'Brouillon', ACTIVE: 'Actif', ON_HOLD: 'En pause', COMPLETED: 'Terminé', CANCELLED: 'Annulé',
  AT_RISK: 'À risque', TODO: 'À faire', IN_PROGRESS: 'En cours', DONE: 'Terminé', BLOCKED: 'Bloqué',
};

function StatusBreakdown({ title, data, colorMap }: { title: string; data: Record<string, number>; colorMap: Record<string, string> }) {
  const total = Object.values(data).reduce((s, v) => s + v, 0);
  return (
    <div>
      <div className={styles.sectionTitle} style={{ fontSize: '0.8125rem' }}>{title}</div>
      {total === 0 ? (
        <span style={{ fontSize: '0.8125rem', color: '#94a3b8' }}>Aucune donnée</span>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
          {Object.entries(data).map(([status, count]) => (
            <div key={status} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: colorMap[status] || '#94a3b8', flexShrink: 0 }} />
              <span style={{ fontSize: '0.8rem', color: '#64748b', flex: 1 }}>{LABELS[status] || status}</span>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#1e293b' }}>{count}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
