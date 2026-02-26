import { useEffect, useState } from 'react';
import { Trash2, FileDown, Eye, RefreshCw, Bot, Clock, FileText } from 'lucide-react';
import { Button } from '@components/ui/Button/Button';
import { meetingsApi } from '../api';
import { ReportEditor } from './ReportEditor';
import type { Meeting, MeetingSummary } from '../types';
import { STATUS_LABELS, STATUS_COLORS, PROVIDER_LABELS } from '../types';
import styles from '../MeetingIntelligence.module.css';

interface MeetingsListTabProps {
  refreshKey?: number;
}

export function MeetingsListTab({ refreshKey = 0 }: MeetingsListTabProps) {
  const [meetings,   setMeetings]   = useState<Meeting[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [selected,   setSelected]   = useState<{ meeting: Meeting; summary: MeetingSummary } | null>(null);
  const [deleting,   setDeleting]   = useState<number | null>(null);
  const [downloading, setDownloading] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await meetingsApi.getAll();
      setMeetings(res.data ?? []);
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [refreshKey]);

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer cette réunion et toutes ses données ?')) return;
    setDeleting(id);
    try {
      await meetingsApi.delete(id);
      setMeetings((prev) => prev.filter((m) => m.id !== id));
      if (selected?.meeting.id === id) setSelected(null);
    } finally {
      setDeleting(null);
    }
  };

  const handleOpenDetail = async (meeting: Meeting) => {
    try {
      const res = await meetingsApi.get(meeting.id);
      const m   = res.data;
      if (!m) { alert('Réunion introuvable.'); return; }
      if (m.summary) {
        setSelected({ meeting: m, summary: m.summary });
      } else {
        alert('Aucun résumé disponible pour cette réunion.');
      }
    } catch {
      alert('Erreur lors du chargement de la réunion.');
    }
  };

  const handleDownloadPdf = async (id: number) => {
    setDownloading(id);
    try {
      await meetingsApi.downloadPdf(id);
    } catch (err: unknown) {
      alert('Erreur PDF : ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setDownloading(null);
    }
  };

  if (selected) {
    return (
      <div>
        <div className={styles.backBar}>
          <Button variant="ghost" size="sm" onClick={() => setSelected(null)}>
            ← Retour à la liste
          </Button>
          <h4>{selected.meeting.title}</h4>
        </div>
        <ReportEditor
          meeting={selected.meeting}
          summary={selected.summary}
          onSaved={load}
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className={styles.loadingBox}>
        <RefreshCw size={24} className={styles.spin} />
        <span>Chargement des réunions…</span>
      </div>
    );
  }

  if (meetings.length === 0) {
    return (
      <div className={styles.emptyState}>
        <FileText size={48} strokeWidth={1} />
        <p>Aucune réunion enregistrée pour le moment.</p>
        <p className={styles.hint}>Utilisez l'onglet "Nouvelle Réunion" pour commencer.</p>
      </div>
    );
  }

  return (
    <div className={styles.meetingsList}>
      <div className={styles.listHeader}>
        <span>{meetings.length} réunion{meetings.length > 1 ? 's' : ''}</span>
        <Button variant="ghost" size="sm" onClick={load} leftIcon={<RefreshCw size={14} />}>
          Actualiser
        </Button>
      </div>

      {meetings.map((m) => (
        <div key={m.id} className={styles.meetingCard}>
          <div className={styles.cardMain}>
            {/* Status dot */}
            <span
              className={styles.statusDot}
              style={{ background: STATUS_COLORS[m.status] }}
              title={STATUS_LABELS[m.status]}
            />

            <div className={styles.cardInfo}>
              <div className={styles.cardTitle}>{m.title}</div>

              <div className={styles.cardMeta}>
                <span className={styles.metaItem}>
                  <Clock size={12} />
                  {new Date(m.created_at).toLocaleDateString('fr-FR', {
                    day: '2-digit', month: 'short', year: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  })}
                </span>
                {m.summary && (
                  <span className={styles.metaItem}>
                    <Bot size={12} />
                    {PROVIDER_LABELS[m.summary.provider] ?? m.summary.provider}
                  </span>
                )}
                <span
                  className={styles.statusBadge}
                  style={{ background: STATUS_COLORS[m.status] + '22', color: STATUS_COLORS[m.status] }}
                >
                  {STATUS_LABELS[m.status]}
                </span>
              </div>

              {m.description && (
                <p className={styles.cardDesc}>{m.description}</p>
              )}
            </div>
          </div>

          <div className={styles.cardActions}>
            {m.summary && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleOpenDetail(m)}
                  leftIcon={<Eye size={14} />}
                >
                  Voir / Éditer
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownloadPdf(m.id)}
                  isLoading={downloading === m.id}
                  leftIcon={<FileDown size={14} />}
                >
                  PDF
                </Button>
              </>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(m.id)}
              isLoading={deleting === m.id}
            >
              <Trash2 size={14} style={{ color: 'var(--danger)' }} />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
