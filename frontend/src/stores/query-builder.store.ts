import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { encryptedStorage, RETRY_MILLIS, networkManager } from '@/stores/stores.config';
import { qbService, Script } from '@services/query-builder.service';

const getTheme = () => {
  const savedTheme = localStorage.getItem("theme");
  return ["light", "dark"].includes(`${savedTheme}`) ? savedTheme : "dark";
};

const defaultScript = (content = "", language = "sql"): Script => {
  const hasContent = content !== null && content !== undefined && content.length > 0;
  return {
    id: null,
    name: hasContent ? "Schema generated content" : "",
    content: hasContent ? content : "",
    language
  };
};

const language = "sql";

interface Language {
  id: string;
  name: string;
}
const languages: Language[] = [
  { id: "sql", name: "SQL" },
  { id: "json", name: "JSON" },
  { id: "python", name: "Python" },
  { id: "javascript", name: "JavaScript" }
];

const templates: { id: number, name: string, sql: string }[] = [];


interface ScriptState {
  /* STATE */
  scripts: Script[];
  script: Script | null;       // current loaded script
  result: { parsed: string; stdout: string; rows: any[] } | null;
  show_result_table: boolean;
  error: string | null;
  copiedId: string | null;
  search: string;
  loading: boolean;
  executing: boolean;
  isDirty: boolean;      // editor modified
  canExecute: boolean;   // script valid
  abortController: AbortController | null;
  theme: string | null;
  language: string;
  languages: Language[];

  /* ----------------- DEFAULT SCRIPT ----------------- */
  defaultScript: (content?: string, language?: string) => Script;
  setSearch: (search: string) => void;
  setScript: (script: Script) => void;
  clearError: () => void;
  select: (script_id: string) => void;
  updateField: (field: string, value: any) => void;
  copy: (script: Script) => Promise<void>;
  resetEditor: () => void;
  toggleTheme: () => void;
  toggleShowResultTable: () => void;
  clearResult: () => void;
  /* FETCH */
  fetchAll: () => Promise<void>;
  /* SAVE */
  save: () => Promise<void>;
  update: (script_id: string) => Promise<void>;
  /* DELETE */
  remove: (script_id?: string, script_name?: string) => Promise<void>;
  /* EXECUTE */
  execute: (options?: Record<string, any>) => Promise<void>;
  cancelExecution: () => void;
  validate: () => boolean;
}

const makeError = (error: any, custom: string) => {
  return error.response?.data?.error || error.data?.error || error.error || custom;
}

