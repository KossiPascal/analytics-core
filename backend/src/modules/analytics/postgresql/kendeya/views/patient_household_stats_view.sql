-- @name: patient_household_stats_view
-- @type: matview
-- @depends: 
-- @auto_depends: true
-- @indexes:
--   - columns: ["id"]
--     unique: true
--   - columns: ["month","year"]
--     method: btree

CREATE MATERIALIZED VIEW IF NOT EXISTS patient_household_stats_view AS
WITH base AS (
    SELECT
        family_id,
        reco_id,
        year,
        month,
        id,
        sex,
        age_on_creation,

        (age_on_creation < INTERVAL '12 months') AS is_0_12m,
        (age_on_creation >= INTERVAL '12 months' AND age_on_creation < INTERVAL '60 months') AS is_12_60m,
        (age_on_creation < INTERVAL '60 months') AS is_under_5,
        (age_on_creation >= INTERVAL '15 years' AND age_on_creation <= INTERVAL '50 years') AS is_15_50

    FROM patient_view
)

SELECT
    CONCAT(month, '-', year, '-', reco_id, '-', family_id) AS id,
    month,
    year,
    family_id,
    reco_id,

    COUNT(*) AS total_household_members,

    SUM((sex = 'M' AND is_15_50)::int) AS total_adult_men_15_50_years,
    SUM((sex = 'F' AND is_15_50)::int) AS total_adult_women_15_50_years,
    SUM(is_15_50::int) AS total_adult_15_50_years,

    SUM((sex = 'M' AND is_0_12m)::int) AS total_children_men_0_12_months,
    SUM((sex = 'F' AND is_0_12m)::int) AS total_children_women_0_12_months,
    SUM(is_0_12m::int) AS total_children_0_12_months,

    SUM((sex = 'M' AND is_12_60m)::int) AS total_children_men_12_60_months,
    SUM((sex = 'F' AND is_12_60m)::int) AS total_children_women_12_60_months,
    SUM(is_12_60m::int) AS total_children_12_60_months,

    SUM((sex = 'M' AND is_under_5)::int) AS total_children_men_under_5_years,
    SUM((sex = 'F' AND is_under_5)::int) AS total_children_women_under_5_years,
    SUM(is_under_5::int) AS total_children_under_5_years

FROM base
GROUP BY family_id, reco_id, year, month;

