from datetime import datetime, timezone
from backend.src.databases.extensions import db


class Region(db.Model):
    __tablename__ = "em_regions"

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    name = db.Column(db.String(255), unique=True, nullable=False)
    code = db.Column(db.String(50), unique=True, nullable=False)
    created_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = db.Column(db.DateTime(timezone=True), onupdate=lambda: datetime.now(timezone.utc))

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


class District(db.Model):
    __tablename__ = "em_districts"
    __table_args__ = (
        db.UniqueConstraint("region_id", "code", name="uq_em_districts_region_code"),
    )

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    region_id = db.Column(db.BigInteger, db.ForeignKey("em_regions.id", ondelete="CASCADE"), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    code = db.Column(db.String(50), nullable=False)
    created_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = db.Column(db.DateTime(timezone=True), onupdate=lambda: datetime.now(timezone.utc))

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


class Site(db.Model):
    __tablename__ = "em_sites"

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    district_id = db.Column(db.BigInteger, db.ForeignKey("em_districts.id", ondelete="CASCADE"), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    code = db.Column(db.String(100), unique=True, nullable=False)
    address = db.Column(db.Text, default="")
    phone = db.Column(db.String(20), default="")
    created_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = db.Column(db.DateTime(timezone=True), onupdate=lambda: datetime.now(timezone.utc))

    district = db.relationship("District", back_populates="sites", lazy="selectin")
    zones_asc = db.relationship("ZoneASC", back_populates="site", lazy="selectin", cascade="all, delete-orphan")
    ascs = db.relationship("ASC", back_populates="site", lazy="selectin")

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


class ZoneASC(db.Model):
    __tablename__ = "em_zones_asc"
    __table_args__ = (
        db.UniqueConstraint("site_id", "code", name="uq_em_zones_asc_site_code"),
    )

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    site_id = db.Column(db.BigInteger, db.ForeignKey("em_sites.id", ondelete="CASCADE"), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    code = db.Column(db.String(50), nullable=False)
    created_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = db.Column(db.DateTime(timezone=True), onupdate=lambda: datetime.now(timezone.utc))

    site = db.relationship("Site", back_populates="zones_asc", lazy="selectin")
    ascs = db.relationship("ASC", back_populates="zone_asc", lazy="selectin")

    def to_dict_safe(self):
        return {
            "id": str(self.id),
            "site_id": str(self.site_id),
            "name": self.name,
            "code": self.code,
            "site_name": self.site.name if self.site else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

    def __repr__(self):
        return f"<ZoneASC(id={self.id}, name={self.name})>"
