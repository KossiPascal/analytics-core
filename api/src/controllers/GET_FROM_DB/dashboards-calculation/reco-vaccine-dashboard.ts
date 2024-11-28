import { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";
import { AppDataSource } from "../../../data_source";
import { DataSource } from "typeorm";
import { RECOS_CUSTOM_QUERY } from "../../orgunit-query/org-units-custom";
import { getFirstAndLastDayOfMonth } from "../../../utils/functions";
import { RecoVaccinationDashboard, getRecoVaccinationDashboardRepository } from "../../../entities/dashboards";


let Conn: DataSource = AppDataSource.manager.connection;

export async function RECO_VACCINATION_DASHBOARD_CALCULATION(req: Request, res: Response, next: NextFunction): Promise<any> {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(201).json({ status: 201, data: 'Informations you provided are not valid' });
    }
    var { month, year } = req.body;
    const outPutData = await RECO_VACCINATION_DASHBOARD_CALCULATION_DATA({ month, year });

    // if (outPutData.SuccessCount === outPutData.recos_length || outPutData.ErrorsCount === outPutData.recos_length || (outPutData.ErrorsCount + outPutData.SuccessCount) === outPutData.recos_length) {
        outPutData.status = 200;
        return res.status(200).json(outPutData);
    // }
}

function isValidNum(data: any): boolean {
    try {
        return data !== null && data !== undefined && data > 0;
    } catch (error) { }
    return false;
}

function AgeInYearsMonthsDays(ageInDays: number) {
    const years = Math.floor(ageInDays / 365.25);
    const remainingDays = ageInDays % 365.25;
    const months = Math.floor(remainingDays / 30.4375);
    const days = Math.floor(remainingDays % 30.4375);

    if (years > 0) {
        const yrs = `${years} ${years > 1 ? 'ans' : 'an'}`;
        if (months > 0) {
            return `${yrs} ${months} ${months > 1 ? 'mois' : 'mois'}`;
        }
        if (days > 0) {
            return `${yrs} ${days} ${days > 1 ? 'jours' : 'jour'}`;
        }
        return yrs;
    } else if (months > 0) {
        const mths = `${months} ${months > 1 ? 'mois' : 'mois'}`;
        if (days > 0) {
            return `${mths} ${days} ${days > 1 ? 'jours' : 'jour'}`;
        }
        return mths;
    } else {
        return `${days} ${days > 1 ? 'jours' : 'jour'}`;
    }
}

function calculateAge(dateOfBirth: string) {
    const today = new Date();
    const dob = new Date(dateOfBirth);

    // Calculate age in days
    const diffInMilliseconds: number = today.getTime() - dob.getTime();
    const days = Math.floor(diffInMilliseconds / (1000 * 60 * 60 * 24));

    // Calculate age in months
    const years = today.getFullYear() - dob.getFullYear();
    const months = (today.getMonth() - dob.getMonth() + 12) % 12;
    const totalMonths = years * 12 + months;

    // Calculate age in years
    const yearsExact = years + (months / 12);

    return {
        in_days: days,
        in_months: totalMonths,
        in_years: Math.floor(yearsExact)
    };
}

