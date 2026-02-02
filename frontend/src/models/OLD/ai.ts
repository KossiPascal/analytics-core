// src/models/ai.ts
export interface AIResponse {
  suggestedCharts?: string[]; // IDs de chart ou models
  anomalies?: any[];
  forecast?: any;
  text?: string; // pour NLP / Chat BI
}

export interface AskQuestionPayload {
  question: string;
  tenantId?: string | null;
  datasets?: { id: string; name: string }[];
  queries?: any[];
  charts?: any[];
}