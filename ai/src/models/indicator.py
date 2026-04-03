from database import db

class Indicator(db.Model):
    __tablename__ = "indicators"
    id = db.Column(db.String(11), primary_key=True)
    code = db.Column(db.String, unique=True)
    name = db.Column(db.String)
    source = db.Column(db.String)
