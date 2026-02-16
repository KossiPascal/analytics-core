-- @name: dashboards_reco_vaccination_not_done_view
-- @type: matview
-- @depends:
-- @auto_depends: true
-- @indexes:
--   - columns: ["month","year","reco_id"]
--     unique: true
--   - columns: ["id"]
--     method: btree

CREATE MATERIALIZED VIEW IF NOT EXISTS dashboards_reco_vaccination_not_done_view AS 
    WITH children_families AS (
        SELECT DISTINCT ON (family_id, householder_id) 
            family_id AS id, 
            family_given_name AS given_name, 
            family_name AS name, 
            family_external_id AS external_id, 
            householder_id,
            householder_phone, 
            householder_phone_other,
            reco_id,
            child_age_in_days,
            child_age_in_months,
            vaccine_VAR_2,
            is_birth_vaccine_ok,
            is_six_weeks_vaccine_ok,
            is_ten_weeks_vaccine_ok,
            is_forteen_weeks_vaccine_ok,
            is_nine_months_vaccine_ok,
            is_fifty_months_vaccine_ok
        FROM 
            dash_max_vaccination_view 
        ORDER BY family_id, householder_id, child_age_in_days DESC
    )

    SELECT * FROM (
        SELECT 
            CONCAT(a.month, '-', a.year, '-', a.reco_id) AS id,
            a.month,
            a.year,
            a.reco_id,
            (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'family', jsonb_build_object(
                            'id', f.id,
                            'name', f.given_name,
                            'fullname', f.name,
                            'code', f.external_id,
                            'phone', COALESCE(NULLIF(f.householder_phone, ''),NULLIF(f.householder_phone_other, ''))
                        ),
                        'data', (
                                    SELECT jsonb_agg(
                                    jsonb_build_object(
                                        'family', jsonb_build_object(
                                            'id', f.id,
                                            'name', f.given_name,
                                            'fullname', f.name,
                                            'code', f.external_id,
                                            'phone', COALESCE(NULLIF(f.householder_phone, ''),NULLIF(f.householder_phone_other, ''))
                                        ),

                                        'phone', jsonb_build_object(

                                            'reco', (CASE WHEN NULLIF(v.child_phone, '') IS NOT NULL AND v.child_phone = MAX(r.phone) THEN v.child_phone
                                                                WHEN NULLIF(f.householder_phone, '') IS NOT NULL AND f.householder_phone = MAX(r.phone) THEN f.householder_phone
                                                                WHEN NULLIF(f.householder_phone_other, '') IS NOT NULL AND f.householder_phone_other = MAX(r.phone) THEN f.householder_phone_other
                                                                WHEN NULLIF(MAX(r.phone), '') IS NOT NULL THEN MAX(r.phone)
                                                                ELSE NULL
                                                            END),

                                            'parent', (CASE WHEN NULLIF(f.householder_phone, '') IS NOT NULL AND f.householder_phone <> MAX(r.phone) THEN f.householder_phone
                                                                ELSE NULL
                                                            END),

                                            'neighbor', (CASE WHEN NULLIF(f.householder_phone_other, '') IS NOT NULL AND f.householder_phone_other <> MAX(r.phone) THEN f.householder_phone_other
                                                                ELSE NULL
                                                            END)
                                        ),


                                        'child', jsonb_build_object(
                                            'id', v.child_id,
                                            'name', v.child_name,
                                            'code', v.child_code,
                                            'sex', v.child_sex,

                                            'age_in_days', v.child_age_in_days,
                                            'age_in_months', v.child_age_in_months,
                                            'age_in_years', v.child_age_in_years,
                                            'age_str', v.child_age_str
                                        ),

                                        'BCG', jsonb_build_object('done',v.vaccine_BCG, 'date', v.vaccine_BCG_date, 'reason', v.no_BCG_reason),
                                        'VPO_0', jsonb_build_object('done',v.vaccine_VPO_0, 'date', v.vaccine_VPO_0_date, 'reason', v.no_VPO_0_reason),
                                        'PENTA_1', jsonb_build_object('done',v.vaccine_PENTA_1, 'date', v.vaccine_PENTA_1_date, 'reason', v.no_PENTA_1_reason),
                                        'VPO_1', jsonb_build_object('done',v.vaccine_VPO_1, 'date', v.vaccine_VPO_1_date, 'reason', v.no_VPO_1_reason),
                                        'PENTA_2', jsonb_build_object('done',v.vaccine_PENTA_2, 'date', v.vaccine_PENTA_2_date, 'reason', v.no_PENTA_2_reason),
                                        'VPO_2', jsonb_build_object('done',v.vaccine_VPO_2, 'date', v.vaccine_VPO_2_date, 'reason', v.no_VPO_2_reason),
                                        'PENTA_3', jsonb_build_object('done',v.vaccine_PENTA_3, 'date', v.vaccine_PENTA_3_date, 'reason', v.no_PENTA_3_reason),
                                        'VPO_3', jsonb_build_object('done',v.vaccine_VPO_3, 'date', v.vaccine_VPO_3_date, 'reason', v.no_VPO_3_reason),
                                        'VPI_1', jsonb_build_object('done',v.vaccine_VPI_1, 'date', v.vaccine_VPI_1_date, 'reason', v.no_VPI_1_reason),
                                        'VAR_1', jsonb_build_object('done',v.vaccine_VAR_1, 'date', v.vaccine_VAR_1_date, 'reason', v.no_VAR_1_reason),
                                        'VAA', jsonb_build_object('done',v.vaccine_VAA, 'date', v.vaccine_VAA_date, 'reason', v.no_VAA_reason),
                                        'VPI_2', jsonb_build_object('done',v.vaccine_VPI_2, 'date', v.vaccine_VPI_2_date, 'reason', v.no_VPI_2_reason),
                                        'MEN_A', jsonb_build_object('done',v.vaccine_MEN_A, 'date', v.vaccine_MEN_A_date, 'reason', v.no_MEN_A_reason),
                                        'VAR_2', jsonb_build_object('done',v.vaccine_VAR_2, 'date', v.vaccine_VAR_2_date, 'reason', v.no_VAR_2_reason)

                                    ) ORDER BY v.child_name
                                )
                                FROM dash_max_vaccination_view v

                                WHERE v.family_id = f.id AND v.child_id IS NOT NULL AND v.reco_id = a.reco_id 
                                AND (
                                    (v.child_age_in_days > 0 AND v.is_birth_vaccine_ok IS NOT TRUE) OR
                                    (v.child_age_in_days >= 42 AND (v.is_birth_vaccine_ok IS NOT TRUE OR v.is_six_weeks_vaccine_ok IS NOT TRUE)) OR
                                    (v.child_age_in_days >= 70 AND (v.is_birth_vaccine_ok IS NOT TRUE OR v.is_six_weeks_vaccine_ok IS NOT TRUE OR v.is_ten_weeks_vaccine_ok IS NOT TRUE)) OR
                                    (v.child_age_in_days >= 98 AND (v.is_birth_vaccine_ok IS NOT TRUE OR v.is_six_weeks_vaccine_ok IS NOT TRUE OR v.is_ten_weeks_vaccine_ok IS NOT TRUE OR v.is_forteen_weeks_vaccine_ok IS NOT TRUE)) OR
                                    (v.child_age_in_months >= 9 AND (v.is_birth_vaccine_ok IS NOT TRUE OR v.is_six_weeks_vaccine_ok IS NOT TRUE OR v.is_ten_weeks_vaccine_ok IS NOT TRUE OR v.is_forteen_weeks_vaccine_ok IS NOT TRUE OR v.is_nine_months_vaccine_ok IS NOT TRUE)) OR
                                    (v.child_age_in_months >= 15 AND (v.is_birth_vaccine_ok IS NOT TRUE OR v.is_six_weeks_vaccine_ok IS NOT TRUE OR v.is_ten_weeks_vaccine_ok IS NOT TRUE OR v.is_forteen_weeks_vaccine_ok IS NOT TRUE OR v.is_nine_months_vaccine_ok IS NOT TRUE OR v.is_fifty_months_vaccine_ok IS NOT TRUE))
                                )
                                AND v.vaccine_VAR_2 IS NOT TRUE
                            )
                    ) ORDER BY f.given_name
                )
                FROM children_families f 
                WHERE f.reco_id = a.reco_id 
                AND (
                    (f.child_age_in_days > 0 AND f.is_birth_vaccine_ok IS NOT TRUE) OR
                    (f.child_age_in_days >= 42 AND (f.is_birth_vaccine_ok IS NOT TRUE OR f.is_six_weeks_vaccine_ok IS NOT TRUE)) OR
                    (f.child_age_in_days >= 70 AND (f.is_birth_vaccine_ok IS NOT TRUE OR f.is_six_weeks_vaccine_ok IS NOT TRUE OR f.is_ten_weeks_vaccine_ok IS NOT TRUE)) OR
                    (f.child_age_in_days >= 98 AND (f.is_birth_vaccine_ok IS NOT TRUE OR f.is_six_weeks_vaccine_ok IS NOT TRUE OR f.is_ten_weeks_vaccine_ok IS NOT TRUE OR f.is_forteen_weeks_vaccine_ok IS NOT TRUE)) OR
                    (f.child_age_in_months >= 9 AND (f.is_birth_vaccine_ok IS NOT TRUE OR f.is_six_weeks_vaccine_ok IS NOT TRUE OR f.is_ten_weeks_vaccine_ok IS NOT TRUE OR f.is_forteen_weeks_vaccine_ok IS NOT TRUE OR f.is_nine_months_vaccine_ok IS NOT TRUE)) OR
                    (f.child_age_in_months >= 15 AND (f.is_birth_vaccine_ok IS NOT TRUE OR f.is_six_weeks_vaccine_ok IS NOT TRUE OR f.is_ten_weeks_vaccine_ok IS NOT TRUE OR f.is_forteen_weeks_vaccine_ok IS NOT TRUE OR f.is_nine_months_vaccine_ok IS NOT TRUE OR f.is_fifty_months_vaccine_ok IS NOT TRUE))
                )
                AND f.vaccine_VAR_2 IS NOT TRUE
            ) AS children_vaccines,
        
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

        GROUP BY a.reco_id, a.month, a.year
    )

    WHERE children_vaccines IS NOT NULL 

    AND jsonb_typeof(children_vaccines) = 'array'
    
    AND EXISTS (
        SELECT 1 
        FROM jsonb_array_elements(children_vaccines) AS family 
        WHERE 
            family ? 'data' 
            AND family->>'data' IS NOT NULL
            AND jsonb_typeof(family->'data') = 'array'
            AND jsonb_array_length(family->'data') > 0
            AND EXISTS (
                SELECT 1 
                FROM jsonb_array_elements(family->'data') AS child 
                WHERE 
                    jsonb_typeof(child) = 'object'
                    AND NULLIF(child->'child'->>'name', '') IS NOT NULL
            )
    );