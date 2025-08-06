CREATE MATERIALIZED VIEW IF NOT EXISTS reports_pcime_newborn_view AS 
    SELECT 
        CONCAT(a.month, '-', a.year, '-', a.reco_id) AS id,
        a.month,
        a.year,
        a.reco_id,

        jsonb_build_object(
            'index', 1, 
            'indicator', 'Nombre de cas reçu', 
            'malaria_0_2',jsonb_build_object(
                'F', COUNT(nb.*) FILTER (WHERE nb.sex = 'F' AND (nb.has_malaria IS TRUE)), -- OR nb.has_fever IS TRUE
                'M', COUNT(nb.*) FILTER (WHERE nb.sex = 'M' AND (nb.has_malaria IS TRUE)) --  OR nb.has_fever IS TRUE
            ),
            'malaria_2_12',jsonb_build_object(
                'F', COUNT(pc.*) FILTER (WHERE pc.sex = 'F' AND (pc.has_malaria IS TRUE OR pc.has_fever IS TRUE) AND pc.age_in_months < 12),
                'M', COUNT(pc.*) FILTER (WHERE pc.sex = 'M' AND (pc.has_malaria IS TRUE OR pc.has_fever IS TRUE) AND pc.age_in_months < 12)
            ),
            'malaria_12_60',jsonb_build_object(
                'F', COUNT(pc.*) FILTER (WHERE pc.sex = 'F' AND (pc.has_malaria IS TRUE OR pc.has_fever IS TRUE) AND pc.age_in_months >= 12),
                'M', COUNT(pc.*) FILTER (WHERE pc.sex = 'M' AND (pc.has_malaria IS TRUE OR pc.has_fever IS TRUE) AND pc.age_in_months >= 12)
            ),
            'cough_pneumonia_0_2',jsonb_build_object(
                'F', COUNT(nb.*) FILTER (WHERE nb.sex = 'F' AND (nb.has_cough_cold IS TRUE OR nb.has_pneumonia IS TRUE)),
                'M', COUNT(nb.*) FILTER (WHERE nb.sex = 'M' AND (nb.has_cough_cold IS TRUE OR nb.has_pneumonia IS TRUE))
            ),
            'cough_pneumonia_2_12',jsonb_build_object(
                'F', COUNT(pc.*) FILTER (WHERE pc.sex = 'F' AND (pc.has_cough_cold IS TRUE OR pc.has_pneumonia IS TRUE) AND pc.age_in_months < 12),
                'M', COUNT(pc.*) FILTER (WHERE pc.sex = 'M' AND (pc.has_cough_cold IS TRUE OR pc.has_pneumonia IS TRUE) AND pc.age_in_months < 12)
            ),
            'cough_pneumonia_12_60',jsonb_build_object(
                'F', COUNT(pc.*) FILTER (WHERE pc.sex = 'F' AND (pc.has_cough_cold IS TRUE OR pc.has_pneumonia IS TRUE) AND pc.age_in_months >= 12),
                'M', COUNT(pc.*) FILTER (WHERE pc.sex = 'M' AND (pc.has_cough_cold IS TRUE OR pc.has_pneumonia IS TRUE) AND pc.age_in_months >= 12)
            ),
            'diarrhea_0_2',jsonb_build_object(
                'F', COUNT(nb.*) FILTER (WHERE nb.sex = 'F' AND nb.has_diarrhea IS TRUE),
                'M', COUNT(nb.*) FILTER (WHERE nb.sex = 'M' AND nb.has_diarrhea IS TRUE)
            ),
            'diarrhea_2_12',jsonb_build_object(
                'F', COUNT(pc.*) FILTER (WHERE pc.sex = 'F' AND pc.has_diarrhea IS TRUE AND pc.age_in_months < 12),
                'M', COUNT(pc.*) FILTER (WHERE pc.sex = 'M' AND pc.has_diarrhea IS TRUE AND pc.age_in_months < 12)
            ),
            'diarrhea_12_60',jsonb_build_object(
                'F', COUNT(pc.*) FILTER (WHERE pc.sex = 'F' AND pc.has_diarrhea IS TRUE AND pc.age_in_months >= 12),
                'M', COUNT(pc.*) FILTER (WHERE pc.sex = 'M' AND pc.has_diarrhea IS TRUE AND pc.age_in_months >= 12)
            ),
            'malnutrition_0_2',jsonb_build_object(
                'F', COUNT(nb.*) FILTER (WHERE nb.sex = 'F' AND nb.has_malnutrition IS TRUE),
                'M', COUNT(nb.*) FILTER (WHERE nb.sex = 'M' AND nb.has_malnutrition IS TRUE)
            ),
            'malnutrition_2_12',jsonb_build_object(
                'F', COUNT(pc.*) FILTER (WHERE pc.sex = 'F' AND pc.has_malnutrition IS TRUE AND pc.age_in_months < 12),
                'M', COUNT(pc.*) FILTER (WHERE pc.sex = 'M' AND pc.has_malnutrition IS TRUE AND pc.age_in_months < 12)
            ),
            'malnutrition_12_60',jsonb_build_object(
                'F', COUNT(pc.*) FILTER (WHERE pc.sex = 'F' AND pc.has_malnutrition IS TRUE AND pc.age_in_months >= 12),
                'M', COUNT(pc.*) FILTER (WHERE pc.sex = 'M' AND pc.has_malnutrition IS TRUE AND pc.age_in_months >= 12)
            )
        ) AS cases_received,

        jsonb_build_object(
            'index', 2, 
            'indicator', 'Nombre de TDR effectué', 
            'malaria_0_2',jsonb_build_object('F', NULL,'M', NULL),
            'malaria_2_12',jsonb_build_object(
                'F', COUNT(pc.*) FILTER (WHERE pc.sex = 'F' AND pc.rdt_given IS TRUE AND (pc.has_malaria IS TRUE OR pc.has_fever IS TRUE) AND pc.age_in_months < 12),
                'M', COUNT(pc.*) FILTER (WHERE pc.sex = 'M' AND pc.rdt_given IS TRUE AND (pc.has_malaria IS TRUE OR pc.has_fever IS TRUE) AND pc.age_in_months < 12)
            ),
            'malaria_12_60',jsonb_build_object(
                'F', COUNT(pc.*) FILTER (WHERE pc.sex = 'F' AND pc.rdt_given IS TRUE AND (pc.has_malaria IS TRUE OR pc.has_fever IS TRUE) AND pc.age_in_months >= 12),
                'M', COUNT(pc.*) FILTER (WHERE pc.sex = 'M' AND pc.rdt_given IS TRUE AND (pc.has_malaria IS TRUE OR pc.has_fever IS TRUE) AND pc.age_in_months >= 12)
            ),
            'cough_pneumonia_0_2',jsonb_build_object('F', NULL,'M', NULL),
            'cough_pneumonia_2_12',jsonb_build_object('F', NULL,'M', NULL),
            'cough_pneumonia_12_60',jsonb_build_object('F', NULL,'M', NULL),
            'diarrhea_0_2',jsonb_build_object('F', NULL,'M', NULL),
            'diarrhea_2_12',jsonb_build_object('F', NULL,'M', NULL),
            'diarrhea_12_60',jsonb_build_object('F', NULL,'M', NULL),
            'malnutrition_0_2',jsonb_build_object('F', NULL,'M', NULL),
            'malnutrition_2_12',jsonb_build_object('F', NULL,'M', NULL),
            'malnutrition_12_60',jsonb_build_object('F', NULL,'M', NULL)
        ) AS given_rdt,

        jsonb_build_object(
            'index', 3, 
            'indicator', 'Nombre de TDR positif', 
            'malaria_0_2',jsonb_build_object('F', NULL,'M', NULL),
            'malaria_2_12',jsonb_build_object(
                'F', COUNT(pc.*) FILTER (WHERE pc.sex = 'F' AND pc.rdt_result = 'positive' AND (pc.has_malaria IS TRUE OR pc.has_fever IS TRUE) AND pc.age_in_months < 12),
                'M', COUNT(pc.*) FILTER (WHERE pc.sex = 'M' AND pc.rdt_result = 'positive' AND (pc.has_malaria IS TRUE OR pc.has_fever IS TRUE) AND pc.age_in_months < 12)
            ),
            'malaria_12_60',jsonb_build_object(
                'F', COUNT(pc.*) FILTER (WHERE pc.sex = 'F' AND pc.rdt_result = 'positive' AND (pc.has_malaria IS TRUE OR pc.has_fever IS TRUE) AND pc.age_in_months >= 12),
                'M', COUNT(pc.*) FILTER (WHERE pc.sex = 'M' AND pc.rdt_result = 'positive' AND (pc.has_malaria IS TRUE OR pc.has_fever IS TRUE) AND pc.age_in_months >= 12)
            ),
            'cough_pneumonia_0_2',jsonb_build_object('F', NULL,'M', NULL),
            'cough_pneumonia_2_12',jsonb_build_object('F', NULL,'M', NULL),
            'cough_pneumonia_12_60',jsonb_build_object('F', NULL,'M', NULL),
            'diarrhea_0_2',jsonb_build_object('F', NULL,'M', NULL),
            'diarrhea_2_12',jsonb_build_object('F', NULL,'M', NULL),
            'diarrhea_12_60',jsonb_build_object('F', NULL,'M', NULL),
            'malnutrition_0_2',jsonb_build_object('F', NULL,'M', NULL),
            'malnutrition_2_12',jsonb_build_object('F', NULL,'M', NULL),
            'malnutrition_12_60',jsonb_build_object('F', NULL,'M', NULL)
        ) AS positive_rdt,

        jsonb_build_object(
            'index', 4, 
            'indicator', 'Nombre de cas traités avec CTA', 
            'malaria_0_2',jsonb_build_object('F', NULL,'M', NULL),
            'malaria_2_12',jsonb_build_object(
                'F', COUNT(pc.*) FILTER (WHERE pc.sex = 'F' AND (COALESCE(pc.cta_nn,0)> 0 OR COALESCE(pc.cta_pe,0)> 0 OR COALESCE(pc.cta_ge,0)> 0 OR COALESCE(pc.cta_ad,0)> 0) AND (pc.has_malaria IS TRUE OR pc.has_fever IS TRUE) AND pc.age_in_months < 12),
                'M', COUNT(pc.*) FILTER (WHERE pc.sex = 'M' AND (COALESCE(pc.cta_nn,0)> 0 OR COALESCE(pc.cta_pe,0)> 0 OR COALESCE(pc.cta_ge,0)> 0 OR COALESCE(pc.cta_ad,0)> 0) AND (pc.has_malaria IS TRUE OR pc.has_fever IS TRUE) AND pc.age_in_months < 12)
            ),
            'malaria_12_60',jsonb_build_object(
                'F', COUNT(pc.*) FILTER (WHERE pc.sex = 'F' AND (COALESCE(pc.cta_nn,0)> 0 OR COALESCE(pc.cta_pe,0)> 0 OR COALESCE(pc.cta_ge,0)> 0 OR COALESCE(pc.cta_ad,0)> 0) AND (pc.has_malaria IS TRUE OR pc.has_fever IS TRUE) AND pc.age_in_months >= 12),
                'M', COUNT(pc.*) FILTER (WHERE pc.sex = 'M' AND (COALESCE(pc.cta_nn,0)> 0 OR COALESCE(pc.cta_pe,0)> 0 OR COALESCE(pc.cta_ge,0)> 0 OR COALESCE(pc.cta_ad,0)> 0) AND (pc.has_malaria IS TRUE OR pc.has_fever IS TRUE) AND pc.age_in_months >= 12)
            ),
            'cough_pneumonia_0_2',jsonb_build_object('F', NULL,'M', NULL),
            'cough_pneumonia_2_12',jsonb_build_object('F', NULL,'M', NULL),
            'cough_pneumonia_12_60',jsonb_build_object('F', NULL,'M', NULL),
            'diarrhea_0_2',jsonb_build_object('F', NULL,'M', NULL),
            'diarrhea_2_12',jsonb_build_object('F', NULL,'M', NULL),
            'diarrhea_12_60',jsonb_build_object('F', NULL,'M', NULL),
            'malnutrition_0_2',jsonb_build_object('F', NULL,'M', NULL),
            'malnutrition_2_12',jsonb_build_object('F', NULL,'M', NULL),
            'malnutrition_12_60',jsonb_build_object('F', NULL,'M', NULL)
        ) AS case_cta_treated,

        jsonb_build_object(
            'index', 5, 
            'indicator', 'Nombre de cas traités avec Amoxicilline', 
            'malaria_0_2',jsonb_build_object('F', NULL,'M', NULL),
            'malaria_2_12',jsonb_build_object('F', NULL,'M', NULL),
            'malaria_12_60',jsonb_build_object('F', NULL,'M', NULL),
            'cough_pneumonia_0_2',jsonb_build_object('F', NULL,'M', NULL),
            'cough_pneumonia_2_12',jsonb_build_object(
                'F', COUNT(pc.*) FILTER (WHERE pc.sex = 'F' AND (COALESCE(pc.amoxicillin_250mg,0)> 0 OR COALESCE(pc.amoxicillin_500mg,0)> 0) AND (pc.has_cough_cold IS TRUE OR pc.has_pneumonia IS TRUE) AND pc.age_in_months < 12),
                'M', COUNT(pc.*) FILTER (WHERE pc.sex = 'M' AND (COALESCE(pc.amoxicillin_250mg,0)> 0 OR COALESCE(pc.amoxicillin_500mg,0)> 0) AND (pc.has_cough_cold IS TRUE OR pc.has_pneumonia IS TRUE) AND pc.age_in_months < 12)
            ),
            'cough_pneumonia_12_60',jsonb_build_object(
                'F', COUNT(pc.*) FILTER (WHERE pc.sex = 'F' AND (COALESCE(pc.amoxicillin_250mg,0)> 0 OR COALESCE(pc.amoxicillin_500mg,0)> 0) AND (pc.has_cough_cold IS TRUE OR pc.has_pneumonia IS TRUE) AND pc.age_in_months >= 12),
                'M', COUNT(pc.*) FILTER (WHERE pc.sex = 'M' AND (COALESCE(pc.amoxicillin_250mg,0)> 0 OR COALESCE(pc.amoxicillin_500mg,0)> 0) AND (pc.has_cough_cold IS TRUE OR pc.has_pneumonia IS TRUE) AND pc.age_in_months >= 12)
            ),
            'diarrhea_0_2',jsonb_build_object('F', NULL,'M', NULL),
            'diarrhea_2_12',jsonb_build_object('F', NULL,'M', NULL),
            'diarrhea_12_60',jsonb_build_object('F', NULL,'M', NULL),
            'malnutrition_0_2',jsonb_build_object('F', NULL,'M', NULL),
            'malnutrition_2_12',jsonb_build_object('F', NULL,'M', NULL),
            'malnutrition_12_60',jsonb_build_object('F', NULL,'M', NULL)
        ) AS case_amoxicilline_treated,

        jsonb_build_object(
            'index', 6, 
            'indicator', 'Nombre de cas traités avec SRO et ZINC', 
            'malaria_0_2',jsonb_build_object('F', NULL,'M', NULL),
            'malaria_2_12',jsonb_build_object('F', NULL,'M', NULL),
            'malaria_12_60',jsonb_build_object('F', NULL,'M', NULL),
            'cough_pneumonia_0_2',jsonb_build_object('F', NULL,'M', NULL),
            'cough_pneumonia_2_12',jsonb_build_object('F', NULL,'M', NULL),
            'cough_pneumonia_12_60',jsonb_build_object('F', NULL,'M', NULL),
            'diarrhea_0_2',jsonb_build_object('F', NULL,'M', NULL),
            'diarrhea_2_12',jsonb_build_object(
                'F', COUNT(pc.*) FILTER (WHERE pc.sex = 'F' AND (COALESCE(pc.ors,0)> 0 OR COALESCE(pc.zinc,0)> 0) AND pc.has_diarrhea IS TRUE AND pc.age_in_months < 12),
                'M', COUNT(pc.*) FILTER (WHERE pc.sex = 'M' AND (COALESCE(pc.ors,0)> 0 OR COALESCE(pc.zinc,0)> 0) AND pc.has_diarrhea IS TRUE AND pc.age_in_months < 12)
            ),
            'diarrhea_12_60',jsonb_build_object(
                'F', COUNT(pc.*) FILTER (WHERE pc.sex = 'F' AND (COALESCE(pc.ors,0)> 0 OR COALESCE(pc.zinc,0)> 0) AND pc.has_diarrhea IS TRUE AND pc.age_in_months >= 12),
                'M', COUNT(pc.*) FILTER (WHERE pc.sex = 'M' AND (COALESCE(pc.ors,0)> 0 OR COALESCE(pc.zinc,0)> 0) AND pc.has_diarrhea IS TRUE AND pc.age_in_months >= 12)
            ),
            'malnutrition_0_2',jsonb_build_object('F', NULL,'M', NULL),
            'malnutrition_2_12',jsonb_build_object('F', NULL,'M', NULL),
            'malnutrition_12_60',jsonb_build_object('F', NULL,'M', NULL)
        ) AS case_ors_zinc_treated,

        jsonb_build_object(
            'index', 7, 
            'indicator', 'Nombre de cas traités avec  Paracetamol', 
            'malaria_0_2',jsonb_build_object('F', NULL,'M', NULL),
            'malaria_2_12',jsonb_build_object(
                'F', COUNT(pc.*) FILTER (WHERE pc.sex = 'F' AND (COALESCE(pc.paracetamol_100mg,0)> 0 OR COALESCE(pc.paracetamol_250mg,0)> 0 OR COALESCE(pc.paracetamol_500mg,0)> 0) AND (pc.has_malaria IS TRUE OR pc.has_fever IS TRUE) AND pc.age_in_months < 12),
                'M', COUNT(pc.*) FILTER (WHERE pc.sex = 'M' AND (COALESCE(pc.paracetamol_100mg,0)> 0 OR COALESCE(pc.paracetamol_250mg,0)> 0 OR COALESCE(pc.paracetamol_500mg,0)> 0) AND (pc.has_malaria IS TRUE OR pc.has_fever IS TRUE) AND pc.age_in_months < 12)
            ),
            'malaria_12_60',jsonb_build_object(
                'F', COUNT(pc.*) FILTER (WHERE pc.sex = 'F' AND (COALESCE(pc.paracetamol_100mg,0)> 0 OR COALESCE(pc.paracetamol_250mg,0)> 0 OR COALESCE(pc.paracetamol_500mg,0)> 0) AND (pc.has_malaria IS TRUE OR pc.has_fever IS TRUE) AND pc.age_in_months >= 12),
                'M', COUNT(pc.*) FILTER (WHERE pc.sex = 'M' AND (COALESCE(pc.paracetamol_100mg,0)> 0 OR COALESCE(pc.paracetamol_250mg,0)> 0 OR COALESCE(pc.paracetamol_500mg,0)> 0) AND (pc.has_malaria IS TRUE OR pc.has_fever IS TRUE) AND pc.age_in_months >= 12)
            ),
            'cough_pneumonia_0_2',jsonb_build_object('F', NULL,'M', NULL),
            'cough_pneumonia_2_12',jsonb_build_object('F', NULL,'M', NULL),
            'cough_pneumonia_12_60',jsonb_build_object('F', NULL,'M', NULL),
            'diarrhea_0_2',jsonb_build_object('F', NULL,'M', NULL),
            'diarrhea_2_12',jsonb_build_object('F', NULL,'M', NULL),
            'diarrhea_12_60',jsonb_build_object('F', NULL,'M', NULL),
            'malnutrition_0_2',jsonb_build_object('F', NULL,'M', NULL),
            'malnutrition_2_12',jsonb_build_object('F', NULL,'M', NULL),
            'malnutrition_12_60',jsonb_build_object('F', NULL,'M', NULL)
        ) AS case_paracetamol_treated,

        jsonb_build_object(
            'index', 8, 
            'indicator', 'Nombre de cas traités dans les 24 H', 
            'malaria_0_2',jsonb_build_object('F', NULL,'M', NULL),
            'malaria_2_12',jsonb_build_object(
                'F', COUNT(pc.*) FILTER (WHERE pc.sex = 'F' AND CAST(pc.promptitude AS TEXT) = '1' AND (pc.has_malaria IS TRUE OR pc.has_fever IS TRUE) AND pc.age_in_months < 12),
                'M', COUNT(pc.*) FILTER (WHERE pc.sex = 'M' AND CAST(pc.promptitude AS TEXT) = '1' AND (pc.has_malaria IS TRUE OR pc.has_fever IS TRUE) AND pc.age_in_months < 12)
            ),
            'malaria_12_60',jsonb_build_object(
                'F', COUNT(pc.*) FILTER (WHERE pc.sex = 'F' AND CAST(pc.promptitude AS TEXT) = '1' AND (pc.has_malaria IS TRUE OR pc.has_fever IS TRUE) AND pc.age_in_months >= 12),
                'M', COUNT(pc.*) FILTER (WHERE pc.sex = 'M' AND CAST(pc.promptitude AS TEXT) = '1' AND (pc.has_malaria IS TRUE OR pc.has_fever IS TRUE) AND pc.age_in_months >= 12)
            ),
            'cough_pneumonia_0_2',jsonb_build_object('F', NULL,'M', NULL),
            'cough_pneumonia_2_12',jsonb_build_object(
                'F', COUNT(pc.*) FILTER (WHERE pc.sex = 'F' AND CAST(pc.promptitude AS TEXT) = '1' AND (pc.has_cough_cold IS TRUE OR pc.has_pneumonia IS TRUE) AND pc.age_in_months < 12),
                'M', COUNT(pc.*) FILTER (WHERE pc.sex = 'M' AND CAST(pc.promptitude AS TEXT) = '1' AND (pc.has_cough_cold IS TRUE OR pc.has_pneumonia IS TRUE) AND pc.age_in_months < 12)
            ),
            'cough_pneumonia_12_60',jsonb_build_object(
                'F', COUNT(pc.*) FILTER (WHERE pc.sex = 'F' AND CAST(pc.promptitude AS TEXT) = '1' AND (pc.has_cough_cold IS TRUE OR pc.has_pneumonia IS TRUE) AND pc.age_in_months >= 12),
                'M', COUNT(pc.*) FILTER (WHERE pc.sex = 'M' AND CAST(pc.promptitude AS TEXT) = '1' AND (pc.has_cough_cold IS TRUE OR pc.has_pneumonia IS TRUE) AND pc.age_in_months >= 12)
            ),
            'diarrhea_0_2',jsonb_build_object(
                'F', NULL,
                'M', NULL
            ),
            'diarrhea_2_12',jsonb_build_object(
                'F', COUNT(pc.*) FILTER (WHERE pc.sex = 'F' AND CAST(pc.promptitude AS TEXT) = '1' AND pc.has_diarrhea IS TRUE AND pc.age_in_months < 12),
                'M', COUNT(pc.*) FILTER (WHERE pc.sex = 'M' AND CAST(pc.promptitude AS TEXT) = '1' AND pc.has_diarrhea IS TRUE AND pc.age_in_months < 12)
            ),
            'diarrhea_12_60',jsonb_build_object(
                'F', COUNT(pc.*) FILTER (WHERE pc.sex = 'F' AND CAST(pc.promptitude AS TEXT) = '1' AND pc.has_diarrhea IS TRUE AND pc.age_in_months >= 12),
                'M', COUNT(pc.*) FILTER (WHERE pc.sex = 'M' AND CAST(pc.promptitude AS TEXT) = '1' AND pc.has_diarrhea IS TRUE AND pc.age_in_months >= 12)
            ),
            'malnutrition_0_2',jsonb_build_object('F', NULL,'M', NULL),
            'malnutrition_2_12',jsonb_build_object(
                'F', COUNT(pc.*) FILTER (WHERE pc.sex = 'F' AND CAST(pc.promptitude AS TEXT) = '1' AND pc.has_malnutrition IS TRUE AND pc.age_in_months < 12),
                'M', COUNT(pc.*) FILTER (WHERE pc.sex = 'M' AND CAST(pc.promptitude AS TEXT) = '1' AND pc.has_malnutrition IS TRUE AND pc.age_in_months < 12)
            ),
            'malnutrition_12_60',jsonb_build_object(
                'F', COUNT(pc.*) FILTER (WHERE pc.sex = 'F' AND CAST(pc.promptitude AS TEXT) = '1' AND pc.has_malnutrition IS TRUE AND pc.age_in_months >= 12),
                'M', COUNT(pc.*) FILTER (WHERE pc.sex = 'M' AND CAST(pc.promptitude AS TEXT) = '1' AND pc.has_malnutrition IS TRUE AND pc.age_in_months >= 12)
            )
        ) AS case_24h_treated,


        jsonb_build_object(
            'index', 9, 
            'indicator', 'Nombre de visites de suivi réalisées', 
            'malaria_0_2',jsonb_build_object(
                'F', COUNT(nb.*) FILTER (WHERE nb.sex = 'F' AND nb.consultation_followup = 'followup' AND (nb.has_malaria IS TRUE OR nb.t_malaria IS TRUE)), --  OR nb.has_fever IS TRUE
                'M', COUNT(nb.*) FILTER (WHERE nb.sex = 'M' AND nb.consultation_followup = 'followup' AND (nb.has_malaria IS TRUE OR nb.t_malaria IS TRUE)) --  OR nb.has_fever IS TRUE
            ),
            'malaria_2_12',jsonb_build_object(
                'F', COUNT(pc.*) FILTER (WHERE pc.sex = 'F' AND pc.consultation_followup = 'followup' AND (pc.has_malaria IS TRUE OR pc.has_fever IS TRUE OR pc.t_has_malaria IS TRUE OR pc.t_has_fever IS TRUE) AND pc.age_in_months < 12),
                'M', COUNT(pc.*) FILTER (WHERE pc.sex = 'M' AND pc.consultation_followup = 'followup' AND (pc.has_malaria IS TRUE OR pc.has_fever IS TRUE OR pc.t_has_malaria IS TRUE OR pc.t_has_fever IS TRUE) AND pc.age_in_months < 12)
            ),
            'malaria_12_60',jsonb_build_object(
                'F', COUNT(pc.*) FILTER (WHERE pc.sex = 'F' AND pc.consultation_followup = 'followup' AND (pc.has_malaria IS TRUE OR pc.has_fever IS TRUE OR pc.t_has_malaria IS TRUE OR pc.t_has_fever IS TRUE) AND pc.age_in_months >= 12),
                'M', COUNT(pc.*) FILTER (WHERE pc.sex = 'M' AND pc.consultation_followup = 'followup' AND (pc.has_malaria IS TRUE OR pc.has_fever IS TRUE OR pc.t_has_malaria IS TRUE OR pc.t_has_fever IS TRUE) AND pc.age_in_months >= 12)
            ),
            'cough_pneumonia_0_2',jsonb_build_object(
                'F', COUNT(nb.*) FILTER (WHERE nb.sex = 'F' AND nb.consultation_followup = 'followup' AND (nb.has_cough_cold IS TRUE OR nb.has_pneumonia IS TRUE OR nb.t_cough_cold IS TRUE OR nb.t_pneumonia IS TRUE)),
                'M', COUNT(nb.*) FILTER (WHERE nb.sex = 'M' AND nb.consultation_followup = 'followup' AND (nb.has_cough_cold IS TRUE OR nb.has_pneumonia IS TRUE OR nb.t_cough_cold IS TRUE OR nb.t_pneumonia IS TRUE))
            ),
            'cough_pneumonia_2_12',jsonb_build_object(
                'F', COUNT(pc.*) FILTER (WHERE pc.sex = 'F' AND pc.consultation_followup = 'followup' AND (pc.has_cough_cold IS TRUE OR pc.has_pneumonia IS TRUE OR pc.t_has_cough_cold IS TRUE OR pc.t_has_pneumonia IS TRUE) AND pc.age_in_months < 12),
                'M', COUNT(pc.*) FILTER (WHERE pc.sex = 'M' AND pc.consultation_followup = 'followup' AND (pc.has_cough_cold IS TRUE OR pc.has_pneumonia IS TRUE OR pc.t_has_cough_cold IS TRUE OR pc.t_has_pneumonia IS TRUE) AND pc.age_in_months < 12)
            ),
            'cough_pneumonia_12_60',jsonb_build_object(
                'F', COUNT(pc.*) FILTER (WHERE pc.sex = 'F' AND pc.consultation_followup = 'followup' AND (pc.has_cough_cold IS TRUE OR pc.has_pneumonia IS TRUE OR pc.t_has_cough_cold IS TRUE OR pc.t_has_pneumonia IS TRUE) AND pc.age_in_months >= 12),
                'M', COUNT(pc.*) FILTER (WHERE pc.sex = 'M' AND pc.consultation_followup = 'followup' AND (pc.has_cough_cold IS TRUE OR pc.has_pneumonia IS TRUE OR pc.t_has_cough_cold IS TRUE OR pc.t_has_pneumonia IS TRUE) AND pc.age_in_months >= 12)
            ),
            'diarrhea_0_2',jsonb_build_object(
                'F', COUNT(nb.*) FILTER (WHERE nb.sex = 'F' AND nb.consultation_followup = 'followup' AND (nb.has_diarrhea IS TRUE OR nb.t_diarrhea IS TRUE)),
                'M', COUNT(nb.*) FILTER (WHERE nb.sex = 'M' AND nb.consultation_followup = 'followup' AND (nb.has_diarrhea IS TRUE OR nb.t_diarrhea IS TRUE))
            ),
            'diarrhea_2_12',jsonb_build_object(
                'F', COUNT(pc.*) FILTER (WHERE pc.sex = 'F' AND pc.consultation_followup = 'followup' AND (pc.has_diarrhea IS TRUE OR pc.t_has_diarrhea IS TRUE) AND pc.age_in_months < 12),
                'M', COUNT(pc.*) FILTER (WHERE pc.sex = 'M' AND pc.consultation_followup = 'followup' AND (pc.has_diarrhea IS TRUE OR pc.t_has_diarrhea IS TRUE) AND pc.age_in_months < 12)
            ),
            'diarrhea_12_60',jsonb_build_object(
                'F', COUNT(pc.*) FILTER (WHERE pc.sex = 'F' AND pc.consultation_followup = 'followup' AND (pc.has_diarrhea IS TRUE OR pc.t_has_diarrhea IS TRUE) AND pc.age_in_months >= 12),
                'M', COUNT(pc.*) FILTER (WHERE pc.sex = 'M' AND pc.consultation_followup = 'followup' AND (pc.has_diarrhea IS TRUE OR pc.t_has_diarrhea IS TRUE) AND pc.age_in_months >= 12)
            ),
            'malnutrition_0_2',jsonb_build_object(
                'F', COUNT(nb.*) FILTER (WHERE nb.sex = 'F' AND nb.consultation_followup = 'followup' AND (nb.has_malnutrition IS TRUE OR nb.t_malnutrition IS TRUE)),
                'M', COUNT(nb.*) FILTER (WHERE nb.sex = 'M' AND nb.consultation_followup = 'followup' AND (nb.has_malnutrition IS TRUE OR nb.t_malnutrition IS TRUE))
            ),
            'malnutrition_2_12',jsonb_build_object(
                'F', COUNT(pc.*) FILTER (WHERE pc.sex = 'F' AND pc.consultation_followup = 'followup' AND (pc.has_malnutrition IS TRUE OR pc.t_has_malnutrition IS TRUE) AND pc.age_in_months < 12),
                'M', COUNT(pc.*) FILTER (WHERE pc.sex = 'M' AND pc.consultation_followup = 'followup' AND (pc.has_malnutrition IS TRUE OR pc.t_has_malnutrition IS TRUE) AND pc.age_in_months < 12)
            ),
            'malnutrition_12_60',jsonb_build_object(
                'F', COUNT(pc.*) FILTER (WHERE pc.sex = 'F' AND pc.consultation_followup = 'followup' AND (pc.has_malnutrition IS TRUE OR pc.t_has_malnutrition IS TRUE) AND pc.age_in_months >= 12),
                'M', COUNT(pc.*) FILTER (WHERE pc.sex = 'M' AND pc.consultation_followup = 'followup' AND (pc.has_malnutrition IS TRUE OR pc.t_has_malnutrition IS TRUE) AND pc.age_in_months >= 12)
            )
        ) AS followup_made,

        jsonb_build_object(
            'index', 10, 
            'indicator', 'Nombre de traitements de pré-référence (RECTOCAPS)', 
            'malaria_0_2',jsonb_build_object(
                'F', NULL,
                'M', NULL
            ),
            'malaria_2_12',jsonb_build_object(
                'F', COUNT(pc.*) FILTER (WHERE pc.sex = 'F' AND pc.has_pre_reference_treatments IS TRUE AND (pc.has_malaria IS TRUE OR pc.has_fever IS TRUE) AND pc.age_in_months < 12),
                'M', COUNT(pc.*) FILTER (WHERE pc.sex = 'M' AND pc.has_pre_reference_treatments IS TRUE AND (pc.has_malaria IS TRUE OR pc.has_fever IS TRUE) AND pc.age_in_months < 12)
            ),
            'malaria_12_60',jsonb_build_object(
                'F', COUNT(pc.*) FILTER (WHERE pc.sex = 'F' AND pc.has_pre_reference_treatments IS TRUE AND (pc.has_malaria IS TRUE OR pc.has_fever IS TRUE) AND pc.age_in_months >= 12),
                'M', COUNT(pc.*) FILTER (WHERE pc.sex = 'M' AND pc.has_pre_reference_treatments IS TRUE AND (pc.has_malaria IS TRUE OR pc.has_fever IS TRUE) AND pc.age_in_months >= 12)
            ),
            'cough_pneumonia_0_2',jsonb_build_object(
                'F', NULL,
                'M', NULL
            ),
            'cough_pneumonia_2_12',jsonb_build_object(
                'F', COUNT(pc.*) FILTER (WHERE pc.sex = 'F' AND pc.has_pre_reference_treatments IS TRUE AND (pc.has_cough_cold IS TRUE OR pc.has_pneumonia IS TRUE) AND pc.age_in_months < 12),
                'M', COUNT(pc.*) FILTER (WHERE pc.sex = 'M' AND pc.has_pre_reference_treatments IS TRUE AND (pc.has_cough_cold IS TRUE OR pc.has_pneumonia IS TRUE) AND pc.age_in_months < 12)
            ),
            'cough_pneumonia_12_60',jsonb_build_object(
                'F', COUNT(pc.*) FILTER (WHERE pc.sex = 'F' AND pc.has_pre_reference_treatments IS TRUE AND (pc.has_cough_cold IS TRUE OR pc.has_pneumonia IS TRUE) AND pc.age_in_months >= 12),
                'M', COUNT(pc.*) FILTER (WHERE pc.sex = 'M' AND pc.has_pre_reference_treatments IS TRUE AND (pc.has_cough_cold IS TRUE OR pc.has_pneumonia IS TRUE) AND pc.age_in_months >= 12)
            ),
            'diarrhea_0_2',jsonb_build_object(
                'F', NULL,
                'M', NULL
            ),
            'diarrhea_2_12',jsonb_build_object(
                'F', COUNT(pc.*) FILTER (WHERE pc.sex = 'F' AND pc.has_pre_reference_treatments IS TRUE AND pc.has_diarrhea IS TRUE AND pc.age_in_months < 12),
                'M', COUNT(pc.*) FILTER (WHERE pc.sex = 'M' AND pc.has_pre_reference_treatments IS TRUE AND pc.has_diarrhea IS TRUE AND pc.age_in_months < 12)
            ),
            'diarrhea_12_60',jsonb_build_object(
                'F', COUNT(pc.*) FILTER (WHERE pc.sex = 'F' AND pc.has_pre_reference_treatments IS TRUE AND pc.has_diarrhea IS TRUE AND pc.age_in_months >= 12),
                'M', COUNT(pc.*) FILTER (WHERE pc.sex = 'M' AND pc.has_pre_reference_treatments IS TRUE AND pc.has_diarrhea IS TRUE AND pc.age_in_months >= 12)
            ),
            'malnutrition_0_2',jsonb_build_object(
                'F', NULL,
                'M', NULL
            ),
            'malnutrition_2_12',jsonb_build_object(
                'F', COUNT(pc.*) FILTER (WHERE pc.sex = 'F' AND pc.has_pre_reference_treatments IS TRUE AND pc.has_malnutrition IS TRUE AND pc.age_in_months < 12),
                'M', COUNT(pc.*) FILTER (WHERE pc.sex = 'M' AND pc.has_pre_reference_treatments IS TRUE AND pc.has_malnutrition IS TRUE AND pc.age_in_months < 12)
            ),
            'malnutrition_12_60',jsonb_build_object(
                'F', COUNT(pc.*) FILTER (WHERE pc.sex = 'F' AND pc.has_pre_reference_treatments IS TRUE AND pc.has_malnutrition IS TRUE AND pc.age_in_months >= 12),
                'M', COUNT(pc.*) FILTER (WHERE pc.sex = 'M' AND pc.has_pre_reference_treatments IS TRUE AND pc.has_malnutrition IS TRUE AND pc.age_in_months >= 12)
            )
        ) AS pre_referal_traitment,

        jsonb_build_object(
            'index', 11, 
            'indicator', 'Nombre de cas référés', 
            'malaria_0_2',jsonb_build_object(
                'F', COUNT(nb.*) FILTER (WHERE nb.sex = 'F' AND nb.is_referred IS TRUE AND (nb.has_malaria IS TRUE)), --  OR nb.has_fever IS TRUE
                'M', COUNT(nb.*) FILTER (WHERE nb.sex = 'M' AND nb.is_referred IS TRUE AND (nb.has_malaria IS TRUE)) --  OR nb.has_fever IS TRUE
            ),
            'malaria_2_12',jsonb_build_object(
                'F', COUNT(pc.*) FILTER (WHERE pc.sex = 'F' AND pc.is_referred IS TRUE AND (pc.has_malaria IS TRUE OR pc.has_fever IS TRUE) AND pc.age_in_months < 12),
                'M', COUNT(pc.*) FILTER (WHERE pc.sex = 'M' AND pc.is_referred IS TRUE AND (pc.has_malaria IS TRUE OR pc.has_fever IS TRUE) AND pc.age_in_months < 12)
            ),
            'malaria_12_60',jsonb_build_object(
                'F', COUNT(pc.*) FILTER (WHERE pc.sex = 'F' AND pc.is_referred IS TRUE AND (pc.has_malaria IS TRUE OR pc.has_fever IS TRUE) AND pc.age_in_months >= 12),
                'M', COUNT(pc.*) FILTER (WHERE pc.sex = 'M' AND pc.is_referred IS TRUE AND (pc.has_malaria IS TRUE OR pc.has_fever IS TRUE) AND pc.age_in_months >= 12)
            ),
            'cough_pneumonia_0_2',jsonb_build_object(
                'F', COUNT(nb.*) FILTER (WHERE nb.sex = 'F' AND nb.is_referred IS TRUE AND (nb.has_cough_cold IS TRUE OR nb.has_pneumonia IS TRUE)),
                'M', COUNT(nb.*) FILTER (WHERE nb.sex = 'M' AND nb.is_referred IS TRUE AND (nb.has_cough_cold IS TRUE OR nb.has_pneumonia IS TRUE))
            ),
            'cough_pneumonia_2_12',jsonb_build_object(
                'F', COUNT(pc.*) FILTER (WHERE pc.sex = 'F' AND pc.is_referred IS TRUE AND (pc.has_cough_cold IS TRUE OR pc.has_pneumonia IS TRUE) AND pc.age_in_months < 12),
                'M', COUNT(pc.*) FILTER (WHERE pc.sex = 'M' AND pc.is_referred IS TRUE AND (pc.has_cough_cold IS TRUE OR pc.has_pneumonia IS TRUE) AND pc.age_in_months < 12)
            ),
            'cough_pneumonia_12_60',jsonb_build_object(
                'F', COUNT(pc.*) FILTER (WHERE pc.sex = 'F' AND pc.is_referred IS TRUE AND (pc.has_cough_cold IS TRUE OR pc.has_pneumonia IS TRUE) AND pc.age_in_months >= 12),
                'M', COUNT(pc.*) FILTER (WHERE pc.sex = 'M' AND pc.is_referred IS TRUE AND (pc.has_cough_cold IS TRUE OR pc.has_pneumonia IS TRUE) AND pc.age_in_months >= 12)
            ),
            'diarrhea_0_2',jsonb_build_object(
                'F', COUNT(nb.*) FILTER (WHERE nb.sex = 'F' AND nb.is_referred IS TRUE AND nb.has_diarrhea IS TRUE),
                'M', COUNT(nb.*) FILTER (WHERE nb.sex = 'M' AND nb.is_referred IS TRUE AND nb.has_diarrhea IS TRUE)
            ),
            'diarrhea_2_12',jsonb_build_object(
                'F', COUNT(pc.*) FILTER (WHERE pc.sex = 'F' AND pc.is_referred IS TRUE AND pc.has_diarrhea IS TRUE AND pc.age_in_months < 12),
                'M', COUNT(pc.*) FILTER (WHERE pc.sex = 'M' AND pc.is_referred IS TRUE AND pc.has_diarrhea IS TRUE AND pc.age_in_months < 12)
            ),
            'diarrhea_12_60',jsonb_build_object(
                'F', COUNT(pc.*) FILTER (WHERE pc.sex = 'F' AND pc.is_referred IS TRUE AND pc.has_diarrhea IS TRUE AND pc.age_in_months >= 12),
                'M', COUNT(pc.*) FILTER (WHERE pc.sex = 'M' AND pc.is_referred IS TRUE AND pc.has_diarrhea IS TRUE AND pc.age_in_months >= 12)
            ),
            'malnutrition_0_2',jsonb_build_object(
                'F', COUNT(nb.*) FILTER (WHERE nb.sex = 'F' AND nb.is_referred IS TRUE AND nb.has_malnutrition IS TRUE),
                'M', COUNT(nb.*) FILTER (WHERE nb.sex = 'M' AND nb.is_referred IS TRUE AND nb.has_malnutrition IS TRUE)
            ),
            'malnutrition_2_12',jsonb_build_object(
                'F', COUNT(pc.*) FILTER (WHERE pc.sex = 'F' AND pc.is_referred IS TRUE AND pc.has_malnutrition IS TRUE AND pc.age_in_months < 12),
                'M', COUNT(pc.*) FILTER (WHERE pc.sex = 'M' AND pc.is_referred IS TRUE AND pc.has_malnutrition IS TRUE AND pc.age_in_months < 12)
            ),
            'malnutrition_12_60',jsonb_build_object(
                'F', COUNT(pc.*) FILTER (WHERE pc.sex = 'F' AND pc.is_referred IS TRUE AND pc.has_malnutrition IS TRUE AND pc.age_in_months >= 12),
                'M', COUNT(pc.*) FILTER (WHERE pc.sex = 'M' AND pc.is_referred IS TRUE AND pc.has_malnutrition IS TRUE AND pc.age_in_months >= 12)
            )
        ) AS referal_case,

        jsonb_build_object(
            'index', 12, 
            'indicator', 'Nombre de cas de malnutritions detectées', 
            'malaria_0_2',jsonb_build_object('F', NULL,'M', NULL),
            'malaria_2_12',jsonb_build_object('F', NULL,'M', NULL),
            'malaria_12_60',jsonb_build_object('F', NULL,'M', NULL),
            'cough_pneumonia_0_2',jsonb_build_object('F', NULL,'M', NULL),
            'cough_pneumonia_2_12',jsonb_build_object('F', NULL,'M', NULL),
            'cough_pneumonia_12_60',jsonb_build_object('F', NULL,'M', NULL),
            'diarrhea_0_2',jsonb_build_object('F', NULL,'M', NULL),
            'diarrhea_2_12',jsonb_build_object('F', NULL,'M', NULL),
            'diarrhea_12_60',jsonb_build_object('F', NULL,'M', NULL),
            'malnutrition_0_2',jsonb_build_object(
                'F', COUNT(nb.*) FILTER (WHERE nb.sex = 'F' AND nb.form = 'newborn_register' AND nb.has_malnutrition IS TRUE),
                'M', COUNT(nb.*) FILTER (WHERE nb.sex = 'M' AND nb.form = 'newborn_register' AND nb.has_malnutrition IS TRUE)
            ),
            'malnutrition_2_12',jsonb_build_object(
                'F', COUNT(pc.*) FILTER (WHERE pc.sex = 'F' AND pc.form = 'pcimne_register' AND pc.has_malnutrition IS TRUE AND pc.age_in_months < 12),
                'M', COUNT(pc.*) FILTER (WHERE pc.sex = 'M' AND pc.form = 'pcimne_register' AND pc.has_malnutrition IS TRUE AND pc.age_in_months < 12)
            ),
            'malnutrition_12_60',jsonb_build_object(
                'F', COUNT(pc.*) FILTER (WHERE pc.sex = 'F' AND pc.form = 'pcimne_register' AND pc.has_malnutrition IS TRUE AND pc.age_in_months >= 12),
                'M', COUNT(pc.*) FILTER (WHERE pc.sex = 'M' AND pc.form = 'pcimne_register' AND pc.has_malnutrition IS TRUE AND pc.age_in_months >= 12)
            )
        ) AS case_malnutrition_detected,

        jsonb_build_object(
            'index', 13, 
            'indicator', 'Nombre de cas de toux detectés', 
            'malaria_0_2',jsonb_build_object('F', NULL,'M', NULL),
            'malaria_2_12',jsonb_build_object('F', NULL,'M', NULL),
            'malaria_12_60',jsonb_build_object('F', NULL,'M', NULL),
            'cough_pneumonia_0_2',jsonb_build_object(
                'F', COUNT(nb.*) FILTER (WHERE nb.sex = 'F' AND nb.form = 'newborn_register' AND nb.has_cough_cold IS TRUE),
                'M', COUNT(nb.*) FILTER (WHERE nb.sex = 'M' AND nb.form = 'newborn_register' AND nb.has_cough_cold IS TRUE)
            ),
            'cough_pneumonia_2_12',jsonb_build_object(
                'F', COUNT(pc.*) FILTER (WHERE pc.sex = 'F' AND pc.form = 'pcimne_register' AND pc.has_cough_cold IS TRUE AND pc.age_in_months < 12),
                'M', COUNT(pc.*) FILTER (WHERE pc.sex = 'M' AND pc.form = 'pcimne_register' AND pc.has_cough_cold IS TRUE AND pc.age_in_months < 12)
            ),
            'cough_pneumonia_12_60',jsonb_build_object(
                'F', COUNT(pc.*) FILTER (WHERE pc.sex = 'F' AND pc.form = 'pcimne_register' AND pc.has_cough_cold IS TRUE AND pc.age_in_months >= 12),
                'M', COUNT(pc.*) FILTER (WHERE pc.sex = 'M' AND pc.form = 'pcimne_register' AND pc.has_cough_cold IS TRUE AND pc.age_in_months >= 12)
            ),
            'diarrhea_0_2',jsonb_build_object('F', NULL,'M', NULL),
            'diarrhea_2_12',jsonb_build_object('F', NULL,'M', NULL),
            'diarrhea_12_60',jsonb_build_object('F', NULL,'M', NULL),
            'malnutrition_0_2',jsonb_build_object('F', NULL,'M', NULL),
            'malnutrition_2_12',jsonb_build_object('F', NULL,'M', NULL),
            'malnutrition_12_60',jsonb_build_object('F', NULL,'M', NULL)
        ) AS case_cough_detected,

        jsonb_build_object(
            'index', 14, 
            'indicator', 'Nombre de contre références reçues', 
            'malaria_0_2',jsonb_build_object(
                'F', COUNT(nb.*) FILTER (WHERE nb.sex = 'F' AND (nb.has_malaria IS TRUE) AND nb.coupon_available IS TRUE), --  OR nb.has_fever IS TRUE
                'M', COUNT(nb.*) FILTER (WHERE nb.sex = 'M' AND (nb.has_malaria IS TRUE) AND nb.coupon_available IS TRUE) --  OR nb.has_fever IS TRUE
            ),
            'malaria_2_12',jsonb_build_object(
                'F', COUNT(pc.*) FILTER (WHERE pc.sex = 'F' AND (pc.has_malaria IS TRUE OR pc.has_fever IS TRUE) AND pc.coupon_available IS TRUE AND pc.age_in_months < 12),
                'M', COUNT(pc.*) FILTER (WHERE pc.sex = 'M' AND (pc.has_malaria IS TRUE OR pc.has_fever IS TRUE) AND pc.coupon_available IS TRUE AND pc.age_in_months < 12)
            ),
            'malaria_12_60',jsonb_build_object(
                'F', COUNT(pc.*) FILTER (WHERE pc.sex = 'F' AND (pc.has_malaria IS TRUE OR pc.has_fever IS TRUE) AND pc.coupon_available IS TRUE AND pc.age_in_months >= 12),
                'M', COUNT(pc.*) FILTER (WHERE pc.sex = 'M' AND (pc.has_malaria IS TRUE OR pc.has_fever IS TRUE) AND pc.coupon_available IS TRUE AND pc.age_in_months >= 12)
            ),
            'cough_pneumonia_0_2',jsonb_build_object(
                'F', COUNT(nb.*) FILTER (WHERE nb.sex = 'F' AND (nb.has_cough_cold IS TRUE OR nb.has_pneumonia IS TRUE) AND nb.coupon_available IS TRUE),
                'M', COUNT(nb.*) FILTER (WHERE nb.sex = 'M' AND (nb.has_cough_cold IS TRUE OR nb.has_pneumonia IS TRUE) AND nb.coupon_available IS TRUE)
            ),
            'cough_pneumonia_2_12',jsonb_build_object(
                'F', COUNT(pc.*) FILTER (WHERE pc.sex = 'F' AND (pc.has_cough_cold IS TRUE OR pc.has_pneumonia IS TRUE) AND pc.coupon_available IS TRUE AND pc.age_in_months < 12),
                'M', COUNT(pc.*) FILTER (WHERE pc.sex = 'M' AND (pc.has_cough_cold IS TRUE OR pc.has_pneumonia IS TRUE) AND pc.coupon_available IS TRUE AND pc.age_in_months < 12)
            ),
            'cough_pneumonia_12_60',jsonb_build_object(
                'F', COUNT(pc.*) FILTER (WHERE pc.sex = 'F' AND (pc.has_cough_cold IS TRUE OR pc.has_pneumonia IS TRUE) AND pc.coupon_available IS TRUE AND pc.age_in_months >= 12),
                'M', COUNT(pc.*) FILTER (WHERE pc.sex = 'M' AND (pc.has_cough_cold IS TRUE OR pc.has_pneumonia IS TRUE) AND pc.coupon_available IS TRUE AND pc.age_in_months >= 12)
            ),
            'diarrhea_0_2',jsonb_build_object(
                'F', COUNT(nb.*) FILTER (WHERE nb.sex = 'F' AND nb.has_diarrhea IS TRUE AND nb.coupon_available IS TRUE),
                'M', COUNT(nb.*) FILTER (WHERE nb.sex = 'M' AND nb.has_diarrhea IS TRUE AND nb.coupon_available IS TRUE)
            ),
            'diarrhea_2_12',jsonb_build_object(
                'F', COUNT(pc.*) FILTER (WHERE pc.sex = 'F' AND pc.has_diarrhea IS TRUE AND pc.coupon_available IS TRUE AND pc.age_in_months < 12),
                'M', COUNT(pc.*) FILTER (WHERE pc.sex = 'M' AND pc.has_diarrhea IS TRUE AND pc.coupon_available IS TRUE AND pc.age_in_months < 12)
            ),
            'diarrhea_12_60',jsonb_build_object(
                'F', COUNT(pc.*) FILTER (WHERE pc.sex = 'F' AND pc.has_diarrhea IS TRUE AND pc.coupon_available IS TRUE AND pc.age_in_months >= 12),
                'M', COUNT(pc.*) FILTER (WHERE pc.sex = 'M' AND pc.has_diarrhea IS TRUE AND pc.coupon_available IS TRUE AND pc.age_in_months >= 12)
            ),
            'malnutrition_0_2',jsonb_build_object(
                'F', COUNT(nb.*) FILTER (WHERE nb.sex = 'F' AND nb.has_malnutrition IS TRUE AND nb.coupon_available IS TRUE),
                'M', COUNT(nb.*) FILTER (WHERE nb.sex = 'M' AND nb.has_malnutrition IS TRUE AND nb.coupon_available IS TRUE)
            ),
            'malnutrition_2_12',jsonb_build_object(
                'F', COUNT(pc.*) FILTER (WHERE pc.sex = 'F' AND pc.has_malnutrition IS TRUE AND pc.coupon_available IS TRUE AND pc.age_in_months < 12),
                'M', COUNT(pc.*) FILTER (WHERE pc.sex = 'M' AND pc.has_malnutrition IS TRUE AND pc.coupon_available IS TRUE AND pc.age_in_months < 12)
            ),
            'malnutrition_12_60',jsonb_build_object(
                'F', COUNT(pc.*) FILTER (WHERE pc.sex = 'F' AND pc.has_malnutrition IS TRUE AND pc.coupon_available IS TRUE AND pc.age_in_months >= 12),
                'M', COUNT(pc.*) FILTER (WHERE pc.sex = 'M' AND pc.has_malnutrition IS TRUE AND pc.coupon_available IS TRUE AND pc.age_in_months >= 12)
            )
        ) AS counter_referrals_received,

        jsonb_build_object(
            'index', 15, 
            'indicator', 'Nombre de décès enregistrés', 
            'malaria_0_2',jsonb_build_object(
                'F', COUNT(DISTINCT dt.patient_id) FILTER (WHERE dt.sex = 'F' AND (dt.has_malaria IS TRUE OR dt.has_fever IS TRUE) AND dt.age_in_months < 2),
                'M', COUNT(DISTINCT dt.patient_id) FILTER (WHERE dt.sex = 'M' AND (dt.has_malaria IS TRUE OR dt.has_fever IS TRUE) AND dt.age_in_months < 2)
            ),
            'malaria_2_12',jsonb_build_object(
                'F', COUNT(DISTINCT dt.patient_id) FILTER (WHERE dt.sex = 'F' AND (dt.has_malaria IS TRUE OR dt.has_fever IS TRUE) AND dt.age_in_months >= 2 AND dt.age_in_months < 12),
                'M', COUNT(DISTINCT dt.patient_id) FILTER (WHERE dt.sex = 'M' AND (dt.has_malaria IS TRUE OR dt.has_fever IS TRUE) AND dt.age_in_months >= 2 AND dt.age_in_months < 12)
            ),
            'malaria_12_60',jsonb_build_object(
                'F', COUNT(DISTINCT dt.patient_id) FILTER (WHERE dt.sex = 'F' AND (dt.has_malaria IS TRUE OR dt.has_fever IS TRUE) AND dt.age_in_months >= 12 AND dt.age_in_months < 60),
                'M', COUNT(DISTINCT dt.patient_id) FILTER (WHERE dt.sex = 'M' AND (dt.has_malaria IS TRUE OR dt.has_fever IS TRUE) AND dt.age_in_months >= 12 AND dt.age_in_months < 60)
            ),
            'cough_pneumonia_0_2',jsonb_build_object(
                'F', COUNT(DISTINCT dt.patient_id) FILTER (WHERE dt.sex = 'F' AND (dt.has_cough_cold IS TRUE OR dt.has_pneumonia IS TRUE) AND dt.age_in_months < 2),
                'M', COUNT(DISTINCT dt.patient_id) FILTER (WHERE dt.sex = 'M' AND (dt.has_cough_cold IS TRUE OR dt.has_pneumonia IS TRUE) AND dt.age_in_months < 2)
            ),
            'cough_pneumonia_2_12',jsonb_build_object(
                'F', COUNT(DISTINCT dt.patient_id) FILTER (WHERE dt.sex = 'F' AND (dt.has_cough_cold IS TRUE OR dt.has_pneumonia IS TRUE) AND dt.age_in_months >= 2 AND dt.age_in_months < 12),
                'M', COUNT(DISTINCT dt.patient_id) FILTER (WHERE dt.sex = 'M' AND (dt.has_cough_cold IS TRUE OR dt.has_pneumonia IS TRUE) AND dt.age_in_months >= 2 AND dt.age_in_months < 12)
            ),
            'cough_pneumonia_12_60',jsonb_build_object(
                'F', COUNT(DISTINCT dt.patient_id) FILTER (WHERE dt.sex = 'F' AND (dt.has_cough_cold IS TRUE OR dt.has_pneumonia IS TRUE) AND dt.age_in_months >= 12 AND dt.age_in_months < 60),
                'M', COUNT(DISTINCT dt.patient_id) FILTER (WHERE dt.sex = 'M' AND (dt.has_cough_cold IS TRUE OR dt.has_pneumonia IS TRUE) AND dt.age_in_months >= 12 AND dt.age_in_months < 60)
            ),
            'diarrhea_0_2',jsonb_build_object(
                'F', COUNT(DISTINCT dt.patient_id) FILTER (WHERE dt.sex = 'F' AND dt.has_diarrhea IS TRUE AND dt.age_in_months < 2),
                'M', COUNT(DISTINCT dt.patient_id) FILTER (WHERE dt.sex = 'M' AND dt.has_diarrhea IS TRUE AND dt.age_in_months < 2)
            ),
            'diarrhea_2_12',jsonb_build_object(
                'F', COUNT(DISTINCT dt.patient_id) FILTER (WHERE dt.sex = 'F' AND dt.has_diarrhea IS TRUE AND dt.age_in_months >= 2 AND dt.age_in_months < 12),
                'M', COUNT(DISTINCT dt.patient_id) FILTER (WHERE dt.sex = 'M' AND dt.has_diarrhea IS TRUE AND dt.age_in_months >= 2 AND dt.age_in_months < 12)
            ),
            'diarrhea_12_60',jsonb_build_object(
                'F', COUNT(DISTINCT dt.patient_id) FILTER (WHERE dt.sex = 'F' AND dt.has_diarrhea IS TRUE AND dt.age_in_months >= 12 AND dt.age_in_months < 60),
                'M', COUNT(DISTINCT dt.patient_id) FILTER (WHERE dt.sex = 'M' AND dt.has_diarrhea IS TRUE AND dt.age_in_months >= 12 AND dt.age_in_months < 60)
            ),
            'malnutrition_0_2',jsonb_build_object(
                'F', COUNT(DISTINCT dt.patient_id) FILTER (WHERE dt.sex = 'F' AND dt.has_malnutrition IS TRUE AND dt.age_in_months < 2),
                'M', COUNT(DISTINCT dt.patient_id) FILTER (WHERE dt.sex = 'M' AND dt.has_malnutrition IS TRUE AND dt.age_in_months < 2)
            ),
            'malnutrition_2_12',jsonb_build_object(
                'F', COUNT(DISTINCT dt.patient_id) FILTER (WHERE dt.sex = 'F' AND dt.has_malnutrition IS TRUE AND dt.age_in_months >= 2 AND dt.age_in_months < 12),
                'M', COUNT(DISTINCT dt.patient_id) FILTER (WHERE dt.sex = 'M' AND dt.has_malnutrition IS TRUE AND dt.age_in_months >= 2 AND dt.age_in_months < 12)
            ),
            'malnutrition_12_60',jsonb_build_object(
                'F', COUNT(DISTINCT dt.patient_id) FILTER (WHERE dt.sex = 'F' AND dt.has_malnutrition IS TRUE AND dt.age_in_months >= 12 AND dt.age_in_months < 60),
                'M', COUNT(DISTINCT dt.patient_id) FILTER (WHERE dt.sex = 'M' AND dt.has_malnutrition IS TRUE AND dt.age_in_months >= 12 AND dt.age_in_months < 60)
            )
        ) AS deaths_registered,
        
        jsonb_build_object('id', MAX(r.id), 'name', MAX(r.name), 'phone', MAX(r.phone)) AS reco,
        jsonb_build_object('id', MAX(c.id), 'name', MAX(c.name)) AS country,
        jsonb_build_object('id', MAX(g.id), 'name', MAX(g.name)) AS region,
        jsonb_build_object('id', MAX(p.id), 'name', MAX(p.name)) AS prefecture,
        jsonb_build_object('id', MAX(m.id), 'name', MAX(m.name)) AS commune,
        jsonb_build_object('id', MAX(h.id), 'name', MAX(h.name)) AS hospital,
        jsonb_build_object('id', MAX(d.id), 'name', MAX(d.name)) AS district_quartier,
        jsonb_build_object('id', MAX(v.id), 'name', MAX(v.name)) AS village_secteur

    FROM year_month_reco_grid_view a
    
        JOIN reco_view r ON r.id = a.reco_id

        LEFT JOIN newborn_data_view nb ON nb.age_in_days IS NOT NULL AND nb.age_in_days >= 0 AND nb.reco_id = a.reco_id AND nb.month = a.month AND nb.year = a.year
        LEFT JOIN pcimne_data_view pc ON pc.age_in_days IS NOT NULL AND pc.age_in_days >= 0 AND pc.reco_id = a.reco_id AND pc.month = a.month AND pc.year = a.year
        LEFT JOIN death_data_view dt ON dt.age_in_days IS NOT NULL AND dt.age_in_days >= 0 AND dt.reco_id = a.reco_id AND dt.month = a.month AND dt.year = a.year


        LEFT JOIN country_view c ON r.country_id = c.id 
        LEFT JOIN region_view g ON r.region_id = g.id 
        LEFT JOIN prefecture_view p ON r.prefecture_id = p.id 
        LEFT JOIN commune_view m ON r.commune_id = m.id 
        LEFT JOIN hospital_view h ON r.hospital_id = h.id 
        LEFT JOIN district_quartier_view d ON r.district_quartier_id = d.id 
        LEFT JOIN village_secteur_view v ON r.village_secteur_id = v.id 

    GROUP BY a.reco_id, a.month, a.year;
