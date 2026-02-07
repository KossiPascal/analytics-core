import uuid
from datetime import datetime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.exc import IntegrityError
from backend.src.database.extensions import db, tokenManagement
from backend.src.config import Config
from backend.src.helpers.hasher import hash_password, verify_password
from hashlib import sha256

# -------------------- TENANT --------------------
class Tenant(db.Model):
    __tablename__ = "tenants"

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = db.Column(db.String(255), nullable=False, unique=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    users = db.relationship("User", back_populates="tenant", cascade="all, delete-orphan")
    datasets = db.relationship("Dataset", back_populates="tenant", cascade="all, delete-orphan")
    data_sources = db.relationship("DataSource", back_populates="tenant", cascade="all, delete-orphan")
    visualizations = db.relationship("Visualization", back_populates="tenant", cascade="all, delete-orphan")
    deleted = db.Column(db.Boolean, default=False)
    deleted_at = db.Column(db.DateTime, nullable=True)

    def to_dict_safe(self):
        return {
            "id": str(self.id), 
            "name": self.name, 
            "created_at": self.created_at.isoformat()
        }
    
    @classmethod
    def active(cls):
        return cls.query.filter_by(deleted=False)

    
    def __repr__(self):
        return f"<Tenant {self.name}>"
    
class Permission(db.Model):
    __tablename__ = "permissions"

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = db.Column(db.String(150), nullable=False)   # dashboard:read, report:create, chart:update
    description = db.Column(db.String(255), nullable=True)
    deleted = db.Column(db.Boolean, default=False)
    deleted_at = db.Column(db.DateTime, nullable=True)

    def to_dict_safe(self):
        return {
            "id": str(self.id),
            "name": self.name,
            "description": self.description
        }

    def __repr__(self):
        return f"<Permission {self.name}>"
    
class Role(db.Model):
    __tablename__ = "roles"

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = db.Column(db.String(100), nullable=False)
    tenant_id = db.Column(UUID(as_uuid=True), db.ForeignKey("tenants.id"), nullable=True)
    is_system = db.Column(db.Boolean, default=False)
    deleted = db.Column(db.Boolean, default=False)
    deleted_at = db.Column(db.DateTime, nullable=True)
    permissions = db.relationship(Permission,secondary="role_permissions",lazy="selectin")

    def to_dict_safe(self):
        return {
            "id": str(self.id), 
            "name": self.name, 
            "tenant_id": str(self.tenant_id) if self.tenant_id else None, 
            "is_system": self.is_system
        }

    def __repr__(self):
        return f"<Role {self.name}>"
    
class RolePermission(db.Model):
    __tablename__ = "role_permissions"

    role_id = db.Column(UUID(as_uuid=True), db.ForeignKey("roles.id"), primary_key=True)
    permission_id = db.Column(UUID(as_uuid=True), db.ForeignKey("permissions.id"), primary_key=True)

# UsersLog model
class UsersLog(db.Model):
    __tablename__ = "users_log"

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey("users.id", ondelete="CASCADE", onupdate="CASCADE"), nullable=False, index=True)
    user = db.relationship("User", back_populates="logs", lazy="joined")

    method = db.Column(db.String(10), nullable=False)
    url = db.Column(db.String(1024), nullable=False)
    user_agent = db.Column(db.String(255), nullable=True)
    client_ip = db.Column(db.String(45), nullable=True)  # IPv4 + IPv6
    referer = db.Column(db.String(1024), nullable=True)
    accept_language = db.Column(db.String(255), nullable=True)
    browser = db.Column(db.String(100), nullable=True)
    os = db.Column(db.String(100), nullable=True)
    platform = db.Column(db.String(100), nullable=True)
    device = db.Column(db.String(100), nullable=True)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    def to_dict(self):
        return {
            "id": str(self.id),
            "user_id": str(self.user_id),
            "method": self.method,
            "url": self.url,
            "client_ip": self.client_ip,
            "browser": self.browser,
            "os": self.os,
            "device": self.device,
            "timestamp": self.timestamp.isoformat(),
        }

    def __repr__(self):
        return f"<UsersLog {self.method} {self.url}>"


# class PermissionsPayload:
#     def __init__(self, token: str, payload: str):
#         self.token = token
#         self.payload = payload

