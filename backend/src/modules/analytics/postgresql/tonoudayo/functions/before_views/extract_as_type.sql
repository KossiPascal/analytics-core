-- ==============================================
-- FONCTION UTILITAIRE POUR EXTRACTION DE CHAMPS JSON
-- ==============================================

CREATE OR REPLACE FUNCTION extract_json_field(json_doc JSONB, field_path TEXT, data_type TEXT DEFAULT 'TEXT') RETURNS TEXT AS $$
BEGIN
    -- Vérifie si le champ existe et n'est pas vide
    IF json_doc #>> string_to_array(field_path, '.') IS NULL
        OR json_doc #>> string_to_array(field_path, '.') = '' THEN
        RETURN NULL;
    END IF;

    -- Retourne la valeur selon le type demandé
    CASE data_type
        WHEN 'TEXT' THEN
            RETURN json_doc #>> string_to_array(field_path, '.');
        WHEN 'INTEGER' THEN
            RETURN (json_doc #>> string_to_array(field_path, '.'))::INTEGER::TEXT;
        WHEN 'DATE' THEN
            RETURN (json_doc #>> string_to_array(field_path, '.'))::DATE::TEXT;
        WHEN 'DECIMAL' THEN
            RETURN (json_doc #>> string_to_array(field_path, '.'))::DECIMAL::TEXT;
        WHEN 'BOOLEAN' THEN
            RETURN (json_doc #>> string_to_array(field_path, '.'))::BOOLEAN::TEXT;
        ELSE
            RETURN json_doc #>> string_to_array(field_path, '.');
        END CASE;

EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ==============================================
-- FONCTION SPÉCIALISÉE POUR LES CHAMPS DE FORMULAIRE
-- ==============================================

CREATE OR REPLACE FUNCTION extract_form_field(
    doc JSONB,
    field_path TEXT,
    data_type TEXT DEFAULT 'TEXT'
) RETURNS TEXT AS $$
BEGIN
    -- Préfixe automatiquement avec 'fields.'
    RETURN extract_json_field(doc, 'fields.' || field_path, data_type);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ==============================================
-- MACROS/FONCTIONS POUR CASTING DIRECT
-- ==============================================

-- Fonction pour retourner directement le bon type
CREATE OR REPLACE FUNCTION extract_as_text(doc JSONB, field_path TEXT)
    RETURNS TEXT AS $$
BEGIN
    RETURN extract_form_field(doc, field_path, 'TEXT');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION extract_as_integer(doc JSONB, field_path TEXT)
    RETURNS INTEGER AS $$
BEGIN
    RETURN extract_form_field(doc, field_path, 'INTEGER')::INTEGER;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION extract_as_date(doc JSONB, field_path TEXT)
    RETURNS DATE AS $$
BEGIN
    RETURN extract_form_field(doc, field_path, 'DATE')::DATE;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION extract_as_boolean(doc JSONB, field_path TEXT)
    RETURNS BOOLEAN AS $$
BEGIN
    RETURN extract_form_field(doc, field_path, 'BOOLEAN')::BOOLEAN;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION extract_as_decimal(doc JSONB, field_path TEXT)
    RETURNS DECIMAL AS $$
BEGIN
    RETURN extract_form_field(doc, field_path, 'DECIMAL')::DECIMAL;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
