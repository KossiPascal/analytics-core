# 19️⃣ ai/versioning.py – Versioning robust

from datetime import datetime
import logging

class Versioning:
    @staticmethod
    def log(source, version="1.0"):
        try:
            with open("version.log","a") as f:
                f.write(f"{datetime.now()} | Source: {source} | Version: {version}\n")
            logging.info(f"Version log ajouté: {source} v{version}")
        except Exception as e:
            logging.error(f"Erreur versioning: {e}")
