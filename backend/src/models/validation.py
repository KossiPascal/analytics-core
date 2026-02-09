from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from backend.src.database.extensions import db

class Validation(db.Model):
    __tablename__ = "validations"

    # Primary key
    id = db.Column(db.String, primary_key=True, nullable=False)  # keeps same type as TypeORM (text)

    # Fields
    uid = db.Column(db.String, nullable=True)
    is_validate = db.Column(db.Boolean, nullable=False, default=False)
    validated_at = db.Column(db.DateTime(timezone=True), nullable=True)
    canceled_at = db.Column(db.DateTime(timezone=True), nullable=True)
    on_dhis2 = db.Column(db.Boolean, nullable=False, default=False)
    on_dhis2_at = db.Column(db.DateTime(timezone=True), nullable=True)

    # Foreign key references to User
    validated_by = db.Column(UUID(as_uuid=True), db.ForeignKey("users.id"), nullable=True)
    validated_by = relationship("User", foreign_keys=[validated_by], lazy="joined")

    canceled_by = db.Column(UUID(as_uuid=True), db.ForeignKey("users.id"), nullable=True)
    canceled_by = relationship("User", foreign_keys=[canceled_by], lazy="joined")

    on_dhis2_by = db.Column(UUID(as_uuid=True), db.ForeignKey("users.id"), nullable=True)
    on_dhis2_by = relationship("User", foreign_keys=[on_dhis2_by], lazy="joined")

    def __repr__(self):
        return f"<Validation id={self.id} uid={self.uid} is_validate={self.is_validate}>"
