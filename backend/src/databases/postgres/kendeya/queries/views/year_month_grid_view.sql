CREATE MATERIALIZED VIEW year_month_grid_view AS
SELECT *
FROM generate_full_year_month_grid(2024, 11, 1);
