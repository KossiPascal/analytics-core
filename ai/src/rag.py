# 7️⃣ rag.py – Recherche vectorielle avancée
from sentence_transformers import SentenceTransformer
from qdrant_client import QdrantClient
import logging

class RAG:
    def __init__(self):
        self.model = SentenceTransformer('all-MiniLM-L6-v2')
        self.client = QdrantClient(":memory:")
        self.collection_name = "health"
        self.client.recreate_collection(self.collection_name, vector_size=384)
        logging.info("RAG initialisé")

    def index(self, text: str, doc_id: int):
        if not text:
            logging.warning(f"Document {doc_id} vide")
            return
        self.client.upsert(
            self.collection_name,
            [{"id": doc_id, "vector": self.model.encode(text).tolist(), "payload": {"text": text}}]
        )

    def retrieve(self, query: str, top_k=3):
        if not query:
            logging.warning("Query vide")
            return []
        results = self.client.search(
            self.collection_name,
            self.model.encode(query).tolist(),
            limit=top_k
        )
        return [r.payload['text'] for r in results if hasattr(r, 'payload')]
