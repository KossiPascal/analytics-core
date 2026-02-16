-- @name: report_all_cover_reco_view
-- @type: matview
-- @depends:
-- @auto_depends: true
-- @indexes:
--   - columns: ["month","year","reco_id"]
--     unique: true
--   - columns: ["id"]

CREATE MATERIALIZED VIEW IF NOT EXISTS report_all_cover_reco_view AS
    SELECT DISTINCT ON (reco_id)
        reco_id AS id,  -- <- alias ajouté
        reco_id,
        month,
        year
    FROM (
        SELECT reco_id, month, year FROM vaccination_data_view
        UNION 
        SELECT reco_id, month, year FROM pcimne_data_view
        UNION 
        SELECT reco_id, month, year FROM newborn_data_view
        UNION 
        SELECT reco_id, month, year FROM family_view
        UNION 
        SELECT reco_id, month, year FROM patient_view
        UNION 
        SELECT reco_id, month, year FROM death_data_view
        UNION 
        SELECT reco_id, month, year FROM adult_data_view
        UNION 
        SELECT reco_id, month, year FROM promotional_data_view
        UNION 
        SELECT reco_id, month, year FROM events_data_view
        UNION 
        SELECT reco_id, month, year FROM pregnant_data_view
        UNION 
        SELECT reco_id, month, year FROM delivery_data_view
        UNION 
        SELECT reco_id, month, year FROM family_planning_data_view
        UNION 
        SELECT reco_id, month, year FROM reco_meg_data_view
        UNION 
        SELECT reco_id, month, year FROM referal_data_view
        UNION 
        SELECT reco_id, month, year FROM reco_chws_supervision_view
    ) all_data;
