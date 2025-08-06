CREATE MATERIALIZED VIEW year_month_reco_grid_view AS
    SELECT DISTINCT ON (r.id, ym.month, ym.year) 
        CONCAT(ym.month, '-', ym.year, '-', r.id) AS id,
        r.id AS reco_id, 
        (r.country->>'id')::TEXT AS country_id,
        (r.region->>'id')::TEXT AS region_id,
        (r.prefecture->>'id')::TEXT AS prefecture_id,
        (r.commune->>'id')::TEXT AS commune_id,
        (r.hospital->>'id')::TEXT AS hospital_id,
        (r.district_quartier->>'id')::TEXT AS district_quartier_id,
        (r.village_secteur->>'id')::TEXT AS village_secteur_id,
        ym.year, 
        ym.month,
        CASE 
            WHEN ym.month = '01' THEN '12'
            ELSE LPAD(CAST(CAST(ym.month AS INT) - 1 AS TEXT), 2, '0')
        END AS prev_month,
        CASE 
            WHEN ym.month = '01' THEN ym.year - 1
            ELSE ym.year
        END AS prev_year
    FROM reco_view r
    CROSS JOIN year_month_grid_view ym
    ORDER BY r.id, ym.year, ym.month
