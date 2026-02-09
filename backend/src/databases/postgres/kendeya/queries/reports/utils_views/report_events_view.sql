CREATE MATERIALIZED VIEW IF NOT EXISTS report_events_view AS
    SELECT 
        CONCAT(a.month, '-', a.year, '-', a.reco_id) AS id,
        a.month,
        a.year,
        a.reco_id,

        (COUNT(e.*) FILTER (WHERE e.is_pfa IS TRUE)) AS AFP,
        (COUNT(e.*) FILTER (WHERE e.is_bloody_diarrhea IS TRUE)) AS bloody_diarrhea,
        (COUNT(e.*) FILTER (WHERE e.is_yellow_fever IS TRUE)) AS yellow_fever,
        (COUNT(e.*) FILTER (WHERE e.is_cholera IS TRUE)) AS cholera,
        (COUNT(e.*) FILTER (WHERE e.is_maternal_and_neonatal_tetanus IS TRUE)) AS maternal_neonatal_tetanus,
        (COUNT(e.*) FILTER (WHERE e.is_viral_diseases IS TRUE)) AS viral_diseases_ebola_marburg_lassa,
        (COUNT(e.*) FILTER (WHERE e.is_meningitis IS TRUE)) AS meningitis,
        (COUNT(e.*) FILTER (WHERE e.is_maternal_deaths IS TRUE)) AS maternal_deaths,
        (COUNT(e.*) FILTER (WHERE e.is_community_deaths IS TRUE)) AS community_deaths,
        (COUNT(e.*) FILTER (WHERE e.is_influenza_fever IS TRUE)) AS flu_like_fever

    FROM year_month_reco_grid_view a
    
        LEFT JOIN events_data_view e ON e.reco_id = a.reco_id AND e.month = a.month AND e.year = a.year
        
    GROUP BY a.reco_id, a.month, a.year;