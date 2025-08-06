
CREATE MATERIALIZED VIEW IF NOT EXISTS dash_all_actions_view AS 
    SELECT *
    FROM (
        SELECT id, month, year, reco_id FROM adult_data_view 
        UNION ALL 
        SELECT id, month, year, reco_id FROM family_planning_data_view 
        UNION ALL 
        SELECT id, month, year, reco_id FROM newborn_data_view 
        UNION ALL 
        SELECT id, month, year, reco_id FROM pcimne_data_view 
        UNION ALL 
        SELECT id, month, year, reco_id FROM pregnant_data_view 
        UNION ALL 
        SELECT id, month, year, reco_id FROM delivery_data_view 
        UNION ALL 
        SELECT id, month, year, reco_id FROM referal_data_view 
        UNION ALL 
        SELECT id, month, year, reco_id FROM death_data_view 
        UNION ALL 
        SELECT id, month, year, reco_id FROM events_data_view 
        UNION ALL 
        SELECT id, month, year, reco_id FROM promotional_data_view 
        UNION ALL 
        SELECT id, month, year, reco_id FROM vaccination_data_view 
    )