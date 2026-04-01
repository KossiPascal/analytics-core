-- @name: users_view
-- @type: matview
-- @depends: 
-- @auto_depends: true
-- @indexes:
--   - columns: ["id"]
--     unique: true

CREATE MATERIALIZED VIEW IF NOT EXISTS users_view AS
    SELECT 
        (doc->>'_id')::TEXT AS id,
        (doc->>'_rev')::TEXT AS rev,
        (doc->>'name')::TEXT AS name,
        (doc->>'code')::TEXT AS code,
        (doc->>'known')::TEXT AS known,
        (doc->>'type')::TEXT AS type,
        (doc->>'email')::TEXT AS email,
        (doc->>'phone')::TEXT AS phone,
        COALESCE(NULLIF(doc->>'roles','')::JSONB, '{}'::JSONB) AS roles,
        (doc->>'fullname')::TEXT AS fullname,
        (doc->>'contact_id')::TEXT AS contact_id,
        COALESCE(NULLIF(doc->>'facility_id','')::JSONB, '{}'::JSONB) AS places
    FROM kendeya_docs
    WHERE id ~ '^org\.couchdb\.user:[a-zA-Z0-9_-]+$';