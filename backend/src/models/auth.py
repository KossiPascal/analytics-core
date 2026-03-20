import jwt
import time
import secrets
import hashlib
import hmac
from typing import Any, Dict, List, Tuple
from datetime import datetime, timedelta, timezone

from backend.src.databases.extensions import ADMIN, SUPERADMIN, db
from backend.src.config import Config
from backend.src.helpers.hasher import hash_password, verify_password
from backend.src.models.controls import MetaxMixin

from sqlalchemy.exc import SQLAlchemyError, IntegrityError
from itsdangerous import BadSignature, SignatureExpired

from backend.src.models.tenant import Tenant

from sqlalchemy import text
from sqlalchemy.dialects.postgresql import JSONB

rate_limit_store: Dict[str, Tuple[int, int]] = {}  # client_id -> (count, first_ts)


# -------------------- ORGUNIT LEVEL (DHIS2-style) --------------------
class OrgUnitLevel(db.Model, MetaxMixin):
    """
    Représente un niveau hiérarchique dans l'arborescence des unités d'organisation,
    à la manière de DHIS2 (niveau 1 = National, 2 = Région, 3 = District, …).
    """
    __tablename__ = "user_orgunit_levels"

    id           = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    tenant_id    = db.Column(db.BigInteger, db.ForeignKey('tenants.id', ondelete="CASCADE"), nullable=False)
    name         = db.Column(db.String(100), nullable=False)
    code         = db.Column(db.String(100), nullable=False, default="")  # code DHIS2
    level        = db.Column(db.Integer, nullable=False)       # 1 = National, 2 = Régional, …
    display_name = db.Column(db.String(100), nullable=True)    # alias d'affichage optionnel

    tenant   = db.relationship("Tenant", lazy="noload", foreign_keys=[tenant_id])
    orgunits = db.relationship("UserOrgunit", back_populates="level_rel", lazy="noload")

    __table_args__ = (
        db.UniqueConstraint("tenant_id", "level", name="uq_orgunit_level_tenant"),
    )

    def to_dict(self):
        return {
            "id":           self.id,
            "tenant_id":    self.tenant_id,
            "name":         self.name,
            "code":         self.code or "",
            "level":        self.level,
            "display_name": self.display_name or self.name,
            "is_active":    self.is_active,
            "created_at":   self.created_at.isoformat() if self.created_at else None,
            "updated_at":   self.updated_at.isoformat() if self.updated_at else None,
        }

    def __repr__(self):
        return f"<OrgUnitLevel level={self.level} name={self.name}>"


# -------------------- USER ORGUNIT --------------------
class UserOrgunit(db.Model, MetaxMixin):
    __tablename__ = "user_orgunits"

    id          = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    tenant_id   = db.Column(db.BigInteger, db.ForeignKey('tenants.id', ondelete="CASCADE", onupdate="CASCADE"), nullable=False)
    level_id    = db.Column(db.BigInteger, db.ForeignKey('user_orgunit_levels.id', ondelete="SET NULL"), nullable=True)
    name        = db.Column(db.String(100), nullable=False)
    code        = db.Column(db.String(100), nullable=False)
    parent_id   = db.Column(db.BigInteger, db.ForeignKey('user_orgunits.id', ondelete="CASCADE", onupdate="CASCADE"), nullable=True)
    description = db.Column(db.String(255), nullable=True)

    # Relations
    parent     = db.relationship("UserOrgunit", remote_side=[id], backref=db.backref("children", lazy="noload"), uselist=False)
    tenant     = db.relationship("Tenant", back_populates="orgunits", lazy="noload", foreign_keys=[tenant_id])
    level_rel  = db.relationship("OrgUnitLevel", back_populates="orgunits", lazy="noload", foreign_keys=[level_id])
    users_link = db.relationship("UserOrgunitLink", back_populates="orgunit", lazy="noload", cascade="all, delete-orphan")

    __table_args__ = (
        db.CheckConstraint("tenant_id IS NOT NULL", name="ck_orgunit_tenant_not_null"),
    )

    def get_descendants(self):
        """Récupère tous les enfants récursivement."""
        result = set()
        for child in self.children:
            if not child.deleted:
                result.add(child)
                result.update(child.get_descendants())
        return result

    def to_dict(self, include_children=False, include_descendants=False):
        data = {
            "id":          self.id,
            "name":        self.name,
            "code":        self.code,
            "tenant_id":   self.tenant_id,
            "tenant":      self.tenant.to_dict() if self.tenant else None,
            "level_id":    self.level_id,
            "level":       self.level_rel.to_dict() if self.level_rel else None,
            "parent_id":   self.parent_id,
            "parent":      self.parent.to_dict() if self.parent else None,
            "description": self.description,
            "is_active":   self.is_active,
        }

        if include_children:
            data["children"] = [
                child.to_dict(include_children=True)
                for child in self.children
                if not child.deleted
            ]

        if include_descendants:
            data["descendants"] = [
                org.to_dict()
                for org in sorted([o for o in self.get_descendants() if not o.deleted], key=lambda x: x.id)
            ]

        return data

    def __repr__(self):
        return f"<Orgunit {self.name}>"

