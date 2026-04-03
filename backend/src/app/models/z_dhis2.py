# import jwt
# import time
# import hmac
# import secrets
# import hashlib
# from typing import Any, Dict, List, Tuple
# from datetime import datetime, timedelta, timezone
# from backend.src.app.configs.environment import Config
# from sqlalchemy.exc import SQLAlchemyError, IntegrityError
# from itsdangerous import BadSignature, SignatureExpired
# from backend.src.app.models._controls import MetaxMixin
# from backend.src.app.models.tenant import Tenant
# from backend.src.app.models.employees import Employee, Position
# from backend.src.app.configs.extensions import ADMIN, SUPERADMIN, db
# from shared_libs.helpers.hasher import hash_password, verify_password

# rate_limit_store: Dict[str, Tuple[int, int]] = {}  # client_id -> (count, first_ts)



# # -------------------- ORGUNIT LEVEL (DHIS2-style) --------------------
# class OrgUnitLevel(db.Model, MetaxMixin):
#     """
#     Représente un niveau hiérarchique dans l'arborescence des unités d'organisation,
#     à la manière de DHIS2 (niveau 1 = National, 2 = Région, 3 = District, …).
#     """
#     __tablename__ = "user_orgunit_levels"

#     id           = db.Column(db.String(11), primary_key=True)
#     tenant_id    = db.Column(db.String(11), db.ForeignKey('tenants.id', ondelete="CASCADE"), nullable=False)
#     name         = db.Column(db.String(100), nullable=False)
#     code         = db.Column(db.String(100), nullable=False, default="")  # code DHIS2
#     level        = db.Column(db.Integer, nullable=False)       # 1 = National, 2 = Régional, …
#     display_name = db.Column(db.String(100), nullable=True)    # alias d'affichage optionnel

#     tenant   = db.relationship("Tenant", lazy="noload", foreign_keys=[tenant_id])
#     orgunits = db.relationship("UserOrgunit", back_populates="level_rel", lazy="noload")

#     __table_args__ = (
#         db.UniqueConstraint("tenant_id", "level", name="uq_orgunit_level_tenant"),
#     )

#     def to_dict(self):
#         return {
#             "id":           self.id,
#             "tenant_id":    self.tenant_id,
#             "name":         self.name,
#             "code":         self.code or "",
#             "level":        self.level,
#             "display_name": self.display_name or self.name,
#             "is_active":    self.is_active,
#             "created_at":   self.created_at.isoformat() if self.created_at else None,
#             "updated_at":   self.updated_at.isoformat() if self.updated_at else None,
#         }

#     def __repr__(self):
#         return f"<OrgUnitLevel level={self.level} name={self.name}>"


# # -------------------- USER ORGUNIT --------------------
# class UserOrgunit(db.Model, MetaxMixin):
#     __tablename__ = "user_orgunits"

#     id          = db.Column(db.String(11), primary_key=True)
#     tenant_id   = db.Column(db.String(11), db.ForeignKey('tenants.id', ondelete="CASCADE", onupdate="CASCADE"), nullable=False)
#     level_id    = db.Column(db.String(11), db.ForeignKey('user_orgunit_levels.id', ondelete="SET NULL"), nullable=True)
#     name        = db.Column(db.String(100), nullable=False)
#     code        = db.Column(db.String(100), nullable=False)
#     parent_id   = db.Column(db.String(11), db.ForeignKey('user_orgunits.id', ondelete="CASCADE", onupdate="CASCADE"), nullable=True)
#     description = db.Column(db.String(255), nullable=True)

#     # Relations
#     parent     = db.relationship("UserOrgunit", remote_side="UserOrgunit.id", backref=db.backref("children", lazy="noload"), uselist=False)
#     tenant     = db.relationship("Tenant", back_populates="orgunits", lazy="noload", foreign_keys=[tenant_id])
#     level_rel  = db.relationship("OrgUnitLevel", back_populates="orgunits", lazy="noload", foreign_keys=[level_id])
#     users_link = db.relationship("UserOrgunitLink", back_populates="orgunit", lazy="noload", cascade="all, delete-orphan")

#     __table_args__ = (
#         db.CheckConstraint("tenant_id IS NOT NULL", name="ck_orgunit_tenant_not_null"),
#     )

#     def get_descendants(self):
#         """Récupère tous les enfants récursivement."""
#         result = set()
#         for child in self.children:
#             if not child.deleted:
#                 result.add(child)
#                 result.update(child.get_descendants())
#         return result

#     def to_dict(self, include_children=False, include_descendants=False):
#         data = {
#             "id":          self.id,
#             "name":        self.name,
#             "code":        self.code,
#             "tenant_id":   self.tenant_id,
#             "tenant":      self.tenant.to_dict() if self.tenant else None,
#             "level_id":    self.level_id,
#             "level":       self.level_rel.to_dict() if self.level_rel else None,
#             "parent_id":   self.parent_id,
#             "parent":      self.parent.to_dict() if self.parent else None,
#             "description": self.description,
#             "is_active":   self.is_active,
#         }

#         if include_children:
#             data["children"] = [
#                 child.to_dict(include_children=True)
#                 for child in self.children
#                 if not child.deleted
#             ]

#         if include_descendants:
#             data["descendants"] = [
#                 org.to_dict()
#                 for org in sorted([o for o in self.get_descendants() if not o.deleted], key=lambda x: x.id)
#             ]

#         return data

#     def __repr__(self):
#         return f"<Orgunit {self.name}>"


        
# class UserOrgunitLink(db.Model):
#     __tablename__ = "user_orgunit_links"

#     user_id = db.Column(db.String(11), db.ForeignKey("core.users.id", ondelete="CASCADE", onupdate="CASCADE"), primary_key=True)
#     orgunit_id = db.Column(db.String(11), db.ForeignKey("user_orgunits.id", ondelete="CASCADE", onupdate="CASCADE"), primary_key=True)

#     user = db.relationship("User", lazy="noload")
#     orgunit = db.relationship("UserOrgunit", lazy="noload")

#     def to_dict(self):
#         return { 
#             "user_id": self.user_id,
#             "user": self.user.to_dict() if self.user else None,
#             "orgunit_id": self.orgunit_id,
#             "orgunit": self.orgunit.to_dict() if self.orgunit else None,
#         }
