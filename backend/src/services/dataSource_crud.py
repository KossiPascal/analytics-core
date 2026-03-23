# =====================================================
# CRUD UTILITIES
# =====================================================
from typing import List

from sqlalchemy.exc import SQLAlchemyError
from backend.src.databases.extensions import db
from backend.src.models.datasource import ConnectionStatus, DataSource, DataSourceHistory, DataSourceConnection, DataSourceCredential, DataSourcePermission, DataSourceSSHConfig
from shared_libs.helpers.utils import encrypt

from backend.src.logger import get_backend_logger
logger = get_backend_logger(__name__)

def safe_commit():
    try:
        db.session.commit()
    except SQLAlchemyError as e:
        db.session.rollback()
        logger.error(f"DB commit failed: {str(e)}")
        raise

# DATASOURCE CRUD
class DataSourceCRUD:
    @staticmethod
    def create(tenant_id: int, type: int, name: str, description: str = "", is_main=False) -> DataSource:
        obj = DataSource(
            tenant_id=tenant_id,
            type=type,
            name=name,
            description=description,
            is_main=is_main,
        )
        db.session.add(obj)
        safe_commit()
        return obj

    @staticmethod
    def get(ds_id: int) -> DataSource:
        return DataSource.query.get(ds_id)

    @staticmethod
    def list(tenant_id: int = None, active_only: bool = True) -> list[DataSource]:
        query = DataSource.query
        if tenant_id:
            query = query.filter_by(tenant_id=tenant_id)
        if active_only:
            query = query.filter_by(is_active=True)
        return query.all()

    @staticmethod
    def update(ds_id: int, **kwargs) -> DataSource:
        obj = DataSource.query.get(ds_id)
        if not obj:
            raise ValueError("DataSource not found")
        for k, v in kwargs.items():
            setattr(obj, k, v)
        safe_commit()
        return obj

    @staticmethod
    def delete(ds_id: int):
        obj = DataSource.query.get(ds_id)
        if not obj:
            raise ValueError("DataSource not found")
        db.session.delete(obj)
        safe_commit()

# CONNECTION CRUD
class DataSourceConnectionCRUD:
    @staticmethod
    def create(datasource_id: int, type: int, tenant_id: int, host: str, port: int,
               dbname: str, status: ConnectionStatus = ConnectionStatus.PROD,
               ssh_enabled: bool = False) -> "DataSourceConnection":
        obj = DataSourceConnection(
            datasource_id=datasource_id,
            type=type,
            tenant_id=tenant_id,
            host=host,
            port=port,
            dbname=dbname,
            status=status,
            ssh_enabled=ssh_enabled,
        )
        db.session.add(obj)
        safe_commit()
        return obj

    @staticmethod
    def get(conn_id: int) -> "DataSourceConnection":
        return DataSourceConnection.query.get(conn_id)

    @staticmethod
    def list(datasource_id: int = None) -> list["DataSourceConnection"]:
        query = DataSourceConnection.query
        if datasource_id:
            query = query.filter_by(datasource_id=datasource_id)
        return query.all()

    @staticmethod
    def update(conn_id: int, **kwargs) -> "DataSourceConnection":
        obj = DataSourceConnection.query.get(conn_id)
        if not obj:
            raise ValueError("Connection not found")
        for k, v in kwargs.items():
            setattr(obj, k, v)
        safe_commit()
        return obj

    @staticmethod
    def delete(conn_id: int):
        obj = DataSourceConnection.query.get(conn_id)
        if not obj:
            raise ValueError("Connection not found")
        db.session.delete(obj)
        safe_commit()

# SSH CONFIG CRUD
class DataSourceSSHConfigCRUD:
    @staticmethod
    def create(connection_id: int, datasource_id: int, type: int, tenant_id: int,
               ssh_host: str, ssh_port: int = 22, use_ssh_key: bool = True) -> "DataSourceSSHConfig":
        obj = DataSourceSSHConfig(
            connection_id=connection_id,
            datasource_id=datasource_id,
            type=type,
            tenant_id=tenant_id,
            ssh_host=ssh_host,
            ssh_port=ssh_port,
            use_ssh_key=use_ssh_key,
        )
        db.session.add(obj)
        safe_commit()
        return obj

    @staticmethod
    def get(ssh_id: int) -> "DataSourceSSHConfig":
        return DataSourceSSHConfig.query.get(ssh_id)

    @staticmethod
    def update(ssh_id: int, **kwargs) -> "DataSourceSSHConfig":
        obj = DataSourceSSHConfig.query.get(ssh_id)
        if not obj:
            raise ValueError("SSH Config not found")
        for k, v in kwargs.items():
            setattr(obj, k, v)
        safe_commit()
        return obj

    @staticmethod
    def delete(ssh_id: int):
        obj = DataSourceSSHConfig.query.get(ssh_id)
        if not obj:
            raise ValueError("SSH Config not found")
        db.session.delete(obj)
        safe_commit()

