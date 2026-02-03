/**
 * Extrait un message d'erreur string depuis n'importe quelle erreur
 * Gère les objets d'erreur avec différentes structures de clés
 */
export function extractErrorMessage(error: unknown, fallback = 'Une erreur est survenue'): string {
  if (typeof error === 'string') return error;

  if (error && typeof error === 'object') {
    const err = error as Record<string, any>;

    // Priorité: message > error > detail > autres clés string
    if (typeof err.message === 'string') return err.message;
    if (typeof err.error === 'string') return err.error;
    if (typeof err.detail === 'string') return err.detail;

    // Si error ou message est un objet, essayer de l'extraire récursivement
    if (err.error && typeof err.error === 'object') {
      return extractErrorMessage(err.error, fallback);
    }
    if (err.message && typeof err.message === 'object') {
      return extractErrorMessage(err.message, fallback);
    }

    // Dernière tentative: réponse API imbriquée
    if (err.response?.data) {
      return extractErrorMessage(err.response.data, fallback);
    }
    if (err.data) {
      return extractErrorMessage(err.data, fallback);
    }
  }

  return fallback;
}
