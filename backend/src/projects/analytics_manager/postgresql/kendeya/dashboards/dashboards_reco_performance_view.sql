-- @name: dashboards_reco_performance_view
-- @type: matview
-- @depends:
-- @auto_depends: true
-- @indexes:
--   - columns: ["month","year","reco_id"]
--     unique: true
--   - columns: ["id"]
--     method: btree

CREATE MATERIALIZED VIEW IF NOT EXISTS dashboards_reco_performance_view AS
    WITH

    -- ===============================
    -- CONSULTATION / FOLLOWUP VIEWS
    -- ===============================

    adult_agg AS (
        SELECT month, year, reco_id,
            jsonb_build_object(
                'consultation', COUNT(*) FILTER (WHERE consultation_followup = 'consultation'),
                'followup',     COUNT(*) FILTER (WHERE consultation_followup <> 'consultation'),
                'total',        COUNT(*)
            ) AS data
        FROM adult_data_view
        GROUP BY month, year, reco_id
    ),

    family_planning_agg AS (
        SELECT month, year, reco_id,
            jsonb_build_object(
                'consultation', COUNT(*) FILTER (WHERE consultation_followup = 'consultation'),
                'followup',     COUNT(*) FILTER (WHERE consultation_followup <> 'consultation'),
                'total',        COUNT(*)
            ) AS data
        FROM family_planning_data_view
        GROUP BY month, year, reco_id
    ),

    newborn_agg AS (
        SELECT month, year, reco_id,
            jsonb_build_object(
                'consultation', COUNT(*) FILTER (WHERE consultation_followup = 'consultation'),
                'followup',     COUNT(*) FILTER (WHERE consultation_followup <> 'consultation'),
                'total',        COUNT(*)
            ) AS data
        FROM newborn_data_view
        GROUP BY month, year, reco_id
    ),

    pcimne_agg AS (
        SELECT month, year, reco_id,
            jsonb_build_object(
                'consultation', COUNT(*) FILTER (WHERE consultation_followup = 'consultation'),
                'followup',     COUNT(*) FILTER (WHERE consultation_followup <> 'consultation'),
                'total',        COUNT(*)
            ) AS data
        FROM pcimne_data_view
        GROUP BY month, year, reco_id
    ),

    pregnant_agg AS (
        SELECT month, year, reco_id,
            jsonb_build_object(
                'consultation', COUNT(*) FILTER (WHERE consultation_followup = 'consultation'),
                'followup',     COUNT(*) FILTER (WHERE consultation_followup <> 'consultation'),
                'total',        COUNT(*)
            ) AS data
        FROM pregnant_data_view
        GROUP BY month, year, reco_id
    ),

    all_cf_agg AS (
        SELECT month, year, reco_id,
            jsonb_build_object(
                'consultation', COUNT(*) FILTER (WHERE consultation_followup = 'consultation'),
                'followup',     COUNT(*) FILTER (WHERE consultation_followup <> 'consultation'),
                'total',        COUNT(*)
            ) AS data
        FROM dash_consultation_followup_view
        GROUP BY month, year, reco_id
    ),

    -- ===============================
    -- SIMPLE COUNT VIEWS
    -- ===============================

    referal_agg AS (
        SELECT month, year, reco_id, COUNT(*) AS total
        FROM referal_data_view
        GROUP BY month, year, reco_id
    ),

    delivery_agg AS (
        SELECT month, year, reco_id, COUNT(*) AS total
        FROM delivery_data_view
        GROUP BY month, year, reco_id
    ),

    events_agg AS (
        SELECT month, year, reco_id, COUNT(*) AS total
        FROM events_data_view
        GROUP BY month, year, reco_id
    ),

    promotional_agg AS (
        SELECT month, year, reco_id, COUNT(*) AS total
        FROM promotional_data_view
        GROUP BY month, year, reco_id
    ),

    death_agg AS (
        SELECT month, year, reco_id, COUNT(*) AS total
        FROM death_data_view
        GROUP BY month, year, reco_id
    ),

    all_actions_agg AS (
        SELECT month, year, reco_id, COUNT(*) AS total
        FROM dash_all_actions_view
        GROUP BY month, year, reco_id
    ),

    family_agg AS (
        SELECT month, year, reco_id, COUNT(*) AS total
        FROM family_view
        GROUP BY month, year, reco_id
    ),

    patient_agg AS (
        SELECT month, year, reco_id, COUNT(*) AS total
        FROM patient_view
        GROUP BY month, year, reco_id
    )

    -- ===============================
    -- FINAL SELECT
    -- ===============================

    SELECT 
        CONCAT(a.month, '-', a.year, '-', a.reco_id) AS id,
        a.month,
        a.year,
        a.reco_id,

        COALESCE(ad.data, '{}'::jsonb)  AS adult_data_count,
        COALESCE(fp.data, '{}'::jsonb)  AS family_planning_data_count,
        COALESCE(nb.data, '{}'::jsonb)  AS newborn_data_count,
        COALESCE(pc.data, '{}'::jsonb)  AS pcimne_data_count,
        COALESCE(pr.data, '{}'::jsonb)  AS pregnant_data_count,
        COALESCE(cf.data, '{}'::jsonb)  AS all_consultation_followup_count,

        COALESCE(ref.total, 0) AS referal_data_count,
        COALESCE(del.total, 0) AS delivery_data_count,
        COALESCE(ev.total, 0)  AS events_data_count,
        COALESCE(pm.total, 0)  AS promotional_data_count,
        COALESCE(dt.total, 0)  AS death_data_count,
        COALESCE(aa.total, 0)  AS all_actions_count,
        COALESCE(fa.total, 0)  AS family_count,
        COALESCE(pa.total, 0)  AS patient_count,

        jsonb_build_object('id', r.id, 'name', r.name, 'phone', r.phone) AS reco,
        jsonb_build_object('id', c.id, 'name', c.name) AS country,
        jsonb_build_object('id', g.id, 'name', g.name) AS region,
        jsonb_build_object('id', p.id, 'name', p.name) AS prefecture,
        jsonb_build_object('id', m.id, 'name', m.name) AS commune,
        jsonb_build_object('id', h.id, 'name', h.name) AS hospital,
        jsonb_build_object('id', d.id, 'name', d.name) AS district_quartier,
        jsonb_build_object('id', v.id, 'name', v.name) AS village_secteur

    FROM year_month_reco_grid_view a

    JOIN reco_view r ON r.id = a.reco_id

    LEFT JOIN adult_agg ad ON ad.month = a.month AND ad.year = a.year AND ad.reco_id = a.reco_id
    LEFT JOIN family_planning_agg fp ON fp.month = a.month AND fp.year = a.year AND fp.reco_id = a.reco_id
    LEFT JOIN newborn_agg nb ON nb.month = a.month AND nb.year = a.year AND nb.reco_id = a.reco_id
    LEFT JOIN pcimne_agg pc ON pc.month = a.month AND pc.year = a.year AND pc.reco_id = a.reco_id
    LEFT JOIN pregnant_agg pr ON pr.month = a.month AND pr.year = a.year AND pr.reco_id = a.reco_id
    LEFT JOIN all_cf_agg cf ON cf.month = a.month AND cf.year = a.year AND cf.reco_id = a.reco_id

    LEFT JOIN referal_agg ref ON ref.month = a.month AND ref.year = a.year AND ref.reco_id = a.reco_id
    LEFT JOIN delivery_agg del ON del.month = a.month AND del.year = a.year AND del.reco_id = a.reco_id
    LEFT JOIN events_agg ev ON ev.month = a.month AND ev.year = a.year AND ev.reco_id = a.reco_id
    LEFT JOIN promotional_agg pm ON pm.month = a.month AND pm.year = a.year AND pm.reco_id = a.reco_id
    LEFT JOIN death_agg dt ON dt.month = a.month AND dt.year = a.year AND dt.reco_id = a.reco_id
    LEFT JOIN all_actions_agg aa ON aa.month = a.month AND aa.year = a.year AND aa.reco_id = a.reco_id
    LEFT JOIN family_agg fa ON fa.month = a.month AND fa.year = a.year AND fa.reco_id = a.reco_id
    LEFT JOIN patient_agg pa ON pa.month = a.month AND pa.year = a.year AND pa.reco_id = a.reco_id

    LEFT JOIN country_view c ON c.id = a.country_id
    LEFT JOIN region_view g ON g.id = a.region_id
    LEFT JOIN prefecture_view p ON p.id = a.prefecture_id
    LEFT JOIN commune_view m ON m.id = a.commune_id
    LEFT JOIN hospital_view h ON h.id = a.hospital_id
    LEFT JOIN district_quartier_view d ON d.id = a.district_quartier_id
    LEFT JOIN village_secteur_view v ON v.id = a.village_secteur_id

    GROUP BY
        a.month, a.year, a.reco_id,
        r.id, r.name, r.phone,
        c.id, c.name,
        g.id, g.name,
        p.id, p.name,
        m.id, m.name,
        h.id, h.name,
        d.id, d.name,
        v.id, v.name,
        ad.data, fp.data, nb.data, pc.data, pr.data, cf.data,
        ref.total, del.total, ev.total, pm.total, dt.total,
        aa.total, fa.total, pa.total;
