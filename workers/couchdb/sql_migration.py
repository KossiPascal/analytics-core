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
from psycopg2 import sql
from backend.src.app.configs.environment import Config
from typing import List, Dict, Any, Literal, Set, Tuple, Optional
from backend.src.app.configs.extensions import db
from sqlalchemy.orm import Session
from dataclasses import dataclass, field

from backend.src.app.models.x_worker import CHT_SOURCE_TYPES
from workers.couchdb.utils import with_app_context
from workers.logger import get_workers_logger
logger = get_workers_logger(__name__)
from enum import Enum

class SQLObjectType(str, Enum):
    TABLE = "table"
    FUNCTION = "function"
    VIEW = "view"
    MATVIEW = "matview"
    INDEX = "index"

# CONFIGURATION
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


@dataclass(slots=True)
class Index:
    columns: List[str]
    unique: bool = False
    method: Optional[str] = None
    where: Optional[str] = None
    concurrently: bool = False

    def to_dict(self) -> Dict[str, Any]:
        return {
            "columns": self.columns,
            "unique": self.unique,
            "method": self.method,
            "where": self.where,
            "concurrently": self.concurrently,
        }


@dataclass(slots=True)
class SqlMetadata:
    name: str
    type: SQLObjectType
    depends: List[str] = field(default_factory=list)
    auto_depends: bool = False
    indexes: List[Index] = field(default_factory=list)

    @classmethod
    def from_dict(cls, data: dict) -> "SqlMetadata":
        return cls(
            name=data["name"],
            type=SQLObjectType(data["type"]),
            depends=data.get("depends", []),
            auto_depends=data.get("auto_depends", False),
            indexes=[
                Index(**idx)
                for idx in data.get("indexes", [])
            ],
        )

    def to_dict(self) -> Dict[str, Any]:
        return {
            "name": self.name,
            "type": self.type.value,  # Enum -> str
            "depends": list(self.depends),
            "auto_depends": self.auto_depends,
            "indexes": [index.to_dict() for index in self.indexes],
        }



# CREATE MATERIALIZED VIEW IF NOT EXISTS patient_view WITH NO DATA AS ...
class DependencyError(Exception):
    """Base class for all dependency-related errors."""

    def __init__(self, message: str | None = None):
        super().__init__(message or "A dependency error occurred.")


class CircularDependencyError(DependencyError):
    """Raised when a circular dependency is detected."""

    def __init__(self, cycle: list[str] | None = None):
        if cycle:
            message = f"Circular dependency detected: {' -> '.join(cycle)}."
        else:
            message = "A circular dependency was detected."
        super().__init__(message)


class MissingDependencyError(DependencyError):
    """Raised when a required dependency is missing."""

    def __init__(self, dependency_name: str | None = None):
        if dependency_name:
            message = f"Missing required dependency: '{dependency_name}'."
        else:
            message = "A required dependency is missing."
        super().__init__(message)


class SQLMetadataError(Exception):
    """Raised when SQL metadata is invalid or malformed."""

    def __init__(self, message: str | None = None):
        super().__init__(message or "Invalid or malformed SQL metadata.")


class SQLMetadataConversionError(SQLMetadataError):
    """Raised when SQL metadata conversion fails."""

    def __init__(self, message: str | None = None):
        super().__init__(message or "Failed to convert SQL metadata.")


