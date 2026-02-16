import { useState, useEffect } from 'react';
import { Modal } from '@components/ui/Modal/Modal';
import { Button } from '@components/ui/Button/Button';
import { Badge } from '@components/ui/Badge/Badge';
import { Spinner } from '@components/ui/Spinner/Spinner';
import { FormInput } from '@/components/forms/FormInput/FormInput';
import { Send, CheckCircle, ArrowRight, XCircle, MessageCircle, Wrench } from 'lucide-react';
import { ticketsApi } from '../../api';
import type { RepairTicket, TicketEvent, TicketComment, Issue } from '../../types';
import { STATUS_LABELS, STAGE_LABELS } from '../../types';
import styles from '../../EquipmentManager.module.css';
import shared from '@components/ui/styles/shared.module.css';
import toast from 'react-hot-toast';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  ticketId: string | null;
  onAction: () => void;
  onSend: (ticketId: string) => void;
  onReceive: (ticketId: string) => void;
  onRepair: (ticketId: string) => void;
  onCancel: (ticketId: string) => void;
}

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'secondary'> = {
  OPEN: 'warning', IN_PROGRESS: 'info', REPAIRED: 'success', RETURNING: 'info', CLOSED: 'success', CANCELLED: 'danger',
};

const EVENT_CLASS: Record<string, string> = {
  CREATED: 'created', SENT: 'sent', RECEIVED: 'received', REPAIRED: 'repaired', CANCELLED: 'cancelled',
};

export function TicketDetailModal({ isOpen, onClose, ticketId, onAction, onSend, onReceive, onRepair, onCancel }: Props) {
  const [ticket, setTicket] = useState<(RepairTicket & { events: TicketEvent[]; comments: TicketComment[]; issues: Issue[] }) | null>(null);
  const [loading, setLoading] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [commenting, setCommenting] = useState(false);

  useEffect(() => {
    if (isOpen && ticketId) loadDetail();
  }, [isOpen, ticketId]);

  const loadDetail = async () => {
    if (!ticketId) return;
    setLoading(true);
    const res = await ticketsApi.get(ticketId);
    if (res.success) setTicket(res.data!);
    setLoading(false);
  };

  const handleAddComment = async () => {
    if (!ticketId || !newComment.trim()) return;
    setCommenting(true);
    const res = await ticketsApi.addComment(ticketId, { comment: newComment });
    if (res.success) {
      toast.success('Commentaire ajoute');
      setNewComment('');
      loadDetail();
    } else {
      toast.error('Erreur');
    }
    setCommenting(false);
  };

  const canAct = ticket && !['CLOSED', 'CANCELLED'].includes(ticket.status);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={ticket ? `Ticket ${ticket.ticket_number}` : 'Detail Ticket'} size="xl">
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}><Spinner /></div>
      ) : ticket ? (
        <div>
          {/* Header info */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            <Badge variant={STATUS_VARIANT[ticket.status]}>{STATUS_LABELS[ticket.status]}</Badge>
            <Badge variant="info">{ticket.current_stage_label}</Badge>
            <Badge variant={ticket.delay_color === 'red' ? 'danger' : ticket.delay_color === 'yellow' ? 'warning' : 'success'}>
              {ticket.delay_days} jours
            </Badge>
            {ticket.is_blocked && <Badge variant="danger">Bloque</Badge>}
          </div>

          {/* Detail grid */}
          <div className={styles.detailGrid}>
            <div className={styles.detailItem}><span className={styles.detailLabel}>Equipement</span><span className={styles.detailValue}>{ticket.equipment_brand} {ticket.equipment_model} ({ticket.equipment_imei})</span></div>
            <div className={styles.detailItem}><span className={styles.detailLabel}>ASC</span><span className={styles.detailValue}>{ticket.asc_name}</span></div>
            <div className={styles.detailItem}><span className={styles.detailLabel}>Date creation</span><span className={styles.detailValue}>{ticket.created_at ? new Date(ticket.created_at).toLocaleDateString('fr') : '-'}</span></div>
            <div className={styles.detailItem}><span className={styles.detailLabel}>Jours a l'etape</span><span className={styles.detailValue}>{ticket.days_at_current_stage}j</span></div>
          </div>

          {/* Problem description */}
          <h4 className={styles.sectionTitle}>Description du probleme</h4>
          <p style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>{ticket.initial_problem_description}</p>

          {/* Issues */}
          {ticket.issues && ticket.issues.length > 0 && (
            <div className={styles.badgeGroup} style={{ marginBottom: '1rem' }}>
              {ticket.issues.map((i) => (
                <Badge key={i.id} variant="warning">{i.problem_type_name} ({i.problem_type_category})</Badge>
              ))}
            </div>
          )}

          {/* Resolution notes */}
          {ticket.resolution_notes && (
            <>
              <h4 className={styles.sectionTitle}>Notes de resolution</h4>
              <p style={{ fontSize: '0.875rem' }}>{ticket.resolution_notes}</p>
            </>
          )}

          {/* Actions */}
          {canAct && (
            <>
              <h4 className={styles.sectionTitle}>Actions</h4>
              <div className={shared.buttonGroup}>
                <Button variant="primary" size="sm" onClick={() => onReceive(ticket.id)}>
                  <CheckCircle size={16} /> Confirmer reception
                </Button>
                <Button variant="secondary" size="sm" onClick={() => onSend(ticket.id)}>
                  <ArrowRight size={16} /> Envoyer
                </Button>
                <Button variant="success" size="sm" onClick={() => onRepair(ticket.id)}>
                  <Wrench size={16} /> Marquer repare
                </Button>
                <Button variant="danger" size="sm" onClick={() => onCancel(ticket.id)}>
                  <XCircle size={16} /> Annuler
                </Button>
              </div>
            </>
          )}

          {/* Timeline */}
          {ticket.events && ticket.events.length > 0 && (
            <>
              <h4 className={styles.sectionTitle}>Historique</h4>
              <div className={styles.timeline}>
                {ticket.events.map((ev) => (
                  <div key={ev.id} className={`${styles.timelineItem} ${styles[EVENT_CLASS[ev.event_type] || ''] || ''}`}>
                    <div className={styles.timelineContent}>
                      <span className={styles.timelineTitle}>
                        {ev.event_type} — {ev.from_role_label} → {ev.to_role_label}
                      </span>
                      <span className={styles.timelineTime}>
                        {ev.timestamp ? new Date(ev.timestamp).toLocaleString('fr') : '-'}
                      </span>
                      {ev.comment && <span className={styles.timelineComment}>{ev.comment}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Comments */}
          <h4 className={styles.sectionTitle}>Commentaires ({ticket.comments?.length || 0})</h4>
          <div className={styles.commentsSection}>
            {ticket.comments?.map((c) => (
              <div key={c.id} className={styles.commentItem}>
                <div className={styles.commentHeader}>
                  <span>Utilisateur #{c.user_id}</span>
                  <span>{c.created_at ? new Date(c.created_at).toLocaleString('fr') : ''}</span>
                </div>
                <div className={styles.commentText}>{c.comment}</div>
              </div>
            ))}
            <div className={styles.commentInput}>
              <FormInput
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Ajouter un commentaire..."
              />
              <Button size="sm" onClick={handleAddComment} isLoading={commenting} disabled={!newComment.trim()}>
                <MessageCircle size={16} />
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}
