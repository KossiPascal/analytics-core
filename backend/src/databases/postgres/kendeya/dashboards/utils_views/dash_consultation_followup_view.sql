CREATE MATERIALIZED VIEW IF NOT EXISTS dash_consultation_followup_view AS 
    SELECT * 
    FROM (
        SELECT id, month, year, reco_id, consultation_followup FROM adult_data_view
        UNION ALL 
        SELECT id, month, year, reco_id, consultation_followup FROM family_planning_data_view
        UNION ALL 
        SELECT id, month, year, reco_id, consultation_followup FROM newborn_data_view
        UNION ALL 
        SELECT id, month, year, reco_id, consultation_followup FROM pcimne_data_view
        UNION ALL 
        SELECT id, month, year, reco_id, consultation_followup FROM pregnant_data_view
    )