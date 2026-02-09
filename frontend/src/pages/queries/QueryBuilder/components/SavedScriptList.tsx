import { useEffect, useMemo, useCallback } from "react";
import { Pencil, Trash2, Search, Copy, Check } from "lucide-react";
import { scriptStore } from "@/stores/scripts.store";
import { useAuth } from "@/contexts/AuthContext";
import { Script } from "@/services/scripts.service";
import { FormInput } from "@/components/forms/FormInput/FormInput";

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
    <div className="w-full h-full flex flex-col">
      {/* SEARCH */}
      <div className="mb-3">
        <FormInput
          placeholder="Rechercher..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          leftIcon={<Search size={16} />}
        />
      </div>

      {/* ERROR */}
      {error && (
        <div className="mb-2 p-2 bg-red-50 text-red-700 text-sm rounded">
          {error}
        </div>
      )}

      {/* LOADING */}
      {loading && (
        <div className="text-center p-4 text-blue-600 text-sm">
          Chargement...
        </div>
      )}

      {/* EMPTY */}
      {!loading && filteredScripts.length === 0 && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 text-yellow-700 text-sm rounded text-center">
          Aucun script
        </div>
      )}

      {/* LIST - Menu style */}
      {!loading && filteredScripts.length > 0 && (
        <ul className="flex-1 space-y-1 overflow-y-auto">
          {filteredScripts.map((s) => (
            <li
              key={s.id}
              className="group cursor-pointer p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition"
              onClick={() => handleSelect(s.id)}
            >
              <div className="flex items-start justify-between gap-2">
                {/* TITLE */}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{s.name || 'Sans titre'}</div>
                  <div className="text-xs text-gray-500 uppercase">{s.language}</div>
                </div>

                {/* ACTIONS - show on hover */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {canEdit && (
                    <button
                      onClick={(e) => {e.stopPropagation(); handleSelect(s.id);}}
                      className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                      title="Éditer"
                    >
                      <Pencil size={14} />
                    </button>
                  )}

                  <button
                    onClick={(e) => {e.stopPropagation(); handleCopy(s);}}
                    className={`p-1 rounded transition ${
                      copiedId === s.id
                        ? "text-green-600 bg-green-100"
                        : "text-gray-600 hover:bg-gray-200"
                    }`}
                    title="Copier"
                  >
                    {copiedId === s.id ? <Check size={14} /> : <Copy size={14} />}
                  </button>

                  {canDelete && (
                    <button
                      onClick={(e) => {e.stopPropagation(); handleDelete(s.id, s.name);}}
                      className="p-1 text-red-600 hover:bg-red-100 rounded"
                      title="Supprimer"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
