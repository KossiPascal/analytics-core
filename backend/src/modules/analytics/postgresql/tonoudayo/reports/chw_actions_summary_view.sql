CREATE MATERIALIZED VIEW IF NOT EXISTS chw_actions_summary_view AS
    SELECT
        'PCIME' AS action_type,
        form AS action_subtype,
        reported_date,
        patient_id,
        family_id,
        patient_sex,
        geolocation
    FROM pcime_data_view

    UNION ALL

    -- Suivi nouveau-nés
    SELECT
        'Suivi nouveau-né' AS action_type,
        'newborn_followup' AS action_subtype,
        reported_date,
        patient_id,
        visited_contact_uuid AS family_id,
        patient_sex,
        geolocation
    FROM newborn_data_view

    UNION ALL

    -- Suivi prénatal
    SELECT
        'Suivi prénatal' AS action_type,
        form AS action_subtype,
        reported_date,
        patient_id,
        family_id,
        patient_sex,
        geolocation
    FROM prenatal_data_view

    UNION ALL

    -- Suivi postnatal
    SELECT
        'Suivi postnatal' AS action_type,
        form AS action_subtype,
        reported_date,
        patient_id,
        family_id,
        patient_sex,
        geolocation
    FROM postnatal_data_view

    UNION ALL

    -- Accouchements
    SELECT
        'Accouchement' AS action_type,
        'delivery' AS action_subtype,
        reported_date,
        patient_id,
        family_id,
        patient_sex,
        geolocation
    FROM delivery_data_view

    UNION ALL

    -- Vaccinations
    SELECT
        'Vaccination' AS action_type,
        'vaccination_followup' AS action_subtype,
        reported_date,
        patient_id,
        family_id,
        patient_sex,
        geolocation
    FROM vaccination_data_view

    UNION ALL

    -- Visites à domicile
    SELECT
        'Visite domicile' AS action_type,
        'home_visit' AS action_subtype,
        reported_date,
        patient_id,
        family_id,
        patient_sex,
        geolocation
    FROM home_visit_view

    UNION ALL

    -- Planification familiale
    SELECT
        'Planification familiale' AS action_type,
        form AS action_subtype,
        reported_date,
        patient_id,
        family_id,
        patient_sex,
        geolocation
    FROM family_planning_data_view

    UNION ALL

    -- Gestion médicaments
    SELECT
        'Gestion médicaments' AS action_type,
        'drugs_management' AS action_subtype,
        reported_date,
        NULL AS patient_id,
        NULL AS family_id,
        NULL AS sex,
        geolocation
    FROM drug_management_data_view

    UNION ALL

    -- Récap activités
    SELECT
        'Récap activité' AS action_type,
        'recap_activity' AS action_subtype,
        reported_date,
        patient_id,
        family_id,
        patient_sex,
        geolocation
    FROM recap_activity_data_view

    UNION ALL

    -- Rapports de décès
    SELECT
        'Rapport décès' AS action_type,
        'death_report' AS action_subtype,
        reported_date,
        patient_id,
        family_id,
        patient_sex,
        geolocation
    FROM death_report_data_view
;
