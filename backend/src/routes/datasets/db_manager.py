import re
import hashlib
import unicodedata
from typing import Any, Dict, List, Optional
from backend.src.databases.extensions import db, scheduler
from backend.src.models.datasets.dataset import DbObjectType
from sqlalchemy import bindparam, text
from sqlalchemy.sql.elements import TextClause
from backend.src.routes.datasets.query.sql_compiler import ALLOWED_PATTERN, FORBIDDEN_PATTERNS, VALID_SQL_IDENTIFIER

MAX_IDENTIFIER_LENGTH = 60

RESERVED_KEYWORDS = {
    "select", "table", "view", "index", "where", "group",
    "order", "by", "insert", "update", "delete", "drop"
}


class DbObjectManager:
    """
    Secure PostgreSQL object manager: VIEW, MATERIALIZED VIEW, TABLE (AS SELECT), FUNCTION, INDEX
    Features: SQL injection protection, Safe identifier validation, DROP CASCADE support, Safe rendering with bind params
    """
    def __init__(self, object_name: str, sql_type: str):

        raw_name, quoted_name = self._clean_name_type(object_name)

        self.raw_name = raw_name
        self.quoted_name = quoted_name
        self.sql_type = self._clean_type(sql_type)

    def _clean_name_type(self,view_name:str):
        if not view_name or not isinstance(view_name, str):
            raise ValueError("object name is required")
        view_name = view_name.lower()
        clean_name = view_name.strip('"')
        if not VALID_SQL_IDENTIFIER.match(clean_name):
            raise ValueError(f"Invalid object name: {view_name}")
        return clean_name, f'"{clean_name}"'

    # VALIDATIONS
    def _clean_type(self, sql_type:str):
        if not sql_type or not isinstance(sql_type, str):
            raise ValueError("sql_type is required")
        sql_type = sql_type.lower()
        if sql_type not in DbObjectType.list():
            raise ValueError(f"Invalid sql_type: {self.sql_type}")
        return sql_type

    @classmethod
    def _validate_sql(cls, sql: str):
        if not sql or not isinstance(sql, str):
            raise ValueError("SQL query must be a non-empty string")
        
        if not ALLOWED_PATTERN.search(sql):
            raise ValueError("Only SELECT queries are allowed")

        for pattern in FORBIDDEN_PATTERNS:
            if re.search(pattern, sql, re.IGNORECASE):
                raise ValueError(f"Forbidden SQL pattern detected: {pattern}")

    # SQL RENDERING
    @classmethod
    def render_sql_with_values(cls, sql: str, values: Dict[str, Any]) -> str:
        """
        Safely render SQL with parameters.
        Handles: Scalars, Lists (IN / ANY)
        """

        cls._validate_sql(sql)
        try:
            stmt: TextClause = text(sql)
            for key, value in values.items():
                # 🔹 LIST handling (IN / ANY)
                if isinstance(value, list):
                    if not value:
                        # Edge case: empty list → always false condition
                        sql = sql.replace(f":{key}", "NULL")
                        continue

                    formatted = []
                    for v in value:
                        if isinstance(v, str):
                            formatted.append(f"'{v}'")
                        elif v is None:
                            formatted.append("NULL")
                        else:
                            formatted.append(str(v))

                    # formatted = [repr(v) if isinstance(v, str) else str(v) for v in value]

                    array_expr = f"ARRAY[{', '.join(formatted)}]"
                    sql = sql.replace(f":{key}", array_expr)
                else:
                    stmt = stmt.bindparams(bindparam(key, value=value))

            compiled = stmt.compile(db.engine, compile_kwargs={"literal_binds": True})

            return str(compiled)

        except Exception as e:
            raise ValueError(f"SQL rendering error: {e}")

    @staticmethod
    def safe_object_name(raw_name: str, user_id: int) -> str:
        if not raw_name or not isinstance(raw_name, str):
            raw_name = "obj"

        # 🔹 1. Normaliser (enlever accents)
        name = unicodedata.normalize("NFKD", raw_name)
        name = name.encode("ascii", "ignore").decode("ascii")

        # 🔹 2. Lowercase
        name = name.lower()

        # 🔹 3. Remplacer caractères interdits
        name = re.sub(r"[^a-z0-9_]", "_", name)

        # 🔹 4. Supprimer underscores multiples
        name = re.sub(r"_+", "_", name)

        # 🔹 5. Trim underscores début/fin
        name = name.strip("_")

        # 🔹 6. Si vide → fallback
        if not name:
            name = "obj"

        # 🔹 7. Si commence par chiffre → prefix
        if name[0].isdigit():
            name = f"v_{name}"

        # 🔹 8. Éviter mots réservés
        if name in RESERVED_KEYWORDS:
            name = f"{name}_obj"

        # 🔹 9. Hash unique (stable)
        hash_part = hashlib.sha1(f"{name}_{user_id}".encode()).hexdigest()[:8]

        # 🔹 10. Respect limite PostgreSQL
        max_base_length = MAX_IDENTIFIER_LENGTH - len(hash_part) - 1
        name = name[:max_base_length]

        return f"{name}_{hash_part}"

    # SQL GENERATION
    def generate_create_sql(self, sql: str, values: Dict[str, Any]) -> str:

        rendered = self.render_sql_with_values(sql, values)

        create_sql = None

        if self.sql_type == DbObjectType.MATVIEW.value:
            create_sql = f"CREATE MATERIALIZED VIEW {self.quoted_name} AS {rendered}"

        elif self.sql_type == DbObjectType.VIEW.value:
            create_sql = f"CREATE OR REPLACE VIEW {self.quoted_name} AS {rendered}"

        elif self.sql_type == DbObjectType.TABLE.value:
            create_sql = f"CREATE TABLE {self.quoted_name} AS {rendered}"

        elif self.sql_type == DbObjectType.FUNCTION.value:
            # ⚠️ Ici SQL doit être une définition complète
            create_sql = rendered

        elif self.sql_type == DbObjectType.INDEX.value:
            create_sql = rendered

        return create_sql.strip()

    # DROP SQL GENERATION
    def generate_drop_sql(self) -> str:

        drop_sql = None

        if self.sql_type == DbObjectType.MATVIEW.value:
            drop_sql = f"DROP MATERIALIZED VIEW IF EXISTS {self.quoted_name} CASCADE"

        elif self.sql_type == DbObjectType.VIEW.value:
            drop_sql = f"DROP VIEW IF EXISTS {self.quoted_name} CASCADE"

        elif self.sql_type == DbObjectType.TABLE.value:
            drop_sql = f"DROP TABLE IF EXISTS {self.quoted_name} CASCADE"

        elif self.sql_type == DbObjectType.FUNCTION.value:
            drop_sql = f"DROP FUNCTION IF EXISTS {self.quoted_name} CASCADE"

        elif self.sql_type == DbObjectType.INDEX.value:
            drop_sql = f"DROP INDEX IF EXISTS {self.quoted_name} CASCADE"

        return drop_sql

    def object_exists(self, schema: str = "public") -> bool:

        relkind_map = {
            DbObjectType.TABLE.value: "r",
            DbObjectType.VIEW.value: "v",
            DbObjectType.MATVIEW.value: "m",
            DbObjectType.INDEX.value: "i",
            DbObjectType.SEQUENCE.value: "S",
            DbObjectType.FOREIGN_TABLE.value: "f",
        }

        # 🔴 CAS FUNCTION (pg_proc)
        if self.sql_type == "FUNCTION":
            sql = """
            SELECT EXISTS (
                SELECT 1
                FROM pg_proc p
                JOIN pg_namespace n ON n.oid = p.pronamespace
                WHERE p.proname = :name
                AND n.nspname = :schema
            )
            """

            with db.engine.connect() as conn:
                return conn.execute(
                    text(sql),
                    {"name": self.quoted_name, "schema": schema}
                ).scalar()

        # 🔴 AUTRES OBJETS (pg_class)
        if self.sql_type not in relkind_map:
            raise ValueError(f"Unsupported sql_type: {self.sql_type}")

        relkind = relkind_map[self.sql_type]

        sql = """
        SELECT EXISTS (
            SELECT 1
            FROM pg_class c
            JOIN pg_namespace n ON n.oid = c.relnamespace
            WHERE c.relname = :name
            AND n.nspname = :schema
            AND c.relkind = :relkind
        )
        """

        with db.engine.connect() as conn:
            return conn.execute(
                text(sql),
                {"name": self.quoted_name, "schema": schema, "relkind": relkind}
            ).scalar()
 
    # EXECUTION
    def create_object(self, sql: str, values: Dict[str, Any], replace: bool = False):
        try:
            create_sql = self.generate_create_sql(sql, values)
            drop_sql = self.generate_drop_sql()
            with db.engine.begin() as conn:
                if replace == True and drop_sql:
                    conn.execute(text(drop_sql))
                conn.execute(text(create_sql))

        except Exception as e:
            raise ValueError(f"Create error: {e}")
        
    def update_object(self, sql: str, values: Dict[str, Any]):
        self.create_object(sql=sql, values=values, replace=True)

    def drop_object(self):
        try:
            drop_sql = self.generate_drop_sql()
            if not drop_sql:
                return
            with db.engine.begin() as conn:
                conn.execute(text(drop_sql))
        except Exception as e:
            raise ValueError(f"Delete error: {e}")

    # MATERIALIZED VIEW
    def refresh_matview(self, concurrently: bool = True):
        if self.sql_type != DbObjectType.MATVIEW.value:
            return

        sql = f"REFRESH MATERIALIZED VIEW {'CONCURRENTLY ' if concurrently else ''}{self.quoted_name}"
        try:
            with db.engine.begin() as conn:
                conn.execute(text(sql))
        except Exception as e:
            raise ValueError(f"Refresh error: {e}")

    # SCHEDULER
    def schedule_refresh(self,cron_expression: str,concurrently: bool = True,job_id: Optional[str] = None):
        """
        Schedule automatic refresh of the matview via APScheduler.
        - cron_expression: standard cron (e.g. '0 * * * *' = every hour)
        """
        if self.sql_type != DbObjectType.MATVIEW.value:
            return

        job_id = job_id or f"refresh_{self.raw_name}"
        def job():
            try:
                self.refresh_matview(concurrently)
                print(f"[OK] Matview Refreshed {self.raw_name}")
            except Exception as e:
                print(f"[ERROR] Refresh {self.raw_name}: {e}")

        # Remove existing job if any
        if scheduler.get_job(job_id):
            scheduler.remove_job(job_id)

        # Add new cron job
        scheduler.add_job(
            id=job_id,
            func=job,
            trigger="cron",
            **self._parse_cron(cron_expression)
        )

    def _parse_cron(self, expr: str) -> Dict[str, str]:
        parts = expr.strip().split()

        if len(parts) != 5:
            raise ValueError("Cron must have 5 parts")

        return {
            "minute": parts[0],
            "hour": parts[1],
            "day": parts[2],
            "month": parts[3],
            "day_of_week": parts[4],
        }
        # return dict(
        #     minute=parts[0], 
        #     hour=parts[1], 
        #     day=parts[2], 
        #     month=parts[3], 
        #     day_of_week=parts[4]
        # )
    

