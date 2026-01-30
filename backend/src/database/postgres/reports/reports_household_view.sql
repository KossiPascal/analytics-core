CREATE MATERIALIZED VIEW IF NOT EXISTS reports_household_view AS
    WITH base_data AS (
        SELECT 
            f.id AS family_id,
            f.month,
            f.year,
            f.reco_id,
            
            MAX(f.external_id) AS family_code, 
            MAX(f.name) AS family_fullname,
            MAX(f.given_name) AS family_name,

            BOOL_OR(COALESCE(f.household_has_working_latrine, FALSE)) AS has_functional_latrine,
            BOOL_OR(COALESCE(f.household_has_good_water_access, FALSE)) AS has_drinking_water_access,

            jsonb_build_object('id', MAX(r.id), 'name', MAX(r.name), 'phone', MAX(r.phone)) AS reco,
            jsonb_build_object('id', MAX(c.id), 'name', MAX(c.name)) AS country,
            jsonb_build_object('id', MAX(g.id), 'name', MAX(g.name)) AS region,
            jsonb_build_object('id', MAX(pr.id), 'name', MAX(pr.name)) AS prefecture,
            jsonb_build_object('id', MAX(m.id), 'name', MAX(m.name)) AS commune,
            jsonb_build_object('id', MAX(h.id), 'name', MAX(h.name)) AS hospital,
            jsonb_build_object('id', MAX(d.id), 'name', MAX(d.name)) AS district_quartier,
            jsonb_build_object('id', MAX(v.id), 'name', MAX(v.name)) AS village_secteur

        FROM family_view f
        LEFT JOIN reco_view r ON f.reco_id = r.id 
        LEFT JOIN country_view c ON f.country_id = c.id 
        LEFT JOIN region_view g ON f.region_id = g.id 
        LEFT JOIN prefecture_view pr ON f.prefecture_id = pr.id 
        LEFT JOIN commune_view m ON f.commune_id = m.id 
        LEFT JOIN hospital_view h ON f.hospital_id = h.id 
        LEFT JOIN district_quartier_view d ON f.district_quartier_id = d.id 
        LEFT JOIN village_secteur_view v ON f.village_secteur_id = v.id 

        GROUP BY f.id, f.month, f.year, f.reco_id
    )

    SELECT 
        CONCAT(b.month, '-', b.year, '-', b.reco_id, '-', b.family_id) AS id,
        b.month,
        b.year,
        b.reco_id,

        b.family_code,
        b.family_fullname,
        b.family_name,
        b.has_functional_latrine,
        b.has_drinking_water_access,

        COALESCE(s.total_household_members, 0) AS total_household_members,
        COALESCE(s.total_adult_women_15_50_years, 0) AS total_adult_women_15_50_years,
        COALESCE(s.total_children_0_12_months, 0) AS total_children_0_12_months,
        COALESCE(s.total_children_12_60_months, 0) AS total_children_12_60_months,
        COALESCE(s.total_children_under_5_years, 0) AS total_children_under_5_years,

        b.reco,
        b.country,
        b.region,
        b.prefecture,
        b.commune,
        b.hospital,
        b.district_quartier,
        b.village_secteur

    FROM base_data b

    LEFT JOIN patient_household_stats_view s
        ON s.family_id = b.family_id 
        AND s.reco_id = b.reco_id 
        AND s.year = b.year
        AND s.month = b.month;



--  const outPutData: any[] = (reports.map(r => {
--       return {
--         id: r.id,
--         index: r.family_code.replaceAll('-', ''),//parseInt(r.family_code),
--         family_code: r.family_code,
--         family_name: r.family_name,
--         family_fullname: r.family_fullname,
--         total_household_members: parseInt(`${r.total_household_members}`),
--         total_adult_women_15_50_years: parseInt(`${r.total_adult_women_15_50_years}`),
--         total_children_under_5_years: parseInt(`${r.total_children_under_5_years}`),
--         total_children_0_12_months: parseInt(`${r.total_children_0_12_months}`),
--         total_children_12_60_months: parseInt(`${r.total_children_12_60_months}`),
--         has_functional_latrine: r.has_functional_latrine === true,
--         has_drinking_water_access: r.has_drinking_water_access === true
--       }
--     }))