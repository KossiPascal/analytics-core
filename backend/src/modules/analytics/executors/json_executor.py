import json
import uuid
import time

from backend.src.modules.analytics.logger import get_backend_logger, audit_log

logger = get_backend_logger(__name__)
# ------------------------------------------------------------------
# CONFIGURATION DE SÉCURITÉ
# ------------------------------------------------------------------

MAX_JSON_SIZE = 100_000           # 100 KB
MAX_DEPTH = 20                   # profondeur max
MAX_KEYS = 5_000                 # nombre total de clés
FORBIDDEN_KEYS = {
    "__class__",
    "__dict__",
    "__globals__",
    "__subclasses__",
    "$where",
    "$eval",
}

# ------------------------------------------------------------------
# OUTILS INTERNES
# ------------------------------------------------------------------

def _check_depth(obj, depth=0):
    if depth > MAX_DEPTH:
        raise ValueError("JSON nesting depth exceeded")

    if isinstance(obj, dict):
        for v in obj.values():
            _check_depth(v, depth + 1)
    elif isinstance(obj, list):
        for v in obj:
            _check_depth(v, depth + 1)


def _count_keys(obj):
    if isinstance(obj, dict):
        return len(obj) + sum(_count_keys(v) for v in obj.values())
    if isinstance(obj, list):
        return sum(_count_keys(v) for v in obj)
    return 0


def _check_forbidden_keys(obj):
    if isinstance(obj, dict):
        for k, v in obj.items():
            if k in FORBIDDEN_KEYS:
                raise ValueError(f"Forbidden key detected: {k}")
            _check_forbidden_keys(v)
    elif isinstance(obj, list):
        for v in obj:
            _check_forbidden_keys(v)

# ------------------------------------------------------------------
# VALIDATION PRINCIPALE
# ------------------------------------------------------------------

def validate_json(content: str):
    execution_id = str(uuid.uuid4())
    start = time.time()

    try:
        # --- VALIDATION BASIQUE ---
        if not content or not isinstance(content, str):
            return {
                "execution_id": execution_id,
                "valid": False,
                "error": "Empty or invalid JSON content",
            }, 400

        if len(content) > MAX_JSON_SIZE:
            return {
                "execution_id": execution_id,
                "valid": False,
                "error": "JSON size limit exceeded",
            }, 413

        # --- PARSING ---
        parsed = json.loads(content)

        # --- CONTRÔLES DE SÉCURITÉ ---
        _check_depth(parsed)
        _check_forbidden_keys(parsed)

        key_count = _count_keys(parsed)
        if key_count > MAX_KEYS:
            return {
                "execution_id": execution_id,
                "valid": False,
                "error": "JSON key count limit exceeded",
            }, 413

        duration = round(time.time() - start, 3)

        # --- SUCCÈS ---
        return {
            "execution_id": execution_id,
            "valid": True,
            "type": type(parsed).__name__,
            "key_count": key_count,
            "duration": duration,
            "parsed": parsed,
        }, 200

    except json.JSONDecodeError as e:
        return {
            "execution_id": execution_id,
            "valid": False,
            "error": f"Invalid JSON syntax: {e.msg}",
        }, 422

    except ValueError as ve:
        return {
            "execution_id": execution_id,
            "valid": False,
            "error": str(ve),
        }, 422

    except Exception:
        return {
            "execution_id": execution_id,
            "valid": False,
            "error": "Internal JSON validation error",
        }, 500
