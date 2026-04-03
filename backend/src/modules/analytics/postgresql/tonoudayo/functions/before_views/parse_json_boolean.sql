CREATE OR REPLACE FUNCTION parse_json_boolean(val TEXT)
    RETURNS BOOLEAN AS $$
BEGIN
    IF val IS NULL THEN
        RETURN NULL;
    END IF;
    RETURN LOWER(val) IN ('true', 'yes', '1');
END;
$$ LANGUAGE plpgsql IMMUTABLE;
