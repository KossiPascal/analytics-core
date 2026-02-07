# backend/src/models/worker_control.py
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime
from backend.src.database.extensions import db

class WorkerControl(db.Model):
    __tablename__ = "worker_control"

    id = Column(Integer, primary_key=True)
    name = Column(String(255), unique=True, nullable=False)  # ex: "couchdb_worker"
    status = Column(String(50), nullable=False, default="run")  # run / stop / pause
    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