export async function RECO_VACCINATION_DASHBOARD_CALCULATION_DATA({ month, year }: { month: string, year: number }): Promise<{ status: number, ErrorsCount: number, SuccessCount: number, data: any, recos_length: number }> {
    const outPutData: { status: number, ErrorsCount: number, SuccessCount: number, data: any, recos_length: number } = { status: 201, ErrorsCount: 0, SuccessCount: 0, data: null, recos_length: 0 };
    try {
        const _repoDashboard = await getRecoVaccinationDashboardRepository();
        const recos = await RECOS_CUSTOM_QUERY();
        outPutData.recos_length = recos.length;
        const filterDate = getFirstAndLastDayOfMonth(year, month);

        const query: string = `
                            SELECT 
                                f.id AS family_id, 
                                f.given_name AS family_name, 
                                f.name AS family_fullname, 
                                f.external_id AS family_code, 
                                p.name AS child_name, 
                                p.external_id AS child_code, 
                                p.sex AS child_sex, 
                                p.phone AS child_phone, 
                                p.date_of_birth as birth_date,
                                vd.*
                            FROM 
                                family f
                            INNER JOIN 
                                patient p ON f.id = p.family_id
                            INNER JOIN (
                                SELECT 
                                    patient_id, 
                                    MAX(reported_date_timestamp) AS last_vaccination_date
                                FROM 
                                    vaccination_data
                                WHERE
                                    reported_date <= $1
                                GROUP BY 
                                    patient_id
                            ) AS max_vd ON p.id = max_vd.patient_id
                            INNER JOIN 
                                vaccination_data vd ON p.id = vd.patient_id AND vd.reported_date_timestamp = max_vd.last_vaccination_date AND vd.reported_date <= $1
                            WHERE 
                                (p.date_of_death IS NULL OR p.date_of_death = '')
                                AND vd.has_all_vaccine_done IS DISTINCT FROM true
                            `;

        const __ChildrenVaccines: any[] = await Conn.query(query, [filterDate.end_date]);

        for (const reco of recos) {
            try {
                const ChildrenVaccines: any[] = __ChildrenVaccines.filter(v => {
                    const age = calculateAge(v.birth_date);
                    return v.reco_id === reco.id && age.in_days > 0 && age.in_months < 60 && (
                        (age.in_days > 0 && v.is_birth_vaccine_ok !== true) ||
                        (age.in_days >= 42 && (v.is_birth_vaccine_ok !== true || v.is_six_weeks_vaccine_ok !== true)) ||
                        (age.in_days >= 70 && (v.is_birth_vaccine_ok !== true || v.is_six_weeks_vaccine_ok !== true || v.is_ten_weeks_vaccine_ok !== true)) ||
                        (age.in_days >= 98 && (v.is_birth_vaccine_ok !== true || v.is_six_weeks_vaccine_ok !== true || v.is_ten_weeks_vaccine_ok !== true || v.is_forteen_weeks_vaccine_ok !== true)) ||
                        (age.in_months >= 9 && (v.is_birth_vaccine_ok !== true || v.is_six_weeks_vaccine_ok !== true || v.is_ten_weeks_vaccine_ok !== true || v.is_forteen_weeks_vaccine_ok !== true || v.is_nine_months_vaccine_ok !== true)) ||
                        (age.in_months >= 15 && (v.is_birth_vaccine_ok !== true || v.is_six_weeks_vaccine_ok !== true || v.is_ten_weeks_vaccine_ok !== true || v.is_forteen_weeks_vaccine_ok !== true || v.is_nine_months_vaccine_ok !== true || v.is_fifty_months_vaccine_ok !== true))
                    );
                });

                if (ChildrenVaccines.length > 0) {
                    const ALL_DATA: any = {};

                    for (const cvd of ChildrenVaccines) {
                        if (!(cvd.family_id in ALL_DATA)) {
                            ALL_DATA[cvd.family_id] = { family_id: cvd.family_id, family_name: cvd.family_name, family_fullname: cvd.family_fullname, family_code: cvd.family_code, data: [] };
                        }
                        const age = calculateAge(cvd.birth_date);
                        const child_age_str = AgeInYearsMonthsDays(parseFloat(`${age.in_days}`));
                        
                        ALL_DATA[cvd.family_id].data.push({
                            child_name: cvd.child_name,
                            child_code: cvd.child_code,
                            child_sex: cvd.child_sex,
                            child_phone: cvd.child_phone,
                            child_age_in_days: age.in_days,
                            child_age_in_months: age.in_months,
                            child_age_in_years: age.in_years,
                            child_age_str: child_age_str,
                            vaccine_BCG: cvd.vaccine_BCG === true,
                            vaccine_VPO_0: cvd.vaccine_VPO_0 === true,
                            vaccine_PENTA_1: cvd.vaccine_PENTA_1 === true,
                            vaccine_VPO_1: cvd.vaccine_VPO_1 === true,
                            vaccine_PENTA_2: cvd.vaccine_PENTA_2 === true,
                            vaccine_VPO_2: cvd.vaccine_VPO_2 === true,
                            vaccine_PENTA_3: cvd.vaccine_PENTA_3 === true,
                            vaccine_VPO_3: cvd.vaccine_VPO_3 === true,
                            vaccine_VPI_1: cvd.vaccine_VPI_1 === true,
                            vaccine_VAR_1: cvd.vaccine_VAR_1 === true,
                            vaccine_VAA: cvd.vaccine_VAA === true,
                            vaccine_VPI_2: cvd.vaccine_VPI_2 === true,
                            vaccine_MEN_A: cvd.vaccine_MEN_A === true,
                            vaccine_VAR_2: cvd.vaccine_VAR_2 === true,

                            no_BCG_reason: cvd.no_BCG_reason,
                            no_VPO_0_reason: cvd.no_VPO_0_reason,
                            no_PENTA_1_reason: cvd.no_PENTA_1_reason,
                            no_VPO_1_reason: cvd.no_VPO_1_reason,
                            no_PENTA_2_reason: cvd.no_PENTA_2_reason,
                            no_VPO_2_reason: cvd.no_VPO_2_reason,
                            no_PENTA_3_reason: cvd.no_PENTA_3_reason,
                            no_VPO_3_reason: cvd.no_VPO_3_reason,
                            no_VPI_1_reason: cvd.no_VPI_1_reason,
                            no_VAR_1_reason: cvd.no_VAR_1_reason,
                            no_VAA_reason: cvd.no_VAA_reason,
                            no_VPI_2_reason: cvd.no_VPI_2_reason,
                            no_MEN_A_reason: cvd.no_MEN_A_reason,
                            no_VAR_2_reason: cvd.no_VAR_2_reason,
                        });
                    }

                    const _vaccine = new RecoVaccinationDashboard();

                    _vaccine.id = `${month}-${year}-${reco.id}`;
                    _vaccine.month = month;
                    _vaccine.year = year;
                    _vaccine.children_vaccines = Object.values<any>(ALL_DATA);
                    _vaccine.country = reco.country;
                    _vaccine.region = reco.region;
                    _vaccine.prefecture = reco.prefecture;
                    _vaccine.commune = reco.commune;
                    _vaccine.hospital = reco.hospital;
                    _vaccine.district_quartier = reco.district_quartier;
                    // _vaccine.chw = reco.chw;
                    _vaccine.village_secteur = reco.village_secteur;
                    _vaccine.reco = { id: reco.id, name: reco.name, phone: reco.phone };

                    await _repoDashboard.save(_vaccine);
                    outPutData.SuccessCount += 1;
                }
            } catch (err) {
                console.log(err);
                outPutData.ErrorsCount += 1;
            }
        }
    } catch (err) {
        console.log(err);
        outPutData.ErrorsCount += 1;
    }
    return outPutData;
}