class UserPermission(db.Model, MetaxMixin):
    __tablename__ = "user_permissions"

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    name = db.Column(db.String(150), nullable=False)   # dashboard:read, report:create, chart:update
    description = db.Column(db.String(255), nullable=True)

    def to_dict(self):
        return { 
            "id": self.id, 
            "name": self.name, 
            "description": self.description 
        }

    def __repr__(self):
        return f"<Permission {self.name}>"
    
class UserRole(db.Model, MetaxMixin):
    __tablename__ = "user_roles"

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.String(255), nullable=True)
    tenant_id = db.Column(db.BigInteger, db.ForeignKey("tenants.id", ondelete="CASCADE", onupdate="CASCADE"), nullable=True)
    is_system = db.Column(db.Boolean, default=False)

    permissions = db.relationship("UserPermission", secondary="user_role_permission_links", lazy="noload")
    tenant = db.relationship("Tenant", back_populates="roles",lazy="noload",foreign_keys=[tenant_id])

    __table_args__ = (
        db.UniqueConstraint("tenant_id", "name", name="uq_role_tenant_name"),
    )

    def to_dict(self):
        permissions:List[UserPermission] = self.permissions
        tenant:Tenant = self.tenant
        return {
            "id": self.id, 
            "name": self.name, 
            "description": self.description, 
            "tenant_id": self.tenant_id,
            "tenant": tenant.to_dict() if tenant else None, 
            "permission_ids": [p.id for p in permissions if not p.deleted],
            "permissions": [p.to_dict() for p in permissions if not p.deleted],
            "is_system": self.is_system
        }

    def __repr__(self):
        return f"<Role {self.name}>"
    
class RolePermissionLink(db.Model):
    __tablename__ = "user_role_permission_links"

    role_id = db.Column(db.BigInteger, db.ForeignKey("user_roles.id", ondelete="CASCADE", onupdate="CASCADE"), primary_key=True)
    permission_id = db.Column(db.BigInteger, db.ForeignKey("user_permissions.id", ondelete="CASCADE", onupdate="CASCADE"), primary_key=True)

    role = db.relationship("UserRole", backref="role_permission_links", lazy="noload")
    permission = db.relationship("UserPermission", backref="role_permission_links", lazy="noload")

    def to_dict(self):
        role:UserRole = self.role
        permission:UserPermission = self.permission
        return {
            "role_id": self.role_id,
            "role": role.to_dict() if role else None,
            "permission_id": self.permission_id,
            "permission": permission.to_dict() if permission else None
        }

    def __repr__(self):
        return f"<RolePermissionLink role={self.role_id} permission={self.permission_id}>"
    
class User(db.Model, MetaxMixin):
    __tablename__ = "users"

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    tenant_id = db.Column(db.BigInteger, db.ForeignKey('tenants.id', ondelete="CASCADE", onupdate="CASCADE"), nullable=False)
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
    # orgunits = db.Column(JSONB, nullable=False, server_default=text("'{}'::jsonb"))  # e.g., [{"id1": [...]}, {"id2": [...]}]
    
    # Relationships
    tenant = db.relationship("Tenant", back_populates="users",lazy="noload",foreign_keys=[tenant_id])
    datasource_permissions = db.relationship("DataSourcePermission",back_populates="user",lazy="noload",cascade="all, delete-orphan",foreign_keys="DataSourcePermission.user_id")
    refresh_tokens = db.relationship("RefreshToken", back_populates="user", lazy="noload", cascade="all, delete-orphan")
    logs = db.relationship("UsersLog", back_populates="user", lazy="noload", cascade="all, delete-orphan")
    roles = db.relationship("UserRole",secondary="user_role_links",lazy="noload",backref=db.backref("users", lazy="noload"))
    orgunits = db.relationship("UserOrgunit",secondary="user_orgunit_links",lazy="noload",backref=db.backref("users", lazy="noload"))

    histories = db.relationship("DataSourceHistory",lazy="noload",cascade="all, delete-orphan",foreign_keys="DataSourceHistory.user_id")

    # roles_link = db.relationship("UserRole",secondary="user_role_links",lazy="noload",backref="users")
    # orgunits_link = db.relationship("UserOrgunitLink",back_populates="user",lazy="noload",cascade="all, delete-orphan")

    @property
    def fullname(self):
        return " ".join(filter(None, [self.lastname, self.firstname]))

    @property
    def all_orgunits(self):
        """Retourne la liste des orgunits assignées + tous leurs descendants."""
        result = set()
        orgunits:List[UserOrgunit] = self.orgunits or []
        for ou in orgunits:
            if not ou or ou.deleted:
                continue
            result.add(ou)
            result.update(o for o in ou.get_descendants() if not o.deleted)  # méthode à ajouter dans Orgunit
        return sorted(result, key=lambda x: x.id)
    
    @property
    def is_superadmin(self):
        roles:List[UserRole] = self.roles or []
        return any(role.is_system and role.name.lower() == "superadmin" for role in roles)

    def __repr__(self):
        return f"<User(username={self.username})>"
   
    def to_dict(self) -> dict:
        roles:List[UserRole] = [r for r in self.roles or [] if not r.deleted]
        permissions:List[UserPermission] = [p for r in roles for p in r.permissions or [] if not p.deleted]
        orgunits:List[UserOrgunit] = [o for o in self.orgunits or [] if not o.deleted]

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
            "orgunit_ids": [o.id for o in orgunits],
            "orgunits": [o.to_dict() for o in orgunits],
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
        roles_list:List[UserRole] = self.roles or []
        for r in roles_list:
            if not r or r.deleted:
                continue
            roles.add(r.name.lower())
            perms:List[UserPermission] = r.permissions or []
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
        department_code: str | None = None

        try:
            from backend.src.equipment_manager.models.employees import Employee as _Emp, Position as _Pos
            emp:_Emp = _Emp.query.filter_by(user_id=self.id).first()
            if emp:
                employee_id = str(emp.id)
                position_id = str(emp.position_id) if emp.position_id else None
                if emp.position_id:
                    pos:_Pos = _Pos.query.get(emp.position_id)
                    if pos:
                        position_code = pos.code
                        position_is_zone_assignable = bool(getattr(pos, 'is_zone_assignable', False))
                        if pos.department:
                            department_code = pos.department.code
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

        perm1 = UserPermission.query.filter_by(name=SUPERADMIN).first()
        if not perm1:
            perm1 = UserPermission(name=SUPERADMIN)
            db.session.add(perm1)
            db.session.flush()

        perm2 = UserPermission.query.filter_by(name=ADMIN).first()
        if not perm2:
            perm2 = UserPermission(name=ADMIN)
            db.session.add(perm2)
            db.session.flush()
        
        role_name="Administration"
        role:UserRole = UserRole.query.filter_by(name=role_name).first()
        if not role:
            role = UserRole(name=role_name,tenant_id=tenant.id,is_system=True)
            role.tenant = tenant
            permission1 = UserPermission.query.filter_by(name=SUPERADMIN).first()
            permission2 = UserPermission.query.filter_by(name=ADMIN).first()
            role.permissions = [permission1, permission2]
            db.session.add(role)
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
        admin_role = UserRole.query.filter_by(name=role_name).first()
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

