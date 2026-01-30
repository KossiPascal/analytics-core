# 4️⃣ ai/sql_generator.py – Avec gestion des erreurs
from .llm_manager import LLMManager
from .prompt import SYSTEM_PROMPT
from .sql_validator import validate_sql
import logging

llm = LLMManager()

def generate_sql(question: str) -> str:
    if not question:
        raise ValueError("Question vide non autorisée")
    prompt = SYSTEM_PROMPT + "\nQuestion: " + question
    try:
        sql = llm.generate(prompt)
        validate_sql(sql)
        logging.info(f"SQL généré: {sql}")
        return sql
    except Exception as e:
        logging.error(f"Erreur génération SQL: {e}")
        return ""
