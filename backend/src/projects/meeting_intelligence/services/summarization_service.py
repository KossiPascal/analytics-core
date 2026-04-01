"""
SummarizationService — Multi-provider AI summarizer.

Supported providers
-------------------
  gemini  → Google Gemini Flash (cloud, gratuit jusqu'à 1M tokens/jour)
            Clé API : aistudio.google.com/app/apikey
            Env var : GEMINI_API_KEY

  groq    → Groq (cloud, gratuit jusqu'à 14 400 req/jour, ultra rapide)
            Clé API : console.groq.com
            Env var : GROQ_API_KEY

  ollama  → Ollama local (100% gratuit, aucune limite, offline)
            Installation : https://ollama.com
            Env var : OLLAMA_HOST (défaut: http://localhost:11434)

Usage
-----
    service = SummarizationService()
    result  = service.summarize(text, provider="gemini")
    # result → dict with keys: titre, ordre_du_jour, discussions,
    #           prochaines_etapes, recommandations, participants
"""

import json
import os
import re
from typing import Optional

from backend.src.projects.analytics_manager.logger import get_backend_logger

logger = get_backend_logger(__name__)

# ---------------------------------------------------------------------------
# Prompt
# ---------------------------------------------------------------------------

_PROMPT_TEMPLATE = """Tu es un assistant expert en rédaction de comptes-rendus de réunion.

Voici la transcription d'une réunion :

{transcription}

Génère un rapport structuré en JSON avec **exactement** ces champs :
{{
    "titre":             "titre court et descriptif de la réunion",
    "ordre_du_jour":     "liste des points abordés sous forme de texte",
    "discussions":       "grandes lignes des échanges et débats",
    "prochaines_etapes": "décisions prises et actions à mener",
    "recommandations":   "recommandations formulées par les participants",
    "participants":      ["liste des noms ou rôles mentionnés"]
}}

Réponds **uniquement** avec le JSON valide, sans texte ni markdown autour.
"""

# ---------------------------------------------------------------------------
# Default models
# ---------------------------------------------------------------------------

_DEFAULTS = {
    "gemini": "gemini-1.5-flash",
    "groq":   "llama-3.3-70b-versatile",
    "ollama": "mistral",
}

SUPPORTED_PROVIDERS = tuple(_DEFAULTS.keys())


# ---------------------------------------------------------------------------
# Helper — parse JSON even when the model wraps it in markdown fences
# ---------------------------------------------------------------------------

def _parse_json(text: str) -> dict:
    text = text.strip()
    # Strip ```json ... ``` or ``` ... ``` fences
    text = re.sub(r"^```(?:json)?\s*", "", text)
    text = re.sub(r"\s*```$", "", text)
    return json.loads(text.strip())


# ---------------------------------------------------------------------------
# Service
# ---------------------------------------------------------------------------

class SummarizationService:

    # -----------------------------------------------------------------------
    # Public
    # -----------------------------------------------------------------------

    def summarize(
        self,
        transcription: str,
        provider: str = "gemini",
        model_name: Optional[str] = None,
    ) -> dict:
        """
        Summarize a meeting transcription using the selected AI provider.

        Args:
            transcription: Raw transcription text.
            provider:      "gemini" | "groq" | "ollama"
            model_name:    Override the default model for the provider.

        Returns:
            dict with keys:
                titre, ordre_du_jour, discussions,
                prochaines_etapes, recommandations, participants
        """
        provider = provider.lower().strip()
        if provider not in SUPPORTED_PROVIDERS:
            raise ValueError(
                f"Provider '{provider}' non supporté. "
                f"Choisir parmi : {SUPPORTED_PROVIDERS}"
            )

        prompt = _PROMPT_TEMPLATE.format(transcription=transcription)
        model  = model_name or _DEFAULTS[provider]

        logger.info(f"Summarizing with provider={provider}, model={model}")

        if provider == "gemini":
            result = self._gemini(prompt, model)
        elif provider == "groq":
            result = self._groq(prompt, model)
        else:  # ollama
            result = self._ollama(prompt, model)

        # Ensure all expected keys are present
        for key in ("titre", "ordre_du_jour", "discussions",
                    "prochaines_etapes", "recommandations", "participants"):
            result.setdefault(key, "" if key != "participants" else [])

        return result

    def available_providers(self) -> list[dict]:
        """
        Return which providers are ready to use (API key configured / reachable).
        """
        statuses = []

        # Gemini
        statuses.append({
            "provider":     "gemini",
            "label":        "Google Gemini Flash",
            "default_model": _DEFAULTS["gemini"],
            "configured":   bool(os.getenv("GEMINI_API_KEY")),
            "type":         "cloud",
        })

        # Groq
        statuses.append({
            "provider":     "groq",
            "label":        "Groq (Llama 3.3)",
            "default_model": _DEFAULTS["groq"],
            "configured":   bool(os.getenv("GROQ_API_KEY")),
            "type":         "cloud",
        })

        # Ollama — check if the server is reachable
        ollama_ok = self._check_ollama()
        statuses.append({
            "provider":     "ollama",
            "label":        "Ollama (local)",
            "default_model": _DEFAULTS["ollama"],
            "configured":   ollama_ok,
            "type":         "local",
        })

        return statuses

    # -----------------------------------------------------------------------
    # Providers
    # -----------------------------------------------------------------------

    def _gemini(self, prompt: str, model: str) -> dict:
        try:
            import google.generativeai as genai
        except ImportError:
            raise RuntimeError(
                "google-generativeai n'est pas installé. "
                "Lance : pip install google-generativeai"
            )

        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise RuntimeError(
                "GEMINI_API_KEY n'est pas configurée. "
                "Obtiens ta clé gratuite sur aistudio.google.com"
            )

        genai.configure(api_key=api_key)
        gemini_model = genai.GenerativeModel(model)
        response = gemini_model.generate_content(prompt)
        return _parse_json(response.text)

    def _groq(self, prompt: str, model: str) -> dict:
        try:
            from groq import Groq
        except ImportError:
            raise RuntimeError(
                "groq n'est pas installé. Lance : pip install groq"
            )

        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise RuntimeError(
                "GROQ_API_KEY n'est pas configurée. "
                "Obtiens ta clé gratuite sur console.groq.com"
            )

        client = Groq(api_key=api_key)
        response = client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            temperature=0.3,
        )
        return json.loads(response.choices[0].message.content)

    def _ollama(self, prompt: str, model: str) -> dict:
        try:
            import ollama as ollama_client
        except ImportError:
            raise RuntimeError(
                "ollama n'est pas installé. Lance : pip install ollama"
            )

        host = os.getenv("OLLAMA_HOST", "http://localhost:11434")
        client = ollama_client.Client(host=host)

        response = client.chat(
            model=model,
            messages=[{"role": "user", "content": prompt}],
            format="json",
        )
        return _parse_json(response["message"]["content"])

    # -----------------------------------------------------------------------
    # Internal
    # -----------------------------------------------------------------------

    def _check_ollama(self) -> bool:
        try:
            import requests
            host = os.getenv("OLLAMA_HOST", "http://localhost:11434")
            r = requests.get(f"{host}/api/tags", timeout=2)
            return r.status_code == 200
        except Exception:
            return False


# Module-level singleton
_summarization_service: Optional[SummarizationService] = None


def get_summarization_service() -> SummarizationService:
    global _summarization_service
    if _summarization_service is None:
        _summarization_service = SummarizationService()
    return _summarization_service
