# backend/sql_routes.py
import re
from uuid import UUID
from decimal import Decimal
from datetime import datetime, date


# Commandes à bloquer globalement (tu peux assouplir pour superadmin)
BLOCKED_SQL = [
    "DROP", "TRUNCATE", "ALTER", "GRANT", "REVOKE", "CREATE ROLE",
    "CREATE DATABASE", "COPY", "DO", "EXEC", "FUNCTION", "PROCEDURE",
    "CREATE TABLE", "VACUUM", "ANALYZE", "REFRESH MATERIALIZED VIEW"
]

# Tables totalement exclues pour tout le monde sauf superadmin
EXCLUDES_TABLE = ["users", "refresh_tokens", "saved_queries"]

# Regex pour détecter référence à tables protégées (schema.table, "quoted", simple)
# On match : optional schema + dot + table, or quoted table with optional schema
EXCLUDES_PATTERN = re.compile(
    r'(?:\b\w+\.)?(?:"(?:' + r'|"|'.join(re.escape(t) for t in EXCLUDES_TABLE) + r')"|(?:' + r'|'.join(re.escape(t) for t in EXCLUDES_TABLE) + r'))\b',
    re.IGNORECASE
)

# Mots-clés dangereux à rechercher au début de la requête
DANGEROUS_KEYWORDS = [
    "DROP", "TRUNCATE", "ALTER", "GRANT", "REVOKE", "CREATE",
    "VACUUM", "ANALYZE", "REFRESH"
]

# Multi-statement detection (improved: semicolons outside quotes)
MULTI_STATEMENT_SEMICOLON_RE = re.compile(r";\s*(SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|TRUNCATE)", re.IGNORECASE)  # re.compile(r";")

# Helper patterns
_LEADING_WORD_RE = re.compile(r"^\s*(?P<first>\w+)", re.IGNORECASE)

# # Mots-clés SQL à surveiller (toutes les opérations)
EXCLUDES_PATTERN_DANGEROUS_KEYWORDS = [
    "from", "join", "update", "insert", "delete", "drop", "truncate", "refresh",
    "alter", "into", "table", "grant", "revoke", "create", "vacuum", "analyse"
]

KEYWORDS_REGEX = re.compile(
    r"\b(" + "|".join(re.escape(t) for t in EXCLUDES_PATTERN_DANGEROUS_KEYWORDS) + r")\b",
    re.IGNORECASE
)


# ------------------ SERIALIZATION ------------------
def jsonify_value(val):
    if val is None:
        return None
    if isinstance(val, (datetime, date)):
        return val.isoformat()
    if isinstance(val, Decimal):
        # keep precision? cast to float (acceptable for most indicators)
        return float(val)
    if isinstance(val, UUID):
        return str(val)
    if isinstance(val, bytes):
        return val.decode("utf-8", errors="ignore")
    if isinstance(val, (list, tuple)):
        return [jsonify_value(v) for v in val]
    return val

# ------------------ SQL CLEANING & ANALYSIS ------------------
def remove_sql_comments(sql: str) -> str:
    """
    Remove -- comments and /* */ comments.
    Not perfect for nested, but covers most practical attacks.
    """
    # Remove block comments first
    sql_no_block = re.sub(r"/\*.*?\*/", " ", sql, flags=re.S)
    # Remove line comments
    sql_no_lines = re.sub(r"--.*?$", " ", sql_no_block, flags=re.M)
    return sql_no_lines

def normalize_sql(sql: str) -> str:
    """Lowercase + collapse whitespace for easier lexical checks (but keep original case for execution)."""
    cleaned = remove_sql_comments(sql)
    return " ".join(cleaned.strip().split())

def get_first_keyword(sql: str) -> str | None:
    """Return first token/word of the SQL (SELECT, INSERT, etc.)"""
    m = _LEADING_WORD_RE.search(remove_sql_comments(sql))
    return m.group("first").upper() if m else None

def contains_excluded_table(sql: str) -> bool:
    """
    Detect if SQL touches an excluded table.
    Uses a robust regex that matches schema.table, quoted, and simple occurrences.
    """
    if not sql:
        return False
    
    sql = " ".join(sql.lower().split())  # supprime les doubles espaces, \n, \t
    tokens = sql.split()
    for i, token in enumerate(tokens):
        if KEYWORDS_REGEX.match(token):
            if i + 1 < len(tokens):
                next_token = tokens[i + 1].replace('"', '').replace("'", "")
                if EXCLUDES_PATTERN.search(next_token):
                    return True
        if EXCLUDES_PATTERN.search(sql):
            return True

    cleaned = remove_sql_comments(sql)
    return bool(EXCLUDES_PATTERN.search(cleaned))

def contains_blocked_keyword(sql: str) -> str | None:
    """Return the blocked keyword found (exact) or None"""
    upper = normalize_sql(sql).upper()
    for kw in DANGEROUS_KEYWORDS:
        # word boundary
        if re.search(r"\b" + re.escape(kw) + r"\b", upper):
            return kw
    return None

def has_multiple_statements(sql: str) -> bool:
    """
    Heuristic: detect semicolons that act as statement separators.
    We reject if there's more than one non-empty statement.
    This avoids naive ';' in strings by a simple heuristic: count semicolons after removing quoted strings.
    """
    # remove single and double quoted strings to avoid semicolons inside them
    tmp = re.sub(r"'.*?'|\".*?\"", " ", sql, flags=re.S)
    semi_count = tmp.count(";")
    return semi_count > 0  # any semicolon treated as multi-statement; conservative



def validate_sql(sql_text,is_admin,is_superadmin):
    # Normalize and inspect SQL
    normalized = normalize_sql(sql_text)
    first_kw = get_first_keyword(sql_text) or ""

    # Block multi-statements for non-admin; even admins can be restricted if you prefer
    if has_multiple_statements(sql_text) and not is_admin:
        return ({"error": "Multiple statements are not allowed"},None,403)

    # Block dangerous keywords presence for non-superadmin
    if not is_superadmin:
        blocked_kw = contains_blocked_keyword(sql_text)
        if blocked_kw:
            return ({"error": f"Command '{blocked_kw}' is not allowed for your role"},None,403)

    # If non-admin: only allow SELECT or EXPLAIN (explain handled separately)
    if not is_superadmin:
        first = first_kw.strip().upper()
        if first not in ("SELECT", "WITH", "EXPLAIN"):
            return ({"error": "Only SELECT/EXPLAIN queries are allowed for your role"},None,403)

        # Disallow any reference to excluded tables
        if contains_excluded_table(sql_text):
            return ({"error": "Operation on a protected table is not allowed"},None,403)
        

    return (sql_text,first_kw,200)
