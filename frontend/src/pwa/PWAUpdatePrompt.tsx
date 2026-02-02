import React, { useEffect, useRef, useState } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";

/**
 * PWA Update Prompt
 * - N'apparaît JAMAIS au premier chargement
 * - N'apparaît QUE si une nouvelle version est détectée
 * - Compatible prod / dev
 */
export default function PWAUpdatePrompt() {
  const [show, setShow] = useState(false);
  const hasLoadedOnce = useRef(false);

  const {
    needRefresh,
    offlineReady,
    updateServiceWorker,
  } = useRegisterSW({
    immediate: false, // 🔥 CRITIQUE
  });

  // 🔒 Empêche l'affichage au premier chargement
  useEffect(() => {
    if (!hasLoadedOnce.current) {
      hasLoadedOnce.current = true;
      return;
    }

    if (needRefresh) {
      setShow(true);
    }
  }, [needRefresh]);

  // ℹ️ Offline ready (info seulement)
  useEffect(() => {
    if (offlineReady) {
      console.info("✅ Application prête pour le mode offline");
    }
  }, [offlineReady]);

  const handleUpdate = () => {
    updateServiceWorker(true);
    setShow(false);
  };

  const handleLater = () => {
    setShow(false);
  };

  if (!show) return null;
  return null

  // return (
  //   <div style={styles.container}>
  //     <p style={{ fontWeight: 600 }}>🚀 Nouvelle version disponible</p>

  //     <div style={styles.actions}>
  //       <button style={styles.primary} onClick={handleUpdate}>
  //         Mettre à jour
  //       </button>
  //       <button style={styles.secondary} onClick={handleLater}>
  //         Plus tard
  //       </button>
  //     </div>
  //   </div>
  // );
}


// 💅 Styles
const styles: Record<string, React.CSSProperties> = {
  container: {
    position: "fixed",
    bottom: 20,
    right: 20,
    background: "#222",
    color: "#fff",
    padding: 16,
    borderRadius: 8,
    zIndex: 9999,
    width: 300,
    boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
    fontFamily: "sans-serif",
    fontSize: 14,
  },
  actions: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: 12,
  },
  primary: {
    background: "#1976d2",
    color: "#fff",
    border: "none",
    padding: "8px 12px",
    borderRadius: 4,
    cursor: "pointer",
  },
  secondary: {
    background: "transparent",
    color: "#aaa",
    border: "none",
    cursor: "pointer",
  },
  unregister: {
    padding: "8px 12px",
    borderRadius: 4,
    border: "none",
    background: "#e53935",
    color: "#fff",
    cursor: "pointer",
    marginTop: 8,
  },
  adminSection: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    marginTop: 8,
  },
};