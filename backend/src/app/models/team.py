from backend.src.app.configs.extensions import db
from backend.src.app.models._controls import AuditMixin, MetaxMixin


# =====================================================
# TEAM TEMPLATE (STRUCTURE GLOBALE)
class TeamTemplate(db.Model, MetaxMixin):
    __tablename__ = "team_templates"

    id = db.Column(db.BigInteger, primary_key=True)
    tenant_id = db.Column(db.BigInteger, db.ForeignKey("tenants.id"))
    organisation_id = db.Column(db.BigInteger, db.ForeignKey("organisations.id"))
    parent_id = db.Column(db.BigInteger, db.ForeignKey("team_templates.id"), nullable=True)

    name = db.Column(db.String(255), nullable=False)
    code = db.Column(db.String(100))

    tenant = db.relationship("Tenant", back_populates="regions", lazy="noload", foreign_keys=[tenant_id])
    organisation = db.relationship("Organisation", back_populates="team_templates")

    parent = db.relationship("TeamTemplate", remote_side=[id], back_populates="children")
    children = db.relationship("TeamTemplate", back_populates="parent")
    # children = db.relationship("TeamTemplate",backref=db.backref("parent", remote_side=[id]))

    # 🔥 Directeur GST (au niveau global)
    director_membership_id = db.Column(db.BigInteger, db.ForeignKey("memberships.id"), nullable=True)

    # 🔥 lien vers les instances réelles
    teams = db.relationship("Team", back_populates="template", lazy="noload")
    
    def to_dict(self, include_relations=True):
        base = {
            "id": self.id,
            "tenant_id": self.tenant_id,
            "organisation_id": self.organisation_id,
            "parent_id": self.parent_id,
            "name": self.name,
            "code": self.code,
        }

        if include_relations:
            base.update({
                "tenant": self.tenant.to_dict(include_relations=False) if self.tenant else None,
                "organisation": self.organisation.to_dict(include_relations=False) if self.organisation else None,
                "children": [v.to_dict(include_relations=False) for v in self.children or []],
            })

        return base


# TEAM (INSTANCE PAR PAYS / REGION)
class Team(db.Model):
    __tablename__ = "teams"
    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)

    tenant_id = db.Column(db.BigInteger, db.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    organisation_id = db.Column(db.BigInteger, db.ForeignKey("organisations.id"))
    region_id = db.Column(db.BigInteger, db.ForeignKey("regions.id"))
    country_id = db.Column(db.BigInteger, db.ForeignKey("countries.id"), nullable=True)
    template_id = db.Column(db.BigInteger, db.ForeignKey("team_templates.id"))
    parent_id = db.Column(db.BigInteger, db.ForeignKey("teams.id", ondelete="CASCADE"), nullable=False, index=True)
    role_id = db.Column(db.BigInteger, db.ForeignKey("roles.id"), nullable=True, index=True)

    name = db.Column(db.String, nullable=False)
    team_type = db.Column(db.String)  # GST, DEPARTMENT, SUB_DEPARTMENT, TEAM, SUB_TEAM

    tenant = db.relationship("Tenant", back_populates="teams", lazy="noload", foreign_keys=[tenant_id])
    organisation = db.relationship("Organisation", back_populates="teams", foreign_keys=[organisation_id])
    region = db.relationship("Region", back_populates="teams", foreign_keys=[region_id])
    country = db.relationship("Country", back_populates="teams", foreign_keys=[country_id])
    template = db.relationship("TeamTemplate", back_populates="teams", foreign_keys=[template_id])

    parent = db.relationship("Team", remote_side=[id], back_populates="children", lazy="noload")
    role = db.relationship("Role", back_populates="teams", lazy="noload", foreign_keys=[role_id])


    users = db.relationship("TeamUser", back_populates="team", cascade="all, delete-orphan")
    children = db.relationship("Team", back_populates="parent", lazy="noload", cascade="all, delete-orphan")
    programs = db.relationship("Program", back_populates="team", lazy="noload", cascade="all, delete-orphan")
    projects = db.relationship("Project", back_populates="team", lazy="noload", cascade="all, delete-orphan")
    teams = db.relationship("TeamScope", back_populates="team", lazy="noload", cascade="all, delete-orphan")
    activities = db.relationship("Activity", back_populates="team", lazy="noload", cascade="all, delete-orphan")
    
    # 🔥 IMPORTANT → renommer
    scopes = db.relationship("TeamScope", back_populates="team", cascade="all, delete-orphan")
    
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
                "scopes": [s.to_dict(False) for s in self.scopes],
            })

        return base


