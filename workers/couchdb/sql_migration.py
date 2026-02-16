import os
import re
import ast
import json
import textwrap
from flask import Flask
from sqlalchemy import text
import yaml
import hashlib
from pathlib import Path
from typing import List, Dict, Any, Literal, Set, Tuple, Optional, TypedDict
import psycopg2
from psycopg2 import sql

from backend.src.config import Config
from backend.src.models.connection import CouchdbSyncCible
from workers.couchdb.utils import with_app_context
from backend.src.databases.extensions import db
from sqlalchemy.orm import Session

from workers.logger import get_workers_logger
logger = get_workers_logger(__name__)
from enum import Enum

class SQLObjectType(str, Enum):
    TABLE = "table"
    FUNCTION = "function"
    VIEW = "view"
    MATVIEW = "matview"
    INDEX = "index"

# ----------------------------
# CONFIGURATION
# ----------------------------

METHODES = {
    "btree": "Index standard (par défaut)",
    "gin": "JSONB, ARRAY, full-text search",
    "gist": "Géospatial (PostGIS)",
    "hash": "Hash lookup simple",
    "brin": "Très grosses tables (scan range optimisé)",
}

# Priorité pour l'ordre de création
TYPE_PRIORITY = {
    SQLObjectType.TABLE: 1,
    SQLObjectType.FUNCTION: 2,
    SQLObjectType.VIEW: 3,
    SQLObjectType.MATVIEW: 4,
    SQLObjectType.INDEX: 5,
}

MetadataSource = Literal["sql", "json"]


class IndexDict(TypedDict, total=False):
    columns: List[str]
    unique: bool
    method: str
    where: str
    concurrently: bool


class SQLMetadataConversionError(Exception):
    pass

# CREATE MATERIALIZED VIEW IF NOT EXISTS patient_view WITH NO DATA AS ...


class DependencyError(Exception):
    """Base class for all dependency-related errors."""
    def __init__(self, message: str = None):
        if message is None:
            message = "A dependency-related error occurred."
        super().__init__(message)

class CircularDependencyError(DependencyError):
    """Raised when a circular dependency is detected."""
    def __init__(self, cycle: list[str] = None):
        if cycle:
            message = f"Circular dependency detected: {' -> '.join(cycle)}"
        else:
            message = "A circular dependency was detected."
        super().__init__(message)

class MissingDependencyError(DependencyError):
    """Raised when a required dependency is missing."""
    def __init__(self, missing: str = None):
        if missing:
            message = f"Missing required dependency: {missing}"
        else:
            message = "A required dependency is missing."
        super().__init__(message)



class SQLMetadataError(Exception):
    pass


class SQLMetadataParser:
    @staticmethod
    def parse_indexes(yaml_text: str) -> List[IndexDict]:
        try:
            raw = yaml.safe_load(yaml_text) or []
        except yaml.YAMLError as e:
            raise SQLMetadataError(f"Invalid YAML: {e}")
        # Normalisation...
        return "normalized"



