CREATE MATERIALIZED VIEW IF NOT EXISTS reports_family_planning_view AS
    SELECT 
        CONCAT(a.month, '-', a.year, '-', a.reco_id) AS id,
        a.month,
        a.year,
        a.reco_id,

        -- build_family_planning_json('Pilule - COC', 'pill_coc', a.reco_id, a.month, a.year) AS pill_coc,
        -- build_family_planning_json('Pilule - COP', 'pill_cop', a.reco_id, a.month, a.year) AS pill_cop,
        -- build_family_planning_json('Condoms/Preservatif', 'condoms', a.reco_id, a.month, a.year) AS condoms,
        -- build_family_planning_json('Dépo provera -IM', 'depo_provera_im', a.reco_id, a.month, a.year) AS depo_provera_im,
        -- build_family_planning_json('DMPA-SC', 'dmpa_sc', a.reco_id, a.month, a.year) AS dmpa_sc,
        -- build_family_planning_json('Collier du cycle', 'cycle_necklace', a.reco_id, a.month, a.year) AS cycle_necklace,
        -- build_family_planning_json('DIU', 'diu', a.reco_id, a.month, a.year) AS diu,
        -- build_family_planning_json('Implant', 'implant', a.reco_id, a.month, a.year) AS implant,
        -- build_family_planning_json('Ligature des trompes', 'tubal_ligation', a.reco_id, a.month, a.year) AS tubal_ligation,

        jsonb_build_object(
            'label', 'Pilule - COC',
            'nbr_new_user', COALESCE(COUNT(DISTINCT fp.patient_id) FILTER (
                WHERE fp.fp_method = 'pill_coc' AND fp.form IN ('pregnancy_family_planning', 'family_planning') AND fp.has_counseling IS TRUE AND fp.is_method_avaible_reco IS TRUE AND fp.method_was_given IS TRUE AND fp.already_use_method IS NOT TRUE
            ), 0)::BIGINT,

            'nbr_regular_user', COALESCE(COUNT(DISTINCT fp.patient_id) FILTER (
                WHERE fp.fp_method = 'pill_coc' AND fp.has_counseling IS TRUE AND fp.is_method_avaible_reco IS TRUE AND fp.method_was_given IS TRUE AND fp.already_use_method IS TRUE
            ), 0)::BIGINT,

            'nbr_total_user', COALESCE(COUNT(DISTINCT fp.patient_id) FILTER (
                WHERE fp.fp_method = 'pill_coc' AND fp.has_counseling IS TRUE AND fp.is_method_avaible_reco IS TRUE AND fp.method_was_given IS TRUE
            ), 0)::BIGINT,

            'nbr_delivered', COALESCE(SUM(rm.pill_coc) FILTER (
                WHERE rm.meg_type = 'consumption' AND rm.pill_coc IS NOT NULL AND rm.pill_coc > 0
            ), 0)::BIGINT,

            'nbr_in_stock', COALESCE((
                SUM(CASE WHEN rm.meg_type = 'stock' THEN COALESCE(rm.pill_coc, 0) ELSE 0 END)
                - SUM(CASE WHEN rm.meg_type = 'consumption' THEN COALESCE(rm.pill_coc, 0) ELSE 0 END)
                - SUM(CASE WHEN rm.meg_type = 'loss' THEN COALESCE(rm.pill_coc, 0) ELSE 0 END)
                - SUM(CASE WHEN rm.meg_type = 'damaged' THEN COALESCE(rm.pill_coc, 0) ELSE 0 END)
                - SUM(CASE WHEN rm.meg_type = 'broken' THEN COALESCE(rm.pill_coc, 0) ELSE 0 END)
                - SUM(CASE WHEN rm.meg_type = 'expired' THEN COALESCE(rm.pill_coc, 0) ELSE 0 END)
            ), 0)::BIGINT,

            'nbr_referred', COALESCE(COUNT(*) FILTER (
                WHERE rm.fp_method = 'pill_coc' AND rm.is_fp_referred IS TRUE
            ), 0)::BIGINT,

            'nbr_side_effect', COALESCE(COUNT(*) FILTER (
                WHERE rm.fp_method = 'pill_coc' AND rm.has_fp_side_effect IS TRUE
            ), 0)::BIGINT
        ) AS pill_coc,

        jsonb_build_object(
            'label', 'Pilule - COP',
            'nbr_new_user', COALESCE(COUNT(DISTINCT fp.patient_id) FILTER (
                WHERE fp.fp_method = 'pill_cop' AND fp.form IN ('pregnancy_family_planning', 'family_planning') AND fp.has_counseling IS TRUE AND fp.is_method_avaible_reco IS TRUE AND fp.method_was_given IS TRUE AND fp.already_use_method IS NOT TRUE
            ), 0)::BIGINT,

            'nbr_regular_user', COALESCE(COUNT(DISTINCT fp.patient_id) FILTER (
                WHERE fp.fp_method = 'pill_cop' AND fp.has_counseling IS TRUE AND fp.is_method_avaible_reco IS TRUE AND fp.method_was_given IS TRUE AND fp.already_use_method IS TRUE
            ), 0)::BIGINT,

            'nbr_total_user', COALESCE(COUNT(DISTINCT fp.patient_id) FILTER (
                WHERE fp.fp_method = 'pill_cop' AND fp.has_counseling IS TRUE AND fp.is_method_avaible_reco IS TRUE AND fp.method_was_given IS TRUE
            ), 0)::BIGINT,

            'nbr_delivered', COALESCE(SUM(rm.pill_cop) FILTER (
                WHERE rm.meg_type = 'consumption' AND rm.pill_cop IS NOT NULL AND rm.pill_cop > 0
            ), 0)::BIGINT,

            'nbr_in_stock', COALESCE((
                SUM(CASE WHEN rm.meg_type = 'stock' THEN COALESCE(rm.pill_cop, 0) ELSE 0 END)
                - SUM(CASE WHEN rm.meg_type = 'consumption' THEN COALESCE(rm.pill_cop, 0) ELSE 0 END)
                - SUM(CASE WHEN rm.meg_type = 'loss' THEN COALESCE(rm.pill_cop, 0) ELSE 0 END)
                - SUM(CASE WHEN rm.meg_type = 'damaged' THEN COALESCE(rm.pill_cop, 0) ELSE 0 END)
                - SUM(CASE WHEN rm.meg_type = 'broken' THEN COALESCE(rm.pill_cop, 0) ELSE 0 END)
                - SUM(CASE WHEN rm.meg_type = 'expired' THEN COALESCE(rm.pill_cop, 0) ELSE 0 END)
            ), 0)::BIGINT,

            'nbr_referred', COALESCE(COUNT(*) FILTER (
                WHERE rm.fp_method = 'pill_cop' AND rm.is_fp_referred IS TRUE
            ), 0)::BIGINT,

            'nbr_side_effect', COALESCE(COUNT(*) FILTER (
                WHERE rm.fp_method = 'pill_cop' AND rm.has_fp_side_effect IS TRUE
            ), 0)::BIGINT
        ) AS pill_cop,

        jsonb_build_object(
            'label', 'Condoms/Preservatif',
            'nbr_new_user', COALESCE(COUNT(DISTINCT fp.patient_id) FILTER (
                WHERE fp.fp_method = 'condoms' AND fp.form IN ('pregnancy_family_planning', 'family_planning') AND fp.has_counseling IS TRUE AND fp.is_method_avaible_reco IS TRUE AND fp.method_was_given IS TRUE AND fp.already_use_method IS NOT TRUE
            ), 0)::BIGINT,

            'nbr_regular_user', COALESCE(COUNT(DISTINCT fp.patient_id) FILTER (
                WHERE fp.fp_method = 'condoms' AND fp.has_counseling IS TRUE AND fp.is_method_avaible_reco IS TRUE AND fp.method_was_given IS TRUE AND fp.already_use_method IS TRUE
            ), 0)::BIGINT,

            'nbr_total_user', COALESCE(COUNT(DISTINCT fp.patient_id) FILTER (
                WHERE fp.fp_method = 'condoms' AND fp.has_counseling IS TRUE AND fp.is_method_avaible_reco IS TRUE AND fp.method_was_given IS TRUE
            ), 0)::BIGINT,

            'nbr_delivered', COALESCE(SUM(rm.condoms) FILTER (
                WHERE rm.meg_type = 'consumption' AND rm.condoms IS NOT NULL AND rm.condoms > 0
            ), 0)::BIGINT,

            'nbr_in_stock', COALESCE((
                SUM(CASE WHEN rm.meg_type = 'stock' THEN COALESCE(rm.condoms, 0) ELSE 0 END)
                - SUM(CASE WHEN rm.meg_type = 'consumption' THEN COALESCE(rm.condoms, 0) ELSE 0 END)
                - SUM(CASE WHEN rm.meg_type = 'loss' THEN COALESCE(rm.condoms, 0) ELSE 0 END)
                - SUM(CASE WHEN rm.meg_type = 'damaged' THEN COALESCE(rm.condoms, 0) ELSE 0 END)
                - SUM(CASE WHEN rm.meg_type = 'broken' THEN COALESCE(rm.condoms, 0) ELSE 0 END)
                - SUM(CASE WHEN rm.meg_type = 'expired' THEN COALESCE(rm.condoms, 0) ELSE 0 END)
            ), 0)::BIGINT,

            'nbr_referred', COALESCE(COUNT(*) FILTER (
                WHERE rm.fp_method = 'condoms' AND rm.is_fp_referred IS TRUE
            ), 0)::BIGINT,

            'nbr_side_effect', COALESCE(COUNT(*) FILTER (
                WHERE rm.fp_method = 'condoms' AND rm.has_fp_side_effect IS TRUE
            ), 0)::BIGINT
        ) AS condoms,

        jsonb_build_object(
            'label', 'Dépo provera -IM',
            'nbr_new_user', COALESCE(COUNT(DISTINCT fp.patient_id) FILTER (
                WHERE fp.fp_method = 'depo_provera_im' AND fp.form IN ('pregnancy_family_planning', 'family_planning') AND fp.has_counseling IS TRUE AND fp.is_method_avaible_reco IS TRUE AND fp.method_was_given IS TRUE AND fp.already_use_method IS NOT TRUE
            ), 0)::BIGINT,

            'nbr_regular_user', COALESCE(COUNT(DISTINCT fp.patient_id) FILTER (
                WHERE fp.fp_method = 'depo_provera_im' AND fp.has_counseling IS TRUE AND fp.is_method_avaible_reco IS TRUE AND fp.method_was_given IS TRUE AND fp.already_use_method IS TRUE
            ), 0)::BIGINT,

            'nbr_total_user', COALESCE(COUNT(DISTINCT fp.patient_id) FILTER (
                WHERE fp.fp_method = 'depo_provera_im' AND fp.has_counseling IS TRUE AND fp.is_method_avaible_reco IS TRUE AND fp.method_was_given IS TRUE
            ), 0)::BIGINT,

            'nbr_delivered', COALESCE(SUM(rm.depo_provera_im) FILTER (
                WHERE rm.meg_type = 'consumption' AND rm.depo_provera_im IS NOT NULL AND rm.depo_provera_im > 0
            ), 0)::BIGINT,

            'nbr_in_stock', COALESCE((
                SUM(CASE WHEN rm.meg_type = 'stock' THEN COALESCE(rm.depo_provera_im, 0) ELSE 0 END)
                - SUM(CASE WHEN rm.meg_type = 'consumption' THEN COALESCE(rm.depo_provera_im, 0) ELSE 0 END)
                - SUM(CASE WHEN rm.meg_type = 'loss' THEN COALESCE(rm.depo_provera_im, 0) ELSE 0 END)
                - SUM(CASE WHEN rm.meg_type = 'damaged' THEN COALESCE(rm.depo_provera_im, 0) ELSE 0 END)
                - SUM(CASE WHEN rm.meg_type = 'broken' THEN COALESCE(rm.depo_provera_im, 0) ELSE 0 END)
                - SUM(CASE WHEN rm.meg_type = 'expired' THEN COALESCE(rm.depo_provera_im, 0) ELSE 0 END)
            ), 0)::BIGINT,

            'nbr_referred', COALESCE(COUNT(*) FILTER (
                WHERE rm.fp_method = 'depo_provera_im' AND rm.is_fp_referred IS TRUE
            ), 0)::BIGINT,

            'nbr_side_effect', COALESCE(COUNT(*) FILTER (
                WHERE rm.fp_method = 'depo_provera_im' AND rm.has_fp_side_effect IS TRUE
            ), 0)::BIGINT
        ) AS depo_provera_im,

        jsonb_build_object(
            'label', 'DMPA-SC',
            'nbr_new_user', COALESCE(COUNT(DISTINCT fp.patient_id) FILTER (
                WHERE fp.fp_method = 'dmpa_sc' AND fp.form IN ('pregnancy_family_planning', 'family_planning') AND fp.has_counseling IS TRUE AND fp.is_method_avaible_reco IS TRUE AND fp.method_was_given IS TRUE AND fp.already_use_method IS NOT TRUE
            ), 0)::BIGINT,

            'nbr_regular_user', COALESCE(COUNT(DISTINCT fp.patient_id) FILTER (
                WHERE fp.fp_method = 'dmpa_sc' AND fp.has_counseling IS TRUE AND fp.is_method_avaible_reco IS TRUE AND fp.method_was_given IS TRUE AND fp.already_use_method IS TRUE
            ), 0)::BIGINT,

            'nbr_total_user', COALESCE(COUNT(DISTINCT fp.patient_id) FILTER (
                WHERE fp.fp_method = 'dmpa_sc' AND fp.has_counseling IS TRUE AND fp.is_method_avaible_reco IS TRUE AND fp.method_was_given IS TRUE
            ), 0)::BIGINT,

            'nbr_delivered', COALESCE(SUM(rm.dmpa_sc) FILTER (
                WHERE rm.meg_type = 'consumption' AND rm.dmpa_sc IS NOT NULL AND rm.dmpa_sc > 0
            ), 0)::BIGINT,

            'nbr_in_stock', COALESCE((
                SUM(CASE WHEN rm.meg_type = 'stock' THEN COALESCE(rm.dmpa_sc, 0) ELSE 0 END)
                - SUM(CASE WHEN rm.meg_type = 'consumption' THEN COALESCE(rm.dmpa_sc, 0) ELSE 0 END)
                - SUM(CASE WHEN rm.meg_type = 'loss' THEN COALESCE(rm.dmpa_sc, 0) ELSE 0 END)
                - SUM(CASE WHEN rm.meg_type = 'damaged' THEN COALESCE(rm.dmpa_sc, 0) ELSE 0 END)
                - SUM(CASE WHEN rm.meg_type = 'broken' THEN COALESCE(rm.dmpa_sc, 0) ELSE 0 END)
                - SUM(CASE WHEN rm.meg_type = 'expired' THEN COALESCE(rm.dmpa_sc, 0) ELSE 0 END)
            ), 0)::BIGINT,

            'nbr_referred', COALESCE(COUNT(*) FILTER (
                WHERE rm.fp_method = 'dmpa_sc' AND rm.is_fp_referred IS TRUE
            ), 0)::BIGINT,

            'nbr_side_effect', COALESCE(COUNT(*) FILTER (
                WHERE rm.fp_method = 'dmpa_sc' AND rm.has_fp_side_effect IS TRUE
            ), 0)::BIGINT
        ) AS dmpa_sc,

        jsonb_build_object(
            'label', 'Collier du cycle',
            'nbr_new_user', COALESCE(COUNT(DISTINCT fp.patient_id) FILTER (
                WHERE fp.fp_method = 'cycle_necklace' AND fp.form IN ('pregnancy_family_planning', 'family_planning') AND fp.has_counseling IS TRUE AND fp.is_method_avaible_reco IS TRUE AND fp.method_was_given IS TRUE AND fp.already_use_method IS NOT TRUE
            ), 0)::BIGINT,

            'nbr_regular_user', COALESCE(COUNT(DISTINCT fp.patient_id) FILTER (
                WHERE fp.fp_method = 'cycle_necklace' AND fp.has_counseling IS TRUE AND fp.is_method_avaible_reco IS TRUE AND fp.method_was_given IS TRUE AND fp.already_use_method IS TRUE
            ), 0)::BIGINT,

            'nbr_total_user', COALESCE(COUNT(DISTINCT fp.patient_id) FILTER (
                WHERE fp.fp_method = 'cycle_necklace' AND fp.has_counseling IS TRUE AND fp.is_method_avaible_reco IS TRUE AND fp.method_was_given IS TRUE
            ), 0)::BIGINT,

            'nbr_delivered', COALESCE(SUM(rm.cycle_necklace) FILTER (
                WHERE rm.meg_type = 'consumption' AND rm.cycle_necklace IS NOT NULL AND rm.cycle_necklace > 0
            ), 0)::BIGINT,

            'nbr_in_stock', COALESCE((
                SUM(CASE WHEN rm.meg_type = 'stock' THEN COALESCE(rm.cycle_necklace, 0) ELSE 0 END)
                - SUM(CASE WHEN rm.meg_type = 'consumption' THEN COALESCE(rm.cycle_necklace, 0) ELSE 0 END)
                - SUM(CASE WHEN rm.meg_type = 'loss' THEN COALESCE(rm.cycle_necklace, 0) ELSE 0 END)
                - SUM(CASE WHEN rm.meg_type = 'damaged' THEN COALESCE(rm.cycle_necklace, 0) ELSE 0 END)
                - SUM(CASE WHEN rm.meg_type = 'broken' THEN COALESCE(rm.cycle_necklace, 0) ELSE 0 END)
                - SUM(CASE WHEN rm.meg_type = 'expired' THEN COALESCE(rm.cycle_necklace, 0) ELSE 0 END)
            ), 0)::BIGINT,

            'nbr_referred', COALESCE(COUNT(*) FILTER (
                WHERE rm.fp_method = 'cycle_necklace' AND rm.is_fp_referred IS TRUE
            ), 0)::BIGINT,

            'nbr_side_effect', COALESCE(COUNT(*) FILTER (
                WHERE rm.fp_method = 'cycle_necklace' AND rm.has_fp_side_effect IS TRUE
            ), 0)::BIGINT
        ) AS cycle_necklace,

        jsonb_build_object(
            'label', 'DIU',
            'nbr_new_user', COALESCE(COUNT(DISTINCT fp.patient_id) FILTER (
                WHERE fp.fp_method = 'diu' AND fp.form IN ('pregnancy_family_planning', 'family_planning') AND fp.has_counseling IS TRUE AND fp.is_method_avaible_reco IS TRUE AND fp.method_was_given IS TRUE AND fp.already_use_method IS NOT TRUE
            ), 0)::BIGINT,

            'nbr_regular_user', COALESCE(COUNT(DISTINCT fp.patient_id) FILTER (
                WHERE fp.fp_method = 'diu' AND fp.has_counseling IS TRUE AND fp.is_method_avaible_reco IS TRUE AND fp.method_was_given IS TRUE AND fp.already_use_method IS TRUE
            ), 0)::BIGINT,

            'nbr_total_user', COALESCE(COUNT(DISTINCT fp.patient_id) FILTER (
                WHERE fp.fp_method = 'diu' AND fp.has_counseling IS TRUE AND fp.is_method_avaible_reco IS TRUE AND fp.method_was_given IS TRUE
            ), 0)::BIGINT,

            'nbr_delivered', COALESCE(SUM(rm.diu) FILTER (
                WHERE rm.meg_type = 'consumption' AND rm.diu IS NOT NULL AND rm.diu > 0
            ), 0)::BIGINT,

            'nbr_in_stock', COALESCE((
                SUM(CASE WHEN rm.meg_type = 'stock' THEN COALESCE(rm.diu, 0) ELSE 0 END)
                - SUM(CASE WHEN rm.meg_type = 'consumption' THEN COALESCE(rm.diu, 0) ELSE 0 END)
                - SUM(CASE WHEN rm.meg_type = 'loss' THEN COALESCE(rm.diu, 0) ELSE 0 END)
                - SUM(CASE WHEN rm.meg_type = 'damaged' THEN COALESCE(rm.diu, 0) ELSE 0 END)
                - SUM(CASE WHEN rm.meg_type = 'broken' THEN COALESCE(rm.diu, 0) ELSE 0 END)
                - SUM(CASE WHEN rm.meg_type = 'expired' THEN COALESCE(rm.diu, 0) ELSE 0 END)
            ), 0)::BIGINT,

            'nbr_referred', COALESCE(COUNT(*) FILTER (
                WHERE rm.fp_method = 'diu' AND rm.is_fp_referred IS TRUE
            ), 0)::BIGINT,

            'nbr_side_effect', COALESCE(COUNT(*) FILTER (
                WHERE rm.fp_method = 'diu' AND rm.has_fp_side_effect IS TRUE
            ), 0)::BIGINT
        ) AS diu,

        jsonb_build_object(
            'label', 'Implant',
            'nbr_new_user', COALESCE(COUNT(DISTINCT fp.patient_id) FILTER (
                WHERE fp.fp_method = 'implant' AND fp.form IN ('pregnancy_family_planning', 'family_planning') AND fp.has_counseling IS TRUE AND fp.is_method_avaible_reco IS TRUE AND fp.method_was_given IS TRUE AND fp.already_use_method IS NOT TRUE
            ), 0)::BIGINT,

            'nbr_regular_user', COALESCE(COUNT(DISTINCT fp.patient_id) FILTER (
                WHERE fp.fp_method = 'implant' AND fp.has_counseling IS TRUE AND fp.is_method_avaible_reco IS TRUE AND fp.method_was_given IS TRUE AND fp.already_use_method IS TRUE
            ), 0)::BIGINT,

            'nbr_total_user', COALESCE(COUNT(DISTINCT fp.patient_id) FILTER (
                WHERE fp.fp_method = 'implant' AND fp.has_counseling IS TRUE AND fp.is_method_avaible_reco IS TRUE AND fp.method_was_given IS TRUE
            ), 0)::BIGINT,

            'nbr_delivered', COALESCE(SUM(rm.implant) FILTER (
                WHERE rm.meg_type = 'consumption' AND rm.implant IS NOT NULL AND rm.implant > 0
            ), 0)::BIGINT,

            'nbr_in_stock', COALESCE((
                SUM(CASE WHEN rm.meg_type = 'stock' THEN COALESCE(rm.implant, 0) ELSE 0 END)
                - SUM(CASE WHEN rm.meg_type = 'consumption' THEN COALESCE(rm.implant, 0) ELSE 0 END)
                - SUM(CASE WHEN rm.meg_type = 'loss' THEN COALESCE(rm.implant, 0) ELSE 0 END)
                - SUM(CASE WHEN rm.meg_type = 'damaged' THEN COALESCE(rm.implant, 0) ELSE 0 END)
                - SUM(CASE WHEN rm.meg_type = 'broken' THEN COALESCE(rm.implant, 0) ELSE 0 END)
                - SUM(CASE WHEN rm.meg_type = 'expired' THEN COALESCE(rm.implant, 0) ELSE 0 END)
            ), 0)::BIGINT,

            'nbr_referred', COALESCE(COUNT(*) FILTER (
                WHERE rm.fp_method = 'implant' AND rm.is_fp_referred IS TRUE
            ), 0)::BIGINT,

            'nbr_side_effect', COALESCE(COUNT(*) FILTER (
                WHERE rm.fp_method = 'implant' AND rm.has_fp_side_effect IS TRUE
            ), 0)::BIGINT
        ) AS implant,

        jsonb_build_object(
            'label', 'Ligature des trompes',
            'nbr_new_user', COALESCE(COUNT(DISTINCT fp.patient_id) FILTER (
                WHERE fp.fp_method = 'tubal_ligation' AND fp.form IN ('pregnancy_family_planning', 'family_planning') AND fp.has_counseling IS TRUE AND fp.is_method_avaible_reco IS TRUE AND fp.method_was_given IS TRUE AND fp.already_use_method IS NOT TRUE
            ), 0)::BIGINT,

            'nbr_regular_user', COALESCE(COUNT(DISTINCT fp.patient_id) FILTER (
                WHERE fp.fp_method = 'tubal_ligation' AND fp.has_counseling IS TRUE AND fp.is_method_avaible_reco IS TRUE AND fp.method_was_given IS TRUE AND fp.already_use_method IS TRUE
            ), 0)::BIGINT,

            'nbr_total_user', COALESCE(COUNT(DISTINCT fp.patient_id) FILTER (
                WHERE fp.fp_method = 'tubal_ligation' AND fp.has_counseling IS TRUE AND fp.is_method_avaible_reco IS TRUE AND fp.method_was_given IS TRUE
            ), 0)::BIGINT,

            'nbr_delivered', COALESCE(SUM(rm.tubal_ligation) FILTER (
                WHERE rm.meg_type = 'consumption' AND rm.tubal_ligation IS NOT NULL AND rm.tubal_ligation > 0
            ), 0)::BIGINT,

            'nbr_in_stock', COALESCE((
                SUM(CASE WHEN rm.meg_type = 'stock' THEN COALESCE(rm.tubal_ligation, 0) ELSE 0 END)
                - SUM(CASE WHEN rm.meg_type = 'consumption' THEN COALESCE(rm.tubal_ligation, 0) ELSE 0 END)
                - SUM(CASE WHEN rm.meg_type = 'loss' THEN COALESCE(rm.tubal_ligation, 0) ELSE 0 END)
                - SUM(CASE WHEN rm.meg_type = 'damaged' THEN COALESCE(rm.tubal_ligation, 0) ELSE 0 END)
                - SUM(CASE WHEN rm.meg_type = 'broken' THEN COALESCE(rm.tubal_ligation, 0) ELSE 0 END)
                - SUM(CASE WHEN rm.meg_type = 'expired' THEN COALESCE(rm.tubal_ligation, 0) ELSE 0 END)
            ), 0)::BIGINT,

            'nbr_referred', COALESCE(COUNT(*) FILTER (
                WHERE rm.fp_method = 'tubal_ligation' AND rm.is_fp_referred IS TRUE
            ), 0)::BIGINT,

            'nbr_side_effect', COALESCE(COUNT(*) FILTER (
                WHERE rm.fp_method = 'tubal_ligation' AND rm.has_fp_side_effect IS TRUE
            ), 0)::BIGINT
        ) AS tubal_ligation,
        
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

        LEFT JOIN family_planning_data_view fp ON fp.reco_id = a.reco_id AND fp.month = a.month AND fp.year = a.year
        LEFT JOIN reco_meg_data_view rm ON rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year

    GROUP BY a.reco_id, a.month, a.year;