class UsersLog(db.Model):
    __tablename__ = "user_logs"

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    user_id = db.Column(db.BigInteger, db.ForeignKey("users.id", ondelete="CASCADE", onupdate="CASCADE"), nullable=False, index=True)
    user = db.relationship("User", back_populates="logs",lazy="noload",foreign_keys=[user_id])

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
    timestamp = db.Column(db.DateTime(timezone=True), server_default=db.func.now(), nullable=False)

    __table_args__ = (
        db.Index("idx_user_logs_timestamp", "timestamp"),
    )

    def to_dict(self):
        return { 
            "user_id": self.user_id, 
            "user_agent": self.user_agent 
        }

class UserRoleLink(db.Model):
    __tablename__ = "user_role_links"

    user_id = db.Column(db.BigInteger, db.ForeignKey("users.id", ondelete="CASCADE", onupdate="CASCADE"), primary_key=True)
    role_id = db.Column(db.BigInteger, db.ForeignKey("user_roles.id", ondelete="CASCADE", onupdate="CASCADE"), primary_key=True)

    user = db.relationship("User", lazy="noload")
    role = db.relationship("UserRole", lazy="noload")

    def to_dict(self):
        return { 
            "role_id": self.role_id,
            "role": self.role.to_dict() if self.role else None,
            "user_id": self.user_id,
            "user": self.user.to_dict() if self.user else None,
        }

class RefreshToken(db.Model):
    __tablename__ = "user_refresh_tokens"

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    token = db.Column(db.String(255), unique=True, nullable=False)  # hashed
    issued_at = db.Column(db.DateTime(timezone=True), server_default=db.func.now(), nullable=False)
    expires_at = db.Column(db.DateTime(timezone=True), nullable=False)
    revoked = db.Column(db.Boolean, default=False, nullable=False)
    revoked_at = db.Column(db.DateTime(timezone=True), nullable=True)

    # Foreign key to user
    user_id = db.Column(db.BigInteger, db.ForeignKey("users.id", ondelete="CASCADE", onupdate="CASCADE"), nullable=False, index=True)
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
        
class UserOrgunitLink(db.Model):
    __tablename__ = "user_orgunit_links"

    user_id = db.Column(db.BigInteger, db.ForeignKey("users.id", ondelete="CASCADE", onupdate="CASCADE"), primary_key=True)
    orgunit_id = db.Column(db.BigInteger, db.ForeignKey("user_orgunits.id", ondelete="CASCADE", onupdate="CASCADE"), primary_key=True)

    user = db.relationship("User", lazy="noload")
    orgunit = db.relationship("UserOrgunit", lazy="noload")

    def to_dict(self):
        return { 
            "user_id": self.user_id,
            "user": self.user.to_dict() if self.user else None,
            "orgunit_id": self.orgunit_id,
            "orgunit": self.orgunit.to_dict() if self.orgunit else None,
        }
