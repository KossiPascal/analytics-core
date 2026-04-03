from database import db

class HealthFact(db.Model):
    __tablename__ = "health_facts"
    id = db.Column(db.String(11), primary_key=True)
    indicator_id = db.Column(db.String(11), db.ForeignKey('indicators.id'))
    location_id = db.Column(db.String(11), db.ForeignKey('locations.id'))
    period = db.Column(db.Date)
    value = db.Column(db.Float)
    source = db.Column(db.String)