# User model
class User(db.Model):
    __tablename__ = "users"

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = db.Column(UUID(as_uuid=True), db.ForeignKey('tenants.id'), nullable=False)

    fullname = db.Column(db.String(255), nullable=True)
    username = db.Column(db.String(150), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)

    # Optional fields
    email = db.Column(db.String(255), unique=True, nullable=True)
    email_verified_at = db.Column(db.DateTime, nullable=True)
    phone = db.Column(db.String(50), nullable=True)

    token = db.Column(db.String(255), nullable=True)
    remember_token = db.Column(db.String(255), nullable=True)
    salt = db.Column(db.String(255), nullable=True)
    
    is_active = db.Column(db.Boolean, nullable=False, default=True)
    is_deleted = db.Column(db.Boolean, nullable=False, default=False)
    must_login = db.Column(db.Boolean, nullable=False, default=True)
    has_changed_default_password = db.Column(db.Boolean, nullable=False, default=False)

    # List of orgunit dictionaries
    orgunits = db.Column(db.JSON, nullable=True, default=list)  # e.g., [{"id1": [...]}, {"id2": [...]}]

    # Audit fields
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    created_by = db.Column(UUID(as_uuid=True), nullable=True)
    updated_at = db.Column(db.DateTime, onupdate=datetime.utcnow, nullable=True)
    updated_by = db.Column(UUID(as_uuid=True), nullable=True)

    # Relationships
    refresh_tokens = db.relationship("RefreshToken", back_populates="user", cascade="all, delete-orphan")
    logs = db.relationship(UsersLog, back_populates="user", cascade="all, delete-orphan")
    tenant = db.relationship(Tenant, back_populates="users")
    roles = db.relationship(Role,secondary="user_roles",lazy="selectin")

    
    def set_password(self, password: str):
        self.password_hash = hash_password(password)
    
    def check_password(self, password: str) -> bool:
        return verify_password(password,self.password_hash)
    
    def permissions_roles(self):
        """ Génère le payload JWT basé sur les rôles / permissions (caps). """
        roles: set[str] = set()
        permissions: set[str] = set()

        for role in self.roles or []:
            if not role or role.deleted:
                continue
            
            roles.add(role.name.lower())
            
            for perm in role.permissions or []:
                if perm and perm.name and not perm.deleted:
                    permissions.add(perm.name.strip().lower())

        permissions.add("_admin")
        permissions.add("_superadmin")

        return sorted(roles), sorted(permissions)

    def has_permission(self, name: str) -> bool:
        name = name.strip().lower()
        roles, permissions = self.permissions_roles()
        return any(perm.lower() == name for perm in permissions)
    
    def generate_permission_payload(self, onlyPayload:bool=False):
        """ Génère le payload JWT basé sur les rôles / permissions (caps). """

        roles, permissions = self.permissions_roles()

        payload = {
            "id": str(self.id),
            "username": self.username,
            "fullname": self.fullname,
            "tenant_id": str(self.tenant_id) if self.tenant_id else None,
            "roles": roles,
            "permissions": permissions,
            "is_active": self.is_active,
            "token_type": "access",
            "ver": 1,  # token versioning
        }
        return payload if onlyPayload else tokenManagement.encode(payload)

                    
    
    def has_role(self, name: str) -> bool:
        return any(role.name.lower() == name.lower() for role in self.roles)

    def is_admin(self) -> bool:
        return self.has_role("admin") or self.has_role("superadmin")

    def is_editor(self) -> bool:
        return self.has_role("editor")

    def is_viewer(self) -> bool:
        return self.has_role("viewer")

    
    # Utility methods
    def to_dict_safe(self):
        payload = self.generate_permission_payload(onlyPayload = True)
        return {**payload, "created_at": self.created_at.isoformat(),
        }

    @classmethod
    def create_default_admin(cls):
        cfg = Config.DEFAULT_ADMIN or {}

        username = cfg.get("username")
        if not username:
            raise ValueError("DEFAULT_ADMIN.username is required")

        # Check if admin already exists
        existing = cls.query.filter_by(username=username).first()
        if existing:
            return existing
        
        password = cfg.get("password")
        fullname = cfg.get("fullname", "Super Admin")
        tenant_name = cfg.get("tenant_name", "Admin Tenant")
        
        if not password:
            raise ValueError("DEFAULT_ADMIN.password is required")

        # Resolve or create tenant
        tenant = Tenant.query.filter_by(name=tenant_name).first()

        if not tenant:
            tenant = Tenant(name=tenant_name)
            db.session.add(tenant)
            db.session.flush()  # safely get tenant.id

        # -----------------------------
        # Create admin
        # -----------------------------
        admin = cls(username=username,fullname=fullname,tenant_id=tenant.id,is_active=True,must_login=True)
        admin.set_password(password)

        db.session.add(admin)
        try:
            db.session.commit()
            return admin
        except IntegrityError:
            db.session.rollback()
            # race-condition safety
            existing = cls.query.filter_by(username=username).first()
            if existing:
                return existing
            raise


    def __repr__(self):
        return f"<User(username={self.username},roles={self.roles})>"

class UserRole(db.Model):
    __tablename__ = "user_roles"

    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey("users.id"), primary_key=True)
    role_id = db.Column(UUID(as_uuid=True), db.ForeignKey("roles.id"), primary_key=True)


# RefreshToken model
class RefreshToken(db.Model):
    __tablename__ = "refresh_tokens"

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    token = db.Column(db.String(255), unique=True, nullable=False)  # hashed
    issued_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    expires_at = db.Column(db.DateTime, nullable=False)
    revoked = db.Column(db.Boolean, default=False, nullable=False)

    # Foreign key to user
    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    user = db.relationship("User", back_populates="refresh_tokens")

    def is_valid(self):
        return not self.revoked and self.expires_at > datetime.utcnow()

    def hash_token(token: str) -> str:
        return sha256(token.encode()).hexdigest()

    def __repr__(self):
        return f"<RefreshToken user={self.user_id} revoked={self.revoked}>"

