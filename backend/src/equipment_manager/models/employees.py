from datetime import datetime, timezone
from backend.src.databases.extensions import db


class Department(db.Model):
    """
    Single self-referential table for departments and sub-departments.
    A root department has parent_id = NULL.
    A sub-department has parent_id pointing to its parent department.
    """
    __tablename__ = "em_departments"
    __table_args__ = (
        db.UniqueConstraint("parent_id", "name", name="uq_em_departments_parent_name"),
    )

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    parent_id = db.Column(db.BigInteger, db.ForeignKey("em_departments.id", ondelete="CASCADE"), nullable=True)
    name = db.Column(db.String(255), nullable=False)
    code = db.Column(db.String(50), unique=True, nullable=False)
    description = db.Column(db.Text, default="")
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = db.Column(db.DateTime(timezone=True), onupdate=lambda: datetime.now(timezone.utc))

    parent = db.relationship("Department", remote_side=[id], back_populates="children", lazy="selectin")
    children = db.relationship("Department", back_populates="parent", lazy="selectin", cascade="all, delete-orphan")
    employees = db.relationship("Employee", back_populates="department", lazy="selectin", cascade="all, delete-orphan")

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


class Position(db.Model):
    __tablename__ = "em_positions"

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    name = db.Column(db.String(150), unique=True, nullable=False)
    code = db.Column(db.String(50), unique=True, nullable=False)
    description = db.Column(db.Text, default="")
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = db.Column(db.DateTime(timezone=True), onupdate=lambda: datetime.now(timezone.utc))

    employees = db.relationship("Employee", back_populates="position_rel", lazy="selectin")

    def to_dict_safe(self):
        return {
            "id": str(self.id),
            "name": self.name,
            "code": self.code,
            "description": self.description,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

    def __repr__(self):
        return f"<Position(id={self.id}, name={self.name})>"


class Employee(db.Model):
    __tablename__ = "em_employees"

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    department_id = db.Column(db.BigInteger, db.ForeignKey("em_departments.id", ondelete="CASCADE"), nullable=False)
    position_id = db.Column(db.BigInteger, db.ForeignKey("em_positions.id"), nullable=True)
    first_name = db.Column(db.String(150), nullable=False)
    last_name = db.Column(db.String(150), nullable=False)
    employee_id_code = db.Column(db.String(50), unique=True, nullable=False)
    gender = db.Column(db.String(1), default="")
    phone = db.Column(db.String(20), default="")
    email = db.Column(db.String(255), default="")
    hire_date = db.Column(db.Date, nullable=True)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    notes = db.Column(db.Text, default="")
    created_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = db.Column(db.DateTime(timezone=True), onupdate=lambda: datetime.now(timezone.utc))

    department = db.relationship("Department", back_populates="employees", lazy="selectin")
    position_rel = db.relationship("Position", back_populates="employees", lazy="selectin")
    equipments = db.relationship("Equipment", back_populates="employee", lazy="selectin")
    history = db.relationship("EmployeeHistory", back_populates="employee", lazy="selectin", cascade="all, delete-orphan")

    def get_full_name(self):
        return f"{self.first_name} {self.last_name}"

    def to_dict_safe(self):
        root = self.department.root_department if self.department else None
        return {
            "id": str(self.id),
            "department_id": str(self.department_id),
            "department_name": self.department.name if self.department else None,
            "root_department_name": root.name if root else None,
            "position_id": str(self.position_id) if self.position_id else None,
            "position_name": self.position_rel.name if self.position_rel else None,
            "first_name": self.first_name,
            "last_name": self.last_name,
            "full_name": self.get_full_name(),
            "employee_id_code": self.employee_id_code,
            "gender": self.gender,
            "phone": self.phone,
            "email": self.email,
            "hire_date": self.hire_date.isoformat() if self.hire_date else None,
            "is_active": self.is_active,
            "notes": self.notes,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

    def __repr__(self):
        return f"<Employee(id={self.id}, code={self.employee_id_code})>"


class EmployeeHistory(db.Model):
    __tablename__ = "em_employee_history"

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    employee_id = db.Column(db.BigInteger, db.ForeignKey("em_employees.id", ondelete="CASCADE"), nullable=False)
    action = db.Column(db.String(30), nullable=False)
    old_department_id = db.Column(db.BigInteger, db.ForeignKey("em_departments.id", ondelete="SET NULL"), nullable=True)
    new_department_id = db.Column(db.BigInteger, db.ForeignKey("em_departments.id", ondelete="SET NULL"), nullable=True)
    notes = db.Column(db.Text, default="")
    user_id = db.Column(db.BigInteger, db.ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    timestamp = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    employee = db.relationship("Employee", back_populates="history", lazy="selectin")
    old_department = db.relationship("Department", foreign_keys=[old_department_id], lazy="selectin")
    new_department = db.relationship("Department", foreign_keys=[new_department_id], lazy="selectin")

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
