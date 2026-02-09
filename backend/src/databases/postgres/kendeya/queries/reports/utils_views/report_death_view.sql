CREATE MATERIALIZED VIEW IF NOT EXISTS report_death_view AS
    SELECT 
        CONCAT(a.month, '-', a.year, '-', a.reco_id) AS id,
        a.month,
        a.year,
        a.reco_id,

        (COUNT(d.*) FILTER (WHERE d.has_malaria IS TRUE AND d.age_in_months IS NOT NULL AND d.age_in_months >= 0 AND d.age_in_months < 60)) AS malaria_deaths_recorded,
        (COUNT(d.*) FILTER (WHERE d.has_diarrhea IS TRUE AND d.age_in_months IS NOT NULL AND d.age_in_months >= 0 AND d.age_in_months < 60)) AS diarrhea_deaths_recorded,
        (COUNT(d.*) FILTER (WHERE d.age_in_months IS NOT NULL AND d.age_in_months >= 0 AND d.age_in_months < 60 AND (d.has_cough_cold IS TRUE OR d.has_pneumonia IS TRUE))) AS pneumonia_cough_cold_deaths,

        (COUNT(d.*) FILTER (WHERE d.sex = 'F' AND d.is_maternal_death IS TRUE AND d.is_home_death IS TRUE)) AS maternal_deaths_at_home_RECO,

        ((COUNT(d.*) FILTER (WHERE d.is_home_death IS TRUE AND d.age_in_days IS NOT NULL AND d.age_in_days >= 0 AND d.age_in_days < 28))
            +
            (COUNT(p.*) FILTER (WHERE p.is_home_death IS TRUE AND p.age_in_day_on_creation IS NOT NULL AND p.age_in_day_on_creation >= 0 AND p.age_in_day_on_creation < 28))
        ) AS neonatal_deaths_home_RECO,

        ((COUNT(d.*) FILTER (WHERE d.is_home_death IS TRUE AND d.age_in_months IS NOT NULL AND d.age_in_months >= 0 AND d.age_in_months < 60))
            +
            (COUNT(p.*) FILTER (WHERE p.is_home_death IS TRUE AND p.age_in_month_on_creation IS NOT NULL AND p.age_in_month_on_creation >= 0 AND p.age_in_month_on_creation < 60))
        ) AS under5_deaths_home_RECO


    FROM year_month_reco_grid_view a
    
        LEFT JOIN death_data_view d ON d.reco_id = a.reco_id AND d.month = a.month AND d.year = a.year
        LEFT JOIN patient_view p ON p.reco_id = a.reco_id AND p.month = a.month AND p.year = a.year
        

    GROUP BY a.reco_id, a.month, a.year;