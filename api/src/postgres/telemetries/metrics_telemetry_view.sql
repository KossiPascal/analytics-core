CREATE MATERIALIZED VIEW IF NOT EXISTS metrics_telemetry_view AS 
    WITH telemetry_docs_with_metric_blob AS (
        SELECT 
        doc #>> '{_id}'::text[] AS telemetry_doc_id,
        doc #>> '{metadata,deviceId}'::text[] AS device_id,
        doc #>> '{metadata,user}'::text[] AS user_name,
        concat_ws('-'::text, doc #>> '{metadata,year}'::text[],
            CASE
                WHEN (doc #>> '{metadata,day}'::text[]) IS NULL AND ((doc #>> '{metadata,versions,app}'::text[]) IS NULL OR string_to_array("substring"(doc #>> '{metadata,versions,app}'::text[], '(\d+.\d+.\d+)'::text), '.'::text)::integer[] < '{3,8,0}'::integer[]) THEN ((doc #>> '{metadata,month}'::text[])::integer) + 1
                ELSE (doc #>> '{metadata,month}'::text[])::integer
            END,
            CASE
                WHEN (doc #>> '{metadata,day}'::text[]) IS NOT NULL THEN doc #>> '{metadata,day}'::text[]
                ELSE '1'::text
            END)::date AS period_start,
        jsonb_object_keys(doc -> 'metrics'::text) AS metric,
        (doc -> 'metrics'::text) -> jsonb_object_keys(doc -> 'metrics'::text) AS metric_values
        FROM couchdb_metas
        WHERE (doc ->> 'type'::text) = 'telemetry'::text
    )

    SELECT 
        CONCAT(t.telemetry_doc_id, '-', t.metric) AS id,
        t.telemetry_doc_id,
        t.metric,
        t.period_start,
        t.user_name,
        t.device_id,
        jsonb_to_record.min,
        jsonb_to_record.max,
        jsonb_to_record.sum,
        jsonb_to_record.count,
        jsonb_to_record.sumsqr
    FROM telemetry_docs_with_metric_blob t
    CROSS JOIN LATERAL jsonb_to_record(t.metric_values) jsonb_to_record(min numeric, max numeric, sum numeric, count bigint, sumsqr numeric);

    -- -- View indexes:
    -- CREATE INDEX useview_telemetry_metrics_device_id ON public.useview_telemetry_metrics USING btree (device_id);
    -- CREATE UNIQUE INDEX useview_telemetry_metrics_docid_metric ON public.useview_telemetry_metrics USING btree (telemetry_doc_id, metric);
    -- CREATE INDEX useview_telemetry_metrics_period_start ON public.useview_telemetry_metrics USING btree (period_start);
    -- CREATE INDEX useview_telemetry_metrics_user_name ON public.useview_telemetry_metrics USING btree (user_name);