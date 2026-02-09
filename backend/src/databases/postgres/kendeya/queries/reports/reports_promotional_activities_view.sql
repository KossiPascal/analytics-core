CREATE MATERIALIZED VIEW IF NOT EXISTS reports_promotional_activities_view AS
    WITH aggregate_method AS (
        SELECT
            reco_id,
            month,
            year,
            domains,
            themes,
            method,
            sex,
            SUM(CASE WHEN value IS NOT NULL AND value > 0 THEN value ELSE 0 END) AS total
        FROM (
            SELECT
                reco_id,
                month,
                year,
                activity_domains AS domains,
                activity_themes AS themes,
                CASE 
                    WHEN is_vad_method THEN 'vad'
                    WHEN is_talk_method THEN 'talk'
                    WHEN is_interpersonal_talk_method THEN 'personal'
                END AS method,
                'F' AS sex,
                women_number AS value
            FROM promotional_data_view
            WHERE women_number IS NOT NULL AND (is_vad_method OR is_talk_method OR is_interpersonal_talk_method)

            UNION ALL

            SELECT
                reco_id,
                month,
                year,
                activity_domains AS domains,
                activity_themes AS themes,
                CASE 
                    WHEN is_vad_method THEN 'vad'
                    WHEN is_talk_method THEN 'talk'
                    WHEN is_interpersonal_talk_method THEN 'personal'
                END AS method,
                'M' AS sex,
                men_number AS value
            FROM promotional_data_view
            WHERE men_number IS NOT NULL AND (is_vad_method OR is_talk_method OR is_interpersonal_talk_method)
        ) sub
        WHERE domains IS NOT NULL AND method IS NOT NULL
        -- WHERE domains IS NOT NULL AND themes IS NOT NULL AND method IS NOT NULL
        GROUP BY reco_id, month, year, domains, themes, method, sex
    )

    SELECT 
        CONCAT(a.month, '-', a.year, '-', a.reco_id) AS id,
        a.month,
        a.year,
        a.reco_id,

        jsonb_build_object(
            'label', 'sante mère/nouveau-né/enfant',
            'vad', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'maternel_childhealth' = ANY(e.domains) AND e.method = 'vad' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'maternel_childhealth' = ANY(e.domains) AND e.method = 'vad' THEN e.total ELSE 0 END)
            ),
            'talk', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'maternel_childhealth' = ANY(e.domains) AND e.method = 'talk' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'maternel_childhealth' = ANY(e.domains) AND e.method = 'talk' THEN e.total ELSE 0 END)
            ),
            'personal', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'maternel_childhealth' = ANY(e.domains) AND e.method = 'personal' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'maternel_childhealth' = ANY(e.domains) AND e.method = 'personal' THEN e.total ELSE 0 END)
            )
        ) AS maternel_childhealth_domain,

        jsonb_build_object(
            'label', 'Education',
            'vad', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'education' = ANY(e.domains) AND e.method = 'vad' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'education' = ANY(e.domains) AND e.method = 'vad' THEN e.total ELSE 0 END)
            ),
            'talk', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'education' = ANY(e.domains) AND e.method = 'talk' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'education' = ANY(e.domains) AND e.method = 'talk' THEN e.total ELSE 0 END)
            ),
            'personal', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'education' = ANY(e.domains) AND e.method = 'personal' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'education' = ANY(e.domains) AND e.method = 'personal' THEN e.total ELSE 0 END)
            )
        ) AS education_domain,

        jsonb_build_object(
            'label', 'Violences basées sur le genre',
            'vad', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'gbv' = ANY(e.domains) AND e.method = 'vad' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'gbv' = ANY(e.domains) AND e.method = 'vad' THEN e.total ELSE 0 END)
            ),
            'talk', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'gbv' = ANY(e.domains) AND e.method = 'talk' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'gbv' = ANY(e.domains) AND e.method = 'talk' THEN e.total ELSE 0 END)
            ),
            'personal', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'gbv' = ANY(e.domains) AND e.method = 'personal' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'gbv' = ANY(e.domains) AND e.method = 'personal' THEN e.total ELSE 0 END)
            )
        ) AS gbv_domain,

        jsonb_build_object(
            'label', 'Nutrition',
            'vad', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'nutrition' = ANY(e.domains) AND e.method = 'vad' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'nutrition' = ANY(e.domains) AND e.method = 'vad' THEN e.total ELSE 0 END)
            ),
            'talk', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'nutrition' = ANY(e.domains) AND e.method = 'talk' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'nutrition' = ANY(e.domains) AND e.method = 'talk' THEN e.total ELSE 0 END)
            ),
            'personal', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'nutrition' = ANY(e.domains) AND e.method = 'personal' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'nutrition' = ANY(e.domains) AND e.method = 'personal' THEN e.total ELSE 0 END)
            )
        ) AS nutrition_domain,

        jsonb_build_object(
            'label', 'Eau-hygiène et assainissemen',
            'vad', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'water_hygiene' = ANY(e.domains) AND e.method = 'vad' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'water_hygiene' = ANY(e.domains) AND e.method = 'vad' THEN e.total ELSE 0 END)
            ),
            'talk', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'water_hygiene' = ANY(e.domains) AND e.method = 'talk' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'water_hygiene' = ANY(e.domains) AND e.method = 'talk' THEN e.total ELSE 0 END)
            ),
            'personal', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'water_hygiene' = ANY(e.domains) AND e.method = 'personal' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'water_hygiene' = ANY(e.domains) AND e.method = 'personal' THEN e.total ELSE 0 END)
            )
        ) AS water_hygiene_domain,

        jsonb_build_object(
            'label', 'Lutte contre la maladie',
            'vad', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'ist_vih' = ANY(e.domains) AND e.method = 'vad' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'ist_vih' = ANY(e.domains) AND e.method = 'vad' THEN e.total ELSE 0 END)
            ),
            'talk', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'ist_vih' = ANY(e.domains) AND e.method = 'talk' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'ist_vih' = ANY(e.domains) AND e.method = 'talk' THEN e.total ELSE 0 END)
            ),
            'personal', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'ist_vih' = ANY(e.domains) AND e.method = 'personal' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'ist_vih' = ANY(e.domains) AND e.method = 'personal' THEN e.total ELSE 0 END)
            )
        ) AS ist_vih_domain,

        jsonb_build_object(
            'label', 'Lutte contre la maladie',
            'vad', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'disease_control' = ANY(e.domains) AND e.method = 'vad' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'disease_control' = ANY(e.domains) AND e.method = 'vad' THEN e.total ELSE 0 END)
            ),
            'talk', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'disease_control' = ANY(e.domains) AND e.method = 'talk' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'disease_control' = ANY(e.domains) AND e.method = 'talk' THEN e.total ELSE 0 END)
            ),
            'personal', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'disease_control' = ANY(e.domains) AND e.method = 'personal' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'disease_control' = ANY(e.domains) AND e.method = 'personal' THEN e.total ELSE 0 END)
            )
        ) AS disease_control_domain,

        jsonb_build_object(
            'label', 'Autre Domaine',
            'vad', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'others' = ANY(e.domains) AND e.method = 'vad' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'others' = ANY(e.domains) AND e.method = 'vad' THEN e.total ELSE 0 END)
            ),
            'talk', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'others' = ANY(e.domains) AND e.method = 'talk' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'others' = ANY(e.domains) AND e.method = 'talk' THEN e.total ELSE 0 END)
            ),
            'personal', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'others' = ANY(e.domains) AND e.method = 'personal' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'others' = ANY(e.domains) AND e.method = 'personal' THEN e.total ELSE 0 END)
            )
        ) AS others_domain,

        jsonb_build_object(
            'label', 'Consultation prénatale',
            'vad', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'prenatal_consultation' = ANY(e.themes) AND e.method = 'vad' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'prenatal_consultation' = ANY(e.themes) AND e.method = 'vad' THEN e.total ELSE 0 END)
            ),
            'talk', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'prenatal_consultation' = ANY(e.themes) AND e.method = 'talk' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'prenatal_consultation' = ANY(e.themes) AND e.method = 'talk' THEN e.total ELSE 0 END)
            ),
            'personal', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'prenatal_consultation' = ANY(e.themes) AND e.method = 'personal' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'prenatal_consultation' = ANY(e.themes) AND e.method = 'personal' THEN e.total ELSE 0 END)
            )
        ) AS prenatal_consultation_theme,

        jsonb_build_object(
            'label', 'Accouchement assisté par un personnel qualifié',
            'vad', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'birth_attended' = ANY(e.themes) AND e.method = 'vad' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'birth_attended' = ANY(e.themes) AND e.method = 'vad' THEN e.total ELSE 0 END)
            ),
            'talk', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'birth_attended' = ANY(e.themes) AND e.method = 'talk' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'birth_attended' = ANY(e.themes) AND e.method = 'talk' THEN e.total ELSE 0 END)
            ),
            'personal', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'birth_attended' = ANY(e.themes) AND e.method = 'personal' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'birth_attended' = ANY(e.themes) AND e.method = 'personal' THEN e.total ELSE 0 END)
            )
        ) AS birth_attended_theme,

        jsonb_build_object(
            'label', 'Accouchement assisté par un personnel qualifié',
            'vad', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'delivery' = ANY(e.themes) AND e.method = 'vad' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'delivery' = ANY(e.themes) AND e.method = 'vad' THEN e.total ELSE 0 END)
            ),
            'talk', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'delivery' = ANY(e.themes) AND e.method = 'talk' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'delivery' = ANY(e.themes) AND e.method = 'talk' THEN e.total ELSE 0 END)
            ),
            'personal', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'delivery' = ANY(e.themes) AND e.method = 'personal' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'delivery' = ANY(e.themes) AND e.method = 'personal' THEN e.total ELSE 0 END)
            )
        ) AS delivery_theme,

        jsonb_build_object(
            'label', 'Accouchement assisté par un personnel qualifié',
            'vad', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'birth_registration' = ANY(e.themes) AND e.method = 'vad' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'birth_registration' = ANY(e.themes) AND e.method = 'vad' THEN e.total ELSE 0 END)
            ),
            'talk', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'birth_registration' = ANY(e.themes) AND e.method = 'talk' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'birth_registration' = ANY(e.themes) AND e.method = 'talk' THEN e.total ELSE 0 END)
            ),
            'personal', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'birth_registration' = ANY(e.themes) AND e.method = 'personal' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'birth_registration' = ANY(e.themes) AND e.method = 'personal' THEN e.total ELSE 0 END)
            )
        ) AS birth_registration_theme,

        jsonb_build_object(
            'label', 'Suivi post natal',
            'vad', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'post_natal' = ANY(e.themes) AND e.method = 'vad' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'post_natal' = ANY(e.themes) AND e.method = 'vad' THEN e.total ELSE 0 END)
            ),
            'talk', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'post_natal' = ANY(e.themes) AND e.method = 'talk' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'post_natal' = ANY(e.themes) AND e.method = 'talk' THEN e.total ELSE 0 END)
            ),
            'personal', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'post_natal' = ANY(e.themes) AND e.method = 'personal' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'post_natal' = ANY(e.themes) AND e.method = 'personal' THEN e.total ELSE 0 END)
            )
        ) AS post_natal_theme,

        jsonb_build_object(
            'label', 'Soins après avortement',
            'vad', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'post_abortion' = ANY(e.themes) AND e.method = 'vad' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'post_abortion' = ANY(e.themes) AND e.method = 'vad' THEN e.total ELSE 0 END)
            ),
            'talk', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'post_abortion' = ANY(e.themes) AND e.method = 'talk' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'post_abortion' = ANY(e.themes) AND e.method = 'talk' THEN e.total ELSE 0 END)
            ),
            'personal', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'post_abortion' = ANY(e.themes) AND e.method = 'personal' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'post_abortion' = ANY(e.themes) AND e.method = 'personal' THEN e.total ELSE 0 END)
            )
        ) AS post_abortion_theme,

        jsonb_build_object(
            'label', 'Fistule obstétricale',
            'vad', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'obstetric_fistula' = ANY(e.themes) AND e.method = 'vad' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'obstetric_fistula' = ANY(e.themes) AND e.method = 'vad' THEN e.total ELSE 0 END)
            ),
            'talk', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'obstetric_fistula' = ANY(e.themes) AND e.method = 'talk' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'obstetric_fistula' = ANY(e.themes) AND e.method = 'talk' THEN e.total ELSE 0 END)
            ),
            'personal', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'obstetric_fistula' = ANY(e.themes) AND e.method = 'personal' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'obstetric_fistula' = ANY(e.themes) AND e.method = 'personal' THEN e.total ELSE 0 END)
            )
        ) AS obstetric_fistula_theme,

        jsonb_build_object(
            'label', 'Planification familiale (PF)',
            'vad', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'family_planning' = ANY(e.themes) AND e.method = 'vad' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'family_planning' = ANY(e.themes) AND e.method = 'vad' THEN e.total ELSE 0 END)
            ),
            'talk', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'family_planning' = ANY(e.themes) AND e.method = 'talk' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'family_planning' = ANY(e.themes) AND e.method = 'talk' THEN e.total ELSE 0 END)
            ),
            'personal', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'family_planning' = ANY(e.themes) AND e.method = 'personal' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'family_planning' = ANY(e.themes) AND e.method = 'personal' THEN e.total ELSE 0 END)
            )
        ) AS family_planning_theme,

        jsonb_build_object(
            'label', 'Contraceptifs oraux',
            'vad', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'oral_contraceptive' = ANY(e.themes) AND e.method = 'vad' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'oral_contraceptive' = ANY(e.themes) AND e.method = 'vad' THEN e.total ELSE 0 END)
            ),
            'talk', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'oral_contraceptive' = ANY(e.themes) AND e.method = 'talk' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'oral_contraceptive' = ANY(e.themes) AND e.method = 'talk' THEN e.total ELSE 0 END)
            ),
            'personal', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'oral_contraceptive' = ANY(e.themes) AND e.method = 'personal' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'oral_contraceptive' = ANY(e.themes) AND e.method = 'personal' THEN e.total ELSE 0 END)
            )
        ) AS oral_contraceptive_theme,

        jsonb_build_object(
            'label', 'Vaccination',
            'vad', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'vaccination' = ANY(e.themes) AND e.method = 'vad' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'vaccination' = ANY(e.themes) AND e.method = 'vad' THEN e.total ELSE 0 END)
            ),
            'talk', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'vaccination' = ANY(e.themes) AND e.method = 'talk' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'vaccination' = ANY(e.themes) AND e.method = 'talk' THEN e.total ELSE 0 END)
            ),
            'personal', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'vaccination' = ANY(e.themes) AND e.method = 'personal' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'vaccination' = ANY(e.themes) AND e.method = 'personal' THEN e.total ELSE 0 END)
            )
        ) AS vaccination_theme,

        jsonb_build_object(
            'label', 'Prise en charge du nouveau-né à domicile',
            'vad', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'newborn_care_home' = ANY(e.themes) AND e.method = 'vad' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'newborn_care_home' = ANY(e.themes) AND e.method = 'vad' THEN e.total ELSE 0 END)
            ),
            'talk', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'newborn_care_home' = ANY(e.themes) AND e.method = 'talk' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'newborn_care_home' = ANY(e.themes) AND e.method = 'talk' THEN e.total ELSE 0 END)
            ),
            'personal', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'newborn_care_home' = ANY(e.themes) AND e.method = 'personal' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'newborn_care_home' = ANY(e.themes) AND e.method = 'personal' THEN e.total ELSE 0 END)
            )
        ) AS newborn_care_home_theme,

        jsonb_build_object(
            'label', 'Prise en charge intégrée des cas de maladies à domicile',
            'vad', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'care_home_illness_case' = ANY(e.themes) AND e.method = 'vad' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'care_home_illness_case' = ANY(e.themes) AND e.method = 'vad' THEN e.total ELSE 0 END)
            ),
            'talk', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'care_home_illness_case' = ANY(e.themes) AND e.method = 'talk' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'care_home_illness_case' = ANY(e.themes) AND e.method = 'talk' THEN e.total ELSE 0 END)
            ),
            'personal', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'care_home_illness_case' = ANY(e.themes) AND e.method = 'personal' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'care_home_illness_case' = ANY(e.themes) AND e.method = 'personal' THEN e.total ELSE 0 END)
            )
        ) AS care_home_illness_case_theme,

        jsonb_build_object(
            'label', 'Soins pour le développement de l’enfant',
            'vad', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'child_development_care' = ANY(e.themes) AND e.method = 'vad' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'child_development_care' = ANY(e.themes) AND e.method = 'vad' THEN e.total ELSE 0 END)
            ),
            'talk', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'child_development_care' = ANY(e.themes) AND e.method = 'talk' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'child_development_care' = ANY(e.themes) AND e.method = 'talk' THEN e.total ELSE 0 END)
            ),
            'personal', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'child_development_care' = ANY(e.themes) AND e.method = 'personal' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'child_development_care' = ANY(e.themes) AND e.method = 'personal' THEN e.total ELSE 0 END)
            )
        ) AS child_development_care_theme,

        jsonb_build_object(
            'label', 'Maltraitance des enfants',
            'vad', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'advice_for_child_development' = ANY(e.themes) AND e.method = 'vad' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'advice_for_child_development' = ANY(e.themes) AND e.method = 'vad' THEN e.total ELSE 0 END)
            ),
            'talk', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'advice_for_child_development' = ANY(e.themes) AND e.method = 'talk' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'advice_for_child_development' = ANY(e.themes) AND e.method = 'talk' THEN e.total ELSE 0 END)
            ),
            'personal', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'advice_for_child_development' = ANY(e.themes) AND e.method = 'personal' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'advice_for_child_development' = ANY(e.themes) AND e.method = 'personal' THEN e.total ELSE 0 END)
            )
        ) AS advice_for_child_development_theme,

        jsonb_build_object(
            'label', 'Conseils à la famille sur les problèmes en matière de soins pour le développement de l’enfant',
            'vad', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'child_abuse' = ANY(e.themes) AND e.method = 'vad' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'child_abuse' = ANY(e.themes) AND e.method = 'vad' THEN e.total ELSE 0 END)
            ),
            'talk', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'child_abuse' = ANY(e.themes) AND e.method = 'talk' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'child_abuse' = ANY(e.themes) AND e.method = 'talk' THEN e.total ELSE 0 END)
            ),
            'personal', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'child_abuse' = ANY(e.themes) AND e.method = 'personal' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'child_abuse' = ANY(e.themes) AND e.method = 'personal' THEN e.total ELSE 0 END)
            )
        ) AS child_abuse_theme,

        jsonb_build_object(
            'label', 'Mutilation Genitale Feminine MGF et le rejet de filles non excise',
            'vad', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'female_genital_mutilation' = ANY(e.themes) AND e.method = 'vad' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'female_genital_mutilation' = ANY(e.themes) AND e.method = 'vad' THEN e.total ELSE 0 END)
            ),
            'talk', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'female_genital_mutilation' = ANY(e.themes) AND e.method = 'talk' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'female_genital_mutilation' = ANY(e.themes) AND e.method = 'talk' THEN e.total ELSE 0 END)
            ),
            'personal', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'female_genital_mutilation' = ANY(e.themes) AND e.method = 'personal' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'female_genital_mutilation' = ANY(e.themes) AND e.method = 'personal' THEN e.total ELSE 0 END)
            )
        ) AS female_genital_mutilation_theme,

        jsonb_build_object(
            'label', 'Allaitement maternel exclusif',
            'vad', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'exclusive_breastfeeding' = ANY(e.themes) AND e.method = 'vad' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'exclusive_breastfeeding' = ANY(e.themes) AND e.method = 'vad' THEN e.total ELSE 0 END)
            ),
            'talk', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'exclusive_breastfeeding' = ANY(e.themes) AND e.method = 'talk' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'exclusive_breastfeeding' = ANY(e.themes) AND e.method = 'talk' THEN e.total ELSE 0 END)
            ),
            'personal', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'exclusive_breastfeeding' = ANY(e.themes) AND e.method = 'personal' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'exclusive_breastfeeding' = ANY(e.themes) AND e.method = 'personal' THEN e.total ELSE 0 END)
            )
        ) AS exclusive_breastfeeding_theme,

        jsonb_build_object(
            'label', 'Supplémentation en vitamine A',
            'vad', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'vitamin_a_supp' = ANY(e.themes) AND e.method = 'vad' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'vitamin_a_supp' = ANY(e.themes) AND e.method = 'vad' THEN e.total ELSE 0 END)
            ),
            'talk', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'vitamin_a_supp' = ANY(e.themes) AND e.method = 'talk' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'vitamin_a_supp' = ANY(e.themes) AND e.method = 'talk' THEN e.total ELSE 0 END)
            ),
            'personal', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'vitamin_a_supp' = ANY(e.themes) AND e.method = 'personal' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'vitamin_a_supp' = ANY(e.themes) AND e.method = 'personal' THEN e.total ELSE 0 END)
            )
        ) AS vitamin_a_supp_theme,

        jsonb_build_object(
            'label', 'Alimentation de complément',
            'vad', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'suppl_feeding' = ANY(e.themes) AND e.method = 'vad' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'suppl_feeding' = ANY(e.themes) AND e.method = 'vad' THEN e.total ELSE 0 END)
            ),
            'talk', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'suppl_feeding' = ANY(e.themes) AND e.method = 'talk' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'suppl_feeding' = ANY(e.themes) AND e.method = 'talk' THEN e.total ELSE 0 END)
            ),
            'personal', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'suppl_feeding' = ANY(e.themes) AND e.method = 'personal' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'suppl_feeding' = ANY(e.themes) AND e.method = 'personal' THEN e.total ELSE 0 END)
            )
        ) AS suppl_feeding_theme,

        jsonb_build_object(
            'label', 'Malnutrition',
            'vad', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'malnutrition' = ANY(e.themes) AND e.method = 'vad' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'malnutrition' = ANY(e.themes) AND e.method = 'vad' THEN e.total ELSE 0 END)
            ),
            'talk', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'malnutrition' = ANY(e.themes) AND e.method = 'talk' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'malnutrition' = ANY(e.themes) AND e.method = 'talk' THEN e.total ELSE 0 END)
            ),
            'personal', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'malnutrition' = ANY(e.themes) AND e.method = 'personal' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'malnutrition' = ANY(e.themes) AND e.method = 'personal' THEN e.total ELSE 0 END)
            )
        ) AS malnutrition_theme,

        jsonb_build_object(
            'label', 'Lutte contre la carence en iode',
            'vad', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'combating_iodine' = ANY(e.themes) AND e.method = 'vad' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'combating_iodine' = ANY(e.themes) AND e.method = 'vad' THEN e.total ELSE 0 END)
            ),
            'talk', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'combating_iodine' = ANY(e.themes) AND e.method = 'talk' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'combating_iodine' = ANY(e.themes) AND e.method = 'talk' THEN e.total ELSE 0 END)
            ),
            'personal', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'combating_iodine' = ANY(e.themes) AND e.method = 'personal' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'combating_iodine' = ANY(e.themes) AND e.method = 'personal' THEN e.total ELSE 0 END)
            )
        ) AS combating_iodine_theme,

        jsonb_build_object(
            'label', 'Lavage des mains',
            'vad', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'hand_washing' = ANY(e.themes) AND e.method = 'vad' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'hand_washing' = ANY(e.themes) AND e.method = 'vad' THEN e.total ELSE 0 END)
            ),
            'talk', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'hand_washing' = ANY(e.themes) AND e.method = 'talk' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'hand_washing' = ANY(e.themes) AND e.method = 'talk' THEN e.total ELSE 0 END)
            ),
            'personal', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'hand_washing' = ANY(e.themes) AND e.method = 'personal' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'hand_washing' = ANY(e.themes) AND e.method = 'personal' THEN e.total ELSE 0 END)
            )
        ) AS hand_washing_theme,

        jsonb_build_object(
            'label', 'Assainissement total piloté par la communauté (ATPCtpc)',
            'vad', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'community_led' = ANY(e.themes) AND e.method = 'vad' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'community_led' = ANY(e.themes) AND e.method = 'vad' THEN e.total ELSE 0 END)
            ),
            'talk', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'community_led' = ANY(e.themes) AND e.method = 'talk' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'community_led' = ANY(e.themes) AND e.method = 'talk' THEN e.total ELSE 0 END)
            ),
            'personal', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'community_led' = ANY(e.themes) AND e.method = 'personal' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'community_led' = ANY(e.themes) AND e.method = 'personal' THEN e.total ELSE 0 END)
            )
        ) AS community_led_theme,

        jsonb_build_object(
            'label', 'Tuberculose',
            'vad', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'tuberculosis' = ANY(e.themes) AND e.method = 'vad' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'tuberculosis' = ANY(e.themes) AND e.method = 'vad' THEN e.total ELSE 0 END)
            ),
            'talk', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'tuberculosis' = ANY(e.themes) AND e.method = 'talk' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'tuberculosis' = ANY(e.themes) AND e.method = 'talk' THEN e.total ELSE 0 END)
            ),
            'personal', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'tuberculosis' = ANY(e.themes) AND e.method = 'personal' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'tuberculosis' = ANY(e.themes) AND e.method = 'personal' THEN e.total ELSE 0 END)
            )
        ) AS tuberculosis_theme,

        jsonb_build_object(
            'label', 'Lèpre',
            'vad', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'leprosy' = ANY(e.themes) AND e.method = 'vad' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'leprosy' = ANY(e.themes) AND e.method = 'vad' THEN e.total ELSE 0 END)
            ),
            'talk', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'leprosy' = ANY(e.themes) AND e.method = 'talk' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'leprosy' = ANY(e.themes) AND e.method = 'talk' THEN e.total ELSE 0 END)
            ),
            'personal', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'leprosy' = ANY(e.themes) AND e.method = 'personal' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'leprosy' = ANY(e.themes) AND e.method = 'personal' THEN e.total ELSE 0 END)
            )
        ) AS leprosy_theme,

        jsonb_build_object(
            'label', 'Ulcère de Buruli',
            'vad', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'buruli_ulcer' = ANY(e.themes) AND e.method = 'vad' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'buruli_ulcer' = ANY(e.themes) AND e.method = 'vad' THEN e.total ELSE 0 END)
            ),
            'talk', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'buruli_ulcer' = ANY(e.themes) AND e.method = 'talk' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'buruli_ulcer' = ANY(e.themes) AND e.method = 'talk' THEN e.total ELSE 0 END)
            ),
            'personal', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'buruli_ulcer' = ANY(e.themes) AND e.method = 'personal' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'buruli_ulcer' = ANY(e.themes) AND e.method = 'personal' THEN e.total ELSE 0 END)
            )
        ) AS buruli_ulcer_theme,

        jsonb_build_object(
            'label', 'Onchocercose',
            'vad', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'onchocerciasis' = ANY(e.themes) AND e.method = 'vad' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'onchocerciasis' = ANY(e.themes) AND e.method = 'vad' THEN e.total ELSE 0 END)
            ),
            'talk', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'onchocerciasis' = ANY(e.themes) AND e.method = 'talk' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'onchocerciasis' = ANY(e.themes) AND e.method = 'talk' THEN e.total ELSE 0 END)
            ),
            'personal', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'onchocerciasis' = ANY(e.themes) AND e.method = 'personal' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'onchocerciasis' = ANY(e.themes) AND e.method = 'personal' THEN e.total ELSE 0 END)
            )
        ) AS onchocerciasis_theme,

        jsonb_build_object(
            'label', 'Bilharziose ou schistosomiase',
            'vad', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'bilharzia' = ANY(e.themes) AND e.method = 'vad' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'bilharzia' = ANY(e.themes) AND e.method = 'vad' THEN e.total ELSE 0 END)
            ),
            'talk', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'bilharzia' = ANY(e.themes) AND e.method = 'talk' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'bilharzia' = ANY(e.themes) AND e.method = 'talk' THEN e.total ELSE 0 END)
            ),
            'personal', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'bilharzia' = ANY(e.themes) AND e.method = 'personal' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'bilharzia' = ANY(e.themes) AND e.method = 'personal' THEN e.total ELSE 0 END)
            )
        ) AS bilharzia_theme,

        jsonb_build_object(
            'label', 'Déparasitage de masse',
            'vad', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'mass_deworming' = ANY(e.themes) AND e.method = 'vad' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'mass_deworming' = ANY(e.themes) AND e.method = 'vad' THEN e.total ELSE 0 END)
            ),
            'talk', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'mass_deworming' = ANY(e.themes) AND e.method = 'talk' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'mass_deworming' = ANY(e.themes) AND e.method = 'talk' THEN e.total ELSE 0 END)
            ),
            'personal', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'mass_deworming' = ANY(e.themes) AND e.method = 'personal' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'mass_deworming' = ANY(e.themes) AND e.method = 'personal' THEN e.total ELSE 0 END)
            )
        ) AS mass_deworming_theme,

        jsonb_build_object(
            'label', 'Trypanosomiase humaine africaine (THA)',
            'vad', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'human_african_trypanosomiasis' = ANY(e.themes) AND e.method = 'vad' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'human_african_trypanosomiasis' = ANY(e.themes) AND e.method = 'vad' THEN e.total ELSE 0 END)
            ),
            'talk', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'human_african_trypanosomiasis' = ANY(e.themes) AND e.method = 'talk' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'human_african_trypanosomiasis' = ANY(e.themes) AND e.method = 'talk' THEN e.total ELSE 0 END)
            ),
            'personal', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'human_african_trypanosomiasis' = ANY(e.themes) AND e.method = 'personal' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'human_african_trypanosomiasis' = ANY(e.themes) AND e.method = 'personal' THEN e.total ELSE 0 END)
            )
        ) AS human_african_trypanosomiasis_theme,

        jsonb_build_object(
            'label', 'Filariose lymphatique',
            'vad', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'lymphatic' = ANY(e.themes) AND e.method = 'vad' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'lymphatic' = ANY(e.themes) AND e.method = 'vad' THEN e.total ELSE 0 END)
            ),
            'talk', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'lymphatic' = ANY(e.themes) AND e.method = 'talk' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'lymphatic' = ANY(e.themes) AND e.method = 'talk' THEN e.total ELSE 0 END)
            ),
            'personal', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'lymphatic' = ANY(e.themes) AND e.method = 'personal' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'lymphatic' = ANY(e.themes) AND e.method = 'personal' THEN e.total ELSE 0 END)
            )
        ) AS lymphatic_theme,

        jsonb_build_object(
            'label', 'Trachome',
            'vad', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'trachoma' = ANY(e.themes) AND e.method = 'vad' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'trachoma' = ANY(e.themes) AND e.method = 'vad' THEN e.total ELSE 0 END)
            ),
            'talk', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'trachoma' = ANY(e.themes) AND e.method = 'talk' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'trachoma' = ANY(e.themes) AND e.method = 'talk' THEN e.total ELSE 0 END)
            ),
            'personal', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'trachoma' = ANY(e.themes) AND e.method = 'personal' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'trachoma' = ANY(e.themes) AND e.method = 'personal' THEN e.total ELSE 0 END)
            )
        ) AS trachoma_theme,

        jsonb_build_object(
            'label', 'IST-VIH/SIDA et les hépatites',
            'vad', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'sti_and_hepatitis' = ANY(e.themes) AND e.method = 'vad' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'sti_and_hepatitis' = ANY(e.themes) AND e.method = 'vad' THEN e.total ELSE 0 END)
            ),
            'talk', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'sti_and_hepatitis' = ANY(e.themes) AND e.method = 'talk' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'sti_and_hepatitis' = ANY(e.themes) AND e.method = 'talk' THEN e.total ELSE 0 END)
            ),
            'personal', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'sti_and_hepatitis' = ANY(e.themes) AND e.method = 'personal' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'sti_and_hepatitis' = ANY(e.themes) AND e.method = 'personal' THEN e.total ELSE 0 END)
            )
        ) AS sti_and_hepatitis_theme,

        jsonb_build_object(
            'label', 'Hypertension artérielle',
            'vad', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'hypertension' = ANY(e.themes) AND e.method = 'vad' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'hypertension' = ANY(e.themes) AND e.method = 'vad' THEN e.total ELSE 0 END)
            ),
            'talk', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'hypertension' = ANY(e.themes) AND e.method = 'talk' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'hypertension' = ANY(e.themes) AND e.method = 'talk' THEN e.total ELSE 0 END)
            ),
            'personal', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'hypertension' = ANY(e.themes) AND e.method = 'personal' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'hypertension' = ANY(e.themes) AND e.method = 'personal' THEN e.total ELSE 0 END)
            )
        ) AS hypertension_theme,

        jsonb_build_object(
            'label', 'Diabète',
            'vad', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'diabetes' = ANY(e.themes) AND e.method = 'vad' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'diabetes' = ANY(e.themes) AND e.method = 'vad' THEN e.total ELSE 0 END)
            ),
            'talk', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'diabetes' = ANY(e.themes) AND e.method = 'talk' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'diabetes' = ANY(e.themes) AND e.method = 'talk' THEN e.total ELSE 0 END)
            ),
            'personal', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'diabetes' = ANY(e.themes) AND e.method = 'personal' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'diabetes' = ANY(e.themes) AND e.method = 'personal' THEN e.total ELSE 0 END)
            )
        ) AS diabetes_theme,

        jsonb_build_object(
            'label', 'Cancers',
            'vad', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'cancers' = ANY(e.themes) AND e.method = 'vad' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'cancers' = ANY(e.themes) AND e.method = 'vad' THEN e.total ELSE 0 END)
            ),
            'talk', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'cancers' = ANY(e.themes) AND e.method = 'talk' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'cancers' = ANY(e.themes) AND e.method = 'talk' THEN e.total ELSE 0 END)
            ),
            'personal', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'cancers' = ANY(e.themes) AND e.method = 'personal' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'cancers' = ANY(e.themes) AND e.method = 'personal' THEN e.total ELSE 0 END)
            )
        ) AS cancers_theme,

        jsonb_build_object(
            'label', 'Drépanocytose',
            'vad', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'sickle_cell_disease' = ANY(e.themes) AND e.method = 'vad' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'sickle_cell_disease' = ANY(e.themes) AND e.method = 'vad' THEN e.total ELSE 0 END)
            ),
            'talk', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'sickle_cell_disease' = ANY(e.themes) AND e.method = 'talk' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'sickle_cell_disease' = ANY(e.themes) AND e.method = 'talk' THEN e.total ELSE 0 END)
            ),
            'personal', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'sickle_cell_disease' = ANY(e.themes) AND e.method = 'personal' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'sickle_cell_disease' = ANY(e.themes) AND e.method = 'personal' THEN e.total ELSE 0 END)
            )
        ) AS sickle_cell_disease_theme,

        jsonb_build_object(
            'label', 'Paludisme',
            'vad', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'malaria' = ANY(e.themes) AND e.method = 'vad' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'malaria' = ANY(e.themes) AND e.method = 'vad' THEN e.total ELSE 0 END)
            ),
            'talk', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'malaria' = ANY(e.themes) AND e.method = 'talk' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'malaria' = ANY(e.themes) AND e.method = 'talk' THEN e.total ELSE 0 END)
            ),
            'personal', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'malaria' = ANY(e.themes) AND e.method = 'personal' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'malaria' = ANY(e.themes) AND e.method = 'personal' THEN e.total ELSE 0 END)
            )
        ) AS malaria_theme,

        jsonb_build_object(
            'label', 'Diarrhée simple',
            'vad', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'diarrhea' = ANY(e.themes) AND e.method = 'vad' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'diarrhea' = ANY(e.themes) AND e.method = 'vad' THEN e.total ELSE 0 END)
            ),
            'talk', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'diarrhea' = ANY(e.themes) AND e.method = 'talk' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'diarrhea' = ANY(e.themes) AND e.method = 'talk' THEN e.total ELSE 0 END)
            ),
            'personal', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'diarrhea' = ANY(e.themes) AND e.method = 'personal' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'diarrhea' = ANY(e.themes) AND e.method = 'personal' THEN e.total ELSE 0 END)
            )
        ) AS diarrhea_theme,

        jsonb_build_object(
            'label', 'Diarrhée sanglante',
            'vad', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'bloody_diarrhea' = ANY(e.themes) AND e.method = 'vad' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'bloody_diarrhea' = ANY(e.themes) AND e.method = 'vad' THEN e.total ELSE 0 END)
            ),
            'talk', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'bloody_diarrhea' = ANY(e.themes) AND e.method = 'talk' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'bloody_diarrhea' = ANY(e.themes) AND e.method = 'talk' THEN e.total ELSE 0 END)
            ),
            'personal', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'bloody_diarrhea' = ANY(e.themes) AND e.method = 'personal' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'bloody_diarrhea' = ANY(e.themes) AND e.method = 'personal' THEN e.total ELSE 0 END)
            )
        ) AS bloody_diarrhea_theme,

        jsonb_build_object(
            'label', 'Pneumonie',
            'vad', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'pneumonia' = ANY(e.themes) AND e.method = 'vad' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'pneumonia' = ANY(e.themes) AND e.method = 'vad' THEN e.total ELSE 0 END)
            ),
            'talk', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'pneumonia' = ANY(e.themes) AND e.method = 'talk' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'pneumonia' = ANY(e.themes) AND e.method = 'talk' THEN e.total ELSE 0 END)
            ),
            'personal', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'pneumonia' = ANY(e.themes) AND e.method = 'personal' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'pneumonia' = ANY(e.themes) AND e.method = 'personal' THEN e.total ELSE 0 END)
            )
        ) AS pneumonia_theme,

        jsonb_build_object(
            'label', 'Fièvre jaune',
            'vad', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'yellow_fever' = ANY(e.themes) AND e.method = 'vad' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'yellow_fever' = ANY(e.themes) AND e.method = 'vad' THEN e.total ELSE 0 END)
            ),
            'talk', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'yellow_fever' = ANY(e.themes) AND e.method = 'talk' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'yellow_fever' = ANY(e.themes) AND e.method = 'talk' THEN e.total ELSE 0 END)
            ),
            'personal', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'yellow_fever' = ANY(e.themes) AND e.method = 'personal' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'yellow_fever' = ANY(e.themes) AND e.method = 'personal' THEN e.total ELSE 0 END)
            )
        ) AS yellow_fever_theme,

        jsonb_build_object(
            'label', 'Choléra',
            'vad', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'cholera' = ANY(e.themes) AND e.method = 'vad' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'cholera' = ANY(e.themes) AND e.method = 'vad' THEN e.total ELSE 0 END)
            ),
            'talk', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'cholera' = ANY(e.themes) AND e.method = 'talk' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'cholera' = ANY(e.themes) AND e.method = 'talk' THEN e.total ELSE 0 END)
            ),
            'personal', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'cholera' = ANY(e.themes) AND e.method = 'personal' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'cholera' = ANY(e.themes) AND e.method = 'personal' THEN e.total ELSE 0 END)
            )
        ) AS cholera_theme,

        jsonb_build_object(
            'label', 'Tetanos',
            'vad', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'tetanus' = ANY(e.themes) AND e.method = 'vad' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'tetanus' = ANY(e.themes) AND e.method = 'vad' THEN e.total ELSE 0 END)
            ),
            'talk', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'tetanus' = ANY(e.themes) AND e.method = 'talk' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'tetanus' = ANY(e.themes) AND e.method = 'talk' THEN e.total ELSE 0 END)
            ),
            'personal', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'tetanus' = ANY(e.themes) AND e.method = 'personal' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'tetanus' = ANY(e.themes) AND e.method = 'personal' THEN e.total ELSE 0 END)
            )
        ) AS tetanus_theme,

        jsonb_build_object(
            'label', 'Maladies Virales',
            'vad', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'viral_diseases' = ANY(e.themes) AND e.method = 'vad' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'viral_diseases' = ANY(e.themes) AND e.method = 'vad' THEN e.total ELSE 0 END)
            ),
            'talk', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'viral_diseases' = ANY(e.themes) AND e.method = 'talk' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'viral_diseases' = ANY(e.themes) AND e.method = 'talk' THEN e.total ELSE 0 END)
            ),
            'personal', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'viral_diseases' = ANY(e.themes) AND e.method = 'personal' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'viral_diseases' = ANY(e.themes) AND e.method = 'personal' THEN e.total ELSE 0 END)
            )
        ) AS viral_diseases_theme,

        jsonb_build_object(
            'label', 'Méningite',
            'vad', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'meningitis' = ANY(e.themes) AND e.method = 'vad' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'meningitis' = ANY(e.themes) AND e.method = 'vad' THEN e.total ELSE 0 END)
            ),
            'talk', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'meningitis' = ANY(e.themes) AND e.method = 'talk' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'meningitis' = ANY(e.themes) AND e.method = 'talk' THEN e.total ELSE 0 END)
            ),
            'personal', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'meningitis' = ANY(e.themes) AND e.method = 'personal' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'meningitis' = ANY(e.themes) AND e.method = 'personal' THEN e.total ELSE 0 END)
            )
        ) AS meningitis_theme,

        jsonb_build_object(
            'label', 'PFA',
            'vad', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'pfa' = ANY(e.themes) AND e.method = 'vad' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'pfa' = ANY(e.themes) AND e.method = 'vad' THEN e.total ELSE 0 END)
            ),
            'talk', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'pfa' = ANY(e.themes) AND e.method = 'talk' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'pfa' = ANY(e.themes) AND e.method = 'talk' THEN e.total ELSE 0 END)
            ),
            'personal', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'pfa' = ANY(e.themes) AND e.method = 'personal' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'pfa' = ANY(e.themes) AND e.method = 'personal' THEN e.total ELSE 0 END)
            )
        ) AS pfa_theme,

        jsonb_build_object(
            'label', 'Perte urinaire',
            'vad', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'urine_loss' = ANY(e.themes) AND e.method = 'vad' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'urine_loss' = ANY(e.themes) AND e.method = 'vad' THEN e.total ELSE 0 END)
            ),
            'talk', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'urine_loss' = ANY(e.themes) AND e.method = 'talk' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'urine_loss' = ANY(e.themes) AND e.method = 'talk' THEN e.total ELSE 0 END)
            ),
            'personal', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'urine_loss' = ANY(e.themes) AND e.method = 'personal' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'urine_loss' = ANY(e.themes) AND e.method = 'personal' THEN e.total ELSE 0 END)
            )
        ) AS urine_loss_theme,

        jsonb_build_object(
            'label', 'Pression artérielle',
            'vad', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'blood_pressure' = ANY(e.themes) AND e.method = 'vad' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'blood_pressure' = ANY(e.themes) AND e.method = 'vad' THEN e.total ELSE 0 END)
            ),
            'talk', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'blood_pressure' = ANY(e.themes) AND e.method = 'talk' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'blood_pressure' = ANY(e.themes) AND e.method = 'talk' THEN e.total ELSE 0 END)
            ),
            'personal', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'blood_pressure' = ANY(e.themes) AND e.method = 'personal' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'blood_pressure' = ANY(e.themes) AND e.method = 'personal' THEN e.total ELSE 0 END)
            )
        ) AS blood_pressure_theme,

        jsonb_build_object(
            'label', 'VIH',
            'vad', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'hiv' = ANY(e.themes) AND e.method = 'vad' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'hiv' = ANY(e.themes) AND e.method = 'vad' THEN e.total ELSE 0 END)
            ),
            'talk', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'hiv' = ANY(e.themes) AND e.method = 'talk' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'hiv' = ANY(e.themes) AND e.method = 'talk' THEN e.total ELSE 0 END)
            ),
            'personal', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'hiv' = ANY(e.themes) AND e.method = 'personal' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'hiv' = ANY(e.themes) AND e.method = 'personal' THEN e.total ELSE 0 END)
            )
        ) AS hiv_theme,

        jsonb_build_object(
            'label', 'Autres Infections Sexuellements Transtissibles',
            'vad', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'ist' = ANY(e.themes) AND e.method = 'vad' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'ist' = ANY(e.themes) AND e.method = 'vad' THEN e.total ELSE 0 END)
            ),
            'talk', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'ist' = ANY(e.themes) AND e.method = 'talk' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'ist' = ANY(e.themes) AND e.method = 'talk' THEN e.total ELSE 0 END)
            ),
            'personal', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'ist' = ANY(e.themes) AND e.method = 'personal' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'ist' = ANY(e.themes) AND e.method = 'personal' THEN e.total ELSE 0 END)
            )
        ) AS ist_theme,

        jsonb_build_object(
            'label', 'Autres maladies',
            'vad', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'other' = ANY(e.themes) AND e.method = 'vad' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'other' = ANY(e.themes) AND e.method = 'vad' THEN e.total ELSE 0 END)
            ),
            'talk', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'other' = ANY(e.themes) AND e.method = 'talk' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'other' = ANY(e.themes) AND e.method = 'talk' THEN e.total ELSE 0 END)
            ),
            'personal', jsonb_build_object(
                'F', SUM(CASE WHEN e.sex = 'F' AND 'other' = ANY(e.themes) AND e.method = 'personal' THEN e.total ELSE 0 END),
                'M', SUM(CASE WHEN e.sex = 'M' AND 'other' = ANY(e.themes) AND e.method = 'personal' THEN e.total ELSE 0 END)
            )
        ) AS others_theme,

        
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

        LEFT JOIN aggregate_method e ON e.reco_id = a.reco_id AND e.month = a.month AND e.year = a.year AND e.total IS NOT NULL AND e.total >= 0

        LEFT JOIN country_view c ON r.country_id = c.id 
        LEFT JOIN region_view g ON r.region_id = g.id 
        LEFT JOIN prefecture_view p ON r.prefecture_id = p.id 
        LEFT JOIN commune_view m ON r.commune_id = m.id 
        LEFT JOIN hospital_view h ON r.hospital_id = h.id 
        LEFT JOIN district_quartier_view d ON r.district_quartier_id = d.id 
        LEFT JOIN village_secteur_view v ON r.village_secteur_id = v.id 

    GROUP BY a.reco_id, a.month, a.year;
