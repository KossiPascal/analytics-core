from enum import Enum
from backend.src.app.configs.extensions import db
from backend.src.app.models._controls import *
from backend.src.modules.okr.models._enums import GlobalStatusEnum


class TeamTypeEnum(Enum):
    GST = "GST"
    DEPARTMENT = "DEPARTMENT"
    SUB_DEPARTMENT = "SUB_DEPARTMENT"
    TEAM = "TEAM"
    SUB_TEAM = "SUB_TEAM"

# TEAM TEMPLATE (STRUCTURE GLOBALE)
class TeamTemplate(db.Model, BaseModel, TenantMixin, TimestampMixin, SoftDeleteMixin, AuditMixin, StatusMixin):
    __tablename__ = "team_templates"
    __table_args__ = (
        db.UniqueConstraint("organisation_id", "code"),
        {"schema": "core"},
    )

    organisation_id = db.Column(db.String(11), db.ForeignKey("core.organisations.id"))
    parent_id = db.Column(db.String(11), db.ForeignKey("core.team_templates.id"), nullable=True)
    # 🔥 Directeur GST (au niveau global)
    director_membership_id = db.Column(db.String(11), db.ForeignKey("core.memberships.id"), nullable=True)

    name = db.Column(db.String(255), nullable=False)
    code = db.Column(db.String(100))

    version = db.Column(db.Integer, nullable=False, default=1)

    organisation = db.relationship("Organisation", back_populates="team_templates", lazy="noload", foreign_keys=[organisation_id])

    parent = db.relationship("TeamTemplate", remote_side="TeamTemplate.id", back_populates="children")
    children = db.relationship("TeamTemplate", back_populates="parent", cascade="save-update, merge")
    # children = db.relationship("TeamTemplate",backref=db.backref("parent", remote_side="TeamTemplate.id"))

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
                "tenant": self.tenant.to_dict(False) if self.tenant else None,
                "organisation": self.organisation.to_dict(False) if self.organisation else None,
                "children": [v.to_dict(False) for v in self.children or []],
            })
        return base

# TEAM (INSTANCE PAR PAYS / REGION)
class Team(db.Model, BaseModel, TenantMixin, TimestampMixin, SoftDeleteMixin, AuditMixin, StatusMixin):
    __tablename__ = "teams"
    __table_args__ = {"schema": "core"}

    organisation_id = db.Column(db.String(11), db.ForeignKey("core.organisations.id"))
    region_id = db.Column(db.String(11), db.ForeignKey("core.regions.id"))
    country_id = db.Column(db.String(11), db.ForeignKey("core.countries.id"), nullable=True)
    
    template_id = db.Column(db.String(11), db.ForeignKey("core.team_templates.id"),nullable=False)
    parent_id = db.Column(db.String(11), db.ForeignKey("core.teams.id", ondelete="CASCADE"), nullable=True)
    role_id = db.Column(db.String(11), db.ForeignKey("core.roles.id"), nullable=True, index=True)

    name = db.Column(db.String, nullable=False)
    team_type = db.Column(db.Enum(TeamTypeEnum), nullable=False, default=TeamTypeEnum.TEAM)

    organisation = db.relationship("Organisation", back_populates="teams", foreign_keys=[organisation_id])
    region = db.relationship("Region", back_populates="teams", foreign_keys=[region_id])
    country = db.relationship("Country", back_populates="teams", foreign_keys=[country_id])
    
    template = db.relationship("TeamTemplate", back_populates="teams", foreign_keys=[template_id])

    parent = db.relationship("Team", remote_side="Team.id", back_populates="children", lazy="noload")
    children = db.relationship("Team", back_populates="parent", lazy="noload", cascade="save-update, merge")
    
    role = db.relationship("Role", back_populates="teams", lazy="noload", foreign_keys=[role_id])

    users = db.relationship("TeamMembership", back_populates="team", cascade="all, delete-orphan")
    assignments = db.relationship("TeamAssignment", back_populates="team", cascade="all, delete-orphan")
    
    programs = db.relationship("Program", back_populates="team", lazy="noload", cascade="all, delete-orphan")
    projects = db.relationship("Project", back_populates="team", lazy="noload", cascade="all, delete-orphan")
    activities = db.relationship("Activity", back_populates="team", lazy="noload", cascade="all, delete-orphan")
    
    scopes = db.relationship("TeamScope", back_populates="team", cascade="all, delete-orphan")
    objectives = db.relationship("Objective", back_populates="team", cascade="all, delete-orphan")
    team_objectives = db.relationship("TeamObjective", back_populates="team", cascade="all, delete-orphan")
    
    team_memberships = db.relationship("TeamMembership", back_populates="team", cascade="all, delete-orphan")
    team_assignments = db.relationship("TeamAssignment", back_populates="team", cascade="all, delete-orphan")
    memberships = db.relationship("Membership", back_populates="team", lazy="noload")

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
                "tenant": self.tenant.to_dict(False) if self.tenant else None,
                "parent": self.parent.to_dict(False) if self.parent else None,
                "role": self.role.to_dict(False) if self.role else None,
                "children": [v.to_dict(False) for v in self.children or []],
                "users": [v.to_dict(False) for v in self.users or []],
                "programs": [v.to_dict(False) for v in self.programs or []],
                "projects": [v.to_dict(False) for v in self.projects or []],
                "activities": [v.to_dict(False) for v in self.activities or []],
                "scopes": [s.to_dict(False) for s in self.scopes],
            })

        return base

