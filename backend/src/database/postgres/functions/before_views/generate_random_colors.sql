CREATE OR REPLACE FUNCTION generate_random_colors(numberOfColr BIGINT) RETURNS TEXT[] AS $$
    DECLARE
        colors TEXT[] := '{}';  -- Initialisation correcte
        i INT;
        seed INT;
    BEGIN
        FOR i IN 1..numberOfColr LOOP
            seed := mod(i * 2654435761, 16777216);
            colors := array_append(colors, '#' || lpad(to_hex(seed), 6, '0'));
        END LOOP;
        
        RETURN colors;
    END;
    $$ LANGUAGE plpgsql;