import { useState, useMemo } from "react";
import { Paper } from "@mui/material";
import { FormCheckbox } from "@/components/forms/FormCheckbox/FormCheckbox";
import { scriptStore } from "@/stores/scripts.store";

export default function ResultsTable() {
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);

  const { language, result, loading, error, show_result_table, toggleShowResultTable } = scriptStore();

  /* -------------------------------------------------
   * NORMALISATION (HOOKS TOUJOURS APPELÉS)
   * ------------------------------------------------- */
  const { rows, isTabular, normalizedResult } = useMemo(() => {
    if (!result) return { rows: [], isTabular: false, normalizedResult: null };

    // On récupère toujours le stdout ou le data principal
    const data = Array.isArray(result?.rows) ? result.rows : [];
    const isTabular = data.length > 0 && typeof data[0] === "object";
    return { rows: data, isTabular: isTabular, normalizedResult: result };
  }, [language, result]);

  // ⚠️ PAS DE useMemo ICI
  const columns = isTabular && rows.length > 0 ? Object.keys(rows[0]) : [];

  /* -------------------------------------------------
   * RENDER CONDITIONS (APRÈS TOUS LES HOOKS)
   * ------------------------------------------------- */
  if (loading) {
    return (
      <div className="p-4 bg-blue-50 border border-blue-200 text-blue-800 rounded mt-4 text-center">
        ⏳ Chargement...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded mt-4 text-center">
        ❌ Erreur : {error}
      </div>
    );
  }

  if (!result) {
    return (
      <div className="p-4 bg-gray-50 border border-gray-200 text-gray-600 rounded mt-4 text-center">
        Aucun résultat
      </div>
    );
  }

  const renderCell = (value: any) => {
    if (value === null || value === undefined) return <span className="text-gray-400">NULL</span>;
    if (typeof value === "boolean") return value ? "TRUE" : "FALSE";
    if (typeof value === "object") return JSON.stringify(value);
    return value.toString();
  };

  return (
    <div className="mt-4 border rounded shadow-sm p-2 overflow-auto" style={{ maxHeight: "500px" }}>
      {isTabular && (
        <div className="mb-2">
          <FormCheckbox
            label="Afficher la table de résultats"
            checked={show_result_table}
            onChange={toggleShowResultTable}
          />
        </div>
      )}

      {isTabular && show_result_table ? (
        <table className="min-w-full border-collapse text-sm">
          <thead className="bg-gray-100 sticky top-0">
            <tr>
              {columns.map((key) => (
                <th key={key} className="px-4 py-2 border text-left font-semibold">
                  {key}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={i}
                onMouseEnter={() => setHoveredRow(i)}
                onMouseLeave={() => setHoveredRow(null)}
                className={hoveredRow === i ? "bg-gray-50" : ""}
              >
                {columns.map((col) => (
                  <td key={col} className="px-4 py-2 border">
                    {renderCell(row[col])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <Paper sx={{ padding: 2, height: "100%", overflow: "auto" }}>
          {/* <pre className="text-sm" style={{ whiteSpace: "pre-wrap" }}> */}
          <pre className="text-sm">
            {typeof normalizedResult === "string" ? normalizedResult : JSON.stringify(normalizedResult, null, 2)}
          </pre>
        </Paper>
      )}
    </div>
  );
}
