import { useState, useEffect } from 'react';
import { Button } from '@components/ui/Button/Button';
import { FormSelect } from '@/components/forms/FormSelect/FormSelect';
import { Plus } from 'lucide-react';
import { ticketsApi } from '../../api';
import type { RepairTicket } from '../../types';
import { STATUS_LABELS, STAGE_LABELS } from '../../types';
import { TicketsTable } from './TicketsTable';
import { TicketCreateModal } from './TicketCreateModal';
import { TicketDetailModal } from './TicketDetailModal';
import { TicketSendModal } from './TicketSendModal';
import { TicketReceiveModal } from './TicketReceiveModal';
import { TicketRepairModal } from './TicketRepairModal';
import { TicketCancelModal } from './TicketCancelModal';
import { ProblemTypesManager } from './ProblemTypesManager';
import { AlertRecipientsManager } from './AlertRecipientsManager';
import styles from '../../EquipmentManager.module.css';
import toast from 'react-hot-toast';

type SubView = 'tickets' | 'problem-types' | 'alerts';

export function TicketsTab() {
  const [tickets, setTickets] = useState<RepairTicket[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [subView, setSubView] = useState<SubView>('tickets');

  // Modal states
  const [createOpen, setCreateOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [sendOpen, setSendOpen] = useState(false);
  const [sendId, setSendId] = useState<string | null>(null);
  const [receiveOpen, setReceiveOpen] = useState(false);
  const [receiveId, setReceiveId] = useState<string | null>(null);
  const [repairOpen, setRepairOpen] = useState(false);
  const [repairId, setRepairId] = useState<string | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelId, setCancelId] = useState<string | null>(null);

  useEffect(() => { loadTickets(); }, [statusFilter, stageFilter]);

  const loadTickets = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (statusFilter) params.status = statusFilter;
      if (stageFilter) params.stage = stageFilter;
      const res = await ticketsApi.getAll(params);
      if (res.success) setTickets(res.data!);
    } catch {
      toast.error('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleActionDone = () => {
    loadTickets();
    // Reload detail if open
    if (detailOpen && detailId) {
      setDetailOpen(false);
      setTimeout(() => setDetailOpen(true), 100);
    }
  };

  const statusOptions = [
    { value: '', label: 'Tous les statuts' },
    ...Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label })),
  ];

  const stageOptions = [
    { value: '', label: 'Toutes les etapes' },
    ...Object.entries(STAGE_LABELS).map(([value, label]) => ({ value, label })),
  ];

  const SUB_VIEWS: { key: SubView; label: string }[] = [
    { key: 'tickets', label: 'Tickets' },
    { key: 'problem-types', label: 'Types de problemes' },
    { key: 'alerts', label: 'Alertes' },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div className={styles.subTabsList}>
          {SUB_VIEWS.map((sv) => (
            <button
              key={sv.key}
              className={`${styles.subTabItem} ${subView === sv.key ? styles.active : ''}`}
              onClick={() => setSubView(sv.key)}
            >
              {sv.label}
            </button>
          ))}
        </div>
        {subView === 'tickets' && (
          <Button size="sm" leftIcon={<Plus size={16} />} onClick={() => setCreateOpen(true)}>
            Nouveau Ticket
          </Button>
        )}
      </div>

      {subView === 'tickets' && (
        <>
          <div className={styles.filterBar}>
            <div className={styles.filterItem}>
              <FormSelect label="Statut" value={statusFilter} onChange={(v) => setStatusFilter(v)} options={statusOptions} />
            </div>
            <div className={styles.filterItem}>
              <FormSelect label="Etape" value={stageFilter} onChange={(v) => setStageFilter(v)} options={stageOptions} />
            </div>
          </div>

          <TicketsTable
            data={tickets}
            isLoading={loading}
            onView={(t) => { setDetailId(t.id); setDetailOpen(true); }}
            onSend={(id) => { setSendId(id); setSendOpen(true); }}
            onReceive={(id) => { setReceiveId(id); setReceiveOpen(true); }}
            onRepair={(id) => { setRepairId(id); setRepairOpen(true); }}
            onCancel={(id) => { setCancelId(id); setCancelOpen(true); }}
          />
        </>
      )}

      {subView === 'problem-types' && <ProblemTypesManager />}
      {subView === 'alerts' && <AlertRecipientsManager />}

      {/* Modals */}
      <TicketCreateModal isOpen={createOpen} onClose={() => setCreateOpen(false)} onSuccess={loadTickets} />

      <TicketDetailModal
        isOpen={detailOpen}
        onClose={() => setDetailOpen(false)}
        ticketId={detailId}
        onAction={handleActionDone}
        onSend={(id) => { setSendId(id); setSendOpen(true); }}
        onReceive={(id) => { setReceiveId(id); setReceiveOpen(true); }}
        onRepair={(id) => { setRepairId(id); setRepairOpen(true); }}
        onCancel={(id) => { setCancelId(id); setCancelOpen(true); }}
      />

      <TicketSendModal isOpen={sendOpen} onClose={() => setSendOpen(false)} onSuccess={handleActionDone} ticketId={sendId} />
      <TicketReceiveModal isOpen={receiveOpen} onClose={() => setReceiveOpen(false)} onSuccess={handleActionDone} ticketId={receiveId} />
      <TicketRepairModal isOpen={repairOpen} onClose={() => setRepairOpen(false)} onSuccess={handleActionDone} ticketId={repairId} />
      <TicketCancelModal isOpen={cancelOpen} onClose={() => setCancelOpen(false)} onSuccess={handleActionDone} ticketId={cancelId} />
    </div>
  );
}
