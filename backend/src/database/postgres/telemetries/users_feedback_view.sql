CREATE MATERIALIZED VIEW IF NOT EXISTS users_feedback_view AS 
    SELECT 
        doc ->> '_id'::text AS id,
        doc #>> '{meta,source}'::text[] AS source,
        doc #>> '{meta,url}'::text[] AS url,
        doc #>> '{meta,user,name}'::text[] AS user_name,
        doc #>> '{meta,time}'::text[] AS period_start,
        COALESCE(doc #>> '{info,cause}'::text[], doc ->> 'info'::text) AS cause,
        doc #>> '{info,message}'::text[] AS message
    FROM couchdb_metas
    WHERE (doc ->> 'type'::text) = 'feedback'::text

-- -- View indexes:
-- CREATE INDEX idx_useview_feedback_period_start_user ON public.useview_feedback USING btree (period_start, user_name);
-- CREATE UNIQUE INDEX idx_useview_feedback_uuid ON public.useview_feedback USING btree (uuid);