import { useRef, useState, useEffect } from 'react';
import { Mic, MicOff, Upload, RotateCcw, Monitor, Blend } from 'lucide-react';
import { Button } from '@components/ui/Button/Button';
import styles from '../MeetingIntelligence.module.css';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type AudioSourceMode = 'mic' | 'screen' | 'both';

interface AudioCaptureProps {
  onAudioReady: (blob: Blob) => void;
  disabled?: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatTime(secs: number) {
  const m = Math.floor(secs / 60).toString().padStart(2, '0');
  const s = (secs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function getBestMimeType(): string {
  const types = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/mp4',
  ];
  return types.find((t) => MediaRecorder.isTypeSupported(t)) ?? '';
}

// Mix two MediaStreams (mic + system) into one via WebAudio API
function mixStreams(micStream: MediaStream, sysStream: MediaStream): MediaStream {
  const ctx  = new AudioContext();
  const dest = ctx.createMediaStreamDestination();

  if (micStream.getAudioTracks().length > 0) {
    ctx.createMediaStreamSource(micStream).connect(dest);
  }
  if (sysStream.getAudioTracks().length > 0) {
    ctx.createMediaStreamSource(sysStream).connect(dest);
  }
  return dest.stream;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function AudioCapture({ onAudioReady, disabled }: AudioCaptureProps) {
  const [mode,          setMode]          = useState<AudioSourceMode>('mic');
  const [isRecording,   setIsRecording]   = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob,     setAudioBlob]     = useState<Blob | null>(null);
  const [audioUrl,      setAudioUrl]      = useState<string | null>(null);
  const [fileName,      setFileName]      = useState<string | null>(null);
  const [error,         setError]         = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef        = useRef<Blob[]>([]);
  const timerRef         = useRef<ReturnType<typeof setInterval> | null>(null);
  const tracksRef        = useRef<MediaStreamTrack[]>([]); // all tracks to stop on end
  const fileInputRef     = useRef<HTMLInputElement>(null);

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    tracksRef.current.forEach((t) => t.stop());
  }, []);

  // ── Stream builders ───────────────────────────────────────────────────────

  const getMicStream = (): Promise<MediaStream> =>
    navigator.mediaDevices.getUserMedia({ audio: true, video: false });

  /**
   * getDisplayMedia requires video on most browsers.
   * We request a minimal 1×1 video then immediately stop those tracks.
   */
  const getScreenAudioStream = async (): Promise<MediaStream> => {
    const display = await (navigator.mediaDevices as any).getDisplayMedia({
      video: { width: 1, height: 1, frameRate: 1 },
      audio: {
        echoCancellation:  false,
        noiseSuppression:  false,
        autoGainControl:   false,
        sampleRate:        44100,
      },
    });
    // Stop video tracks — we only want audio
    display.getVideoTracks().forEach((t: MediaStreamTrack) => t.stop());

    if (display.getAudioTracks().length === 0) {
      throw new Error(
        "Aucune piste audio détectée. Assurez-vous de cocher « Partager l'audio du système » dans la boîte de dialogue."
      );
    }
    return display;
  };

  // ── Start recording ───────────────────────────────────────────────────────

