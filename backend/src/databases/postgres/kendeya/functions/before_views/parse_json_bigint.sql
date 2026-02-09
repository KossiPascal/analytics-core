CREATE OR REPLACE FUNCTION parse_json_bigint(value TEXT) 
RETURNS BIGINT AS $$
BEGIN
    IF value ~ '^-?\d+$' THEN
        RETURN value::BIGINT;
    ELSE
        RETURN NULL;
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;



-- CREATE OR REPLACE FUNCTION parse_json_bigint(value TEXT) 
-- RETURNS BIGINT AS $$
-- DECLARE
--     num BIGINT;
-- BEGIN
--     IF value ~ '^\d+$' THEN
--         num := value::BIGINT;
--         IF num > 0 THEN
--             RETURN num;
--         END IF;
--     END IF;
--     RETURN NULL;
-- END;
-- $$ LANGUAGE plpgsql IMMUTABLE;