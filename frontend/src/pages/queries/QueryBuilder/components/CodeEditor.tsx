import { useEffect, useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import { scriptStore } from "@/stores/scripts.store";
import CodeEditorButtons from "./CodeEditorButtons";

import { useAuth } from "@contexts/AuthContext";

export default function CodeEditor() {
  const { languages, script, language, setScript, updateField, loading, error, theme, defaultScript } = scriptStore();
  const { isAdmin, isSuperAdmin } = useAuth();

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

  const disabledClass = isLocked ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "";

  const maxHeight = Math.min(1000, window.innerHeight - 200);
  /* ---------------- RENDER ---------------- */
  return (
    <div className={`space-y-4 text-gray-900 dark:text-gray-100`}>

      {/* ACTION BUTTONS */}
      <CodeEditorButtons />

      <div className="flex gap-3 flex-wrap items-center">
        {/* Script Name */}
        {isSuperAdmin && (
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-500">Nom du script:</label>
            <input
              type="text"
              value={script?.name || ""}
              onChange={(e) => {
                if (isLocked) return;
                updateField("name", e.target.value);
              }}
              placeholder="Entrez le nom du script"
              readOnly={isLocked}
              disabled={isLocked}
              className={`border rounded p-1 flex-1 text-sm ${disabledClass}`}
            />
          </div>
        )}

        {/* Language selector */}
        {isSuperAdmin && (
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-500">Langage:</label>
            <select
              value={script?.language || language}
              onChange={(e) => {
                if (isLocked) return;
                updateField("language", e.target.value);
              }}
              disabled={isLocked}
              className={`border rounded p-1 flex-1 text-sm ${disabledClass}`}
            >
              {languages.map((lang) => (<option key={lang.id} value={lang.id}>{lang.name}</option>))}
            </select>
          </div>
        )}

        {/* HEIGHT CONTROL */}
        <div className="flex items-center space-x-2">
          <label className="text-sm text-gray-500">Hauteur :</label>
          <input
            type="range"
            min="200"
            max={maxHeight}
            value={editorHeight}
            onChange={(e) => setEditorHeight(Number(e.target.value))}
          />
          <span className="text-sm text-gray-600">{editorHeight}px</span>
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
