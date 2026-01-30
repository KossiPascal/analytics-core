# 9️⃣ ai/analyzer.py – Analyse avancée

import pandas as pd
import logging

class Analyzer:
    """Analyse statistique et agrégation des données santé"""

    def summary(self, df: pd.DataFrame):
        if df.empty:
            logging.warning("DataFrame vide pour analyse")
            return {}
        try:
            return {
                "count": len(df),
                "mean": df.mean(numeric_only=True).to_dict(),
                "median": df.median(numeric_only=True).to_dict(),
                "missing": df.isnull().sum().to_dict(),
                "duplicates": df.duplicated().sum(),
                "columns": list(df.columns)
            }
        except Exception as e:
            logging.error(f"Erreur analyse: {e}")
            return {}

    def group_by(self, df: pd.DataFrame, column: str):
        if column not in df.columns:
            logging.warning(f"Colonne {column} inexistante")
            return {}
        try:
            return df.groupby(column).mean(numeric_only=True).to_dict()
        except Exception as e:
            logging.error(f"Erreur group_by: {e}")
            return {}
