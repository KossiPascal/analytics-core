
CREATE OR REPLACE FUNCTION calculate_age_in(output TEXT, dateOfBirth DATE, anotherDate DATE DEFAULT NULL, month TEXT DEFAULT NULL, year INT DEFAULT NULL)
    RETURNS INTEGER AS $$
    DECLARE
        ref_date DATE;
        diffInDays INT;
        totalMonths INT;
        years NUMERIC;
    BEGIN
        -- Check if output or dateOfBirth is unknown (NULL), return NULL if so
        IF output IS NULL OR dateOfBirth IS NULL OR output = '' OR output = 'unknown'
            THEN RETURN NULL;
        END IF;

        -- Calculate the end of the month (last day of the given month) using DATE arithmetic
        ref_date := COALESCE(anotherDate, 
                CASE WHEN month IS NOT NULL AND year IS NOT NULL 
                    THEN DATE_TRUNC('month', TO_DATE(year || '-' || month || '-01', 'YYYY-MM-DD')) + INTERVAL '1 month' - INTERVAL '1 microsecond'
                    ELSE CURRENT_DATE 
                END)::DATE;

        -- Calculate difference in days
        diffInDays := ref_date - dateOfBirth;

        -- Calculate total months difference
        totalMonths := (EXTRACT(YEAR FROM ref_date) - EXTRACT(YEAR FROM dateOfBirth)) * 12 + (EXTRACT(MONTH FROM ref_date) - EXTRACT(MONTH FROM dateOfBirth));

        -- Convert months to years with decimal precision
        years := ROUND(totalMonths / 12.0, 2);

        -- Return based on output type
        IF output = 'years' THEN
            RETURN years;
        ELSIF output = 'months' THEN
            RETURN totalMonths;
        ELSIF output = 'days' THEN
            RETURN diffInDays;
        ELSE
            RETURN 0;
        END IF;

    END;
    $$ LANGUAGE plpgsql;