import random, secrets, string
from datetime import datetime
from backend.src.app.configs.extensions import db
from sqlalchemy.orm import Session, declared_attr
from sqlalchemy.exc import IntegrityError


ALPHABET = string.ascii_letters + string.digits

def generate_uid():
    return ''.join(secrets.choice(ALPHABET) for _ in range(11))
    # return ''.join(random.choices(string.ascii_letters + string.digits, k=11))

def generate_unique_uid(session, model):
    while True:
        uid = generate_uid()
        exists = session.query(model).filter_by(id=uid).first()
        if not exists:
            return uid

def safe_commit(session:Session=db.session):
    for _ in range(3):  # retry max
        try:
            session.commit()
            return
        except IntegrityError:
            session.rollback()
    raise Exception("UID collision too many times")



class BaseModel:
    id = db.Column(db.String(11),primary_key=True,default=generate_uid,nullable=False, index=True)


class TenantMixin:
    """
    Ajouter tenant_id et relation tenant à tous les modèles multi-tenant.
    back_populates doit être défini par chaque classe via __tenant_backref__.
    """

    @declared_attr
    def tenant_id(cls):
        # RESTRICT empêche la suppression d’un tenant s’il a encore des enfants.
        return db.Column(db.String(11),db.ForeignKey("core.tenants.id", ondelete="RESTRICT"),nullable=False,index=True)
        # return db.Column(db.String(11),db.ForeignKey("core.tenants.id", ondelete="CASCADE", onupdate="CASCADE"),nullable=False,index=True)

    @declared_attr
    def tenant(cls):
        # Chaque modèle doit définir __tenant_backref__ = "nom_de_la_relation_vers_enfants"
        # backref_name = getattr(cls, "__tenant_backref__", None)
        backref_name = getattr(cls, "__tablename__", None)
        if backref_name is None:
            raise NotImplementedError(
                f"Vous devez définir __tenant_backref__ sur {cls.__name__} "
                f"(ex: __tenant_backref__ = 'projects' pour Project)"
            )
        return db.relationship("Tenant", back_populates=backref_name, lazy="noload",foreign_keys=[cls.tenant_id])


class TimestampMixin:
    @declared_attr
    def created_at(cls):
        return db.Column(db.DateTime(timezone=True), server_default=db.func.now(), nullable=False, index=True)

    @declared_attr
    def updated_at(cls):
        return db.Column(db.DateTime(timezone=True), onupdate=db.func.now(), nullable=True)


class SoftDeleteMixin:
    @declared_attr 
    def deleted(cls): 
        return db.Column(db.Boolean, default=False, nullable=False)
    
    @declared_attr
    def deleted_at(cls):
        return db.Column(db.DateTime(timezone=True), nullable=True, index=True)

    @declared_attr
    def deleted_by_id(cls):
        return db.Column(db.String(11), db.ForeignKey("core.users.id"), index=True)

    @declared_attr
    def deleted_by(cls):
        return db.relationship("User", foreign_keys=[cls.deleted_by_id])

    def soft_delete(self, user_id:str):
        self.is_active = False
        self.deleted = True
        self.deleted_at = datetime.utcnow()
        self.deleted_by_id = user_id


class AuditMixin:
    """Audit obligatoire: created_by non nullable"""

    @declared_attr
    def created_by_id(cls):
        return db.Column(db.String(11),db.ForeignKey("core.users.id"),nullable=False)

    @declared_attr
    def created_by(cls):
        return db.relationship("User",foreign_keys=[cls.created_by_id],lazy="joined")

    @declared_attr
    def updated_by_id(cls):
        return db.Column(db.String(11),db.ForeignKey("core.users.id"),nullable=True)

    @declared_attr
    def updated_by(cls):
        return db.relationship("User",foreign_keys=[cls.updated_by_id],lazy="joined")


class NullableAuditMixin:
    """Audit optionnel: created_by nullable"""

    @declared_attr
    def created_by_id(cls):
        return db.Column(db.String(11),db.ForeignKey("core.users.id"),nullable=True)

    @declared_attr
    def created_by(cls):
        return db.relationship("User",foreign_keys=[cls.created_by_id],lazy="joined")

    @declared_attr
    def updated_by_id(cls):
        return db.Column(db.String(11),db.ForeignKey("core.users.id"),nullable=True)

    @declared_attr
    def updated_by(cls):
        return db.relationship("User",foreign_keys=[cls.updated_by_id],lazy="joined")


class StatusMixin:
    @declared_attr
    def is_active(cls):
        return db.Column(db.Boolean, default=True, nullable=False, index=True)

# BaseModel, TenantMixin, TimestampMixin, SoftDeleteMixin, AuditMixin, StatusMixin

# class DeletedRecord(db.Model):
#     __tablename__ = "deleted_records"
#     __table_args__ = {"schema": "core"}

#     id = db.Column(db.String(11), primary_key=True)
#     table_name = db.Column(db.String(100), nullable=False)
#     record_id = db.Column(db.String(11), nullable=False)
#     data = db.Column(JSONB, nullable=False)
#     deleted_at = db.Column(db.DateTime(timezone=True), server_default=db.func.now())
#     deleted_by = db.Column(db.String(11))