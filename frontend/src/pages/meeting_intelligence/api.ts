// ============================================================================
// Meeting Intelligence — Centralized API Functions
// ============================================================================

import { api } from '@/apis/api';
import type { Meeting, MeetingTranscription, MeetingSummary, AIProvider } from './types';

const BASE = '/meetings';

export const meetingsApi = {

  // ─── Providers ─────────────────────────────────────────────────────────────
  getProviders: () =>
    api.get<AIProvider[]>(`${BASE}/providers`),

  // ─── Meetings ──────────────────────────────────────────────────────────────
  getAll: () =>
    api.get<Meeting[]>(BASE),

  create: (data: { title: string; description?: string; meeting_date?: string }) =>
    api.post<Meeting>(BASE, data),

  get: (id: number) =>
    api.get<Meeting>(`${BASE}/${id}`),

  delete: (id: number) =>
    api.delete(`${BASE}/${id}`),

  // ─── Transcription (multipart) ──────────────────────────────────────────────
  transcribe: (id: number, audioBlob: Blob, language = 'fr') => {
    const formData = new FormData();
    const ext = audioBlob.type.includes('webm') ? 'webm'
      : audioBlob.type.includes('mp4') ? 'mp4'
      : audioBlob.type.includes('wav') ? 'wav'
      : 'audio';
    formData.append('audio', audioBlob, `enregistrement_${id}.${ext}`);
    formData.append('language', language);
    return api.post<MeetingTranscription>(`${BASE}/${id}/transcribe`, formData);
  },

  getTranscription: (id: number) =>
    api.get<MeetingTranscription>(`${BASE}/${id}/transcription`),

  getStatus: (id: number) =>
    api.get<{ id: number; status: string; has_transcription: boolean; has_summary: boolean }>(
      `${BASE}/${id}/status`
    ),

  // ─── Summarization ──────────────────────────────────────────────────────────
  summarize: (id: number, provider: string, model?: string) =>
    api.post<MeetingSummary>(`${BASE}/${id}/summarize`, { provider, ...(model && { model }) }),

  getLatestSummary: (id: number) =>
    api.get<MeetingSummary>(`${BASE}/${id}/summary`),

  getSummaries: (id: number) =>
    api.get<MeetingSummary[]>(`${BASE}/${id}/summaries`),

  // ─── Summary edit ───────────────────────────────────────────────────────────
  updateSummary: (meetingId: number, summaryId: number, data: Partial<MeetingSummary>) =>
    api.put<MeetingSummary>(`${BASE}/${meetingId}/summaries/${summaryId}`, data),

  // ─── PDF download ───────────────────────────────────────────────────────────
  downloadPdf: async (meetingId: number): Promise<void> => {
    // Get auth token from localStorage (set by the auth module)
    const token =
      localStorage.getItem('access_token') ||
      localStorage.getItem('token') ||
      '';

    const response = await fetch(`/api/meetings/${meetingId}/pdf`, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || 'Erreur lors de la génération du PDF');
    }

    const blob = await response.blob();
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `rapport_reunion_${meetingId}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },
};
