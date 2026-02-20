import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Spinner } from '@components/ui/Spinner/Spinner';
import { Badge } from '@components/ui/Badge/Badge';
import { Button } from '@components/ui/Button/Button';
import { Table, type Column } from '@components/ui/Table/Table';
import {
  AlertTriangle, Clock, CheckCircle, XCircle, Ticket, Users, Smartphone, Plus, PackagePlus,
} from 'lucide-react';
import { dashboardApi, ascsApi, equipmentApi } from '../../api';
import type {
  DashboardStats, TicketsByDelay, BlockagePoint, RepairTicket,
  ASC, EquipmentCategory, EquipmentCategoryGroup, EquipmentBrand,
} from '../../types';
import { TicketCreateModal } from '../tickets/TicketCreateModal';
import { EquipmentFormModal } from '../equipment/EquipmentFormModal';
import { ReserveDeclarationModal } from '../equipment/ReserveDeclarationModal';
import styles from '../../EquipmentManager.module.css';
import toast from 'react-hot-toast';

export function DashboardTab() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [delays, setDelays] = useState<TicketsByDelay | null>(null);
  const [blockages, setBlockages] = useState<BlockagePoint[]>([]);
  const [overdueTickets, setOverdueTickets] = useState<RepairTicket[]>([]);
  const [loading, setLoading] = useState(true);

  // Quick-action modals
  const [ticketModalOpen, setTicketModalOpen] = useState(false);
  const [equipFormOpen, setEquipFormOpen] = useState(false);
  const [reserveOpen, setReserveOpen] = useState(false);

  // Data for EquipmentFormModal (loaded lazily)
  const [ascs, setAscs] = useState<ASC[]>([]);
  const [categories, setCategories] = useState<EquipmentCategory[]>([]);
  const [categoryGroups, setCategoryGroups] = useState<EquipmentCategoryGroup[]>([]);
  const [brands, setBrands] = useState<EquipmentBrand[]>([]);
  const [equipDataLoading, setEquipDataLoading] = useState(false);

  useEffect(() => { loadDashboard(); }, []);

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

  const openEquipmentForm = async () => {
    if (categories.length === 0 && !equipDataLoading) {
      setEquipDataLoading(true);
      const [ascsRes, catRes, brandRes, groupRes] = await Promise.all([
        ascsApi.getAll(),
        equipmentApi.getCategories(),
        equipmentApi.getBrands(),
        equipmentApi.getCategoryGroups(),
      ]);
      if (ascsRes.success) setAscs(ascsRes.data!);
      if (catRes.success) setCategories(catRes.data!);
      if (brandRes.success) setBrands(brandRes.data!);
      if (groupRes.success) setCategoryGroups(groupRes.data!);
      setEquipDataLoading(false);
    }
    setEquipFormOpen(true);
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
      <Spinner />
    </div>
  );

  const STAT_CARDS = [
    { label: 'Total Tickets', value: stats?.total_tickets ?? 0, icon: <Ticket size={14} />, variant: 'primary' },
    { label: 'Ouverts', value: stats?.open_tickets ?? 0, icon: <Clock size={14} />, variant: 'warning' },
    { label: 'En cours', value: stats?.in_progress_tickets ?? 0, icon: <AlertTriangle size={14} />, variant: 'info' },
    { label: 'Fermés', value: stats?.closed_tickets ?? 0, icon: <CheckCircle size={14} />, variant: 'success' },
    { label: 'Employés', value: stats?.total_ascs ?? 0, icon: <Users size={14} />, variant: '' },
    { label: 'Équipements', value: stats?.total_equipment ?? 0, icon: <Smartphone size={14} />, variant: '' },
    { label: 'Annulés', value: stats?.cancelled_tickets ?? 0, icon: <XCircle size={14} />, variant: '' },
    {
      label: 'Durée moy.',
      value: stats?.avg_duration_days != null ? `${stats.avg_duration_days}j` : '—',
      icon: null,
      variant: 'info',
    },
  ];

  const DELAY_ITEMS = delays ? [
    { label: '< 7 jours', value: delays.green, cls: styles.green },
    { label: '7–14 jours', value: delays.yellow, cls: styles.yellow },
    { label: '> 14 jours', value: delays.red, cls: styles.red },
  ] : [];

  const overdueColumns: Column<RepairTicket>[] = [
    { key: 'ticket_number', header: 'Numero', render: (t) => t.ticket_number },
    { key: 'equipment', header: 'Equipement', render: (t) => `${t.equipment_brand ?? ''} ${t.equipment_model ?? ''}`.trim() },
    { key: 'asc_name', header: 'ASC', render: (t) => t.asc_name },
    {
      key: 'delay',
      header: 'Délai',
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
        {STAT_CARDS.map((card, i) => (
          <motion.div
            key={card.label}
            className={`${styles.statCard} ${card.variant ? styles[card.variant] : ''}`}
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.28, delay: i * 0.06, ease: 'easeOut' }}
          >
            <span className={styles.statLabel}>
              {card.icon}
              {card.label}
            </span>
            <span className={styles.statValue}>{card.value}</span>
          </motion.div>
        ))}
      </div>

      {/* Delay Indicators */}
      {delays && (
        <div className={styles.delayGrid}>
          {DELAY_ITEMS.map((d, i) => (
            <motion.div
              key={d.label}
              className={`${styles.delayCard} ${d.cls}`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.25, delay: 0.52 + i * 0.08, ease: 'easeOut' }}
            >
              <div className={styles.delayValue}>{d.value}</div>
              <div className={styles.delayLabel}>{d.label}</div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Blockage Points */}
      {blockages.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.72, duration: 0.25 }}
        >
          <h3 className={styles.sectionTitle}>Points de blocage</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.25rem' }}>
            {blockages.map((b) => (
              <Badge key={b.stage} variant="danger">
                {b.stage}: {b.count} ticket{b.count > 1 ? 's' : ''}
              </Badge>
            ))}
          </div>
        </motion.div>
      )}

      {/* Overdue Tickets */}
      {overdueTickets.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.82, duration: 0.25 }}
        >
          <h3 className={styles.sectionTitle}>Tickets en retard (&gt;14 jours)</h3>
          <Table<any>
            data={overdueTickets}
            columns={overdueColumns}
            keyExtractor={(t) => t.id}
            features={{ pagination: true }}
            defaultPageSize={5}
          />
        </motion.div>
      )}

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.92, duration: 0.25 }}
      >
        <h3 className={styles.sectionTitle} style={{ marginTop: '1.5rem' }}>Actions rapides</h3>
        <div className={styles.quickActionsGrid}>
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Plus size={15} />}
            onClick={() => setTicketModalOpen(true)}
          >
            Créer un ticket
          </Button>
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Smartphone size={15} />}
            onClick={openEquipmentForm}
            isLoading={equipDataLoading}
          >
            Nouvel équipement
          </Button>
          <Button
            variant="outline"
            size="sm"
            leftIcon={<PackagePlus size={15} />}
            onClick={() => setReserveOpen(true)}
          >
            Déclarer en réserve
          </Button>
        </div>
      </motion.div>

      {/* Modals */}
      <TicketCreateModal
        isOpen={ticketModalOpen}
        onClose={() => setTicketModalOpen(false)}
        onSuccess={() => { setTicketModalOpen(false); loadDashboard(); }}
      />

      <EquipmentFormModal
        isOpen={equipFormOpen}
        onClose={() => setEquipFormOpen(false)}
        onSuccess={() => { setEquipFormOpen(false); loadDashboard(); }}
        ascs={ascs}
        categories={categories}
        categoryGroups={categoryGroups}
        brands={brands}
      />

      <ReserveDeclarationModal
        isOpen={reserveOpen}
        onClose={() => setReserveOpen(false)}
        onSuccess={() => { setReserveOpen(false); loadDashboard(); }}
      />
    </div>
  );
}