# ----------------------------
# SQL UTILS
# ----------------------------
class SQLUtils:

    # ----------------------------
    # UTILITAIRES
    # ----------------------------
    @staticmethod
    def extract_sql_dependencies(sql: str, known_objects: List[str]) -> List[str]:
        """
        Extrait toutes les dépendances d'un SQLObject :
        - tables/vues via FROM / JOIN
        - fonctions via appel fn(...)
        """
        known_set = set(known_objects)
        deps: Set[str] = set()

        # 1️⃣ Dépendances FROM / JOIN
        table_pattern = r"\b(?:FROM|JOIN)\s+([a-zA-Z0-9_\.]+)"
        table_matches = re.findall(table_pattern, sql, re.IGNORECASE)
        for obj in table_matches:
            name = obj.split(".")[-1]
            if name in known_set:
                deps.add(name)

        # 2️⃣ Dépendances fonctions appelées
        func_pattern = r"\b([a-zA-Z_][a-zA-Z0-9_]*)\s*\("
        func_matches = re.findall(func_pattern, sql)
        for fn in func_matches:
            if fn in known_set:
                deps.add(fn)

        return list(deps)


    @staticmethod
    def build_index_sql(object_name: str, idx: Dict[str, Any], project_name:str,) -> str:
        columns = idx.get("columns") or []
        if not columns:
            return ""
        
        safe_table = SQLUtils.validate_identifier(object_name)
        safe_columns = [SQLUtils.validate_identifier(c) for c in columns]

        unique = "UNIQUE " if idx.get("unique") else ""
        method_raw = (idx.get("method") or "").lower()
        method = f" USING {method_raw}" if method_raw in METHODES else ""
        where = f" WHERE {idx['where']}" if idx.get("where") else ""

        index_name = f"{project_name}_idx_{safe_table}_{'_'.join(safe_columns)}"
        cols_sql_str = "(" + ", ".join(safe_columns) + ")"

        index_sql = f"CREATE {unique}INDEX IF NOT EXISTS {index_name} ON {safe_table}{method} {cols_sql_str}{where};"

        return index_sql

    @staticmethod
    def validate_identifier(name: str)-> str:
        if not isinstance(name, str):
            raise TypeError("Identifier must be a string")
        if not re.fullmatch(r"[a-zA-Z_][a-zA-Z0-9_]*", name):
            raise ValueError(f"Invalid identifier: {name}")
        return name
    
    @staticmethod
    def get_sql_folder(project_name:str):
        project_name_raw = SQLUtils.validate_identifier(project_name)
        return Config.POSTGRESQL_DIR / project_name_raw
    
    @staticmethod
    def get_sql_files(project_name:str)-> list[Path]:
        sql_folder = SQLUtils.get_sql_folder(project_name)

        folder_path = Path(sql_folder).resolve(strict=True)

        if not folder_path.exists():
            raise FileNotFoundError(f"Folder not found: {sql_folder}")

        if not folder_path.is_dir():
            raise NotADirectoryError(f"Not a directory: {sql_folder}")

        # 🔥 rglob = recursive glob
        # ➡ explore récursivement tous les sous-dossiers, sans limite de profondeur.
        sql_files = sorted(
            (
                p for p in folder_path.rglob("*.sql")
                if "__pycache__" not in p.parts and ".git" not in p.parts
            ),
            key=lambda p: (len(p.relative_to(folder_path).parts),p.name)
        )
        return sql_files
    
    @staticmethod
    def migrations_shema_name(project_name:str):
        if not project_name or not isinstance(project_name, str):
            logger.info('project_name is missed ...')
            raise
        return SQLUtils.validate_identifier(f"{project_name}_schema_migrations")

    # ----------------------------
    # MIGRATION TABLE
    # ----------------------------
    @staticmethod
    @with_app_context
    def ensure_migration_table(session:Session, project_name:str, app:Flask=None):

        shema_name = SQLUtils.migrations_shema_name(project_name)
        session.execute(text(f"""
            CREATE TABLE IF NOT EXISTS {shema_name} (
                name TEXT PRIMARY KEY,
                hash TEXT NOT NULL,
                applied_at TIMESTAMP DEFAULT now()
            )
        """))

    @staticmethod
    @with_app_context
    def is_up_to_date(session, obj: "SQLObject", project_name:str, app:Flask=None) -> bool:

        shema_name = SQLUtils.migrations_shema_name(project_name)
        result = session.execute(
            text(f"SELECT hash FROM {shema_name} WHERE name = :name"), {"name": obj.name}
        )
        row = result.fetchone()
        # return row is not None and row[0] == obj.hash
        if not row:
            return False
        return row[0] == obj.hash

    @staticmethod
    @with_app_context
    def record_migration(session, obj: "SQLObject", project_name:str, app:Flask=None):

        shema_name = SQLUtils.migrations_shema_name(project_name)
        session.execute(text(f"""
            INSERT INTO {shema_name} (name, hash)
            VALUES (:name, :hash)
            ON CONFLICT (name)
            DO UPDATE SET hash = EXCLUDED.hash, applied_at = now()
        """), {"name": obj.name, "hash": obj.hash})

    @staticmethod
    @with_app_context
    def remove_migration(session, obj: "SQLObject", project_name:str, app:Flask=None):

        shema_name = SQLUtils.migrations_shema_name(project_name)
        session.execute(text(f"DELETE FROM {shema_name} WHERE name = :name"), {"name": obj.name})

    # ----------------------------
    # DEPENDENCY SORT
    # ----------------------------
    @staticmethod
    def topo_sort(objects: List["SQLObject"]) -> List["SQLObject"]:
        name_map = {obj.name: obj for obj in objects}
        visited: Set[str] = set()
        temp: Set[str] = set()
        stack: List[SQLObject] = []

        def visit(name: str):
            if name in temp:
                raise CircularDependencyError(temp)
            if name not in visited:
                temp.add(name)
                for dep in name_map[name].depends:
                    if dep not in name_map:
                        raise MissingDependencyError(dep)
                    visit(dep)
                temp.remove(name)
                visited.add(name)
                stack.append(name_map[name])

        for obj in sorted(objects, key=lambda o: TYPE_PRIORITY.get(o.type, 99)):
            visit(obj.name)
            # print(obj.name)
            
        return stack

    # ----------------------------
    # SQL OBJECT LOADING
    # ----------------------------
    @staticmethod
    def load_sql_objects(project_name: str, metadata_source: MetadataSource = "sql") -> List["SQLObject"]:
        
        sql_files = SQLUtils.get_sql_files(project_name)

        objects: List[SQLObject] = []
        known_objects: Set[str] = set()

        for path in sql_files:
            obj = SQLObject(path, metadata_source=metadata_source)

            if not obj.name:
                raise ValueError(f"Missing object name in {path}")

            if obj.name in known_objects:
                raise ValueError(f"Duplicate SQL object name: {obj.name}")

            known_objects.add(obj.name)
            objects.append(obj)


        # Auto-detect dependencies
        for obj in objects:
            if obj.auto_depends:
                obj.depends = [
                    d for d in SQLUtils.extract_sql_dependencies(obj.content, list(known_objects))
                    if d and d != obj.name
                ]

        return objects

    @staticmethod
    def load_sql_objects_version2(folder: str) -> List[Dict]:
        """
        Charge tous les fichiers SQL et construit la liste d'objets avec metadata
        """
        objects = []
        known_objects = []

        for filename in sorted(os.listdir(folder)):
            if not filename.endswith(".sql"):
                continue
            path = os.path.join(folder, filename)
            sql, meta = SQLObject.parse_sql_file_version_0(path)
            obj_name = meta.get("name") or os.path.splitext(filename)[0]
            obj_type = meta.get("type", "function")  # default function
            objects.append({
                "name": obj_name,
                "type": obj_type,
                "sql": sql,
                "metadata": meta,
                "depends": meta.get("depends", []),
            })
            known_objects.append(obj_name)

        # Auto-detect dependencies si demandé
        for obj in objects:
            if obj["metadata"].get("auto_depends"):
                obj["depends"] = SQLUtils.extract_sql_dependencies(obj["sql"], known_objects)

        return objects
    

    # ----------------------------
    # INDEX CREATION
    # ----------------------------
    @staticmethod
    @with_app_context
    def create_indexes(session: Session, obj: "SQLObject", project_name:str, app:Flask=None)-> List[str]:
        view_index_sql = []

        print("AAAAAAAAAAAAAAAAAAA")
        print(str(obj.indexes))

        for idx in obj.indexes:
            sql_str = SQLUtils.build_index_sql(obj.name, idx, project_name)
            if not sql_str or not sql_str.strip():
                logger.error(f"CREATE INDEXES ERRORRRRRRR...: {str(obj.name)}")
                raise
            session.execute(text(sql_str))
            view_index_sql.append(sql_str)
        return view_index_sql

    @staticmethod
    @with_app_context
    def create_project_indexes(session: Session, project_name: str, app:Flask=None):
        safe_name = SQLUtils.validate_identifier(project_name)

        local_db_names = [n.local_name for n in CouchdbSyncCible.ensure_default_couchdb_dbs() if n.local_name]
        queries = [
            "CREATE INDEX IF NOT EXISTS idx_{}_doc_id ON {} ((doc->>'_id')) WHERE (doc::JSONB) ? '_id';",
            "CREATE INDEX IF NOT EXISTS idx_{}_doc_type ON {} ((doc->>'type')) WHERE (doc::JSONB) ? 'type';",
            "CREATE INDEX IF NOT EXISTS idx_{}_doc_role ON {} ((doc->>'role')) WHERE (doc::JSONB) ? 'role';",
            # "CREATE INDEX IF NOT EXISTS idx_{}_doc_type_patient ON {} ((doc->>'type')) WHERE ((doc::JSONB)->>'type') = 'person';"
            # "CREATE INDEX IF NOT EXISTS idx_{}_doc_role_patient ON {} ((doc->>'role')) WHERE ((doc::JSONB)->>'role') = 'patient';"

            "CREATE INDEX IF NOT EXISTS idx_{}_doc_p_id ON {} ((doc->'parent'->>'_id')) WHERE ((doc->'parent')::JSONB) ? '_id';",
            "CREATE INDEX IF NOT EXISTS idx_{}_doc_pp_id ON {} ((doc->'parent'->'parent'->>'_id')) WHERE ((doc->'parent'->'parent')::JSONB) ? '_id';",
            "CREATE INDEX IF NOT EXISTS idx_{}_doc_ppp_id ON {} ((doc->'parent'->'parent'->'parent'->>'_id')) WHERE ((doc->'parent'->'parent'->'parent')::JSONB) ? '_id';",
            "CREATE INDEX IF NOT EXISTS idx_{}_doc_pppp_id ON {} ((doc->'parent'->'parent'->'parent'->'parent'->>'_id')) WHERE ((doc->'parent'->'parent'->'parent'->'parent')::JSONB) ? '_id';",
            "CREATE INDEX IF NOT EXISTS idx_{}_doc_ppppp_id ON {} ((doc->'parent'->'parent'->'parent'->'parent'->'parent'->>'_id')) WHERE ((doc->'parent'->'parent'->'parent'->'parent'->'parent')::JSONB) ? '_id';",
            "CREATE INDEX IF NOT EXISTS idx_{}_doc_pppppp_id ON {} ((doc->'parent'->'parent'->'parent'->'parent'->'parent'->'parent'->>'_id')) WHERE ((doc->'parent'->'parent'->'parent'->'parent'->'parent'->'parent')::JSONB) ? '_id';",
            "CREATE INDEX IF NOT EXISTS idx_{}_doc_ppppppp_id ON {} ((doc->'parent'->'parent'->'parent'->'parent'->'parent'->'parent'->'parent'->>'_id')) WHERE ((doc->'parent'->'parent'->'parent'->'parent'->'parent'->'parent'->'parent')::JSONB) ? '_id';",
            "CREATE INDEX IF NOT EXISTS idx_{}_doc_pppppppp_id ON {} ((doc->'parent'->'parent'->'parent'->'parent'->'parent'->'parent'->'parent'->'parent'->>'_id')) WHERE ((doc->'parent'->'parent'->'parent'->'parent'->'parent'->'parent'->'parent'->'parent')::JSONB) ? '_id';"
        ]

        for ldb in local_db_names:
            db_name = SQLUtils.validate_identifier(f"{safe_name}_{ldb}")

            for query in queries:
                sql_str = query.format(safe_name, db_name)
                if sql_str.strip():
                    session.execute(text(sql_str))

    @staticmethod
    def convert_sql_yaml_metadata_to_json(sql_path: Path, overwrite: bool = True) -> Optional[Path]:
        """
        Extract YAML metadata from SQL file comments and convert to JSON.
        Saves <filename>.meta.json in the same directory.

        Returns:
            Path to generated JSON file if successful.
            None if no YAML metadata found.
        """

        if not sql_path.exists():
            raise FileNotFoundError(f"SQL file not found: {sql_path}")

        raw_yaml_lines = []

        with sql_path.open("r", encoding="utf-8") as f:
            for raw_line in f:
                stripped = raw_line.strip()

                if stripped.startswith("--"):
                    # Remove leading "--" and optional space
                    content = stripped[2:].lstrip()
                    raw_yaml_lines.append(content)
                else:
                    # Stop at first non-comment line
                    break

        if not raw_yaml_lines:
            return None

        yaml_str = "\n".join(raw_yaml_lines).strip()

        try:
            metadata = yaml.safe_load(yaml_str)
        except yaml.YAMLError as e:
            raise SQLMetadataConversionError(f"Invalid YAML in {sql_path.name}: {e}")

        if not isinstance(metadata, dict):
            raise SQLMetadataConversionError(f"Top-level YAML must be a mapping in {sql_path.name}")

        # Output path: same folder
        json_path = sql_path.with_suffix(".meta.json")

        try:
            json_path.write_text(json.dumps(metadata, indent=2, ensure_ascii=False),encoding="utf-8")
        except Exception as e:
            raise SQLMetadataConversionError(f"Failed writing JSON file {json_path.name}: {e}")

        
        return json_path if json_path.exists() and not overwrite else None
    
    @staticmethod
    def convert_all_sql_metadata(project_name: str):
        sql_files = SQLUtils.get_sql_files(project_name)
        for sql_file in sql_files:
            try:
                result = SQLUtils.convert_sql_yaml_metadata_to_json(sql_file)
                if result:
                    print(f"✔ Converted: {sql_file.name}")
            except Exception as e:
                print(f"✖ Error in {sql_file.name}: {e}")

    @staticmethod
    def execute_sql_safe(session: Session, sql_str: str, params: dict = None):
        try:
            session.execute(text(sql_str), params or {})
            session.commit()
        except Exception as e:
            session.rollback()
            raise SQLMetadataConversionError(f"SQL execution failed: {e}") from e

    

