SELECT
    a.action_type,
    a.action_subtype,
    a.reported_date,

    -- Informations géographiques via la famille
    f.zone_id,
    f.site_id,
    f.district_id,

    -- Informations ASC via la zone
    c.id AS chw_id,
    c.name AS chw_name,

    -- Informations patient
    a.patient_id,
    a.family_id,
    a.patient_sex,

    -- Compteurs pour faciliter les agrégations
    1 AS action_count

FROM chw_actions_summary_view a
         LEFT JOIN family_view f ON f.id = a.family_id
         LEFT JOIN chw_view c ON c.zone_id = f.zone_id;


SELECT a.action_subtype, a.patient_id, a.patient_sex, COUNT(a.action_subtype) AS nombre
FROM chw_actions_summary_view as a
WHERE a.action_subtype='drugs_management' AND a.reported_date BETWEEN '01/01/2025' AND '31/07/2025'
GROUP BY a.action_subtype, a.patient_id, a.patient_sex
