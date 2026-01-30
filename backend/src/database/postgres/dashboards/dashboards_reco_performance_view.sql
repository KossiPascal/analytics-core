CREATE MATERIALIZED VIEW IF NOT EXISTS dashboards_reco_performance_view AS 

    SELECT 
        CONCAT(a.month, '-', a.year, '-', a.reco_id) AS id,
        a.month,
        a.year,
        a.reco_id,

        -- Adult data
        (SELECT jsonb_build_object(
                'consultation', COUNT(id) FILTER (WHERE consultation_followup = 'consultation'),
                'followup',     COUNT(id) FILTER (WHERE consultation_followup <> 'consultation'),
                'total',        COUNT(id)
            ) FROM adult_data_view WHERE month = a.month AND year = a.year AND reco_id = a.reco_id
        ) AS adult_data_count,

        -- Family planning data
        (SELECT jsonb_build_object(
                'consultation', COUNT(id) FILTER (WHERE consultation_followup = 'consultation'),
                'followup',     COUNT(id) FILTER (WHERE consultation_followup <> 'consultation'),
                'total',        COUNT(id)
            ) FROM family_planning_data_view WHERE month = a.month AND year = a.year AND reco_id = a.reco_id
        ) AS family_planning_data_count,

        -- Newborn data
        (SELECT jsonb_build_object(
                'consultation', COUNT(id) FILTER (WHERE consultation_followup = 'consultation'),
                'followup',     COUNT(id) FILTER (WHERE consultation_followup <> 'consultation'),
                'total',        COUNT(id)
            ) FROM newborn_data_view WHERE month = a.month AND year = a.year AND reco_id = a.reco_id
        ) AS newborn_data_count,

        -- PCIMNE data
        (SELECT jsonb_build_object(
                'consultation', COUNT(id) FILTER (WHERE consultation_followup = 'consultation'),
                'followup',     COUNT(id) FILTER (WHERE consultation_followup <> 'consultation'),
                'total',        COUNT(id)
            ) FROM pcimne_data_view WHERE month = a.month AND year = a.year AND reco_id = a.reco_id
        ) AS pcimne_data_count,

        -- Pregnant data
        (SELECT jsonb_build_object(
                'consultation', COUNT(id) FILTER (WHERE consultation_followup = 'consultation'),
                'followup',     COUNT(id) FILTER (WHERE consultation_followup <> 'consultation'),
                'total',        COUNT(id)
            ) FROM pregnant_data_view WHERE month = a.month AND year = a.year AND reco_id = a.reco_id
        ) AS pregnant_data_count,

        -- All consultations and follow-ups
        (SELECT jsonb_build_object(
                'consultation', COUNT(id) FILTER (WHERE consultation_followup = 'consultation'),
                'followup',     COUNT(id) FILTER (WHERE consultation_followup <> 'consultation'),
                'total',        COUNT(id)
            ) FROM dash_consultation_followup_view WHERE month = a.month AND year = a.year AND reco_id = a.reco_id
        ) AS all_consultation_followup_count,

        -- Simple counts
        (SELECT COUNT(id) FROM referal_data_view WHERE month = a.month AND year = a.year AND reco_id = a.reco_id) AS referal_data_count,

        (SELECT COUNT(id) FROM delivery_data_view WHERE month = a.month AND year = a.year AND reco_id = a.reco_id) AS delivery_data_count,

        (SELECT COUNT(id) FROM events_data_view WHERE month = a.month AND year = a.year AND reco_id = a.reco_id) AS events_data_count,

        (SELECT COUNT(id) FROM promotional_data_view WHERE month = a.month AND year = a.year AND reco_id = a.reco_id) AS promotional_data_count,

        (SELECT COUNT(id) FROM death_data_view WHERE month = a.month AND year = a.year AND reco_id = a.reco_id) AS death_data_count,

        (SELECT COUNT(id) FROM dash_all_actions_view WHERE month = a.month AND year = a.year AND reco_id = a.reco_id) AS all_actions_count,

        (SELECT COUNT(id) FROM family_view WHERE month = a.month AND year = a.year AND reco_id = a.reco_id) AS family_count,

        (SELECT COUNT(id) FROM patient_view WHERE month = a.month AND year = a.year AND reco_id = a.reco_id) AS patient_count,

        -- Données RECO et CHW
        jsonb_build_object('id', MAX(r.id), 'name', MAX(r.name), 'phone', MAX(r.phone)) AS reco,

        -- Localisation géographique
        jsonb_build_object('id', MAX(c.id), 'name', MAX(c.name)) AS country,
        jsonb_build_object('id', MAX(g.id), 'name', MAX(g.name)) AS region,
        jsonb_build_object('id', MAX(p.id), 'name', MAX(p.name)) AS prefecture,
        jsonb_build_object('id', MAX(m.id), 'name', MAX(m.name)) AS commune,
        jsonb_build_object('id', MAX(h.id), 'name', MAX(h.name)) AS hospital,
        jsonb_build_object('id', MAX(d.id), 'name', MAX(d.name)) AS district_quartier,
        jsonb_build_object('id', MAX(v.id), 'name', MAX(v.name)) AS village_secteur


    FROM year_month_reco_grid_view a

        JOIN reco_view r ON r.id = a.reco_id

        -- Jointure localisation
        LEFT JOIN country_view c ON c.id = a.country_id
        LEFT JOIN region_view g ON g.id = a.region_id
        LEFT JOIN prefecture_view p ON p.id = a.prefecture_id
        LEFT JOIN commune_view m ON m.id = a.commune_id
        LEFT JOIN hospital_view h ON h.id = a.hospital_id
        LEFT JOIN district_quartier_view d ON d.id = a.district_quartier_id
        LEFT JOIN village_secteur_view v ON v.id = a.village_secteur_id

    GROUP BY a.reco_id, a.month, a.year;
