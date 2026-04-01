# import ast
# import subprocess
# import time
# import uuid

# from backend.src.security.sandbox import MAX_CODE_SIZE

# FORBIDDEN_IMPORTS = {
#     "os",
#     "sys",
#     "subprocess",
#     "socket",
#     "shutil",
#     "pathlib",
#     "multiprocessing",
#     "threading",
#     "asyncio",
# }

# FORBIDDEN_BUILTINS = {
#     "eval",
#     "exec",
#     "compile",
#     "__import__",
#     "open",
#     "input",
# }


# def validate_code_ast(code: str):
#     try:
#         tree = ast.parse(code)
#     except SyntaxError as e:
#         raise ValueError(f"Syntax error: {e}")

#     for node in ast.walk(tree):

#         # --- Import detection ---
#         if isinstance(node, ast.Import):
#             for alias in node.names:
#                 if alias.name.split(".")[0] in FORBIDDEN_IMPORTS:
#                     raise ValueError(f"Forbidden import: {alias.name}")

#         if isinstance(node, ast.ImportFrom):
#             if node.module and node.module.split(".")[0] in FORBIDDEN_IMPORTS:
#                 raise ValueError(f"Forbidden import: {node.module}")

#         # --- Builtins detection ---
#         if isinstance(node, ast.Call):
#             if isinstance(node.func, ast.Name):
#                 if node.func.id in FORBIDDEN_BUILTINS:
#                     raise ValueError(f"Forbidden function: {node.func.id}")


# def run_python_secure(code: str, use_temp_file: bool = False):
#     execution_id = str(uuid.uuid4())
#     start_time = time.time()

#     try:
#         if not isinstance(code, str) or not code.strip():
#             raise ValueError("Empty or invalid code")

#         if len(code) > MAX_CODE_SIZE:
#             raise ValueError("Code size limit exceeded")

#         validate_code_ast(code)

#         cmd = ["python3", "security/sandbox.py"]

#         result = subprocess.run(
#             cmd,
#             input=code,
#             text=True,
#             timeout=TIMEOUT_SECONDS,
#             capture_output=True,
#             preexec_fn=_limit_resources,
#         )

#         duration = round(time.time() - start_time, 3)

#         stdout = result.stdout or ""
#         stderr = result.stderr or ""

#         # --- OUTPUT LIMIT ---
#         if len(stdout) > MAX_OUTPUT_SIZE:
#             stdout = stdout[:MAX_OUTPUT_SIZE]
#             return ({
#                 "execution_id": execution_id,
#                 "status": "error",
#                 "error": "Output truncated (size limit exceeded)",
#                 "stdout": stdout,
#                 "duration": duration,
#             }, 413)

#         # --- JSON parsing if structured ---
#         parsed_output = safe_json_parse(stdout)

#         if result.returncode != 0:
#             logger.warning(
#                 "Python execution error",
#                 extra={
#                     "execution_id": execution_id,
#                     "stderr": stderr,
#                 },
#             )
#             return ({
#                 "execution_id": execution_id,
#                 "status": "error",
#                 "error": stderr.strip() or "Execution error",
#                 "stdout": parsed_output,
#                 "duration": duration,
#             }, 400)

#         return ({
#             "execution_id": execution_id,
#             "status": "ok",
#             "stdout": parsed_output,
#             "duration": duration,
#         }, 200)

#     except subprocess.TimeoutExpired:
#         logger.warning("Execution timeout", extra={"execution_id": execution_id})
#         return ({
#             "execution_id": execution_id,
#             "status": "error",
#             "error": "Execution timeout",
#         }, 408)

#     except ValueError as ve:
#         return ({
#             "execution_id": execution_id,
#             "status": "rejected",
#             "error": str(ve),
#         }, 422)

#     except Exception as e:
#         logger.error("Unhandled execution error", extra={"execution_id": execution_id})
#         return ({
#             "execution_id": execution_id,
#             "status": "error",
#             "error": "Internal execution error",
#         }, 500)
