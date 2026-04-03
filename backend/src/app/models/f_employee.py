from backend.src.app.configs.extensions import db
from backend.src.app.models._controls import *


class Position(db.Model, BaseModel, TenantMixin, TimestampMixin, SoftDeleteMixin, AuditMixin, StatusMixin):
    __tablename__ = "positions"
    __table_args__ = {"schema": "hrm"}

    parent_id = db.Column(db.String(11), db.ForeignKey("hrm.positions.id", ondelete="SET NULL"), nullable=True)
    
    name = db.Column(db.String(150), unique=True, nullable=False)
    code = db.Column(db.String(50), unique=True, nullable=False)
    description = db.Column(db.Text, default="")
    is_zone_assignable = db.Column(db.Boolean, default=False, nullable=False)

    parent = db.relationship("Position", remote_side="Position.id", back_populates="children", lazy="noload")
    
    children = db.relationship("Position", back_populates="parent", lazy="noload", cascade="all")
    employees = db.relationship("Employee", back_populates="position", lazy="noload", cascade="all, delete-orphan")
    employee_positions = db.relationship("EmployeePosition", back_populates="position", lazy="noload", cascade="all, delete-orphan")

    def to_dict(self, include_relations=True):
        base = {
            "id": self.id,
            "tenant_id": self.tenant_id,
            "parent_id": self.parent_id if self.parent_id else None,
            "parent_name": self.parent.name if self.parent else None,
            "name": self.name,
            "code": self.code,
            "description": self.description,
            "is_active": self.is_active,
            "is_zone_assignable": self.is_zone_assignable,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

        if include_relations and self.tenant:
            base.update({
                "tenant": self.tenant.to_dict() if self.tenant else None,
                "parent": self.parent.to_dict() if self.parent else None,
                "children": [v.to_dict(False) for v in self.children or []],
                # "employees": [v.to_dict(False) for v in self.employees or []],
            })

        return base

    def __repr__(self):
        return f"<Position(id={self.id}, name={self.name}, parent_id={self.parent_id})>"

class Employee(db.Model, BaseModel, TenantMixin, TimestampMixin, SoftDeleteMixin, AuditMixin, StatusMixin):
    __tablename__ = "employees"
    __table_args__ = {"schema": "hrm"}

    position_id = db.Column(db.String(11), db.ForeignKey("hrm.positions.id"), nullable=True)
    user_id = db.Column(db.String(11), db.ForeignKey("core.users.id", ondelete="SET NULL"), unique=True, nullable=True)
    
    code = db.Column(db.String(50), unique=True, nullable=True)
    gender = db.Column(db.String(1), default="")
    start_date = db.Column(db.Date, nullable=True)
    end_date = db.Column(db.Date, nullable=True)
    notes = db.Column(db.Text, nullable=True)

    user = db.relationship("User", back_populates="employee",lazy="noload",foreign_keys=[user_id])
    position = db.relationship("Position", back_populates="employees", lazy="noload")
    equipments = db.relationship("Equipment", back_populates="employee", lazy="noload", foreign_keys="Equipment.employee_id")
    owned_equipments = db.relationship("Equipment", back_populates="owner", lazy="noload", foreign_keys="Equipment.owner_id")
    # history = db.relationship("EmployeeHistory", back_populates="employee", lazy="noload", cascade="all, delete-orphan")
    # profiles = db.relationship("EmployeeProfile", back_populates="employee", uselist=False, lazy="noload", cascade="all, delete-orphan", foreign_keys="EmployeeProfile.employee_id")
    repair_tickets = db.relationship("RepairTicket", back_populates="employee", lazy="noload")
    employee_positions = db.relationship("EmployeePosition", back_populates="employee", lazy="noload", cascade="all, delete-orphan")

    def get_full_name(self):
        if not self.user:
            return "No Name"
        return f"{self.user.firstname} {self.user.lastname}"

    def to_dict(self, include_relations=True):
        base = {
            "id": self.id,
            "tenant_id": self.tenant_id,
            "position_id": self.position_id,
            "user_id": self.user_id,
            "code": self.code,
            "gender": self.gender,
            "start_date": self.start_date.isoformat() if self.start_date else None,
            "end_date": self.end_date.isoformat() if self.end_date else None,
            "is_active": self.is_active,
            "notes": self.notes,
            # "created_at": self.created_at.isoformat() if self.created_at else None,
            # "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

        if include_relations and self.tenant:
            base.update({
                "tenant": self.tenant.to_dict() if self.tenant else None,
                "position": self.position if self.position else None,
                "equipments": [v.to_dict(False) for v in self.equipments or []],
                "profiles": [v.to_dict(False) for v in self.profiles or []],
                "repair_tickets": [v.to_dict(False) for v in self.repair_tickets or []],
            })

        return base

    def __repr__(self):
        return f"<Employee(id={self.id}, code={self.employee_id_code})>"

class EmployeePosition(db.Model, BaseModel, TenantMixin, TimestampMixin, SoftDeleteMixin, AuditMixin, StatusMixin):
    __tablename__ = "employee_positions"
    __table_args__ = {"schema": "hrm"}

    id = db.Column(db.String(11), primary_key=True)
    tenant_id = db.Column(db.String(11), db.ForeignKey("core.tenants.id", ondelete="SET NULL"), nullable=True, index=True)
    employee_id = db.Column(db.String(11), db.ForeignKey("hrm.employees.id", ondelete="CASCADE"), nullable=False)
    position_id = db.Column(db.String(11), db.ForeignKey("hrm.positions.id", ondelete="CASCADE"), nullable=False)

    start_date = db.Column(db.Date, nullable=True)
    end_date = db.Column(db.Date, nullable=True)
    notes = db.Column(db.Text, nullable=True)
    
    employee = db.relationship("Employee", back_populates="employee_positions", lazy="noload", foreign_keys=[employee_id])
    position = db.relationship("Position", back_populates="employee_positions", lazy="noload", foreign_keys=[position_id])

    def to_dict(self, include_relations=True):
        base = {
            "id": self.id,
            "tenant_id": self.tenant_id,
            "employee_id": self.employee_id,
            "position_id": self.position_id,
            "start": self.start_date,
            "end": self.end_date,
            "notes": self.notes,
        }

        if include_relations:
            base.update({
                "employee": self.employee if self.employee else None,
                "position": self.position if self.position else None,
            })

        return base

    def __repr__(self):
        return f"<EmployeePosition(id={self.id}, notes={self.notes})>"
