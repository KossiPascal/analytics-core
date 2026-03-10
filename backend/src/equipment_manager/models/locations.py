from datetime import datetime, timezone
from backend.src.databases.extensions import db
from backend.src.models.controls import AuditMixin


class Region(db.Model, AuditMixin):
    __tablename__ = "regions"
    __table_args__ = {'schema': 'eqpm'}

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    name = db.Column(db.String(255), unique=True, nullable=False)
    code = db.Column(db.String(50), unique=True, nullable=False)

    districts = db.relationship("District", back_populates="region", lazy="selectin", cascade="all, delete-orphan")

    def to_dict_safe(self):
        return {
            "id": str(self.id),
            "name": self.name,
            "code": self.code,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

    def __repr__(self):
        return f"<Region(id={self.id}, name={self.name})>"

class District(db.Model, AuditMixin):
    __tablename__ = "districts"
    __table_args__ = (
        db.UniqueConstraint("region_id", "code", name="uq_districts_region_code"),
        {'schema': 'eqpm'},
    )

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    region_id = db.Column(db.BigInteger, db.ForeignKey("eqpm.regions.id", ondelete="CASCADE"), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    code = db.Column(db.String(50), nullable=False)

    region = db.relationship("Region", back_populates="districts", lazy="selectin")
    sites = db.relationship("Site", back_populates="district", lazy="selectin", cascade="all, delete-orphan")

    def to_dict_safe(self):
        return {
            "id": str(self.id),
            "region_id": str(self.region_id),
            "name": self.name,
            "code": self.code,
            "region_name": self.region.name if self.region else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

    def __repr__(self):
        return f"<District(id={self.id}, name={self.name})>"

class Site(db.Model, AuditMixin):
    __tablename__ = "sites"
    __table_args__ = {'schema': 'eqpm'}

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    district_id = db.Column(db.BigInteger, db.ForeignKey("eqpm.districts.id", ondelete="CASCADE"), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    code = db.Column(db.String(100), unique=True, nullable=False)
    address = db.Column(db.Text, default="")
    phone = db.Column(db.String(20), default="")

    district = db.relationship("District", back_populates="sites", lazy="selectin")

    def to_dict_safe(self):
        return {
            "id": str(self.id),
            "district_id": str(self.district_id),
            "name": self.name,
            "code": self.code,
            "address": self.address,
            "phone": self.phone,
            "district_name": self.district.name if self.district else None,
            "region_name": self.district.region.name if self.district and self.district.region else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

    def __repr__(self):
        return f"<Site(id={self.id}, name={self.name})>"