# TEAM USER (MEMBERSHIP)
class TeamUser(db.Model, AuditMixin):
    __tablename__ = "team_users"

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)

    team_id = db.Column(db.BigInteger, db.ForeignKey("teams.id", ondelete="CASCADE"))
    membership_id = db.Column(db.BigInteger, db.ForeignKey("memberships.id"))

    is_primary = db.Column(db.Boolean, default=True)  # 🔥 important

    role = db.Column(db.String)  # manager, member, viewer...

    team = db.relationship("Team", back_populates="users")
    membership = db.relationship("Membership")

    def to_dict(self, include_relations=True):
        return {
            "id": self.id,
            "team_id": self.team_id,
            "membership_id": self.membership_id,
            "role": self.role,
        }


class TeamAssignment(db.Model, AuditMixin):
    __tablename__ = "team_assignments"

    id = db.Column(db.BigInteger, primary_key=True)

    team_id = db.Column(db.BigInteger, db.ForeignKey("teams.id", ondelete="CASCADE"))
    membership_id = db.Column(db.BigInteger, db.ForeignKey("memberships.id"))

    # 🔥 contexte
    scope_id = db.Column(db.BigInteger, db.ForeignKey("team_scopes.id"), nullable=True)

    role = db.Column(db.String)  # contributor, advisor, lead...
    allocation = db.Column(db.Float)  # % temps (0.2 = 20%)

    start_date = db.Column(db.Date)
    end_date = db.Column(db.Date)

    team = db.relationship("Team")
    membership = db.relationship("Membership")
    scope = db.relationship("TeamScope")


# TEAM OBJECTIVE
class TeamObjective(db.Model, AuditMixin):
    __tablename__ = "team_objectives"

    id = db.Column(db.BigInteger, primary_key=True)

    team_id = db.Column(db.BigInteger, db.ForeignKey("teams.id", ondelete="CASCADE"))
    name = db.Column(db.String, nullable=False)
    description = db.Column(db.Text)

    team = db.relationship("Team")
    key_results = db.relationship("TeamKeyResult", back_populates="objective", cascade="all, delete-orphan")

    def to_dict(self, include_relations=True):
        base = {
            "id": self.id,
            "name": self.name,
        }

        if include_relations:
            base["key_results"] = [k.to_dict(False) for k in self.key_results]

        return base


# TEAM KEY RESULT
class TeamKeyResult(db.Model, AuditMixin):
    __tablename__ = "team_key_results"

    id = db.Column(db.BigInteger, primary_key=True)

    objective_id = db.Column(db.BigInteger, db.ForeignKey("team_objectives.id", ondelete="CASCADE"))
    name = db.Column(db.String, nullable=False)

    progress = db.Column(db.Float, default=0)

    objective = db.relationship("TeamObjective", back_populates="key_results")

    def to_dict(self, include_relations=True):
        return {
            "id": self.id,
            "name": self.name,
            "progress": self.progress,
        }



class TeamScope(db.Model,AuditMixin):
    __tablename__ = "okr_team_scopes"
    __table_args__ = {"schema": "okrmanager"}

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    tenant_id = db.Column(db.BigInteger, db.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    team_id = db.Column(db.BigInteger, db.ForeignKey("teams.id"), nullable=False)
    okr_global_id = db.Column(db.BigInteger, db.ForeignKey("okrmanager.okr_globals.id"), nullable=False)
    
    name = db.Column(db.String, nullable=False)
    description = db.Column(db.Text)
    status = db.Column(db.Enum(GlobalStatusEnum), default=GlobalStatusEnum.ACTIVE)
    
    tenant = db.relationship("Tenant", back_populates="okr_team_scopes", lazy="noload", foreign_keys=[tenant_id])
    team = db.relationship("Team", back_populates="teams", lazy="noload", foreign_keys=[team_id])
    okr_global = db.relationship("Global", back_populates="teams", lazy="noload", foreign_keys=[okr_global_id])

    initiatives = db.relationship("Initiative", back_populates="okr_team",lazy="noload", cascade="all, delete-orphan")
    projects = db.relationship("Project", back_populates="okr_team",lazy="noload", cascade="all, delete-orphan")
    objectives = db.relationship("Objective", back_populates="okr_team", lazy="noload", cascade="all, delete-orphan")

    def to_dict(self, include_relations=True):
        base = {
            "id": self.id,
            "tenant_id": self.tenant_id,
            "team_id": self.team_id,
            "okr_global_id": self.okr_global_id,
            "name": self.name,
            "description": self.description,
            "status": self.status.value if self.status else None,
        }

        if include_relations:
            base.update({
                "tenant": self.tenant.to_dict(include_relations=False) if self.tenant else None,
                "team": self.team.to_dict(include_relations=False) if self.team else None,
                "okr_global": self.okr_global.to_dict(include_relations=False) if self.okr_global else None,
                "initiatives": [v.to_dict(include_relations=False) for v in self.initiatives or []],
                "projects": [v.to_dict(include_relations=False) for v in self.projects or []],
                "objectives": [v.to_dict(include_relations=False) for v in self.objectives or []],
            })

        return base

