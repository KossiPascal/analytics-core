CREATE MATERIALIZED VIEW IF NOT EXISTS report_patient_view AS
    SELECT 
        CONCAT(a.month, '-', a.year, '-', a.reco_id) AS id,
        a.month,
        a.year,
        a.reco_id,

        (COUNT(p.*) FILTER (WHERE p.id IS NOT NULL AND p.month = a.month AND p.year = a.year AND p.age_in_month_on_creation IS NOT NULL AND p.age_in_month_on_creation >= 0 AND p.age_in_month_on_creation < 2)) AS newborns_registered_per_month, 
        (COUNT(p.*) FILTER (WHERE p.id IS NOT NULL AND p.month = a.month AND p.year = a.year AND p.has_birth_certificate IS NOT TRUE AND p.age_in_month_on_creation IS NOT NULL AND p.age_in_month_on_creation >= 0 AND p.age_in_month_on_creation < 60)) AS children_referred_for_birth_certificate, 
        (COUNT(p.*) FILTER (WHERE p.id IS NOT NULL AND p.month = a.month AND p.year = a.year AND p.has_birth_certificate IS TRUE AND p.age_in_month_on_creation IS NOT NULL AND p.age_in_month_on_creation >= 0 AND p.age_in_month_on_creation < 60)) AS children_received_birth_certificate,

        (COUNT(p.*) FILTER (WHERE p.id IS NOT NULL AND p.month = a.month AND p.year = a.year)) AS patients_cover,
        (COUNT(p.*) FILTER (WHERE p.id IS NOT NULL AND p.month = a.month AND p.year = a.year AND p.age_in_month_on_creation IS NOT NULL AND p.age_in_month_on_creation >= 0 AND p.age_in_month_on_creation < 12)) AS children_0_11,
        (COUNT(p.*) FILTER (WHERE p.id IS NOT NULL AND p.month = a.month AND p.year = a.year AND p.age_in_month_on_creation IS NOT NULL AND p.age_in_month_on_creation >= 12 AND p.age_in_month_on_creation < 60)) AS children_12_59,
        (COUNT(p.*) FILTER (WHERE p.id IS NOT NULL AND p.month = a.month AND p.year = a.year AND p.sex = 'F' AND p.age_in_year_on_creation IS NOT NULL AND p.age_in_year_on_creation >= 15 AND p.age_in_year_on_creation < 50)) AS women_15_49,

        (COUNT(p.*) FILTER (WHERE p.id IS NOT NULL)) AS total_patients_cover,
        (COUNT(p.*) FILTER (WHERE p.id IS NOT NULL AND p.age_in_month_on_creation IS NOT NULL AND p.age_in_month_on_creation >= 0 AND p.age_in_month_on_creation < 12)) AS total_children_0_11,
        (COUNT(p.*) FILTER (WHERE p.id IS NOT NULL AND p.age_in_month_on_creation IS NOT NULL AND p.age_in_month_on_creation >= 12 AND p.age_in_month_on_creation < 60)) AS total_children_12_59,
        (COUNT(p.*) FILTER (WHERE p.id IS NOT NULL AND p.sex = 'F' AND p.age_in_year_on_creation IS NOT NULL AND p.age_in_year_on_creation >= 15  AND p.age_in_year_on_creation < 50)) AS total_women_15_49,

        (COUNT(p.*) FILTER (WHERE p.id IS NOT NULL AND p.month_of_death IS NOT NULL AND p.year_of_death IS NOT NULL)) AS total_death_register,
        (COUNT(p.*) FILTER (WHERE p.id IS NOT NULL AND p.month_of_death IS NOT NULL AND p.year_of_death IS NOT NULL AND p.month_of_death = a.month AND p.year_of_death = a.year)) AS death_register


    FROM year_month_reco_grid_view a

        LEFT JOIN patient_view p ON p.reco_id = a.reco_id AND p.reported_date_timestamp <= (EXTRACT(EPOCH FROM (DATE_TRUNC('month', TO_DATE(a.year || '-' || a.month || '-01', 'YYYY-MM-DD')) + INTERVAL '1 month' - INTERVAL '1 microsecond')) * 1000)


    GROUP BY a.reco_id, a.month, a.year;