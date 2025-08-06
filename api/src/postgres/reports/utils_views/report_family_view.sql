CREATE MATERIALIZED VIEW IF NOT EXISTS report_family_view AS
    WITH base AS (
        SELECT 
            a.reco_id,
            a.month,
            a.year,
            (EXTRACT(EPOCH FROM (DATE_TRUNC('month', TO_DATE(a.year || '-' || a.month || '-01', 'YYYY-MM-DD')) 
            + INTERVAL '1 month - 1 microsecond')) * 1000)::BIGINT AS end_of_month_ts
        FROM year_month_reco_grid_view a
    )

    SELECT 
        CONCAT(b.month, '-', b.year, '-', b.reco_id) AS id,
        b.month,
        b.year,
        b.reco_id,

        COUNT(f.*) FILTER (WHERE f.id IS NOT NULL) AS total_families_cover,
        COUNT(f.*) FILTER (WHERE f.id IS NOT NULL AND f.month = b.month AND f.year = b.year) AS families_cover,
        COUNT(f.*) FILTER (
            WHERE f.id IS NOT NULL AND f.month = b.month AND f.year = b.year AND f.household_has_working_latrine IS TRUE
        ) AS households_with_functional_latrines,

        COUNT(f.*) FILTER (
            WHERE f.id IS NOT NULL AND f.month = b.month AND f.year = b.year
            AND f.household_has_good_water_access IS TRUE
            AND EXISTS (
                SELECT 1 FROM patient_view pv 
                WHERE pv.family_id = f.id AND pv.reco_id = b.reco_id
                AND pv.reported_date_timestamp <= b.end_of_month_ts
                AND pv.birth_date IS NOT NULL 
                AND AGE(CURRENT_DATE, pv.birth_date) < INTERVAL '60 months'
            )
        ) AS households_with_children_0_59m_safe_water

    FROM base b

    LEFT JOIN family_view f 
        ON f.reco_id = b.reco_id 
        AND f.reported_date_timestamp <= b.end_of_month_ts

    GROUP BY b.reco_id, b.month, b.year;




    -- SELECT 
    --     CONCAT(a.month, '-', a.year, '-', a.reco_id) AS id,
    --     a.month,
    --     a.year,
    --     a.reco_id,

    --     (COUNT(f.*) FILTER (WHERE 1 = 1)) AS total_families_cover,
    --     (COUNT(f.*) FILTER (WHERE f.month = a.month AND f.year = a.year)) AS families_cover,
    --     (COUNT(f.*) FILTER (WHERE f.month = a.month AND f.year = a.year AND f.household_has_working_latrine IS TRUE)) AS households_with_functional_latrines,

    --     (COUNT(f.id) FILTER (WHERE f.month = a.month AND f.year = a.year AND f.household_has_good_water_access IS TRUE AND EXISTS (
    --             SELECT 1 FROM patient_view pv WHERE pv.family_id = f.id AND pv.reco_id = a.reco_id
    --             AND pv.reported_date_timestamp <= (EXTRACT(EPOCH FROM (DATE_TRUNC('month', TO_DATE(a.year || '-' || a.month || '-01', 'YYYY-MM-DD')) + INTERVAL '1 month' - INTERVAL '1 microsecond')) * 1000)
    --             AND pv.birth_date IS NOT NULL AND AGE(CURRENT_DATE, pv.birth_date) < INTERVAL '60 months'))
    --     ) AS households_with_children_0_59m_safe_water


    -- FROM year_month_reco_grid_view a
    
    --     LEFT JOIN family_view f ON f.reco_id = a.reco_id AND f.reported_date_timestamp <= (EXTRACT(EPOCH FROM (DATE_TRUNC('month', TO_DATE(a.year || '-' || a.month || '-01', 'YYYY-MM-DD')) + INTERVAL '1 month' - INTERVAL '1 microsecond')) * 1000)

    -- GROUP BY a.reco_id, a.month, a.year;