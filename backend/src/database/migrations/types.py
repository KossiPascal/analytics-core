from typing import List, Optional, Dict, Tuple, Literal
from database.postgres.sql_loader import get_sql_file_content
from typing import Literal

IndexTarget = Literal[
    "only_id",
    "id",
    "id_reco",
    "reco_month_year",
    "reco_month",
    "reco_year",
    "month",
    "year",
    "year_month",
]

CouchdbFetchCible = Literal[
    "medic",
    "users",
    "users_meta",
    "sentinel",
    "logs",
]

class ViewIndexGenerate:
    def __init__(self, create: List[str], drop: List[str]):
        self.create = create
        self.drop = drop

class SqlView:
    def __init__(self, view_name: str, sql: str):
        if not view_name:
            raise ValueError("view_name cannot be None")
        self.view_name = view_name
        self.sql = sql

# -----------------------
# CLASSE DE MIGRATION
# -----------------------
class BaseViewMigration:
    def __init__(
        self,
        *,
        name: str,
        revision: int,
        views: List[str],
        type: Optional[Literal["materialized", "view", "function"]] = "materialized",
        folder: Optional[str] = None,

        refresh: bool = True,
        refresh_mode: Optional[Literal["concurrent", "full"]] = "concurrent",

        # 🔹 Indexes
        combos: Optional[List[Tuple[str, ...]]] = None,        # index simples
        unique_combos: Optional[List[Tuple[str, ...]]] = None, # 🔥 UNIQUE INDEX

        create_sql: Optional[str] = None,
        drop_sql: Optional[str] = None,
        refresh_sql: Optional[str] = None,

        create_index_sql: Optional[List[str]] = None,
        drop_index_sql: Optional[List[str]] = None,

        depends_on: Optional[List[int]] = None,
        drop_before_create: bool = True,
    ):
        self.name: str = name
        self.revision: int = revision
        self.views: List[str] = views
        self.type: Literal["materialized", "view", "function"] = type
        self.refresh: bool = refresh
        self.refresh_mode: Literal["concurrent", "full"] = refresh_mode
        self.folder: Optional[str] = folder
        self.combos: List[Tuple[str, ...]] = combos or [] # [("id",),("reco_id", "month"),("reco_id", "year"),("reco_id", "month", "year"),]
        self.unique_combos = unique_combos or []  # ⭐ clé du problème
        self.create_sql: Optional[str] = create_sql
        self.drop_sql: Optional[str] = drop_sql
        self.refresh_sql: Optional[str] = refresh_sql
        self.create_index_sql: Optional[List[str]] = create_index_sql
        self.drop_index_sql: Optional[List[str]] = drop_index_sql
        self.depends_on: List[int] = depends_on or [] # [12,13,50]
        self.drop_before_create: bool = drop_before_create


    def requires_unique_index(self) -> bool:
        return (
            self.type == "materialized"
            and self.refresh
            and self.refresh_mode == "concurrent"
        )

    def has_unique_index(self) -> bool:
        return bool(self.unique_combos)

    

    # GENERATE SQL
    def create_view_sql(self, view_name: Optional[str] = None) -> List[SqlView]:
        sqls: List[SqlView] = []
        viewnames = [view_name] if view_name else self.views
        if viewnames:
            
            if self.create_sql:
                sqls.append(SqlView(view_name=viewnames[0], sql=self.create_sql))
            else:
                for viewname in viewnames:
                    view_sql = get_sql_file_content(viewname, self.folder)
                    if not view_sql:
                        raise RuntimeError(f"No SQL found for view '{viewname}' in folder '{self.folder}'")
                    sqls.append(SqlView(view_name=viewname, sql=view_sql))
        return sqls
    

    def __get_function_with_argtypes_by_name(function_name: str,schema: Optional[str] = None) -> str:
        """
        Génère un SQL dynamique pour supprimer toutes les signatures
        d'une fonction PostgreSQL à partir de son nom.

        - Gère les fonctions surchargées
        - Schéma optionnel (public / search_path)
        - CASCADE inclus
        """

        schema_filter = (
            f"AND n.nspname = '{schema}'"
            if schema
            else "AND n.nspname = ANY (current_schemas(true))"
        )

        return f"""
    DO $$
    DECLARE
        r RECORD;
    BEGIN
        FOR r IN
            SELECT
                n.nspname,
                p.proname,
                pg_get_function_identity_arguments(p.oid) AS args
            FROM pg_proc p
            JOIN pg_namespace n ON n.oid = p.pronamespace
            WHERE p.proname = '{function_name}'
            {schema_filter}
        LOOP
            EXECUTE format('DROP FUNCTION IF EXISTS %I.%I(%s) CASCADE;',r.nspname,r.proname,r.args) 
                EXCEPTION WHEN others THEN RAISE NOTICE 'Could not drop function %', r.proname;
        END LOOP;
    END $$;
    """

    def drop_view_sql(self, view_name: Optional[str] = None) -> List[SqlView]:
        sqls: List[SqlView] = []

        viewnames = [view_name] if view_name else self.views
        if viewnames:
            if self.drop_sql:
                sqls.append(SqlView(view_name=viewnames[0], sql=self.drop_sql))
            else:
                for viewname in viewnames:
                    if self.type == "materialized":
                        sql = f"DROP MATERIALIZED VIEW IF EXISTS {viewname} CASCADE;"
                        sqls.append(SqlView(view_name=viewname, sql=sql))
                    elif self.type == "view":
                        sql = f"DROP VIEW IF EXISTS {viewname} CASCADE;"
                        sqls.append(SqlView(view_name=viewname, sql=sql))
                    elif self.type == "function":
                        sql = self.__get_function_with_argtypes_by_name(viewname)
                        sqls.append(SqlView(view_name=viewname, sql=sql))

        return sqls

    def refresh_view_sql(self, view_name: Optional[str] = None) -> List[SqlView]:
        sqls: List[SqlView] = []

        viewnames = [view_name] if view_name else self.views
        if viewnames:
            if self.type == "materialized" and self.refresh:
                if self.refresh_sql:
                    sqls.append(SqlView(view_name=viewnames[0], sql=self.refresh_sql))
                else:
                    for viewname in viewnames:
                        # Si concurrent → vérifier qu'il y a un index unique
                        if self.refresh_mode == "concurrent":
                            # TODO: vérifier existence d'un unique index dans PG
                            # Si pas d'index unique, fallback en full
                            sql = f"REFRESH MATERIALIZED VIEW CONCURRENTLY {viewname};"
                            sqls.append(SqlView(view_name=viewname, sql=sql))
                        elif self.refresh_mode == "full":
                            sql = f"REFRESH MATERIALIZED VIEW {viewname};"
                            sqls.append(SqlView(view_name=viewname, sql=sql))
        return sqls

    def create_index_sqls(self, view_name: Optional[str] = None) -> List[SqlView]:
        sqls: List[str] = []
        viewnames = [view_name] if view_name else self.views
        if viewnames:
            if self.create_index_sql:
                if isinstance(self.create_index_sql,list):
                    for sql in self.create_index_sql:
                        sqls.append(SqlView(view_name=viewnames[0], sql=sql))
                else:
                    sqls.append(SqlView(view_name=viewnames[0], sql=self.create_sql))
            else:
                for viewname in viewnames:
                    if self.unique_combos and isinstance(self.unique_combos, list):
                        # 🔥 Index uniques (CRITIQUE)
                        for u_combo in self.unique_combos:
                            if u_combo:
                                u_cols = ", ".join(u_combo)
                                u_idx_name = f"{viewname}_{'_'.join(u_combo)}_uidx"
                                u_sql = f"CREATE UNIQUE INDEX IF NOT EXISTS {u_idx_name} ON {viewname} ({u_cols});"
                                sqls.append(SqlView(view_name=viewname, sql=u_sql))

                    if self.combos and isinstance(self.combos, list):
                        for combo in self.combos:
                            if combo:
                                cols = ", ".join(combo)
                                idx_name = f"{viewname}_{'_'.join(combo)}_idx"
                                sql = f"CREATE INDEX IF NOT EXISTS {idx_name} ON {viewname} ({cols});"
                                sqls.append(SqlView(view_name=viewname, sql=sql))

        return sqls

    def drop_index_sqls(self, view_name: Optional[str] = None) -> List[SqlView]:
        sqls: List[str] = []
        viewnames = [view_name] if view_name else self.views
        if viewnames:
            if self.drop_index_sql:
                if isinstance(self.drop_index_sql,list):
                    for sql in self.drop_index_sql:
                        sqls.append(SqlView(view_name=viewnames[0], sql=sql))
                else:
                    sqls.append(SqlView(view_name=viewnames[0], sql=self.create_sql))
            else:
                for viewname in viewnames:
                    if self.combos and isinstance(self.combos, list):
                        for combo in self.combos:
                            idx_name = f"{viewname}_{'_'.join(combo)}_idx"
                            sql = f"DROP INDEX IF EXISTS {idx_name};"
                            sqls.append(SqlView(view_name=viewname, sql=sql))
        return sqls

    




