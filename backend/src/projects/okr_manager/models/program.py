from backend.src.app.configs.extensions import db
from backend.src.app.models._controls import AuditMixin
from backend.src.projects.okr_manager.models._enums import ProjectStatusEnum


# PROGRAMS / PROJECTS
class Program(db.Model,AuditMixin):
    __tablename__ = "programs"
    __table_args__ = {"schema": "okrmanager"}

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    tenant_id = db.Column(db.BigInteger, db.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    team_id = db.Column(db.BigInteger, db.ForeignKey("teams.id"))
    strategic_axis_id = db.Column(db.BigInteger, db.ForeignKey("okrmanager.strategic_axes.id"))
    
    name = db.Column(db.String, nullable=False)
    description = db.Column(db.Text)
    status = db.Column(db.Enum(ProjectStatusEnum), default=ProjectStatusEnum.PLANNED)
    
    tenant = db.relationship("Tenant", back_populates="okr_programs", lazy="noload", foreign_keys=[tenant_id])
    team = db.relationship("Team", back_populates="programs", lazy="noload", foreign_keys=[team_id])
    strategic_axis = db.relationship("StrategicAxis", back_populates="programs", lazy="noload", foreign_keys=[strategic_axis_id])
   
    projects = db.relationship("Project", back_populates="program", lazy="noload", cascade="all, delete-orphan")

    
    def to_dict(self, include_relations=True):
        base = {
            "id": self.id,
            "tenant_id": self.tenant_id,
            "team_id": self.team_id,
            "strategic_axis_id": self.strategic_axis_id,
            "name": self.name,
            "description": self.description,
            "status": self.status.value if self.status else None,
        }

        if include_relations:
            base.update({
                "tenant": self.tenant.to_dict(include_relations=False) if self.tenant else None,
                "team": self.team.to_dict(include_relations=False) if self.team else None,
                "strategic_axis": self.strategic_axis.to_dict(include_relations=False) if self.strategic_axis else None,
                "projects": [v.to_dict(include_relations=False) for v in self.projects or []],
            })

        return base


class Funding(db.Model,AuditMixin):
    __tablename__ = "fundings"
    __table_args__ = {"schema": "okrmanager"}

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    tenant_id = db.Column(db.BigInteger, db.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    project_id = db.Column(db.BigInteger, db.ForeignKey("okrmanager.projects.id"), nullable=False)
    donor = db.Column(db.String, nullable=False)
    amount = db.Column(db.Float, nullable=False)
    currency = db.Column(db.String, default="USD")
    
    tenant = db.relationship("Tenant", back_populates="okr_fundings", lazy="noload", foreign_keys=[tenant_id])
    project = db.relationship("Project", back_populates="fundings", lazy="noload", foreign_keys=[project_id])
    
    def to_dict(self, include_relations=True):
        base = {
            "id": self.id,
            "tenant_id": self.tenant_id,
            "project_id": self.project_id,
            "donor": self.donor,
            "amount": self.amount,
            "currency": self.currency,
        }

        if include_relations:
            base.update({
                "tenant": self.tenant.to_dict(include_relations=False) if self.tenant else None,
                "project": self.project.to_dict(include_relations=False) if self.project else None,
                # "": [v.to_dict(include_relations=False) for v in self. or []],
            })

        return base
