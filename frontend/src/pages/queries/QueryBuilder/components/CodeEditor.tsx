import { useEffect, useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import { scriptStore } from "@/stores/scripts.store";
import CodeEditorButtons from "./CodeEditorButtons";

import { useAuth } from "@contexts/AuthContext";
import { FormField, FormInput, FormSelect } from "@/components/forms";

export default function CodeEditor() {
  const { languages, script, language, setScript, updateField, loading, error, theme, defaultScript } = scriptStore();
  const { isSuperAdmin } = useAuth();

  const editorRef = useRef(null);
  const [editorHeight, setEditorHeight] = useState(300);

  const isLocked = script?.edit_only_content === true;



  /* ---------------- LOAD SCRIPT ---------------- */
  useEffect(() => {
    if (!script) {
      setScript(defaultScript("", language));
    }
  }, [script, language, setScript]);

  /* ---------------- EDITOR ---------------- */
  const onEditorChange = (value:any) => {
    updateField("content", value || "");
  };

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;

    const updateHeight = () => {
      const rawHeight = editor.getContentHeight();
      const newHeight = Math.min(800, Math.max(200, rawHeight));
      setEditorHeight((h) => (Math.abs(h - newHeight) > 10 ? newHeight : h));
    };

    let timer:any;
    editor.onDidContentSizeChange(() => {
      clearTimeout(timer);
      timer = setTimeout(updateHeight, 80);
    });

    updateHeight();
  };

  const maxHeight = Math.min(1000, window.innerHeight - 200);
  /* ---------------- RENDER ---------------- */
  return (
    <div className={`space-y-4 text-gray-900 dark:text-gray-100`}>

      {/* ACTION BUTTONS */}
      <CodeEditorButtons />

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

        {/* Language selector */}
        {isSuperAdmin && (
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


      {/* MONACO EDITOR */}
      <Editor
        height={`${editorHeight}px`}
        language={script?.language || language}
        value={script?.content || ""}
        theme={theme === "dark" ? "vs-dark" : "light"}
        onChange={onEditorChange}
        onMount={handleEditorDidMount}
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

      {/* STATUS */}
      {loading && <div className="text-blue-600">⏳ Execution en cours…</div>}
      {/* {error && (<div className="bg-red-100 text-red-700 p-2 rounded mt-2">❌ {error}</div>)} */}
    </div>
  );
}