  const startRecording = async () => {
    setError(null);
    tracksRef.current.forEach((t) => t.stop());
    tracksRef.current = [];

    try {
      let stream: MediaStream;

      if (mode === 'mic') {
        stream = await getMicStream();

      } else if (mode === 'screen') {
        stream = await getScreenAudioStream();

      } else {
        // Both: mic + system audio mixed
        const [micStream, sysStream] = await Promise.all([
          getMicStream(),
          getScreenAudioStream(),
        ]);
        tracksRef.current.push(
          ...micStream.getTracks(),
          ...sysStream.getTracks(),
        );
        stream = mixStreams(micStream, sysStream);
      }

      // Keep track of all tracks for cleanup
      tracksRef.current.push(...stream.getTracks());

      const mimeType = getBestMimeType();
      const mr = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = mr;
      chunksRef.current = [];

      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType || 'audio/webm' });
        const url  = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioUrl(url);
        setFileName(null);
        tracksRef.current.forEach((t) => t.stop());
      };

      mr.start(250);
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => setRecordingTime((t) => t + 1), 1000);

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('Permission denied') || msg.includes('NotAllowedError')) {
        setError("Accès refusé. Autorisez l'accès au microphone/écran dans les paramètres du navigateur.");
      } else {
        setError(msg);
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  // ── Reset ─────────────────────────────────────────────────────────────────
  const resetAudio = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioBlob(null);
    setAudioUrl(null);
    setFileName(null);
    setRecordingTime(0);
    setError(null);
  };

  // ── File upload ───────────────────────────────────────────────────────────
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioBlob(file);
    setAudioUrl(URL.createObjectURL(file));
    setFileName(file.name);
    setRecordingTime(0);
    setError(null);
  };

  // ── Confirm ───────────────────────────────────────────────────────────────
  const handleConfirm = () => {
    if (audioBlob) onAudioReady(audioBlob);
  };

  // ── Mode labels & icons ───────────────────────────────────────────────────
  const MODES: { key: AudioSourceMode; label: string; sub: string; icon: React.ReactNode }[] = [
    {
      key:   'mic',
      label: 'Microphone',
      sub:   'Voix en présentiel',
      icon:  <Mic size={18} />,
    },
    {
      key:   'screen',
      label: 'Écran / Application',
      sub:   'Zoom, Teams, navigateur…',
      icon:  <Monitor size={18} />,
    },
    {
      key:   'both',
      label: 'Micro + Écran',
      sub:   'Les deux sources mixées',
      icon:  <Blend size={18} />,
    },
  ];

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className={styles.audioCapture}>
      <h3 className={styles.stepTitle}>Source Audio</h3>
      <p className={styles.stepSubtitle}>
        Choisissez la source selon votre contexte, puis démarrez l'enregistrement.
      </p>

      {/* ── Source selector ── */}
      {!audioBlob && (
        <div className={styles.sourceModeGrid}>
          {MODES.map((m) => (
            <button
              key={m.key}
              type="button"
              className={`${styles.sourceModeCard} ${mode === m.key ? styles.selected : ''}`}
              onClick={() => { setMode(m.key); setError(null); }}
              disabled={isRecording}
            >
              <span className={styles.sourceModeIcon}>{m.icon}</span>
              <span className={styles.sourceModeName}>{m.label}</span>
              <span className={styles.sourceModeSub}>{m.sub}</span>
            </button>
          ))}
        </div>
      )}

      {/* ── Screen-share hint ── */}
      {!audioBlob && (mode === 'screen' || mode === 'both') && (
        <div className={styles.screenHint}>
          <Monitor size={14} />
          Le navigateur affichera une boîte de dialogue pour partager un onglet, une fenêtre ou
          l'écran entier. <strong>Cochez « Partager l'audio du système »</strong> pour
          capturer Zoom, Teams, etc.
        </div>
      )}

      {error && <div className={styles.errorBanner}>{error}</div>}

      {/* ── Recorder ── */}
      {!audioBlob && (
        <div className={styles.recorderBox}>
          <div className={`${styles.micIcon} ${isRecording ? styles.recording : ''}`}>
            {mode === 'screen' ? <Monitor size={32} />
            : mode === 'both'  ? <Blend   size={32} />
            :                    isRecording ? <MicOff size={32} /> : <Mic size={32} />}
          </div>

          {isRecording && (
            <div className={styles.recordingStatus}>
              <span className={styles.recordingDot} />
              <span className={styles.recordingTimer}>{formatTime(recordingTime)}</span>
            </div>
          )}

          <div className={styles.recorderActions}>
            {!isRecording ? (
              <Button
                variant="danger"
                onClick={startRecording}
                disabled={disabled}
                leftIcon={mode === 'screen' ? <Monitor size={16} /> : mode === 'both' ? <Blend size={16} /> : <Mic size={16} />}
              >
                Démarrer l'enregistrement
              </Button>
            ) : (
              <Button
                variant="secondary"
                onClick={stopRecording}
                leftIcon={<MicOff size={16} />}
              >
                Arrêter ({formatTime(recordingTime)})
              </Button>
            )}
          </div>

          <div className={styles.separator}><span>ou</span></div>

          <Button
            variant="ghost"
            onClick={() => fileInputRef.current?.click()}
            disabled={isRecording || disabled}
            leftIcon={<Upload size={16} />}
          >
            Importer un fichier audio
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*,.mp3,.mp4,.wav,.m4a,.ogg,.flac,.webm,.aac"
            style={{ display: 'none' }}
            onChange={handleFileUpload}
          />
          <p className={styles.hint}>Formats : MP3, MP4, WAV, M4A, OGG, FLAC, WEBM, AAC</p>
        </div>
      )}

      {/* ── Preview & confirm ── */}
      {audioBlob && audioUrl && (
        <div className={styles.previewBox}>
          <div className={styles.previewHeader}>
            <span className={styles.previewFileName}>
              {fileName ?? `Enregistrement — ${formatTime(recordingTime)}`}
            </span>
            <Button variant="ghost" size="sm" onClick={resetAudio} leftIcon={<RotateCcw size={14} />}>
              Recommencer
            </Button>
          </div>

          <audio src={audioUrl} controls className={styles.audioPlayer} />

          <Button variant="primary" onClick={handleConfirm} disabled={disabled} isFullWidth>
            Lancer la transcription →
          </Button>
        </div>
      )}
    </div>
  );
}
