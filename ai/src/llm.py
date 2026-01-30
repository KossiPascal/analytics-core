# 1️⃣ ai/llm.py – LLM amélioré
import logging

class LLM:
    """
    LLM abstrait pour OpenAI, LLaMA, etc.
    """

    def __init__(self, model_name="local"):
        self.model_name = model_name
        self.context = []
        self.api_key = None
        logging.info(f"LLM initialisé: {model_name}")

    def set_api_key(self, key: str):
        self.api_key = key
        logging.info("API Key configurée")

    def add_context(self, text: str):
        if text:
            self.context.append(text)
            logging.debug(f"Contexte ajouté: {text}")

    def clear_context(self):
        self.context = []
        logging.debug("Contexte LLM vidé")

    def call(self, prompt: str) -> str:
        if not prompt:
            raise ValueError("Prompt vide")
        logging.info(f"LLM appelé avec prompt: {prompt[:50]}...")
        # Simulation
        return "SELECT * FROM health_facts LIMIT 10;"

    def call_with_context(self, prompt: str) -> str:
        full_prompt = "\n".join(self.context + [prompt])
        return self.call(full_prompt)
