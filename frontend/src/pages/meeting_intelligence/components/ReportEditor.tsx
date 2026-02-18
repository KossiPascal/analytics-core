import { useState } from 'react';
import { Save, FileDown, Bot, Clock } from 'lucide-react';
import { Button } from '@components/ui/Button/Button';
import { meetingsApi } from '../api';
import type { Meeting, MeetingSummary, ReportFormValues } from '../types';
import { PROVIDER_LABELS as PL } from '../types';
import styles from '../MeetingIntelligence.module.css';

interface ReportEditorProps {
  meeting:    Meeting;
  summary:    MeetingSummary;
  onSaved?:   () => void;
}

export function ReportEditor({ meeting, summary, onSaved }: ReportEditorProps) {
  const [form, setForm] = useState<ReportFormValues>({
    titre:             summary.titre             ?? '',
    ordre_du_jour:     summary.ordre_du_jour     ?? '',
    discussions:       summary.discussions       ?? '',
    prochaines_etapes: summary.prochaines_etapes ?? '',
    recommandations:   summary.recommandations   ?? '',
    participants:      (summary.participants ?? []).join('\n'),
  });

  const [isSaving,   setIsSaving]   = useState(false);
  const [isPdf,      setIsPdf]      = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle');

  const set = (key: keyof ReportFormValues) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  const buildPayload = () => ({
    titre:             form.titre,
    ordre_du_jour:     form.ordre_du_jour,
    discussions:       form.discussions,
    prochaines_etapes: form.prochaines_etapes,
    recommandations:   form.recommandations,
    participants:      form.participants.split('\n').map((p) => p.trim()).filter(Boolean),
  });

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus('idle');
    try {
      await meetingsApi.updateSummary(meeting.id, summary.id, buildPayload() as any);
      setSaveStatus('saved');
      onSaved?.();
      setTimeout(() => setSaveStatus('idle'), 2500);
    } catch {
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadPdf = async () => {
    setIsPdf(true);
    try {
      // Save first, then download
      await meetingsApi.updateSummary(meeting.id, summary.id, buildPayload() as any);
      await meetingsApi.downloadPdf(meeting.id);
    } catch (err: unknown) {
      alert('Erreur lors de la génération du PDF : ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsPdf(false);
    }
  };

  const providerLabel = PL[summary.provider] ?? summary.provider;

  return (
    <div className={styles.reportEditor}>

      {/* ── Header ── */}
      <div className={styles.reportHeader}>
        <div className={styles.reportMeta}>
          <h3 className={styles.reportTitle}>Rapport de Réunion</h3>
          <div className={styles.reportBadges}>
            <span className={styles.providerBadge}>
              <Bot size={13} /> {providerLabel}
            </span>
            {summary.model_used && (
              <span className={styles.modelBadge}>{summary.model_used}</span>
            )}
            <span className={styles.dateBadge}>
              <Clock size={12} />
              {new Date(summary.created_at).toLocaleDateString('fr-FR', {
                day: '2-digit', month: 'short', year: 'numeric',
              })}
            </span>
          </div>
        </div>

        <div className={styles.reportActions}>
          {saveStatus === 'saved' && (
            <span className={styles.savedMsg}>Enregistré</span>
          )}
          {saveStatus === 'error' && (
            <span className={styles.errorMsg}>Erreur de sauvegarde</span>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSave}
            isLoading={isSaving}
            leftIcon={<Save size={15} />}
          >
            Sauvegarder
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleDownloadPdf}
            isLoading={isPdf}
            leftIcon={<FileDown size={15} />}
          >
            Télécharger PDF
          </Button>
        </div>
      </div>

      {/* ── Form fields ── */}
      <div className={styles.reportFields}>

        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>Titre de la réunion</label>
          <input
            className={styles.fieldInput}
            value={form.titre}
            onChange={set('titre')}
            placeholder="Ex : Réunion mensuelle de coordination"
          />
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>Participants</label>
          <textarea
            className={styles.fieldTextarea}
            rows={3}
            value={form.participants}
            onChange={set('participants')}
            placeholder="Un participant par ligne&#10;Ex :&#10;Dr Jean Dupont&#10;Mme Aïcha Koné"
          />
          <span className={styles.fieldHint}>Un nom par ligne</span>
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>Ordre du jour</label>
          <textarea
            className={styles.fieldTextarea}
            rows={4}
            value={form.ordre_du_jour}
            onChange={set('ordre_du_jour')}
            placeholder="Points abordés lors de la réunion..."
          />
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>Points discutés</label>
          <textarea
            className={styles.fieldTextarea}
            rows={6}
            value={form.discussions}
            onChange={set('discussions')}
            placeholder="Grandes lignes des échanges et débats..."
          />
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>Prochaines étapes & Décisions</label>
          <textarea
            className={styles.fieldTextarea}
            rows={5}
            value={form.prochaines_etapes}
            onChange={set('prochaines_etapes')}
            placeholder="Décisions prises, actions à mener, responsables..."
          />
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>Recommandations</label>
          <textarea
            className={styles.fieldTextarea}
            rows={4}
            value={form.recommandations}
            onChange={set('recommandations')}
            placeholder="Recommandations formulées par les participants..."
          />
        </div>

      </div>

      {/* ── Bottom actions ── */}
      <div className={styles.reportBottomActions}>
        <Button
          variant="ghost"
          onClick={handleSave}
          isLoading={isSaving}
          leftIcon={<Save size={15} />}
        >
          Sauvegarder les modifications
        </Button>
        <Button
          variant="primary"
          onClick={handleDownloadPdf}
          isLoading={isPdf}
          leftIcon={<FileDown size={15} />}
        >
          Générer et télécharger le PDF
        </Button>
      </div>

    </div>
  );
}
