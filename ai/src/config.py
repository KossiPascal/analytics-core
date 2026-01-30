import os
from dotenv import load_dotenv
load_dotenv()

class Config:
    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URL",
        "postgresql://health_user:health_pass@localhost:5432/health"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    DHIS2_URL = os.getenv("DHIS2_URL", "https://dhis2.server/api/analytics")
    DHIS2_USER = os.getenv("DHIS2_USER", "user")
    DHIS2_PASS = os.getenv("DHIS2_PASS", "pass")
    COUCHDB_URL = os.getenv("COUCHDB_URL", "http://admin:admin@localhost:5984")
