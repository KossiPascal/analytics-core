-- @name: year_month_grid_view
-- @type: matview
-- @depends: 
-- @auto_depends: true
-- @indexes:
--   - columns: ["id"]
--     unique: true
--   - columns: ["month","year"]
--     method: btree

CREATE MATERIALIZED VIEW IF NOT EXISTS year_month_grid_view AS
SELECT *
FROM generate_full_year_month_grid(2024, 11, 1);
