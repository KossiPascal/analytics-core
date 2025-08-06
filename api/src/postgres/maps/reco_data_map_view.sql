CREATE MATERIALIZED VIEW IF NOT EXISTS reco_data_map_view AS
    SELECT 
        CONCAT(a.month, '-', a.year, '-', a.reco_id, '-', a.patient_id, '-') AS id,
        a.month,
        a.year,
        a.reco_id,
        a.patient_id,

        MAX(a.form) AS form,
        MAX(a.reported_date) AS reported_date,

        MAX((a.geolocation->>'latitude')::DOUBLE PRECISION) AS latitude,
        MAX((a.geolocation->>'longitude')::DOUBLE PRECISION) AS longitude,
        MAX((a.geolocation->>'accuracy')::DOUBLE PRECISION) AS accuracy,
        MAX((a.geolocation->>'altitude')::DOUBLE PRECISION) AS altitude,
        MAX((a.geolocation->>'altitudeAccuracy')::DOUBLE PRECISION) AS altitudeAccuracy,
        MAX((a.geolocation->>'heading')::DOUBLE PRECISION) AS heading,
        MAX((a.geolocation->>'speed')::DOUBLE PRECISION) AS speed,

        jsonb_build_object('id', MAX(r.id), 'name', MAX(r.name), 'phone', MAX(r.phone)) AS reco,
        jsonb_build_object('id', MAX(c.id), 'name', MAX(c.name)) AS country,
        jsonb_build_object('id', MAX(g.id), 'name', MAX(g.name)) AS region,
        jsonb_build_object('id', MAX(p.id), 'name', MAX(p.name)) AS prefecture,
        jsonb_build_object('id', MAX(m.id), 'name', MAX(m.name)) AS commune,
        jsonb_build_object('id', MAX(h.id), 'name', MAX(h.name)) AS hospital,
        jsonb_build_object('id', MAX(d.id), 'name', MAX(d.name)) AS district_quartier,
        jsonb_build_object('id', MAX(v.id), 'name', MAX(v.name)) AS village_secteur,
        jsonb_build_object('id', MAX(pt.id), 'name', MAX(pt.name), 'external_id', MAX(pt.external_id), 'code', MAX(pt.code), 'sex', MAX(pt.sex), 'birth_date', MAX(pt.birth_date)) AS patient,
        jsonb_build_object('id', MAX(f.id), 'name', MAX(f.name), 'given_name', MAX(f.given_name), 'external_id', MAX(f.external_id), 'code', MAX(f.code)) AS family

    FROM reco_view r

    RIGHT JOIN (
        SELECT id, form, month, year, geolocation, patient_id, family_id, reported_date, reco_id, country_id, region_id, prefecture_id, commune_id, hospital_id, district_quartier_id, village_secteur_id 

        FROM (
            -- UNION de toutes les tables avec les mêmes colonnes
            SELECT id, form, month, year, geolocation, patient_id, family_id, reported_date, reco_id, country_id, region_id, prefecture_id, commune_id, hospital_id, district_quartier_id, village_secteur_id FROM vaccination_data_view 
            UNION ALL 
            SELECT id, form, month, year, geolocation, patient_id, family_id, reported_date, reco_id, country_id, region_id, prefecture_id, commune_id, hospital_id, district_quartier_id, village_secteur_id FROM pcimne_data_view 
            UNION ALL 
            SELECT id, form, month, year, geolocation, patient_id, family_id, reported_date, reco_id, country_id, region_id, prefecture_id, commune_id, hospital_id, district_quartier_id, village_secteur_id FROM newborn_data_view 
            UNION ALL 
            SELECT id, form, month, year, geolocation, patient_id, family_id, reported_date, reco_id, country_id, region_id, prefecture_id, commune_id, hospital_id, district_quartier_id, village_secteur_id FROM death_data_view 
            UNION ALL 
            SELECT id, form, month, year, geolocation, patient_id, family_id, reported_date, reco_id, country_id, region_id, prefecture_id, commune_id, hospital_id, district_quartier_id, village_secteur_id FROM adult_data_view 
            UNION ALL 
            -- SELECT id, form, month, year, geolocation, patient_id, family_id, reported_date, reco_id, country_id, region_id, prefecture_id, commune_id, hospital_id, district_quartier_id, village_secteur_id FROM promotional_data_view 
            -- UNION ALL 
            -- SELECT id, form, month, year, geolocation, patient_id, family_id, reported_date, reco_id, country_id, region_id, prefecture_id, commune_id, hospital_id, district_quartier_id, village_secteur_id FROM events_data_view 
            -- UNION ALL 
            SELECT id, form, month, year, geolocation, patient_id, family_id, reported_date, reco_id, country_id, region_id, prefecture_id, commune_id, hospital_id, district_quartier_id, village_secteur_id FROM pregnant_data_view 
            UNION ALL 
            SELECT id, form, month, year, geolocation, patient_id, family_id, reported_date, reco_id, country_id, region_id, prefecture_id, commune_id, hospital_id, district_quartier_id, village_secteur_id FROM delivery_data_view 
            UNION ALL 
            SELECT id, form, month, year, geolocation, patient_id, family_id, reported_date, reco_id, country_id, region_id, prefecture_id, commune_id, hospital_id, district_quartier_id, village_secteur_id FROM family_planning_data_view 
            UNION ALL 
            SELECT id, form, month, year, geolocation, patient_id, family_id, reported_date, reco_id, country_id, region_id, prefecture_id, commune_id, hospital_id, district_quartier_id, village_secteur_id FROM referal_data_view 
        ) AS merged_data

    ) AS a ON a.reco_id = r.id 

    LEFT JOIN country_view c ON a.country_id = c.id
    LEFT JOIN region_view g ON a.region_id = g.id
    LEFT JOIN prefecture_view p ON a.prefecture_id = p.id
    LEFT JOIN commune_view m ON a.commune_id = m.id
    LEFT JOIN hospital_view h ON a.hospital_id = h.id
    LEFT JOIN district_quartier_view d ON a.district_quartier_id = d.id
    LEFT JOIN village_secteur_view v ON a.village_secteur_id = v.id
    LEFT JOIN patient_view pt ON a.patient_id = pt.id
    LEFT JOIN family_view f ON a.family_id = f.id


    WHERE 
        c.id IS NOT NULL AND g.id IS NOT NULL AND p.id IS NOT NULL AND m.id IS NOT NULL AND h.id IS NOT NULL AND d.id IS NOT NULL AND v.id IS NOT NULL AND pt.id IS NOT NULL 
        
    GROUP BY a.reco_id, a.month, a.year, a.patient_id;
