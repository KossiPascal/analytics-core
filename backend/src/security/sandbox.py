# security/sandbox.py
import sys
import ast
import signal
import json

# ------------------------------------------------------------------
# CONFIGURATION DE SÉCURITÉ
# ------------------------------------------------------------------

MAX_CODE_SIZE = 50_000
MAX_EXECUTION_TIME = 3
MAX_PRINT_ITEMS = 10_000

# ------------------------------------------------------------------
# BUILTINS AUTORISÉS
# ------------------------------------------------------------------

SAFE_BUILTINS = {
    "range": range,
    "len": len,
    "int": int,
    "float": float,
    "str": str,
    "bool": bool,
    "list": list,
    "dict": dict,
    "set": set,
    "tuple": tuple,
    "enumerate": enumerate,
    "abs": abs,
    "min": min,
    "max": max,
    "sum": sum,
}

# ------------------------------------------------------------------
# AST INTERDIT
# ------------------------------------------------------------------

FORBIDDEN_AST_NODES = (
    ast.Import,
    ast.ImportFrom,
    ast.Global,
    ast.Nonlocal,
    ast.With,
    ast.Try,
    ast.Raise,
    ast.ClassDef,
    # ast.FunctionDef,
    ast.AsyncFunctionDef,
    ast.Lambda,
)

FORBIDDEN_NAMES = {
    "__builtins__",
    "__globals__",
    "__locals__",
    "__subclasses__",
    "__class__",
    "__dict__",
    "__base__",
    "__mro__",
    "__getattribute__",
    "__import__",
    "eval",
    "exec",
    "open",
    "compile",
    "input",
    "help",
    "dir",
    "vars",
}

# ------------------------------------------------------------------
# VALIDATION AST
# ------------------------------------------------------------------

def validate_ast(code: str):
    tree = ast.parse(code, mode="exec")
    for node in ast.walk(tree):
        if isinstance(node, FORBIDDEN_AST_NODES):
            raise RuntimeError(f"Forbidden syntax: {node.__class__.__name__}")
        if isinstance(node, ast.Name) and node.id in FORBIDDEN_NAMES:
            raise RuntimeError(f"Forbidden name usage: {node.id}")

# ------------------------------------------------------------------
# TIMEOUT
# ------------------------------------------------------------------

def timeout_handler(signum, frame):
    raise TimeoutError("Execution time exceeded")

signal.signal(signal.SIGALRM, timeout_handler)

# ------------------------------------------------------------------
# PRINT COLLECTOR (LE CŒUR)
# ------------------------------------------------------------------

class PrintCollector:
    def __init__(self, limit):
        self.limit = limit
        self.count = 0
        self.buffer = []

    def __call__(self, *args, **kwargs):
        if self.count >= self.limit:
            raise RuntimeError("Print output limit exceeded")

        self.count += 1

        sep = kwargs.get("sep", " ")
        end = kwargs.get("end", "\n")

        text = sep.join(str(a) for a in args)
        self.buffer.append(text)

        print(*args, **kwargs)


# class PrintLimiter:
#     def __init__(self, limit):
#         self.limit = limit
#         self.count = 0

#     def __call__(self, *args, **kwargs):
#         if self.count >= self.limit:
#             raise RuntimeError("Print output limit exceeded")
#         self.count += 1
#         print(*args, **kwargs)

def sandbox_print(payload):
    sys.stdout.write(json.dumps(payload, ensure_ascii=False))
    sys.stdout.flush()

# ------------------------------------------------------------------
# MAIN
# ------------------------------------------------------------------

def main():
    stderr_message = None

    # 🔐 Lecture code
    if len(sys.argv) == 2:
        with open(sys.argv[1], "r", encoding="utf-8") as f:
            code = f.read()
    else:
        code = sys.stdin.read()

    if not code or not code.strip():
        raise RuntimeError("No code provided")

    if len(code) > MAX_CODE_SIZE:
        raise RuntimeError("Code size limit exceeded")

    validate_ast(code)
    signal.alarm(MAX_EXECUTION_TIME)

    printer = PrintCollector(MAX_PRINT_ITEMS)

    sandbox_globals = {
        "__builtins__": dict(SAFE_BUILTINS),
    }
    sandbox_globals["__builtins__"]["print"] = printer

    exec(compile(code, "<sandbox>", "exec"), sandbox_globals, {})


# ------------------------------------------------------------------

if __name__ == "__main__":
    try:
        main()
    except TimeoutError as e:
        print(f"[TIMEOUT] {e}")
    except Exception as e:
        print(f"[ERROR] {e}")
    finally:
        signal.alarm(0)


#         output = {
#             "stdout": [json.load(buf) for buf in (printer.buffer if isinstance(printer.buffer, list) else [printer.buffer])],
#             "stderr": None,
#             "lines": len(printer.buffer),
#             "error": None,
#         }

#     except TimeoutError as e:
#         output = {
#             "stdout": [],
#             "stderr": str(e),
#             "lines": 0,
#             "error": "timeout",
#         }

#     except Exception as e:
#         output = {
#             "stdout": [],
#             "stderr": str(e),
#             "lines": 0,
#             "error": "runtime",
#         }

#     finally:
#         signal.alarm(0)

#     sandbox_print(output)
#     # print(json.dumps(output, ensure_ascii=False))


# # ------------------------------------------------------------------

# if __name__ == "__main__":
#     main()
