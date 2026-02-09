CREATE MATERIALIZED VIEW IF NOT EXISTS reco_chws_supervision_view AS 
    SELECT
        (doc->>'_id')::TEXT AS id,
        (doc->>'_rev')::TEXT AS rev,
        (doc->>'form')::TEXT AS form,

        parse_json_boolean(doc->'fields'->'sup_grid'->>'has_activity_plan') IS TRUE AS has_activity_plan,
        parse_json_boolean(doc->'fields'->'sup_grid'->>'has_update_register') IS TRUE AS has_update_register,
        parse_json_boolean(doc->'fields'->'sup_grid'->>'continue_pregnant_census') IS TRUE AS continue_pregnant_census,
        parse_json_boolean(doc->'fields'->'sup_grid'->>'has_previous_month_meeting') IS TRUE AS has_previous_month_meeting,
        parse_json_boolean(doc->'fields'->'sup_grid'->>'has_well_maintained_tools') IS TRUE AS has_well_maintained_tools,

        NULLIF(doc->'fields'->'sup_grid'->>'no_activity_plan_reason', '') AS no_activity_plan_reason,
        NULLIF(doc->'fields'->'sup_grid'->>'no_update_register_reason', '') AS no_update_register_reason,
        NULLIF(doc->'fields'->'sup_grid'->>'no_pregnant_census_reason', '') AS no_pregnant_census_reason,
        NULLIF(doc->'fields'->'sup_grid'->>'no_meeting_reason', '') AS no_meeting_reason,
        NULLIF(doc->'fields'->'sup_grid'->>'bad_maintained_tools_reason', '') AS bad_maintained_tools_reason,

        parse_json_bigint(doc->'fields'->'promo_activity'->>'vad_planned') AS vad_planned,
        parse_json_bigint(doc->'fields'->'promo_activity'->>'vad_carried') AS vad_carried,
        parse_json_bigint(doc->'fields'->'promo_activity'->>'ec_planned') AS ec_planned,
        parse_json_bigint(doc->'fields'->'promo_activity'->>'ec_carried') AS ec_carried,
        parse_json_bigint(doc->'fields'->'promo_activity'->>'num_active_search_sheet_given') AS num_active_search_sheet_given,
        parse_json_bigint(doc->'fields'->'promo_activity'->>'num_vaccinal_late_found_reffered') AS num_vaccinal_late_found_reffered,
        parse_json_bigint(doc->'fields'->'promo_activity'->>'num_women_anc_late') AS num_women_anc_late,
        parse_json_bigint(doc->'fields'->'promo_activity'->>'num_women_anc_referred') AS num_women_anc_referred,

        CASE WHEN doc->'fields'->'checking_equipment'->>'android' IN ('good', 'bad', 'not_available') THEN doc->'fields'->'checking_equipment'->>'android' ELSE NULL END AS android,
        CASE WHEN doc->'fields'->'checking_equipment'->>'power_bank' IN ('good', 'bad', 'not_available') THEN doc->'fields'->'checking_equipment'->>'power_bank' ELSE NULL END AS power_bank,
        CASE WHEN doc->'fields'->'checking_equipment'->>'visibility_kit' IN ('good', 'bad', 'not_available') THEN doc->'fields'->'checking_equipment'->>'visibility_kit' ELSE NULL END AS visibility_kit,
        CASE WHEN doc->'fields'->'checking_equipment'->>'protection_kit' IN ('good', 'bad', 'not_available') THEN doc->'fields'->'checking_equipment'->>'protection_kit' ELSE NULL END AS protection_kit,

        CASE WHEN doc->'fields'->'g_household_sup'->>'followup_cible' IN ('women_cpn1', 'newborn', 'none') THEN doc->'fields'->'g_household_sup'->>'followup_cible' ELSE NULL END AS followup_cible,
        parse_json_bigint(doc->'fields'->'g_household_sup'->>'women_cpn1_followup_count') AS women_cpn1_followup_count,
        parse_json_bigint(doc->'fields'->'g_household_sup'->>'women_cpn1_followup_no_milda_count') AS women_cpn1_followup_no_milda_count,
        parse_json_bigint(doc->'fields'->'g_household_sup'->>'newborn_followup_count') AS newborn_followup_count,
        parse_json_bigint(doc->'fields'->'g_household_sup'->>'newborn_followup_no_milda_count') AS newborn_followup_no_milda_count,

        NULLIF(doc->'fields'->'g_household_sup'->>'supervision_difficulty', '') AS supervision_difficulty,
        COALESCE(NULLIF(doc->'fields'->'g_household_sup'->>'recommendation', ''), NULLIF(doc->'fields'->'tracking_notebook'->>'recommendation', '')) AS recommendation,

        CASE WHEN doc->'fields'->'tracking_notebook'->>'supervisor' IN ('chws', 'others') THEN doc->'fields'->'tracking_notebook'->>'supervisor' ELSE NULL END AS supervisor,
        NULLIF(doc->'fields'->'tracking_notebook'->>'other_supervisor', '') AS other_supervisor,
        NULLIF(doc->'fields'->'tracking_notebook'->>'findings', '') AS findings,
        NULLIF(doc->'fields'->'tracking_notebook'->>'actions_taken', '') AS actions_taken,

        NULLIF(doc->'fields'->>'country_id', '') AS country_id,
        NULLIF(doc->'fields'->>'region_id', '') AS region_id,
        NULLIF(doc->'fields'->>'prefecture_id', '') AS prefecture_id,
        NULLIF(doc->'fields'->>'commune_id', '') AS commune_id,
        NULLIF(doc->'fields'->>'hospital_id', '') AS hospital_id,
        NULLIF(doc->'fields'->>'district_quartier_id', '') AS district_quartier_id,
        CASE 
            WHEN NULLIF(doc->'fields'->>'village_secteur_id', '') IS NOT NULL THEN doc->'fields'->>'village_secteur_id'
            WHEN doc->>'form' = 'supervision_notebook_reco' AND NULLIF(doc->'fields'->>'patient_id', '') IS NOT NULL THEN doc->'fields'->>'patient_id'
            ELSE NULL
        END AS village_secteur_id,

        CASE 
            WHEN doc->>'form' = 'supervision_notebook_reco' AND NULLIF(doc->'fields'->>'user_id', '') IS NOT NULL THEN doc->'fields'->>'user_id'
            WHEN doc->>'form' IN ('supervision_grid', 'supervision_notebook_chws') AND NULLIF(doc->'fields'->>'patient_id', '') IS NOT NULL THEN doc->'fields'->>'patient_id'
            ELSE NULL
        END AS reco_id,
        CASE 
            WHEN doc->>'form' IN ('supervision_grid', 'supervision_notebook_chws') AND NULLIF(doc->'fields'->>'user_id', '') IS NOT NULL THEN doc->'fields'->>'user_id'
            ELSE NULL
        END AS chw_id,

        TO_DATE(COALESCE(NULLIF(doc->'fields'->'sup_grid'->>'activity_date', ''), NULLIF(doc->'fields'->'tracking_notebook'->>'folowup_date', '')), 'YYYY-MM-DD') AS reported_date,
        TO_TIMESTAMP(COALESCE(NULLIF(doc->'fields'->'sup_grid'->>'activity_date', ''), NULLIF(doc->'fields'->'tracking_notebook'->>'folowup_date', '')), 'YYYY-MM-DD HH24:MI:SS') AS reported_full_date,
        EXTRACT(EPOCH FROM TO_DATE(COALESCE(NULLIF(doc->'fields'->'sup_grid'->>'activity_date', ''), NULLIF(doc->'fields'->'tracking_notebook'->>'folowup_date', '')), 'YYYY-MM-DD'))::BIGINT AS reported_date_timestamp,
        EXTRACT(YEAR FROM TO_TIMESTAMP(COALESCE(NULLIF(doc->'fields'->'sup_grid'->>'activity_date', ''), NULLIF(doc->'fields'->'tracking_notebook'->>'folowup_date', '')), 'YYYY-MM-DD HH24:MI:SS'))::BIGINT AS year,
        LPAD(EXTRACT(MONTH FROM TO_TIMESTAMP(COALESCE(NULLIF(doc->'fields'->'sup_grid'->>'activity_date', ''), NULLIF(doc->'fields'->'tracking_notebook'->>'folowup_date', '')), 'YYYY-MM-DD HH24:MI:SS'))::TEXT, 2, '0') AS month,


        -- Géolocalisation propre
        CASE 
            WHEN jsonb_typeof(doc->'geolocation') = 'object'
            AND NULLIF(doc->'geolocation'->>'latitude', '') IS NOT NULL
            AND NULLIF(doc->'geolocation'->>'longitude', '') IS NOT NULL
            THEN doc->'geolocation'
            ELSE NULL
        END::JSONB AS geolocation
    FROM 
        couchdb 
    WHERE
        doc->>'form' IS NOT NULL
        AND doc->'fields' IS NOT NULL 
        AND doc->>'form' IN ('supervision_grid', 'supervision_notebook_reco', 'supervision_notebook_chws');  
