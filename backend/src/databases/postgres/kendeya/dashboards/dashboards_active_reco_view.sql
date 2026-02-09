CREATE MATERIALIZED VIEW IF NOT EXISTS dashboards_active_reco_view AS
    SELECT 
        CONCAT(a.year, '-', a.reco_id) AS id,
        a.year,
        a.reco_id,

        -- Mois (JAN à DEC) : activité de couverture, supervision, fonctionnalité
        jsonb_build_object(
            'cover',       COUNT(cv.*) FILTER (WHERE cv.month = '01') > 0,
            'supervised',  COUNT(sv.*) FILTER (WHERE sv.month = '01') > 0,
            'fonctionnal', COUNT(fv.*) FILTER (WHERE fv.month = '01') > 0
        ) AS jan,

        jsonb_build_object(
            'cover',       COUNT(cv.*) FILTER (WHERE cv.month = '02') > 0,
            'supervised',  COUNT(sv.*) FILTER (WHERE sv.month = '02') > 0,
            'fonctionnal', COUNT(fv.*) FILTER (WHERE fv.month = '02') > 0
        ) AS fev,

        jsonb_build_object(
            'cover',       COUNT(cv.*) FILTER (WHERE cv.month = '03') > 0,
            'supervised',  COUNT(sv.*) FILTER (WHERE sv.month = '03') > 0,
            'fonctionnal', COUNT(fv.*) FILTER (WHERE fv.month = '03') > 0
        ) AS mar,

        jsonb_build_object(
            'cover',       COUNT(cv.*) FILTER (WHERE cv.month = '04') > 0,
            'supervised',  COUNT(sv.*) FILTER (WHERE sv.month = '04') > 0,
            'fonctionnal', COUNT(fv.*) FILTER (WHERE fv.month = '04') > 0
        ) AS avr,

        jsonb_build_object(
            'cover',       COUNT(cv.*) FILTER (WHERE cv.month = '05') > 0,
            'supervised',  COUNT(sv.*) FILTER (WHERE sv.month = '05') > 0,
            'fonctionnal', COUNT(fv.*) FILTER (WHERE fv.month = '05') > 0
        ) AS mai,

        jsonb_build_object(
            'cover',       COUNT(cv.*) FILTER (WHERE cv.month = '06') > 0,
            'supervised',  COUNT(sv.*) FILTER (WHERE sv.month = '06') > 0,
            'fonctionnal', COUNT(fv.*) FILTER (WHERE fv.month = '06') > 0
        ) AS jui,

        jsonb_build_object(
            'cover',       COUNT(cv.*) FILTER (WHERE cv.month = '07') > 0,
            'supervised',  COUNT(sv.*) FILTER (WHERE sv.month = '07') > 0,
            'fonctionnal', COUNT(fv.*) FILTER (WHERE fv.month = '07') > 0
        ) AS jul,

        jsonb_build_object(
            'cover',       COUNT(cv.*) FILTER (WHERE cv.month = '08') > 0,
            'supervised',  COUNT(sv.*) FILTER (WHERE sv.month = '08') > 0,
            'fonctionnal', COUNT(fv.*) FILTER (WHERE fv.month = '08') > 0
        ) AS aou,

        jsonb_build_object(
            'cover',       COUNT(cv.*) FILTER (WHERE cv.month = '09') > 0,
            'supervised',  COUNT(sv.*) FILTER (WHERE sv.month = '09') > 0,
            'fonctionnal', COUNT(fv.*) FILTER (WHERE fv.month = '09') > 0
        ) AS sep,

        jsonb_build_object(
            'cover',       COUNT(cv.*) FILTER (WHERE cv.month = '10') > 0,
            'supervised',  COUNT(sv.*) FILTER (WHERE sv.month = '10') > 0,
            'fonctionnal', COUNT(fv.*) FILTER (WHERE fv.month = '10') > 0
        ) AS oct,

        jsonb_build_object(
            'cover',       COUNT(cv.*) FILTER (WHERE cv.month = '11') > 0,
            'supervised',  COUNT(sv.*) FILTER (WHERE sv.month = '11') > 0,
            'fonctionnal', COUNT(fv.*) FILTER (WHERE fv.month = '11') > 0
        ) AS nov,

        jsonb_build_object(
            'cover',       COUNT(cv.*) FILTER (WHERE cv.month = '12') > 0,
            'supervised',  COUNT(sv.*) FILTER (WHERE sv.month = '12') > 0,
            'fonctionnal', COUNT(fv.*) FILTER (WHERE fv.month = '12') > 0
        ) AS dec,

        -- Données RECO et CHW
        jsonb_build_object('id', MAX(r.id), 'name', MAX(r.name), 'phone', MAX(r.phone)) AS reco,
        jsonb_build_object('id', MAX(w.id), 'name', MAX(w.name), 'phone', MAX(w.phone)) AS chw,

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

        -- Jointure CHW
        LEFT JOIN chw_view w ON w.district_quartier_id = r.district_quartier_id

        -- Couverture, supervision, fonctionnalité
        LEFT JOIN report_all_cover_reco_view cv ON cv.reco_id = a.reco_id AND cv.year = a.year

        LEFT JOIN reco_chws_supervision_view sv ON sv.reco_id = a.reco_id AND sv.year = a.year

        LEFT JOIN report_all_functional_reco_view fv ON fv.reco_id = a.reco_id AND fv.year = a.year

    GROUP BY a.reco_id, a.year;