export const scriptStore = create<ScriptState>((set, get) => ({
  scripts: [],
  script: null,
  result: null,
  show_result_table: true,
  error: null,
  copiedId: null,
  search: "",
  loading: false,
  executing: false,
  isDirty: false,
  canExecute: false,
  abortController: null,
  theme: getTheme(),
  language,
  languages,
  defaultScript,

  /* ----------------- DEFAULT SCRIPT ----------------- */
  setSearch: (search: string) => {
    const found = search !== null && search !== undefined && search !== "null" ? search : "";
    set({ search: found })
  },
  /* SETTERS / HELPERS */
  setScript: (script: Script) => {
    const canExecute = Boolean(script?.content && script?.language);
    set({ script, isDirty: false, canExecute, error: null, result: null });
  },
  
  clearError: () => {
    set({ error: null })
  },

  select: (script_id: string) => {
    const { scripts } = get();
    if (!scripts || scripts.length === 0 || !script_id) return;

    const founded = scripts.find((s) => s.id === script_id);
    if (!founded) return;

    // Normaliser content en string pour l'éditeur
    let normalizedContent = "";
    if (founded.content === null || founded.content === undefined) {
      normalizedContent = "";
    } else if (typeof founded.content === "string") {
      normalizedContent = founded.content;
    } else if (typeof founded.content === "object") {
      // dict ou array → JSON string
      try {
        normalizedContent = JSON.stringify(founded.content, null, 2);
      } catch {
        normalizedContent = String(founded.content);
      }
    } else {
      // fallback
      normalizedContent = String(founded.content);
    }

    founded.content = normalizedContent;

    set({
      script: founded,
      language: founded.language,
      isDirty: Boolean(normalizedContent),
      canExecute: Boolean(normalizedContent && founded.language),
    });

  },

  updateField: (field, value) => {
    const { script } = get();
    if (!script) return;
    if (field === "language") set({ language: value })

    const updated = { ...script, [field]: value };
    set({
      script: updated,
      isDirty: Boolean(updated.content),
      canExecute: Boolean(updated.content && updated.language),
    });
  },

  copy: async (script) => {
    try {
      await navigator.clipboard.writeText(script.content);
      set({ copiedId: script.id })
      setTimeout(() => set({ copiedId: null }), 2000);
    } catch (err) {
      console.error("Impossible de copier le template :", err);
    }
  },

  resetEditor: () => {
    const { isDirty, script } = get();
    if (isDirty && !window.confirm("Des modifications non sauvegardées seront perdues. Continuer ?")) {
      return;
    }

    if (!script) return;
    const defScript = defaultScript("", script.language || language);

    set({
      script: { ...defScript },
      canExecute: Boolean(defScript.content),
      isDirty: Boolean(defScript.content),
      error: null,
      result: null,
    });
  },

  toggleTheme: () => {
    set((state) => {
      const theme = state.theme === "light" ? "dark" : "light";
      localStorage.setItem("theme", theme);
      return { theme };
    });
  },

  toggleShowResultTable: () => {
    set((state) => ({
      show_result_table: !state.show_result_table,
    }));
  },

  clearResult: () => {
    set({ result: null, error: null });
  },

  /* FETCH */
  fetchAll: async () => {
    set({ loading: true, error: null });
    try {
      const isOnline = networkManager.isOnline();
      const res = await qbService.getALl();

      set({ scripts: res.data || templates });
    } catch (err: any) {
      set({ error: makeError(err, "Failed to fetch scripts") });
    } finally {
      set({ loading: false });
    }
  },

  /* SAVE */
  save: async () => {
    const { script, isDirty } = get();
    if (!script || !isDirty) return;

    set({ loading: true, error: null });
    try {
      const res = await qbService.save(script);
      set({ script: res.data, isDirty: false });
    } catch (err: any) {
      set({ error: makeError(err, "Failed to save scripts") });
    } finally {
      set({ loading: false });
    }
  },

  update: async (id: string) => {
    const { script, isDirty } = get();
    if (!script || !isDirty) return;

    set({ loading: true, error: null });
    try {
      const res = await qbService.update(`${script.id}`, script);
      set({ script: res.data, isDirty: false });
    } catch (err) {
      set({ error: makeError(err, "Failed to update scripts") });
    } finally {
      set({ loading: false });
    }
  },

  /* DELETE */
  remove: async (script_id, script_name) => {
    const { scripts, script } = get();
    let id_to_remove = script_id || script?.id;
    let name_to_remove = script_name || script?.name;

    const msg = `⚠️ Confirmez-vous la suppression du script: "${name_to_remove}" ?`;
    if (!id_to_remove || !window.confirm(msg)) return;

    set({ loading: true, error: null });

    try {
      const res = await qbService.delete(`${script_id}`);
      if (res) {
        const scriptsToSet = scripts.filter((s) => s.id !== script_id)
        set({ script: null, scripts: scriptsToSet, result: null });
      }
    } catch (err: any) {
      set({ error: makeError(err, "Failed to delete scripts") });
    } finally {
      set({ loading: false });
    }
  },

  /* EXECUTE */
  execute: async (options = {}) => {
    const { script, executing, abortController } = get();
    if (!script?.content || executing) return;
    if (abortController) abortController.abort();

    const controller = new AbortController();
    set({ executing: true, loading: true, result: null, error: null, abortController: controller });

    try {
      const res = await qbService.execute({ ...script, ...options }, controller.signal);
      set({ result: res.data });
    } catch (err: any) {
      set({ error: err.name === "CanceledError" ? "Execution cancelled by user" : makeError(err, "Execution failed") });
    } finally {
      set({ executing: false, loading: false, abortController: null });
    }
  },

  cancelExecution: () => {
    const { abortController } = get();
    if (abortController) {
      abortController.abort();
      set({ executing: false, loading: false, abortController: null, error: "Execution cancelled" });
    }
  },

  /* VALIDATION / UTILS */
  validate: () => {
    const { script } = get();
    if (!script) return false;
    return Boolean(script.content?.trim() && script.language);
  },

}));
