import httpx
import pandas as pd
from database import db
from models.health_fact import HealthFact
from config import Config

def load_dhis2():
    r = httpx.get(Config.DHIS2_URL, auth=(Config.DHIS2_USER, Config.DHIS2_PASS))
    data = r.json()['rows']
    df = pd.DataFrame(data)
    df.to_sql('health_facts', db.engine, if_exists='append', index=False)
    print(f"DHIS2 chargé: {len(df)} lignes")