# TEAM USER (MEMBERSHIP)
class TeamMembership(db.Model, BaseModel, TenantMixin, TimestampMixin, SoftDeleteMixin, AuditMixin, StatusMixin):
    __tablename__ = "team_memberships"
    __table_args__ = (
        db.UniqueConstraint("team_id", "membership_id"),
        {"schema": "core"},
    )

    team_id = db.Column(db.String(11), db.ForeignKey("core.teams.id", ondelete="CASCADE"), nullable=False)
    membership_id = db.Column(db.String(11), db.ForeignKey("core.memberships.id", ondelete="CASCADE"), nullable=False)

    is_primary = db.Column(db.Boolean, default=True)  # 🔥 important
    role = db.Column(db.String)  # manager, member, viewer...

    team = db.relationship("Team", back_populates="team_memberships", lazy="noload", foreign_keys=[team_id])
    membership = db.relationship("Membership", back_populates="team_memberships", lazy="noload", foreign_keys=[membership_id])

    def to_dict(self, include_relations=True):
        base = {
            "team_id": self.team_id,
            "membership_id": self.membership_id,
            "role": self.role,
        }
        if include_relations:
            base.update({
                "team": self.team.to_dict(False) if self.team else None,
                "membership": self.membership.to_dict(False) if self.membership else None,
            })
        return base

# TEAM ASSIGNMENT
class TeamAssignment(db.Model, BaseModel, TenantMixin, TimestampMixin, SoftDeleteMixin, AuditMixin, StatusMixin):
    __tablename__ = "team_assignments"
    __table_args__ = {"schema": "core"}

    team_id = db.Column(db.String(11), db.ForeignKey("core.teams.id", ondelete="CASCADE"))
    membership_id = db.Column(db.String(11), db.ForeignKey("core.memberships.id"))
    scope_id = db.Column(db.String(11), db.ForeignKey("okr.team_scopes.id"), nullable=True)

    role = db.Column(db.String)  # contributor, advisor, lead...
    allocation = db.Column(db.Float)  # % temps (0.2 = 20%)

    start_date = db.Column(db.Date)
    end_date = db.Column(db.Date)

    team = db.relationship("Team", back_populates="team_assignments", lazy="noload", foreign_keys=[team_id])
    membership = db.relationship("Membership", back_populates="team_assignments", lazy="noload", foreign_keys=[membership_id])
    scope = db.relationship("TeamScope", back_populates="assignments", lazy="noload", foreign_keys=[scope_id])

    def to_dict(self, include_relations=True):
        base = {
            "tenant_id": self.tenant_id,
            "team_id": self.team_id,
            "membership_id": self.membership_id,
            "scope_id": self.scope_id,
            "role": self.role,
            "allocation": self.allocation,
            "start_date": self.start_date,
            "end_date": self.end_date,
        }
        if include_relations:
            base.update({
                "team": self.team.to_dict(False) if self.team else None,
                "membership": self.membership.to_dict(False) if self.membership else None,
                "scope": self.scope.to_dict(False) if self.scope else None,
            })
        return base



# """"""""""""""""" (pilotage performance) """"""""""""""

