// ============================================================================
// Meeting Intelligence — TypeScript Types
// ============================================================================

export type MeetingStatus = 'PENDING' | 'TRANSCRIBING' | 'TRANSCRIBED' | 'SUMMARIZING' | 'DONE' | 'FAILED';
export type AIProviderKey = 'gemini' | 'groq' | 'ollama';

export interface Meeting {
  id:             number;
  title:          string;
  description:    string | null;
  meeting_date:   string | null;
  status:         MeetingStatus;
  created_by_id:  number | null;
  created_at:     string;
  updated_at:     string;
  // Included in GET /api/meetings/<id>
  transcription?: MeetingTranscription;
  summary?:       MeetingSummary;
}

export interface MeetingTranscription {
  id:                 number;
  meeting_id:         number;
  audio_filename:     string | null;
  transcription_text: string | null;
  language:           string | null;
  duration_seconds:   number | null;
  created_at:         string;
}

export interface MeetingSummary {
  id:                number;
  meeting_id:        number;
  provider:          'GEMINI' | 'GROQ' | 'OLLAMA';
  model_used:        string | null;
  titre:             string | null;
  ordre_du_jour:     string | null;
  discussions:       string | null;
  prochaines_etapes: string | null;
  recommandations:   string | null;
  participants:      string[];
  raw_json:          Record<string, unknown> | null;
  created_at:        string;
}

export interface AIProvider {
  provider:      string;
  label:         string;
  default_model: string;
  configured:    boolean;
  type:          'cloud' | 'local';
}

export interface ReportFormValues {
  titre:             string;
  ordre_du_jour:     string;
  discussions:       string;
  prochaines_etapes: string;
  recommandations:   string;
  participants:      string;   // newline-separated for the textarea
}

export const STATUS_LABELS: Record<MeetingStatus, string> = {
  PENDING:      'En attente',
  TRANSCRIBING: 'Transcription...',
  TRANSCRIBED:  'Transcrit',
  SUMMARIZING:  'Résumé IA...',
  DONE:         'Terminé',
  FAILED:       'Échec',
};

export const STATUS_COLORS: Record<MeetingStatus, string> = {
  PENDING:      '#f59e0b',
  TRANSCRIBING: '#3b82f6',
  TRANSCRIBED:  '#06b6d4',
  SUMMARIZING:  '#8b5cf6',
  DONE:         '#22c55e',
  FAILED:       '#ef4444',
};

export const PROVIDER_LABELS: Record<string, string> = {
  GEMINI: 'Google Gemini Flash',
  GROQ:   'Groq (Llama 3.3)',
  OLLAMA: 'Ollama (local)',
};
