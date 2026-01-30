import json
import os
import random
from datetime import datetime, timedelta
from typing import Any, List
import base64

def is_valid_cta(data: Any) -> bool:
    try:
        return any(
            int(data.get(k, 0)) > 0
            for k in ("cta_nn", "cta_pe", "cta_ge", "cta_ad")
        )
    except Exception:
        return False


def sum_all_cta(data: Any) -> int:
    try:
        return sum(
            int(data.get(k, 0))
            for k in ("cta_nn", "cta_pe", "cta_ge", "cta_ad")
            if int(data.get(k, 0)) > 0
        )
    except Exception:
        return 0


def get_previous_month_year(month: str, year: int):
    m = int(month)
    if m == 1:
        return {"month": "12", "year": str(year - 1)}
    return {"month": f"{m-1:02d}", "year": str(year)}


def get_first_last_day_of_month(year: int, month: str):
    month = int(month)
    start = datetime(year, month, 1)
    end = datetime(year, month + 1, 1) if month < 12 else datetime(year + 1, 1, 1)
    end = end.replace(day=1) - timedelta(days=1)
    return {
        "start_date": start.strftime("%Y-%m-%d"),
        "end_date": end.strftime("%Y-%m-%d"),
    }


def not_empty(data: Any) -> bool:
    return (
        data is not None
        and data != ""
        and data != {}
        and str(data).strip() != ""
    )


def is_true(value: Any) -> bool:
    return value in (True, "true", "yes", "True", "YES")


def data_transform(data: Any, return_type: str):
    if not not_empty(data):
        return None
    if return_type == "string":
        return str(data)
    if return_type == "boolean":
        return is_true(data)
    if return_type == "null_false":
        return True if is_true(data) else None
    if return_type == "number":
        return int(data)
    if return_type == "double":
        return float(data)
    return data


def get_sexe(value: str):
    if value.lower() in ("male", "homme"):
        return "M"
    if value.lower() in ("female", "femme"):
        return "F"
    return None


def has_common_element(a: List[str], b: List[str]) -> bool:
    return bool(set(a) & set(b))


def app_version():
    try:
        with open("views/ngsw.json") as f:
            sw = json.load(f).get("timestamp")
    except Exception:
        sw = None

    try:
        with open("package.json") as f:
            app = json.load(f).get("version")
    except Exception:
        app = None

    return {
        "service_worker_version": sw,
        "app_version": app,
    }


def version_as_int(version: str) -> int:
    return int("".join(version.split(".")))


def create_directories(path: str):
    os.makedirs(path, exist_ok=True)


def get_colors(n: int):
    bg = []
    colors = []
    for _ in range(n * 2):
        c = f"#{random.randint(0, 0xFFFFFF):06x}"
        (bg if len(bg) < n else colors).append(c)
    return {"backgroundColors": bg, "colors": colors}


def http_headers(username=None, password=None, with_params=True):
    creds = f"{username}:{password}".encode()
    auth = base64.b64encode(creds).decode()

    headers = {
        "Authorization": f"Basic {auth}",
        "Accept": "application/json",
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Allow-Methods": "DELETE, POST, GET, PUT, OPTIONS",
        "Access-Control-Allow-Headers": "Authorization, Content-Type",
    }

    if with_params:
        headers["Content-Type"] = "application/json"

    return headers

def normalized_path(path: str) -> str:
    return path.split("?")[0].rstrip("/")
