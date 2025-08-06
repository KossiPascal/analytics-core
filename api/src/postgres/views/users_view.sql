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
        (doc->>'roles')::JSONB AS roles,
        (doc->>'fullname')::TEXT AS fullname,
        (doc->>'contact_id')::TEXT AS contact_id,
        (doc->>'facility_id')::JSONB AS places
    FROM couchdb
    WHERE id ~ '^org\.couchdb\.user:[a-zA-Z0-9_-]+$';