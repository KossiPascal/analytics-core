CREATE MATERIALIZED VIEW IF NOT EXISTS devices_telemetry_view AS 
    SELECT DISTINCT ON ((doc #>> '{metadata,deviceId}'::text[]), (doc #>> '{metadata,user}'::text[])) 
        CONCAT(doc #>> '{_id}'::text[], '-', doc #>> '{metadata,user}'::text[]) AS id,
        doc #>> '{_id}'::text[] AS uuid,
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
        doc #>> '{device,deviceInfo,hardware,manufacturer}'::text[] AS device_manufacturer,
        doc #>> '{device,deviceInfo,hardware,model}'::text[] AS device_model,
        doc #>> '{dbInfo,doc_count}'::text[] AS doc_count,
        doc #>> '{device,userAgent}'::text[] AS user_agent,
        doc #>> '{device,deviceInfo,app,version}'::text[] AS cht_android_version,
        doc #>> '{device,deviceInfo,software,androidVersion}'::text[] AS android_version,
        doc #>> '{device,deviceInfo,storage,free}'::text[] AS storage_free,
        doc #>> '{device,deviceInfo,storage,total}'::text[] AS storage_total,
        doc #>> '{device,deviceInfo,network,upSpeed}'::text[] AS network_up_speed,
        doc #>> '{device,deviceInfo,network,downSpeed}'::text[] AS network_down_speed

    FROM couchdb_metas

    WHERE (doc ->> 'type'::text) = 'telemetry'::text
    ORDER BY (doc #>> '{metadata,deviceId}'::text[]), (doc #>> '{metadata,user}'::text[]), (concat_ws('-'::text, doc #>> '{metadata,year}'::text[],
        CASE
            WHEN (doc #>> '{metadata,day}'::text[]) IS NULL AND ((doc #>> '{metadata,versions,app}'::text[]) IS NULL OR string_to_array("substring"(doc #>> '{metadata,versions,app}'::text[], '(\d+.\d+.\d+)'::text), '.'::text)::integer[] < '{3,8,0}'::integer[]) THEN ((doc #>> '{metadata,month}'::text[])::integer) + 1
            ELSE (doc #>> '{metadata,month}'::text[])::integer
        END,
        CASE
            WHEN (doc #>> '{metadata,day}'::text[]) IS NOT NULL THEN doc #>> '{metadata,day}'::text[]
            ELSE '1'::text
        END)::date)

    -- View indexes:
    -- CREATE UNIQUE INDEX useview_telemetry_devices_device_user ON public.useview_telemetry_devices USING btree (device_id, user_name);