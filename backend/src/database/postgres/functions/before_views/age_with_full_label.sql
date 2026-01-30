CREATE OR REPLACE FUNCTION age_with_full_label(birth_date DATE DEFAULT NULL, ageInDays BIGINT DEFAULT 0)
    RETURNS TEXT AS $$
    DECLARE
        years INT;
        remainingDays NUMERIC;
        months INT;
        days INT;
        result TEXT;
    BEGIN
        -- Calcul de l'âge en jours seulement si birth_date n'est pas NULL
        IF birth_date IS NOT NULL THEN
            ageInDays := calculate_age_in('days', birth_date);
        END IF;

        -- Conversion en années, mois et jours
        years := FLOOR(ageInDays / 365.25);
        remainingDays := MOD(ageInDays, 365.25);
        months := FLOOR(remainingDays / 30.4375);
        days := FLOOR(MOD(remainingDays, 30.4375));

        -- Construction du texte du résultat
        IF years > 0 THEN
            result := years || ' ' || CASE WHEN years > 1 THEN 'ans' ELSE 'an' END;
            IF months > 0 THEN
                result := result || ' ' || months || ' mois';
            ELSIF days > 0 THEN
                result := result || ' ' || days || ' ' || CASE WHEN days > 1 THEN 'jours' ELSE 'jour' END;
            END IF;
        ELSIF months > 0 THEN
            result := months || ' mois';
            IF days > 0 THEN
                result := result || ' ' || days || ' ' || CASE WHEN days > 1 THEN 'jours' ELSE 'jour' END;
            END IF;
        ELSE
            result := days || ' ' || CASE WHEN days > 1 THEN 'jours' ELSE 'jour' END;
        END IF;

        RETURN result;
    END;
    $$ LANGUAGE plpgsql;