import subprocess
import time
import tempfile
import os
import resource
import uuid
import json

from backend.src.modules.analytics.logger import get_backend_logger, audit_log

logger = get_backend_logger(__name__)


# --- LIMITES DE SÉCURITÉ ---
TIMEOUT_SECONDS = 5
MAX_OUTPUT_SIZE = 100_000          # 100 KB
MAX_CODE_SIZE = 50_000             # 50 KB
MAX_CPU_SECONDS = 3
MAX_MEMORY_MB = 100                # 100 MB

FORBIDDEN_PATTERNS = [
    "import os",
    "import sys",
    "import subprocess",
    "import socket",
    "__import__",
    "open(",
    "eval(",
    "exec(",
]


def _validate_code(code: str):
    if not code or not isinstance(code, str):
        raise ValueError("Empty or invalid code")

    if len(code) > MAX_CODE_SIZE:
        raise ValueError("Code size limit exceeded")

    lowered = code.lower()
    for pattern in FORBIDDEN_PATTERNS:
        if pattern in lowered:
            raise ValueError(f"Forbidden pattern detected: {pattern}")


def _limit_resources():
    """
    Applied inside the sandboxed process
    """
    resource.setrlimit(resource.RLIMIT_CPU, (MAX_CPU_SECONDS, MAX_CPU_SECONDS))
    resource.setrlimit(
        resource.RLIMIT_AS,
        (MAX_MEMORY_MB * 1024 * 1024, MAX_MEMORY_MB * 1024 * 1024),
    )

def safe_json_parse(value: str):
    try:
        # Si c'est du JSON valide → objet Python
        return json.loads(value.strip())
    except json.JSONDecodeError:
        # Sinon → texte brut (avec vrais \n)
        return value



def run_python(code: str, use_temp_file: bool = False):
    execution_id = str(uuid.uuid4())
    start = time.time()

    try:
        # --- VALIDATION ---
        _validate_code(code)


        if use_temp_file:
            with tempfile.NamedTemporaryFile(mode="w",suffix=".py",delete=False,encoding="utf-8",) as f:
                f.write(code)
                temp_path = f.name

            cmd = ["python3", "backend/src/security/sandbox.py", temp_path]
            result = subprocess.run(
                cmd,
                text=True,
                timeout=TIMEOUT_SECONDS,
                capture_output=True,
                preexec_fn=_limit_resources,
            )
        else:
            cmd = ["python3", "backend/src/security/sandbox.py"]
            result = subprocess.run(
                cmd,
                input=code,          # 🔥 stdin
                text=True,
                timeout=TIMEOUT_SECONDS,
                capture_output=True,
                preexec_fn=_limit_resources,
            )

        # For docker
        # result = subprocess.run(
        #     [
        #         "docker",
        #         "run",
        #         "--rm",
        #         "--network", "none",               # ❌ réseau
        #         "--memory", "128m",                # 🧠 RAM
        #         "--cpus", "0.5",                   # 🧮 CPU
        #         "--pids-limit", "64",              # 🔢 Process
        #         "python-runner",
        #     ],
        #     input=code,
        #     text=True,
        #     capture_output=True,
        #     timeout=TIMEOUT_SECONDS,
        # )

        duration = round(time.time() - start, 3)

        # --- OUTPUT SIZE CONTROL ---
        if len(result.stdout) > MAX_OUTPUT_SIZE:
            return ({
                "execution_id": execution_id,
                "status": "error",
                "error": "Output size exceeded",
            }, 413)

        # --- STDERR HANDLING ---
        if result.stderr:
            logger.warning("Python execution error",extra={"execution_id": execution_id, "stderr": result.stderr})
            return ({
                "execution_id": execution_id,
                "status": "error",
                "error": result.stderr.strip(),
                "duration": duration,
            }, 400)

        # --- SUCCESS ---
        return ({
            "execution_id": execution_id,
            "status": "ok",
            "stdout": result.stdout,
            "stderr": result.stderr,
            "returncode": result.returncode,
            "duration": round(time.time() - start, 3),
            "mode": "temp_file" if use_temp_file else "stdin",
        }, 200)

    except subprocess.TimeoutExpired:
        logger.warning("Python execution timeout", extra={"execution_id": execution_id})
        return ({
            "execution_id": execution_id,
            "status": "error",
            "error": "Execution timeout",
        }, 408)

    except ValueError as ve:
        return ({
            "execution_id": execution_id,
            "status": "rejected",
            "error": str(ve),
        }, 422)

    except Exception as e:
        logger.error(f"Unhandled execution error: {str(e)}")
        return ({
            "execution_id": execution_id,
            "status": "error",
            "error": "Internal execution error",
        }, 500)

    finally:
        # --- CLEANUP ---
        if use_temp_file and "temp_path" in locals():
            try:
                os.unlink(temp_path)
            except OSError:
                pass
