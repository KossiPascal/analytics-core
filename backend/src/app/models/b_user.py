import jwt
import time
import hmac
import secrets
import hashlib
from typing import Any, Dict, List, Tuple
from backend.src.app.models.c_role_permission import Permission, Role, RolePermission
from backend.src.app.models.a_tenant import Tenant
from datetime import datetime, timedelta, timezone
from backend.src.app.configs.environment import Config
from sqlalchemy.exc import SQLAlchemyError, IntegrityError
from itsdangerous import BadSignature, SignatureExpired
from backend.src.app.models._controls import *
from backend.src.app.models.f_employee import Employee, Position
from backend.src.app.configs.extensions import ADMIN, SUPERADMIN, db
from shared_libs.helpers.hasher import hash_password, verify_password

rate_limit_store: Dict[str, Tuple[int, int]] = {}  # client_id -> (count, first_ts)


class User(db.Model, BaseModel, TenantMixin, TimestampMixin, SoftDeleteMixin, NullableAuditMixin, StatusMixin):
    __tablename__ = "users"
    __table_args__ = {"schema": "core"}

    lastname = db.Column(db.String(255), nullable=True)
    firstname = db.Column(db.String(255), nullable=True)
    username = db.Column(db.String(150), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=True)
    email_verified_at = db.Column(db.DateTime(timezone=True), nullable=True)
    phone = db.Column(db.String(50), nullable=True)
    token = db.Column(db.String(255), nullable=True)
    remember_token = db.Column(db.String(255), nullable=True)
    salt = db.Column(db.String(255), nullable=True)
    must_login = db.Column(db.Boolean, nullable=False, default=True)
    has_changed_default_password = db.Column(db.Boolean, nullable=False, default=False)

    is_global = db.Column(db.Boolean, default=False) # 👉 Si True : accès à tout (super admin)

    employee = db.relationship("Employee", back_populates="user",lazy="noload", foreign_keys="Employee.user_id")

    datasource_permissions = db.relationship("DataSourcePermission",back_populates="user",foreign_keys="DataSourcePermission.user_id",lazy="noload",cascade="all, delete-orphan")
    datasource_histories = db.relationship("DataSourceHistory",back_populates="user",foreign_keys="DataSourceHistory.user_id",lazy="noload",cascade="all, delete-orphan")
    refresh_tokens = db.relationship("RefreshToken", back_populates="user", foreign_keys="RefreshToken.user_id", lazy="noload", cascade="all, delete-orphan")
    logs = db.relationship("UsersLog", back_populates="user", lazy="noload", foreign_keys="UsersLog.user_id", cascade="all, delete-orphan")
    
    # roles = db.relationship("Role",secondary="core.users_roles",lazy="noload", foreign_keys="Role.user_id",backref=db.backref("users", lazy="noload"))
    
    # roles = db.relationship(
    #     "Role",
    #     secondary="core.users_roles",
    #     primaryjoin="User.id == UserRole.user_id",
    #     secondaryjoin="Role.id == UserRole.role_id",
    #     foreign_keys="[UserRole.user_id, UserRole.role_id]",
    #     lazy="noload",
    #     backref=db.backref("users", lazy="noload")
    # )

    roles = db.relationship(
        "Role",
        secondary="core.users_roles",
        primaryjoin="and_(User.id == UserRole.user_id, User.tenant_id == UserRole.tenant_id)",
        secondaryjoin="and_(Role.id == UserRole.role_id, Role.tenant_id == UserRole.tenant_id)",
        foreign_keys="[UserRole.user_id, UserRole.role_id, UserRole.tenant_id]",
        lazy="noload",
    )
    
    histories = db.relationship("DataSourceHistory",lazy="noload", foreign_keys="DataSourceHistory.user_id",cascade="all, delete-orphan")
    memberships = db.relationship("Membership", back_populates="user", foreign_keys="Membership.user_id", lazy="noload", cascade="all, delete-orphan")
    activity_owners = db.relationship("ActivityOwner", back_populates="user", foreign_keys="ActivityOwner.user_id", lazy="noload", cascade="all, delete-orphan")
    
    initiatives = db.relationship(
        "Initiative",
        foreign_keys="[Initiative.owner_id]",
        lazy="noload",
        back_populates="owner"
    )

    @property
    def fullname(self):
        return " ".join(filter(None, [self.lastname, self.firstname]))
    
    @property
    def is_superadmin(self):
        roles:List[Role] = self.roles or []
        return any(role.is_system and role.name.lower() == "superadmin" for role in roles)

    def __repr__(self):
        return f"<User(username={self.username})>"
   
    def to_dict(self) -> dict:
        roles:List[Role] = [r for r in self.roles or [] if not r.deleted]
        permissions:List[Permission] = [p for r in roles for p in r.permissions or [] if not p.deleted]

        return {
            "id": self.id,
            "username": self.username,
            "lastname": self.lastname,
            "firstname": self.firstname,
            "fullname": self.fullname,
            "email": self.email,
            "phone": self.phone,
            "is_active": self.is_active,
            "deleted": self.deleted,
            "tenant_id": self.tenant_id,
            "tenant": self.tenant.to_dict() if self.tenant else None,
            "role_ids": [r.id for r in roles],
            "roles": [r.to_dict() for r in roles],
            "permission_ids": [p.id for p in permissions],
            "permissions": [p.to_dict() for p in permissions],
        }

    def to_dict_safe(self):
        payload = self.generate_permission_payload(onlyPayload = True)
        return {**payload, "created_at": self.created_at.isoformat() if self.created_at else None }

    def set_password(self, password: str):
        salt, hashed = hash_password(password)
        self.salt = salt
        self.password_hash = hashed
    
    def check_password(self, password: str) -> bool:
        return verify_password(password,self.salt,self.password_hash)
    
    def permissions_roles(self):
        """ Génère le payload JWT basé sur les rôles / permissions (caps). """
        roles: set[str] = set()
        permissions: set[str] = set()
        roles_list:List[Role] = self.roles or []
        for r in roles_list:
            if not r or r.deleted:
                continue
            roles.add(r.name.lower())
            perms:List[Permission] = r.permissions or []
            for p in perms:
                if p and p.name and not p.deleted:
                    permissions.add(p.name.strip().lower())
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
        position_code: str | None = None
        position_is_zone_assignable: bool = False

        try:
            emp:Employee = Employee.query.filter_by(user_id=self.id).first()
            if emp:
                employee_id = str(emp.id)
                position_id = str(emp.position_id) if emp.position_id else None
                if emp.position_id:
                    pos:Position = Position.query.get(emp.position_id)
                    if pos:
                        position_code = pos.code
                        position_is_zone_assignable = bool(getattr(pos, 'is_zone_assignable', False))
        except Exception:
            pass

        return {
            "id": self.id,
            "username": self.username,
            "lastname": self.lastname,
            "firstname": self.firstname,
            "fullname": self.fullname,
            "tenant_id": self.tenant_id if self.tenant_id else None,
            "roles": roles,
            "permissions": permissions,
            "is_active": self.is_active,
            "employee_id": employee_id,
            "position_id": position_id,
            "position_code": position_code,
            "position_is_zone_assignable": position_is_zone_assignable,
            "token_type": "access",
            "ver": 1,  # token versioning
        }

    def generate_permission_payload(self, onlyPayload:bool=False):
        """ Génère le payload JWT basé sur les rôles / permissions (caps). """
        payloadBrut = self.build_access_payload()
        
        token, exp, payload = User.encode(payload=payloadBrut)

        return payload if onlyPayload else (token, exp, payload)
    
    def has_role(self, name: str) -> bool:
        return any(
            role and role.name.lower() == name.lower()
            for role in (self.roles or [])
        )

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
            return False
        
        password = cfg.get("password")
        lastname = cfg.get("lastname", "Super")
        firstname = cfg.get("firstname", "Admin")
        tenant_name = cfg.get("tenant_name", "Admin Tenant")
        
        if not password:
            raise ValueError("DEFAULT_ADMIN.password is required")

        # Resolve or create tenant
        tenant = Tenant.query.filter_by(name=tenant_name).first()
        if not tenant:
            tenant = Tenant(name=tenant_name)
            db.session.add(tenant)
            db.session.flush()  # safely get tenant.id

        perm1 = Permission.query.filter_by(name=SUPERADMIN).first()
        if not perm1:
            perm1 = Permission(name=SUPERADMIN, tenant_id=tenant.id)
            db.session.add(perm1)
            db.session.flush()

        perm2 = Permission.query.filter_by(name=ADMIN).first()
        if not perm2:
            perm2 = Permission(name=ADMIN, tenant_id=tenant.id)
            db.session.add(perm2)
            db.session.flush()
        # print(perm2.to_dict())
        role_name="Administration"
        role:Role = Role.query.filter_by(name=role_name).first()
        if not role:
            role = Role(name=role_name,tenant_id=tenant.id,is_system=True)
            # role.tenant_id = tenant.id
            # permission1 = Permission.query.filter_by(name=SUPERADMIN).first()
            # permission2 = Permission.query.filter_by(name=ADMIN).first()
            print(role.to_dict())
            db.session.add(role)
            db.session.flush()
            
            # role.permissions = [perm1, perm2]
            for p in [perm1, perm2]:
                rp = RolePermission(role_id=role.id,permission_id=p.id,tenant_id=tenant.id)
                db.session.add(rp)
            
            db.session.flush()

        # Create admin
        admin:User = cls(
            username=username,
            lastname=lastname,
            firstname=firstname,
            tenant_id=tenant.id,
            has_changed_default_password=True,
            must_login=False,
            is_active=True,
        )
        admin.set_password(password)
        admin.tenant = tenant
        admin_role = Role.query.filter_by(name=role_name).first()
        admin.roles = [admin_role]
        
        db.session.add(admin)

        try:
            db.session.commit()
            return True
        except IntegrityError:
            db.session.rollback()
            existing = cls.query.filter_by(username=username).first()
            if existing:
                return False
            raise

    @staticmethod
    def encode(payload: Dict[str, Any],expires_in_minutes: int | None = None,useJWT: bool = True) -> Tuple[str, int, Dict[str, Any]]:
        """
        Encode an access token.
        Returns: token: encoded token, exp: expiration timestamp (seconds), full_payload
        """
        now = int(time.time())  # seconds
        ttl_minutes = (expires_in_minutes if expires_in_minutes is not None else Config.ACCESS_TOKEN_EXPIRES_MINUTES)
        if ttl_minutes is None:
            raise ValueError("ACCESS_TOKEN_EXPIRES_MINUTES is not configured")

        ttl_seconds = ttl_minutes * 60
        exp = now + ttl_seconds
        full_payload = { **payload, "iat": now, "exp": exp, "jti": secrets.token_hex(8), "typ": "access" }
        if useJWT:
            token = jwt.encode(
                full_payload, 
                Config.JWT_SECRET_KEY, 
                algorithm=Config.JWT_ALGORITHM
            )
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

