import uuid

from backend.src.databases.extensions import db

def generate_uuid():
    return str(uuid.uuid4())

class Team(db.Model):
    __tablename__ = "teams"
    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    tenant_id = db.Column(db.BigInteger, db.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    parent_id = db.Column(db.BigInteger, db.ForeignKey("teams.id", ondelete="CASCADE"), nullable=False, index=True)
    role_id = db.Column(db.BigInteger, db.ForeignKey("user_roles.id"), nullable=True, index=True)
    name = db.Column(db.String, nullable=False)

    tenant = db.relationship("Tenant", back_populates="teams", lazy="noload", foreign_keys=[tenant_id])
    parent = db.relationship("Team", remote_side=[id], back_populates="children", lazy="noload")
    role = db.relationship("UserRole", back_populates="teams", lazy="noload", foreign_keys=[role_id])

    children = db.relationship("Team", back_populates="parent", lazy="noload", cascade="all, delete-orphan")
    users = db.relationship("TeamUser", back_populates="team", lazy="noload", cascade="all, delete-orphan")
    programs = db.relationship("OkrProgram", back_populates="team", lazy="noload", cascade="all, delete-orphan")
    projects = db.relationship("OkrProject", back_populates="team", lazy="noload", cascade="all, delete-orphan")
    teams = db.relationship("OkrTeamScope", back_populates="team", lazy="noload", cascade="all, delete-orphan")
    activities = db.relationship("OkrActivity", back_populates="team", lazy="noload", cascade="all, delete-orphan")
    
    def to_dict(self, include_relations=True):
        base = {
            "id": self.id,
            "tenant_id": self.tenant_id,
            "parent_id": self.parent_id,
            "role_id": self.role_id,
            "name": self.name,
        }

        if include_relations:
            base.update({
                "tenant": self.tenant.to_dict(include_relations=False) if self.tenant else None,
                "parent": self.parent.to_dict(include_relations=False) if self.parent else None,
                "role": self.role.to_dict(include_relations=False) if self.role else None,
                "children": [v.to_dict(include_relations=False) for v in self.children or []],
                "users": [v.to_dict(include_relations=False) for v in self.users or []],
                "programs": [v.to_dict(include_relations=False) for v in self.programs or []],
                "projects": [v.to_dict(include_relations=False) for v in self.projects or []],
                "teams": [v.to_dict(include_relations=False) for v in self.teams or []],
                "activities": [v.to_dict(include_relations=False) for v in self.activities or []],
            })

        return base

class TeamUser(db.Model):
    __tablename__ = "team_users"
    team_id = db.Column(db.BigInteger, db.ForeignKey("teams.id"), primary_key=True)
    user_id = db.Column(db.BigInteger, db.ForeignKey("users.id"), primary_key=True)

    team = db.relationship("Team", back_populates="users", lazy="noload", foreign_keys=[team_id])
    user = db.relationship("User", back_populates="teams", lazy="noload", foreign_keys=[user_id])

    def to_dict(self, include_relations=True):
        base = {
            "team_id": self.team_id,
            "user_id": self.user_id,
        }

        if include_relations:
            base.update({
                "team": self.team.to_dict(include_relations=False) if self.team else None,
                "user": self.user.to_dict(include_relations=False) if self.user else None,
            })

        return base