# 17️⃣ ai/safety_guard.py – Sécurité santé

DANGEROUS_KEYWORDS = ["diagnostic", "traitement", "médicament", "chirurgie"]

import logging

class SafetyGuard:
    @staticmethod
    def check(question):
        if not question:
            return True
        for kw in DANGEROUS_KEYWORDS:
            if kw in question.lower():
                logging.warning(f"Question potentiellement dangereuse: {kw}")
                raise ValueError("Question potentiellement dangereuse pour la santé")
        return True
