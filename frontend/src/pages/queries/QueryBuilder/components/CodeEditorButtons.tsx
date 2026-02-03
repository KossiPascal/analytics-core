import React, { useCallback, useEffect } from "react";
import { AppBar, Toolbar, Button, Tooltip, CircularProgress, Box } from "@mui/material";
import { useAuth } from "@contexts/AuthContext";
import { useTheme, useMediaQuery } from "@mui/material";
import { scriptStore } from "@/stores/scripts.store";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import SaveIcon from "@mui/icons-material/Save";
import DeleteIcon from "@mui/icons-material/Delete";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import StopIcon from "@mui/icons-material/Stop";

export default function CodeEditorButtons() {
  const { toggleTheme, execute, cancelExecution, resetEditor, save, remove, loading, script, isDirty, canExecute, fetchAll } = scriptStore();

  const { isSuperAdmin } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  /* ---------------- UTILS POUR BOUTONS DARK/LIGHT ---------------- */
  const buttonSx = (colorKey: string) => ({
    bgcolor: (theme: any) => theme.palette.mode === "dark" ? `${colorKey}.500` : `${colorKey}.600`,
    "&:hover": {
      bgcolor: (theme: any) => theme.palette.mode === "dark" ? `${colorKey}.600` : `${colorKey}.700`,
    },
  });

  /* ---------------- HANDLERS SÉCURISÉS ---------------- */
  const safeExecute = useCallback(async () => {
    if (!loading && canExecute) await execute();
  }, [loading, canExecute, execute]);

  const safeCancel = useCallback(() => {
    if (loading) cancelExecution();
  }, [loading, cancelExecution]);

  const safeReset = useCallback(() => {
    if (!loading && script?.content) resetEditor();
  }, [loading, script, resetEditor]);

  const safeSave = useCallback(() => {
    if (loading || !isDirty) return;
    save();
    fetchAll();
  }, [loading, isDirty, save, fetchAll]);

  const safeDelete = useCallback(() => {
    if (!script?.id || loading) return;
    remove();
  }, [script, loading, remove]);

  /* ---------------- GLOBAL KEYBINDINGS ---------------- */
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "Enter") {
        e.preventDefault();
        safeExecute();
      }
      if (e.key === "Escape") {
        safeCancel();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [safeExecute, safeCancel]);

  /* ---------------- RENDER ---------------- */
  return (
    // <AppBar
    //   position="static"
    //   color="transparent" // IMPORTANT
    //   elevation={1}
    //   sx={{
    //     bgcolor: (theme) =>
    //       theme.palette.mode === "dark"
    //         ? `${theme.palette.background.default} !important`
    //         : `${theme.palette.grey[100]} !important`,
    //     color: (theme) =>
    //       theme.palette.mode === "dark"
    //         ? theme.palette.text.primary
    //         : theme.palette.text.primary,
    //   }}
    // >
    // </AppBar>

    <Toolbar>
      <Box
        className="flex gap-2 flex-wrap items-center justify-start sm:justify-between"
        role="toolbar"
        aria-label="Barre d’actions du script"
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
        <Tooltip
          title={
            canExecute ? "Exécuter (Ctrl+Entrée)" : "Script invalide ou incomplet"
          }
        >
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
                aria-label="Annuler l’exécution"
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

        {/* SAVE */}
        {isSuperAdmin && (
          <Tooltip title={isDirty ? "Sauvegarder" : "Aucune modification"}>
            <span>
              <Button
                color="success"
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={safeSave}
                disabled={loading || !isDirty}
                aria-label="Sauvegarder le script"
                sx={buttonSx("green")}
              >
                {!isMobile && "Sauvegarder"}
              </Button>
            </span>
          </Tooltip>
        )}

        {/* DELETE */}
        {isSuperAdmin && (
          <Tooltip title={script?.id ? "Supprimer" : "Aucun script chargé"}>
            <span>
              <Button
                color="error"
                variant="contained"
                startIcon={<DeleteIcon />}
                onClick={safeDelete}
                disabled={loading || !script?.id}
                aria-label="Supprimer le script"
                sx={buttonSx("red")}
              >
                {!isMobile && "Supprimer"}
              </Button>
            </span>
          </Tooltip>
        )}
      </Box>
    </Toolbar>
  );
}