# CREDENTIAL CRUD
class DataSourceCredentialCRUD:
    @staticmethod
    def create(connection_id: int, datasource_id: int, type: int, tenant_id: int,
               username: str, password: str = None, ssh_username: str = None, ssh_password: str = None,
               ssh_key: str = None, ssh_key_pass: str = None) -> "DataSourceCredential":
        obj = DataSourceCredential(
            connection_id=connection_id,
            datasource_id=datasource_id,
            type=type,
            tenant_id=tenant_id,
            username_enc=encrypt(username),
            password_enc=encrypt(password) if password else None,
            ssh_username_enc=encrypt(ssh_username) if ssh_username else None,
            ssh_password_enc=encrypt(ssh_password) if ssh_password else None,
            ssh_key_enc=encrypt(ssh_key) if ssh_key else None,
            ssh_key_pass_enc=encrypt(ssh_key_pass) if ssh_key_pass else None,
        )
        db.session.add(obj)
        safe_commit()
        return obj

    @staticmethod
    def get(cred_id: int) -> "DataSourceCredential":
        return DataSourceCredential.query.get(cred_id)

    @staticmethod
    def update(cred_id: int, **kwargs) -> "DataSourceCredential":
        obj = DataSourceCredential.query.get(cred_id)
        if not obj:
            raise ValueError("Credential not found")
        for k, v in kwargs.items():
            if k.endswith("_enc") and v is not None:
                v = encrypt(v)
            setattr(obj, k, v)
        safe_commit()
        return obj

    @staticmethod
    def delete(cred_id: int):
        obj = DataSourceCredential.query.get(cred_id)
        if not obj:
            raise ValueError("Credential not found")
        db.session.delete(obj)
        safe_commit()

# PERMISSION CRUD
class DataSourcePermissionCRUD:
    @staticmethod
    def create(connection_id: int, datasource_id: int, type: int, tenant_id: int,user_id: int, role=str) -> "DataSourcePermission":
        obj = DataSourcePermission(
            connection_id=connection_id,
            datasource_id=datasource_id,
            type=type,
            tenant_id=tenant_id,
            user_id=user_id,
            role=role
        )
        db.session.add(obj)
        safe_commit()
        return obj

    @staticmethod
    def get(perm_id: int) -> "DataSourcePermission":
        return DataSourcePermission.query.get(perm_id)

    @staticmethod
    def update(perm_id: int, **kwargs) -> "DataSourcePermission":
        obj = DataSourcePermission.query.get(perm_id)
        if not obj:
            raise ValueError("Permission not found")
        for k, v in kwargs.items():
            setattr(obj, k, v)
        safe_commit()
        return obj

    @staticmethod
    def delete(perm_id: int):
        obj = DataSourcePermission.query.get(perm_id)
        if not obj:
            raise ValueError("Permission not found")
        db.session.delete(obj)
        safe_commit()

# AUDIT HISTORY CRUD
class DataSourceHistoryCRUD:
    @staticmethod
    def create(connection_id: int, datasource_id: int, type: int, tenant_id: int,
               action: str, table_name: str = None, record_id: str = None, user: str = None) -> "DataSourceHistory":
        obj = DataSourceHistory(
            connection_id=connection_id,
            datasource_id=datasource_id,
            type=type,
            tenant_id=tenant_id,
            action=action,
            table_name=table_name,
            record_id=record_id,
            user=user,
        )
        db.session.add(obj)
        safe_commit()
        return obj

    @staticmethod
    def list_for_datasource(datasource_id: int) -> list["DataSourceHistory"]:
        return DataSourceHistory.query.filter(
            DataSourceHistory.datasource_id==datasource_id
        ).all()
    