class UsersLog(db.Model, BaseModel, TenantMixin, TimestampMixin, SoftDeleteMixin, AuditMixin, StatusMixin):
    __tablename__ = "user_logs"
    __table_args__ = (
        db.Index("idx_user_logs_created_at", "created_at"),
        {"schema": "core"},
    )

    user_id = db.Column(db.String(11), db.ForeignKey("core.users.id", ondelete="CASCADE", onupdate="CASCADE"), nullable=False, index=True)

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

    user = db.relationship("User", back_populates="logs",lazy="noload",foreign_keys=[user_id])

    def to_dict(self):
        return { 
            "user_id": self.user_id, 
            "user_agent": self.user_agent 
        }

class UserRole(db.Model, BaseModel, TenantMixin, TimestampMixin, SoftDeleteMixin, NullableAuditMixin, StatusMixin):
    __tablename__ = "users_roles"
    __table_args__ = {"schema": "core"}

    user_id = db.Column(db.String(11), db.ForeignKey("core.users.id", ondelete="CASCADE", onupdate="CASCADE"), primary_key=True)
    role_id = db.Column(db.String(11), db.ForeignKey("core.roles.id", ondelete="CASCADE", onupdate="CASCADE"), primary_key=True)

    # user = db.relationship("User", lazy="noload")
    # role = db.relationship("Role", lazy="noload")
    # 🔹 ici on indique explicitement la FK vers User et Role
    user = db.relationship(
        "User",
        lazy="noload",
        foreign_keys=[user_id],
        backref=db.backref("user_roles", lazy="noload", cascade="all, delete-orphan")
    )
    role = db.relationship(
        "Role",
        lazy="noload",
        foreign_keys=[role_id],
        backref=db.backref("user_roles", lazy="noload", cascade="all, delete-orphan")
    )

    def to_dict(self):
        return { 
            "role_id": self.role_id,
            "role": self.role.to_dict() if self.role else None,
            "user_id": self.user_id,
            "user": self.user.to_dict() if self.user else None,
        }