# TEAM SCOPE
class TeamScope(db.Model, BaseModel, TenantMixin, TimestampMixin, SoftDeleteMixin, AuditMixin, StatusMixin):
    __tablename__ = "team_scopes"
    __table_args__ = {"schema": "okr"}

    team_id = db.Column(db.String(11), db.ForeignKey("core.teams.id"), nullable=False)

    name = db.Column(db.String, nullable=False)
    description = db.Column(db.Text)
    status = db.Column(db.Enum(GlobalStatusEnum), default=GlobalStatusEnum.ACTIVE)
    
    team = db.relationship("Team", back_populates="scopes", lazy="noload", foreign_keys=[team_id])

    initiatives = db.relationship("Initiative", back_populates="scope",lazy="noload", cascade="all, delete-orphan")
    projects = db.relationship("Project", back_populates="scope",lazy="noload", cascade="all, delete-orphan")
    assignments = db.relationship("TeamAssignment", back_populates="scope", cascade="all, delete-orphan")
    objectives = db.relationship("Objective", back_populates="scope", foreign_keys="[Objective.scope_id]", cascade="all, delete-orphan")
    team_objectives = db.relationship("TeamObjective", back_populates="scope", foreign_keys="[TeamObjective.scope_id]", cascade="all, delete-orphan")


    def to_dict(self, include_relations=True):
        base = {
            "id": self.id,
            "tenant_id": self.tenant_id,
            "team_id": self.team_id,
            "name": self.name,
            "description": self.description,
            "status": self.status.value if self.status else None,
        }

        if include_relations:
            base.update({
                "team": self.team.to_dict(False) if self.team else None,

                "initiatives": [v.to_dict(False) for v in self.initiatives or []],
                "projects": [v.to_dict(False) for v in self.projects or []],
                "assignments": [v.to_dict(False) for v in self.assignments or []],
                "team_objectives": [v.to_dict(False) for v in self.team_objectives or []],
            })

        return base

# TEAM OBJECTIVE
class TeamObjective(db.Model, BaseModel, TenantMixin, TimestampMixin, SoftDeleteMixin, AuditMixin, StatusMixin):
    __tablename__ = "team_objectives"
    __table_args__ = {"schema": "okr"}

    scope_id = db.Column(db.String(11), db.ForeignKey("okr.team_scopes.id"))
    objective_id = db.Column(db.String(11), db.ForeignKey("okr.objectives.id", ondelete="CASCADE"), nullable=False)
    team_id = db.Column(db.String(11), db.ForeignKey("core.teams.id", ondelete="CASCADE"), nullable=False, index=True)

    scope = db.relationship("TeamScope", back_populates="team_objectives", foreign_keys=[scope_id])
    objective = db.relationship("Objective", back_populates="team_objectives", foreign_keys=[objective_id])
    team = db.relationship("Team", back_populates="team_objectives", foreign_keys=[team_id])

    team_keyresults = db.relationship("TeamKeyResult", back_populates="team_objective", cascade="all, delete-orphan")
    
    
    def to_dict(self, include_relations=True):
        base = {
            "scope_id": self.scope_id,
            "objective_id": self.objective_id,
        }

        if include_relations:
            base.update({
                "scope": self.scope.to_dict(False) if self.scope else None,
                "objective": self.objective.to_dict(False) if self.objective else None,
                "keyresults": [v.to_dict(False) for v in self.team_keyresults or []],
            })


        return base

# TEAM KEY RESULT
class TeamKeyResult(db.Model, BaseModel, TenantMixin, TimestampMixin, SoftDeleteMixin, AuditMixin, StatusMixin):
    __tablename__ = "team_keyresults"
    __table_args__ = {"schema": "okr"}
    
    team_objective_id = db.Column(db.String(11), db.ForeignKey("okr.team_objectives.id"))
    keyresult_id = db.Column(db.String(11), db.ForeignKey("okr.keyresults.id", ondelete="CASCADE"), nullable=False)

    progress = db.Column(db.Float, default=0)

    team_objective = db.relationship("TeamObjective", back_populates="team_keyresults", lazy="noload", foreign_keys=[team_objective_id])
    keyresult = db.relationship("KeyResult", back_populates="team_keyresults", lazy="noload", foreign_keys=[keyresult_id])
    
    def to_dict(self, include_relations=True):
        base = {
            "tenant_id": self.tenant_id,
            "team_objective_id": self.team_objective_id,
            "keyresult_id": self.keyresult_id,
            "progress": self.progress,
        }

        if include_relations:
            base.update({
                "team_objective": self.team_objective.to_dict(False) if self.team_objective else None,
                "keyresult": self.keyresult.to_dict(False) if self.keyresult else None,
            })

        return base



# # TEAM USER (MEMBERSHIP)
# class TeamUser(db.Model, AuditMixin):
#     __tablename__ = "team_users"
#     __table_args__ = {"schema": "core"}

#     team_id = db.Column(db.String(11), db.ForeignKey("core.teams.id", ondelete="CASCADE"), nullable=False, primary_key=True)
#     user_id = db.Column(db.String(11), db.ForeignKey("core.users.id", ondelete="CASCADE"), nullable=False, primary_key=True)

#     is_primary = db.Column(db.Boolean, default=True)  # 🔥 important
#     role = db.Column(db.String)  # manager, member, viewer...

#     team = db.relationship("Team", back_populates="users")
#     user = db.relationship("User")

#     def to_dict(self, include_relations=True):
#         return {
#             "team_id": self.team_id,
#             "user_id": self.user_id,
#             "role": self.role,
#         }



