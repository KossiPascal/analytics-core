from database import db

class HealthFact(db.Model):
    __tablename__ = "health_facts"
    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    indicator_id = db.Column(db.BigInteger, db.ForeignKey('indicators.id'))
    location_id = db.Column(db.BigInteger, db.ForeignKey('locations.id'))
    period = db.Column(db.Date)
    value = db.Column(db.Float)
    source = db.Column(db.String)
