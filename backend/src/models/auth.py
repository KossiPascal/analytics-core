import jwt
import time
import secrets
import hashlib
import hmac
from typing import Any, Dict, Tuple
from datetime import datetime, timedelta, timezone
from sqlalchemy.exc import IntegrityError
from backend.src.databases.extensions import db
from backend.src.config import Config
from backend.src.helpers.hasher import hash_password, verify_password
from sqlalchemy.exc import SQLAlchemyError
from itsdangerous import BadSignature, SignatureExpired


rate_limit_store: Dict[str, Tuple[int, int]] = {}  # client_id -> (count, first_ts)


# -------------------- TENANT --------------------
class Tenant(db.Model):
    __tablename__ = "tenants"

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    name = db.Column(db.String(255), nullable=False, unique=True)
    created_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    users = db.relationship("User", back_populates="tenant", cascade="all, delete-orphan")
    datasets = db.relationship("Dataset", back_populates="tenant", cascade="all, delete-orphan")
    data_sources = db.relationship("DataSource", back_populates="tenant", cascade="all, delete-orphan")
    visualizations = db.relationship("Visualization", back_populates="tenant", cascade="all, delete-orphan")
    deleted = db.Column(db.Boolean, default=False)
    deleted_at = db.Column(db.DateTime(timezone=True), nullable=True)

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

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    name = db.Column(db.String(150), nullable=False)   # dashboard:read, report:create, chart:update
    description = db.Column(db.String(255), nullable=True)
    deleted = db.Column(db.Boolean, default=False)
    deleted_at = db.Column(db.DateTime(timezone=True), nullable=True)

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

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    name = db.Column(db.String(100), nullable=False)
    tenant_id = db.Column(db.BigInteger, db.ForeignKey("tenants.id"), nullable=True)
    is_system = db.Column(db.Boolean, default=False)
    deleted = db.Column(db.Boolean, default=False)
    deleted_at = db.Column(db.DateTime(timezone=True), nullable=True)
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

    role_id = db.Column(db.BigInteger, db.ForeignKey("roles.id"), primary_key=True)
    permission_id = db.Column(db.BigInteger, db.ForeignKey("permissions.id"), primary_key=True)

