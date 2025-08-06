CREATE MATERIALIZED VIEW IF NOT EXISTS dashboards_reco_vaccination_partial_done_view AS 
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
            vaccine_BCG,
            vaccine_VPO_0,
            vaccine_PENTA_1,
            vaccine_VPO_1,
            vaccine_PENTA_2,
            vaccine_VPO_2,
            vaccine_PENTA_3,
            vaccine_VPO_3,
            vaccine_VPI_1,
            vaccine_VAR_1,
            vaccine_VAA,
            vaccine_VPI_2,
            vaccine_MEN_A,
            vaccine_VAR_2
        FROM 
            dash_max_vaccination_view 
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
                        'family_id', f.id,
                        'family_name', f.given_name,
                        'family_fullname', f.name,
                        'family_code', f.external_id,
                        'family_phone', COALESCE(NULLIF(f.householder_phone, ''),NULLIF(f.householder_phone_other, '')),
                        'data', (
                                    SELECT jsonb_agg(
                                    jsonb_build_object(
                                        'family_id', f.id,
                                        'family_name', f.given_name,
                                        'family_fullname', f.name,
                                        'family_code', f.external_id,
                                        'child_id', v.child_id,
                                        'child_name', v.child_name,
                                        'child_code', v.child_code,
                                        'child_sex', v.child_sex,

                                        'reco_phone', (CASE WHEN NULLIF(v.child_phone, '') IS NOT NULL AND v.child_phone = MAX(r.phone) THEN v.child_phone
                                                            WHEN NULLIF(f.householder_phone, '') IS NOT NULL AND f.householder_phone = MAX(r.phone) THEN f.householder_phone
                                                            WHEN NULLIF(f.householder_phone_other, '') IS NOT NULL AND f.householder_phone_other = MAX(r.phone) THEN f.householder_phone_other
                                                            WHEN NULLIF(MAX(r.phone), '') IS NOT NULL THEN MAX(r.phone)
                                                            ELSE NULL
                                                        END),

                                        'parent_phone', (CASE WHEN NULLIF(f.householder_phone, '') IS NOT NULL AND f.householder_phone <> MAX(r.phone) THEN f.householder_phone
                                                            ELSE NULL
                                                        END),

                                        'neighbor_phone', (CASE WHEN NULLIF(f.householder_phone_other, '') IS NOT NULL AND f.householder_phone_other <> MAX(r.phone) THEN f.householder_phone_other
                                                            ELSE NULL
                                                          END),

                                        'child_age_in_days', v.child_age_in_days,
                                        'child_age_in_months', v.child_age_in_months,
                                        'child_age_in_years', v.child_age_in_years,
                                        'child_age_str', v.child_age_str,

                                        'vaccine_BCG', v.vaccine_BCG,
                                        'vaccine_VPO_0', v.vaccine_VPO_0,
                                        'vaccine_PENTA_1', v.vaccine_PENTA_1,
                                        'vaccine_VPO_1', v.vaccine_VPO_1,
                                        'vaccine_PENTA_2', v.vaccine_PENTA_2,
                                        'vaccine_VPO_2', v.vaccine_VPO_2,
                                        'vaccine_PENTA_3', v.vaccine_PENTA_3,
                                        'vaccine_VPO_3', v.vaccine_VPO_3,
                                        'vaccine_VPI_1', v.vaccine_VPI_1,
                                        'vaccine_VAR_1', v.vaccine_VAR_1,
                                        'vaccine_VAA', v.vaccine_VAA,
                                        'vaccine_VPI_2', v.vaccine_VPI_2,
                                        'vaccine_MEN_A', v.vaccine_MEN_A,
                                        'vaccine_VAR_2', v.vaccine_VAR_2,

                                        'no_BCG_reason', v.no_BCG_reason,
                                        'no_VPO_0_reason', v.no_VPO_0_reason,
                                        'no_PENTA_1_reason', v.no_PENTA_1_reason,
                                        'no_VPO_1_reason', v.no_VPO_1_reason,
                                        'no_PENTA_2_reason', v.no_PENTA_2_reason,
                                        'no_VPO_2_reason', v.no_VPO_2_reason,
                                        'no_PENTA_3_reason', v.no_PENTA_3_reason,
                                        'no_VPO_3_reason', v.no_VPO_3_reason,
                                        'no_VPI_1_reason', v.no_VPI_1_reason,
                                        'no_VAR_1_reason', v.no_VAR_1_reason,
                                        'no_VAA_reason', v.no_VAA_reason,
                                        'no_VPI_2_reason', v.no_VPI_2_reason,
                                        'no_MEN_A_reason', v.no_MEN_A_reason,
                                        'no_VAR_2_reason', v.no_VAR_2_reason
                                    ) ORDER BY v.child_name
                                )
                                FROM dash_max_vaccination_view v
                                WHERE v.family_id = f.id AND v.child_id IS NOT NULL AND v.reco_id = a.reco_id 
                                AND (
                                    v.vaccine_BCG IS NOT TRUE
                                    OR v.vaccine_VPO_0 IS NOT TRUE
                                    OR v.vaccine_PENTA_1 IS NOT TRUE
                                    OR v.vaccine_VPO_1 IS NOT TRUE
                                    OR v.vaccine_PENTA_2 IS NOT TRUE
                                    OR v.vaccine_VPO_2 IS NOT TRUE
                                    OR v.vaccine_PENTA_3 IS NOT TRUE
                                    OR v.vaccine_VPO_3 IS NOT TRUE
                                    OR v.vaccine_VPI_1 IS NOT TRUE
                                    OR v.vaccine_VAR_1 IS NOT TRUE
                                    OR v.vaccine_VAA IS NOT TRUE
                                    OR v.vaccine_VPI_2 IS NOT TRUE
                                    OR v.vaccine_MEN_A IS NOT TRUE
                                )
                                AND v.vaccine_VAR_2 IS TRUE
                            )
                    ) ORDER BY f.given_name
                )
                FROM children_families f 
                WHERE f.reco_id = a.reco_id 
                AND (
                    f.vaccine_BCG IS NOT TRUE
                    OR f.vaccine_VPO_0 IS NOT TRUE
                    OR f.vaccine_PENTA_1 IS NOT TRUE
                    OR f.vaccine_VPO_1 IS NOT TRUE
                    OR f.vaccine_PENTA_2 IS NOT TRUE
                    OR f.vaccine_VPO_2 IS NOT TRUE
                    OR f.vaccine_PENTA_3 IS NOT TRUE
                    OR f.vaccine_VPO_3 IS NOT TRUE
                    OR f.vaccine_VPI_1 IS NOT TRUE
                    OR f.vaccine_VAR_1 IS NOT TRUE
                    OR f.vaccine_VAA IS NOT TRUE
                    OR f.vaccine_VPI_2 IS NOT TRUE
                    OR f.vaccine_MEN_A IS NOT TRUE
                )
                AND f.vaccine_VAR_2 IS TRUE
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
                    AND COALESCE(child->>'child_name', '') <> ''
            )
    );