# SQL UTILS
class SQLUtils:

    @staticmethod
    def strip_quotes(value: str) -> str:
        value = value.strip()
        if (value.startswith('"') and value.endswith('"')) or \
        (value.startswith("'") and value.endswith("'")):
            return value[1:-1]
        return value

    @staticmethod
    def parse_bool(value: str) -> bool:
        value = SQLUtils.strip_quotes(value).lower()
        if value in {"true", "1", "yes"}:
            return True
        if value in {"false", "0", "no"}:
            return False
        raise SQLMetadataConversionError(f"Invalid boolean value: {value}")

    @staticmethod
    def parse_depends(value: str) -> List[str]:
        """ Supporte : ["a", 'b', c] | ("a", b, 'c') | "a", 'b', c | a, b, c """

        value = value.strip()

        # Cas liste ou tuple Python-like
        case_one = (value.startswith("[") and value.endswith("]"))
        case_two = (value.startswith("(") and value.endswith(")"))
        if case_one or case_two:
            try:
                parsed = ast.literal_eval(value)
                if isinstance(parsed, (list, tuple)):
                    return [SQLUtils.strip_quotes(str(v)) for v in parsed]
            except Exception:
                pass

        # Cas simple CSV
        parts = re.split(r",\s*", value)
        return [SQLUtils.strip_quotes(p) for p in parts if p.strip()]

    @staticmethod
    def normalize_indexes(raw_indexes: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
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

            cols = idx.get("columns")
            if not cols:
                raise SQLMetadataError(f"Index missing valid 'columns' field: {idx}")

            if isinstance(cols, str):
                cols = cols.strip()
                # (a,b) ou ['a','b'] ou "a", 'b'
                if cols.startswith("(") and cols.endswith(")"):
                    cols = [c.strip().strip("'\"") for c in cols[1:-1].split(",")]

                elif cols.startswith("[") and cols.endswith("]"):
                    # Convertir [a,b] ou ["a","b"] en liste
                    try:
                        # cols_list = eval(cols)
                        cols_list = ast.literal_eval(cols)
                        if isinstance(cols_list, list):
                            cols = [str(c) for c in cols_list]
                        else:
                            cols = [cols]
                    except Exception:
                        cols = [cols]

                else:
                    # colonnes simples séparées par virgule
                    cols = [c.strip() for c in cols.split(",") if c.strip()]
            
            elif isinstance(cols, list):
                cols = [str(c) for c in cols]

            else:
                cols = []

            if cols and not all(isinstance(c, str) and c.strip() for c in cols):
                raise SQLMetadataError(f"Invalid column names in index: {idx}")
            
            cols = [str(c).strip().strip("'\"") for c in cols if str(c).strip()]

            normalized_index = {
                "columns": cols,
                "unique": bool(idx.get("unique", False)),
                "method": idx.get("method", "btree"),
                "where": idx.get("where"),
                "concurrently": bool(idx.get("concurrently", False)),
            }

            normalized.append(normalized_index)

        return normalized
    
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
    def build_index_sql(object_name: str, idx: Dict[str, Any], source_name:str,) -> str:
        columns = idx.get("columns") or []
        if not columns:
            return ""
        
        safe_table = SQLUtils.validate_identifier(object_name)
        safe_columns = [SQLUtils.validate_identifier(c) for c in columns]

        unique = "UNIQUE " if idx.get("unique") else ""
        method_raw = (idx.get("method") or "").lower()
        method = f" USING {method_raw}" if method_raw in METHODES else ""
        where = f" WHERE {idx['where']}" if idx.get("where") else ""

        index_name = f"{source_name}_idx_{safe_table}_{'_'.join(safe_columns)}"
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
    def get_sql_folder(source_name:str):
        source_name_raw = SQLUtils.validate_identifier(source_name)
        return Config.POSTGRESQL_DIR / source_name_raw
    
    @staticmethod
    def get_sql_files(source_name:str)-> list[Path]:
        sql_folder = SQLUtils.get_sql_folder(source_name)

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
    def migrations_shema_name(source_name:str):
        if not source_name or not isinstance(source_name, str):
            logger.info('source_name is missed ...')
            raise
        return SQLUtils.validate_identifier(f"{source_name}_schema_migrations")

    # MIGRATION TABLE
    @staticmethod
    @with_app_context
    def ensure_migration_table(session:Session, source_name:str, app:Flask=None):

        shema_name = SQLUtils.migrations_shema_name(source_name)
        session.execute(text(f"""
            CREATE TABLE IF NOT EXISTS {shema_name} (
                name TEXT PRIMARY KEY,
                hash TEXT NOT NULL,
                applied_at TIMESTAMP DEFAULT now()
            )
        """))

    @staticmethod
    @with_app_context
    def is_up_to_date(session, obj: "SQLObject", source_name:str, app:Flask=None) -> bool:
        
        shema_name = SQLUtils.migrations_shema_name(source_name)
        result = session.execute(
            text(f"SELECT hash FROM {shema_name} WHERE name = :name"), {"name": obj.sql_metadata.name}
        )
        row = result.fetchone()
        # return row is not None and row[0] == obj.hash
        if not row:
            return False
        return row[0] == obj.hash

    @staticmethod
    @with_app_context
    def record_migration(session, obj: "SQLObject", source_name:str, app:Flask=None):
        
        shema_name = SQLUtils.migrations_shema_name(source_name)
        session.execute(text(f"""
            INSERT INTO {shema_name} (name, hash)
            VALUES (:name, :hash)
            ON CONFLICT (name)
            DO UPDATE SET hash = EXCLUDED.hash, applied_at = now()
        """), {"name": obj.sql_metadata.name, "hash": obj.hash})

    @staticmethod
    @with_app_context
    def remove_migration(session, obj: "SQLObject", source_name:str, app:Flask=None):
        
        shema_name = SQLUtils.migrations_shema_name(source_name)
        session.execute(text(f"DELETE FROM {shema_name} WHERE name = :name"), {"name": obj.sql_metadata.name})

    # DEPENDENCY SORT
    @staticmethod
    def topo_sort(objects: List["SQLObject"]) -> List["SQLObject"]:
        name_map = {obj.sql_metadata.name: obj for obj in objects}
        visited: Set[str] = set()
        temp: Set[str] = set()
        stack: List[SQLObject] = []

        def visit(name: str):
            if name in temp:
                raise CircularDependencyError(temp)
            if name not in visited:
                temp.add(name)
                for dep in name_map[name].sql_metadata.depends:
                    if dep not in name_map:
                        raise MissingDependencyError(dep)
                    visit(dep)
                temp.remove(name)
                visited.add(name)
                stack.append(name_map[name])

        for obj in sorted(objects, key=lambda o: TYPE_PRIORITY.get(o.sql_metadata.type, 99)):
            visit(obj.sql_metadata.name)
            
        return stack

    # SQL OBJECT LOADING
    @staticmethod
    def load_sql_objects(source_name: str, metadata_source: MetadataSource = "sql") -> List["SQLObject"]:
        
        sql_files = SQLUtils.get_sql_files(source_name)

        objects: List[SQLObject] = []
        known_objects: Set[str] = set()

        for path in sql_files:
            obj = SQLObject(path, metadata_source=metadata_source)
            

            if not obj.sql_metadata.name:
                raise ValueError(f"Missing object name in {path}")

            if obj.sql_metadata.name in known_objects:
                raise ValueError(f"Duplicate SQL object name: {obj.sql_metadata.name}")

            known_objects.add(obj.sql_metadata.name)
            objects.append(obj)

        # Auto-detect dependencies
        for obj in objects:
            if obj.sql_metadata.auto_depends:
                obj.sql_metadata.depends = [
                    d for d in SQLUtils.extract_sql_dependencies(obj.content, list(known_objects))
                    if d and d != obj.sql_metadata.name
                ]

        return objects

    # INDEX CREATION
    @staticmethod
    @with_app_context
    def create_indexes(session: Session, obj: "SQLObject", source_name:str, app:Flask=None)-> List[str]:
        
        view_index_sql = []

        for idx in obj.sql_metadata.indexes:
            sql_str = SQLUtils.build_index_sql(obj.sql_metadata.name, idx.to_dict(), source_name)
            if not sql_str or not sql_str.strip():
                logger.error(f"CREATE INDEXES ...: {str(obj.sql_metadata.name)}")
                raise
            session.execute(text(sql_str))
            view_index_sql.append(sql_str)
        return view_index_sql

    @staticmethod
    @with_app_context
    def create_project_indexes(session: Session, source_name: str, app:Flask=None):
        safe_name = SQLUtils.validate_identifier(source_name)

        localdbs = [n["localdb"] for n in CHT_SOURCE_TYPES or []]
        
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

        for ldb in localdbs:
            db_name = SQLUtils.validate_identifier(f"{safe_name}_{ldb}")

            for query in queries:
                sql_str = query.format(safe_name, db_name)
                if sql_str.strip():
                    session.execute(text(sql_str))

    # METADATA PARSER (robuste et strict)
    @staticmethod
    def parse_metadata_from_sql_yaml(sql_path: Path) -> SqlMetadata:
        """
        Parse SQL metadata headers of the form:

            -- @name: my_object
            -- @type: view
            -- @depends: other_table, another_table
            -- @auto_depends: true
            -- @indexes:
            --   - columns: ["id"]
            --     unique: true

        And export them into <file>.meta.json
        """

        if not sql_path.exists():
            raise FileNotFoundError(f"SQL file not found: {sql_path}")

        content = sql_path.read_text(encoding="utf-8")
        lines = content.splitlines()
        clean_lines: List[str] = []

        metadata: Dict[str, Any] = {}
        depends: List[str] = []
        indexes: List[Dict[str, Any]] = []

        i = 0

        while i < len(lines):
            line = lines[i].strip()

            if not line.startswith("-- @"):
                i += 1
                continue
            
            # match = re.match(r"--\s*@(\w+):\s*(.*)", line)
            match = re.match(r"-- @(\w+):(.*)", line)
            
            if not match:
                clean_lines.append(lines[i])
                raise SQLMetadataConversionError(f"Invalid metadata format in {sql_path.name}: {line}")

            key = match.group(1).strip().lower()
            value = match.group(2).strip()

            # NAME
            if key == "name":
                if not value:
                    raise SQLMetadataConversionError(f"Missing value for @name in {sql_path.name}")
                
                metadata["name"] = SQLUtils.strip_quotes(value)

            # TYPE
            if key == "type":
                if not value:
                    raise SQLMetadataConversionError(f"Missing value for @type in {sql_path.name}")

                try:
                    obj_type_str = SQLUtils.strip_quotes(value).lower()
                    metadata["type"] = obj_type_str
                    obj_type = SQLObjectType(obj_type_str)
                except ValueError:
                    raise SQLMetadataError(f"Invalid type in metadata JSON: {obj_type_str}")
                
            # DEPENDS
            elif key == "depends":
                if value:
                    # depends = [d.strip() for d in value.split(",") if d.strip()]
                    depends = SQLUtils.parse_depends(value)
                    if not isinstance(depends, list) or not all(isinstance(d, str) for d in depends):
                        raise SQLMetadataError(f"'depends' must be a list of strings in {sql_path.name}")
                    metadata["depends"] = depends

            # AUTO_DEPENDS
            elif key == "auto_depends":
                metadata["auto_depends"] = SQLUtils.parse_bool(value)
                metadata.setdefault("auto_depends", False)

            # INDEXES BLOCK (YAML)
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
                        clean = raw_line[3:]   # retire exactement "-- "
                    elif raw_line.startswith("--"):
                        clean = raw_line[2:]   # fallback
                    else:
                        continue

                    yaml_lines.append(clean)
                    i += 1

                yaml_text = "\n".join(yaml_lines)
                text_wraped = textwrap.dedent(yaml_text).strip()

                try:
                    raw_indexes = yaml.safe_load(text_wraped) or []
                except yaml.YAMLError as e:
                    raise SQLMetadataConversionError(
                        f"Invalid YAML in @indexes block of {sql_path.name}:\n\n"
                        f"YAML received:\n{text_wraped}\n\nError: {e}"
                    )

                if not isinstance(raw_indexes, list):
                    raise SQLMetadataConversionError(f"@indexes must be a YAML list in {sql_path.name}")

                indexes = SQLUtils.normalize_indexes(raw_indexes)
                if not isinstance(indexes, list):
                    raise SQLMetadataError(f"'indexes' normalization returned invalid type in {sql_path.name}")
                
                metadata["indexes"] = indexes

                continue

            i += 1

        if "name" not in metadata:
            raise SQLMetadataConversionError(f"Missing @name in {sql_path.name}")

        if "type" not in metadata:
            raise SQLMetadataConversionError(f"Missing @type in {sql_path.name}")


        return SqlMetadata.from_dict(metadata)

    @staticmethod
    def parse_metadata_from_json_file(sql_path: Path) -> SqlMetadata:
        meta_path = sql_path.with_suffix(".meta.json")

        if not meta_path.exists():
            raise SQLMetadataError(f"Missing metadata JSON file for {sql_path.name}")

        try:
            meta = json.loads(meta_path.read_text(encoding="utf-8"))
        except Exception as e:
            raise SQLMetadataError(f"Invalid JSON metadata in {meta_path}: {e}") from e

        if not isinstance(meta, dict):
            raise SQLMetadataError(f"Metadata JSON must be an object: {meta_path}")
        
        metadata: Dict[str, Any] = {}
        

        name = meta.get("name")
        if not isinstance(name, str) or not name.strip():
            raise SQLMetadataError(f"Metadata JSON missing or invalid 'name': {meta_path}")
        
        try:
            obj_type_str = meta.get("type")
            obj_type = SQLObjectType(obj_type_str)
        except ValueError:
            raise SQLMetadataError(f"Invalid type in metadata JSON: {obj_type_str}")


        depends = meta.get("depends", [])
        if not isinstance(depends, list) or not all(isinstance(d, str) for d in depends):
            raise SQLMetadataError(f"'depends' must be a list of strings in {meta_path}")
        
        auto_depends = bool(meta.get("auto_depends", False))

        raw_indexes = meta.get("indexes", [])
        indexes = SQLUtils.normalize_indexes(raw_indexes)

        if not isinstance(indexes, list):
            raise SQLMetadataError(f"'indexes' normalization returned invalid type in {meta_path}")
    
        
        metadata["name"] = name
        metadata["type"] = obj_type_str
        metadata["depends"] = depends
        metadata["auto_depends"] = auto_depends
        metadata["indexes"] = indexes

        return SqlMetadata.from_dict(metadata)

    
    @staticmethod
    def convert_sql_yaml_metadata_to_json(sql_path: Path,overwrite: bool = True,) -> Optional[Path]:
        """
        Parse SQL metadata headers of the form:

            -- @name: my_object
            -- @type: view
            -- @depends: other_table, another_table
            -- @auto_depends: true
            -- @indexes:
            --   - columns: ["id"]
            --     unique: true

        And export them into <file>.meta.json
        """
        parse_obj = SQLUtils.parse_metadata_from_sql_yaml(sql_path)

        metadata: Dict[str, Any] = parse_obj.to_dict()

        json_path = sql_path.with_suffix(".meta.json")

        if json_path.exists() and not overwrite:
            return json_path

        json_path.write_text(
            json.dumps(metadata, indent=2, ensure_ascii=False),
            encoding="utf-8",
        )

        return json_path
    
    
    @staticmethod
    def convert_all_sql_metadata(source_name: str):
        sql_files = SQLUtils.get_sql_files(source_name)
        for sql_file in sql_files:
            try:
                result = SQLUtils.convert_sql_yaml_metadata_to_json(sql_file)
                if result:
                    print(f"✔ Converted: {sql_file.name}")
            except Exception as e:
                print(f"✖ Error in {sql_file.name}: {e}")


    @staticmethod
    def delete_all_meta_json(source_name: str,dry_run: bool = False,verbose: bool = True) -> int:
        """
        Delete all `.meta.json` files associated with SQL files
        for the given project.

        Args:
            source_name: Name of the project.
            dry_run: If True, only lists files that would be deleted.
            verbose: If True, prints deletion status.

        Returns:
            Number of deleted (or detected in dry_run) files.
        """

        sql_files = SQLUtils.get_sql_files(source_name)
        deleted_count = 0

        for sql_file in sql_files:
            meta_path = sql_file.with_suffix(".meta.json")

            if not meta_path.exists():
                continue

            if dry_run:
                if verbose:
                    print(f"[DRY RUN] Would delete: {meta_path.name}")
                deleted_count += 1
                continue

            try:
                meta_path.unlink()
                deleted_count += 1
                if verbose:
                    print(f"🗑 Deleted: {meta_path.name}")
            except OSError as e:
                print(f"✖ Failed to delete {meta_path.name}: {e}")

        return deleted_count
    

    @staticmethod
    def delete_all_meta_json_in_directory(directory: Path,dry_run: bool = False,verbose: bool = True) -> int:
        count = 0

        for meta_file in directory.rglob("*.meta.json"):
            if dry_run:
                if verbose:
                    print(f"[DRY RUN] Would delete: {meta_file}")
                count += 1
                continue

            try:
                meta_file.unlink()
                count += 1
                if verbose:
                    print(f"🗑 Deleted: {meta_file}")
            except OSError as e:
                print(f"✖ Failed to delete {meta_file.name}: {e}")

        return count


    @staticmethod
    def execute_sql_safe(session: Session, sql_str: str, params: dict = None):
        try:
            session.execute(text(sql_str), params or {})
            session.commit()
        except Exception as e:
            session.rollback()
            raise SQLMetadataConversionError(f"SQL execution failed: {e}") from e

    
# SQL OBJECT
class SQLObject:
    def __init__(self, path: Path, metadata_source: MetadataSource = "sql"):
        self.path = path
        self.content = path.read_text(encoding="utf-8")

        if metadata_source == "json":
            self.sql_metadata = SQLUtils.parse_metadata_from_json_file(self.path)
        else:
            self.sql_metadata = SQLUtils.parse_metadata_from_sql_yaml(self.path)

        self.sql_str = self._extract_sql_body()
        self.hash = hashlib.sha256(self.sql_str.strip().encode("utf-8")).hexdigest()

        if not self.sql_metadata.name or not self.sql_metadata.type:
            raise ValueError(f"{path.name} missing @name or @type")


    # SQL EXTRACTION
    def _extract_sql_body(self) -> str:
        return "\n".join(line for line in self.content.splitlines() if not line.strip().startswith("-- @"))

    def _parse_sql_file(self) -> Tuple[str, Dict]:
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


    # Convert SQLObject metadata → JSON/dict
    @staticmethod
    def sql_metadata_to_json(obj: "SQLObject") -> Dict[str, Any]:
        """
        Convertit un SQLObject en dictionnaire JSON-compatible
        """
        
        return {
            "name": obj.sql_metadata.name,
            "type": obj.sql_metadata.type.value if obj.sql_metadata.type else "",
            "depends": obj.sql_metadata.depends,
            "auto_depends": obj.sql_metadata.auto_depends,
            "indexes": obj.sql_metadata.indexes,
            "hash": obj.hash
        }


    # Convert JSON/dict → SQL metadata block
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


# APPLY / DROP / REFRESH / REBUILD /SQL MIGRATOR
class SQLMigrator:
    def __init__(self, source_name:str):
        self.source_name = source_name

    def close(self):
        pass

    # EXECUTION ORDONNEE | APPLY
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
                SQLUtils.create_project_indexes(session, self.source_name, app=app)
                session.commit()
            except Exception as e:
                session.rollback()
                logger.warning(f"⚠ Failed to create project indexes (will retry later): {e}")
                raise SQLMetadataConversionError(f"❌ Failed to create project indexes: {e}") from e
                
            # Assure la table de migrations
            logger.info(f"{session.execute(text("SELECT current_database()")).scalar()}\n")

            # Ensure migration table
            try:
                SQLUtils.ensure_migration_table(session, self.source_name, app=app)
                session.commit()
            except Exception as e:
                session.rollback()
                raise SQLMetadataConversionError(f"❌ Failed to ensure migration table: {e}") from e

            ordered = SQLUtils.topo_sort(objects)

            for obj in ordered:
                try:
                    
                    if SQLUtils.is_up_to_date(session, obj, self.source_name, app=app):
                        logger.info(f"✓ {obj.sql_metadata.name} up to date")
                        continue

                    if not obj.sql_str or not obj.sql_str.strip():
                        continue

                    logger.info(f"Applying {obj.sql_metadata.name} ({obj.sql_metadata.type.value}) ...")

                    print(obj.sql_metadata.to_dict())

                    # --- EXECUTE OBJECT ---
                    session.execute(text(obj.sql_str))

                    # --- CREATE INDEXES ---
                    if obj.sql_metadata.type in {SQLObjectType.TABLE,SQLObjectType.VIEW,SQLObjectType.MATVIEW}:
                        view_index_sql = SQLUtils.create_indexes(session, obj, self.source_name, app=app)
                        
                        if view_index_sql and len(view_index_sql) > 0:
                            logger.info(f"Index Créé avec sucess: \n{f"{', '.join(view_index_sql)}"}")
                        else:
                            logger.info(f"No index create for : {f"{obj.sql_metadata.name}"}")
                    
                    # --- RECORD MIGRATION ---
                    SQLUtils.record_migration(session, obj, self.source_name, app=app)

                    # --- COMMIT OBJECT ---
                    session.commit()
                    logger.info(f"✅ Committed {obj.sql_metadata.name}\n")

                except Exception as e:
                    session.rollback()
                    logger.error(f"❌ Failed {obj.sql_metadata.name} — rolled back. Error: {e}")
                    raise SQLMetadataConversionError(f"Failed to apply SQL object {obj.sql_metadata.name}") from e


            # --- Phase 2 : refresh matviews (hors transaction pour CONCURRENTLY) ---
            for obj in ordered:
                
                if obj.sql_metadata.type == SQLObjectType.MATVIEW:
                    try:
                        concurrent = " CONCURRENTLY" if refresh_concurrently else ""
                        safe_name = SQLUtils.validate_identifier(obj.sql_metadata.name)

                        session.execute(text(f"REFRESH MATERIALIZED VIEW{concurrent} {safe_name}"))

                        session.commit()
                        logger.info(f"🔄 Refreshed matview {concurrent.lower()} {obj.sql_metadata.name}")

                    except Exception as e:
                        session.rollback()
                        logger.error(f"❌ Failed to refresh matview {obj.sql_metadata.name}: {e}")
                        raise SQLMetadataConversionError(f"Failed to apply SQL object {obj.sql_metadata.name}") from e


    # DROP
    @with_app_context
    def drop_objects(self, objects: List[SQLObject], app:Flask=None):
        """Supprime tous les objets SQL dans l'ordre inverse, cascade et supprime de migrations."""
        ordered = list(reversed(SQLUtils.topo_sort(objects)))

        with Session(db.engine) as session:
            for obj in ordered:
                
                try:
                    safe_name = SQLUtils.validate_identifier(obj.sql_metadata.name)
                    type_name = obj.sql_metadata.type.value if obj.sql_metadata.type else None

                    logger.info(f"Dropping {type_name} {safe_name} ...")

                    sql_map = {
                        SQLObjectType.TABLE: "DROP TABLE IF EXISTS {}",
                        SQLObjectType.VIEW: "DROP VIEW IF EXISTS {}",
                        SQLObjectType.MATVIEW: "DROP MATERIALIZED VIEW IF EXISTS {}",
                        SQLObjectType.FUNCTION: "DROP FUNCTION IF EXISTS {}",
                    }
                    
                    # if obj.sql_metadata.type == SQLObjectType.TABLE:
                    #     sql_str = f"DROP TABLE IF EXISTS {safe_name} CASCADE"
                    # elif obj.sql_metadata.type == SQLObjectType.VIEW:
                    #     sql_str = f"DROP VIEW IF EXISTS {safe_name} CASCADE"
                    # elif obj.sql_metadata.type == SQLObjectType.MATVIEW:
                    #     sql_str = f"DROP MATERIALIZED VIEW IF EXISTS {safe_name} CASCADE"
                    # elif obj.sql_metadata.type == SQLObjectType.FUNCTION:
                    #     sql_str = f"DROP FUNCTION IF EXISTS {safe_name} CASCADE"
                    #     # sql_str = f"DROP FUNCTION {safe_name} CASCADE"

                    # if not sql_str:
                    #     continue

                    template = sql_map.get(obj.sql_metadata.type)

                    if not template:
                        continue

                    # 🔥 PAS DE CASCADE
                    session.execute(text(template.format(safe_name)))

                    SQLUtils.remove_migration(session, obj, self.source_name, app=app)  # supprime de schema_migrations

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
                safe_name = SQLUtils.validate_identifier(obj.sql_metadata.name)

                logger.info(f"Dropping {obj.sql_metadata.type.value} {safe_name} with CASCADE ...")

                # 1️⃣ Récupérer dépendances AVANT DROP
                dependencies = session.execute(text("""
                    SELECT DISTINCT c.relname
                    FROM pg_depend d
                    JOIN pg_class c ON d.objid = c.oid
                    JOIN pg_class parent ON d.refobjid = parent.oid
                    WHERE parent.relname = :name
                    AND c.relkind IN ('v', 'm', 'r', 'f')
                """), {"name": obj.sql_metadata.name}).fetchall()

                dependent_names = {row[0] for row in dependencies}
                dependent_names.add(obj.sql_metadata.name)  # inclure lui-même

                # 2️⃣ DROP CASCADE
                drop_map = {
                    SQLObjectType.TABLE: "DROP TABLE IF EXISTS {} CASCADE",
                    SQLObjectType.VIEW: "DROP VIEW IF EXISTS {} CASCADE",
                    SQLObjectType.MATVIEW: "DROP MATERIALIZED VIEW IF EXISTS {} CASCADE",
                    SQLObjectType.FUNCTION: "DROP FUNCTION IF EXISTS {} CASCADE",
                }

                template = drop_map.get(obj.sql_metadata.type)

                if not template:
                    raise ValueError(f"Unsupported object type {obj.sql_metadata.type}")
                
                # query = text(template.format(safe_name))
                query = sql.SQL(template).format(sql.Identifier(obj.sql_metadata.name))
                session.execute(query)

                # 3️⃣ Nettoyer schema_migrations
                schema_name = SQLUtils.migrations_shema_name(self.source_name)

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
                logger.error(f"❌ Failed to drop {obj.sql_metadata.name}: {e}")
                raise


    # FORCE REFRESH
    @with_app_context
    def force_refresh(self, objects: List[SQLObject], concurrently: bool=False, app:Flask=None):
        """
        Force le refresh des materialized views.
        Chaque refresh = transaction séparée.
        """
        with Session(db.engine) as session:
            for obj in objects:
                

                if obj.sql_metadata.type != SQLObjectType.MATVIEW:
                    continue

                safe_name = SQLUtils.validate_identifier(obj.sql_metadata.name)
                concurrent = " CONCURRENTLY" if concurrently else ""

                try:
                    session.execute(text(f"REFRESH MATERIALIZED VIEW{concurrent} {safe_name}"))

                    session.commit()
                    logger.info(f"🔄 Matview {obj.sql_metadata.name} refreshed successfully")

                except Exception as e:
                    session.rollback()
                    logger.error(f"❌ Failed to refresh matview {obj.sql_metadata.name}: {e}")
                    raise


    # REBUILD ALL
    def rebuild_all(self, objects: List[SQLObject], refresh_concurrently=False, app:Flask=None):
        """Supprime et recrée tous les objets SQL."""
        logger.info("Dropping all objects...")
        self.drop_objects(objects, app=app)
        logger.info("Re-applying all objects...")
        self.apply_objects(objects, refresh_concurrently, app=app)


# SQL STARTER
class SQLStarter:
    def __init__(self, source_name: str, app: Flask, metadata_source: MetadataSource = "sql"):
        self.sql_objects = SQLUtils.load_sql_objects(source_name,metadata_source=metadata_source)
        self.migrator = SQLMigrator(source_name)
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


# MAIN
if __name__ == "__main__":
    pass

    # starter = SQLStarter(source_name="kendeya")
    # starter.run("init")

    # import argparse
    # parser = argparse.ArgumentParser()
    # parser.add_argument("action", choices=["init","refresh","rebuild"])
    # parser.add_argument("--metadata-source",choices=["sql", "json"],default="sql")

    # starter = SQLStarter(
    #     source_name="kendeya",
    #     app=app,
    #     metadata_source=args.metadata_source
    # )

    # args = parser.parse_args()
    # starter = SQLStarter()
    # starter.run(args.action)

    # python migrate.py init
    # python migrate.py refresh
    # python migrate.py rebuild

