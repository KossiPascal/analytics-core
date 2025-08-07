CREATE MATERIALIZED VIEW IF NOT EXISTS reports_reco_meg_situation_view AS 
    SELECT
        CONCAT(a.month, '-', a.year, '-', a.reco_id) AS id,
        a.reco_id,
        a.month,
        a.year,

        -- build_meg_json(1, 'Amoxicilline 250 mg', 'amoxicillin_250mg', a.reco_id, a.month, a.year, a.prev_month, a.prev_year) AS amoxicillin_250mg,        
        -- build_meg_json(2, 'Amoxicilline 500 mg', 'amoxicillin_500mg', a.reco_id, a.month, a.year, a.prev_month, a.prev_year) AS amoxicillin_500mg,
        -- build_meg_json(3, 'Paracetamol 100 mg', 'paracetamol_100mg', a.reco_id, a.month, a.year, a.prev_month, a.prev_year) AS paracetamol_100mg,
        -- build_meg_json(4, 'Paracetamol 250 mg', 'paracetamol_250mg', a.reco_id, a.month, a.year, a.prev_month, a.prev_year) AS paracetamol_250mg,
        -- build_meg_json(5, 'Paracetamol 500 mg', 'paracetamol_500mg', a.reco_id, a.month, a.year, a.prev_month, a.prev_year) AS paracetamol_500mg,
        -- build_meg_json(6, 'Mebendazol 250 mg', 'mebendazol_250mg', a.reco_id, a.month, a.year, a.prev_month, a.prev_year) AS mebendazol_250mg,
        -- build_meg_json(7, 'Mebendazol 500 mg', 'mebendazol_500mg', a.reco_id, a.month, a.year, a.prev_month, a.prev_year) AS mebendazol_500mg,
        -- build_meg_json(8, 'SRO', 'ors', a.reco_id, a.month, a.year, a.prev_month, a.prev_year) AS ors,
        -- build_meg_json(9, 'Zinc', 'zinc', a.reco_id, a.month, a.year, a.prev_month, a.prev_year) AS zinc,
        -- build_meg_json(10, 'CTA: AL (NN)', 'cta_nn', a.reco_id, a.month, a.year, a.prev_month, a.prev_year) AS cta_nn,
        -- build_meg_json(11, 'CTA: AL (PE)', 'cta_pe', a.reco_id, a.month, a.year, a.prev_month, a.prev_year) AS cta_pe,
        -- build_meg_json(12, 'CTA: AL (GE)', 'cta_ge', a.reco_id, a.month, a.year, a.prev_month, a.prev_year) AS cta_ge,
        -- build_meg_json(13, 'CTA: AL (AD)', 'cta_ad', a.reco_id, a.month, a.year, a.prev_month, a.prev_year) AS cta_ad,
        -- build_meg_json(14, 'TDR', 'tdr', a.reco_id, a.month, a.year, a.prev_month, a.prev_year) AS tdr,
        -- build_meg_json(15, 'Vitamin A', 'vitamin_a', a.reco_id, a.month, a.year, a.prev_month, a.prev_year) AS vitamin_a,
        -- build_meg_json(16, 'Pillule COC', 'pill_coc', a.reco_id, a.month, a.year, a.prev_month, a.prev_year) AS pill_coc,
        -- build_meg_json(17, 'Pillule COP', 'pill_cop', a.reco_id, a.month, a.year, a.prev_month, a.prev_year) AS pill_cop,
        -- build_meg_json(18, 'Condoms', 'condoms', a.reco_id, a.month, a.year, a.prev_month, a.prev_year) AS condoms,
        -- build_meg_json(19, 'Dmpa SC (Sayana-press)', 'dmpa_sc', a.reco_id, a.month, a.year, a.prev_month, a.prev_year) AS dmpa_sc,
        -- build_meg_json(20, 'Implant', 'implant', a.reco_id, a.month, a.year, a.prev_month, a.prev_year) AS implant,

        jsonb_build_object(
            'index', 1,
            'label', 'Amoxicilline 250 mg',
            'month_beginning', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.prev_month AND rm.year = a.prev_year AND rm.meg_type = 'inventory' AND rm.amoxicillin_250mg IS NOT NULL THEN rm.amoxicillin_250mg ELSE 0 END), 0),
            'month_received', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'stock' AND rm.amoxicillin_250mg IS NOT NULL THEN rm.amoxicillin_250mg ELSE 0 END), 0),
            'month_total_start', (
                COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.prev_month AND rm.year = a.prev_year AND rm.meg_type = 'inventory' AND rm.amoxicillin_250mg IS NOT NULL THEN rm.amoxicillin_250mg ELSE 0 END), 0) +
                COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'stock' AND rm.amoxicillin_250mg IS NOT NULL THEN rm.amoxicillin_250mg ELSE 0 END), 0)
            ),
            'month_consumption', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'consumption' AND rm.amoxicillin_250mg IS NOT NULL THEN rm.amoxicillin_250mg ELSE 0 END), 0),
            'month_theoreticaly', (
                COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.prev_month AND rm.year = a.prev_year AND rm.meg_type = 'inventory' AND rm.amoxicillin_250mg IS NOT NULL THEN rm.amoxicillin_250mg ELSE 0 END), 0) +
                COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'stock' AND rm.amoxicillin_250mg IS NOT NULL THEN rm.amoxicillin_250mg ELSE 0 END), 0) -
                COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type IN ('consumption','loss','damaged','broken','expired') AND rm.amoxicillin_250mg IS NOT NULL THEN rm.amoxicillin_250mg ELSE 0 END), 0)
            ),
            'month_inventory', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'inventory' AND rm.amoxicillin_250mg IS NOT NULL THEN rm.amoxicillin_250mg ELSE 0 END), 0),
            'month_loss', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'loss' AND rm.amoxicillin_250mg IS NOT NULL THEN rm.amoxicillin_250mg ELSE 0 END), 0),
            'month_damaged', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'damaged' AND rm.amoxicillin_250mg IS NOT NULL THEN rm.amoxicillin_250mg ELSE 0 END), 0),
            'month_broken', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'broken' AND rm.amoxicillin_250mg IS NOT NULL THEN rm.amoxicillin_250mg ELSE 0 END), 0),
            'month_expired', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'expired' AND rm.amoxicillin_250mg IS NOT NULL THEN rm.amoxicillin_250mg ELSE 0 END), 0)
        ) AS amoxicillin_250mg,

        jsonb_build_object(
            'index', 2,
            'label', 'Amoxicilline 500 mg',
            'month_beginning', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.prev_month AND rm.year = a.prev_year AND rm.meg_type = 'inventory' AND rm.amoxicillin_500mg IS NOT NULL THEN rm.amoxicillin_500mg ELSE 0 END), 0),
            'month_received', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'stock' AND rm.amoxicillin_500mg IS NOT NULL THEN rm.amoxicillin_500mg ELSE 0 END), 0),
            'month_total_start', (
                COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.prev_month AND rm.year = a.prev_year AND rm.meg_type = 'inventory' AND rm.amoxicillin_500mg IS NOT NULL THEN rm.amoxicillin_500mg ELSE 0 END), 0) +
                COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'stock' AND rm.amoxicillin_500mg IS NOT NULL THEN rm.amoxicillin_500mg ELSE 0 END), 0)
            ),
            'month_consumption', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'consumption' AND rm.amoxicillin_500mg IS NOT NULL THEN rm.amoxicillin_500mg ELSE 0 END), 0),
            'month_theoreticaly', (
                COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.prev_month AND rm.year = a.prev_year AND rm.meg_type = 'inventory' AND rm.amoxicillin_500mg IS NOT NULL THEN rm.amoxicillin_500mg ELSE 0 END), 0) +
                COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'stock' AND rm.amoxicillin_500mg IS NOT NULL THEN rm.amoxicillin_500mg ELSE 0 END), 0) -
                COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type IN ('consumption','loss','damaged','broken','expired') AND rm.amoxicillin_500mg IS NOT NULL THEN rm.amoxicillin_500mg ELSE 0 END), 0)
            ),
            'month_inventory', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'inventory' AND rm.amoxicillin_500mg IS NOT NULL THEN rm.amoxicillin_500mg ELSE 0 END), 0),
            'month_loss', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'loss' AND rm.amoxicillin_500mg IS NOT NULL THEN rm.amoxicillin_500mg ELSE 0 END), 0),
            'month_damaged', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'damaged' AND rm.amoxicillin_500mg IS NOT NULL THEN rm.amoxicillin_500mg ELSE 0 END), 0),
            'month_broken', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'broken' AND rm.amoxicillin_500mg IS NOT NULL THEN rm.amoxicillin_500mg ELSE 0 END), 0),
            'month_expired', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'expired' AND rm.amoxicillin_500mg IS NOT NULL THEN rm.amoxicillin_500mg ELSE 0 END), 0)
        ) AS amoxicillin_500mg,

        jsonb_build_object(
            'index', 3,
            'label', 'Paracetamol 100 mg',
            'month_beginning', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.prev_month AND rm.year = a.prev_year AND rm.meg_type = 'inventory' AND rm.paracetamol_100mg IS NOT NULL THEN rm.paracetamol_100mg ELSE 0 END), 0),
            'month_received', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'stock' AND rm.paracetamol_100mg IS NOT NULL THEN rm.paracetamol_100mg ELSE 0 END), 0),
            'month_total_start', (
                COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.prev_month AND rm.year = a.prev_year AND rm.meg_type = 'inventory' AND rm.paracetamol_100mg IS NOT NULL THEN rm.paracetamol_100mg ELSE 0 END), 0) +
                COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'stock' AND rm.paracetamol_100mg IS NOT NULL THEN rm.paracetamol_100mg ELSE 0 END), 0)
            ),
            'month_consumption', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'consumption' AND rm.paracetamol_100mg IS NOT NULL THEN rm.paracetamol_100mg ELSE 0 END), 0),
            'month_theoreticaly', (
                COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.prev_month AND rm.year = a.prev_year AND rm.meg_type = 'inventory' AND rm.paracetamol_100mg IS NOT NULL THEN rm.paracetamol_100mg ELSE 0 END), 0) +
                COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'stock' AND rm.paracetamol_100mg IS NOT NULL THEN rm.paracetamol_100mg ELSE 0 END), 0) -
                COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type IN ('consumption','loss','damaged','broken','expired') AND rm.paracetamol_100mg IS NOT NULL THEN rm.paracetamol_100mg ELSE 0 END), 0)
            ),
            'month_inventory', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'inventory' AND rm.paracetamol_100mg IS NOT NULL THEN rm.paracetamol_100mg ELSE 0 END), 0),
            'month_loss', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'loss' AND rm.paracetamol_100mg IS NOT NULL THEN rm.paracetamol_100mg ELSE 0 END), 0),
            'month_damaged', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'damaged' AND rm.paracetamol_100mg IS NOT NULL THEN rm.paracetamol_100mg ELSE 0 END), 0),
            'month_broken', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'broken' AND rm.paracetamol_100mg IS NOT NULL THEN rm.paracetamol_100mg ELSE 0 END), 0),
            'month_expired', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'expired' AND rm.paracetamol_100mg IS NOT NULL THEN rm.paracetamol_100mg ELSE 0 END), 0)
        ) AS paracetamol_100mg,

        jsonb_build_object(
            'index', 4,
            'label', 'Paracetamol 250 mg',
            'month_beginning', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.prev_month AND rm.year = a.prev_year AND rm.meg_type = 'inventory' AND rm.paracetamol_250mg IS NOT NULL THEN rm.paracetamol_250mg ELSE 0 END), 0),
            'month_received', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'stock' AND rm.paracetamol_250mg IS NOT NULL THEN rm.paracetamol_250mg ELSE 0 END), 0),
            'month_total_start', (
                COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.prev_month AND rm.year = a.prev_year AND rm.meg_type = 'inventory' AND rm.paracetamol_250mg IS NOT NULL THEN rm.paracetamol_250mg ELSE 0 END), 0) +
                COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'stock' AND rm.paracetamol_250mg IS NOT NULL THEN rm.paracetamol_250mg ELSE 0 END), 0)
            ),
            'month_consumption', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'consumption' AND rm.paracetamol_250mg IS NOT NULL THEN rm.paracetamol_250mg ELSE 0 END), 0),
            'month_theoreticaly', (
                COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.prev_month AND rm.year = a.prev_year AND rm.meg_type = 'inventory' AND rm.paracetamol_250mg IS NOT NULL THEN rm.paracetamol_250mg ELSE 0 END), 0) +
                COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'stock' AND rm.paracetamol_250mg IS NOT NULL THEN rm.paracetamol_250mg ELSE 0 END), 0) -
                COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type IN ('consumption','loss','damaged','broken','expired') AND rm.paracetamol_250mg IS NOT NULL THEN rm.paracetamol_250mg ELSE 0 END), 0)
            ),
            'month_inventory', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'inventory' AND rm.paracetamol_250mg IS NOT NULL THEN rm.paracetamol_250mg ELSE 0 END), 0),
            'month_loss', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'loss' AND rm.paracetamol_250mg IS NOT NULL THEN rm.paracetamol_250mg ELSE 0 END), 0),
            'month_damaged', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'damaged' AND rm.paracetamol_250mg IS NOT NULL THEN rm.paracetamol_250mg ELSE 0 END), 0),
            'month_broken', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'broken' AND rm.paracetamol_250mg IS NOT NULL THEN rm.paracetamol_250mg ELSE 0 END), 0),
            'month_expired', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'expired' AND rm.paracetamol_250mg IS NOT NULL THEN rm.paracetamol_250mg ELSE 0 END), 0)
        ) AS paracetamol_250mg,

        jsonb_build_object(
            'index', 5,
            'label', 'Paracetamol 500 mg',
            'month_beginning', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.prev_month AND rm.year = a.prev_year AND rm.meg_type = 'inventory' AND rm.paracetamol_500mg IS NOT NULL THEN rm.paracetamol_500mg ELSE 0 END), 0),
            'month_received', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'stock' AND rm.paracetamol_500mg IS NOT NULL THEN rm.paracetamol_500mg ELSE 0 END), 0),
            'month_total_start', (
                COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.prev_month AND rm.year = a.prev_year AND rm.meg_type = 'inventory' AND rm.paracetamol_500mg IS NOT NULL THEN rm.paracetamol_500mg ELSE 0 END), 0) +
                COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'stock' AND rm.paracetamol_500mg IS NOT NULL THEN rm.paracetamol_500mg ELSE 0 END), 0)
            ),
            'month_consumption', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'consumption' AND rm.paracetamol_500mg IS NOT NULL THEN rm.paracetamol_500mg ELSE 0 END), 0),
            'month_theoreticaly', (
                COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.prev_month AND rm.year = a.prev_year AND rm.meg_type = 'inventory' AND rm.paracetamol_500mg IS NOT NULL THEN rm.paracetamol_500mg ELSE 0 END), 0) +
                COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'stock' AND rm.paracetamol_500mg IS NOT NULL THEN rm.paracetamol_500mg ELSE 0 END), 0) -
                COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type IN ('consumption','loss','damaged','broken','expired') AND rm.paracetamol_500mg IS NOT NULL THEN rm.paracetamol_500mg ELSE 0 END), 0)
            ),
            'month_inventory', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'inventory' AND rm.paracetamol_500mg IS NOT NULL THEN rm.paracetamol_500mg ELSE 0 END), 0),
            'month_loss', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'loss' AND rm.paracetamol_500mg IS NOT NULL THEN rm.paracetamol_500mg ELSE 0 END), 0),
            'month_damaged', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'damaged' AND rm.paracetamol_500mg IS NOT NULL THEN rm.paracetamol_500mg ELSE 0 END), 0),
            'month_broken', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'broken' AND rm.paracetamol_500mg IS NOT NULL THEN rm.paracetamol_500mg ELSE 0 END), 0),
            'month_expired', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'expired' AND rm.paracetamol_500mg IS NOT NULL THEN rm.paracetamol_500mg ELSE 0 END), 0)
        ) AS paracetamol_500mg,

        jsonb_build_object(
            'index', 6,
            'label', 'Mebendazol 250 mg',
            'month_beginning', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.prev_month AND rm.year = a.prev_year AND rm.meg_type = 'inventory' AND rm.mebendazol_250mg IS NOT NULL THEN rm.mebendazol_250mg ELSE 0 END), 0),
            'month_received', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'stock' AND rm.mebendazol_250mg IS NOT NULL THEN rm.mebendazol_250mg ELSE 0 END), 0),
            'month_total_start', (
                COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.prev_month AND rm.year = a.prev_year AND rm.meg_type = 'inventory' AND rm.mebendazol_250mg IS NOT NULL THEN rm.mebendazol_250mg ELSE 0 END), 0) +
                COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'stock' AND rm.mebendazol_250mg IS NOT NULL THEN rm.mebendazol_250mg ELSE 0 END), 0)
            ),
            'month_consumption', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'consumption' AND rm.mebendazol_250mg IS NOT NULL THEN rm.mebendazol_250mg ELSE 0 END), 0),
            'month_theoreticaly', (
                COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.prev_month AND rm.year = a.prev_year AND rm.meg_type = 'inventory' AND rm.mebendazol_250mg IS NOT NULL THEN rm.mebendazol_250mg ELSE 0 END), 0) +
                COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'stock' AND rm.mebendazol_250mg IS NOT NULL THEN rm.mebendazol_250mg ELSE 0 END), 0) -
                COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type IN ('consumption','loss','damaged','broken','expired') AND rm.mebendazol_250mg IS NOT NULL THEN rm.mebendazol_250mg ELSE 0 END), 0)
            ),
            'month_inventory', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'inventory' AND rm.mebendazol_250mg IS NOT NULL THEN rm.mebendazol_250mg ELSE 0 END), 0),
            'month_loss', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'loss' AND rm.mebendazol_250mg IS NOT NULL THEN rm.mebendazol_250mg ELSE 0 END), 0),
            'month_damaged', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'damaged' AND rm.mebendazol_250mg IS NOT NULL THEN rm.mebendazol_250mg ELSE 0 END), 0),
            'month_broken', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'broken' AND rm.mebendazol_250mg IS NOT NULL THEN rm.mebendazol_250mg ELSE 0 END), 0),
            'month_expired', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'expired' AND rm.mebendazol_250mg IS NOT NULL THEN rm.mebendazol_250mg ELSE 0 END), 0)
        ) AS mebendazol_250mg,

        jsonb_build_object(
            'index', 7,
            'label', 'Mebendazol 500 mg',
            'month_beginning', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.prev_month AND rm.year = a.prev_year AND rm.meg_type = 'inventory' AND rm.mebendazol_500mg IS NOT NULL THEN rm.mebendazol_500mg ELSE 0 END), 0),
            'month_received', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'stock' AND rm.mebendazol_500mg IS NOT NULL THEN rm.mebendazol_500mg ELSE 0 END), 0),
            'month_total_start', (
                COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.prev_month AND rm.year = a.prev_year AND rm.meg_type = 'inventory' AND rm.mebendazol_500mg IS NOT NULL THEN rm.mebendazol_500mg ELSE 0 END), 0) +
                COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'stock' AND rm.mebendazol_500mg IS NOT NULL THEN rm.mebendazol_500mg ELSE 0 END), 0)
            ),
            'month_consumption', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'consumption' AND rm.mebendazol_500mg IS NOT NULL THEN rm.mebendazol_500mg ELSE 0 END), 0),
            'month_theoreticaly', (
                COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.prev_month AND rm.year = a.prev_year AND rm.meg_type = 'inventory' AND rm.mebendazol_500mg IS NOT NULL THEN rm.mebendazol_500mg ELSE 0 END), 0) +
                COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'stock' AND rm.mebendazol_500mg IS NOT NULL THEN rm.mebendazol_500mg ELSE 0 END), 0) -
                COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type IN ('consumption','loss','damaged','broken','expired') AND rm.mebendazol_500mg IS NOT NULL THEN rm.mebendazol_500mg ELSE 0 END), 0)
            ),
            'month_inventory', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'inventory' AND rm.mebendazol_500mg IS NOT NULL THEN rm.mebendazol_500mg ELSE 0 END), 0),
            'month_loss', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'loss' AND rm.mebendazol_500mg IS NOT NULL THEN rm.mebendazol_500mg ELSE 0 END), 0),
            'month_damaged', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'damaged' AND rm.mebendazol_500mg IS NOT NULL THEN rm.mebendazol_500mg ELSE 0 END), 0),
            'month_broken', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'broken' AND rm.mebendazol_500mg IS NOT NULL THEN rm.mebendazol_500mg ELSE 0 END), 0),
            'month_expired', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'expired' AND rm.mebendazol_500mg IS NOT NULL THEN rm.mebendazol_500mg ELSE 0 END), 0)
        ) AS mebendazol_500mg,

        jsonb_build_object(
            'index', 8,
            'label', 'SRO',
            'month_beginning', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.prev_month AND rm.year = a.prev_year AND rm.meg_type = 'inventory' AND rm.ors IS NOT NULL THEN rm.ors ELSE 0 END), 0),
            'month_received', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'stock' AND rm.ors IS NOT NULL THEN rm.ors ELSE 0 END), 0),
            'month_total_start', (
                COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.prev_month AND rm.year = a.prev_year AND rm.meg_type = 'inventory' AND rm.ors IS NOT NULL THEN rm.ors ELSE 0 END), 0) +
                COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'stock' AND rm.ors IS NOT NULL THEN rm.ors ELSE 0 END), 0)
            ),
            'month_consumption', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'consumption' AND rm.ors IS NOT NULL THEN rm.ors ELSE 0 END), 0),
            'month_theoreticaly', (
                COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.prev_month AND rm.year = a.prev_year AND rm.meg_type = 'inventory' AND rm.ors IS NOT NULL THEN rm.ors ELSE 0 END), 0) +
                COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'stock' AND rm.ors IS NOT NULL THEN rm.ors ELSE 0 END), 0) -
                COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type IN ('consumption','loss','damaged','broken','expired') AND rm.ors IS NOT NULL THEN rm.ors ELSE 0 END), 0)
            ),
            'month_inventory', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'inventory' AND rm.ors IS NOT NULL THEN rm.ors ELSE 0 END), 0),
            'month_loss', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'loss' AND rm.ors IS NOT NULL THEN rm.ors ELSE 0 END), 0),
            'month_damaged', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'damaged' AND rm.ors IS NOT NULL THEN rm.ors ELSE 0 END), 0),
            'month_broken', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'broken' AND rm.ors IS NOT NULL THEN rm.ors ELSE 0 END), 0),
            'month_expired', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'expired' AND rm.ors IS NOT NULL THEN rm.ors ELSE 0 END), 0)
        ) AS ors,

        jsonb_build_object(
            'index', 9,
            'label', 'Zinc',
            'month_beginning', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.prev_month AND rm.year = a.prev_year AND rm.meg_type = 'inventory' AND rm.zinc IS NOT NULL THEN rm.zinc ELSE 0 END), 0),
            'month_received', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'stock' AND rm.zinc IS NOT NULL THEN rm.zinc ELSE 0 END), 0),
            'month_total_start', (
                COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.prev_month AND rm.year = a.prev_year AND rm.meg_type = 'inventory' AND rm.zinc IS NOT NULL THEN rm.zinc ELSE 0 END), 0) +
                COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'stock' AND rm.zinc IS NOT NULL THEN rm.zinc ELSE 0 END), 0)
            ),
            'month_consumption', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'consumption' AND rm.zinc IS NOT NULL THEN rm.zinc ELSE 0 END), 0),
            'month_theoreticaly', (
                COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.prev_month AND rm.year = a.prev_year AND rm.meg_type = 'inventory' AND rm.zinc IS NOT NULL THEN rm.zinc ELSE 0 END), 0) +
                COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'stock' AND rm.zinc IS NOT NULL THEN rm.zinc ELSE 0 END), 0) -
                COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type IN ('consumption','loss','damaged','broken','expired') AND rm.zinc IS NOT NULL THEN rm.zinc ELSE 0 END), 0)
            ),
            'month_inventory', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'inventory' AND rm.zinc IS NOT NULL THEN rm.zinc ELSE 0 END), 0),
            'month_loss', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'loss' AND rm.zinc IS NOT NULL THEN rm.zinc ELSE 0 END), 0),
            'month_damaged', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'damaged' AND rm.zinc IS NOT NULL THEN rm.zinc ELSE 0 END), 0),
            'month_broken', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'broken' AND rm.zinc IS NOT NULL THEN rm.zinc ELSE 0 END), 0),
            'month_expired', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'expired' AND rm.zinc IS NOT NULL THEN rm.zinc ELSE 0 END), 0)
        ) AS zinc,

        jsonb_build_object(
            'index', 10,
            'label', 'CTA: AL (NN)',
            'month_beginning', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.prev_month AND rm.year = a.prev_year AND rm.meg_type = 'inventory' AND rm.cta_nn IS NOT NULL THEN rm.cta_nn ELSE 0 END), 0),
            'month_received', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'stock' AND rm.cta_nn IS NOT NULL THEN rm.cta_nn ELSE 0 END), 0),
            'month_total_start', (
                COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.prev_month AND rm.year = a.prev_year AND rm.meg_type = 'inventory' AND rm.cta_nn IS NOT NULL THEN rm.cta_nn ELSE 0 END), 0) +
                COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'stock' AND rm.cta_nn IS NOT NULL THEN rm.cta_nn ELSE 0 END), 0)
            ),
            'month_consumption', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'consumption' AND rm.cta_nn IS NOT NULL THEN rm.cta_nn ELSE 0 END), 0),
            'month_theoreticaly', (
                COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.prev_month AND rm.year = a.prev_year AND rm.meg_type = 'inventory' AND rm.cta_nn IS NOT NULL THEN rm.cta_nn ELSE 0 END), 0) +
                COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'stock' AND rm.cta_nn IS NOT NULL THEN rm.cta_nn ELSE 0 END), 0) -
                COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type IN ('consumption','loss','damaged','broken','expired') AND rm.cta_nn IS NOT NULL THEN rm.cta_nn ELSE 0 END), 0)
            ),
            'month_inventory', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'inventory' AND rm.cta_nn IS NOT NULL THEN rm.cta_nn ELSE 0 END), 0),
            'month_loss', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'loss' AND rm.cta_nn IS NOT NULL THEN rm.cta_nn ELSE 0 END), 0),
            'month_damaged', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'damaged' AND rm.cta_nn IS NOT NULL THEN rm.cta_nn ELSE 0 END), 0),
            'month_broken', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'broken' AND rm.cta_nn IS NOT NULL THEN rm.cta_nn ELSE 0 END), 0),
            'month_expired', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'expired' AND rm.cta_nn IS NOT NULL THEN rm.cta_nn ELSE 0 END), 0)
        ) AS cta_nn,

        jsonb_build_object(
            'index', 11,
            'label', 'CTA: AL (PE)',
            'month_beginning', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.prev_month AND rm.year = a.prev_year AND rm.meg_type = 'inventory' AND rm.cta_pe IS NOT NULL THEN rm.cta_pe ELSE 0 END), 0),
            'month_received', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'stock' AND rm.cta_pe IS NOT NULL THEN rm.cta_pe ELSE 0 END), 0),
            'month_total_start', (
                COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.prev_month AND rm.year = a.prev_year AND rm.meg_type = 'inventory' AND rm.cta_pe IS NOT NULL THEN rm.cta_pe ELSE 0 END), 0) +
                COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'stock' AND rm.cta_pe IS NOT NULL THEN rm.cta_pe ELSE 0 END), 0)
            ),
            'month_consumption', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'consumption' AND rm.cta_pe IS NOT NULL THEN rm.cta_pe ELSE 0 END), 0),
            'month_theoreticaly', (
                COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.prev_month AND rm.year = a.prev_year AND rm.meg_type = 'inventory' AND rm.cta_pe IS NOT NULL THEN rm.cta_pe ELSE 0 END), 0) +
                COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'stock' AND rm.cta_pe IS NOT NULL THEN rm.cta_pe ELSE 0 END), 0) -
                COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type IN ('consumption','loss','damaged','broken','expired') AND rm.cta_pe IS NOT NULL THEN rm.cta_pe ELSE 0 END), 0)
            ),
            'month_inventory', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'inventory' AND rm.cta_pe IS NOT NULL THEN rm.cta_pe ELSE 0 END), 0),
            'month_loss', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'loss' AND rm.cta_pe IS NOT NULL THEN rm.cta_pe ELSE 0 END), 0),
            'month_damaged', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'damaged' AND rm.cta_pe IS NOT NULL THEN rm.cta_pe ELSE 0 END), 0),
            'month_broken', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'broken' AND rm.cta_pe IS NOT NULL THEN rm.cta_pe ELSE 0 END), 0),
            'month_expired', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'expired' AND rm.cta_pe IS NOT NULL THEN rm.cta_pe ELSE 0 END), 0)
        ) AS cta_pe,

        jsonb_build_object(
            'index', 12,
            'label', 'CTA: AL (GE)',
            'month_beginning', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.prev_month AND rm.year = a.prev_year AND rm.meg_type = 'inventory' AND rm.cta_ge IS NOT NULL THEN rm.cta_ge ELSE 0 END), 0),
            'month_received', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'stock' AND rm.cta_ge IS NOT NULL THEN rm.cta_ge ELSE 0 END), 0),
            'month_total_start', (
                COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.prev_month AND rm.year = a.prev_year AND rm.meg_type = 'inventory' AND rm.cta_ge IS NOT NULL THEN rm.cta_ge ELSE 0 END), 0) +
                COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'stock' AND rm.cta_ge IS NOT NULL THEN rm.cta_ge ELSE 0 END), 0)
            ),
            'month_consumption', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'consumption' AND rm.cta_ge IS NOT NULL THEN rm.cta_ge ELSE 0 END), 0),
            'month_theoreticaly', (
                COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.prev_month AND rm.year = a.prev_year AND rm.meg_type = 'inventory' AND rm.cta_ge IS NOT NULL THEN rm.cta_ge ELSE 0 END), 0) +
                COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'stock' AND rm.cta_ge IS NOT NULL THEN rm.cta_ge ELSE 0 END), 0) -
                COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type IN ('consumption','loss','damaged','broken','expired') AND rm.cta_ge IS NOT NULL THEN rm.cta_ge ELSE 0 END), 0)
            ),
            'month_inventory', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'inventory' AND rm.cta_ge IS NOT NULL THEN rm.cta_ge ELSE 0 END), 0),
            'month_loss', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'loss' AND rm.cta_ge IS NOT NULL THEN rm.cta_ge ELSE 0 END), 0),
            'month_damaged', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'damaged' AND rm.cta_ge IS NOT NULL THEN rm.cta_ge ELSE 0 END), 0),
            'month_broken', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'broken' AND rm.cta_ge IS NOT NULL THEN rm.cta_ge ELSE 0 END), 0),
            'month_expired', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'expired' AND rm.cta_ge IS NOT NULL THEN rm.cta_ge ELSE 0 END), 0)
        ) AS cta_ge,

        jsonb_build_object(
            'index', 13,
            'label', 'CTA: AL (AD)',
            'month_beginning', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.prev_month AND rm.year = a.prev_year AND rm.meg_type = 'inventory' AND rm.cta_ad IS NOT NULL THEN rm.cta_ad ELSE 0 END), 0),
            'month_received', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'stock' AND rm.cta_ad IS NOT NULL THEN rm.cta_ad ELSE 0 END), 0),
            'month_total_start', (
                COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.prev_month AND rm.year = a.prev_year AND rm.meg_type = 'inventory' AND rm.cta_ad IS NOT NULL THEN rm.cta_ad ELSE 0 END), 0) +
                COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'stock' AND rm.cta_ad IS NOT NULL THEN rm.cta_ad ELSE 0 END), 0)
            ),
            'month_consumption', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'consumption' AND rm.cta_ad IS NOT NULL THEN rm.cta_ad ELSE 0 END), 0),
            'month_theoreticaly', (
                COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.prev_month AND rm.year = a.prev_year AND rm.meg_type = 'inventory' AND rm.cta_ad IS NOT NULL THEN rm.cta_ad ELSE 0 END), 0) +
                COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'stock' AND rm.cta_ad IS NOT NULL THEN rm.cta_ad ELSE 0 END), 0) -
                COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type IN ('consumption','loss','damaged','broken','expired') AND rm.cta_ad IS NOT NULL THEN rm.cta_ad ELSE 0 END), 0)
            ),
            'month_inventory', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'inventory' AND rm.cta_ad IS NOT NULL THEN rm.cta_ad ELSE 0 END), 0),
            'month_loss', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'loss' AND rm.cta_ad IS NOT NULL THEN rm.cta_ad ELSE 0 END), 0),
            'month_damaged', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'damaged' AND rm.cta_ad IS NOT NULL THEN rm.cta_ad ELSE 0 END), 0),
            'month_broken', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'broken' AND rm.cta_ad IS NOT NULL THEN rm.cta_ad ELSE 0 END), 0),
            'month_expired', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'expired' AND rm.cta_ad IS NOT NULL THEN rm.cta_ad ELSE 0 END), 0)
        ) AS cta_ad,

        jsonb_build_object(
            'index', 14,
            'label', 'TDR',
            'month_beginning', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.prev_month AND rm.year = a.prev_year AND rm.meg_type = 'inventory' AND rm.tdr IS NOT NULL THEN rm.tdr ELSE 0 END), 0),
            'month_received', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'stock' AND rm.tdr IS NOT NULL THEN rm.tdr ELSE 0 END), 0),
            'month_total_start', (
                COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.prev_month AND rm.year = a.prev_year AND rm.meg_type = 'inventory' AND rm.tdr IS NOT NULL THEN rm.tdr ELSE 0 END), 0) +
                COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'stock' AND rm.tdr IS NOT NULL THEN rm.tdr ELSE 0 END), 0)
            ),
            'month_consumption', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'consumption' AND rm.tdr IS NOT NULL THEN rm.tdr ELSE 0 END), 0),
            'month_theoreticaly', (
                COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.prev_month AND rm.year = a.prev_year AND rm.meg_type = 'inventory' AND rm.tdr IS NOT NULL THEN rm.tdr ELSE 0 END), 0) +
                COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'stock' AND rm.tdr IS NOT NULL THEN rm.tdr ELSE 0 END), 0) -
                COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type IN ('consumption','loss','damaged','broken','expired') AND rm.tdr IS NOT NULL THEN rm.tdr ELSE 0 END), 0)
            ),
            'month_inventory', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'inventory' AND rm.tdr IS NOT NULL THEN rm.tdr ELSE 0 END), 0),
            'month_loss', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'loss' AND rm.tdr IS NOT NULL THEN rm.tdr ELSE 0 END), 0),
            'month_damaged', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'damaged' AND rm.tdr IS NOT NULL THEN rm.tdr ELSE 0 END), 0),
            'month_broken', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'broken' AND rm.tdr IS NOT NULL THEN rm.tdr ELSE 0 END), 0),
            'month_expired', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'expired' AND rm.tdr IS NOT NULL THEN rm.tdr ELSE 0 END), 0)
        ) AS tdr,

        jsonb_build_object(
            'index', 15,
            'label', 'Vitamin A',
            'month_beginning', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.prev_month AND rm.year = a.prev_year AND rm.meg_type = 'inventory' AND rm.vitamin_a IS NOT NULL THEN rm.vitamin_a ELSE 0 END), 0),
            'month_received', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'stock' AND rm.vitamin_a IS NOT NULL THEN rm.vitamin_a ELSE 0 END), 0),
            'month_total_start', (
                COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.prev_month AND rm.year = a.prev_year AND rm.meg_type = 'inventory' AND rm.vitamin_a IS NOT NULL THEN rm.vitamin_a ELSE 0 END), 0) +
                COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'stock' AND rm.vitamin_a IS NOT NULL THEN rm.vitamin_a ELSE 0 END), 0)
            ),
            'month_consumption', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'consumption' AND rm.vitamin_a IS NOT NULL THEN rm.vitamin_a ELSE 0 END), 0),
            'month_theoreticaly', (
                COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.prev_month AND rm.year = a.prev_year AND rm.meg_type = 'inventory' AND rm.vitamin_a IS NOT NULL THEN rm.vitamin_a ELSE 0 END), 0) +
                COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'stock' AND rm.vitamin_a IS NOT NULL THEN rm.vitamin_a ELSE 0 END), 0) -
                COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type IN ('consumption','loss','damaged','broken','expired') AND rm.vitamin_a IS NOT NULL THEN rm.vitamin_a ELSE 0 END), 0)
            ),
            'month_inventory', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'inventory' AND rm.vitamin_a IS NOT NULL THEN rm.vitamin_a ELSE 0 END), 0),
            'month_loss', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'loss' AND rm.vitamin_a IS NOT NULL THEN rm.vitamin_a ELSE 0 END), 0),
            'month_damaged', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'damaged' AND rm.vitamin_a IS NOT NULL THEN rm.vitamin_a ELSE 0 END), 0),
            'month_broken', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'broken' AND rm.vitamin_a IS NOT NULL THEN rm.vitamin_a ELSE 0 END), 0),
            'month_expired', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'expired' AND rm.vitamin_a IS NOT NULL THEN rm.vitamin_a ELSE 0 END), 0)
        ) AS vitamin_a,

        jsonb_build_object(
            'index', 16,
            'label', 'Pillule COC',
            'month_beginning', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.prev_month AND rm.year = a.prev_year AND rm.meg_type = 'inventory' AND rm.pill_coc IS NOT NULL THEN rm.pill_coc ELSE 0 END), 0),
            'month_received', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'stock' AND rm.pill_coc IS NOT NULL THEN rm.pill_coc ELSE 0 END), 0),
            'month_total_start', (
                COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.prev_month AND rm.year = a.prev_year AND rm.meg_type = 'inventory' AND rm.pill_coc IS NOT NULL THEN rm.pill_coc ELSE 0 END), 0) +
                COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'stock' AND rm.pill_coc IS NOT NULL THEN rm.pill_coc ELSE 0 END), 0)
            ),
            'month_consumption', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'consumption' AND rm.pill_coc IS NOT NULL THEN rm.pill_coc ELSE 0 END), 0),
            'month_theoreticaly', (
                COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.prev_month AND rm.year = a.prev_year AND rm.meg_type = 'inventory' AND rm.pill_coc IS NOT NULL THEN rm.pill_coc ELSE 0 END), 0) +
                COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'stock' AND rm.pill_coc IS NOT NULL THEN rm.pill_coc ELSE 0 END), 0) -
                COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type IN ('consumption','loss','damaged','broken','expired') AND rm.pill_coc IS NOT NULL THEN rm.pill_coc ELSE 0 END), 0)
            ),
            'month_inventory', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'inventory' AND rm.pill_coc IS NOT NULL THEN rm.pill_coc ELSE 0 END), 0),
            'month_loss', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'loss' AND rm.pill_coc IS NOT NULL THEN rm.pill_coc ELSE 0 END), 0),
            'month_damaged', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'damaged' AND rm.pill_coc IS NOT NULL THEN rm.pill_coc ELSE 0 END), 0),
            'month_broken', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'broken' AND rm.pill_coc IS NOT NULL THEN rm.pill_coc ELSE 0 END), 0),
            'month_expired', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'expired' AND rm.pill_coc IS NOT NULL THEN rm.pill_coc ELSE 0 END), 0)
        ) AS pill_coc,

        jsonb_build_object(
            'index', 17,
            'label', 'Pillule COP',
            'month_beginning', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.prev_month AND rm.year = a.prev_year AND rm.meg_type = 'inventory' AND rm.pill_cop IS NOT NULL THEN rm.pill_cop ELSE 0 END), 0),
            'month_received', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'stock' AND rm.pill_cop IS NOT NULL THEN rm.pill_cop ELSE 0 END), 0),
            'month_total_start', (
                COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.prev_month AND rm.year = a.prev_year AND rm.meg_type = 'inventory' AND rm.pill_cop IS NOT NULL THEN rm.pill_cop ELSE 0 END), 0) +
                COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'stock' AND rm.pill_cop IS NOT NULL THEN rm.pill_cop ELSE 0 END), 0)
            ),
            'month_consumption', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'consumption' AND rm.pill_cop IS NOT NULL THEN rm.pill_cop ELSE 0 END), 0),
            'month_theoreticaly', (
                COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.prev_month AND rm.year = a.prev_year AND rm.meg_type = 'inventory' AND rm.pill_cop IS NOT NULL THEN rm.pill_cop ELSE 0 END), 0) +
                COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'stock' AND rm.pill_cop IS NOT NULL THEN rm.pill_cop ELSE 0 END), 0) -
                COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type IN ('consumption','loss','damaged','broken','expired') AND rm.pill_cop IS NOT NULL THEN rm.pill_cop ELSE 0 END), 0)
            ),
            'month_inventory', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'inventory' AND rm.pill_cop IS NOT NULL THEN rm.pill_cop ELSE 0 END), 0),
            'month_loss', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'loss' AND rm.pill_cop IS NOT NULL THEN rm.pill_cop ELSE 0 END), 0),
            'month_damaged', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'damaged' AND rm.pill_cop IS NOT NULL THEN rm.pill_cop ELSE 0 END), 0),
            'month_broken', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'broken' AND rm.pill_cop IS NOT NULL THEN rm.pill_cop ELSE 0 END), 0),
            'month_expired', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'expired' AND rm.pill_cop IS NOT NULL THEN rm.pill_cop ELSE 0 END), 0)
        ) AS pill_cop,

        jsonb_build_object(
            'index', 18,
            'label', 'Condoms',
            'month_beginning', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.prev_month AND rm.year = a.prev_year AND rm.meg_type = 'inventory' AND rm.condoms IS NOT NULL THEN rm.condoms ELSE 0 END), 0),
            'month_received', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'stock' AND rm.condoms IS NOT NULL THEN rm.condoms ELSE 0 END), 0),
            'month_total_start', (
                COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.prev_month AND rm.year = a.prev_year AND rm.meg_type = 'inventory' AND rm.condoms IS NOT NULL THEN rm.condoms ELSE 0 END), 0) +
                COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'stock' AND rm.condoms IS NOT NULL THEN rm.condoms ELSE 0 END), 0)
            ),
            'month_consumption', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'consumption' AND rm.condoms IS NOT NULL THEN rm.condoms ELSE 0 END), 0),
            'month_theoreticaly', (
                COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.prev_month AND rm.year = a.prev_year AND rm.meg_type = 'inventory' AND rm.condoms IS NOT NULL THEN rm.condoms ELSE 0 END), 0) +
                COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'stock' AND rm.condoms IS NOT NULL THEN rm.condoms ELSE 0 END), 0) -
                COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type IN ('consumption','loss','damaged','broken','expired') AND rm.condoms IS NOT NULL THEN rm.condoms ELSE 0 END), 0)
            ),
            'month_inventory', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'inventory' AND rm.condoms IS NOT NULL THEN rm.condoms ELSE 0 END), 0),
            'month_loss', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'loss' AND rm.condoms IS NOT NULL THEN rm.condoms ELSE 0 END), 0),
            'month_damaged', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'damaged' AND rm.condoms IS NOT NULL THEN rm.condoms ELSE 0 END), 0),
            'month_broken', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'broken' AND rm.condoms IS NOT NULL THEN rm.condoms ELSE 0 END), 0),
            'month_expired', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'expired' AND rm.condoms IS NOT NULL THEN rm.condoms ELSE 0 END), 0)
        ) AS condoms,

        jsonb_build_object(
            'index', 19,
            'label', 'Dmpa SC (Sayana-press)',
            'month_beginning', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.prev_month AND rm.year = a.prev_year AND rm.meg_type = 'inventory' AND rm.dmpa_sc IS NOT NULL THEN rm.dmpa_sc ELSE 0 END), 0),
            'month_received', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'stock' AND rm.dmpa_sc IS NOT NULL THEN rm.dmpa_sc ELSE 0 END), 0),
            'month_total_start', (
                COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.prev_month AND rm.year = a.prev_year AND rm.meg_type = 'inventory' AND rm.dmpa_sc IS NOT NULL THEN rm.dmpa_sc ELSE 0 END), 0) +
                COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'stock' AND rm.dmpa_sc IS NOT NULL THEN rm.dmpa_sc ELSE 0 END), 0)
            ),
            'month_consumption', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'consumption' AND rm.dmpa_sc IS NOT NULL THEN rm.dmpa_sc ELSE 0 END), 0),
            'month_theoreticaly', (
                COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.prev_month AND rm.year = a.prev_year AND rm.meg_type = 'inventory' AND rm.dmpa_sc IS NOT NULL THEN rm.dmpa_sc ELSE 0 END), 0) +
                COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'stock' AND rm.dmpa_sc IS NOT NULL THEN rm.dmpa_sc ELSE 0 END), 0) -
                COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type IN ('consumption','loss','damaged','broken','expired') AND rm.dmpa_sc IS NOT NULL THEN rm.dmpa_sc ELSE 0 END), 0)
            ),
            'month_inventory', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'inventory' AND rm.dmpa_sc IS NOT NULL THEN rm.dmpa_sc ELSE 0 END), 0),
            'month_loss', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'loss' AND rm.dmpa_sc IS NOT NULL THEN rm.dmpa_sc ELSE 0 END), 0),
            'month_damaged', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'damaged' AND rm.dmpa_sc IS NOT NULL THEN rm.dmpa_sc ELSE 0 END), 0),
            'month_broken', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'broken' AND rm.dmpa_sc IS NOT NULL THEN rm.dmpa_sc ELSE 0 END), 0),
            'month_expired', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'expired' AND rm.dmpa_sc IS NOT NULL THEN rm.dmpa_sc ELSE 0 END), 0)
        ) AS dmpa_sc,

        jsonb_build_object(
            'index', 20,
            'label', 'Implant',
            'month_beginning', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.prev_month AND rm.year = a.prev_year AND rm.meg_type = 'inventory' AND rm.implant IS NOT NULL THEN rm.implant ELSE 0 END), 0),
            'month_received', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'stock' AND rm.implant IS NOT NULL THEN rm.implant ELSE 0 END), 0),
            'month_total_start', (
                COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.prev_month AND rm.year = a.prev_year AND rm.meg_type = 'inventory' AND rm.implant IS NOT NULL THEN rm.implant ELSE 0 END), 0) +
                COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'stock' AND rm.implant IS NOT NULL THEN rm.implant ELSE 0 END), 0)
            ),
            'month_consumption', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'consumption' AND rm.implant IS NOT NULL THEN rm.implant ELSE 0 END), 0),
            'month_theoreticaly', (
                COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.prev_month AND rm.year = a.prev_year AND rm.meg_type = 'inventory' AND rm.implant IS NOT NULL THEN rm.implant ELSE 0 END), 0) +
                COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'stock' AND rm.implant IS NOT NULL THEN rm.implant ELSE 0 END), 0) -
                COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type IN ('consumption','loss','damaged','broken','expired') AND rm.implant IS NOT NULL THEN rm.implant ELSE 0 END), 0)
            ),
            'month_inventory', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'inventory' AND rm.implant IS NOT NULL THEN rm.implant ELSE 0 END), 0),
            'month_loss', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'loss' AND rm.implant IS NOT NULL THEN rm.implant ELSE 0 END), 0),
            'month_damaged', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'damaged' AND rm.implant IS NOT NULL THEN rm.implant ELSE 0 END), 0),
            'month_broken', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'broken' AND rm.implant IS NOT NULL THEN rm.implant ELSE 0 END), 0),
            'month_expired', COALESCE(SUM(CASE WHEN rm.reco_id = a.reco_id AND rm.month = a.month AND rm.year = a.year AND rm.meg_type = 'expired' AND rm.implant IS NOT NULL THEN rm.implant ELSE 0 END), 0)
        ) AS implant,



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

        LEFT JOIN reco_meg_data_view rm ON rm.reco_id = a.reco_id

    GROUP BY a.reco_id, a.month, a.year, a.prev_year, a.prev_month;
