from database import db

class Location(db.Model):
    __tablename__ = "locations"
    id = db.Column(db.Integer, primary_key=True)
    country = db.Column(db.String)
    region = db.Column(db.String)
    district = db.Column(db.String)
    facility = db.Column(db.String)
