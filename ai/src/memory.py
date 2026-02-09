# 6️⃣ ai/memory.py – Historique enrichi

from datetime import datetime, timezone

class ConversationMemory:
    def __init__(self):
        self.history = []

    def add(self, question, sql, answer=None, user="anonymous"):
        self.history.append({
            'timestamp': datetime.now(),
            'user': user,
            'question': question,
            'sql': sql,
            'answer': answer
        })

    def last_questions(self, n=5):
        return self.history[-n:]

    def search_question(self, keyword):
        return [h for h in self.history if keyword.lower() in h['question'].lower()]

    def clear(self):
        self.history = []
