-- @name: parse_json_decimal
-- @type: function

CREATE OR REPLACE FUNCTION parse_json_decimal(value TEXT)
RETURNS DOUBLE PRECISION AS $$
BEGIN
    IF value IS NULL OR value = '' OR value !~ '^\d+(\.\d+)?$' THEN
        RETURN NULL;
    END IF;
    RETURN value::DOUBLE PRECISION;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
