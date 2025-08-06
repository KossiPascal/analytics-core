CREATE OR REPLACE FUNCTION clean_json_text(value TEXT)
RETURNS TEXT AS $$
BEGIN
    IF value IS NULL OR TRIM(value) = '' THEN
        RETURN NULL;
    END IF;
    RETURN value;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
