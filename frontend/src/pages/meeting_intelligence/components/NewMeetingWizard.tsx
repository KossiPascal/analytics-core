import { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, Loader2, Mic2, FileText, Sparkles } from 'lucide-react';
import { Button } from '@components/ui/Button/Button';
import { AudioCapture } from './AudioCapture';
import { ReportEditor } from './ReportEditor';
import { meetingsApi } from '../api';
import type { Meeting, MeetingSummary, AIProvider } from '../types';
import styles from '../MeetingIntelligence.module.css';

type WizardStep = 'info' | 'audio' | 'processing' | 'report';

interface ProcessingPhase {
  label:  string;
  done:   boolean;
  active: boolean;
  error:  boolean;
}

interface NewMeetingWizardProps {
  onMeetingCreated?: () => void;
}

export function NewMeetingWizard({ onMeetingCreated }: NewMeetingWizardProps) {
  const [step,     setStep]     = useState<WizardStep>('info');
  const [meeting,  setMeeting]  = useState<Meeting | null>(null);
  const [summary,  setSummary]  = useState<MeetingSummary | null>(null);
  const [providers, setProviders] = useState<AIProvider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string>('gemini');
  const [selectedLanguage,  setSelectedLanguage]  = useState<string>('fr');
  const [phases, setPhases] = useState<ProcessingPhase[]>([]);
  const [globalError, setGlobalError] = useState<string | null>(null);

  // Form state for step 1
  const [title,        setTitle]        = useState('');
  const [description,  setDescription]  = useState('');
  const [meetingDate,  setMeetingDate]  = useState('');

  useEffect(() => {
    meetingsApi.getProviders()
      .then((res) => {
        const data = res.data ?? [];
        setProviders(data);
        const first = data.find((p) => p.configured);
        if (first) setSelectedProvider(first.provider);
      })
      .catch(() => {/* silent */});
  }, []);

  // ── Step 1: Create meeting record ──────────────────────────────────────────
  const handleInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setGlobalError(null);
    try {
      const res = await meetingsApi.create({
        title:        title.trim(),
        description:  description.trim() || undefined,
        meeting_date: meetingDate || undefined,
      });
      if (!res.success || !res.data) {
        setGlobalError(res.message || 'Erreur lors de la création de la réunion.');
        return;
      }
      setMeeting(res.data);
      setStep('audio');
    } catch (err: unknown) {
      setGlobalError('Erreur lors de la création de la réunion.');
    }
  };

  // ── Polling helper ─────────────────────────────────────────────────────────
  /**
   * Polls GET /status every 3 seconds until `predicate` returns true or status=FAILED.
   * Rejects after maxWaitMs (default 20 min).
   */
  const pollUntil = (
    meetingId: number,
    predicate: (s: { status: string; has_transcription: boolean; has_summary: boolean }) => boolean,
    maxWaitMs = 20 * 60 * 1000,
  ): Promise<void> =>
    new Promise((resolve, reject) => {
      const start    = Date.now();
      const interval = setInterval(async () => {
        try {
          const res  = await meetingsApi.getStatus(meetingId);
          const data = res.data;
          if (!data) return;

          if (data.status === 'FAILED') {
            clearInterval(interval);
            reject(new Error('La transcription a échoué côté serveur.'));
            return;
          }
          if (predicate(data)) {
            clearInterval(interval);
            resolve();
            return;
          }
          if (Date.now() - start > maxWaitMs) {
            clearInterval(interval);
            reject(new Error('Délai maximum dépassé.'));
          }
        } catch (err) {
          clearInterval(interval);
          reject(err);
        }
      }, 3000);
    });

  // ── Step 2→3: Audio ready → auto-process ───────────────────────────────────
  const handleAudioReady = async (audioBlob: Blob) => {
    if (!meeting) return;
    setGlobalError(null);

    const initPhases: ProcessingPhase[] = [
      { label: 'Envoi du fichier audio…',            done: false, active: true,  error: false },
      { label: 'Transcription WhisperX en cours…',   done: false, active: false, error: false },
      { label: `Résumé IA (${selectedProvider})…`,   done: false, active: false, error: false },
      { label: 'Sauvegarde en base de données',       done: false, active: false, error: false },
    ];
    setPhases(initPhases);
    setStep('processing');

    const update = (idx: number, patch: Partial<ProcessingPhase>) =>
      setPhases((prev) => prev.map((p, i) => (i === idx ? { ...p, ...patch } : p)));

    try {
      // Phase 0 — Upload (backend returns 202 immediately)
      update(0, { active: true });
      const transcribeRes = await meetingsApi.transcribe(meeting.id, audioBlob, selectedLanguage);
      if (!transcribeRes.success) {
        throw new Error(transcribeRes.message || "Erreur lors de l'envoi du fichier audio.");
      }
      update(0, { done: true, active: false });

      // Phase 1 — Poll until WhisperX finishes (status → TRANSCRIBED)
      update(1, { active: true });
      await pollUntil(meeting.id, (s) => s.has_transcription);
      update(1, { done: true, active: false });

      // Phase 2 — AI Summarization (synchronous, provider responds < 30 s)
      update(2, { active: true, label: `Résumé IA (${selectedProvider})…` });
      const summaryRes = await meetingsApi.summarize(meeting.id, selectedProvider);
      update(2, { done: true, active: false });

      // Phase 3 — Visual confirmation
      update(3, { active: true });
      await new Promise((r) => setTimeout(r, 400));
      update(3, { done: true, active: false });

      setSummary(summaryRes.data ?? null);
      onMeetingCreated?.();
      setStep('report');

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setGlobalError(`Traitement échoué : ${msg}`);
      setPhases((prev) =>
        prev.map((p) => p.active ? { ...p, active: false, error: true } : p)
      );
    }
  };

  // ── Step 4: Back to fresh wizard ───────────────────────────────────────────
  const handleReset = () => {
    setStep('info');
    setMeeting(null);
    setSummary(null);
    setTitle('');
    setDescription('');
    setMeetingDate('');
    setPhases([]);
    setGlobalError(null);
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  if (step === 'info') {
    return (
      <div className={styles.wizard}>
        <div className={styles.wizardSteps}>
          <WizardStepIndicator steps={STEP_LABELS} active={0} />
        </div>

        <form className={styles.infoForm} onSubmit={handleInfoSubmit}>
          <h3 className={styles.stepTitle}>Informations de la réunion</h3>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Titre <span className={styles.required}>*</span></label>
            <input
              className={styles.fieldInput}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex : Réunion de coordination mensuelle"
              required
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Description</label>
            <textarea
              className={styles.fieldTextarea}
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Contexte ou ordre du jour prévu..."
            />
          </div>

          <div className={styles.formRow}>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Date de la réunion</label>
              <input
                type="datetime-local"
                className={styles.fieldInput}
                value={meetingDate}
                onChange={(e) => setMeetingDate(e.target.value)}
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Langue audio</label>
              <select
                className={styles.fieldInput}
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
              >
                <option value="fr">Français</option>
                <option value="en">Anglais</option>
                <option value="es">Espagnol</option>
                <option value="de">Allemand</option>
                <option value="pt">Portugais</option>
              </select>
            </div>
          </div>

          {/* AI Provider selection */}
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>
              <Sparkles size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
              Assistant IA pour le résumé
            </label>
            <div className={styles.providerCards}>
              {providers.length === 0 && (
                <p className={styles.hint}>Chargement des providers…</p>
              )}
              {providers.map((p) => (
                <button
                  key={p.provider}
                  type="button"
                  className={`${styles.providerCard} ${
                    selectedProvider === p.provider ? styles.selected : ''
                  } ${!p.configured ? styles.unconfigured : ''}`}
                  onClick={() => p.configured && setSelectedProvider(p.provider)}
                  disabled={!p.configured}
                >
                  <span className={styles.providerName}>{p.label}</span>
                  <span className={styles.providerModel}>{p.default_model}</span>
                  <span className={`${styles.providerBadgeTag} ${p.type === 'local' ? styles.local : styles.cloud}`}>
                    {p.type === 'local' ? 'Local' : 'Cloud'}
                  </span>
                  {!p.configured && (
                    <span className={styles.notConfigured}>Non configuré</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {globalError && <div className={styles.errorBanner}>{globalError}</div>}

          <Button type="submit" variant="primary" isFullWidth>
            Suivant : Enregistrement audio →
          </Button>
        </form>
      </div>
    );
  }

  if (step === 'audio') {
    return (
      <div className={styles.wizard}>
        <div className={styles.wizardSteps}>
          <WizardStepIndicator steps={STEP_LABELS} active={1} />
        </div>
        <AudioCapture onAudioReady={handleAudioReady} />
        {globalError && <div className={styles.errorBanner}>{globalError}</div>}
      </div>
    );
  }

  if (step === 'processing') {
    return (
      <div className={styles.wizard}>
        <div className={styles.wizardSteps}>
          <WizardStepIndicator steps={STEP_LABELS} active={2} />
        </div>

        <div className={styles.processingBox}>
          <h3 className={styles.stepTitle}>Traitement en cours…</h3>
          <p className={styles.stepSubtitle}>
            Veuillez patienter. La transcription peut prendre quelques minutes
            selon la durée de l'enregistrement.
          </p>

          <div className={styles.phases}>
            {phases.map((ph, i) => (
              <div
                key={i}
                className={`${styles.phase} ${
                  ph.done   ? styles.phaseDone   :
                  ph.active ? styles.phaseActive :
                  ph.error  ? styles.phaseError  : ''
                }`}
              >
                <span className={styles.phaseIcon}>
                  {ph.done   && <CheckCircle size={18} />}
                  {ph.active && <Loader2     size={18} className={styles.spin} />}
                  {ph.error  && <AlertCircle size={18} />}
                  {!ph.done && !ph.active && !ph.error && (
                    <span className={styles.phaseDot} />
                  )}
                </span>
                <span className={styles.phaseLabel}>{ph.label}</span>
              </div>
            ))}
          </div>

          {globalError && (
            <div className={styles.errorBanner} style={{ marginTop: '1rem' }}>
              {globalError}
              <Button variant="ghost" size="sm" onClick={handleReset} style={{ marginTop: '0.5rem' }}>
                Recommencer
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (step === 'report' && meeting && summary) {
    return (
      <div className={styles.wizard}>
        <div className={styles.wizardSteps}>
          <WizardStepIndicator steps={STEP_LABELS} active={3} />
        </div>

        <div className={styles.successBanner}>
          <CheckCircle size={18} />
          Rapport généré avec succès — modifiez les champs puis téléchargez le PDF.
        </div>

        <ReportEditor
          meeting={meeting}
          summary={summary}
          onSaved={onMeetingCreated}
        />

        <div style={{ marginTop: '1rem', textAlign: 'center' }}>
          <Button variant="ghost" size="sm" onClick={handleReset}>
            Nouvelle réunion
          </Button>
        </div>
      </div>
    );
  }

  return null;
}

// ── Step indicator ──────────────────────────────────────────────────────────

const STEP_LABELS = [
  { label: 'Infos',          icon: <FileText size={15} /> },
  { label: 'Audio',          icon: <Mic2     size={15} /> },
  { label: 'Traitement',     icon: <Loader2  size={15} /> },
  { label: 'Rapport / PDF',  icon: <FileText size={15} /> },
];

function WizardStepIndicator({
  steps,
  active,
}: {
  steps: { label: string; icon: React.ReactNode }[];
  active: number;
}) {
  return (
    <div className={styles.stepIndicator}>
      {steps.map((s, i) => (
        <div key={i} className={styles.stepIndicatorItem}>
          <div
            className={`${styles.stepCircle} ${
              i < active  ? styles.stepDone   :
              i === active ? styles.stepActive : ''
            }`}
          >
            {i < active ? <CheckCircle size={15} /> : s.icon}
          </div>
          <span className={`${styles.stepLabel} ${i === active ? styles.stepLabelActive : ''}`}>
            {s.label}
          </span>
          {i < steps.length - 1 && (
            <div className={`${styles.stepConnector} ${i < active ? styles.connectorDone : ''}`} />
          )}
        </div>
      ))}
    </div>
  );
}
