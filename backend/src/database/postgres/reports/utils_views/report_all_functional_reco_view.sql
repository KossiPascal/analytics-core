CREATE MATERIALIZED VIEW IF NOT EXISTS report_all_functional_reco_view AS
    SELECT DISTINCT
        CONCAT(reco_id, '-', month, '-', year) AS id,  -- <- alias ajouté
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
    ) all_data;
