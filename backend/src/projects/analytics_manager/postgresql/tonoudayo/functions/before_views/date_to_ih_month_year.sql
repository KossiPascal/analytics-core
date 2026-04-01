CREATE OR REPLACE FUNCTION date_to_ih_month_year(part TEXT, input_value ANYELEMENT) RETURNS JSONB AS $$
    DECLARE
        actual_date DATE;
        final_month TEXT;
        final_year INTEGER;
        shifted_date DATE;
        start_date TEXT;
        end_date TEXT;
    BEGIN
        BEGIN
            -- Gestion des différents types d'entrée
            IF pg_typeof(input_value) IN ('integer', 'bigint', 'numeric') THEN
                actual_date := to_timestamp(input_value::NUMERIC / 1000)::DATE;

            ELSIF pg_typeof(input_value) = 'text' THEN
                IF input_value ~ '^\d{13}$' THEN  -- timestamp en millisecondes
                    actual_date := to_timestamp(input_value::NUMERIC / 1000)::DATE;
                ELSE
                    actual_date := input_value::DATE;
                END IF;

            ELSIF pg_typeof(input_value) = 'date' THEN
                actual_date := input_value::DATE;

            ELSIF pg_typeof(input_value) IN ('timestamp', 'timestamp with time zone') THEN
                actual_date := input_value::TIMESTAMP::DATE;

            ELSE
                RETURN NULL;
            END IF;
        EXCEPTION
            WHEN others THEN
                RETURN NULL;
        END;

        -- Appliquer la logique : si jour >= 21 → on ajoute un mois
        IF EXTRACT(DAY FROM actual_date) >= 21 THEN
            shifted_date := actual_date + INTERVAL '1 month';

            final_month := TO_CHAR(shifted_date, 'MM');
            final_year := EXTRACT(YEAR FROM shifted_date)::INTEGER;

            start_date := TO_CHAR(DATE_TRUNC('month', actual_date) + INTERVAL '20 days', 'YYYY-MM-DD');
            end_date := TO_CHAR(DATE_TRUNC('month', shifted_date) + INTERVAL '19 days', 'YYYY-MM-DD');
        ELSE
            final_month := TO_CHAR(actual_date, 'MM');
            final_year := EXTRACT(YEAR FROM actual_date)::INTEGER;

            start_date := TO_CHAR(DATE_TRUNC('month', actual_date - INTERVAL '1 month') + INTERVAL '20 days', 'YYYY-MM-DD');
            end_date := TO_CHAR(DATE_TRUNC('month', actual_date) + INTERVAL '19 days', 'YYYY-MM-DD');
        END IF;

        -- Retour selon la partie demandée
        IF part = 'month' THEN
            RETURN to_jsonb(final_month);
        ELSIF part = 'year' THEN
            RETURN to_jsonb(final_year);
        ELSIF part = 'all' THEN
            RETURN jsonb_build_object('year', final_year, 'month', final_month);

        ELSIF part = 'period' THEN
            RETURN jsonb_build_object('start_date', start_date, 'end_date', end_date);
            
        ELSIF part = 'full' THEN
            RETURN jsonb_build_object(
                'year', final_year,
                'month', final_month,
                'start_date', start_date,
                'end_date', end_date
            );
        ELSE
            RETURN NULL;
        END IF;
    END;
    $$ LANGUAGE plpgsql;