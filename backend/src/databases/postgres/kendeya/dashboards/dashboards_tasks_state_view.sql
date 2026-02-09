
CREATE MATERIALIZED VIEW IF NOT EXISTS dashboards_tasks_state_view AS
    WITH tasks_per_patient AS (
        SELECT 
            r.id AS reco_id,
            a.due_date::DATE AS due_date,
            a.patient_id,
            jsonb_agg(
                jsonb_build_object(
                    'title', a.title,
                    'due_date', a.due_date,

                    'start_date', a.start_date,
                    'end_date', a.end_date,
                    
                    'form', a.form,
                    'label', a.label,
                    'source', a.source,
                    'source_id', a.source_id,

                    'patient_id', a.patient_id,
                    'patient_name', a.patient_name, 
                    'patient_external_id', a.patient_external_id, 
                    'patient_code', a.patient_code,

                    'family_id', a.family_id,
                    'family_name', a.family_name,
                    'family_given_name', a.family_given_name,
                    'family_external_id', a.family_external_id,
                    'family_code', a.family_code
                )
            ) AS task_data
        FROM reco_view r
        JOIN tasks_state_view a ON a.reco_id = r.id AND a.state = 'Failed' AND a.form NOT IN ('referral_town_hall_followup', 'vaccination_referal_followup')
        GROUP BY r.id, a.due_date, a.patient_id
    )
    SELECT 
        CONCAT(t.reco_id, '-', t.due_date) AS id,
        t.reco_id,
        t.due_date::DATE AS due_date,

        -- Agrégation des tâches par patient
        jsonb_object_agg(t.patient_id, t.task_data) AS state_data,

        -- Données RECO et CHW
        jsonb_build_object('id', MAX(r.id), 'name', MAX(r.name), 'phone', MAX(r.phone), 'code', MAX(r.code), 'external_id', MAX(r.external_id)) AS reco,
        jsonb_build_object('id', MAX(w.id), 'name', MAX(w.name), 'phone', MAX(w.phone)) AS chw,

        -- Localisation géographique
        jsonb_build_object('id', MAX(c.id), 'name', MAX(c.name)) AS country,
        jsonb_build_object('id', MAX(g.id), 'name', MAX(g.name)) AS region,
        jsonb_build_object('id', MAX(p.id), 'name', MAX(p.name)) AS prefecture,
        jsonb_build_object('id', MAX(m.id), 'name', MAX(m.name)) AS commune,
        jsonb_build_object('id', MAX(h.id), 'name', MAX(h.name)) AS hospital,
        jsonb_build_object('id', MAX(d.id), 'name', MAX(d.name)) AS district_quartier,
        jsonb_build_object('id', MAX(v.id), 'name', MAX(v.name)) AS village_secteur

    FROM tasks_per_patient t

    JOIN tasks_state_view a ON a.reco_id = t.reco_id AND a.due_date = t.due_date AND a.form NOT IN ('referral_town_hall_followup', 'vaccination_referal_followup')
    JOIN reco_view r ON r.id = t.reco_id

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

    GROUP BY t.reco_id, t.due_date;
