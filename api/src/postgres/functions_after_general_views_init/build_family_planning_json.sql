CREATE OR REPLACE FUNCTION build_family_planning_json(
    method_label TEXT,
    method_column TEXT,  -- e.g. 'pill_coc'
    reco_id TEXT,
    month TEXT,
    year INT
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    result JSONB;
    -- valid_columns CONSTANT TEXT[] := ARRAY[
    --     'pill_coc', 'pill_cop', 'condom', 'implant', 'depo'
    -- ]; -- extend this list as needed
BEGIN
    -- -- Validate method_column against known columns to avoid SQL injection
    -- IF method_column NOT IN (SELECT UNNEST(valid_columns)) THEN
    --     RAISE EXCEPTION 'Invalid method_column: %', method_column;
    -- END IF;

    EXECUTE format(
        $func$
        WITH base_data AS (
            SELECT *
            FROM family_planning_data_view a
            WHERE reco_id = %L AND month = %L AND year = %L
        )
        SELECT jsonb_build_object(
            'label', %L,
            'nbr_new_user', COALESCE(COUNT(DISTINCT patient_id) FILTER (
                WHERE fp_method = %L AND form IN ('pregnancy_family_planning', 'family_planning')
                      AND has_counseling IS TRUE AND is_method_avaible_reco IS TRUE
                      AND method_was_given IS TRUE AND already_use_method IS NOT TRUE
            ), 0)::BIGINT,
            'nbr_regular_user', COALESCE(COUNT(DISTINCT patient_id) FILTER (
                WHERE fp_method = %L AND has_counseling IS TRUE
                      AND is_method_avaible_reco IS TRUE AND method_was_given IS TRUE
                      AND already_use_method IS TRUE
            ), 0)::BIGINT,
            'nbr_total_user', COALESCE(COUNT(DISTINCT patient_id) FILTER (
                WHERE fp_method = %L AND has_counseling IS TRUE
                      AND is_method_avaible_reco IS TRUE AND method_was_given IS TRUE
            ), 0)::BIGINT,
            'nbr_delivered', (
                SELECT COALESCE(SUM(%I), 0)
                FROM reco_meg_data_view
                WHERE reco_id = %L AND month = %L AND year = %L AND meg_type = 'consumption'
                      AND %I IS NOT NULL AND %I > 0
            )::BIGINT,
            'nbr_in_stock', (
                SELECT
                    COALESCE(SUM(CASE WHEN meg_type = 'stock' THEN %I ELSE 0 END), 0)
                    - COALESCE(SUM(CASE WHEN meg_type = 'consumption' THEN %I ELSE 0 END), 0)
                    - COALESCE(SUM(CASE WHEN meg_type = 'loss' THEN %I ELSE 0 END), 0)
                    - COALESCE(SUM(CASE WHEN meg_type = 'damaged' THEN %I ELSE 0 END), 0)
                    - COALESCE(SUM(CASE WHEN meg_type = 'broken' THEN %I ELSE 0 END), 0)
                    - COALESCE(SUM(CASE WHEN meg_type = 'expired' THEN %I ELSE 0 END), 0)
                FROM reco_meg_data_view
                WHERE reco_id = %L AND month = %L AND year = %L
            )::BIGINT,
            'nbr_referred', (
                SELECT COALESCE(SUM(%I), 0)
                FROM reco_meg_data_view
                WHERE reco_id = %L AND month = %L AND year = %L AND fp_method = %L AND is_fp_referred IS TRUE
            )::BIGINT,
            'nbr_side_effect', (
                SELECT COALESCE(SUM(%I), 0)
                FROM reco_meg_data_view
                WHERE reco_id = %L AND month = %L AND year = %L AND fp_method = %L AND has_fp_side_effect IS TRUE
            )::BIGINT
        )
        FROM base_data
        $func$,
        -- format args (in order of placeholders above)
        reco_id, month, year,            -- base_data CTE
        method_label,
        method_column,                   -- fp_method filters for new
        method_column,                   -- regular
        method_column,                   -- total
        method_column, reco_id, month, year, method_column, method_column,  -- delivered
        -- simplified nbr_in_stock
        method_column, method_column, method_column, method_column, method_column, method_column,
        reco_id, month, year,
        method_column,                  -- referred
        reco_id, month, year, method_column,
        method_column,                  -- side effects
        reco_id, month, year, method_column
    )
    INTO result;

    RETURN result;
END;
$$;
