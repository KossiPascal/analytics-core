# 3️⃣ ai/intent.py – Détection améliorée
import logging

class IntentDetector:
    """
    Détection d'intention enrichie pour l'IA santé
    """
    FORECAST_KEYWORDS = ["prévoir", "prédire", "projection", "tendance"]
    EXPLAIN_KEYWORDS = ["pourquoi", "raison", "cause", "explication"]
    QUERY_KEYWORDS = ["combien", "total", "moyenne", "nombre"]

    def detect(self, question: str) -> str:
        if not question:
            logging.warning("Question vide")
            return "unknown"
        q = question.lower()
        if any(k in q for k in self.FORECAST_KEYWORDS):
            return "forecast"
        if any(k in q for k in self.EXPLAIN_KEYWORDS):
            return "explain"
        if any(k in q for k in self.QUERY_KEYWORDS):
            return "query"
        return "general"