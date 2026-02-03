from dataclasses import dataclass
from typing import Optional


@dataclass
class SSHParams:
    host: str
    port: int
    username: str
    password: Optional[str] = None
    key: Optional[str] = None
    key_pass: Optional[str] = None


@dataclass
class DbConnectionForm:
    id: Optional[str]
    type: str
    name: str
    dbname: str
    username: str
    password: Optional[str]
    host: str
    port: int
    ssh_enabled: bool
    ssh_host: Optional[str] = None
    ssh_port: Optional[int] = None
    ssh_user: Optional[str] = None
    ssh_password: Optional[str] = None
    ssh_key: Optional[str] = None
    ssh_key_pass: Optional[str] = None


@dataclass
class DbConnectionParams:
    id: Optional[str]
    type: str
    name: str
    dbname: str
    username: str
    password: Optional[str]
    host: str
    port: int
    ssh: Optional[SSHParams] = None


def convert_to_conn_params(form: DbConnectionForm) -> dict:
    return {
        "id": form.get("id"),
        "type": form.get("type"),
        "name": form.get("name"),
        "dbname": form.get("dbname"),
        "username": form.get("username"),
        "password": form.get("password"),
        "host": form.get("host"),
        "port": form.get("port"),
        "ssh": (
            {
                "host": form.get("ssh_host"),
                "port": form.get("ssh_port"),
                "username": form.get("ssh_user"),
                "password": form.get("ssh_password"),
                "key": form.get("ssh_key"),
            }
            if form.get("ssh_enabled")
            else None
        ),
    }

def convert_to_conn_form(param: DbConnectionParams) -> dict:
    ssh = param.get("ssh")

    return {
        "id": param.get("id"),
        "type": param.get("type"),
        "name": param.get("name"),
        "dbname": param.get("dbname"),
        "username": param.get("username"),
        "password": param.get("password"),
        "host": param.get("host"),
        "port": param.get("port"),
        "ssh_enabled": ssh is not None,
        "ssh_host": ssh.get("host") if ssh else None,
        "ssh_port": ssh.get("port") if ssh else None,
        "ssh_user": ssh.get("username") if ssh else None,
        "ssh_password": ssh.get("password") if ssh else None,
        "ssh_key": ssh.get("key") if ssh else None,
        "ssh_key_pass": ssh.get("key_pass") if ssh else None,
    }

# def convert_to_conn_params(form: DbConnectionForm) -> DbConnectionParams:
#     return DbConnectionParams(
#         id=form.id,
#         type=form.type,
#         name=form.name,
#         dbname=form.dbname,
#         username=form.username,
#         password=form.password,
#         host=form.host,
#         port=form.port,
#         ssh=(
#             SSHParams(
#                 host=form.ssh_host,
#                 port=form.ssh_port,
#                 username=form.ssh_user,
#                 password=form.ssh_password,
#                 key=form.ssh_key,
#             )
#             if form.ssh_enabled
#             else None
#         ),
#     )

# def convert_to_conn_form(param: DbConnectionParams) -> DbConnectionForm:
#     return DbConnectionForm(
#         id=param.id,
#         type=param.type,
#         name=param.name,
#         dbname=param.dbname,
#         username=param.username,
#         password=param.password,
#         host=param.host,
#         port=param.port,
#         ssh_enabled=param.ssh is not None,
#         ssh_host=param.ssh.host if param.ssh else None,
#         ssh_port=param.ssh.port if param.ssh else None,
#         ssh_user=param.ssh.username if param.ssh else None,
#         ssh_password=param.ssh.password if param.ssh else None,
#         ssh_key=param.ssh.key if param.ssh else None,
#         ssh_key_pass=param.ssh.key_pass if param.ssh else None,
#     )
