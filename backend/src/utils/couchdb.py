import base64
import requests
from typing import Optional
from backend.src.config import Config

def fetch_couchdb_view(
    view_name: str,
    *,
    username: Optional[str] = None,
    password: Optional[str] = None,
    start_key: Optional[str] = None,
    end_key: Optional[str] = None,
):
    db_name = "medic"

    username = username or Config.CHT_USER or ""
    password = password or Config.CHT_PASS or ""

    params = {
        "include_docs": "true",
        "returnDocs": "true",
        "attachments": "false",
        "binary": "false",
        "reduce": "false",
        "descending": "false",
    }

    if start_key:
        params["key"] = f"[{start_key}]"
    if end_key:
        params["endkey"] = f"[{end_key}]"

    url = (
        f"{Config.CHT_PROTOCOL}://{Config.CHT_HOST}:{Config.CHT_PORT}/"
        f"{db_name}/_design/medic-client/_view/{view_name}"
    )

    response = requests.get(
        url,
        params=params,
        auth=(username, password),
        verify=True,
        timeout=60
    )
    response.raise_for_status()
    return response.json()
