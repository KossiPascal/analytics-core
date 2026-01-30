# 2️⃣ ai/llm_manager.py – Gestion multi-LLM
from .llm import LLM
import logging

class LLMManager:
    def __init__(self):
        self.models = {"local": LLM("local")}
        self.active_model = "local"
        logging.info("LLMManager initialisé avec modèle local")

    def switch_model(self, name: str):
        if name not in self.models:
            raise ValueError(f"Modèle {name} non disponible")
        self.active_model = name
        logging.info(f"Modèle actif changé: {name}")

    def generate(self, prompt: str) -> str:
        try:
            return self.models[self.active_model].call_with_context(prompt)
        except Exception as e:
            logging.error(f"Erreur génération LLM: {e}")
            return ""
