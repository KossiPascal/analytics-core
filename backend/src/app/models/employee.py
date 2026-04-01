from backend.src.app.configs.extensions import db
from backend.src.app.models._controls import AuditMixin


class Position(db.Model, AuditMixin):
    __tablename__ = "positions"
    __table_args__ = {'schema': 'eqpm'}

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    parent_id = db.Column(db.BigInteger, db.ForeignKey("eqpm.positions.id", ondelete="SET NULL"), nullable=True)
    name = db.Column(db.String(150), unique=True, nullable=False)
    code = db.Column(db.String(50), unique=True, nullable=False)
    description = db.Column(db.Text, default="")
    is_zone_assignable = db.Column(db.Boolean, default=False, nullable=False)

    parent = db.relationship("Position", remote_side=[id], back_populates="children", lazy="noload")
    children = db.relationship("Position", back_populates="parent", lazy="noload")
    employees = db.relationship("Employee", back_populates="position_rel", lazy="noload")

    def to_dict(self, include_relations=True):
        return {
            "id": str(self.id),
            "parent_id": str(self.parent_id) if self.parent_id else None,
            "parent_name": self.parent.name if self.parent else None,
            "name": self.name,
            "code": self.code,
            "description": self.description,
            "is_active": self.is_active,
            "is_zone_assignable": self.is_zone_assignable,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

    def __repr__(self):
        return f"<Position(id={self.id}, name={self.name}, parent_id={self.parent_id})>"

class Employee(db.Model, AuditMixin):
    __tablename__ = "employees"
    __table_args__ = {'schema': 'eqpm'}

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    tenant_id = db.Column(db.BigInteger, db.ForeignKey("tenants.id", ondelete="SET NULL"), nullable=True, index=True)
    position_id = db.Column(db.BigInteger, db.ForeignKey("eqpm.positions.id"), nullable=True)
    user_id = db.Column(db.BigInteger, db.ForeignKey("users.id", ondelete="SET NULL"), unique=True, nullable=True)
    first_name = db.Column(db.String(150), nullable=False)
    last_name = db.Column(db.String(150), nullable=False)
    employee_id_code = db.Column(db.String(50), unique=True, nullable=True)
    gender = db.Column(db.String(1), default="")
    hire_date = db.Column(db.Date, nullable=True)
    notes = db.Column(db.Text, default="")
    user = db.relationship("User", back_populates="employe",lazy="noload",foreign_keys=[user_id])

    position_rel = db.relationship("Position", back_populates="employees", lazy="noload")
    tenant = db.relationship("Tenant", lazy="noload", foreign_keys=[tenant_id])
    equipments = db.relationship("Equipment", back_populates="employee", lazy="noload", foreign_keys="Equipment.employee_id")
    owned_equipments = db.relationship("Equipment", back_populates="owner", lazy="noload", foreign_keys="Equipment.owner_id")
    history = db.relationship("EmployeeHistory", back_populates="employee", lazy="noload", cascade="all, delete-orphan")
    profile = db.relationship("EmployeeProfile", back_populates="employee", uselist=False, lazy="noload", cascade="all, delete-orphan", foreign_keys="EmployeeProfile.employee_id")
    repair_tickets = db.relationship("RepairTicket", back_populates="employee", lazy="noload")

    def get_full_name(self):
        return f"{self.first_name} {self.last_name}"

    def to_dict(self, include_relations=True):
        pos = self.position_rel
        return {
            "id": str(self.id),
            "tenant_id": str(self.tenant_id) if self.tenant_id else None,
            "tenant_name": self.tenant.name if self.tenant else None,
            "position_id": str(self.position_id) if self.position_id else None,
            "position_name": pos.name if pos else None,
            "position_code": pos.code if pos else None,
            "position_is_zone_assignable": pos.is_zone_assignable if pos else False,
            "user_id": str(self.user_id) if self.user_id else None,
            "first_name": self.first_name,
            "last_name": self.last_name,
            "full_name": self.get_full_name(),
            "employee_id_code": self.employee_id_code,
            "gender": self.gender,
            "hire_date": self.hire_date.isoformat() if self.hire_date else None,
            "is_active": self.is_active,
            "notes": self.notes,
            "profile": self.profile.to_dict() if self.profile else None,
            "equipment_count": sum(1 for e in self.equipments if e.is_active),
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

    def __repr__(self):
        return f"<Employee(id={self.id}, code={self.employee_id_code})>"

class EmployeePosition(db.Model, AuditMixin):
    __tablename__ = "employees_positions"
    __table_args__ = {'schema': 'eqpm'}

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    employee_id = db.Column(db.BigInteger, db.ForeignKey("employees.id", ondelete="CASCADE"), nullable=False)
    position_id = db.Column(db.BigInteger, db.ForeignKey("positions.id", ondelete="CASCADE"), nullable=False)

    start = db.Column(db.Date, nullable=True)
    end = db.Column(db.Date, nullable=True)
    notes = db.Column(db.Text, nullable=True)
    
    employee = db.relationship("Employee", back_populates="employees_positions", lazy="noload", foreign_keys=[employee_id])
    position = db.relationship("Position", back_populates="employees_positions", lazy="noload", foreign_keys=[position_id])

    def to_dict(self, include_relations=True):
        return {
            "id": self.id,
            "employee_id": self.employee_id,
            "position_id": self.position_id,
            "start": self.start,
            "end": self.end,
            "notes": self.notes,
            "employee": self.employee if self.employee else None,
            "position": self.position if self.position else None,
        }

    def __repr__(self):
        return f"<EmployeePosition(id={self.id}, notes={self.notes})>"
