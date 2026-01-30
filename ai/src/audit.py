# 12️⃣ ai/audit.py – Audit avancé

from datetime import datetime
import logging

class Auditor:
    LOG_FILE = "audit.log"

    def log(self, question, sql, user="anonymous", success=True):
        try:
            with open(self.LOG_FILE, "a") as f:
                f.write(f"{datetime.now()} | User: {user} | Question: {question} | SQL: {sql} | Success: {success}\n")
            logging.info(f"Audit log ajouté pour {question}")
        except Exception as e:
            logging.error(f"Erreur audit: {e}")
