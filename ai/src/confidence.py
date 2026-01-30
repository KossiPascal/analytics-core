
# 13️⃣ ai/confidence.py– Confiance des résultats
import logging

class Confidence:
    @staticmethod
    def compute(data_size, quality_score=1.0):
        try:
            base = 0.5
            if data_size > 50:
                base += 0.3
            confidence = min(1.0, base * quality_score)
            return round(confidence,2)
        except Exception as e:
            logging.error(f"Erreur calcul confiance: {e}")
            return 0.0