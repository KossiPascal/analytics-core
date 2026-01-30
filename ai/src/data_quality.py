# 14️⃣ ai/data_quality.py – Vérification étendue

import pandas as pd
import logging

class DataQuality:
    @staticmethod
    def check(df: pd.DataFrame):
        if df.empty:
            logging.warning("DataFrame vide pour contrôle qualité")
            return {}
        try:
            return {
                "missing_values": df.isnull().sum().to_dict(),
                "duplicates": df.duplicated().sum(),
                "types": df.dtypes.apply(str).to_dict()
            }
        except Exception as e:
            logging.error(f"Erreur data_quality: {e}")
            return {}
