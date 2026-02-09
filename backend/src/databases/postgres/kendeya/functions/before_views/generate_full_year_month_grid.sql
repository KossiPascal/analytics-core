CREATE OR REPLACE FUNCTION generate_full_year_month_grid(
    start_year INT DEFAULT 2024,
    start_month INT DEFAULT 1,
    start_day INT DEFAULT 1
)
RETURNS TABLE (
    id TEXT,
    year INT,
    month TEXT,
    month_label TEXT,
    month_id TEXT
)
LANGUAGE SQL
AS $$
    WITH date_series AS (
        SELECT generate_series(
            make_date(start_year, start_month, start_day),
            DATE_TRUNC('month', CURRENT_DATE),
            INTERVAL '1 month'
        ) AS date_value
    ),
    grid AS (
        SELECT
            EXTRACT(YEAR FROM date_value)::INT AS year,
            TO_CHAR(date_value, 'MM') AS month,
            TO_CHAR(date_value, 'TMMonth') AS raw_label,
            TO_CHAR(date_value, 'YYYY-MM') AS month_id
        FROM date_series
    )
    SELECT
        CONCAT(month, '-', year) AS id,
        year,
        month,
        INITCAP(TRIM(raw_label)) AS month_label,
        month_id
    FROM grid
    ORDER BY year, month;
$$;



-- CREATE OR REPLACE FUNCTION generate_full_year_month_grid(
--     start_year INT DEFAULT 2024,
--     start_month INT DEFAULT 1,
--     start_day INT DEFAULT 1
-- )
-- RETURNS TABLE (year INT, month TEXT)
-- LANGUAGE SQL
-- AS $$
--     WITH date_series AS (
--         SELECT generate_series(
--             make_date(start_year, start_month, start_day),
--             DATE_TRUNC('month', CURRENT_DATE),
--             INTERVAL '1 month'
--         ) AS date_value
--     ),
--     years AS (
--         SELECT DISTINCT EXTRACT(YEAR FROM date_value)::INT AS year
--         FROM date_series
--     ),
--     months AS (
--         SELECT DISTINCT TO_CHAR(date_value, 'MM') AS month
--         FROM date_series
--     )
--     SELECT y.year, m.month
--     FROM years y
--     CROSS JOIN months m
--     WHERE make_date(y.year, m.month::INT, 1) <= DATE_TRUNC('month', CURRENT_DATE)
--     ORDER BY y.year, m.month;
-- $$;