# ----------------------------
# SQL OBJECT
# ----------------------------
class SQLObject:
    def __init__(self, path: Path, metadata_source: MetadataSource = "sql"):
        self.path = path
        self.content = path.read_text(encoding="utf-8")

        if metadata_source == "json":
            self.name, self.type, self.depends, self.indexes, self.auto_depends = self._parse_metadata_from_json()
        else:
            self.name, self.type, self.depends, self.indexes, self.auto_depends = self._parse_metadata()

        self.sql_str = self._extract_sql_body()
        self.hash = hashlib.sha256(self.sql_str.strip().encode("utf-8")).hexdigest()

        if not self.name or not self.type:
            raise ValueError(f"{path.name} missing @name or @type")
        

    def _strip_quotes(self, value: str) -> str:
        value = value.strip()
        if (value.startswith('"') and value.endswith('"')) or \
        (value.startswith("'") and value.endswith("'")):
            return value[1:-1]
        return value

    def _parse_bool(self, value: str) -> bool:
        value = self._strip_quotes(value).lower()
        return value in {"true", "1", "yes"}

    def _parse_depends(self, value: str) -> List[str]:
        """ Supporte : ["a", 'b', c] | ("a", b, 'c') | "a", 'b', c | a, b, c """

        value = value.strip()

        # Cas liste ou tuple Python-like
        case_one = (value.startswith("[") and value.endswith("]"))
        case_two = (value.startswith("(") and value.endswith(")"))
        if case_one or case_two:
            try:
                parsed = ast.literal_eval(value)
                if isinstance(parsed, (list, tuple)):
                    return [self._strip_quotes(str(v)) for v in parsed]
            except Exception:
                pass

        # Cas simple CSV
        parts = re.split(r",\s*", value)
        return [self._strip_quotes(p) for p in parts if p.strip()]

    # ---------------------------------------------------------
    # METADATA PARSER (robuste et strict)
    # ---------------------------------------------------------

    def _parse_metadata(self) -> Tuple[str,SQLObjectType,List[str],List[Dict[str, Any]],bool]:
        """
        Parse SQL metadata headers:
            -- @name: my_object
            -- @type: table
            -- @depends: other_table
            -- @indexes:
            --   - columns: ["id"]
            --     unique: true

        Returns:
            name, type, depends, indexes, auto_depends
        """

        name = None
        obj_type = None
        depends: List[str] = []
        indexes: List[Dict[str, Any]] = []
        auto_depends = False

        lines = self.content.splitlines()
        clean_lines: List[str] = []
        i = 0

        while i < len(lines):
            line = lines[i].strip()

            if not line.startswith("-- @"):
                i += 1
                continue

            # meta_match = re.match(r"--\s*@(\w+):\s*(.*)", line)
            meta_match = re.match(r"-- @(\w+):(.*)", line)

            if not meta_match:
                clean_lines.append(lines[i])
                raise SQLMetadataError(f"Invalid metadata format in {self.path}: {line}")

            key = meta_match.group(1).strip().lower()
            value = meta_match.group(2).strip()

            # -----------------------
            # NAME
            # -----------------------
            if key == "name":
                if not value:
                    raise SQLMetadataError(f"Missing name value in {self.path}")
                name = self._strip_quotes(value)

            # -----------------------
            # TYPE
            # -----------------------
            elif key == "type":
                if not value:
                    raise SQLMetadataError(f"Missing type value in {self.path}")
                
                raw_type = self._strip_quotes(value).lower()
                try:
                    obj_type = SQLObjectType(raw_type)
                except ValueError:
                    raise ValueError(f"Invalid SQL object type: {raw_type}")

            # -----------------------
            # DEPENDS
            # -----------------------
            elif key == "depends":
                if value:
                    # depends.extend(d.strip() for d in value.split(",") if d.strip())
                    depends = self._parse_depends(value)

            # -----------------------
            # AUTO_DEPENDS
            # -----------------------
            elif key == "auto_depends":
                auto_depends = self._parse_bool(value)

            # -----------------------
            # INDEXES
            # -----------------------
            elif key == "indexes":

                yaml_lines = []
                i += 1

                while i < len(lines):
                    raw_line = lines[i]

                    # Stop si nouvelle metadata
                    if raw_line.strip().startswith("-- @"):
                        break

                    # Stop si ligne SQL
                    if not raw_line.strip().startswith("--"):
                        break

                    # Nettoyage
                    # clean_line = re.sub(r"^--\s?", "", raw_line.rstrip())
                    # clean_line = re.sub(r"^--\s*", "", raw_line.rstrip())
                    # clean_line = raw_line.split("--", 1)[1].lstrip()

                    if raw_line.startswith("-- "):
                        clean_line = raw_line[3:]   # retire exactement "-- "
                    elif raw_line.startswith("--"):
                        clean_line = raw_line[2:]   # fallback
                    else:
                        continue


                    yaml_lines.append(clean_line)
                    i += 1

                yaml_text = "\n".join(yaml_lines)

                yaml_text = textwrap.dedent(yaml_text).strip()

                try:
                    raw_indexes = yaml.safe_load(yaml_text)
                except yaml.YAMLError as e:
                    raise SQLMetadataError(
                        f"Invalid YAML in indexes block ({self.path}).\n\n"
                        f"YAML received:\n{yaml_text}\n\nError: {e}"
                    )

                indexes = self._normalize_indexes(raw_indexes)
                continue

            i += 1

        if not name:
            raise SQLMetadataError(f"Missing @name in {self.path}")

        if not obj_type:
            raise SQLMetadataError(f"Missing @type in {self.path}")

        return name, obj_type, depends, indexes, auto_depends

    def _parse_metadata_from_json(self):
        meta_path = self.path.with_suffix(".meta.json")

        if not meta_path.exists():
            raise SQLMetadataError(f"Missing metadata JSON file for {self.path.name}")

        try:
            meta = json.loads(meta_path.read_text(encoding="utf-8"))
        except Exception as e:
            raise SQLMetadataError(f"Invalid JSON metadata in {meta_path}: {e}")

        name = meta.get("name")
        obj_type_raw = meta.get("type")

        if not name or not obj_type_raw:
            raise SQLMetadataError(f"Metadata JSON missing name or type: {meta_path}")

        try:
            obj_type = SQLObjectType(obj_type_raw)
        except ValueError:
            raise SQLMetadataError(f"Invalid type in metadata JSON: {obj_type_raw}")

        depends = meta.get("depends", [])
        auto_depends = bool(meta.get("auto_depends", False))
        indexes = self._normalize_indexes(meta.get("indexes", []))

        return name, obj_type, depends, indexes, auto_depends

    # --------------------------------------------------
    # NORMALISATION DES INDEXES
    # --------------------------------------------------
    # def _normalize_indexes(self, raw_indexes: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    #     """
    #     Supporte tous les formats possibles :
    #     - id
    #     - (a,b)
    #     - [a,b]
    #     - "a","b"
    #     - a,b
    #     """

    #     normalized = []

    #     for idx in raw_indexes:
    #         cols = idx.get("columns")

    #         if isinstance(cols, str):
    #             cols = cols.strip()
    #             # (a,b) ou ['a','b'] ou "a", 'b'
    #             if cols.startswith("(") and cols.endswith(")"):
    #                 cols = [c.strip().strip("'\"") for c in cols[1:-1].split(",")]

    #             elif cols.startswith("[") and cols.endswith("]"):
    #                 # Convertir [a,b] ou ["a","b"] en liste
    #                 try:
    #                     # cols_list = eval(cols)
    #                     cols_list = ast.literal_eval(cols)
    #                     if isinstance(cols_list, list):
    #                         cols = [str(c) for c in cols_list]
    #                     else:
    #                         cols = [cols]
    #                 except Exception:
    #                     cols = [cols]

    #             else:
    #                 # colonnes simples séparées par virgule
    #                 cols = [c.strip() for c in cols.split(",") if c.strip()]

    #         elif isinstance(cols, list):
    #             cols = [str(c) for c in cols]

    #         else:
    #             cols = []

    #         cols = [str(c).strip().strip("'\"") for c in cols if str(c).strip()]

    #         normalized.append({
    #             "columns": cols,
    #             "unique": bool(idx.get("unique", False)),
    #             "method": idx.get("method"),
    #             "where": idx.get("where")
    #         })

    #     return normalized
    
    def _normalize_indexes(self, raw_indexes: Any) -> List[Dict[str, Any]]:
        """
        Normalize and validate index definitions.
        """

        if not raw_indexes:
            return []

        if not isinstance(raw_indexes, list):
            raise SQLMetadataError("Indexes metadata must be a list")

        normalized = []

        for idx in raw_indexes:
            if not isinstance(idx, dict):
                raise SQLMetadataError("Each index must be a dictionary")

            columns = idx.get("columns")
            if not columns or not isinstance(columns, list):
                raise SQLMetadataError(
                    f"Index missing valid 'columns' field: {idx}"
                )

            if not all(isinstance(c, str) and c.strip() for c in columns):
                raise SQLMetadataError(
                    f"Invalid column names in index: {idx}"
                )

            normalized_index = {
                "columns": columns,
                "unique": bool(idx.get("unique", False)),
                "method": idx.get("method", "btree"),
                "where": idx.get("where"),
                "concurrently": bool(idx.get("concurrently", False)),
            }

            normalized.append(normalized_index)

        return normalized
    
    # --------------------------------------------------
    # SQL EXTRACTION
    # --------------------------------------------------
    def _extract_sql_body(self) -> str:
        return "\n".join(line for line in self.content.splitlines() if not line.strip().startswith("-- @"))

    

    def parse_sql_file(self) -> Tuple[str, Dict]:
        """
        Lit un fichier SQL et retourne le SQL pur + metadata.
        Supporte YAML-style comments pour metadata.
        """
        metadata = {}
        sql_lines = []

        with open(self.path, "r", encoding="utf-8") as f:
            lines = f.readlines()

        meta_lines = []
        in_meta = True
        for line in lines:
            if in_meta and line.strip().startswith("--"):
                meta_lines.append(line[2:].strip())
            else:
                in_meta = False
                sql_lines.append(line)

        # Parse YAML from comments
        if meta_lines:
            try:
                meta_yaml = "\n".join(meta_lines)
                metadata = yaml.safe_load(meta_yaml) or {}
            except Exception:
                metadata = {}

        sql_str = "".join(sql_lines).strip()
        return sql_str, metadata

    def parse_sql_file_version2(self) -> Tuple[str, Dict[str, Any]]:
        """
        Parse un fichier SQL contenant des métadonnées @ directives.

        Retourne:
            clean_sql: SQL sans les directives @
            metadata: dict contenant name, type, depends, indexes
        """

        metadata: Dict[str, Any] = {
            "name": None,
            "type": None,
            "depends": [],
            "indexes": []
        }

        lines = self.content.splitlines()
        clean_lines = []

        i = 0
        while i < len(lines):
            line = lines[i].strip()

            # ---------- SINGLE LINE METADATA ----------
            meta_match = re.match(r"--\s*@(\w+):\s*(.*)", line)
            if meta_match:
                key, value = meta_match.groups()

                if key == "depends":
                    metadata["depends"] = [
                        v.strip() for v in value.split(",") if v.strip()
                    ]

                elif key == "indexes":
                    # Collect YAML block
                    yaml_lines = []
                    i += 1
                    while i < len(lines) and lines[i].strip().startswith("--"):
                        yaml_lines.append(
                            lines[i].replace("--", "", 1).rstrip()
                        )
                        i += 1

                    yaml_text = "\n".join(yaml_lines).strip()
                    metadata["indexes"] = yaml.safe_load(yaml_text) or []
                    continue

                else:
                    metadata[key] = value.strip()

                i += 1
                continue

            # ---------- NORMAL SQL LINE ----------
            clean_lines.append(lines[i])
            i += 1

        clean_sql_str = "\n".join(clean_lines).strip()

        return clean_sql_str, metadata

    def _meta(self, key):
        pattern = rf"--\s*@{key}:\s*(.*)"
        match = re.search(pattern, self.content)
        if not match:
            return None
        value = match.group(1).strip()
        if key == "depends":
            return [v.strip() for v in value.split(",") if v.strip()]
        return value

    def _extract_indexes(self):
        pattern = r"--\s*@indexes:\s*\n((?:--\s+.*\n)+)"
        match = re.search(pattern, self.content)
        if not match:
            return []

        raw_block = match.group(1)
        yaml_block = "\n".join(
            line.replace("--", "", 1).strip()
            for line in raw_block.splitlines()
        )

        return yaml.safe_load(yaml_block) or []

    # ----------------------------
    # Convert SQLObject metadata → JSON/dict
    # ----------------------------
    @staticmethod
    def sql_metadata_to_json(obj: "SQLObject") -> Dict[str, Any]:
        """
        Convertit un SQLObject en dictionnaire JSON-compatible
        """
        return {
            "name": obj.name,
            "type": obj.type.value if obj.type else "",
            "depends": obj.depends,
            "auto_depends": obj.auto_depends,
            "indexes": obj.indexes,
            "hash": obj.hash
        }


    # ----------------------------
    # Convert JSON/dict → SQL metadata block
    # ----------------------------
    @staticmethod
    def json_to_sql_metadata(meta: Dict[str, Any], use_yaml_method:bool=False) -> str:
        """
        Génère un bloc de commentaires SQL @ directives à partir d'un dict,
        avec format des colonnes d'index compatible (_parse_metadata).
        - Si une seule colonne : col
        - Si plusieurs colonnes : (col1, col2)
        - Garde unique, method, where
        """
        lines: List[str] = []

        if "name" in meta and meta["name"]:
            lines.append(f"-- @name: {meta['name']}")

        if "type" in meta and meta["type"]:
            # lines.append(f"-- @type: {meta['type']}")
            lines.append(f"-- @type: {meta['type'].value if isinstance(meta['type'], SQLObjectType) else meta['type']}")


        if "depends" in meta and meta["depends"]:
            lines.append(f"-- @depends: {', '.join(meta['depends'])}")

        if "auto_depends" in meta and meta["auto_depends"]:
            val = "true" if meta["auto_depends"] else "false"
            lines.append(f"-- @auto_depends: {val}")

        if "indexes" in meta and meta["indexes"]:
            lines.append("-- @indexes:")

            if use_yaml_method:
                # Convert indexes dict/list en YAML
                yaml_text = yaml.safe_dump(meta["indexes"], sort_keys=False)
                # Ajouter des -- devant chaque ligne pour garder le format SQL
                for line in yaml_text.splitlines():
                    lines.append(f"-- {line}")

            else:                
                for idx in meta["indexes"]:
                    # Build columns string
                    cols = idx.get("columns")

                    if isinstance(cols, list):
                        if len(cols) == 1:
                            col_str = str(cols[0])
                        else:
                            col_str = f"({', '.join(str(c) for c in cols)})"
                    else:
                        col_str = str(cols)

                    lines.append(f"--   - columns: {col_str}")

                    # Optional fields
                    if idx.get("unique") is not None:
                        lines.append(f"--     unique: {str(idx.get('unique')).lower()}")

                    if idx.get("method"):
                        lines.append(f"--     method: {idx['method']}")

                    if idx.get("where"):
                        lines.append(f"--     where: {idx['where']}")

        return "\n".join(lines)

