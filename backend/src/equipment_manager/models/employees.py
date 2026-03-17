from datetime import datetime, timezone
from backend.src.databases.extensions import db
from backend.src.models.controls import AuditMixin


class Department(db.Model, AuditMixin):
    """
    Single self-referential table for departments and sub-departments.
    A root department has parent_id = NULL.
    A sub-department has parent_id pointing to its parent department.
    """
    __tablename__ = "departments"
    __table_args__ = (
        db.UniqueConstraint("parent_id", "name", name="uq_departments_parent_name"),
        {'schema': 'eqpm'},
    )

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    parent_id = db.Column(db.BigInteger, db.ForeignKey("eqpm.departments.id", ondelete="CASCADE"), nullable=True)
    name = db.Column(db.String(255), nullable=False)
    code = db.Column(db.String(50), unique=True, nullable=False)
    description = db.Column(db.Text, default="")

    parent = db.relationship("Department", remote_side=[id], back_populates="children", lazy="noload")
    children = db.relationship("Department", back_populates="parent", lazy="noload", cascade="all, delete-orphan")
    positions = db.relationship("Position", back_populates="department", lazy="noload")

    @property
    def is_root(self):
        return self.parent_id is None

    @property
    def root_department(self):
        """Walk up to the root parent."""
        if self.parent_id is None:
            return self
        return self.parent.root_department if self.parent else self

    def to_dict_safe(self):
        return {
            "id": str(self.id),
            "parent_id": str(self.parent_id) if self.parent_id else None,
            "parent_name": self.parent.name if self.parent else None,
            "name": self.name,
            "code": self.code,
            "description": self.description,
            "is_active": self.is_active,
            "is_root": self.is_root,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

    def __repr__(self):
        return f"<Department(id={self.id}, name={self.name}, parent_id={self.parent_id})>"

class Position(db.Model, AuditMixin):
    """
    Self-referential table for job positions with hierarchy.
    A root position has parent_id = NULL.
    A child position has parent_id pointing to its parent, making it a subordinate role.
    """
    __tablename__ = "positions"
    __table_args__ = {'schema': 'eqpm'}

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    parent_id = db.Column(db.BigInteger, db.ForeignKey("eqpm.positions.id", ondelete="SET NULL"), nullable=True)
    department_id = db.Column(db.BigInteger, db.ForeignKey("eqpm.departments.id", ondelete="SET NULL"), nullable=True)
    name = db.Column(db.String(150), unique=True, nullable=False)
    code = db.Column(db.String(50), unique=True, nullable=False)
    description = db.Column(db.Text, default="")
    is_zone_assignable = db.Column(db.Boolean, default=False, nullable=False)

    parent = db.relationship("Position", remote_side=[id], back_populates="children", lazy="noload")
    children = db.relationship("Position", back_populates="parent", lazy="noload")
    department = db.relationship("Department", back_populates="positions", lazy="noload")
    employees = db.relationship("Employee", back_populates="position_rel", lazy="noload")

    def to_dict_safe(self):
        return {
            "id": str(self.id),
            "parent_id": str(self.parent_id) if self.parent_id else None,
            "parent_name": self.parent.name if self.parent else None,
            "department_id": str(self.department_id) if self.department_id else None,
            "department_name": self.department.name if self.department else None,
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

    position_rel = db.relationship("Position", back_populates="employees", lazy="noload")
    tenant = db.relationship("Tenant", lazy="noload", foreign_keys=[tenant_id])
    equipments = db.relationship("Equipment", back_populates="employee", lazy="noload", foreign_keys="Equipment.employee_id")
    owned_equipments = db.relationship("Equipment", back_populates="owner", lazy="noload", foreign_keys="Equipment.owner_id")
    history = db.relationship("EmployeeHistory", back_populates="employee", lazy="noload", cascade="all, delete-orphan")
    profile = db.relationship("EmployeeProfile", back_populates="employee", uselist=False, lazy="noload", cascade="all, delete-orphan", foreign_keys="EmployeeProfile.employee_id")
    repair_tickets = db.relationship("RepairTicket", back_populates="employee", lazy="noload")

    def get_full_name(self):
        return f"{self.first_name} {self.last_name}"

    def to_dict_safe(self):
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
            "profile": self.profile.to_dict_safe() if self.profile else None,
            "equipment_count": sum(1 for e in self.equipments if e.is_active),
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

    def __repr__(self):
        return f"<Employee(id={self.id}, code={self.employee_id_code})>"

class EmployeeProfile(db.Model, AuditMixin):
    """Profil étendu pour les champs spécifiques (superviseur hiérarchique, dates)."""
    __tablename__ = "employee_profile"
    __table_args__ = {'schema': 'eqpm'}

    employee_id = db.Column(db.BigInteger, db.ForeignKey("eqpm.employees.id", ondelete="CASCADE"), primary_key=True)
    supervisor_employee_id = db.Column(db.BigInteger, db.ForeignKey("eqpm.employees.id", ondelete="SET NULL"), nullable=True)
    start_date = db.Column(db.Date, nullable=True)
    end_date = db.Column(db.Date, nullable=True)

    employee = db.relationship("Employee", back_populates="profile", foreign_keys=[employee_id], lazy="noload")
    supervisor = db.relationship("Employee", foreign_keys=[supervisor_employee_id], lazy="noload")

    def to_dict_safe(self):
        return {
            "supervisor_employee_id": str(self.supervisor_employee_id) if self.supervisor_employee_id else None,
            "supervisor_name": self.supervisor.get_full_name() if self.supervisor else None,
            "start_date": self.start_date.isoformat() if self.start_date else None,
            "end_date": self.end_date.isoformat() if self.end_date else None,
        }

    def __repr__(self):
        return f"<EmployeeProfile(employee_id={self.employee_id})>"

class EmployeeHistory(db.Model, AuditMixin):
    __tablename__ = "employee_history"
    __table_args__ = {'schema': 'eqpm'}

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    employee_id = db.Column(db.BigInteger, db.ForeignKey("eqpm.employees.id", ondelete="CASCADE"), nullable=False)
    action = db.Column(db.String(30), nullable=False)
    old_department_id = db.Column(db.BigInteger, db.ForeignKey("eqpm.departments.id", ondelete="SET NULL"), nullable=True)
    new_department_id = db.Column(db.BigInteger, db.ForeignKey("eqpm.departments.id", ondelete="SET NULL"), nullable=True)
    notes = db.Column(db.Text, default="")
    user_id = db.Column(db.BigInteger, db.ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    timestamp = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    employee = db.relationship("Employee", back_populates="history", lazy="noload")
    old_department = db.relationship("Department", foreign_keys=[old_department_id], lazy="noload")
    new_department = db.relationship("Department", foreign_keys=[new_department_id], lazy="noload")

    def to_dict_safe(self):
        return {
            "id": str(self.id),
            "employee_id": str(self.employee_id),
            "action": self.action,
            "old_department_id": str(self.old_department_id) if self.old_department_id else None,
            "old_department_name": self.old_department.name if self.old_department else None,
            "new_department_id": str(self.new_department_id) if self.new_department_id else None,
            "new_department_name": self.new_department.name if self.new_department else None,
            "notes": self.notes,
            "user_id": str(self.user_id) if self.user_id else None,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
        }

    def __repr__(self):
        return f"<EmployeeHistory(id={self.id}, action={self.action})>"
