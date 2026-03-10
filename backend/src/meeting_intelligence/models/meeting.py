from datetime import datetime, timezone
from backend.src.databases.extensions import db


class Meeting(db.Model):
    __tablename__ = "meetings"
    __table_args__ = {"schema": "meet"}

    id              = db.Column(db.Integer, primary_key=True)
    title           = db.Column(db.String(255), nullable=False)
    description     = db.Column(db.Text, nullable=True)
    meeting_date    = db.Column(db.DateTime(timezone=True), nullable=True)
    # PENDING | TRANSCRIBING | SUMMARIZING | DONE | FAILED
    status          = db.Column(db.String(30), nullable=False, default="PENDING")
    created_by_id   = db.Column(db.Integer, nullable=True)
    created_at      = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at      = db.Column(
        db.DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    transcriptions = db.relationship(
        "MeetingTranscription", backref="meeting", lazy=True, cascade="all, delete-orphan"
    )
    summaries = db.relationship(
        "MeetingSummary", backref="meeting", lazy=True, cascade="all, delete-orphan"
    )

    def to_dict_safe(self):
        return {
            "id":             self.id,
            "title":          self.title,
            "description":    self.description,
            "meeting_date":   self.meeting_date.isoformat() if self.meeting_date else None,
            "status":         self.status,
            "created_by_id":  self.created_by_id,
            "created_at":     self.created_at.isoformat() if self.created_at else None,
            "updated_at":     self.updated_at.isoformat() if self.updated_at else None,
        }

class MeetingTranscription(db.Model):
    __tablename__ = "meeting_transcriptions"
    __table_args__ = {"schema": "meet"}

    id                  = db.Column(db.Integer, primary_key=True)
    meeting_id          = db.Column(db.Integer, db.ForeignKey("meet.meetings.id"), nullable=False)
    audio_filename      = db.Column(db.String(255), nullable=True)
    transcription_text  = db.Column(db.Text, nullable=True)
    language            = db.Column(db.String(10), nullable=True, default="fr")
    duration_seconds    = db.Column(db.Float, nullable=True)
    # WhisperX word-level segments stored as JSON
    word_segments       = db.Column(db.JSON, nullable=True)
    created_at          = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    def to_dict_safe(self):
        return {
            "id":                 self.id,
            "meeting_id":         self.meeting_id,
            "audio_filename":     self.audio_filename,
            "transcription_text": self.transcription_text,
            "language":           self.language,
            "duration_seconds":   self.duration_seconds,
            "created_at":         self.created_at.isoformat() if self.created_at else None,
        }

class MeetingSummary(db.Model):
    __tablename__ = "meeting_summaries"
    __table_args__ = {"schema": "meet"}

    id                = db.Column(db.Integer, primary_key=True)
    meeting_id        = db.Column(db.Integer, db.ForeignKey("meet.meetings.id"), nullable=False)
    # GEMINI | GROQ | OLLAMA
    provider          = db.Column(db.String(20), nullable=False)
    model_used        = db.Column(db.String(100), nullable=True)
    titre             = db.Column(db.String(255), nullable=True)
    ordre_du_jour     = db.Column(db.Text, nullable=True)
    discussions       = db.Column(db.Text, nullable=True)
    prochaines_etapes = db.Column(db.Text, nullable=True)
    recommandations   = db.Column(db.Text, nullable=True)
    participants      = db.Column(db.JSON, nullable=True)
    raw_json          = db.Column(db.JSON, nullable=True)
    created_at        = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    def to_dict_safe(self):
        return {
            "id":                 self.id,
            "meeting_id":         self.meeting_id,
            "provider":           self.provider,
            "model_used":         self.model_used,
            "titre":              self.titre,
            "ordre_du_jour":      self.ordre_du_jour,
            "discussions":        self.discussions,
            "prochaines_etapes":  self.prochaines_etapes,
            "recommandations":    self.recommandations,
            "participants":       self.participants or [],
            "raw_json":           self.raw_json,
            "created_at":         self.created_at.isoformat() if self.created_at else None,
        }
