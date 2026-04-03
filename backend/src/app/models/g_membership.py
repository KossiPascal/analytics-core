from backend.src.app.configs.extensions import db
from backend.src.app.models._controls import *


class Membership(db.Model, BaseModel, TenantMixin, TimestampMixin, SoftDeleteMixin, AuditMixin, StatusMixin):
    __tablename__ = "memberships"
    __table_args__ = {"schema": "core"}

    user_id = db.Column(db.String(11), db.ForeignKey("core.users.id", ondelete="CASCADE", onupdate="CASCADE"), nullable=False)
    role_id = db.Column(db.String(11), db.ForeignKey("core.roles.id", ondelete="CASCADE", onupdate="CASCADE"), nullable=False)
    
    region_id = db.Column(db.String(11), db.ForeignKey("core.regions.id", onupdate="CASCADE"), nullable=True)
    country_id = db.Column(db.String(11), db.ForeignKey("core.countries.id"), nullable=True)
    team_id = db.Column(db.String(11), db.ForeignKey("core.teams.id"), nullable=True)

    # scope_type = db.Column(db.String)  # GLOBAL, REGION, COUNTRY, TEAM
    # scope_id = db.Column(db.String(11))
    global_scope = db.Column(db.Boolean, default=False)

    user = db.relationship("User", back_populates="memberships", lazy="noload", foreign_keys=[user_id])
    role = db.relationship("Role", back_populates="memberships", lazy="noload", foreign_keys=[role_id])
    
    region = db.relationship("Region", back_populates="memberships", lazy="noload", foreign_keys=[region_id])
    country = db.relationship("Country", back_populates="memberships", lazy="noload", foreign_keys=[country_id])
    team = db.relationship("Team", back_populates="memberships", lazy="noload", foreign_keys=[team_id])

    team_memberships = db.relationship("TeamMembership",back_populates="membership",cascade="all, delete-orphan",lazy="noload")
    team_assignments = db.relationship("TeamAssignment",back_populates="membership",cascade="all, delete-orphan",lazy="noload")

    def to_dict(self, include_relations=True):
        base = {
            "tenant_id": self.tenant_id,
            "user_id": self.user_id,
            "role_id": self.role_id,
            "region_id": self.region_id,
            "country_id": self.country_id,
            "team_id": self.team_id,
            # "scope_type": self.scope_type,
            # "scope_id": self.scope_id,
        }

        if include_relations:
            base.update({
                "tenant": self.tenant.to_dict(False) if self.tenant else None,
                "user": self.user.to_dict(False) if self.user else None,
                "role": self.role.to_dict(False) if self.role else None,
                "team": self.team.to_dict(False) if self.team else None,
                "team_memberships": [tm.to_dict(False) for tm in self.team_memberships]
            })

        return base
    