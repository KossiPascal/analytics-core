CREATE MATERIALIZED VIEW IF NOT EXISTS users_telemetry_view AS 
SELECT 
    doc ->> '_id'::text AS id,
    concat_ws('-'::text, doc #>> '{metadata,year}'::text[],
        CASE
            WHEN string_to_array("substring"(doc #>> '{metadata,versions,app}'::text[], '(\d+.\d+.\d+)'::text), '.'::text)::integer[] < '{3,8,0}'::integer[] THEN ((doc #>> '{metadata,month}'::text[])::integer) + 1
            ELSE (doc #>> '{metadata,month}'::text[])::integer
        END,
        CASE
            WHEN (doc #>> '{metadata,day}'::text[]) IS NOT NULL THEN doc #>> '{metadata,day}'::text[]
            ELSE '1'::text
        END)::date AS period_start,
    doc #>> '{metadata,user}'::text[] AS user_name,
    doc #>> '{metadata,versions,app}'::text[] AS app_version,
    doc #>> '{metrics,boot_time,min}'::text[] AS boot_time_min,
    doc #>> '{metrics,boot_time,max}'::text[] AS boot_time_max,
    doc #>> '{metrics,boot_time,count}'::text[] AS boot_time_count,
    doc #>> '{dbInfo,doc_count}'::text[] AS doc_count_on_local_db
   FROM couchdb_metas
  WHERE (doc ->> 'type'::text) = 'telemetry'::text
WITH DATA;

-- -- View indexes:
-- CREATE INDEX idx_useview_telemetry_period_start_user ON public.useview_telemetry USING btree (period_start, user_name);
-- CREATE UNIQUE INDEX idx_useview_telemetry_uuid ON public.useview_telemetry USING btree (uuid);