# UsersLog model
class UsersLog(db.Model):
    __tablename__ = "users_log"

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    user_id = db.Column(db.BigInteger, db.ForeignKey("users.id", ondelete="CASCADE", onupdate="CASCADE"), nullable=False, index=True)
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
    timestamp = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

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

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    tenant_id = db.Column(db.BigInteger, db.ForeignKey('tenants.id'), nullable=False)

    fullname = db.Column(db.String(255), nullable=True)
    username = db.Column(db.String(150), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)

    # Optional fields
    email = db.Column(db.String(255), unique=True, nullable=True)
    email_verified_at = db.Column(db.DateTime(timezone=True), nullable=True)
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
    created_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    created_by = db.Column(db.BigInteger, nullable=True)
    updated_at = db.Column(db.DateTime(timezone=True), onupdate=lambda: datetime.now(timezone.utc), nullable=True)
    updated_by = db.Column(db.BigInteger, nullable=True)

    # Relationships
    refresh_tokens = db.relationship("RefreshToken", back_populates="user", cascade="all, delete-orphan")
    logs = db.relationship(UsersLog, back_populates="user", cascade="all, delete-orphan")
    tenant = db.relationship(Tenant, back_populates="users")
    roles = db.relationship(Role,secondary="user_roles",lazy="selectin")

    def __repr__(self):
        return f"<User(username={self.username},roles={self.roles})>"
   
    # Utility methods
    def to_dict_safe(self):
        payload = self.generate_permission_payload(onlyPayload = True)
        return {
            **payload,
            "email": self.email,
            "phone": self.phone,
            "created_at": self.created_at.isoformat(),
        }

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
   
    def build_access_payload(self) -> dict:
        roles, permissions = self.permissions_roles()

        # Lier l'employé associé à cet utilisateur (import local pour éviter les imports circulaires)
        employee_id: str | None = None
        position_id: str | None = None
        department_code: str | None = None
        try:
            from backend.src.equipment_manager.models.employees import Employee as _Emp, Position as _Pos
            emp = _Emp.query.filter_by(user_id=self.id).first()
            if emp:
                employee_id = str(emp.id)
                position_id = str(emp.position_id) if emp.position_id else None
                if emp.position_id:
                    pos = _Pos.query.get(emp.position_id)
                    if pos and pos.department:
                        department_code = pos.department.code
        except Exception:
            pass

        return {
            "id": str(self.id),
            "username": self.username,
            "fullname": self.fullname,
            "tenant_id": str(self.tenant_id) if self.tenant_id else None,
            "roles": roles,
            "permissions": permissions,
            "is_active": self.is_active,
            "employee_id": employee_id,
            "position_id": position_id,
            "department_code": department_code,
            "token_type": "access",
            "ver": 1,  # token versioning
        }

    def generate_permission_payload(self, onlyPayload:bool=False):
        """ Génère le payload JWT basé sur les rôles / permissions (caps). """
        payloadBrut = self.build_access_payload()
        token, exp, payload = User.encode(payload=payloadBrut)

        return payload if onlyPayload else (token, exp, payload)
    
    def has_role(self, name: str) -> bool:
        return any(role.name.lower() == name.lower() for role in self.roles)

    def is_admin(self) -> bool:
        return self.has_role("admin") or self.has_role("superadmin")

    def is_editor(self) -> bool:
        return self.has_role("editor")

    def is_viewer(self) -> bool:
        return self.has_role("viewer")

 
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

    @staticmethod
    def encode(payload: Dict[str, Any],expires_in_minutes: int | None = None,useJWT: bool = True) -> Tuple[str, int, Dict[str, Any]]:
        """
        Encode an access token.
        Returns: token: encoded token, exp: expiration timestamp (seconds), full_payload
        """
        now = int(time.time())  # seconds

        ttl_minutes = (expires_in_minutes if expires_in_minutes is not None else Config.ACCESS_TOKEN_EXPIRES_MINUTES)
        if not ttl_minutes:
            raise ValueError("ACCESS_TOKEN_EXPIRES_MINUTES is not configured")

        ttl_seconds = ttl_minutes * 60
        exp = now + ttl_seconds

        full_payload = { **payload, "iat": now, "exp": exp, "jti": secrets.token_hex(8), "typ": "access" }

        if useJWT:
            token = jwt.encode(full_payload, Config.JWT_SECRET_KEY, algorithm=Config.JWT_ALGORITHM)
        else:
            token = Config.SERIALISER.dumps(full_payload)

        return token, exp, full_payload

    @staticmethod
    def decode(token: str, useJWT: bool = True) -> Dict[str, Any]:
        """
        Decode and validate an access token.
        Raises ValueError if invalid or expired.
        """
        if useJWT:
            try:
                return jwt.decode(token, Config.JWT_SECRET_KEY, algorithms=[Config.JWT_ALGORITHM])
            except jwt.ExpiredSignatureError:
                raise ValueError("Access token expired")
            except jwt.InvalidTokenError:
                raise ValueError("Invalid access token")
        try:
            return Config.SERIALISER.loads(token, max_age=Config.ACCESS_TOKEN_EXPIRES_MINUTES * 60)
        except SignatureExpired:
            raise ValueError("Access token expired")
        except BadSignature:
            raise ValueError("Invalid access token")
        except Exception:
            raise ValueError("Invalid or expired access token")

    @staticmethod
    def is_expired(exp: int) -> bool:
        """ Check expiration from exp timestamp (seconds) """
        return int(time.time()) >= exp



class UserRole(db.Model):
    __tablename__ = "user_roles"

    user_id = db.Column(db.BigInteger, db.ForeignKey("users.id"), primary_key=True)
    role_id = db.Column(db.BigInteger, db.ForeignKey("roles.id"), primary_key=True)


