import pandas as pd
from database import db
from models.health_fact import HealthFact

def load_excel(path):
    df = pd.read_excel(path)
    df.to_sql('health_facts', db.engine, if_exists='append', index=False)
    print(f"Excel chargé: {path}, {len(df)} lignes")
