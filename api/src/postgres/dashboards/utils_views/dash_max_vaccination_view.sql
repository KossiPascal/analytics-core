CREATE MATERIALIZED VIEW IF NOT EXISTS dash_max_vaccination_view AS 
    WITH children_under_5years_view AS (
        SELECT 
            p.* ,
            calculate_age_in('days'::TEXT, p.birth_date::DATE) AS age_in_day, 
            calculate_age_in('months'::TEXT, p.birth_date::DATE) AS age_in_month,
            calculate_age_in('years'::TEXT, p.birth_date::DATE) AS age_in_year,
            f.given_name AS family_given_name, 
            f.name AS family_name, 
            f.external_id AS family_external_id, 

            h.id AS householder_id, 
            h.phone AS householder_phone, 
            h.phone_other AS householder_phone_other
        
        FROM patient_view p
            LEFT JOIN family_view f ON f.id = p.family_id
            LEFT JOIN patient_view h ON h.id = f.householder_id

        WHERE p.birth_date IS NOT NULL AND p.death_date IS NULL
            AND calculate_age_in('days'::TEXT, p.birth_date::DATE) > 0 
            AND calculate_age_in('months'::TEXT, p.birth_date::DATE) < 60 
    ),

    max_vaccine AS (
        SELECT DISTINCT ON (patient_id) patient_id, MAX(reported_date_timestamp) AS last_vaccination_date
        FROM vaccination_data_view
        GROUP BY patient_id
    ),

    all_last_vaccine AS (
        SELECT DISTINCT ON (v.patient_id) v.*
        FROM vaccination_data_view v 
        INNER JOIN max_vaccine m ON m.patient_id IS NOT NULL AND m.patient_id = v.patient_id 
        WHERE m.patient_id IS NOT NULL AND v.patient_id = m.patient_id AND v.reported_date_timestamp = m.last_vaccination_date 
    )

    SELECT DISTINCT ON (p.id) 
        v.id,
        p.id AS child_id,
        p.name AS child_name, 
        p.external_id AS child_code, 
        p.sex AS child_sex, 
        COALESCE(NULLIF(p.phone, ''), NULLIF(p.phone_other, '')) AS child_phone,

        p.birth_date AS child_birth_date,
        p.age_in_day AS child_age_in_days,
        p.age_in_month AS child_age_in_months,
        p.age_in_year AS child_age_in_years,
        
        age_with_full_label(NULL, calculate_age_in('days'::TEXT, p.birth_date::DATE)::BIGINT) AS child_age_str,

        p.family_id,
        p.family_given_name, 
        p.family_name, 
        p.family_external_id, 

        p.householder_id, 
        p.householder_phone, 
        p.householder_phone_other,
        
        v.vaccine_BCG,
        v.vaccine_VPO_0,
        v.vaccine_PENTA_1,
        v.vaccine_VPO_1,
        v.vaccine_PENTA_2,
        v.vaccine_VPO_2,
        v.vaccine_PENTA_3,
        v.vaccine_VPO_3,
        v.vaccine_VPI_1,
        v.vaccine_VAR_1,
        v.vaccine_VAA,
        v.vaccine_VPI_2,
        v.vaccine_MEN_A,
        v.vaccine_VAR_2,

        v.no_BCG_reason,
        v.no_VPO_0_reason,
        v.no_PENTA_1_reason,
        v.no_VPO_1_reason,
        v.no_PENTA_2_reason,
        v.no_VPO_2_reason,
        v.no_PENTA_3_reason,
        v.no_VPO_3_reason,
        v.no_VPI_1_reason,
        v.no_VAR_1_reason,
        v.no_VAA_reason,
        v.no_VPI_2_reason,
        v.no_MEN_A_reason,
        v.no_VAR_2_reason,

        v.has_all_vaccine_done,
        v.is_birth_vaccine_ok,
        v.is_six_weeks_vaccine_ok,
        v.is_ten_weeks_vaccine_ok,
        v.is_forteen_weeks_vaccine_ok,
        v.is_nine_months_vaccine_ok,
        v.is_fifty_months_vaccine_ok,
        
        v.reco_id

    FROM children_under_5years_view p 
    
    INNER JOIN all_last_vaccine v ON p.id = v.patient_id;
