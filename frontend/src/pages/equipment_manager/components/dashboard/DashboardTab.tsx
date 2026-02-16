import { useState, useEffect } from 'react';
import { Spinner } from '@components/ui/Spinner/Spinner';
import { Badge } from '@components/ui/Badge/Badge';
import { Table, type Column } from '@components/ui/Table/Table';
import { AlertTriangle, Clock, CheckCircle, XCircle, Ticket, Users, Smartphone } from 'lucide-react';
import { dashboardApi } from '../../api';
import type { DashboardStats, TicketsByDelay, BlockagePoint, RepairTicket } from '../../types';
import { STATUS_LABELS, STAGE_LABELS } from '../../types';
import styles from '../../EquipmentManager.module.css';
import toast from 'react-hot-toast';

export function DashboardTab() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [delays, setDelays] = useState<TicketsByDelay | null>(null);
  const [blockages, setBlockages] = useState<BlockagePoint[]>([]);
  const [overdueTickets, setOverdueTickets] = useState<RepairTicket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const [statsRes, delaysRes, blockagesRes, overdueRes] = await Promise.all([
        dashboardApi.getStats(),
        dashboardApi.getTicketsByDelay(),
        dashboardApi.getBlockagePoints(),
        dashboardApi.getRecentOverdue(),
      ]);
      if (statsRes.success) setStats(statsRes.data!);
      if (delaysRes.success) setDelays(delaysRes.data!);
      if (blockagesRes.success) setBlockages(blockagesRes.data!);
      if (overdueRes.success) setOverdueTickets(overdueRes.data!);
    } catch {
      toast.error('Erreur lors du chargement du dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><Spinner /></div>;

  const overdueColumns: Column<RepairTicket>[] = [
    { key: 'ticket_number', header: 'Numero', render: (t) => t.ticket_number },
    { key: 'equipment', header: 'Equipement', render: (t) => `${t.equipment_brand} ${t.equipment_model}` },
    { key: 'asc_name', header: 'ASC', render: (t) => t.asc_name },
    { key: 'stage', header: 'Etape', render: (t) => <Badge variant="info">{t.current_stage_label}</Badge> },
    {
      key: 'delay',
      header: 'Delai',
      render: (t) => (
        <Badge variant={t.delay_color === 'red' ? 'danger' : t.delay_color === 'yellow' ? 'warning' : 'success'}>
          {t.delay_days}j
        </Badge>
      ),
    },
  ];

  return (
    <div>
      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        <div className={`${styles.statCard} ${styles.primary}`}>
          <span className={styles.statLabel}><Ticket size={16} /> Total Tickets</span>
          <span className={styles.statValue}>{stats?.total_tickets ?? 0}</span>
        </div>
        <div className={`${styles.statCard} ${styles.warning}`}>
          <span className={styles.statLabel}><Clock size={16} /> Ouverts</span>
          <span className={styles.statValue}>{stats?.open_tickets ?? 0}</span>
        </div>
        <div className={`${styles.statCard} ${styles.info}`}>
          <span className={styles.statLabel}><AlertTriangle size={16} /> En cours</span>
          <span className={styles.statValue}>{stats?.in_progress_tickets ?? 0}</span>
        </div>
        <div className={`${styles.statCard} ${styles.success}`}>
          <span className={styles.statLabel}><CheckCircle size={16} /> Fermes</span>
          <span className={styles.statValue}>{stats?.closed_tickets ?? 0}</span>
        </div>
        <div className={`${styles.statCard}`}>
          <span className={styles.statLabel}><Users size={16} /> ASCs actifs</span>
          <span className={styles.statValue}>{stats?.total_ascs ?? 0}</span>
        </div>
        <div className={`${styles.statCard}`}>
          <span className={styles.statLabel}><Smartphone size={16} /> Equipements</span>
          <span className={styles.statValue}>{stats?.total_equipment ?? 0}</span>
        </div>
        <div className={`${styles.statCard}`}>
          <span className={styles.statLabel}><XCircle size={16} /> Annules</span>
          <span className={styles.statValue}>{stats?.cancelled_tickets ?? 0}</span>
        </div>
        <div className={`${styles.statCard} ${styles.info}`}>
          <span className={styles.statLabel}>Duree moy. (jours)</span>
          <span className={styles.statValue}>{stats?.avg_duration_days ?? '-'}</span>
        </div>
      </div>

      {/* Delay Indicators */}
      {delays && (
        <div className={styles.delayGrid}>
          <div className={`${styles.delayCard} ${styles.green}`}>
            <div className={styles.delayValue}>{delays.green}</div>
            <div className={styles.delayLabel}>&lt; 7 jours</div>
          </div>
          <div className={`${styles.delayCard} ${styles.yellow}`}>
            <div className={styles.delayValue}>{delays.yellow}</div>
            <div className={styles.delayLabel}>7-14 jours</div>
          </div>
          <div className={`${styles.delayCard} ${styles.red}`}>
            <div className={styles.delayValue}>{delays.red}</div>
            <div className={styles.delayLabel}>&gt; 14 jours</div>
          </div>
        </div>
      )}

      {/* Blockage Points */}
      {blockages.length > 0 && (
        <>
          <h3 className={styles.sectionTitle}>Points de blocage</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.5rem' }}>
            {blockages.map((b) => (
              <Badge key={b.stage} variant="danger">
                {b.stage}: {b.count} ticket{b.count > 1 ? 's' : ''}
              </Badge>
            ))}
          </div>
        </>
      )}

      {/* Overdue Tickets */}
      {overdueTickets.length > 0 && (
        <>
          <h3 className={styles.sectionTitle}>Tickets en retard (&gt;14 jours)</h3>
          <Table
            data={overdueTickets}
            columns={overdueColumns}
            keyExtractor={(t) => t.id}
            features={{ pagination: true }}
            defaultPageSize={5}
          />
        </>
      )}
    </div>
  );
}
