from datetime import datetime, timezone
from backend.src.app.configs.extensions import db
from backend.src.app.models._controls import *

# ---------------------------------------------------------------------------
# Equipment lifecycle constants
# ---------------------------------------------------------------------------
ACTIVE_STATUSES = {"PENDING", "FUNCTIONAL", "FAULTY", "UNDER_REPAIR"}
INACTIVE_STATUSES = {"COMPLETELY_DAMAGED", "LOST", "STOLEN", "TAKEN_AWAY"}

EQUIPMENT_STATUS_LABELS = {
    "PENDING":            "En attente",
    "FUNCTIONAL":         "Fonctionnel",
    "FAULTY":             "Défaillant",
    "UNDER_REPAIR":       "En réparation",
    "COMPLETELY_DAMAGED": "Complètement gâté",
    "LOST":               "Perdu",
    "STOLEN":             "Volé",
    "TAKEN_AWAY":         "Emporté",
}

DECLARATION_ACTION_MAP = {
    "LOST":               "DECLARED_LOST",
    "STOLEN":             "DECLARED_STOLEN",
    "TAKEN_AWAY":         "DECLARED_TAKEN_AWAY",
    "COMPLETELY_DAMAGED": "DECLARED_COMPLETELY_DAMAGED",
}


class EquipmentCategoryGroup(db.Model, BaseModel, TenantMixin, TimestampMixin, SoftDeleteMixin, AuditMixin, StatusMixin):
    """Grande catégorie d'équipement (ex: Appareils électroniques, Meubles, Voitures…)"""
    __tablename__ = "equipment_category_groups"
    __table_args__ = {"schema": "equip"}

    name = db.Column(db.String(150), unique=True, nullable=False)
    code = db.Column(db.String(50), unique=True, nullable=False)
    description = db.Column(db.Text, default="")

    categories = db.relationship("EquipmentCategory", back_populates="category_group", lazy="noload")

    def to_dict_safe(self):
        return {
            "id": self.id,
            "name": self.name,
            "code": self.code,
            "description": self.description,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

    def __repr__(self):
        return f"<EquipmentCategoryGroup(id={self.id}, name={self.name})>"


class EquipmentCategory(db.Model, BaseModel, TenantMixin, TimestampMixin, SoftDeleteMixin, AuditMixin, StatusMixin):
    """Type d'équipement (ex: Téléphone, Tablette, Chaise, Voiture Toyota…)"""
    __tablename__ = "equipment_categories"
    __table_args__ = {"schema": "equip"}

    category_group_id = db.Column(db.String(11), db.ForeignKey("equip.equipment_category_groups.id", ondelete="SET NULL"), nullable=True)
    name = db.Column(db.String(150), unique=True, nullable=False)
    code = db.Column(db.String(50), unique=True, nullable=False)
    description = db.Column(db.Text, default="")

    category_group = db.relationship("EquipmentCategoryGroup", back_populates="categories", lazy="noload")
    equipments = db.relationship("Equipment", back_populates="category_rel", lazy="noload")

    def to_dict_safe(self):
        return {
            "id": self.id,
            "category_group_id": str(self.category_group_id) if self.category_group_id else None,
            "category_group_name": self.category_group.name if self.category_group else None,
            "category_group_code": self.category_group.code if self.category_group else None,
            "name": self.name,
            "code": self.code,
            "description": self.description,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

    def __repr__(self):
        return f"<EquipmentCategory(id={self.id}, name={self.name})>"


class EquipmentBrand(db.Model, BaseModel, TenantMixin, TimestampMixin, SoftDeleteMixin, AuditMixin, StatusMixin):
    """Marque d'equipement (ex: Samsung, Tecno, Itel)"""
    __tablename__ = "equipment_brands"
    __table_args__ = {"schema": "equip"}

    name = db.Column(db.String(150), unique=True, nullable=False)
    code = db.Column(db.String(50), unique=True, nullable=False)
    description = db.Column(db.Text, default="")

    equipments = db.relationship("Equipment", back_populates="brand_rel", lazy="noload")

    def to_dict_safe(self):
        return {
            "id": self.id,
            "name": self.name,
            "code": self.code,
            "description": self.description,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

    def __repr__(self):
        return f"<EquipmentBrand(id={self.id}, name={self.name})>"


class Equipment(db.Model, BaseModel, TenantMixin, TimestampMixin, SoftDeleteMixin, AuditMixin, StatusMixin):
    __tablename__ = "equipment"
    __table_args__ = {"schema": "equip"}

    equipment_type = db.Column(db.String(20), default="")
    category_id = db.Column(db.String(11), db.ForeignKey("equip.equipment_categories.id"), nullable=True)
    brand = db.Column(db.String(100), default="")
    brand_id = db.Column(db.String(11), db.ForeignKey("equip.equipment_brands.id"), nullable=True)
    model_name = db.Column(db.String(100), nullable=False)
    equipment_code = db.Column(db.String(50), unique=True, nullable=True)
    imei = db.Column(db.String(50), unique=True, nullable=True)  # Legacy / premier IMEI
    serial_number = db.Column(db.String(100), default="")
    has_sim = db.Column(db.Boolean, default=False, nullable=False)

    owner_id = db.Column(db.String(11), db.ForeignKey("hrm.employees.id", ondelete="SET NULL"), nullable=True)
    employee_id = db.Column(db.String(11), db.ForeignKey("hrm.employees.id", ondelete="SET NULL"), nullable=True)

    # PENDING | FUNCTIONAL | FAULTY | UNDER_REPAIR | COMPLETELY_DAMAGED | LOST | STOLEN | TAKEN_AWAY
    status = db.Column(db.String(30), default="PENDING", nullable=False)
    is_unique = db.Column(db.Boolean, default=True, nullable=False)  # Unique = non partageable (1 employé à la fois)
    acquisition_date = db.Column(db.Date, nullable=True)
    warranty_expiry_date = db.Column(db.Date, nullable=True)
    assignment_date = db.Column(db.Date, nullable=True)
    reception_form_path = db.Column(db.String(500), default="")
    notes = db.Column(db.Text, default="")

    category_rel = db.relationship("EquipmentCategory", back_populates="equipments", lazy="noload")
    brand_rel = db.relationship("EquipmentBrand", back_populates="equipments", lazy="noload")
    owner = db.relationship("Employee", back_populates="owned_equipments", lazy="noload", foreign_keys=[owner_id])
    employee = db.relationship("Employee", back_populates="equipments", lazy="noload", foreign_keys=[employee_id])
    history = db.relationship("EquipmentHistory", back_populates="equipment", lazy="noload", cascade="all, delete-orphan")
    repair_tickets = db.relationship("RepairTicket", back_populates="equipment", lazy="noload")
    accessories = db.relationship("Accessory", back_populates="equipment", lazy="noload", cascade="all, delete-orphan")
    imeis = db.relationship("EquipmentImei", back_populates="equipment", lazy="noload", cascade="all, delete-orphan", order_by="EquipmentImei.slot_number")

    @property
    def is_status_active(self) -> bool:
        return self.status in ACTIVE_STATUSES

    def to_dict_safe(self):
        return {
            "id": self.id,
            "equipment_code": self.equipment_code,
            "equipment_type": self.equipment_type,
            "category_id": str(self.category_id) if self.category_id else None,
            "category_name": self.category_rel.name if self.category_rel else None,
            "brand": self.brand,
            "brand_id": str(self.brand_id) if self.brand_id else None,
            "brand_name": self.brand_rel.name if self.brand_rel else None,
            "model_name": self.model_name,
            "imei": self.imei,
            "serial_number": self.serial_number,
            "owner_id": str(self.owner_id) if self.owner_id else None,
            "owner_name": self.owner.get_full_name() if self.owner else None,
            "employee_id": str(self.employee_id) if self.employee_id else None,
            "employee_name": self.employee.get_full_name() if self.employee else None,
            "status": self.status,
            "is_active": self.is_status_active,
            "is_unique": self.is_unique,
            "acquisition_date": self.acquisition_date.isoformat() if self.acquisition_date else None,
            "warranty_expiry_date": self.warranty_expiry_date.isoformat() if self.warranty_expiry_date else None,
            "assignment_date": self.assignment_date.isoformat() if self.assignment_date else None,
            "reception_form_path": self.reception_form_path,
            "has_sim": self.has_sim,
            "imeis": [i.to_dict_safe() for i in self.imeis] if self.imeis else [],
            "notes": self.notes,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

    def __repr__(self):
        return f"<Equipment(id={self.id}, equipment_code={self.equipment_code})>"


class EquipmentHistory(db.Model, BaseModel, TenantMixin, TimestampMixin, SoftDeleteMixin, AuditMixin, StatusMixin):
    __tablename__ = "equipment_history"
    __table_args__ = {"schema": "equip"}

    equipment_id = db.Column(db.String(11), db.ForeignKey("equip.equipment.id", ondelete="CASCADE"), nullable=False)
    action = db.Column(db.String(30), nullable=False)  # CREATED, ASSIGNED, ASSIGNED_TO_EMPLOYEE, STATUS_CHANGED, TRANSFERRED, RETIRED
    old_value = db.Column(db.String(255), default="")
    new_value = db.Column(db.String(255), default="")
    notes = db.Column(db.Text, default="")

    equipment = db.relationship("Equipment", back_populates="history", lazy="noload")

    def to_dict_safe(self):
        return {
            "id": self.id,
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


class Accessory(db.Model, BaseModel, TenantMixin, TimestampMixin, SoftDeleteMixin, AuditMixin, StatusMixin):
    __tablename__ = "accessories"
    __table_args__ = {"schema": "equip"}

    equipment_id = db.Column(db.String(11), db.ForeignKey("equip.equipment.id", ondelete="CASCADE"), nullable=False)
    name = db.Column(db.String(150), nullable=False)
    description = db.Column(db.Text, default="")
    serial_number = db.Column(db.String(100), default="")
    status = db.Column(db.String(20), default="FUNCTIONAL")  # FUNCTIONAL, FAULTY, MISSING
    created_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = db.Column(db.DateTime(timezone=True), onupdate=lambda: datetime.now(timezone.utc))

    equipment = db.relationship("Equipment", back_populates="accessories", lazy="noload")

    def to_dict_safe(self):
        return {
            "id": self.id,
            "equipment_id": str(self.equipment_id),
            "name": self.name,
            "description": self.description,
            "serial_number": self.serial_number,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

    def __repr__(self):
        return f"<Accessory(id={self.id}, name={self.name})>"


class EquipmentImei(db.Model, BaseModel, TenantMixin, TimestampMixin, SoftDeleteMixin, AuditMixin, StatusMixin):
    """IMEI(s) d'un équipement. Un appareil peut avoir plusieurs IMEI (dual-SIM)."""
    __tablename__ = "equipment_imeis"
    __table_args__ = {"schema": "equip"}

    equipment_id = db.Column(db.String(11), db.ForeignKey("equip.equipment.id", ondelete="CASCADE"), nullable=False)
    imei = db.Column(db.String(15), unique=True, nullable=False)
    slot_number = db.Column(db.Integer, default=1, nullable=False)

    equipment = db.relationship("Equipment", back_populates="imeis", lazy="noload")

    def to_dict_safe(self):
        return {
            "id": self.id,
            "equipment_id": str(self.equipment_id),
            "imei": self.imei,
            "slot_number": self.slot_number,
        }

    def __repr__(self):
        return f"<EquipmentImei(id={self.id}, imei={self.imei})>"
