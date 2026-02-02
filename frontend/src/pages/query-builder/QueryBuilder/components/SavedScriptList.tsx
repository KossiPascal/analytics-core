import { useEffect, useMemo, useCallback } from "react";
import { Pencil, Trash2, Search, Copy, Check } from "lucide-react";
import { scriptStore } from "@stores/query-builder.store";
import { useAuth } from "@contexts/AuthContext";
import { Script } from "@/services/query-builder.service";

export default function SavedScriptList() {
  const { loading, scripts, copiedId, search, error, fetchAll, remove, select, copy, setSearch, clearError } = scriptStore();

  const { isAdmin, isSuperAdmin } = useAuth();

  /* ----------------------------------------------------
     FETCH SCRIPTS
  ---------------------------------------------------- */
  useEffect(() => {
    fetchAll().catch((error) => {
      console.error("Erreur lors du chargement :", error);
    });
  }, [fetchAll]);

  /* ----------------------------------------------------
     RBAC
  ---------------------------------------------------- */
  const canView = isAdmin;
  const canEdit = isAdmin;
  const canDelete = isSuperAdmin;

  if (!canView) return null;

  /* ----------------------------------------------------
     FILTER
  ---------------------------------------------------- */
  const filteredScripts = useMemo(() => {
    if (!Array.isArray(scripts)) return [];
    const term = search?.toLowerCase() || "";
    return scripts.filter(
      (s) =>
        s.name?.toLowerCase().includes(term) ||
        s.language?.toLowerCase().includes(term)
    );
  }, [scripts, search]);

  /* ----------------------------------------------------
     HANDLERS
  ---------------------------------------------------- */
  const handleDelete = useCallback(async (id: string | null, name: string) => {
    if (!id) return;
    clearError();
    await remove(id, name);
  },
    [clearError, remove]
  );

  const handleSelect = useCallback((id: string | null) => {
    if (!id) return;
    clearError();
    select(id);
  },
    [clearError, select]
  );

  const handleCopy = useCallback((script: Script | null) => {
    if (!script) return;
    copy(script);
  },
    [copy]
  );

  /* ----------------------------------------------------
     RENDER
  ---------------------------------------------------- */
  return (
    <div className="w-full bg-white dark:bg-gray-900 border rounded-xl shadow p-4">
      <h3 className="text-lg font-semibold mb-4">
        Scripts sauvegardés
      </h3>

      {/* SEARCH */}
      <div className="relative mb-3">
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher par nom ou langage..."
          className="w-full border rounded-lg px-3 py-2 pl-10 bg-gray-50 dark:bg-gray-800 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400" />
        <Search size={18} className="absolute left-3 top-2.5 text-gray-400" />
      </div>

      {/* ERROR */}
      {error && (
        <div className="mb-3 p-3 bg-red-50 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* LOADING */}
      {loading && (
        <div className="text-center p-4 text-blue-600">
          Chargement...
        </div>
      )}

      {/* EMPTY */}
      {!loading && filteredScripts.length === 0 && (
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded text-center">
          Aucun script disponible
        </div>
      )}

      {/* LIST */}
      {!loading && filteredScripts.length > 0 && (
        <ul className="space-y-2 max-h-80 overflow-y-auto">
          {filteredScripts.map((s) => (
            <li key={s.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-lg transition">
              {/* TITLE */}
              <div className="flex-1 cursor-pointer" onClick={() => handleSelect(s.id)}>
                <div className="font-medium truncate">{s.id} - {s.name}</div>
                <div className="text-xs text-gray-500">{s.language.toUpperCase()}</div>
              </div>

              {/* ACTIONS */}
              <div className="flex items-center space-x-2">
                {canEdit && (
                  <button onClick={() => handleSelect(s.id)} className="p-1 text-blue-600 hover:text-blue-800" title="Éditer">
                    <Pencil size={18} />
                  </button>
                )}

                {canDelete && (
                  <button onClick={() => handleDelete(s.id, s.name)} className="p-1 text-red-600 hover:text-red-800 " title="Supprimer">
                    <Trash2 size={18} />
                  </button>
                )}

                <button onClick={() => handleCopy(s)} className={`px-2 py-0.5 rounded text-xs transition ${copiedId === s.id ? "bg-green-200 text-green-800" : "bg-gray-300 hover:bg-gray-400 dark:bg-gray-700 dark:text-gray-200"
                  }`} title="Copier">
                  {copiedId === s.id ? (
                    <span className="flex items-center gap-1">
                      <Check size={12} /> Copié
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <Copy size={12} /> Copier
                    </span>
                  )}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
