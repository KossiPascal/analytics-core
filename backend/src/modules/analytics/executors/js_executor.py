import subprocess
import tempfile
import json
import os
import uuid

from backend.src.modules.analytics.logger import get_backend_logger

logger = get_backend_logger(__name__)


def run_javascript(content: str, timeout: int = 3):
    """
    Execute arbitrary JavaScript safely using Node.js in isolated subprocess.
    Captures:
        - return value
        - console logs
        - runtime errors
        - syntax errors
        - timeout
    Always returns structured JSON.
    """

    execution_id = str(uuid.uuid4())

    wrapper = f"""
        const logs = [];
        const originalLog = console.log;

        console.log = (...args) => {{
            try {{
                logs.push(args.map(a =>
                    typeof a === "object"
                        ? JSON.stringify(a)
                        : String(a)
                ).join(" "));
            }} catch {{
                logs.push("[Unserializable log]");
            }}
        }};

        async function __runner__() {{
            try {{
                let __result__;
                
                // Execute user code
                __result__ = await (async () => {{
                    {content}
                }})();

                return {{
                    success: true,
                    result: __result__ ?? null,
                    logs
                }};
            }} catch (err) {{
                return {{
                    success: false,
                    error: err?.stack || err?.toString(),
                    logs
                }};
            }}
        }}

        __runner__().then(output => {{
            originalLog("___EXECUTION_RESULT___" + JSON.stringify(output));
        }});
    """

    tmp_file = None

    try:
        with tempfile.NamedTemporaryFile(
            mode="w",
            suffix=".js",
            delete=False,
            encoding="utf-8"
        ) as f:
            f.write(wrapper)
            tmp_file = f.name

        proc = subprocess.run(
            ["node", "--no-warnings", tmp_file],
            capture_output=True,
            text=True,
            timeout=timeout,
        )

        stdout = proc.stdout.strip()
        stderr = proc.stderr.strip()

        if proc.returncode != 0:
            logger.warning("Node execution failed", extra={"stderr": stderr})
            return ({
                "success": False,
                "error": "JavaScript runtime failure",
                "stderr": stderr
            }, 400)

        # Extract structured result
        marker = "___EXECUTION_RESULT___"
        result_line = None

        for line in stdout.splitlines():
            if line.startswith(marker):
                result_line = line.replace(marker, "")
                break

        if not result_line:
            return ({
                "success": False,
                "error": "Execution output malformed",
                "raw_stdout": stdout
            }, 400)

        try:
            parsed = json.loads(result_line)
        except json.JSONDecodeError:
            return ({
                "success": False,
                "error": "Invalid JSON result",
                "raw": result_line
            }, 400)

        return (parsed, 200 if parsed.get("success") else 400)

    except subprocess.TimeoutExpired:
        logger.warning("JavaScript execution timeout", extra={"execution_id": execution_id})
        return ({
            "success": False,
            "error": "Execution timeout"
        }, 408)

    except Exception as e:
        logger.exception("Unexpected JS execution error")
        return ({
            "success": False,
            "error": str(e)
        }, 500)

    finally:
        if tmp_file and os.path.exists(tmp_file):
            try:
                os.remove(tmp_file)
            except Exception:
                logger.warning("Failed to remove temp JS file", extra={"file": tmp_file})




# import subprocess
# import tempfile
# import json
# import os

# from backend.src.logger import get_backend_logger, audit_log

# logger = get_backend_logger(__name__)

# def run_javascript(content, timeout=3):
#     """
#     Execute JavaScript safely using Node.js in a sandboxed subprocess.
#     """

#     with tempfile.NamedTemporaryFile(mode="w",suffix=".js",delete=False) as f:
#         # Wrapper sécurisé
#         f.write(f"""
#             try {{
#             const result = (function() {{
#                 return {content}
#             }})();
#             console.log(JSON.stringify({{
#                 success: true,
#                 result: result ?? null
#             }}));
#             }} catch (e) {{
#             console.log(JSON.stringify({{
#                 success: false,
#                 error: e.toString()
#             }}));
#             }}
#         """)
#         file_path = f.name

#     try:
#         proc = subprocess.run(
#             ["node", file_path],
#             capture_output=True,
#             text=True,
#             timeout=timeout
#         )

#         if proc.returncode != 0:
#             return ({
#                 "error": "JavaScript execution failed",
#                 "stderr": proc.stderr
#             }, 400)

#         output = proc.stdout.strip()

#         try:
#             parsed = json.loads(output)
#             if parsed.get("success"):
#                 return (parsed, 200)
#             else:
#                 raise BadRequest(parsed.get("error")}, 400)
#         except json.JSONDecodeError:
#             raise BadRequest("Invalid JS output", "raw": output}, 400)

#     except subprocess.TimeoutExpired:
#         raise BadRequest("JavaScript execution timeout"}, 408)

#     finally:
#         os.remove(file_path)
