CREATE MATERIALIZED VIEW IF NOT EXISTS report_patient_count_view AS
    SELECT 
        CONCAT(a.month, '-', a.year, '-', a.reco_id, '-', p.birth_date) AS id,
        a.month,
        a.year,
        a.reco_id,

        calculate_age_in('months', p.birth_date::DATE, NULL, a.month::TEXT, a.year::INT) AS month_age,
        calculate_age_in('years', p.birth_date::DATE, NULL, a.month::TEXT, a.year::INT) AS year_age,

        (COUNT(p.*) FILTER (
            WHERE p.id IS NOT NULL 
            AND calculate_age_in('months', p.birth_date::DATE, NULL, a.month::TEXT, a.year::INT) < 2)
        ) AS newborn_less_02_months,

        (COUNT(p.*) FILTER (
            WHERE p.id IS NOT NULL 
            AND calculate_age_in('months', p.birth_date::DATE, NULL, a.month::TEXT, a.year::INT) >= 2 
            AND calculate_age_in('months', p.birth_date::DATE, NULL, a.month::TEXT, a.year::INT) < 60)
        ) AS child_02_to_60_months,
        
        (COUNT(p.*) FILTER (
            WHERE p.id IS NOT NULL 
            AND calculate_age_in('months', p.birth_date::DATE, NULL, a.month::TEXT, a.year::INT) >= 60 
            AND calculate_age_in('years', p.birth_date::DATE, NULL, a.month::TEXT, a.year::INT) < 15)
        ) AS child_05_to_14_years,
        
        (COUNT(p.*) FILTER (
            WHERE p.id IS NOT NULL 
            AND calculate_age_in('years', p.birth_date::DATE, NULL, a.month::TEXT, a.year::INT) >= 15)
        )::BIGINT AS adult_over_14_years


    FROM year_month_reco_grid_view a

        LEFT JOIN patient_view p ON p.reco_id = a.reco_id


    GROUP BY a.reco_id, a.month, a.year, p.birth_date;

