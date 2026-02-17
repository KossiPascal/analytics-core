from datetime import datetime, timezone
from backend.src.databases.extensions import db


# Junction table for Supervisor <-> Site M2M
supervisor_sites = db.Table(
    "supervisor_sites",
    db.Column("supervisor_id", db.BigInteger, db.ForeignKey("em.supervisors.id", ondelete="CASCADE"), primary_key=True),
    db.Column("site_id", db.BigInteger, db.ForeignKey("em.sites.id", ondelete="CASCADE"), primary_key=True),
    schema="em",
)


class ASC(db.Model):
    __tablename__ = "ascs"
    __table_args__ = {'schema': 'em'}

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    first_name = db.Column(db.String(150), nullable=False)
    last_name = db.Column(db.String(150), nullable=False)
    code = db.Column(db.String(50), unique=True, nullable=False)
    gender = db.Column(db.String(1), default="")
    phone = db.Column(db.String(20), default="")
    email = db.Column(db.String(255), default="")

    site_id = db.Column(db.BigInteger, db.ForeignKey("em.sites.id", ondelete="SET NULL"), nullable=True)
    zone_asc_id = db.Column(db.BigInteger, db.ForeignKey("em.zones_asc.id", ondelete="SET NULL"), nullable=True)
    supervisor_id = db.Column(db.BigInteger, db.ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    is_active = db.Column(db.Boolean, default=True, nullable=False)
    start_date = db.Column(db.Date, nullable=True)
    end_date = db.Column(db.Date, nullable=True)
    notes = db.Column(db.Text, default="")

    created_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = db.Column(db.DateTime(timezone=True), onupdate=lambda: datetime.now(timezone.utc))

    site = db.relationship("Site", back_populates="ascs", lazy="selectin")
    zone_asc = db.relationship("ZoneASC", back_populates="ascs", lazy="selectin")
    equipments = db.relationship("Equipment", back_populates="owner", lazy="selectin")
    repair_tickets = db.relationship("RepairTicket", back_populates="asc", lazy="selectin")

    def get_full_name(self):
        return f"{self.first_name} {self.last_name}"

    def to_dict_safe(self):
        return {
            "id": str(self.id),
            "first_name": self.first_name,
            "last_name": self.last_name,
            "full_name": self.get_full_name(),
            "code": self.code,
            "gender": self.gender,
            "phone": self.phone,
            "email": self.email,
            "site_id": str(self.site_id) if self.site_id else None,
            "site_name": self.site.name if self.site else None,
            "zone_asc_id": str(self.zone_asc_id) if self.zone_asc_id else None,
            "zone_asc_name": self.zone_asc.name if self.zone_asc else None,
            "supervisor_id": str(self.supervisor_id) if self.supervisor_id else None,
            "is_active": self.is_active,
            "start_date": self.start_date.isoformat() if self.start_date else None,
            "end_date": self.end_date.isoformat() if self.end_date else None,
            "notes": self.notes,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

    def __repr__(self):
        return f"<ASC(id={self.id}, code={self.code})>"


class Supervisor(db.Model):
    __tablename__ = "supervisors"
    __table_args__ = {'schema': 'em'}

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    user_id = db.Column(db.BigInteger, db.ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    code = db.Column(db.String(50), unique=True, nullable=False)
    first_name = db.Column(db.String(150), nullable=False)
    last_name = db.Column(db.String(150), nullable=False)
    email = db.Column(db.String(255), default="")
    phone = db.Column(db.String(20), default="")

    created_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = db.Column(db.DateTime(timezone=True), onupdate=lambda: datetime.now(timezone.utc))

    sites = db.relationship("Site", secondary=supervisor_sites, lazy="selectin")

    def get_full_name(self):
        return f"{self.first_name} {self.last_name}"

    def to_dict_safe(self):
        return {
            "id": str(self.id),
            "user_id": str(self.user_id),
            "code": self.code,
            "first_name": self.first_name,
            "last_name": self.last_name,
            "full_name": self.get_full_name(),
            "email": self.email,
            "phone": self.phone,
            "sites": [{"id": str(s.id), "name": s.name, "code": s.code} for s in self.sites],
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

    def __repr__(self):
        return f"<Supervisor(id={self.id}, code={self.code})>"
