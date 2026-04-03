from backend.src.app.configs.extensions import db
from backend.src.app.models._controls import *
from backend.src.modules.okr.models._enums import ProjectStatusEnum


# PROGRAMS / PROJECTS
class Program(db.Model, BaseModel, TenantMixin, TimestampMixin, SoftDeleteMixin, AuditMixin, StatusMixin):
    __tablename__ = "programs"
    __table_args__ = {"schema": "okr"}
    
    team_id = db.Column(db.String(11), db.ForeignKey("core.teams.id"), index=True)
    strategic_axis_id = db.Column(db.String(11), db.ForeignKey("okr.strategic_axes.id"), index=True)

    name = db.Column(db.String, nullable=False)
    description = db.Column(db.Text)
    status = db.Column(db.Enum(ProjectStatusEnum), default=ProjectStatusEnum.PLANNED)
    
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
                "tenant": self.tenant.to_dict(False) if self.tenant else None,
                "team": self.team.to_dict(False) if self.team else None,
                "strategic_axis": self.strategic_axis.to_dict(False) if self.strategic_axis else None,
                "projects": [v.to_dict(False) for v in self.projects or []],
            })

        return base


