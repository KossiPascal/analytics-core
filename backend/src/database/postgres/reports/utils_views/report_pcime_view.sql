CREATE MATERIALIZED VIEW IF NOT EXISTS report_pcime_view AS
    SELECT 
        CONCAT(a.month, '-', a.year, '-', a.reco_id) AS id,
        a.month,
        a.year,
        a.reco_id,

        
        (SUM(0)) AS children_6_59m_referred_vitamin_A,

        (COUNT(DISTINCT p.patient_id) FILTER (WHERE p.age_in_months >= 6 AND p.has_malnutrition IS TRUE AND (p.has_modere_malnutrition IS TRUE OR p.has_severe_malnutrition IS TRUE))) AS PB_6_59m_under_125mm,
        
        (COUNT(DISTINCT p.patient_id) FILTER (WHERE p.age_in_months >= 6 AND p.has_malnutrition IS TRUE AND p.is_referred IS TRUE)) AS malnutrition_6_59m_risk_referred,  
        
        (COUNT(DISTINCT p.patient_id) FILTER (WHERE p.age_in_months >= 2 AND p.has_diarrhea IS TRUE AND ((p.ors IS NOT NULL AND p.ors > 0) OR (p.zinc IS NOT NULL AND p.zinc > 0)))) AS diarrhea_0_59m_received_SRO_Zinc,
        

        (COUNT(DISTINCT p.patient_id) FILTER (WHERE p.patient_id IS NOT NULL AND p.has_diarrhea IS TRUE)) AS diarrhea_cases,

        (COUNT(DISTINCT p.patient_id) FILTER (WHERE p.patient_id IS NOT NULL AND p.has_malnutrition IS TRUE)) AS screened_malnutrition,

        (COUNT(p.*) FILTER (WHERE p.rdt_given IS TRUE)) AS malaria_rdt_done,

        (COUNT(p.*) FILTER (WHERE p.rdt_given IS TRUE AND p.has_malaria IS TRUE)) AS malaria_rdt_positive,

        (COUNT(p.*) FILTER (WHERE p.rdt_given IS TRUE AND p.has_malaria IS TRUE AND ((p.cta_nn IS NOT NULL AND p.cta_nn > 0) OR (p.cta_pe IS NOT NULL AND p.cta_pe > 0) OR (p.cta_ge IS NOT NULL AND p.cta_ge > 0) OR (p.cta_ad IS NOT NULL AND p.cta_ad > 0)))) AS cases_treated_with_cta,
 
        (COUNT(p.*) FILTER (WHERE p.rdt_given IS TRUE AND p.has_malaria IS TRUE AND p.is_principal_referal IS TRUE AND p.has_serious_malaria IS TRUE)) AS severe_malaria_cases_referred,

        (COUNT(p.*) FILTER (WHERE p.has_diarrhea IS TRUE)) AS diarrhea_cases_recorded,

        
        (COUNT(p.*) FILTER (WHERE p.has_diarrhea IS TRUE AND p.is_referred IS TRUE)) AS diarrhea_cases_referred,

        (COUNT(p.*) FILTER (WHERE p.has_diarrhea IS TRUE AND ((p.ors IS NOT NULL AND p.ors > 0) OR (p.zinc IS NOT NULL AND p.zinc > 0)))) AS diarrhea_cases_treated_with_sro_zinc,

        (COUNT(p.*) FILTER (WHERE p.has_pneumonia IS TRUE)) AS pneumonia_cough_cold_cases,

        (COUNT(p.*) FILTER (WHERE (p.has_pneumonia IS TRUE OR p.has_cough_cold IS TRUE) AND ((p.amoxicillin_250mg IS NOT NULL AND p.amoxicillin_250mg > 0) OR (p.amoxicillin_500mg IS NOT NULL AND p.amoxicillin_500mg > 0)))) AS pneumonia_cough_cold_cases_treated_amoxicillin,

        (COUNT(DISTINCT p.patient_id) FILTER (WHERE p.is_referred IS TRUE AND (p.has_pneumonia IS TRUE OR p.has_cough_cold IS TRUE))) AS pneumonia_cough_cold_cases_referred,

        (SUM(0)) AS pre_referral_treatments_rectocaps,

        (SUM(0)) AS referred_6_59m_vitamin_A


    FROM year_month_reco_grid_view a
    
        LEFT JOIN pcimne_data_view p ON p.reco_id = a.reco_id AND p.month = a.month AND p.year = a.year
       

    GROUP BY a.reco_id, a.month, a.year;