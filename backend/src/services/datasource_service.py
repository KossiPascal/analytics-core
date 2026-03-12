from typing import Optional
from sqlalchemy.exc import SQLAlchemyError
from backend.src.models.datasource import ConnectionStatus, DataSource, DataSourceHistory, DataSourceConnection, DataSourceCredential, DataSourcePermission, DataSourceRole, DataSourceSSHConfig
from shared_libs.helpers.utils import decrypt, encrypt, normalize_base_url
from backend.src.databases.extensions import db
from sqlalchemy.orm import selectinload

from backend.src.logger import get_backend_logger
logger = get_backend_logger(__name__)

class DataSourceProvisioningService:

    @staticmethod
    def create_full_datasource(
        *,
        id: Optional[int] = None,
        tenant_id: int,
        type_id: int,
        name: str,
        technical_name: str,
        description: str = "",

        is_main: bool = None,

        auto_sync: bool = False,
        is_active: bool = True,
        # last_sync: Optional[str] = None,
        # last_used_at: Optional[str] = None,

        # Connection
        host: str,
        port: int,
        dbname: str,
        status: ConnectionStatus = ConnectionStatus.PROD,

        # Credentials
        username: str,
        password: str = None,

        # SSH (optional)
        ssh_enabled: bool = False,
        ssh_host: str = None,
        ssh_port: int = 22,
        ssh_username: str = None,
        ssh_password: str = None,
        ssh_key: str = None,
        ssh_key_pass: str = None,

        # Permissions (list of dict)
        permissions: list[dict] = None,

        # Audit
        created_by: str = None,
    ) -> DataSource:

        try:
            technical_name = DataSource.validate_technical_name(technical_name)

            DataSourceProvisioningService.ensure_technical_name_available(tenant_id,technical_name)

            # 1️⃣ Create DataSource
            datasource = DataSource(
                tenant_id=tenant_id,
                type_id=type_id,
                name=name,
                technical_name=technical_name,
                description=description,
                is_main=bool(is_main),
                auto_sync=bool(auto_sync),
                is_active=bool(is_active),
                created_by_id=created_by
            )
            db.session.add(datasource)
            db.session.flush()  # get datasource.id

            # 2️⃣ Create Connection
            connection = DataSourceConnection(
                datasource_id=datasource.id,
                tenant_id=tenant_id,
                type_id=type_id,
                host=host,
                port=port,
                dbname=dbname,
                status=status,
                ssh_enabled=ssh_enabled,
                created_by_id=created_by
            )
            db.session.add(connection)
            db.session.flush()

            # 3️⃣ Create SSH Config (if enabled)
            if ssh_enabled and ssh_host:
                ssh_config = DataSourceSSHConfig(
                    connection_id=connection.id,
                    datasource_id=datasource.id,
                    tenant_id=tenant_id,
                    type_id=type_id,
                    host=ssh_host,
                    port=ssh_port,
                    use_ssh_key=bool(ssh_key),
                    created_by_id=created_by
                )
                db.session.add(ssh_config)

            # 4️⃣ Create Credential
            credential = DataSourceCredential(
                connection_id=connection.id,
                datasource_id=datasource.id,
                tenant_id=tenant_id,
                type_id=type_id,
                username_enc=encrypt(username),
                password_enc=encrypt(password) if password else None,
                ssh_username_enc=encrypt(ssh_username) if ssh_username else None,
                ssh_password_enc=encrypt(ssh_password) if ssh_password else None,
                ssh_key_enc=encrypt(ssh_key) if ssh_key else None,
                ssh_key_pass_enc=encrypt(ssh_key_pass) if ssh_key_pass else None,
                created_by_id=created_by
            )
            db.session.add(credential)

            # 5️⃣ Create Permissions
            if permissions:
                for perm in permissions:
                    role = perm.get("role")
                    permission = DataSourcePermission(
                        connection_id=connection.id,
                        datasource_id=datasource.id,
                        tenant_id=tenant_id,
                        type_id=type_id,
                        user_id=perm["user_id"],
                        role=DataSourceRole(role),
                        created_by_id=created_by
                    )
                    db.session.add(permission)

            # 6️⃣ Create Audit History
            audit = DataSourceHistory(
                connection_id=connection.id,
                datasource_id=datasource.id,
                tenant_id=tenant_id,
                type_id=type_id,
                action="CREATE",
                table_name="datasources",
                record_id=str(datasource.id),
                user_id=created_by
            )
            db.session.add(audit)

            # Commit transaction
            db.session.commit()

            return datasource

        except SQLAlchemyError as e:
            db.session.rollback()
            logger.error(f"Datasource provisioning failed: {str(e)}")
            raise

    @staticmethod
    def ensure_technical_name_available(tenant_id: int, technical_name: str):
        exists = db.session.query(DataSource.id).filter_by(
            tenant_id=tenant_id,
            technical_name=technical_name
        ).first()

        if exists:
            raise ValueError("technical_name already exists for this tenant")
        
    @staticmethod
    def get_full_datasource(datasource_id: int) -> DataSource:
        ds = (
            DataSource.query
            .options(
                selectinload(DataSource.connection).selectinload(DataSourceConnection.ssh_config),
                selectinload(DataSource.credential),
                selectinload(DataSource.permissions),
            )
            .filter(DataSource.id == datasource_id)
            .first()
        )

        if not ds:
            raise ValueError("DataSource not found")

        return ds

    @staticmethod
    def list_full_datasources(tenant_id: int = None) -> list[DataSource]:
        query = DataSource.query.options(
            selectinload(DataSource.connection)
                .selectinload(DataSourceConnection.ssh_config),
            selectinload(DataSource.credential),
            selectinload(DataSource.permissions),
        )

        if tenant_id:
            query = query.filter(DataSource.tenant_id == tenant_id)

        return query.order_by(DataSource.id).all()

    @staticmethod
    def update_full_datasource(
        datasource_id: int,
        *,
        tenant_id: int = None,
        type_id: int = None,
        name: str = None,
        technical_name: str = None,
        description: str = None,
        host: str = None,
        port: int = None,
        dbname: str = None,

        status: ConnectionStatus = ConnectionStatus.PROD,

        username: str = None,
        password: str = None,

        is_active: bool = None,
        auto_sync: bool = None,
        is_main: bool = None,
        # last_sync: Optional[str] = None,
        # last_used_at: Optional[str] = None,

        # SSH (optional)
        ssh_enabled: bool = None,
        ssh_host: str = None,
        ssh_port: int = None,
        ssh_username: str = None,
        ssh_password: str = None,
        ssh_key: str = None,
        ssh_key_pass: str = None,

        # Permissions (list of dict)
        permissions: list[dict] = None,
        updated_by: str = None,
    ) -> DataSource:

        try:
            ds:DataSource = DataSourceProvisioningService.get_full_datasource(datasource_id)

            tenant_id_v = tenant_id if tenant_id is not None else ds.tenant_id
            type_id_v = type_id if type_id is not None else ds.type_id

            ds.tenant_id = tenant_id_v
            ds.type_id = type_id_v

            # Update datasource
            if name is not None:
                ds.name = name
            if technical_name is not None:
                ds.technical_name = technical_name
            if description is not None:
                ds.description = description
            if is_main is not None:
                ds.is_main=bool(is_main)
            if auto_sync is not None:
                ds.auto_sync=bool(auto_sync)
            if is_active is not None:
                ds.is_active=bool(is_active)

            ds.updated_by_id = updated_by

            # Update connection
            conn:DataSourceConnection = ds.connection
            if host is not None:
                conn.host = host
            if port is not None:
                conn.port = port
            if dbname is not None:
                conn.dbname = dbname
            if status is not None:
                conn.status = status
            if ssh_enabled is not None:
                conn.ssh_enabled = ssh_enabled

            conn.tenant_id = tenant_id_v
            conn.type_id = type_id_v
            conn.updated_by_id = updated_by

            # SSH handling
            

            if ssh_enabled is not None:
                ssh:DataSourceSSHConfig = ds.ssh_config
                # If SSH disabled → delete config
                if ssh_enabled is False and ssh is not None:
                    db.session.delete(ssh)
                # If SSH enabled
                if ssh_enabled is True:
                    # Create if not exists
                    if not ssh:
                        ssh = DataSourceSSHConfig(datasource_id=ds.id,connection_id=conn.id)
                        ssh.created_by_id = updated_by
                        db.session.add(ssh)
                    
                    ssh.updated_by_id = updated_by
                    ssh.tenant_id=tenant_id_v
                    ssh.type_id=type_id_v

                    # Update fields
                    if ssh_host is not None:
                        ssh.host = ssh_host
                    if ssh_port is not None:
                        ssh.port = ssh_port
                    if ssh_key is not None:
                        ssh.use_ssh_key = bool(ssh_key)

            # Update credential
            cred:DataSourceCredential = ds.credential
            if username is not None:
                cred.username_enc = encrypt(username)
            if password is not None:
                cred.password_enc = encrypt(password)
            if ssh_username is not None:
                cred.ssh_username_enc = encrypt(ssh_username)
            if ssh_password is not None:
                cred.ssh_password_enc = encrypt(ssh_password)
            if ssh_key is not None:
                cred.ssh_key_enc = encrypt(ssh_key)
            if ssh_key_pass is not None:
                cred.ssh_key_pass_enc = encrypt(ssh_key_pass)

            cred.connection_id=conn.id,
            cred.datasource_id=ds.id
            cred.tenant_id=tenant_id_v
            cred.type_id=type_id_v
            cred.updated_by_id = updated_by


            # Replace permissions (simple strategy: delete + recreate)
            if permissions is not None:

                existing_perms = {p.user_id: p for p in ds.permissions}
                new_user_ids = {p["user_id"] for p in permissions}

                # Delete removed users
                for user_id, perm in existing_perms.items():
                    if user_id not in new_user_ids:
                        db.session.delete(perm)

                # Create or update
                for perm_data in permissions:
                    user_id = perm_data["user_id"]
                    role = perm_data.get("role")
                    if user_id in existing_perms:
                        perm:DataSourcePermission = existing_perms[user_id]
                        if role is not None:
                            perm.role = DataSourceRole(role)
                        if role is not None:
                            perm.connection_id=conn.id
                        if role is not None:
                            perm.datasource_id=ds.id

                        perm.updated_by_id = updated_by
                    else:
                        db.session.add(
                            DataSourcePermission(
                                connection_id=conn.id,
                                datasource_id=ds.id,
                                tenant_id=tenant_id_v,
                                type_id=type_id_v,
                                user_id=user_id,
                                role=DataSourceRole(role),
                                created_by_id = updated_by
                            )
                        )

            # Audit
            audit = DataSourceHistory(
                connection_id=conn.id,
                datasource_id=ds.id,
                tenant_id=tenant_id,
                type_id=type_id,
                action="UPDATE",
                table_name="datasources",
                record_id=str(ds.id),
                user_id=updated_by
            )
            db.session.add(audit)

            db.session.commit()
            return ds

        except SQLAlchemyError as e:
            db.session.rollback()
            logger.error(f"Datasource provisioning failed: {str(e)}")
            raise

    @staticmethod
    def delete_full_datasource(datasource_id: int, deleted_by: str = None):
        try:
            ds:DataSource = DataSourceProvisioningService.get_full_datasource(datasource_id)
            conn:DataSourceConnection = ds.connection
            # Audit before delete
            audit = DataSourceHistory(
                connection_id=conn.id if conn else None,
                datasource_id=ds.id,
                tenant_id=ds.tenant_id,
                type_id=ds.type_id,
                action="DELETE",
                table_name="datasources",
                record_id=str(ds.id),
                user_id=deleted_by
            )
            db.session.add(audit)
            db.session.delete(ds)  # cascade delete handles children
            db.session.commit()

        except SQLAlchemyError:
            db.session.rollback()
            raise

    @staticmethod
    def to_params_conf(form: dict) -> dict:
        ssh_enabled = bool(form.get("ssh_enabled", False))
        ssh = form.get("ssh", {}) if ssh_enabled else {}
        return {
            "id": form.get("id"),
            "tenant_id": form.get("tenant_id"),
            "type": form.get("type"),
            "name": form.get("name"),
            "description": form.get("description"),
            "dbname": form.get("dbname"),
            "username": decrypt(form.get("username_enc")) if form.get("username_enc") else form.get("username"),
            "password": decrypt(form.get("password_enc")) if form.get("password_enc") else form.get("password"),
            "host": form.get("host"),
            "port": form.get("port"),
            "ssh": {
                "use_ssh_key": bool(ssh.get("use_ssh_key", False)),
                "host": ssh.get("host"),
                "port": ssh.get("port"),
                "username": decrypt(ssh.get("username_enc")) if ssh.get("username_enc") else ssh.get("username"),
                "password": decrypt(ssh.get("password_enc")) if ssh.get("password_enc") else ssh.get("password"),
                "key": decrypt(ssh.get("key_enc")) if ssh.get("key_enc") else ssh.get("key"),
                "key_pass": decrypt(ssh.get("key_pass_enc")) if ssh.get("key_pass_enc") else ssh.get("key_pass"),
            } if ssh_enabled else None
        }

    @property
    def base_host(conn:DataSourceConnection, status:ConnectionStatus = ConnectionStatus.PROD) -> Optional[str]:
        conn = conn if conn.status == status and conn.is_active else None
        if conn and conn.host and conn.port:
            return f"{normalize_base_url(conn.host)}:{conn.port}"
        return None

    @property
    def base_url(base_host:str) -> Optional[str]:
        base = base_host
        if base:
            return f"https://{base.replace('https://','').replace('http://','')}"
        return None


    def _upsert_model(model, filters: dict, values: dict):
        instance = model.query.filter(**filters).first() if filters else None
        if not instance:
            instance = model(**filters)
        for k, v in values.items():
            if v is not None:
                setattr(instance, k, v)
        db.session.add(instance)
        db.session.flush()
        return instance
    
    def upsert_data_version2(
        *,
        id: Optional[int] = None,
        tenant_id: int,
        type_id: int,
        name: str,
        description: str = "",

        is_main: bool = False,
        auto_sync: bool = False,
        is_active: bool = False,
        last_sync: Optional[str] = None,
        last_used_at: Optional[str] = None,

        # Connection
        host: str,
        port: int,
        dbname: str,
        status: ConnectionStatus = ConnectionStatus.PROD,

        # Credentials
        username: str,
        password: str = None,

        # SSH (optional)
        ssh_enabled: bool = False,
        ssh_host: str = None,
        ssh_port: int = 22,
        ssh_username: str = None,
        ssh_password: str = None,
        ssh_key: str = None,
        ssh_key_pass: str = None,

        # Permissions (list of dict)
        permissions: list[dict] = None,

        # Audit
        created_by: str = None,):
        try:
            # source = None
            # connection = None
            # ssh_config = None
            # credential = None

            # Upsert DataSource
            if name:
                source = DataSourceProvisioningService._upsert_model(
                    DataSource,
                    {"id": id} if id else {},
                    {
                        "tenant_id": tenant_id,
                        "type_id": type_id,
                        "name": name,
                        "description": description,
                        "is_active": is_active,
                        "auto_sync": auto_sync,
                        "is_main": is_main,
                        "last_sync": last_sync,
                        "last_used_at": last_used_at,
                    }
                )

            # Upsert Connection
            if source and host:
                conn:DataSourceConnection = DataSourceProvisioningService._upsert_model(
                    DataSourceConnection,
                    {"datasource_id": source.id, "status": status},
                    {
                        "tenant_id": tenant_id,
                        "host": host,
                        "port": int(port) if port else None,
                        "dbname": dbname,
                        "is_active": is_active
                    }
                )

            # Upsert SSH
            if conn and ssh_host:
                ssh_config = DataSourceProvisioningService._upsert_model(
                    DataSourceSSHConfig,
                    {"connection_id": conn.id},
                    {
                        "tenant_id": tenant_id,
                        "ssh_enabled": ssh_enabled,
                        "use_ssh_key": bool(ssh_key),
                        "host": ssh_host,
                        "port": int(ssh_port) if ssh_port else None,
                        "is_active": is_active
                    }
                )

            # Upsert Credential
            if source and conn and ssh_username:
                credential = DataSourceProvisioningService._upsert_model(
                    DataSourceCredential,
                    {"datasource_id": source.id, "connection_id": conn.id},
                    {
                        "tenant_id": tenant_id,
                        "datasource_ssh_config_id": ssh_config.id if ssh_config else None,
                        "username_enc": encrypt(username) if username else None,
                        "password_enc": encrypt(username) if username else None,
                        "ssh_username_enc": encrypt(ssh_username) if ssh_username else None,
                        "ssh_password_enc": encrypt(ssh_password) if ssh_password else None,
                        "ssh_key_enc": encrypt(ssh_key) if ssh_key else None,
                        "ssh_key_pass_enc": encrypt(ssh_key_pass) if ssh_key_pass else None,
                        "is_active": is_active
                    }
                )

            db.session.commit()
            return source, conn, ssh_config, credential
        except Exception as e:
            db.session.rollback()
            logger.error(f"Failed to upsert DataSourceConnection: {str(e)}")
            raise

    def upsert_data(
        *,
        id: Optional[int] = None,
        tenant_id: int,
        type_id: int,
        name: str,
        description: str = "",

        is_main: bool = False,
        auto_sync: bool = False,
        is_active: bool = False,
        last_sync: Optional[str] = None,
        last_used_at: Optional[str] = None,

        # Connection
        host: str,
        port: int,
        dbname: str,
        status: ConnectionStatus = ConnectionStatus.PROD,

        # Credentials
        username: str,
        password: str = None,

        # SSH (optional)
        ssh_enabled: bool = False,
        ssh_host: str = None,
        ssh_port: int = 22,
        ssh_username: str = None,
        ssh_password: str = None,
        ssh_key: str = None,
        ssh_key_pass: str = None,

        # Permissions (list of dict)
        permissions: list[dict] = None,

        # Audit
        created_by: str = None,):
        try:
            # DataSource | Champs principaux DataSource
            source = DataSource.query.filter_by(id=id).first() if id else None
            if not source:
                source = DataSource()
            source_attrs = ["tenant_id", "type_id", "name", "description", "is_active", "auto_sync", "is_main", "last_sync", "last_used_at"]
            for attr in source_attrs:
                val = getattr(attr, None)
                if val is not None:
                    setattr(source, attr, val)

            db.session.add(source)
            db.session.flush()

            # DataSourceConnection
            connection = None
            if host or port or dbname:
                connection = DataSourceConnection.query.filter(
                    DataSourceConnection.datasource_id==source.id, 
                    DataSourceConnection.status==status
                ).first()
                if not connection:
                    connection = DataSourceConnection(datasource_id=source.id)

                conn_attrs = ["tenant_id", "status", "host", "port", "dbname", "is_active"]
                for attr in conn_attrs:
                    val = getattr(attr, None)
                    if val is not None:
                        if attr in ["port"] and val is not None:
                            val = int(val)
                        setattr(connection, attr, val)
                db.session.add(connection)
                db.session.flush()

            # DataSourceSSHConfig
            ssh_config = None
            use_ssh_key = bool(ssh_key)

            if ssh_host or use_ssh_key or ssh_enabled:
                ssh_config = DataSourceSSHConfig.query.filter(
                    DataSourceSSHConfig.connection_id==connection.id
                ).first() if connection else None

                if not ssh_config and connection:
                    ssh_config = DataSourceSSHConfig(connection_id=connection.id)

                ssh_attrs = ["tenant_id", "ssh_enabled", "use_ssh_key", "ssh_host", "ssh_port", "is_active"]
                for attr in ssh_attrs:
                    val = getattr(attr, None)
                    if val is not None:
                        if attr in ["ssh_port"] and val is not None:
                            val = int(val)
                        setattr(ssh_config, attr, val)
                if ssh_config:
                    db.session.add(ssh_config)
                    db.session.flush()

            # DataSourceCredential
            credential = None
            if connection and (username or password or ssh_username):
                credential = DataSourceCredential.query.filter(
                    DataSourceCredential.datasource_id==source.id, 
                    DataSourceCredential.connection_id==connection.id
                ).first()

                if not credential:
                    credential = DataSourceCredential(
                        datasource_id=source.id, connection_id=connection.id
                    )

                if ssh_config and ssh_config.id:
                    credential.ssh_config_id = ssh_config.id

                for attr in ["tenant_id", "is_active"]:
                    val = getattr(attr, None)
                    if val is not None:
                        setattr(credential, attr, val)

                cred_attrs = [
                    "username", "password", "ssh_username", "ssh_password",
                    "ssh_key", "ssh_key_pass"
                ]

                for attr in cred_attrs:
                    val = getattr(attr, None)
                    if val is not None:
                        setattr(credential, f"{attr}_enc", encrypt(val))

                db.session.add(credential)
                db.session.flush()

            db.session.commit()
        except Exception as e:
            db.session.rollback()
            logger.error(f"Failed to upsert DB connection: {str(e)}")
            raise

    def get_connection(conn:DataSourceConnection, status: ConnectionStatus = ConnectionStatus.PROD)->"DataSourceConnection":
        return conn if conn.status == status and conn.is_active else None

    def get_ssh_config(conn:DataSourceConnection, status: ConnectionStatus = ConnectionStatus.PROD):
        conn = conn if conn.status == status and conn.is_active else None
        if not conn:
            return None
        return conn.ssh_config if conn.ssh_config and conn.ssh_config.is_active else None

    def get_credential(conn:DataSourceConnection, status: ConnectionStatus = ConnectionStatus.PROD):
        conn = conn if conn.status == status and conn.is_active else None
        if not conn:
            return None
        source: DataSource = DataSource.query.filter_by(id=id).first() if id else None
        if not source:
            return None
        credential: DataSourceCredential = source.credential
        return credential if credential.connection_id == conn.id and credential.is_active else None

