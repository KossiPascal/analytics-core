import React, { useCallback, useEffect, useState } from "react";
import { Toolbar, Button, Tooltip, CircularProgress, Box } from "@mui/material";
import { useTheme, useMediaQuery } from "@mui/material";
import { scriptStore } from "@/stores/scripts.store";
import { queryService } from "@/services/dataset.service";
import { DatasetQuery } from "@/models/dataset.models";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import SaveIcon from "@mui/icons-material/Save";
import DeleteIcon from "@mui/icons-material/Delete";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import StopIcon from "@mui/icons-material/Stop";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";

interface CodeEditorButtonsProps {
  onExecuteComplete?: () => void;
  query?: DatasetQuery | null;
  onAfterSave?: (id: number) => void;
}

export default function CodeEditorButtons({ onExecuteComplete, query, onAfterSave }: CodeEditorButtonsProps) {
  const { toggleTheme, execute, cancelExecution, resetEditor, remove, loading, script, canExecute } = scriptStore();

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"success" | "error" | null>(null);
  const [saveMessage, setSaveMessage] = useState("");

  /* ---- Condition d'activation du bouton Sauvegarder ---- */
  const canSaveQuery = Boolean(query?.compiled_sql && query?.name?.trim() && query?.dataset_id);

  /* ---------------- UTILS POUR BOUTONS DARK/LIGHT ---------------- */
  const buttonSx = (colorKey: string) => ({
    bgcolor: (theme: any) => theme.palette.mode === "dark" ? `${colorKey}.500` : `${colorKey}.600`,
    "&:hover": {
      bgcolor: (theme: any) => theme.palette.mode === "dark" ? `${colorKey}.600` : `${colorKey}.700`,
    },
  });

  /* ---------------- HANDLERS SÉCURISÉS ---------------- */
  const safeExecute = useCallback(async () => {
    if (!loading && canExecute) {
      await execute();
      onExecuteComplete?.();
    }
  }, [loading, canExecute, execute, onExecuteComplete]);

  const safeCancel = useCallback(() => {
    if (loading) cancelExecution();
  }, [loading, cancelExecution]);

  const safeReset = useCallback(() => {
    if (!loading && script?.content) resetEditor();
  }, [loading, script, resetEditor]);

  const safeDelete = useCallback(() => {
    if (!script?.id || loading) return;
    remove();
  }, [script, loading, remove]);

  const safeSaveQuery = useCallback(async () => {
    if (!canSaveQuery || saving || !query) return;
    setSaving(true);
    setSaveStatus(null);
    try {
      if (query.id) {
        await queryService.update(query.id, query);
        setSaveMessage("Requête mise à jour");
      } else {
        const res = await queryService.create(query) as any;
        const newId = res?.id ?? res?.query_id;
        if (newId) onAfterSave?.(newId);
        setSaveMessage("Requête sauvegardée");
      }
      setSaveStatus("success");
      setTimeout(() => setSaveStatus(null), 3000);
    } catch {
      setSaveStatus("error");
      setSaveMessage("Erreur lors de la sauvegarde");
      setTimeout(() => setSaveStatus(null), 4000);
    } finally {
      setSaving(false);
    }
  }, [canSaveQuery, saving, query, onAfterSave]);

  /* ---------------- GLOBAL KEYBINDINGS ---------------- */
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "Enter") {
        e.preventDefault();
        safeExecute();
      }
      if (e.key === "Escape") safeCancel();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [safeExecute, safeCancel]);

  /* ---------------- RENDER ---------------- */
  return (
    <Toolbar>
      <Box
        className="flex gap-2 flex-wrap items-center justify-start sm:justify-between"
        role="toolbar"
        aria-label="Barre d'actions du script"
      >
        {/* THEME */}
        <Tooltip title="Changer le thème">
          <span>
            <Button
              onClick={toggleTheme}
              startIcon={<Brightness4Icon />}
              disabled={loading}
              aria-label="Changer le thème"
            >
              {!isMobile && "Thème"}
            </Button>
          </span>
        </Tooltip>

        {/* EXECUTE */}
        <Tooltip title={canExecute ? "Exécuter (Ctrl+Entrée)" : "Script invalide ou incomplet"}>
          <span>
            <Button
              color="primary"
              variant="contained"
              startIcon={loading ? <CircularProgress size={18} /> : <PlayArrowIcon />}
              size={isMobile ? "small" : "medium"}
              onClick={safeExecute}
              disabled={!canExecute || loading}
              aria-label="Exécuter le script"
              sx={buttonSx("blue")}
            >
              {!isMobile && (loading ? "Exécution…" : "Exécuter")}
            </Button>
          </span>
        </Tooltip>

        {/* CANCEL */}
        {loading && (
          <Tooltip title="Annuler (Échap)">
            <span>
              <Button
                color="warning"
                variant="outlined"
                startIcon={<StopIcon />}
                onClick={safeCancel}
                disabled={!loading}
                sx={{ px: 1.5, py: 0.5 }}
                aria-label="Annuler l'exécution"
              >
                {!isMobile && "Stop"}
              </Button>
            </span>
          </Tooltip>
        )}

        {/* RESET */}
        <Tooltip title="Réinitialiser">
          <span>
            <Button
              color="inherit"
              variant="outlined"
              startIcon={<RestartAltIcon />}
              onClick={safeReset}
              disabled={loading || !script?.content}
              aria-label="Réinitialiser le script"
            >
              {!isMobile && "Réinitialiser"}
            </Button>
          </span>
        </Tooltip>

        {/* SAVE QUERY */}
        <Tooltip title={
          !query?.compiled_sql ? "Construisez une requête d'abord" :
          !query?.name?.trim() ? "Renseignez le nom dans Informations générales" :
          !query?.dataset_id ? "Sélectionnez un dataset dans Informations générales" :
          query.id ? "Mettre à jour la requête" : "Sauvegarder la requête"
        }>
          <span>
            <Button
              color="success"
              variant="contained"
              startIcon={saving ? <CircularProgress size={18} /> : <SaveIcon />}
              onClick={safeSaveQuery}
              disabled={loading || !canSaveQuery || saving}
              aria-label="Sauvegarder la requête"
              sx={buttonSx("green")}
            >
              {!isMobile && (saving ? "Sauvegarde…" : query?.id ? "Mettre à jour" : "Sauvegarder")}
            </Button>
          </span>
        </Tooltip>

        {/* FEEDBACK SAVE */}
        {saveStatus === "success" && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, color: "success.main", fontSize: "0.8rem" }}>
            <CheckCircleOutlineIcon fontSize="small" />
            {!isMobile && saveMessage}
          </Box>
        )}
        {saveStatus === "error" && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, color: "error.main", fontSize: "0.8rem" }}>
            <ErrorOutlineIcon fontSize="small" />
            {!isMobile && saveMessage}
          </Box>
        )}
      </Box>
    </Toolbar>
  );
}
