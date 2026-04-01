from backend.src.app.models._controls import MetaxMixin
from backend.src.app.configs.extensions import db


class Permission(db.Model, MetaxMixin):
    __tablename__ = "permissions"

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    name = db.Column(db.String(255), unique=True, nullable=False)   # dashboard:read, report:create, chart:update
    description = db.Column(db.String(255), nullable=True)

    visualization_shares = db.relationship("VisualizationShare",lazy="noload",cascade="all, delete-orphan",foreign_keys="VisualizationShare.permission_id")

    def to_dict(self):
        return { 
            "id": self.id, 
            "name": self.name, 
            "description": self.description 
        }

    def __repr__(self):
        return f"<Permission {self.name}>"
    
class Role(db.Model, MetaxMixin):
    __tablename__ = "roles"

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.String(255), nullable=True)

    permissions = db.relationship("Permission", secondary="roles_permissions", lazy="noload")
    teams = db.relationship("Team", back_populates="role",lazy="noload", cascade="all, delete-orphan")

    def to_dict(self, include_relations=True):
        base = {
            "id": self.id, 
            "name": self.name, 
            "description": self.description, 
        }

        if include_relations:
            base.update({
                "permission_ids": [p.id for p in self.permissions if not p.deleted],
                "permissions": [p.to_dict() for p in self.permissions if not p.deleted],
                "teams": [p.to_dict() for p in self.teams if not p.deleted],
            })

        return base
    def __repr__(self):
        return f"<Role {self.name}>"
    
class RolePermission(db.Model):
    __tablename__ = "roles_permissions"

    role_id = db.Column(db.BigInteger, db.ForeignKey("roles.id", ondelete="CASCADE", onupdate="CASCADE"), primary_key=True)
    permission_id = db.Column(db.BigInteger, db.ForeignKey("permissions.id", ondelete="CASCADE", onupdate="CASCADE"), primary_key=True)

    role = db.relationship("Role", backref="role_permission_links", lazy="noload")
    permission = db.relationship("Permission", backref="role_permission_links", lazy="noload")

    def to_dict(self, include_relations=True):
        base = {
            "role_id": self.role_id,
            "permission_id": self.permission_id,
        }

        if include_relations:
            base.update({
                "role": self.role.to_dict() if self.role else None,
                "permission": self.permission.to_dict() if self.permission else None
            })

        return base

    def __repr__(self):
        return f"<RolePermission role={self.role_id} permission={self.permission_id}>"

