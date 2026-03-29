import { useEffect, useRef, useState } from "react";
import { scriptStore } from "@/stores/scripts.store";
import { useAuth } from "@/contexts/AuthContext";
import { FormField } from "@/components/forms/FormField/FormField";
import { FormInput } from "@/components/forms/FormInput/FormInput";
import { FormSelect } from "@/components/forms/FormSelect/FormSelect";

import Editor from "@monaco-editor/react";


export default function CodeEditor() {
  const { languages, script, language, setScript, updateField, loading, error, theme, generateScript } = scriptStore();
  const { isSuperAdmin } = useAuth();

  const editorRef = useRef(null);
  const [editorHeight, setEditorHeight] = useState(300);

  // 🔥 état fallback
  const [useFallback, setUseFallback] = useState(false);

  const isLocked = script?.edit_only_content === true;

  /* ---------------- LOAD SCRIPT ---------------- */
  useEffect(() => {
    if (!script) {
      setScript(generateScript("", language));
    }
  }, [script, language, setScript]);

  /* ---------------- EDITOR ---------------- */
  const onEditorChange = (value: any) => {
    updateField("content", value || "");
  };

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;

    // ✅ si monté avec succès → désactive fallback
    setUseFallback(false);

    const updateHeight = () => {
      const rawHeight = editor.getContentHeight();
      const newHeight = Math.min(800, Math.max(200, rawHeight));
      setEditorHeight((h) => (Math.abs(h - newHeight) > 10 ? newHeight : h));
    };

    let timer: any;
    editor.onDidContentSizeChange(() => {
      clearTimeout(timer);
      timer = setTimeout(updateHeight, 80);
    });

    updateHeight();
  };

  // 🔥 si Monaco crash → fallback
  const handleEditorError = () => {
    setUseFallback(true);
  };

  const maxHeight = Math.min(1000, window.innerHeight - 200);
  /* ---------------- RENDER ---------------- */
  return (
    <div className={`space-y-4 text-gray-900 dark:text-gray-100`}>

      <div className="flex gap-3 flex-wrap items-center">
        {/* Script Name */}
        {isSuperAdmin && (
          <div className="min-w-[260px]">
            <FormInput
              label="Nom du script"
              value={script?.name || ""}
              onChange={(e) => {
                if (isLocked) return;
                updateField("name", e.target.value);
              }}
              placeholder="Entrez le nom du script"
              disabled={isLocked}
            />
          </div>
        )}

        {/* Language selector — masqué, SQL par défaut */}
        {false && (
          <div className="min-w-[220px]">
            <FormSelect
              label="Langage"
              value={script?.language || language}
              onChange={(value) => {
                if (isLocked) return;
                updateField("language", value);
              }}
              disabled={isLocked}
              options={languages.map((lang) => ({
                value: lang.id,
                label: lang.name,
              }))}
            />
          </div>
        )}

        {/* HEIGHT CONTROL */}
        <div className="min-w-[220px]">
          <FormField label={`Hauteur (${editorHeight}px)`}>
            <input
              type="range"
              min="200"
              max={maxHeight}
              value={editorHeight}
              onChange={(e) => setEditorHeight(Number(e.target.value))}
            />
          </FormField>
        </div>
      </div>


      {/* 🔥 SWITCH MONACO / FALLBACK */}
      {!useFallback ? (
        <Editor
          height={`${editorHeight}px`}
          language={script?.language || language}
          value={script?.content || ""}
          theme={theme === "dark" ? "vs-dark" : "light"}
          onChange={onEditorChange}
          onMount={handleEditorDidMount}
          onValidate={(markers) => {
            // si Monaco ne charge pas bien → fallback
            if (!editorRef.current && markers) {
              setUseFallback(true);
            }
          }}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            automaticLayout: true,
            wordWrap: "on",
            scrollBeyondLastLine: false,
            lineNumbers: "on",
            renderLineHighlight: "all",
            cursorStyle: "line",
            smoothScrolling: true,
          }}
        />
      ) : (
        <div
          className={`relative w-full border rounded-xl overflow-hidden`}
          style={{
            height: editorHeight,
            backgroundColor: theme === "dark" ? "#111827" : "#F9FAFB", // gray-900 / gray-50
            borderColor: theme === "dark" ? "#374151" : "#D1D5DB",     // gray-700 / gray-300
          }}
        >
          <textarea
            className="w-full p-3 font-mono text-sm border-none resize-none focus:outline-none focus:ring-2"
            style={{
              height: editorHeight,
              color: theme === "dark" ? "#F3F4F6" : "#111827",       // text-gray-100 / text-gray-900
              backgroundColor: theme === "dark" ? "#111827" : "#F9FAFB",
              outlineColor: "#3B82F6", // focus:ring-blue-500
            }}
            value={script?.content || ""}
            onChange={(e) => updateField("content", e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Tab") {
                e.preventDefault();
                const start = e.currentTarget.selectionStart;
                const end = e.currentTarget.selectionEnd;
                const value = e.currentTarget.value;
                const newValue = value.substring(0, start) + "  " + value.substring(end);
                updateField("content", newValue);
                setTimeout(() => {
                  e.currentTarget.selectionStart = e.currentTarget.selectionEnd = start + 2;
                }, 0);
              }
            }}
          />
        </div>
      )}

      {/* STATUS */}
      {loading && (
        <div className="text-blue-600">⏳ Execution en cours…</div>
      )}
      {/* {error && (<div className="bg-red-100 text-red-700 p-2 rounded mt-2">❌ {error}</div>)} */}
    </div>
  );
}
