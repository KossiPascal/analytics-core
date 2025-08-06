CREATE MATERIALIZED VIEW IF NOT EXISTS reports_reco_meg_situation_view AS 
    SELECT
        CONCAT(a.month, '-', a.year, '-', a.reco_id) AS id,
        a.reco_id,
        a.month,
        a.year,

        build_meg_json(1, 'Amoxicilline 250 mg', 'amoxicillin_250mg', a.reco_id, a.month, a.year, a.prev_month, a.prev_year) AS amoxicillin_250mg,        
        build_meg_json(2, 'Amoxicilline 500 mg', 'amoxicillin_500mg', a.reco_id, a.month, a.year, a.prev_month, a.prev_year) AS amoxicillin_500mg,
        build_meg_json(3, 'Paracetamol 100 mg', 'paracetamol_100mg', a.reco_id, a.month, a.year, a.prev_month, a.prev_year) AS paracetamol_100mg,
        build_meg_json(4, 'Paracetamol 250 mg', 'paracetamol_250mg', a.reco_id, a.month, a.year, a.prev_month, a.prev_year) AS paracetamol_250mg,
        build_meg_json(5, 'Paracetamol 500 mg', 'paracetamol_500mg', a.reco_id, a.month, a.year, a.prev_month, a.prev_year) AS paracetamol_500mg,
        build_meg_json(6, 'Mebendazol 250 mg', 'mebendazol_250mg', a.reco_id, a.month, a.year, a.prev_month, a.prev_year) AS mebendazol_250mg,
        build_meg_json(7, 'Mebendazol 500 mg', 'mebendazol_500mg', a.reco_id, a.month, a.year, a.prev_month, a.prev_year) AS mebendazol_500mg,
        build_meg_json(8, 'SRO', 'ors', a.reco_id, a.month, a.year, a.prev_month, a.prev_year) AS ors,
        build_meg_json(9, 'Zinc', 'zinc', a.reco_id, a.month, a.year, a.prev_month, a.prev_year) AS zinc,
        build_meg_json(10, 'CTA: AL (NN)', 'cta_nn', a.reco_id, a.month, a.year, a.prev_month, a.prev_year) AS cta_nn,
        build_meg_json(11, 'CTA: AL (PE)', 'cta_pe', a.reco_id, a.month, a.year, a.prev_month, a.prev_year) AS cta_pe,
        build_meg_json(12, 'CTA: AL (GE)', 'cta_ge', a.reco_id, a.month, a.year, a.prev_month, a.prev_year) AS cta_ge,
        build_meg_json(13, 'CTA: AL (AD)', 'cta_ad', a.reco_id, a.month, a.year, a.prev_month, a.prev_year) AS cta_ad,
        build_meg_json(14, 'TDR', 'tdr', a.reco_id, a.month, a.year, a.prev_month, a.prev_year) AS tdr,
        build_meg_json(15, 'Vitamin A', 'vitamin_a', a.reco_id, a.month, a.year, a.prev_month, a.prev_year) AS vitamin_a,
        build_meg_json(16, 'Pillule COC', 'pill_coc', a.reco_id, a.month, a.year, a.prev_month, a.prev_year) AS pill_coc,
        build_meg_json(17, 'Pillule COP', 'pill_cop', a.reco_id, a.month, a.year, a.prev_month, a.prev_year) AS pill_cop,
        build_meg_json(18, 'Condoms', 'condoms', a.reco_id, a.month, a.year, a.prev_month, a.prev_year) AS condoms,
        build_meg_json(19, 'Dmpa SC (Sayana-press)', 'dmpa_sc', a.reco_id, a.month, a.year, a.prev_month, a.prev_year) AS dmpa_sc,
        build_meg_json(20, 'Implant', 'implant', a.reco_id, a.month, a.year, a.prev_month, a.prev_year) AS implant,

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
        LEFT JOIN country_view c ON r.country_id = c.id 
        LEFT JOIN region_view g ON r.region_id = g.id 
        LEFT JOIN prefecture_view p ON r.prefecture_id = p.id 
        LEFT JOIN commune_view m ON r.commune_id = m.id 
        LEFT JOIN hospital_view h ON r.hospital_id = h.id 
        LEFT JOIN district_quartier_view d ON r.district_quartier_id = d.id 
        LEFT JOIN village_secteur_view v ON r.village_secteur_id = v.id 

    GROUP BY a.reco_id, a.month, a.year, a.prev_year, a.prev_month;