# ----------------------------
# APPLY / DROP / REFRESH / REBUILD /SQL MIGRATOR
# ----------------------------
class SQLMigrator:
    def __init__(self, project_name:str):
        self.project_name = project_name

    def close(self):
        pass


    # ----------------------------
    # EXECUTION ORDONNEE | APPLY
    # ----------------------------
    @with_app_context
    def apply_objects(self, objects: List[SQLObject], refresh_concurrently: bool=False, app:Flask=None):
        """
        Applique tous les objets SQL dans l'ordre topologique.
        - 1 objet = 1 transaction
        - commit explicite
        - rollback en cas d’erreur
        - refresh des matviews hors transaction
        """

        with Session(db.engine) as session:

            try:
                SQLUtils.create_project_indexes(session, self.project_name, app=app)
                session.commit()
            except Exception as e:
                session.rollback()
                logger.warning(f"⚠ Failed to create project indexes (will retry later): {e}")

            # Assure la table de migrations
            logger.info(f"{session.execute(text("SELECT current_database()")).scalar()}\n")

            # ----------------------------
            # Ensure migration table
            # ----------------------------
            try:
                SQLUtils.ensure_migration_table(session, self.project_name, app=app)
                session.commit()
            except Exception as e:
                session.rollback()
                logger.error(f"❌ Failed to ensure migration table: {e}")
                raise SQLMetadataConversionError(f"Failed to apply SQL object {obj.name}") from e

            ordered = SQLUtils.topo_sort(objects)

            for obj in ordered:
                try:
                    if SQLUtils.is_up_to_date(session, obj, self.project_name, app=app):
                        logger.info(f"✓ {obj.name} up to date")
                        continue

                    if not obj.sql_str or not obj.sql_str.strip():
                        continue

                    logger.info(f"Applying {obj.name} ({obj.type.value}) ...")

                    # --- EXECUTE OBJECT ---
                    session.execute(text(obj.sql_str))

                    # --- CREATE INDEXES ---
                    if obj.type in {SQLObjectType.TABLE,SQLObjectType.VIEW,SQLObjectType.MATVIEW}:
                        view_index_sql = SQLUtils.create_indexes(session, obj, self.project_name, app=app)
                        
                        if view_index_sql and len(view_index_sql) > 0:
                            logger.info(f"Index Créé avec sucess: \n{f"{', '.join(view_index_sql)}"}")
                        else:
                            logger.info(f"No index create for : {f"{obj.name}"}")
                    
                    # --- RECORD MIGRATION ---
                    SQLUtils.record_migration(session, obj, self.project_name, app=app)

                    # --- COMMIT OBJECT ---
                    session.commit()
                    logger.info(f"✅ Committed {obj.name}\n")

                except Exception as e:
                    session.rollback()
                    logger.error(f"❌ Failed {obj.name} — rolled back. Error: {e}")
                    raise SQLMetadataConversionError(f"Failed to apply SQL object {obj.name}") from e


            # --- Phase 2 : refresh matviews (hors transaction pour CONCURRENTLY) ---
            for obj in ordered:
                if obj.type == SQLObjectType.MATVIEW:
                    try:
                        concurrent = " CONCURRENTLY" if refresh_concurrently else ""
                        safe_name = SQLUtils.validate_identifier(obj.name)

                        session.execute(text(f"REFRESH MATERIALIZED VIEW{concurrent} {safe_name}"))

                        session.commit()
                        logger.info(f"🔄 Refreshed matview {obj.name}")

                    except Exception as e:
                        session.rollback()
                        logger.error(f"❌ Failed to refresh matview {obj.name}: {e}")
                        raise SQLMetadataConversionError(f"Failed to apply SQL object {obj.name}") from e

    # ----------------------------
    # DROP
    # ----------------------------
    @with_app_context
    def drop_objects(self, objects: List[SQLObject], app:Flask=None):
        """Supprime tous les objets SQL dans l'ordre inverse, cascade et supprime de migrations."""
        ordered = list(reversed(SQLUtils.topo_sort(objects)))

        with Session(db.engine) as session:
            for obj in ordered:
                try:
                    safe_name = SQLUtils.validate_identifier(obj.name)
                    type_name = obj.type.value if obj.type else None

                    logger.info(f"Dropping {type_name} {safe_name} ...")

                    sql_map = {
                        SQLObjectType.TABLE: "DROP TABLE IF EXISTS {}",
                        SQLObjectType.VIEW: "DROP VIEW IF EXISTS {}",
                        SQLObjectType.MATVIEW: "DROP MATERIALIZED VIEW IF EXISTS {}",
                        SQLObjectType.FUNCTION: "DROP FUNCTION IF EXISTS {}",
                    }
                    
                    # if obj.type == SQLObjectType.TABLE:
                    #     sql_str = f"DROP TABLE IF EXISTS {safe_name} CASCADE"
                    # elif obj.type == SQLObjectType.VIEW:
                    #     sql_str = f"DROP VIEW IF EXISTS {safe_name} CASCADE"
                    # elif obj.type == SQLObjectType.MATVIEW:
                    #     sql_str = f"DROP MATERIALIZED VIEW IF EXISTS {safe_name} CASCADE"
                    # elif obj.type == SQLObjectType.FUNCTION:
                    #     sql_str = f"DROP FUNCTION IF EXISTS {safe_name} CASCADE"
                    #     # sql_str = f"DROP FUNCTION {safe_name} CASCADE"

                    # if not sql_str:
                    #     continue

                    template = sql_map.get(obj.type)

                    if not template:
                        continue

                    # 🔥 PAS DE CASCADE
                    session.execute(text(template.format(safe_name)))

                    SQLUtils.remove_migration(session, obj, self.project_name, app=app)  # supprime de schema_migrations

                    session.commit()
                    logger.info(f"✅ Dropped {safe_name}")

                except Exception as e:
                    session.rollback()
                    logger.error(f"❌ Failed to drop {safe_name}: {e}")
                    raise

    @with_app_context
    def drop_one_object(self, obj: SQLObject, app: Flask = None):
        """
        Drop un seul objet avec CASCADE
        et nettoie toutes les migrations associées aux objets supprimés.
        """

        with Session(db.engine) as session:

            try:
                safe_name = SQLUtils.validate_identifier(obj.name)

                logger.info(f"Dropping {obj.type.value} {safe_name} with CASCADE ...")

                # -----------------------------
                # 1️⃣ Récupérer dépendances AVANT DROP
                # -----------------------------
                dependencies = session.execute(text("""
                    SELECT DISTINCT c.relname
                    FROM pg_depend d
                    JOIN pg_class c ON d.objid = c.oid
                    JOIN pg_class parent ON d.refobjid = parent.oid
                    WHERE parent.relname = :name
                    AND c.relkind IN ('v', 'm', 'r', 'f')
                """), {"name": obj.name}).fetchall()

                dependent_names = {row[0] for row in dependencies}
                dependent_names.add(obj.name)  # inclure lui-même

                # -----------------------------
                # 2️⃣ DROP CASCADE
                # -----------------------------
                drop_map = {
                    SQLObjectType.TABLE: "DROP TABLE IF EXISTS {} CASCADE",
                    SQLObjectType.VIEW: "DROP VIEW IF EXISTS {} CASCADE",
                    SQLObjectType.MATVIEW: "DROP MATERIALIZED VIEW IF EXISTS {} CASCADE",
                    SQLObjectType.FUNCTION: "DROP FUNCTION IF EXISTS {} CASCADE",
                }

                template = drop_map.get(obj.type)

                if not template:
                    raise ValueError(f"Unsupported object type {obj.type}")
                
                # query = text(template.format(safe_name))
                query = sql.SQL(template).format(sql.Identifier(obj.name))
                session.execute(query)

                # -----------------------------
                # 3️⃣ Nettoyer schema_migrations
                # -----------------------------
                schema_name = SQLUtils.migrations_shema_name(self.project_name)

                session.execute(
                    text(f"DELETE FROM {schema_name} WHERE name = ANY(:names)"), 
                    {"names": list(dependent_names)}
                )

                session.commit()

                logger.info(
                    f"✅ Dropped {safe_name} and cleaned migrations: "
                    f"{', '.join(dependent_names)}"
                )

            except Exception as e:
                session.rollback()
                logger.error(f"❌ Failed to drop {obj.name}: {e}")
                raise

    # ----------------------------
    # FORCE REFRESH
    # ----------------------------
    @with_app_context
    def force_refresh(self, objects: List[SQLObject], concurrently: bool=False, app:Flask=None):
        """
        Force le refresh des materialized views.
        Chaque refresh = transaction séparée.
        """
        with Session(db.engine) as session:
            for obj in objects:
                if obj.type != SQLObjectType.MATVIEW:
                    continue

                safe_name = SQLUtils.validate_identifier(obj.name)
                concurrent = " CONCURRENTLY" if concurrently else ""

                try:
                    session.execute(text(f"REFRESH MATERIALIZED VIEW{concurrent} {safe_name}"))

                    session.commit()
                    logger.info(f"🔄 Matview {obj.name} refreshed successfully")

                except Exception as e:
                    session.rollback()
                    logger.error(f"❌ Failed to refresh matview {obj.name}: {e}")
                    raise

    # ----------------------------
    # REBUILD ALL
    # ----------------------------
    def rebuild_all(self, objects: List[SQLObject], refresh_concurrently=False, app:Flask=None):
        """Supprime et recrée tous les objets SQL."""
        logger.info("Dropping all objects...")
        self.drop_objects(objects, app=app)
        logger.info("Re-applying all objects...")
        self.apply_objects(objects, refresh_concurrently, app=app)


