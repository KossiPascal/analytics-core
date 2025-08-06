CREATE MATERIALIZED VIEW IF NOT EXISTS report_adults_view AS
    SELECT 
        CONCAT(a.month, '-', a.year, '-', a.reco_id) AS id,
        a.month,
        a.year,
        a.reco_id,

        (COUNT(d.*) FILTER (WHERE d.traffic_accident IS TRUE)) AS road_accident_cases_reported,
        (COUNT(d.*) FILTER (WHERE d.burns IS TRUE)) AS burn_cases_reported,
        (COUNT(d.*) FILTER (WHERE d.suspected_tb IS TRUE)) AS suspected_tb_cases_referred,
        (COUNT(d.*) FILTER (WHERE d.dermatosis IS TRUE)) AS dermatosis_cases_referred,
        (COUNT(d.*) FILTER (WHERE d.diarrhea IS TRUE AND d.is_referred IS TRUE)) AS diarrhea_cases_over_5_referred,
        (COUNT(d.*) FILTER (WHERE d.urethral_discharge IS TRUE AND d.is_referred IS TRUE)) AS urethral_discharge_cases_referred,
        (COUNT(d.*) FILTER (WHERE d.vaginal_discharge IS TRUE AND d.is_referred IS TRUE)) AS vaginal_discharge_cases_referred,
        (COUNT(d.*) FILTER (WHERE d.loss_of_urine IS TRUE AND d.is_referred IS TRUE)) AS urine_loss_cases_referred,
        (COUNT(d.*) FILTER (WHERE d.accidental_ingestion_caustic_products IS TRUE AND d.is_referred IS TRUE)) AS caustic_ingestion_cases_referred,
        (COUNT(d.*) FILTER (WHERE d.food_poisoning IS TRUE AND d.is_referred IS TRUE)) AS food_poisoning_cases_referred,
        (COUNT(d.*) FILTER (WHERE d.oral_and_dental_diseases IS TRUE AND d.is_referred IS TRUE)) AS oral_dental_disease_cases_referred,
        (COUNT(d.*) FILTER (WHERE d.dog_bites IS TRUE AND d.is_referred IS TRUE)) AS dog_bite_cases_referred,
        (COUNT(d.*) FILTER (WHERE d.snake_bite IS TRUE AND d.is_referred IS TRUE)) AS snake_bite_cases_referred,
        (COUNT(d.*) FILTER (WHERE d.measles IS TRUE AND d.is_referred IS TRUE)) AS measles_cases_referred,
        (COUNT(d.*) FILTER (WHERE d.gender_based_violence IS TRUE AND d.is_referred IS TRUE)) AS gbv_cases_referred,
 
        (COUNT(d.*) FILTER (WHERE d.rdt_given IS TRUE)) AS rdt_done,
        (COUNT(d.*) FILTER (WHERE d.rdt_given IS TRUE AND d.rdt_result = 'positive')) AS rdt_positive,
        (COUNT(d.*) FILTER (WHERE d.has_malaria IS TRUE AND (
            (d.cta_nn IS NOT NULL AND d.cta_nn > 0) OR 
            (d.cta_pe IS NOT NULL AND d.cta_pe > 0) OR 
            (d.cta_ge IS NOT NULL AND d.cta_ge > 0) OR 
            (d.cta_ad IS NOT NULL AND d.cta_ad > 0)
        ))) AS malaria_cases_treated_with_act,
        (COUNT(d.*) FILTER (WHERE d.has_malaria IS TRUE AND d.is_referred IS TRUE)) AS malaria_cases_referred,
        (COUNT(d.*) FILTER (WHERE d.has_malaria IS TRUE AND d.age_in_months IS NOT NULL AND d.age_in_months >= 60)) AS malaria_deaths_reported


    FROM year_month_reco_grid_view a

        LEFT JOIN adult_data_view d ON d.reco_id = a.reco_id AND d.month = a.month AND d.year = a.year

    GROUP BY a.reco_id, a.month, a.year;