class UserPermission(db.Model, BaseModel, TenantMixin, TimestampMixin, SoftDeleteMixin, NullableAuditMixin, StatusMixin):
    __tablename__ = "users_permissions"
    __table_args__ = {"schema": "core"}

    user_id = db.Column(db.String(11), db.ForeignKey("core.users.id", ondelete="CASCADE", onupdate="CASCADE"), primary_key=True)
    permission_id = db.Column(db.String(11), db.ForeignKey("core.permissions.id", ondelete="CASCADE", onupdate="CASCADE"), primary_key=True)

    # user = db.relationship("User", lazy="noload")
    # permission = db.relationship("Permission", lazy="noload")

    user = db.relationship(
        "User",
        lazy="noload",
        foreign_keys=[user_id],
        backref=db.backref("users_permissions", lazy="noload", cascade="all, delete-orphan")
    )

    permission = db.relationship(
        "Permission",
        lazy="noload",
        foreign_keys=[permission_id],
        backref=db.backref("users_permissions", lazy="noload", cascade="all, delete-orphan")
    )
    def to_dict(self):
        return { 
            "user_id": self.user_id,
            "permission_id": self.permission_id,
            "user": self.user.to_dict() if self.user else None,
            "permission": self.permission.to_dict() if self.permission else None,
        }

