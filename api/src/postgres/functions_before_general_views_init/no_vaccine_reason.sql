CREATE OR REPLACE FUNCTION no_vaccine_reason(reason TEXT) 
RETURNS TEXT AS $$
BEGIN
    IF reason = 'shortage' THEN
        RETURN 'Rupture de vaccin';
    ELSIF reason = 'no_appointment_respect' THEN
        RETURN 'Non respect du rendez-vous';
    ELSIF reason = 'hesitancy' THEN
        RETURN 'Réticence des parents';
    ELSIF reason = 'upcoming' THEN
        RETURN 'Rendez-vous pas encore arrivé';
    ELSE
        RETURN NULL;
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
