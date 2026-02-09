CREATE OR REPLACE FUNCTION get_value_or_default(p_value TEXT, p_default TEXT DEFAULT NULL)
RETURNS TEXT AS $$
BEGIN
    IF p_value IS NOT NULL AND LENGTH(TRIM(p_value)) > 0 THEN
        RETURN p_value;
    ELSIF p_default IS NOT NULL AND LENGTH(TRIM(p_default)) > 0 THEN
        RETURN p_default;
    ELSE
        RETURN NULL;
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
