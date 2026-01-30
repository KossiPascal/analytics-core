CREATE MATERIALIZED VIEW IF NOT EXISTS report_pregnant_view AS
    SELECT 
        CONCAT(a.month, '-', a.year, '-', a.reco_id) AS id,
        a.month,
        a.year,
        a.reco_id,

        (COUNT(p.*) FILTER (WHERE 1 = 1)) AS total_women_pregnant,
        
        (COUNT(p.*) FILTER (WHERE p.month = a.month AND p.year = a.year)) AS women_pregnant,

        (COUNT(p.*) FILTER (WHERE p.cpn_done IS NOT TRUE AND (p.cpn_number IS NULL OR p.cpn_number <= 0))) AS referred_CPN1_per_month,

        (COUNT(p.*) FILTER (WHERE p.is_home_delivery_wanted IS TRUE )) AS referred_for_delivery,

        (COUNT(p.*) FILTER (WHERE p.cpn_done IS NOT TRUE)) AS referred_CPN,

        (COUNT(p.*) FILTER (WHERE p.is_referred IS TRUE AND p.has_danger_sign IS TRUE)) AS referred_danger_signs_RECO


    FROM year_month_reco_grid_view a
    
    LEFT JOIN pregnant_data_view p ON p.reco_id = a.reco_id AND p.form IN ('pregnancy_family_planning', 'pregnancy_register') 
         AND p.reported_date_timestamp <= (EXTRACT(EPOCH FROM (DATE_TRUNC('month', TO_DATE(a.year || '-' || a.month || '-01', 'YYYY-MM-DD')) + INTERVAL '1 month' - INTERVAL '1 microsecond')) * 1000) 

    GROUP BY a.reco_id, a.month, a.year;
