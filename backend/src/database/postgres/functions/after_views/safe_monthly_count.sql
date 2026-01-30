CREATE OR REPLACE FUNCTION safe_monthly_count(
    view_name TEXT,
    reco_id TEXT,
    year INT,
    label TEXT
)
RETURNS JSONB 
LANGUAGE plpgsql
AS $$
DECLARE
    result JSONB;
BEGIN
    EXECUTE format($f$
        WITH months AS (
            SELECT unnest(ARRAY['01','02','03','04','05','06','07','08','09','10','11','12']) AS month
        ),
        colors AS (
            SELECT generate_random_colors(COALESCE((SELECT COUNT(id) FROM reco_view), 1) * 30) AS color
        )
        SELECT jsonb_build_object(
            'label', %L,
            'color', (SELECT color FROM colors LIMIT 1)[1],
            'data', (
                SELECT jsonb_object_agg(month, data_count)
                FROM (
                    SELECT m.month, COUNT(v.id) AS data_count
                    FROM months m
                    LEFT JOIN %I v
                        ON v.month = m.month
                       AND v.year = %L
                       AND v.reco_id = %L
                    GROUP BY m.month
                ) sub
            )
        )
    $f$,
        label,        -- %L (label sécurisé comme littéral)
        view_name,    -- %I (identifiant de table sécurisé)
        year,         -- %L (littéral)
        reco_id       -- %L (littéral)
    )
    INTO result;

    RETURN result;
END;
$$;
