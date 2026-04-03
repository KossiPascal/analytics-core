import json
import subprocess
import uuid


def run_javascript_secure(content: str, timeout: int = 3):
    container_name = f"js_runner_{uuid.uuid4().hex}"

    try:
        proc = subprocess.run(
            [
                "docker", "run",
                "--rm",
                "--name", container_name,
                "--memory=128m",
                "--cpus=0.5",
                "--network=none",
                "--pids-limit=64",
                "my-js-sandbox-image",
                content
            ],
            capture_output=True,
            text=True,
            timeout=timeout
        )

        if proc.returncode != 0:
            return {"error": proc.stderr}, 400

        return json.loads(proc.stdout), 200

    except subprocess.TimeoutExpired:
        subprocess.run(["docker", "kill", container_name])
        return {"error": "Execution timeout"}, 408
