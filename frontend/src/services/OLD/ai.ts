// src/api/ai.ts
import { api } from "../../apis/api";
import { AIResponse, AskQuestionPayload } from "@models/OLD/ai";

// Types complémentaires pour l'AI
export type AISuggestionContext = {
  datasetId?: string;
  chartId?: string;
  dashboardId?: string;
};

export type AIExplainPayload = {
  targetType: "chart" | "query" | "dashboard" | "dataset";
  targetId: string;
};

export type AIChatResponse = AIResponse & {
  content: string;

  // Actions auto-générées par l'IA
  createQuery?: {
    sql: string;
    datasetId: string;
  };

  createChart?: {
    type: string;
    config: any;
  };

  createReport?: {
    title: string;
    charts: string[];
  };
};

export default {
  // SUGGESTIONS
  getSuggestions: async (prompt: string, context?: AISuggestionContext): Promise<AIResponse> => {
    const res = await api.post(`/ai/suggestions`, { prompt, context });
    if (!res.success) {
      throw new Error("Failed to get AI suggestions");
    }
    return res.data;
  },

  // ANOMALY DETECTION
  detectAnomalies: async (chartId: string): Promise<AIResponse> => {
    const res = await api.post(`/ai/anomalies`, { chart_id: chartId });
    if (!res.success) {
      throw new Error("Failed to detect anomalies");
    }
    return res.data;
  },

  // EXPLANATION / INSIGHTS
  explain: async (payload: AIExplainPayload): Promise<AIResponse> => {
    const res = await api.post(`/ai/explain`, payload);
    if (!res.success) {
      throw new Error("Failed to generate AI explanation");
    }
    return res.data;
  },

  // CHAT BI (CORE)
  askQuestion: async (payload: AskQuestionPayload): Promise<AIChatResponse> => {
    const res = await api.post(`/ai/chat`, payload);
    if (!res.success) {
      throw new Error("AI Chat failed");
    }
    return res.data;
  },

  // AUTO-GENERATION
  autoCreateQuery: async (question: string, datasetId: string) => {
    const res = await api.post(`/ai/auto/query`, { question, datasetId });
    if (!res.success) {
      throw new Error("Failed to auto-create query");
    }
    return res.data;
  },

  autoCreateChart: async (queryId: string, preferredType?: string) => {
    const res = await api.post(`/ai/auto/chart`, { queryId, preferredType });
    if (!res.success) {
      throw new Error("Failed to auto-create chart");
    }
    return res.data;
  },

  autoCreateReport: async (prompt: string, dashboardId?: string) => {
    const res = await api.post(`/ai/auto/report`, { prompt, dashboardId });
    if (!res.success) {
      throw new Error("Failed to auto-create report");
    }
    return res.data;
  },

  // FEEDBACK / LEARNING LOOP
  feedback: async (aiResponseId: string, rating: 1 | 2 | 3 | 4 | 5, comment?: string) => {
    const res = await api.post(`/ai/feedback`, { aiResponseId, rating, comment });
    if (!res.success) {
      throw new Error("Failed to send AI feedback");
    }
    return res.data;
  },
};