class SqlIntrospector:

    @staticmethod
    def _map_pg_type(pg_type: str) -> str:
        if not pg_type:
            return "string"

        t = pg_type.lower()

        # 🔹 enlever [] (array)
        is_array = t.endswith("[]")
        if is_array:
            t = t[:-2]

        # 🔹 mapping précis
        if t in {"smallint", "integer", "bigint","serial", "bigserial","numeric", "decimal","real", "double precision", "money"}:
            base = "number"
        elif t in {"date", "timestamp", "timestamptz", "time", "timetz"}:
            base = "datetime"
        elif t == "interval":
            base = "duration"
        elif t in {"boolean"}:
            base = "boolean"
        elif t in {"json", "jsonb"}:
            base = "json"
        elif t in {"uuid"}:
            base = "uuid"
        elif t in {"bytea"}:
            base = "binary"
        else:
            base = "string"

        return f"{base}[]" if is_array else base

    @staticmethod
    def _clean_sql(sql: str) -> str:
        if not sql or not isinstance(sql, str):
            raise ValueError("Invalid SQL")

        # remove comments
        sql = re.sub(r"--.*?$", "", sql, flags=re.MULTILINE)
        sql = re.sub(r"/\*.*?\*/", "", sql, flags=re.DOTALL)

        sql = sql.strip().rstrip(";")

        # forbid multi-statements
        if ";" in sql:
            raise ValueError("Multiple statements not allowed")

        return sql

    # --------------------------------------------------

    # @staticmethod
    # def extract_select_query(sql: str) -> str:
    #     sql = SqlIntrospector._clean_sql(sql)
    #     # 🔹 CREATE ... AS ...
    #     match = re.search(r"\bAS\s*\(?\s*(SELECT|WITH)\b",sql,re.IGNORECASE)
    #     if match:
    #         return sql[match.start(1):]
    #     # 🔹 direct SELECT / WITH
    #     if re.match(r"^\s*(SELECT|WITH)\b", sql, re.IGNORECASE):
    #         return sql
    #     raise ValueError("Only SELECT-based queries are allowed")

    @staticmethod
    def unwrap_sql(sql: str) -> str:
        sql = SqlIntrospector._clean_sql(sql)

        # uniquement pour CREATE ... AS
        match = re.search(r"\bAS\s+(SELECT|WITH)\b.*", sql, re.IGNORECASE | re.DOTALL)
        if match:
            return sql[match.start(1):]

        return sql

 
    @staticmethod
    def add_limit(sql: str, limit: int = 100) -> str:
        """
        Ajoute un LIMIT directement sur la requête principale.
        Si la requête est une CTE (WITH ... AS (...)), on place le LIMIT à l'intérieur de la CTE
        pour éviter que PostgreSQL scanne tout.
        """
        sql_clean = sql.strip().rstrip(";")

        # 🔹 détecter LIMIT déjà présent
        if re.search(r"\bLIMIT\s+\d+", sql_clean, re.IGNORECASE):
            return sql_clean

        # # 🔹 Si c'est un WITH ... AS ( ... ), ajouter LIMIT à la fin de la CTE
        # cte_match = re.match(r"(WITH\s+.+?\))\s+SELECT", sql_clean, re.IGNORECASE | re.DOTALL)
        # if cte_match:
        #     cte_sql = cte_match.group(1)
        #     rest_sql = sql_clean[len(cte_sql):].lstrip()
        #     # ajouter LIMIT à l'intérieur de la CTE
        #     cte_sql_limited = re.sub(r"\)\s*$", f") LIMIT {limit}", cte_sql)
        #     return f"{cte_sql_limited} {rest_sql}"

        # sinon simple SELECT
        return f"{sql_clean} LIMIT {limit}"


    @classmethod
    def get_columns(cls, sql: str = None, object_name: str = None, values: dict = {}, schema: str = "public") -> List[Dict[str, str]]:
        """
        Récupère les colonnes et leurs types.
        - Si object_name existe physiquement -> pg_attribute
        - Sinon -> introspection SQL brut (SELECT, WITH, CREATE VIEW ...)
        """
        try:    
            if object_name:
                # 🔹 objet existant
                query = """
                    SELECT
                        a.attname AS column_name,
                        pg_catalog.format_type(a.atttypid, a.atttypmod) AS data_type
                    FROM pg_attribute a
                    JOIN pg_class c ON a.attrelid = c.oid
                    JOIN pg_namespace n ON c.relnamespace = n.oid
                    WHERE c.relname = :object_name
                    AND n.nspname = :schema
                    AND a.attnum > 0
                    AND NOT a.attisdropped
                    ORDER BY a.attnum;
                """
                params = {**(values or {}), "object_name": object_name, "schema": schema}
                result = db.session.execute(text(query), params).mappings().all()

                return [
                    {"name": row["column_name"], "type": cls._map_pg_type(row["data_type"])}
                    for row in result
                ]

            elif sql:
                # 🔹 SQL brut
                selected_sql = cls.unwrap_sql(sql)
                final_sql = cls.add_limit(selected_sql, 1)

                wrapped_sql = f"SELECT * FROM ({final_sql}) AS subquery LIMIT 1"
                # wrapped_sql = f"""
                #     WITH subquery AS ({final_sql})
                #     SELECT * FROM subquery LIMIT 1
                #     """
        

                with db.engine.connect() as conn:
                    result = conn.execute(text(wrapped_sql))
                    oids = [col.type_code for col in result.cursor.description]

                    # récupérer tous les types en une seule requête
                    type_map = {}
                    if oids:
                        params = {**(values or {}), "oids": oids}
                        rows = conn.execute(
                            text("""
                                SELECT oid, format_type(oid, NULL)
                                FROM pg_type
                                WHERE oid = ANY(:oids)
                            """),
                            params
                        ).fetchall()

                        type_map = {r[0]: r[1] for r in rows}

                    columns = [
                        {"name": col.name, "type": cls._map_pg_type(type_map.get(col.type_code, "unknown"))}
                        for col in result.cursor.description
                    ]
                    return columns

            else:
                return []

        except Exception as e:
            raise ValueError(f"SQL introspection error: {e}")


    @classmethod
    def sql_from_db(cls, view_name: str, sql_type: str, schema: str = "public") -> (Dict[str, Any] | None):
        """
        Récupère le SQL réel de la view/table/function en base de données
        à partir de view_name et sql_type.
        """
        sql_type = sql_type.lower()

        if not view_name or not sql_type:
            raise ValueError('view_name or sql_type is required !')
        
        query = None
        if sql_type == DbObjectType.VIEW.value:
            query = """
                SELECT definition
                FROM pg_views
                WHERE schemaname = :schema AND viewname = :view_name
            """
        elif sql_type == DbObjectType.MATVIEW.value:
            query = """
                SELECT definition
                FROM pg_matviews
                WHERE schemaname = :schema AND matviewname = :view_name
            """
        elif sql_type == DbObjectType.FUNCTION.value:
            query = f"""
                SELECT pg_get_functiondef(p.oid) AS definition
                FROM pg_proc p
                JOIN pg_namespace n ON n.oid = p.pronamespace
                WHERE n.nspname = :schema AND p.proname = :view_name
            """
        elif sql_type == DbObjectType.TABLE.value:
            # Pour une table, on peut reconstruire CREATE TABLE via pg_dump ou information_schema
            query = f"""
                SELECT 'table: ' || table_name AS definition
                FROM information_schema.tables
                WHERE table_schema = :schema AND table_name = :view_name
            """
        else:
            # Index et autres types → pas géré ici
            return None

        result = db.session.execute(text(query), {"schema": schema, "view_name": view_name}).fetchone()

        return result[0] if result else None
