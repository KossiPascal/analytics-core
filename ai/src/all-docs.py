ETL → RAG → SQL → analyse → prédiction → explication → monitoring, prêt à lancer pour ton IA santé.


1️⃣ requirements.txt
Flask
Flask-SQLAlchemy
psycopg2-binary
pandas
httpx
couchdb
openpyxl
sentence-transformers
qdrant-client
scikit-learn
prophet
python-dotenv
pytest






3️⃣ ai/ – Intelligence

Modules clés :

Module	Rôle
llm.py	Interface LLM
llm_manager.py	Switch entre plusieurs LLM
prompt.py	Prompts santé métiers
intent.py	Détecte type de requête
sql_generator.py	NL → SQL
sql_validator.py	Vérifie SQL sécurité
memory.py	Historique conversation
rag.py	Recherche vectorielle
knowledge_loader.py	Base connaissances santé
analyzer.py	Analyse statistique
explainer.py	Explication résultats
predictor.py	Prédictions / Prophet
audit.py	Traçabilité et logs
confidence.py	Calcul incertitude
data_quality.py	Contrôle qualité données
time_reasoner.py	Raisonnement temporel
policy_guard.py	Filtrage accès utilisateur
safety_guard.py	Détection questions dangereuses
monitor.py	Monitoring IA en prod
versioning.py	Versioning dataset / modèle / réponse
tests/ai/test_*.py	Tests unitaires et intégration