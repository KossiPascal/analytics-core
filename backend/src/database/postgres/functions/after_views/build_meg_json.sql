CREATE OR REPLACE FUNCTION build_meg_json(
    meg_index INT,
    meg_label TEXT,
    meg_column TEXT,
    reco_id TEXT,
    current_month TEXT,
    current_year INT,
    prev_month TEXT,
    prev_year INT
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    value JSONB;
BEGIN
    EXECUTE format($f$
        SELECT jsonb_build_object(
            'index', %s,
            'label', %L,
            'month_beginning', COALESCE(SUM(CASE WHEN meg_type = 'inventory' AND %I IS NOT NULL AND month = %L AND year = %s THEN %I ELSE 0 END), 0),
            'month_received', COALESCE(SUM(CASE WHEN meg_type = 'stock' AND %I IS NOT NULL AND month = %L AND year = %s THEN %I ELSE 0 END), 0),
            'month_total_start', (
                COALESCE(SUM(CASE WHEN meg_type = 'inventory' AND %I IS NOT NULL AND month = %L AND year = %s THEN %I ELSE 0 END), 0) +
                COALESCE(SUM(CASE WHEN meg_type = 'stock' AND %I IS NOT NULL AND month = %L AND year = %s THEN %I ELSE 0 END), 0)
            ),
            'month_consumption', COALESCE(SUM(CASE WHEN meg_type = 'consumption' AND %I IS NOT NULL AND month = %L AND year = %s THEN %I ELSE 0 END), 0),
            'month_theoreticaly', (
                COALESCE(SUM(CASE WHEN meg_type = 'inventory' AND %I IS NOT NULL AND month = %L AND year = %s THEN %I ELSE 0 END), 0) +
                COALESCE(SUM(CASE WHEN meg_type = 'stock' AND %I IS NOT NULL AND month = %L AND year = %s THEN %I ELSE 0 END), 0) -
                COALESCE(SUM(CASE WHEN meg_type IN ('consumption','loss','damaged','broken','expired') AND %I IS NOT NULL AND month = %L AND year = %s THEN %I ELSE 0 END), 0)
            ),
            'month_inventory', COALESCE(SUM(CASE WHEN meg_type = 'inventory' AND %I IS NOT NULL AND month = %L AND year = %s THEN %I ELSE 0 END), 0),
            'month_loss', COALESCE(SUM(CASE WHEN meg_type = 'loss' AND %I IS NOT NULL AND month = %L AND year = %s THEN %I ELSE 0 END), 0),
            'month_damaged', COALESCE(SUM(CASE WHEN meg_type = 'damaged' AND %I IS NOT NULL AND month = %L AND year = %s THEN %I ELSE 0 END), 0),
            'month_broken', COALESCE(SUM(CASE WHEN meg_type = 'broken' AND %I IS NOT NULL AND month = %L AND year = %s THEN %I ELSE 0 END), 0),
            'month_expired', COALESCE(SUM(CASE WHEN meg_type = 'expired' AND %I IS NOT NULL AND month = %L AND year = %s THEN %I ELSE 0 END), 0)
        )
        FROM reco_meg_data_view
        WHERE reco_id = %L
    $f$,
        -- 1: index, 2: label
        meg_index, meg_label,

        -- month_beginning
        meg_column, prev_month, prev_year, meg_column,

        -- month_received
        meg_column, current_month, current_year, meg_column,

        -- month_total_start
        meg_column, prev_month, prev_year, meg_column,
        meg_column, current_month, current_year, meg_column,

        -- month_consumption
        meg_column, current_month, current_year, meg_column,

        -- month_theoreticaly
        meg_column, prev_month, prev_year, meg_column,
        meg_column, current_month, current_year, meg_column,
        meg_column, current_month, current_year, meg_column,

        -- month_inventory
        meg_column, current_month, current_year, meg_column,

        -- month_loss
        meg_column, current_month, current_year, meg_column,

        -- month_damaged
        meg_column, current_month, current_year, meg_column,

        -- month_broken
        meg_column, current_month, current_year, meg_column,

        -- month_expired
        meg_column, current_month, current_year, meg_column,

        -- last: WHERE reco_id
        reco_id
    )
    INTO value;

    RETURN value;
END;
$$;
