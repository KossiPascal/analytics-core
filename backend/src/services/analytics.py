from sqlalchemy import text
from backend.src.databases.extensions import db

def execute_query(sql: str):
    result = db.session.execute(text(sql))
    return [dict(row) for row in result]
