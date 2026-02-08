import subprocess
import tempfile
import json
import os

from backend.src.logger import get_backend_logger, audit_log

logger = get_backend_logger(__name__)

def run_javascript(content, timeout=3):
    """
    Execute JavaScript safely using Node.js in a sandboxed subprocess.
    """

    with tempfile.NamedTemporaryFile(mode="w",suffix=".js",delete=False) as f:
        # Wrapper sécurisé
        f.write(f"""
            try {{
            const result = (function() {{
                {content}
            }})();
            console.log(JSON.stringify({{
                success: true,
                result: result ?? null
            }}));
            }} catch (e) {{
            console.log(JSON.stringify({{
                success: false,
                error: e.toString()
            }}));
            }}
        """)
        file_path = f.name

    try:
        proc = subprocess.run(
            ["node", file_path],
            capture_output=True,
            text=True,
            timeout=timeout
        )

        if proc.returncode != 0:
            return ({
                "error": "JavaScript execution failed",
                "stderr": proc.stderr
            }, 400)

        output = proc.stdout.strip()

        try:
            parsed = json.loads(output)
            if parsed.get("success"):
                return (parsed, 200)
            else:
                return ({"error": parsed.get("error")}, 400)
        except json.JSONDecodeError:
            return ({"error": "Invalid JS output", "raw": output}, 400)

    except subprocess.TimeoutExpired:
        return ({"error": "JavaScript execution timeout"}, 408)

    finally:
        os.remove(file_path)