# ----------------------------
# SQL STARTER
# ----------------------------
class SQLStarter:
    def __init__(self, project_name: str, app: Flask, metadata_source: MetadataSource = "sql"):
        self.sql_objects = SQLUtils.load_sql_objects(project_name,metadata_source=metadata_source)
        self.migrator = SQLMigrator(project_name)
        self.app = app

    def run(self, action:Literal['init','refresh','rebuild']):
        try:
            if action in ['init','refresh','rebuild']:
                if action == "init":
                    self.migrator.apply_objects(self.sql_objects, refresh_concurrently=True, app=self.app)
                if action == "refresh":
                    self.migrator.force_refresh(self.sql_objects, concurrently=True, app=self.app)
                if action == "rebuild":
                    self.migrator.rebuild_all(self.sql_objects, refresh_concurrently=True, app=self.app)
                logger.info("✅ All migrations applied successfully")
            else:
                logger.error("❌ No supported action")
                raise
        except Exception as e:
            logger.error(f"❌ Migration failed: {str(e)}")
            raise
        finally:
            self.migrator.close()


# ----------------------------
# MAIN
# ----------------------------
if __name__ == "__main__":
    pass

    # starter = SQLStarter(project_name="kendeya")
    # starter.run("init")

    # import argparse
    # parser = argparse.ArgumentParser()
    # parser.add_argument("action", choices=["init","refresh","rebuild"])
    # parser.add_argument("--metadata-source",choices=["sql", "json"],default="sql")

    # starter = SQLStarter(
    #     project_name="kendeya",
    #     app=app,
    #     metadata_source=args.metadata_source
    # )

    # args = parser.parse_args()
    # starter = SQLStarter()
    # starter.run(args.action)

    # python migrate.py init
    # python migrate.py refresh
    # python migrate.py rebuild

