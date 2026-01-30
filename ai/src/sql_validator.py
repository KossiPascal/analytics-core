# 5️⃣ ai/sql_validator.py – Validation renforcée

FORBIDDEN = ["delete", "drop", "update", "insert", "truncate", "alter", "--"]

def validate_sql(sql: str):
    if not sql or not sql.strip():
        raise ValueError("SQL vide")
    s = sql.lower()
    if not s.startswith("select"):
        raise ValueError("SQL doit commencer par SELECT")
    for f in FORBIDDEN:
        if f in s:
            raise ValueError(f"SQL contient mot interdit: {f}")
    return True
