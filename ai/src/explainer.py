# 10️⃣ ai/explainer.py – Explication enrichie
import logging

class Explainer:
    """Explique les résultats de l'analyse ou prédiction"""

    def explain(self, df, question: str):
        if df.empty:
            logging.warning("DataFrame vide pour explication")
            return "Pas de données pour cette question."
        try:
            summary = df.describe(include='all').to_dict()
            explanation = f"Question: {question}\nNombre d'enregistrements: {len(df)}\nColonnes: {list(df.columns)}\nRésumé: {summary}"
            return explanation
        except Exception as e:
            logging.error(f"Erreur explanation: {e}")
            return "Impossible de générer l'explication."
        
    def explain2(self, df, question):
        return {
            "question": question,
            "rows_analyzed": len(df),
            "columns": list(df.columns),
            "summary": df.describe(include='all').to_dict()
        }