import { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";
import { Family, Patient } from "../../../entities/Org-units";
import { AppDataSource } from "../../../data_source";
import { DataSource } from "typeorm";
import { HouseholdRecapReport, getHouseholdRecapReportRepository } from "../../../entities/Reports";
import { getAgeIn } from "../../../utils/date-utils";
import { getFirstAndLastDayOfMonth } from "../../../utils/functions";
import { RecoCoustomQuery } from "../../../utils/Interfaces";
import { RECOS_COUSTOM_QUERY } from "../../orgunit-query/org-units-coustom";


let Connection: DataSource = AppDataSource.manager.connection;

export async function HOUSEHOLD_RECAPS_REPORTS_CALCULATION(req: Request, res: Response, next: NextFunction): Promise<any> {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(201).json({ status: 201, data: 'Informations you provided are not valid' });
    }
    
    var { month, year } = req.body;
    const outPutData = await HOUSEHOLD_RECAPS_REPORTS_CALCULATION_DATA({ month, year });

    if (outPutData.SuccessCount === outPutData.recos_length || outPutData.ErrorsCount === outPutData.recos_length || (outPutData.ErrorsCount + outPutData.SuccessCount) === outPutData.recos_length) {
        outPutData.status = 200;
        // outPutData.data =  await Connection.query(`SELECT * FROM chws_reco_report WHERE month = $1 AND year = $2`, [month, year]);
        return res.status(200).json(outPutData);
    }
}


export async function HOUSEHOLD_RECAPS_REPORTS_CALCULATION_DATA({ month, year }: { month: string, year: number }): Promise<{ status: number, ErrorsCount: number, SuccessCount: number, data: any, recos_length: number }> {
    const _repoReport = await getHouseholdRecapReportRepository();

    const recos: RecoCoustomQuery[] = await RECOS_COUSTOM_QUERY();
    const outPutData: { status: number, ErrorsCount: number, SuccessCount: number, data: any, recos_length: number } = { status: 201, ErrorsCount: 0, SuccessCount: 0, data: null, recos_length: recos.length };

    const filterDate = getFirstAndLastDayOfMonth(year, month);
    // const timestamp = parseInt(date_to_milisecond(filterDate.end_date, false));
    const __Allfamilies: any[] = await Connection.query(`SELECT * FROM family WHERE reported_date <= $1`,[filterDate.end_date]);
    const __AllPatients: any[] = await Connection.query(`SELECT * FROM patient WHERE reported_date <= $1`,[filterDate.end_date]);

    for (const reco of recos) {
        const Allfamilies:Family[] = __Allfamilies.filter(d => d.reco_id === reco.id);
        const AllPatients:Patient[] = __AllPatients.filter(d => d.reco_id === reco.id);
        
        try {
            for (const family of Allfamilies) {
            
                const _household = new HouseholdRecapReport();
    
                _household.id = `${month}-${year}-${reco.id}-${family.id}`;
                _household.index = 1;
                _household.month = month;
                _household.year = year;
    
                _household.household_code = family.external_id;
                _household.household_name = family.name;
                _household.total_household_members = AllPatients.filter(p => (p as any).family_id === family.id).length;
                _household.total_women_15_50_years = AllPatients.filter(p => {
                    const age_in_year = getAgeIn('years', p.date_of_birth, filterDate.end_date);
                    return (p as any).family_id === family.id && p.sex === 'F' && age_in_year >=15 && age_in_year < 50;
                }).length;
                _household.total_children_under_5_years = AllPatients.filter(p => {
                    const age_in_year = getAgeIn('years', p.date_of_birth, filterDate.end_date);
                    return (p as any).family_id === family.id && age_in_year >=0 && age_in_year < 5;
                }).length;
                _household.total_children_0_12_months = AllPatients.filter(p => {
                    const age_in_month = getAgeIn('months', p.date_of_birth, filterDate.end_date);
                    return (p as any).family_id === family.id && age_in_month >=0 && age_in_month < 12;
                }).length;
                _household.total_children_12_60_months = AllPatients.filter(p => {
                    const age_in_month = getAgeIn('months', p.date_of_birth, filterDate.end_date);
                    return (p as any).family_id === family.id && age_in_month >=12 && age_in_month < 60;
                }).length;
                _household.has_functional_latrine = family.household_has_working_latrine ?? false;
                _household.has_drinking_water_access = family.household_has_good_water_access ?? false;

                _household.country = reco.country;
                _household.region = reco.region;
                _household.prefecture = reco.prefecture;
                _household.commune = reco.commune;
                _household.hospital = reco.hospital;
                _household.district_quartier = reco.district_quartier;
                _household.chw = reco.chw;
                _household.village_secteur = reco.village_secteur;
                _household.reco = { id: reco.id, name: reco.name, phone: reco.phone };
    
                await _repoReport.save(_household);
            }
            outPutData.SuccessCount += 1;
        } catch (err) {
            outPutData.ErrorsCount += 1;
        }
    }
    return outPutData;
}