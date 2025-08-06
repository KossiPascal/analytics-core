CREATE MATERIALIZED VIEW IF NOT EXISTS report_vaccination_view AS
    SELECT 
        CONCAT(a.month, '-', a.year, '-', a.reco_id) AS id,
        a.month,
        a.year,
        a.reco_id,

        (COUNT(vc.*) FILTER (WHERE vc.vaccine_BCG IS NOT TRUE AND vc.age_in_days IS NOT NULL 
            AND vc.age_in_days >= 0 AND vc.age_in_days <= 45)
        ) AS newborns_0_45d_to_catch_up_BCG, 

        (COUNT(vc.*) FILTER (WHERE vc.vaccine_BCG IS TRUE AND vc.age_in_days IS NOT NULL 
            AND vc.age_in_days >= 0 AND vc.age_in_days <= 45)
        ) AS newborns_0_45d_caught_up_BCG, 

        (COUNT(vc.*) FILTER (WHERE vc.vaccine_VPO_0 IS NOT TRUE AND vc.age_in_days IS NOT NULL 
            AND vc.age_in_days >= 0 AND vc.age_in_days <= 45)
        ) AS newborns_0_45d_to_catch_up_Polio0, 

        (COUNT(vc.*) FILTER (WHERE vc.vaccine_VPO_0 IS TRUE AND vc.age_in_days IS NOT NULL 
            AND vc.age_in_days >= 0 AND vc.age_in_days <= 45)
        ) AS newborns_0_45d_caught_up_Polio0, 

        (COUNT(vc.*) FILTER (WHERE vc.vaccine_PENTA_3 IS NOT TRUE AND vc.age_in_months IS NOT NULL 
            AND vc.age_in_months >= 3 AND vc.age_in_months <= 5)
        ) AS children_3_5m_to_catch_up_Penta3,  

        (COUNT(vc.*) FILTER (WHERE vc.vaccine_PENTA_3 IS TRUE AND vc.age_in_months IS NOT NULL 
            AND vc.age_in_months >= 3 AND vc.age_in_months <= 5)
        ) AS children_3_5m_caught_up_Penta3,  

        (COUNT(vc.*) FILTER (WHERE (vc.vaccine_VAR_2 IS TRUE OR vc.vaccine_VAA IS TRUE) AND vc.age_in_months IS NOT NULL 
            AND vc.age_in_months >= 9 AND vc.age_in_months <= 11)
        ) AS children_9_11m_fully_vaccinated_VAR_VAA,  
        
        (COUNT(vc.*) FILTER (WHERE vc.is_birth_vaccine_ok IS NOT TRUE AND vc.is_six_weeks_vaccine_ok IS NOT TRUE AND vc.is_ten_weeks_vaccine_ok IS NOT TRUE AND vc.is_forteen_weeks_vaccine_ok IS NOT TRUE 
            AND vc.is_nine_months_vaccine_ok IS NOT TRUE AND vc.is_fifty_months_vaccine_ok IS NOT TRUE AND vc.age_in_months IS NOT NULL AND vc.age_in_months >= 0 AND vc.age_in_months < 60)
        ) AS zero_dose_children_to_catch_up,  

        (COUNT(vc.*) FILTER (WHERE vc.age_in_months IS NOT NULL AND vc.age_in_months >= 0 AND vc.age_in_months < 60 AND (
            vc.is_birth_vaccine_ok IS TRUE OR vc.is_six_weeks_vaccine_ok IS TRUE OR vc.is_ten_weeks_vaccine_ok IS TRUE 
            OR vc.is_forteen_weeks_vaccine_ok IS TRUE OR vc.is_nine_months_vaccine_ok IS TRUE OR vc.is_fifty_months_vaccine_ok IS TRUE))
        ) AS zero_dose_children_caught_up



    FROM year_month_reco_grid_view a

        LEFT JOIN vaccination_data_view vc ON vc.reco_id = a.reco_id AND vc.month = a.month AND vc.year = a.year


    GROUP BY a.reco_id, a.month, a.year;