class RefreshToken(db.Model):
    __tablename__ = "refresh_tokens"

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    token = db.Column(db.String(255), unique=True, nullable=False)  # hashed
    issued_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    expires_at = db.Column(db.DateTime(timezone=True), nullable=False)
    revoked = db.Column(db.Boolean, default=False, nullable=False)
    revoked_at = db.Column(db.DateTime(timezone=True), nullable=True)

    # Foreign key to user
    user_id = db.Column(db.BigInteger, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    user = db.relationship("User", back_populates="refresh_tokens")

    def is_valid(self):
        return not self.revoked and self.expires_at > datetime.now(timezone.utc)

    @staticmethod
    def hash_token(raw_token: str) -> str:
        # return sha256(raw_token.encode()).hexdigest()
        return hashlib.pbkdf2_hmac("sha256",raw_token.encode(),Config.REFRESH_TOKEN_SALT,Config.HASH_ITERATIONS).hex()

    def __repr__(self):
        return f"<RefreshToken user={self.user_id} revoked={self.revoked}>"


    @staticmethod
    def encode(days: int | None = None) -> Tuple[str, str, datetime]:
        """
        Generate refresh token.
        Returns: raw_token: token sent to client hashed_token: token stored in DB expires_at: UTC datetime
        """
        expires_days = days or Config.REFRESH_TOKEN_EXPIRES_DAYS
        raw_token = secrets.token_urlsafe(64)
        hashed_token = RefreshToken.hash_token(raw_token)
        expires_at = datetime.now(timezone.utc) + timedelta(days=expires_days)
        return raw_token, hashed_token, expires_at

    @staticmethod
    def isDecoded(raw_token: str,hashed_token_from_db: str,expires_at: datetime,revoked_at: datetime | None = None) -> bool:
        """
        Validate refresh token using DB state. Raises ValueError if invalid.
        """
        if revoked_at is not None:
            raise ValueError("Refresh token revoked")

        now = datetime.now(timezone.utc)
        if expires_at <= now:
            raise ValueError("Refresh token expired")

        computed_hash = RefreshToken.hash_token(raw_token)
        if not hmac.compare_digest(computed_hash,hashed_token_from_db):
            raise ValueError("Invalid refresh token")

        return True

    @staticmethod
    def rotate(old_refresh_token_row:"RefreshToken") -> Tuple[str, str, datetime]:
        """
        Revoke old token and generate a new one.
        """
        old_refresh_token_row.revoked = True
        old_refresh_token_row.revoked_at = datetime.now(timezone.utc)

        return RefreshToken.encode()
    
    @staticmethod
    def save_refresh_token(user_id: str, hashed_token: str, expires_at: datetime) -> "RefreshToken":
        """Save a new refresh token in DB."""
        try:
            rt = RefreshToken(user_id=user_id, token=hashed_token, expires_at=expires_at, revoked=False)
            db.session.add(rt)
            db.session.commit()
            return rt
        except SQLAlchemyError as e:
            db.session.rollback()
            # logger.error(f"Failed to save refresh token: {str(e)}")
            raise e

    @staticmethod
    def check_rate_limit(client_id: str) -> bool:
        """Simple sliding window per-client rate limit (in-memory)."""
        now = int(time.time())
        entry = rate_limit_store.get(client_id)
        if not entry:
            rate_limit_store[client_id] = (1, now)
            return True
        count, first_ts = entry
        if now - first_ts > Config.REFRESH_RATE_LIMIT_WINDOW_SECONDS:
            rate_limit_store[client_id] = (1, now)
            return True
        if count >= Config.REFRESH_RATE_LIMIT_MAX:
            return False
        rate_limit_store[client_id] = (count + 1, first_ts)
        return True
    


    def revoke_refresh_token(rt_obj: "RefreshToken") -> None:
        """Revoke an existing refresh token."""
        try:
            rt_obj.revoked = True
            rt_obj.revoked_at = datetime.now(timezone.utc)
            db.session.commit()
        except SQLAlchemyError as e:
            db.session.rollback()
            # logger.error(f"Failed to revoke refresh token: {str(e)}")
            raise e