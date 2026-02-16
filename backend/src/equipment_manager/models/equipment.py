from datetime import datetime, timezone
from backend.src.databases.extensions import db


class Equipment(db.Model):
    __tablename__ = "em_equipment"

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    equipment_type = db.Column(db.String(20), nullable=False)  # PHONE, TABLET, OTHER
    brand = db.Column(db.String(100), nullable=False)
    model_name = db.Column(db.String(100), nullable=False)
    imei = db.Column(db.String(50), unique=True, nullable=False)
    serial_number = db.Column(db.String(100), default="")

    owner_id = db.Column(db.BigInteger, db.ForeignKey("em_ascs.id", ondelete="SET NULL"), nullable=True)
    employee_id = db.Column(db.BigInteger, db.ForeignKey("em_employees.id", ondelete="SET NULL"), nullable=True)

    status = db.Column(db.String(20), default="FUNCTIONAL", nullable=False)  # FUNCTIONAL, FAULTY, UNDER_REPAIR
    acquisition_date = db.Column(db.Date, nullable=True)
    warranty_expiry_date = db.Column(db.Date, nullable=True)
    assignment_date = db.Column(db.Date, nullable=True)
    reception_form_path = db.Column(db.String(500), default="")
    notes = db.Column(db.Text, default="")

    created_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = db.Column(db.DateTime(timezone=True), onupdate=lambda: datetime.now(timezone.utc))

    owner = db.relationship("ASC", back_populates="equipments", lazy="selectin")
    employee = db.relationship("Employee", back_populates="equipments", lazy="selectin")
    history = db.relationship("EquipmentHistory", back_populates="equipment", lazy="selectin", cascade="all, delete-orphan")
    repair_tickets = db.relationship("RepairTicket", back_populates="equipment", lazy="selectin")

    def to_dict_safe(self):
        return {
            "id": str(self.id),
            "equipment_type": self.equipment_type,
            "brand": self.brand,
            "model_name": self.model_name,
            "imei": self.imei,
            "serial_number": self.serial_number,
            "owner_id": str(self.owner_id) if self.owner_id else None,
            "owner_name": self.owner.get_full_name() if self.owner else None,
            "employee_id": str(self.employee_id) if self.employee_id else None,
            "employee_name": self.employee.get_full_name() if self.employee else None,
            "status": self.status,
            "acquisition_date": self.acquisition_date.isoformat() if self.acquisition_date else None,
            "warranty_expiry_date": self.warranty_expiry_date.isoformat() if self.warranty_expiry_date else None,
            "assignment_date": self.assignment_date.isoformat() if self.assignment_date else None,
            "reception_form_path": self.reception_form_path,
            "notes": self.notes,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

    def __repr__(self):
        return f"<Equipment(id={self.id}, imei={self.imei})>"


class EquipmentHistory(db.Model):
    __tablename__ = "em_equipment_history"

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    equipment_id = db.Column(db.BigInteger, db.ForeignKey("em_equipment.id", ondelete="CASCADE"), nullable=False)
    action = db.Column(db.String(30), nullable=False)  # CREATED, ASSIGNED, ASSIGNED_TO_EMPLOYEE, STATUS_CHANGED, TRANSFERRED, RETIRED
    old_value = db.Column(db.String(255), default="")
    new_value = db.Column(db.String(255), default="")
    notes = db.Column(db.Text, default="")
    created_by_id = db.Column(db.BigInteger, db.ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    equipment = db.relationship("Equipment", back_populates="history", lazy="selectin")

    def to_dict_safe(self):
        return {
            "id": str(self.id),
            "equipment_id": str(self.equipment_id),
            "action": self.action,
            "old_value": self.old_value,
            "new_value": self.new_value,
            "notes": self.notes,
            "created_by_id": str(self.created_by_id) if self.created_by_id else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

    def __repr__(self):
        return f"<EquipmentHistory(id={self.id}, action={self.action})>"
