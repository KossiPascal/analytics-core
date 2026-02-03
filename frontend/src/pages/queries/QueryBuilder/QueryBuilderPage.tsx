import { useEffect } from "react";

import CodeEditor from "./components/CodeEditor";
import ResultsTable from "./components/ResultsTable";
import SavedScriptList from "./components/SavedScriptList";
import SchemaViewer from "./components/sql/SchemaViewer";
import { scriptStore } from "@/stores/scripts.store";
import { useAuth } from "@contexts/AuthContext";

export default function QureryBuilderPage() {
  const { language, setScript, defaultScript } = scriptStore();
  const { isAdmin, isSuperAdmin } = useAuth();
  const isSqlLanguage = language === "sql";

  /* ----------------- LOAD EMPTY SCRIPT ON START ----------------- */
  useEffect(() => {
    // setScript(defaultScript());
  }, [setScript]);

  /* ----------------- HANDLE RUN SQL FROM SCHEMA ----------------- */
  const handleRunSqlFromSchema = (sql:string) => {
    setScript(defaultScript(sql));
  };

  return (
    <div className="flex flex-col items-center bg-gray-100 dark:bg-gray-900 min-h-screen p-6 space-y-6">
      {/* Header */}
      <h1 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-gray-100 text-center">
        🖥 PostgreSQL SQL Editor
      </h1>

      <div className="w-full max-w-6xl space-y-6">
        {/* CODE EDITOR */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg p-4">
          <CodeEditor />
        </div>

        {/* RESULTS TABLE */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg p-4">
          <ResultsTable />
        </div>

        {/* SAVED SCRIPTS */}
        {isSuperAdmin && (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg p-4">
            <SavedScriptList />
          </div>
        )}

        {/* SCHEMA VIEWER */}
        {isSqlLanguage && (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg p-4">
            <SchemaViewer onRunSql={handleRunSqlFromSchema} />
          </div>
        )}
      </div>
    </div>
  );
}
