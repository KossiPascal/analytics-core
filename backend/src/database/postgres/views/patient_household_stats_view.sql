CREATE MATERIALIZED VIEW IF NOT EXISTS patient_household_stats_view AS
    SELECT 
        CONCAT(month, '-', year, '-', reco_id, '-', family_id) AS id,

        month,
        year,
        family_id,
        reco_id,
        
        COUNT(DISTINCT id) AS total_household_members,

        COUNT(DISTINCT id) FILTER (WHERE sex = 'M' AND age_on_creation BETWEEN INTERVAL '15 years' AND INTERVAL '50 years') AS total_adult_men_15_50_years,
        COUNT(DISTINCT id) FILTER (WHERE sex = 'F' AND age_on_creation BETWEEN INTERVAL '15 years' AND INTERVAL '50 years') AS total_adult_women_15_50_years,
        COUNT(DISTINCT id) FILTER (WHERE age_on_creation BETWEEN INTERVAL '15 years' AND INTERVAL '50 years') AS total_adult_15_50_years,

        COUNT(DISTINCT id) FILTER (WHERE sex = 'M' AND age_on_creation < INTERVAL '12 months') AS total_children_men_0_12_months,
        COUNT(DISTINCT id) FILTER (WHERE sex = 'F' AND age_on_creation < INTERVAL '12 months') AS total_children_women_0_12_months,
        COUNT(DISTINCT id) FILTER (WHERE age_on_creation < INTERVAL '12 months') AS total_children_0_12_months,

        COUNT(DISTINCT id) FILTER (WHERE sex = 'M' AND age_on_creation BETWEEN INTERVAL '12 months' AND INTERVAL '60 months') AS total_children_men_12_60_months,
        COUNT(DISTINCT id) FILTER (WHERE sex = 'F' AND age_on_creation BETWEEN INTERVAL '12 months' AND INTERVAL '60 months') AS total_children_women_12_60_months,
        COUNT(DISTINCT id) FILTER (WHERE age_on_creation BETWEEN INTERVAL '12 months' AND INTERVAL '60 months') AS total_children_12_60_months,

        COUNT(DISTINCT id) FILTER (WHERE sex = 'M' AND age_on_creation < INTERVAL '60 months') AS total_children_men_under_5_years,
        COUNT(DISTINCT id) FILTER (WHERE sex = 'F' AND age_on_creation < INTERVAL '60 months') AS total_children_women_under_5_years,
        COUNT(DISTINCT id) FILTER (WHERE age_on_creation < INTERVAL '60 months') AS total_children_under_5_years

    FROM patient_view

    GROUP BY family_id, reco_id, year, month;
