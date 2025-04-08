import { MigrationInterface, QueryRunner } from "typeorm";
import { DropFunction } from "../../../couch2pg/refresh-view";

// DELETE FROM typeorm_migrations;


export class Functions1742735876865 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE OR REPLACE FUNCTION calculateAgeIn(output TEXT, dateOfBirth DATE, anotherDate DATE DEFAULT NULL, month TEXT DEFAULT NULL, year INT DEFAULT NULL)
                RETURNS INTEGER AS $$
                DECLARE
                    ref_date DATE;
                    diffInDays INT;
                    totalMonths INT;
                    years NUMERIC;
                BEGIN
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
        `);

        await queryRunner.query(`
            CREATE OR REPLACE FUNCTION generateRandomColors(numberOfColr BIGINT) RETURNS TEXT[] AS $$
                DECLARE
                    colors TEXT[] := '{}';  -- Initialisation correcte
                    i INT;
                    seed INT;
                BEGIN
                    FOR i IN 1..numberOfColr LOOP
                        seed := mod(i * 2654435761, 16777216);
                        colors := array_append(colors, '#' || lpad(to_hex(seed), 6, '0'));
                    END LOOP;
                    
                    RETURN colors;
                END;
                $$ LANGUAGE plpgsql;
        `);

        await queryRunner.query(`
            CREATE OR REPLACE FUNCTION ageWithFullLabel(date_of_birth DATE DEFAULT NULL, ageInDays BIGINT DEFAULT 0)
                RETURNS TEXT AS $$
                DECLARE
                    years INT;
                    remainingDays NUMERIC;
                    months INT;
                    days INT;
                    result TEXT;
                BEGIN
                    -- Calcul de l'âge en jours seulement si date_of_birth n'est pas NULL
                    IF date_of_birth IS NOT NULL THEN
                        ageInDays := calculateAgeIn('days', date_of_birth);
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
        `);

    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await this.dropFunction(queryRunner);
    }

    private async dropFunction(queryRunner: QueryRunner): Promise<void> {
        await DropFunction('calculateAgeIn(TEXT, DATE, DATE, TEXT, INT)', queryRunner);
        await DropFunction('generateRandomColors(BIGINT)', queryRunner);
        await DropFunction('ageWithFullLabel(BIGINT)', queryRunner);
    }

}


// -- Ensure that another_date is not greater than the current date (now)
// IF another_date > CURRENT_DATE THEN
//     another_date := CURRENT_DATE;
// END IF;
// CREATE OR REPLACE FUNCTION calculateAgeIn(output TEXT, birthDate DATE, month TEXT, year INT)
// RETURNS INTEGER AS $$
// DECLARE
//     age_in_years INTEGER;
//     age_in_months INTEGER;
//     age_in_days INTEGER;
//     another_date DATE;
//     year_diff INTEGER;
//     month_diff INTEGER;
//     days_diff INTEGER;
// BEGIN
//     -- Calculate the end of the month (last day of the given month) using DATE arithmetic
//     another_date := (
//         DATE_TRUNC('month', TO_DATE(year || '-' || month || '-01', 'YYYY-MM-DD')) + INTERVAL '1 month' - INTERVAL '1 microsecond'
//     )::DATE;

//     -- Calculate the difference in years, months, and days
//     year_diff := EXTRACT(YEAR FROM AGE(another_date, birthDate));
//     month_diff := EXTRACT(MONTH FROM AGE(another_date, birthDate));
//     days_diff := EXTRACT(DAY FROM AGE(another_date, birthDate));

//     -- Return the age based on the requested output
//     IF output = 'years' THEN
//         RETURN year_diff;
//     ELSIF output = 'months' THEN
//         RETURN year_diff * 12 + month_diff;
//     ELSIF output = 'days' THEN
//         -- Approximate days in a year and month (taking leap years into account)
//         RETURN (year_diff * 365 + FLOOR(year_diff / 4)) + (month_diff * 30) + days_diff;
//     ELSE
//         RAISE EXCEPTION 'Invalid output value. Use ''years'', ''months'', or ''days''.';
//     END IF;

// END;
// $$ LANGUAGE plpgsql;