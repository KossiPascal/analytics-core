# 8️⃣ ai/knowledge_loader.py – Multi-source

HEALTH_KNOWLEDGE = [
    "CPN1 = première consultation prénatale",
    "Vaccination = protection immunitaire",
    "Taux de complétude DHIS2 = indicateur de reporting"
]

from .rag import RAG
import logging

def load_knowledge(rag: RAG):
    for i, text in enumerate(HEALTH_KNOWLEDGE):
        try:
            rag.index(text, i)
            logging.info(f"Document indexé: {text}")
        except Exception as e:
            logging.error(f"Erreur indexation: {text} | {e}")
