CREATE MATERIALIZED VIEW IF NOT EXISTS report_newborn_view AS
    SELECT 
        CONCAT(a.month, '-', a.year, '-', a.reco_id) AS id,
        a.month,
        a.year,
        a.reco_id,
        
        (COUNT(DISTINCT n.patient_id) FILTER (WHERE n.is_referred IS TRUE AND n.has_danger_sign IS TRUE)) AS referred_with_danger_signs, 
        
        (COUNT(DISTINCT n.patient_id) FILTER (WHERE n.patient_id IS NOT NULL AND n.has_malnutrition IS TRUE)) AS screened_malnutrition,
        
        (COUNT(DISTINCT n.patient_id) FILTER (WHERE n.patient_id IS NOT NULL AND n.has_diarrhea IS TRUE)) AS diarrhea_cases

 
    FROM year_month_reco_grid_view a
    
        LEFT JOIN newborn_data_view n ON n.reco_id = a.reco_id AND n.month = a.month AND n.year = a.year

    GROUP BY a.reco_id, a.month, a.year;