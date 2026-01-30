import couchdb
import pandas as pd
from database import db

def load_couchdb(couch_url='http://admin:admin@localhost:5984', db_name='community'):
    server = couchdb.Server(couch_url)
    db_couch = server[db_name]
    docs = [db_couch[d] for d in db_couch]
    pd.DataFrame(docs).to_sql('health_facts', db.engine, if_exists='append', index=False)
    print(f"CouchDB chargé: {len(docs)} documents")
