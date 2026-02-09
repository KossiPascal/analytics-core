CREATE MATERIALIZED VIEW IF NOT EXISTS dashboards_reco_performance_full_year_view AS 
    WITH months AS (
        SELECT unnest(ARRAY['01','02','03','04','05','06','07','08','09','10','11','12']) AS month
    ),
    colors AS (
        SELECT generate_random_colors(COALESCE((SELECT COUNT(id) FROM reco_view), 1) * 30) AS color
    )

    SELECT 
        CONCAT(a.year, '-', a.reco_id) AS id,
        a.year,
        a.reco_id,

        -- safe_monthly_count('adult_data_view', a.reco_id, a.year, 'Adult') AS adult_data_count,
        -- safe_monthly_count('family_planning_data_view', a.reco_id, a.year, 'PF') AS family_planning_data_count,
        -- safe_monthly_count('newborn_data_view', a.reco_id, a.year, 'Nouveau Né') AS newborn_data_count,
        -- safe_monthly_count('pcimne_data_view', a.reco_id, a.year, 'Pcimne') AS pcimne_data_count,
        -- safe_monthly_count('pregnant_data_view', a.reco_id, a.year, 'Enceinte') AS pregnant_data_count,
        -- safe_monthly_count('referal_data_view', a.reco_id, a.year, 'Suivi Référence') AS referal_data_count,
        -- safe_monthly_count('delivery_data_view', a.reco_id, a.year, 'Accouchement') AS delivery_data_count,
        -- safe_monthly_count('events_data_view', a.reco_id, a.year, 'Evenements') AS events_data_count,
        -- safe_monthly_count('promotional_data_view', a.reco_id, a.year, 'Activités Promotionnelles') AS promotional_data_count,
        -- safe_monthly_count('death_data_view', a.reco_id, a.year, 'Décès') AS death_data_count,


        jsonb_build_object(
            'label', 'Adult',
            'color', (SELECT color FROM colors LIMIT 1)[1],
            'data', (
                SELECT jsonb_object_agg(month, data_count)
                FROM (
                    SELECT m.month, COUNT(v.id) AS data_count
                    FROM months m
                    LEFT JOIN adult_data_view v ON v.month = m.month AND v.year = a.year AND v.reco_id = a.reco_id GROUP BY m.month
                ) sub
            )
        ) AS adult_data_count,

        jsonb_build_object(
            'label', 'PF',
            'color', (SELECT color FROM colors LIMIT 1)[1],
            'data', (
                SELECT jsonb_object_agg(month, data_count)
                FROM (
                    SELECT m.month, COUNT(v.id) AS data_count
                    FROM months m
                    LEFT JOIN family_planning_data_view v ON v.month = m.month AND v.year = a.year AND v.reco_id = a.reco_id GROUP BY m.month
                ) sub
            )
        ) AS family_planning_data_count,

        jsonb_build_object(
            'label', 'Nouveau Né',
            'color', (SELECT color FROM colors LIMIT 1)[1],
            'data', (
                SELECT jsonb_object_agg(month, data_count)
                FROM (
                    SELECT m.month, COUNT(v.id) AS data_count
                    FROM months m
                    LEFT JOIN newborn_data_view v ON v.month = m.month AND v.year = a.year AND v.reco_id = a.reco_id GROUP BY m.month
                ) sub
            )
        ) AS newborn_data_count,

        jsonb_build_object(
            'label', 'Pcimne',
            'color', (SELECT color FROM colors LIMIT 1)[1],
            'data', (
                SELECT jsonb_object_agg(month, data_count)
                FROM (
                    SELECT m.month, COUNT(v.id) AS data_count
                    FROM months m
                    LEFT JOIN pcimne_data_view v ON v.month = m.month AND v.year = a.year AND v.reco_id = a.reco_id GROUP BY m.month
                ) sub
            )
        ) AS pcimne_data_count,

        jsonb_build_object(
            'label', 'Enceinte',
            'color', (SELECT color FROM colors LIMIT 1)[1],
            'data', (
                SELECT jsonb_object_agg(month, data_count)
                FROM (
                    SELECT m.month, COUNT(v.id) AS data_count
                    FROM months m
                    LEFT JOIN pregnant_data_view v ON v.month = m.month AND v.year = a.year AND v.reco_id = a.reco_id GROUP BY m.month
                ) sub
            )
        ) AS pregnant_data_count,

        jsonb_build_object(
            'label', 'Suivi Référence',
            'color', (SELECT color FROM colors LIMIT 1)[1],
            'data', (
                SELECT jsonb_object_agg(month, data_count)
                FROM (
                    SELECT m.month, COUNT(v.id) AS data_count
                    FROM months m
                    LEFT JOIN referal_data_view v ON v.month = m.month AND v.year = a.year AND v.reco_id = a.reco_id GROUP BY m.month
                ) sub
            )
        ) AS referal_data_count,

        jsonb_build_object(
            'label', 'Accouchement',
            'color', (SELECT color FROM colors LIMIT 1)[1],
            'data', (
                SELECT jsonb_object_agg(month, data_count)
                FROM (
                    SELECT m.month, COUNT(v.id) AS data_count
                    FROM months m
                    LEFT JOIN delivery_data_view v ON v.month = m.month AND v.year = a.year AND v.reco_id = a.reco_id GROUP BY m.month
                ) sub
            )
        ) AS delivery_data_count,

        jsonb_build_object(
            'label', 'Evenements',
            'color', (SELECT color FROM colors LIMIT 1)[1],
            'data', (
                SELECT jsonb_object_agg(month, data_count)
                FROM (
                    SELECT m.month, COUNT(v.id) AS data_count
                    FROM months m
                    LEFT JOIN events_data_view v ON v.month = m.month AND v.year = a.year AND v.reco_id = a.reco_id GROUP BY m.month
                ) sub
            )
        ) AS events_data_count,

        jsonb_build_object(
            'label', 'Activités Promotionnelles',
            'color', (SELECT color FROM colors LIMIT 1)[1],
            'data', (
                SELECT jsonb_object_agg(month, data_count)
                FROM (
                    SELECT m.month, COUNT(v.id) AS data_count
                    FROM months m
                    LEFT JOIN promotional_data_view v ON v.month = m.month AND v.year = a.year AND v.reco_id = a.reco_id GROUP BY m.month
                ) sub
            )
        ) AS promotional_data_count,

        jsonb_build_object(
            'label', 'Décès',
            'color', (SELECT color FROM colors LIMIT 1)[1],
            'data', (
                SELECT jsonb_object_agg(month, data_count)
                FROM (
                    SELECT m.month, COUNT(v.id) AS data_count
                    FROM months m
                    LEFT JOIN death_data_view v ON v.month = m.month AND v.year = a.year AND v.reco_id = a.reco_id GROUP BY m.month
                ) sub
            )
        ) AS death_data_count,

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

    GROUP BY a.reco_id, a.year;
