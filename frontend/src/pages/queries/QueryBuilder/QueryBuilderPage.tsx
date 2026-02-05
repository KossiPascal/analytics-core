import { useEffect, useState } from "react";
import { Play, Save, RotateCcw, Trash2, Database, Code, RefreshCw } from "lucide-react";

import { Button } from "@components/ui/Button/Button";
import { Modal } from "@components/ui/Modal/Modal";
import CodeEditor from "./components/CodeEditor";
import ResultsTable from "./components/ResultsTable";
import SavedScriptList from "./components/SavedScriptList";
import SchemaViewer from "./components/sql/SchemaViewer";
import { scriptStore } from "@/stores/scripts.store";
import { useAuth } from "@contexts/AuthContext";
import styles from "./QueryBuilder.module.css";
import { PageWrapper } from "@/components/layout/PageWrapper/PageWrapper";
import CodeEditorButtons from "./components/CodeEditorButtons";

export default function QueryBuilderPage() {
  const { language, setScript, defaultScript } = scriptStore();
  const { isSuperAdmin } = useAuth();
  const isSqlLanguage = language === "sql";

  const [showSchemaModal, setShowSchemaModal] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);

  /* ----------------- LOAD EMPTY SCRIPT ON START ----------------- */
  useEffect(() => {
    // setScript(defaultScript());
  }, [setScript]);

  /* ----------------- HANDLE RUN SQL FROM SCHEMA ----------------- */
  const handleRunSqlFromSchema = (sql: string) => {
    setScript(defaultScript(sql));
    setShowSchemaModal(false);
  };

  /* ----------------- HANDLE EXECUTE COMPLETE ----------------- */
  const handleExecuteComplete = () => {
    setShowResultsModal(true);
  };

  return (
    <PageWrapper
      title="Query Builder"
      subtitle="Créer script vos scripts ici"
    >
      <div className={styles.container}>


        {/* Main Grid Layout */}
        <div className={styles.grid}>
          {/* SIDEBAR - Saved Scripts */}
          {isSuperAdmin && (
            <aside className={`${styles.sidebar} ${styles.compactCard}`}>
              <div className={styles.cardHeader}>
                <div className={styles.cardTitle}>
                  <div className={styles.cardIcon}>
                    <Database size={16} />
                  </div>
                  <span>Scripts sauvegardés</span>
                </div>
                <Button variant="ghost" size="sm" title="Rafraîchir">
                  <RefreshCw size={16} />
                </Button>
              </div>
              <div className={styles.cardBody}>
                <SavedScriptList />
              </div>
            </aside>
          )}

          {/* MAIN CONTENT */}
          <main className={styles.mainContent}>

            {/* CODE EDITOR */}
            <div className={`${styles.editorSection} ${styles.compactCard}`}>
              <div className={styles.cardHeader}>
                <div className={styles.cardTitle}>
                  {/* ACTION BUTTONS */}
                  <CodeEditorButtons onExecuteComplete={handleExecuteComplete} />
                </div>

                {/* SCHEMA BUTTON - aligned right */}
                {isSqlLanguage && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSchemaModal(true)}
                  >
                    <Database size={16} />
                    Schéma SQL
                  </Button>
                )}
              </div>
              <div className={styles.cardBody}>
                <CodeEditor />
              </div>
            </div>
          </main>
        </div>

        {/* SCHEMA VIEWER MODAL */}
        {isSqlLanguage && (
          <Modal
            isOpen={showSchemaModal}
            onClose={() => setShowSchemaModal(false)}
            title="📊 Schéma PostgreSQL"
            size="lg"
          >
            <SchemaViewer onRunSql={handleRunSqlFromSchema} />
          </Modal>
        )}

        {/* RESULTS MODAL */}
        <Modal
          isOpen={showResultsModal}
          onClose={() => setShowResultsModal(false)}
          title="📊 Résultats de l'exécution"
          size="xl"
        >
          <ResultsTable />
        </Modal>
      </div>
    </PageWrapper>
  );
}
