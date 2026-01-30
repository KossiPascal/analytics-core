# 15️⃣ ai/time_reasoner.py – Raisonnement temporel

import logging

class TimeReasoner:
    @staticmethod
    def trend(df, column='value'):
        if df.empty or column not in df.columns:
            logging.warning("Données invalides pour trend")
            return {}
        try:
            diff = df[column].diff()
            return {
                "mean_change": diff.mean(),
                "max_change": diff.max(),
                "min_change": diff.min()
            }
        except Exception as e:
            logging.error(f"Erreur trend_analysis: {e}")
            return {}
