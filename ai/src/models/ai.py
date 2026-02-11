from database import db


class Policy(db.Model):
    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    effect = db.Column(db.String(10))  # allow / deny
    condition = db.Column(db.JSON)     # règles ou IA