class RefreshToken(db.Model, BaseModel, TenantMixin, TimestampMixin, SoftDeleteMixin, NullableAuditMixin, StatusMixin):
    __tablename__ = "refresh_tokens"
    __table_args__ = {"schema": "core"}

    user_id = db.Column(db.String(11), db.ForeignKey("core.users.id", ondelete="CASCADE", onupdate="CASCADE"), nullable=False, index=True)

    token = db.Column(db.String(255), unique=True, nullable=False)  # hashed
    expires_at = db.Column(db.DateTime(timezone=True), nullable=False)
    revoked = db.Column(db.Boolean, default=False, nullable=False)
    revoked_at = db.Column(db.DateTime(timezone=True), nullable=True)

    # Foreign key to user
    user = db.relationship("User", back_populates="refresh_tokens",lazy="noload",foreign_keys=[user_id])

    def is_valid(self):
        return not self.revoked and self.expires_at > datetime.now(timezone.utc)

    @staticmethod
    def hash_token(raw_token: str | bytes) -> str:
        if isinstance(raw_token, str):
            raw_token = raw_token.encode("utf-8")
        salt = Config.REFRESH_TOKEN_SALT
        if isinstance(salt, str):
            salt = salt.encode("utf-8")
        return hashlib.pbkdf2_hmac(
            "sha256",
            raw_token,
            salt,
            Config.HASH_ITERATIONS,
        ).hex()
    
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
    def isDecoded(raw_token: str, hashed_token_from_db: str, expires_at: datetime, revoked_at: datetime | None = None) -> bool:
        if revoked_at:
            raise ValueError("Refresh token revoked")

        if expires_at <= datetime.now(timezone.utc):
            raise ValueError("Refresh token expired")

        computed_hash = RefreshToken.hash_token(raw_token)

        if not hmac.compare_digest(computed_hash, hashed_token_from_db):
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
    def save_refresh_token(user: User, hashed_token: str, expires_at: datetime) -> "RefreshToken":
        """Save a new refresh token in DB."""
        try:
            rt = RefreshToken(user_id=user.id, tenant_id=user.tenant_id, token=hashed_token, expires_at=expires_at, revoked=False)
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
    

    @staticmethod
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

    
