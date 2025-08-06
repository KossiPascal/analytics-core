CREATE MATERIALIZED VIEW IF NOT EXISTS report_promotional_view AS
    SELECT 
        CONCAT(a.month, '-', a.year, '-', a.reco_id) AS id,
        a.month,
        a.year,
        a.reco_id,

        (COUNT(p.*) FILTER (WHERE p.is_vad_method IS TRUE)) AS home_visits,
        (SUM(CASE WHEN p.men_number IS NOT NULL THEN p.men_number ELSE 0 END) FILTER (WHERE p.is_vad_method IS TRUE)) AS men_reached_home_visits,
        (SUM(CASE WHEN p.women_number IS NOT NULL THEN p.women_number ELSE 0 END) FILTER (WHERE p.is_vad_method IS TRUE)) AS women_reached_home_visits,
        
        (COUNT(p.*) FILTER (WHERE p.is_talk_method IS TRUE)) AS educational_talks,
        (SUM(CASE WHEN p.men_number IS NOT NULL THEN p.men_number ELSE 0 END) FILTER (WHERE p.is_talk_method IS TRUE)) AS men_reached_educational_talks,
        (SUM(CASE WHEN p.women_number IS NOT NULL THEN p.women_number ELSE 0 END) FILTER (WHERE p.is_talk_method IS TRUE)) AS women_reached_educational_talks,
        
        (COUNT(p.*) FILTER (WHERE p.is_interpersonal_talk_method IS TRUE)) AS interpersonal_talks,
        (SUM(CASE WHEN p.men_number IS NOT NULL THEN p.men_number ELSE 0 END) FILTER (WHERE p.is_interpersonal_talk_method IS TRUE)) AS men_reached_interpersonal_talks,
        (SUM(CASE WHEN p.women_number IS NOT NULL THEN p.women_number ELSE 0 END) FILTER (WHERE p.is_interpersonal_talk_method IS TRUE)) AS women_reached_interpersonal_talks,

        (COUNT(p.*) FILTER (WHERE p.is_malaria_theme IS TRUE)) AS malaria,
        (COUNT(p.*) FILTER (WHERE p.is_family_planning_theme IS TRUE)) AS family_planning,
        (COUNT(p.*) FILTER (WHERE p.is_prenatal_consultation_theme IS TRUE)) AS prenatal_consultation,
        (COUNT(p.*) FILTER (WHERE p.is_post_natal_theme IS TRUE)) AS postnatal_care,
        (COUNT(p.*) FILTER (WHERE p.is_delivery_theme IS TRUE)) AS delivery,
        (COUNT(p.*) FILTER (WHERE p.is_vaccination_theme IS TRUE)) AS vaccination,
        (COUNT(p.*) FILTER (WHERE p.is_disease_control_domain IS TRUE)) AS disease_control,
        (COUNT(p.*) FILTER (WHERE p.is_tuberculosis_theme IS TRUE)) AS tuberculosis,
        (COUNT(p.*) FILTER (WHERE p.is_nutrition_domain IS TRUE)) AS nutrition,
        (COUNT(p.*) FILTER (WHERE p.is_water_hygiene_domain IS TRUE)) AS water_hygiene,
        (COUNT(p.*) FILTER (WHERE p.is_gbv_domain IS TRUE)) AS gbv,
        (COUNT(p.*) FILTER (WHERE p.is_female_genital_mutilation_theme IS TRUE)) AS female_genital_mutilation,
        (COUNT(p.*) FILTER (WHERE p.is_diarrhea_theme IS TRUE)) AS diarrhea,
        (COUNT(p.*) FILTER (WHERE p.is_pneumonia_theme IS TRUE)) AS pneumonia,
        (COUNT(p.*) FILTER (WHERE p.is_birth_registration_theme IS TRUE)) AS birth_registration,
        (COUNT(p.*) FILTER (WHERE p.is_leprosy_theme IS TRUE)) AS leprosy,
        (COUNT(p.*) FILTER (WHERE p.is_urine_loss_theme IS TRUE)) AS urine_loss,
        (COUNT(p.*) FILTER (WHERE p.is_diabetes_theme IS TRUE)) AS diabetes,
        (COUNT(p.*) FILTER (WHERE p.is_blood_pressure_theme IS TRUE)) AS blood_pressure,
        (COUNT(p.*) FILTER (WHERE p.is_onchocerciasis_theme IS TRUE)) AS onchocerciasis,
        (COUNT(p.*) FILTER (WHERE p.is_human_african_trypanosomiasis_theme IS TRUE)) AS sleeping_sickness,
        (COUNT(p.*) FILTER (WHERE p.is_pfa_theme IS TRUE)) AS pfa,
        (COUNT(p.*) FILTER (WHERE p.is_bloody_diarrhea_theme IS TRUE)) AS bloody_diarrhea,
        (COUNT(p.*) FILTER (WHERE p.is_yellow_fever_theme IS TRUE)) AS yellow_fever,
        (COUNT(p.*) FILTER (WHERE p.is_cholera_theme IS TRUE)) AS cholera,
        (COUNT(p.*) FILTER (WHERE p.is_tetanus_theme IS TRUE)) AS maternal_neonatal_tetanus,
        (COUNT(p.*) FILTER (WHERE p.is_viral_diseases_theme IS TRUE)) AS viral_diseases,
        (COUNT(p.*) FILTER (WHERE p.is_meningitis_theme IS TRUE)) AS meningitis


    FROM year_month_reco_grid_view a
    
    LEFT JOIN promotional_data_view p ON p.reco_id = a.reco_id AND p.month = a.month AND p.year = a.year

    GROUP BY a.reco_id, a.month, a.year;
