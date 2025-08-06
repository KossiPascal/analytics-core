CREATE MATERIALIZED VIEW IF NOT EXISTS reports_family_planning_view AS
    SELECT 
        CONCAT(a.month, '-', a.year, '-', a.reco_id) AS id,
        a.month,
        a.year,
        a.reco_id,

        build_family_planning_json('Pilule - COC', 'pill_coc', a.reco_id, a.month, a.year) AS pill_coc,
        build_family_planning_json('Pilule - COP', 'pill_cop', a.reco_id, a.month, a.year) AS pill_cop,
        build_family_planning_json('Condoms/Preservatif', 'condoms', a.reco_id, a.month, a.year) AS condoms,
        build_family_planning_json('Dépo provera -IM', 'depo_provera_im', a.reco_id, a.month, a.year) AS depo_provera_im,
        build_family_planning_json('DMPA-SC', 'dmpa_sc', a.reco_id, a.month, a.year) AS dmpa_sc,
        build_family_planning_json('Collier du cycle', 'cycle_necklace', a.reco_id, a.month, a.year) AS cycle_necklace,
        build_family_planning_json('DIU', 'diu', a.reco_id, a.month, a.year) AS diu,
        build_family_planning_json('Implant', 'implant', a.reco_id, a.month, a.year) AS implant,
        build_family_planning_json('Ligature des trompes', 'tubal_ligation', a.reco_id, a.month, a.year) AS tubal_ligation,
        
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

    GROUP BY a.reco_id, a.month, a.year;

