# 18️⃣ ai/monitor.py – Monitoring complet
from datetime import datetime
import logging

class Monitor:
    @staticmethod
    def log(question, sql, user="anonymous", success=True):
        try:
            print(f"[{datetime.now()}][MONITOR] User:{user}, Question:{question}, SQL:{sql}, Success:{success}")
            logging.info(f"Monitor log: {question}")
        except Exception as e:
            logging.error(f"Erreur monitor: {e}")
