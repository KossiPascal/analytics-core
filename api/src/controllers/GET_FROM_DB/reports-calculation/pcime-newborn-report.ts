import { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";
import { AppDataSource } from "../../../data_source";
import { DataSource } from "typeorm";
import { PcimneNewbornReport, getPcimneNewbornReportRepository } from "../../../entities/Reports";
import { PcimneData } from "../../../entities/_Pcimne-data";
import { NewbornData } from "../../../entities/_Newborn-data";
import { PcimneNewbornReportUtils, RecoCoustomQuery } from "../../../utils/Interfaces";
import { isTrue } from "../../../utils/functions";
import { DeathData } from "../../../entities/_Death-data";
import { RECOS_COUSTOM_QUERY } from "../../orgunit-query/org-units-coustom";


let Connection: DataSource = AppDataSource.manager.connection;

export async function PCIMNE_NEWBORN_REPORTS_CALCULATION(req: Request, res: Response, next: NextFunction): Promise<any> {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(201).json({ status: 201, data: 'Informations you provided are not valid' });
    }

    var { month, year } = req.body;
    const outPutData = await PCIMNE_NEWBORN_REPORTS_CALCULATION_DATA({ month, year });

    if (outPutData.SuccessCount === outPutData.recos_length || outPutData.ErrorsCount === outPutData.recos_length || (outPutData.ErrorsCount + outPutData.SuccessCount) === outPutData.recos_length) {
        outPutData.status = 200;
        // outPutData.data =  await Connection.query(`SELECT * FROM chws_reco_report WHERE month = $1 AND year = $2`, [month, year]);
        return res.status(200).json(outPutData);
    }
}

export async function PCIMNE_NEWBORN_REPORTS_CALCULATION_DATA({ month, year }: { month: string, year: number }): Promise<{ status: number, ErrorsCount: number, SuccessCount: number, data: any, recos_length: number }> {
    const _repoPecimne = await getPcimneNewbornReportRepository();

    const recos: RecoCoustomQuery[] = await RECOS_COUSTOM_QUERY();
    const outPutData: { status: number, ErrorsCount: number, SuccessCount: number, data: any, recos_length: number } = { status: 201, ErrorsCount: 0, SuccessCount: 0, data: null, recos_length: recos.length };

    const __pcimnes: any[] = await Connection.query(`SELECT * FROM pcimne_data WHERE month = $1 AND year = $2 AND age_in_months >=0 AND age_in_months < 60`, [month, year]);
    const __newborns: any[] = await Connection.query(`SELECT * FROM pcimne_data WHERE month = $1 AND year = $2 AND age_in_months >=0 AND age_in_months < 2`, [month, year]);
    const __deaths: any[] = await Connection.query(`SELECT * FROM death_data WHERE month = $1 AND year = $2 AND age_in_months >=0 AND age_in_months < 60`, [month, year]);


    for (const reco of recos) {
        try {
            const pcimnes: PcimneData[] = __pcimnes.filter(d => d.reco_id === reco.id);
            const newborns: NewbornData[] = __newborns.filter(d => d.reco_id === reco.id);
            const deaths: DeathData[] = __deaths.filter(d => d.reco_id === reco.id);

            const nbr_malaria_0_2_months_F = newborns.filter(p => p.sex === 'F' && p.has_malaria === true);
            const nbr_malaria_0_2_months_M = newborns.filter(p => p.sex === 'M' && p.has_malaria === true);
            const nbr_malaria_2_12_months_F = pcimnes.filter(p => p.sex === 'F' && p.has_malaria === true && p.age_in_months >= 2 && p.age_in_months < 12);
            const nbr_malaria_2_12_months_M = pcimnes.filter(p => p.sex === 'M' && p.has_malaria === true && p.age_in_months >= 2 && p.age_in_months < 12);
            const nbr_malaria_12_60_months_F = pcimnes.filter(p => p.sex === 'F' && p.has_malaria === true && p.age_in_months >= 12 && p.age_in_months < 60);
            const nbr_malaria_12_60_months_M = pcimnes.filter(p => p.sex === 'M' && p.has_malaria === true && p.age_in_months >= 12 && p.age_in_months < 60);
            const nbr_cough_pneumonia_0_2_months_F = newborns.filter(p => p.sex === 'F' && p.has_pneumonia === true);
            const nbr_cough_pneumonia_0_2_months_M = newborns.filter(p => p.sex === 'M' && p.has_pneumonia === true);
            const nbr_cough_pneumonia_2_12_months_F = pcimnes.filter(p => p.sex === 'F' && p.has_pneumonia === true && p.age_in_months >= 2 && p.age_in_months < 12);
            const nbr_cough_pneumonia_2_12_months_M = pcimnes.filter(p => p.sex === 'M' && p.has_pneumonia === true && p.age_in_months >= 2 && p.age_in_months < 12);
            const nbr_cough_pneumonia_12_60_months_F = pcimnes.filter(p => p.sex === 'F' && p.has_pneumonia === true && p.age_in_months >= 12 && p.age_in_months < 60);
            const nbr_cough_pneumonia_12_60_months_M = pcimnes.filter(p => p.sex === 'M' && p.has_pneumonia === true && p.age_in_months >= 12 && p.age_in_months < 60);
            const nbr_diarrhea_0_2_months_F = newborns.filter(p => p.sex === 'F' && p.has_diarrhea === true);
            const nbr_diarrhea_0_2_months_M = newborns.filter(p => p.sex === 'M' && p.has_diarrhea === true);
            const nbr_diarrhea_2_12_months_F = pcimnes.filter(p => p.sex === 'F' && p.has_diarrhea === true && p.age_in_months >= 2 && p.age_in_months < 12);
            const nbr_diarrhea_2_12_months_M = pcimnes.filter(p => p.sex === 'M' && p.has_diarrhea === true && p.age_in_months >= 2 && p.age_in_months < 12);
            const nbr_diarrhea_12_60_months_F = pcimnes.filter(p => p.sex === 'F' && p.has_diarrhea === true && p.age_in_months >= 12 && p.age_in_months < 60);
            const nbr_diarrhea_12_60_months_M = pcimnes.filter(p => p.sex === 'M' && p.has_diarrhea === true && p.age_in_months >= 12 && p.age_in_months < 60);
            const nbr_malnutrition_0_2_months_F = newborns.filter(p => p.sex === 'F' && p.has_malnutrition === true);
            const nbr_malnutrition_0_2_months_M = newborns.filter(p => p.sex === 'M' && p.has_malnutrition === true);
            const nbr_malnutrition_2_12_months_F = pcimnes.filter(p => p.sex === 'F' && p.has_malnutrition === true && p.age_in_months >= 2 && p.age_in_months < 12);
            const nbr_malnutrition_2_12_months_M = pcimnes.filter(p => p.sex === 'M' && p.has_malnutrition === true && p.age_in_months >= 2 && p.age_in_months < 12);
            const nbr_malnutrition_12_60_months_F = pcimnes.filter(p => p.sex === 'F' && p.has_malnutrition === true && p.age_in_months >= 12 && p.age_in_months < 60);
            const nbr_malnutrition_12_60_months_M = pcimnes.filter(p => p.sex === 'M' && p.has_malnutrition === true && p.age_in_months >= 12 && p.age_in_months < 60);
            const nbr_total_pecime = pcimnes.filter(p => p.sex != null && ['F', 'M'].includes(p.sex) && p.has_malaria === true || p.has_pneumonia === true || p.has_diarrhea === true || p.has_malnutrition === true);
            const nbr_total_newborn = newborns.filter(p => p.sex != null && ['F', 'M'].includes(p.sex) && p.has_malaria === true || p.has_pneumonia === true || p.has_diarrhea === true || p.has_malnutrition === true);

            const pcimnes_newborns: PcimneNewbornReportUtils[] = [
                {
                    index: 1,
                    indicator: 'Nombre de cas reçu',
                    nbr_malaria_0_2_months_F: nbr_malaria_0_2_months_F.length,
                    nbr_malaria_0_2_months_M: nbr_malaria_0_2_months_M.length,
                    nbr_malaria_2_12_months_F: nbr_malaria_2_12_months_F.length,
                    nbr_malaria_2_12_months_M: nbr_malaria_2_12_months_M.length,
                    nbr_malaria_12_60_months_F: nbr_malaria_12_60_months_F.length,
                    nbr_malaria_12_60_months_M: nbr_malaria_12_60_months_M.length,
                    nbr_cough_pneumonia_0_2_months_F: nbr_cough_pneumonia_0_2_months_F.length,
                    nbr_cough_pneumonia_0_2_months_M: nbr_cough_pneumonia_0_2_months_M.length,
                    nbr_cough_pneumonia_2_12_months_F: nbr_cough_pneumonia_2_12_months_F.length,
                    nbr_cough_pneumonia_2_12_months_M: nbr_cough_pneumonia_2_12_months_M.length,
                    nbr_cough_pneumonia_12_60_months_F: nbr_cough_pneumonia_12_60_months_F.length,
                    nbr_cough_pneumonia_12_60_months_M: nbr_cough_pneumonia_12_60_months_M.length,
                    nbr_diarrhea_0_2_months_F: nbr_diarrhea_0_2_months_F.length,
                    nbr_diarrhea_0_2_months_M: nbr_diarrhea_0_2_months_M.length,
                    nbr_diarrhea_2_12_months_F: nbr_diarrhea_2_12_months_F.length,
                    nbr_diarrhea_2_12_months_M: nbr_diarrhea_2_12_months_M.length,
                    nbr_diarrhea_12_60_months_F: nbr_diarrhea_12_60_months_F.length,
                    nbr_diarrhea_12_60_months_M: nbr_diarrhea_12_60_months_M.length,
                    nbr_malnutrition_0_2_months_F: nbr_malnutrition_0_2_months_F.length,
                    nbr_malnutrition_0_2_months_M: nbr_malnutrition_0_2_months_M.length,
                    nbr_malnutrition_2_12_months_F: nbr_malnutrition_2_12_months_F.length,
                    nbr_malnutrition_2_12_months_M: nbr_malnutrition_2_12_months_M.length,
                    nbr_malnutrition_12_60_months_F: nbr_malnutrition_12_60_months_F.length,
                    nbr_malnutrition_12_60_months_M: nbr_malnutrition_12_60_months_M.length,
                    nbr_total: nbr_total_pecime.length + nbr_total_newborn.length
                },
                {
                    index: 2,
                    indicator: 'Nombre de TDR effectué',
                    nbr_malaria_0_2_months_F: 0,
                    nbr_malaria_0_2_months_M: 0,
                    nbr_malaria_2_12_months_F: nbr_malaria_2_12_months_F.filter(d => isTrue(d.rdt_given)).length,
                    nbr_malaria_2_12_months_M: nbr_malaria_2_12_months_M.filter(d => isTrue(d.rdt_given)).length,
                    nbr_malaria_12_60_months_F: nbr_malaria_12_60_months_F.filter(d => isTrue(d.rdt_given)).length,
                    nbr_malaria_12_60_months_M: nbr_malaria_12_60_months_M.filter(d => isTrue(d.rdt_given)).length,
                    nbr_cough_pneumonia_0_2_months_F: 0,
                    nbr_cough_pneumonia_0_2_months_M: 0,
                    nbr_cough_pneumonia_2_12_months_F: nbr_cough_pneumonia_2_12_months_F.filter(d => isTrue(d.rdt_given)).length,
                    nbr_cough_pneumonia_2_12_months_M: nbr_cough_pneumonia_2_12_months_M.filter(d => isTrue(d.rdt_given)).length,
                    nbr_cough_pneumonia_12_60_months_F: nbr_cough_pneumonia_12_60_months_F.filter(d => isTrue(d.rdt_given)).length,
                    nbr_cough_pneumonia_12_60_months_M: nbr_cough_pneumonia_12_60_months_M.filter(d => isTrue(d.rdt_given)).length,
                    nbr_diarrhea_0_2_months_F: 0,
                    nbr_diarrhea_0_2_months_M: 0,
                    nbr_diarrhea_2_12_months_F: nbr_diarrhea_2_12_months_F.filter(d => isTrue(d.rdt_given)).length,
                    nbr_diarrhea_2_12_months_M: nbr_diarrhea_2_12_months_M.filter(d => isTrue(d.rdt_given)).length,
                    nbr_diarrhea_12_60_months_F: nbr_diarrhea_12_60_months_F.filter(d => isTrue(d.rdt_given)).length,
                    nbr_diarrhea_12_60_months_M: nbr_diarrhea_12_60_months_M.filter(d => isTrue(d.rdt_given)).length,
                    nbr_malnutrition_0_2_months_F: 0,
                    nbr_malnutrition_0_2_months_M: 0,
                    nbr_malnutrition_2_12_months_F: nbr_malnutrition_2_12_months_F.filter(d => isTrue(d.rdt_given)).length,
                    nbr_malnutrition_2_12_months_M: nbr_malnutrition_2_12_months_M.filter(d => isTrue(d.rdt_given)).length,
                    nbr_malnutrition_12_60_months_F: nbr_malnutrition_12_60_months_F.filter(d => isTrue(d.rdt_given)).length,
                    nbr_malnutrition_12_60_months_M: nbr_malnutrition_12_60_months_M.filter(d => isTrue(d.rdt_given)).length,
                    nbr_total: nbr_total_pecime.filter(d => isTrue(d.rdt_given)).length + 0,

                },
                {
                    index: 3,
                    indicator: 'Nombre de TDR positif',
                    nbr_malaria_0_2_months_F: 0,
                    nbr_malaria_0_2_months_M: 0,
                    nbr_malaria_2_12_months_F: nbr_malaria_2_12_months_F.filter(d => d.rdt_result === 'positive').length,
                    nbr_malaria_2_12_months_M: nbr_malaria_2_12_months_M.filter(d => d.rdt_result === 'positive').length,
                    nbr_malaria_12_60_months_F: nbr_malaria_12_60_months_F.filter(d => d.rdt_result === 'positive').length,
                    nbr_malaria_12_60_months_M: nbr_malaria_12_60_months_M.filter(d => d.rdt_result === 'positive').length,
                    nbr_cough_pneumonia_0_2_months_F: 0,
                    nbr_cough_pneumonia_0_2_months_M: 0,
                    nbr_cough_pneumonia_2_12_months_F: nbr_cough_pneumonia_2_12_months_F.filter(d => d.rdt_result === 'positive').length,
                    nbr_cough_pneumonia_2_12_months_M: nbr_cough_pneumonia_2_12_months_M.filter(d => d.rdt_result === 'positive').length,
                    nbr_cough_pneumonia_12_60_months_F: nbr_cough_pneumonia_12_60_months_F.filter(d => d.rdt_result === 'positive').length,
                    nbr_cough_pneumonia_12_60_months_M: nbr_cough_pneumonia_12_60_months_M.filter(d => d.rdt_result === 'positive').length,
                    nbr_diarrhea_0_2_months_F: 0,
                    nbr_diarrhea_0_2_months_M: 0,
                    nbr_diarrhea_2_12_months_F: nbr_diarrhea_2_12_months_F.filter(d => d.rdt_result === 'positive').length,
                    nbr_diarrhea_2_12_months_M: nbr_diarrhea_2_12_months_M.filter(d => d.rdt_result === 'positive').length,
                    nbr_diarrhea_12_60_months_F: nbr_diarrhea_12_60_months_F.filter(d => d.rdt_result === 'positive').length,
                    nbr_diarrhea_12_60_months_M: nbr_diarrhea_12_60_months_M.filter(d => d.rdt_result === 'positive').length,
                    nbr_malnutrition_0_2_months_F: 0,
                    nbr_malnutrition_0_2_months_M: 0,
                    nbr_malnutrition_2_12_months_F: nbr_malnutrition_2_12_months_F.filter(d => d.rdt_result === 'positive').length,
                    nbr_malnutrition_2_12_months_M: nbr_malnutrition_2_12_months_M.filter(d => d.rdt_result === 'positive').length,
                    nbr_malnutrition_12_60_months_F: nbr_malnutrition_12_60_months_F.filter(d => d.rdt_result === 'positive').length,
                    nbr_malnutrition_12_60_months_M: nbr_malnutrition_12_60_months_M.filter(d => d.rdt_result === 'positive').length,
                    nbr_total: nbr_total_pecime.filter(d => d.rdt_result === 'positive').length + 0
                },
                {
                    index: 4,
                    indicator: 'Nombre de cas traités avec CTA',
                    nbr_malaria_0_2_months_F: 0,
                    nbr_malaria_0_2_months_M: 0,
                    nbr_malaria_2_12_months_F: nbr_malaria_2_12_months_F.filter(d => d.cta !== null && parseInt(`${d.cta}`) > 0).length,
                    nbr_malaria_2_12_months_M: nbr_malaria_2_12_months_M.filter(d => d.cta !== null && parseInt(`${d.cta}`) > 0).length,
                    nbr_malaria_12_60_months_F: nbr_malaria_12_60_months_F.filter(d => d.cta !== null && parseInt(`${d.cta}`) > 0).length,
                    nbr_malaria_12_60_months_M: nbr_malaria_12_60_months_M.filter(d => d.cta !== null && parseInt(`${d.cta}`) > 0).length,
                    nbr_cough_pneumonia_0_2_months_F: 0,
                    nbr_cough_pneumonia_0_2_months_M: 0,
                    nbr_cough_pneumonia_2_12_months_F: nbr_cough_pneumonia_2_12_months_F.filter(d => d.cta !== null && parseInt(`${d.cta}`) > 0).length,
                    nbr_cough_pneumonia_2_12_months_M: nbr_cough_pneumonia_2_12_months_M.filter(d => d.cta !== null && parseInt(`${d.cta}`) > 0).length,
                    nbr_cough_pneumonia_12_60_months_F: nbr_cough_pneumonia_12_60_months_F.filter(d => d.cta !== null && parseInt(`${d.cta}`) > 0).length,
                    nbr_cough_pneumonia_12_60_months_M: nbr_cough_pneumonia_12_60_months_M.filter(d => d.cta !== null && parseInt(`${d.cta}`) > 0).length,
                    nbr_diarrhea_0_2_months_F: 0,
                    nbr_diarrhea_0_2_months_M: 0,
                    nbr_diarrhea_2_12_months_F: nbr_diarrhea_2_12_months_F.filter(d => d.cta !== null && parseInt(`${d.cta}`) > 0).length,
                    nbr_diarrhea_2_12_months_M: nbr_diarrhea_2_12_months_M.filter(d => d.cta !== null && parseInt(`${d.cta}`) > 0).length,
                    nbr_diarrhea_12_60_months_F: nbr_diarrhea_12_60_months_F.filter(d => d.cta !== null && parseInt(`${d.cta}`) > 0).length,
                    nbr_diarrhea_12_60_months_M: nbr_diarrhea_12_60_months_M.filter(d => d.cta !== null && parseInt(`${d.cta}`) > 0).length,
                    nbr_malnutrition_0_2_months_F: 0,
                    nbr_malnutrition_0_2_months_M: 0,
                    nbr_malnutrition_2_12_months_F: nbr_malnutrition_2_12_months_F.filter(d => d.cta !== null && parseInt(`${d.cta}`) > 0).length,
                    nbr_malnutrition_2_12_months_M: nbr_malnutrition_2_12_months_M.filter(d => d.cta !== null && parseInt(`${d.cta}`) > 0).length,
                    nbr_malnutrition_12_60_months_F: nbr_malnutrition_12_60_months_F.filter(d => d.cta !== null && parseInt(`${d.cta}`) > 0).length,
                    nbr_malnutrition_12_60_months_M: nbr_malnutrition_12_60_months_M.filter(d => d.cta !== null && parseInt(`${d.cta}`) > 0).length,
                    nbr_total: nbr_total_pecime.filter(d => d.cta !== null && parseInt(`${d.cta}`) > 0).length + 0,
                },
                {
                    index: 5,
                    indicator: 'Nombre de cas traités avec Amoxicilline',
                    nbr_malaria_0_2_months_F: 0,
                    nbr_malaria_0_2_months_M: 0,
                    nbr_malaria_2_12_months_F: nbr_malaria_2_12_months_F.filter(d => {
                        const dt1 = d.amoxicillin_250mg !== null && parseInt(`${d.amoxicillin_250mg}`) > 0;
                        const dt2 = d.amoxicillin_500mg !== null && parseInt(`${d.amoxicillin_500mg}`) > 0;
                        return dt1 === true || dt2 === true;
                    }).length,
                    nbr_malaria_2_12_months_M: nbr_malaria_2_12_months_M.filter(d => {
                        const dt1 = d.amoxicillin_250mg !== null && parseInt(`${d.amoxicillin_250mg}`) > 0;
                        const dt2 = d.amoxicillin_500mg !== null && parseInt(`${d.amoxicillin_500mg}`) > 0;
                        return dt1 === true || dt2 === true;
                    }).length,
                    nbr_malaria_12_60_months_F: nbr_malaria_12_60_months_F.filter(d => {
                        const dt1 = d.amoxicillin_250mg !== null && parseInt(`${d.amoxicillin_250mg}`) > 0;
                        const dt2 = d.amoxicillin_500mg !== null && parseInt(`${d.amoxicillin_500mg}`) > 0;
                        return dt1 === true || dt2 === true;
                    }).length,
                    nbr_malaria_12_60_months_M: nbr_malaria_12_60_months_M.filter(d => {
                        const dt1 = d.amoxicillin_250mg !== null && parseInt(`${d.amoxicillin_250mg}`) > 0;
                        const dt2 = d.amoxicillin_500mg !== null && parseInt(`${d.amoxicillin_500mg}`) > 0;
                        return dt1 === true || dt2 === true;
                    }).length,
                    nbr_cough_pneumonia_0_2_months_F: 0,
                    nbr_cough_pneumonia_0_2_months_M: 0,
                    nbr_cough_pneumonia_2_12_months_F: nbr_cough_pneumonia_2_12_months_F.filter(d => {
                        const dt1 = d.amoxicillin_250mg !== null && parseInt(`${d.amoxicillin_250mg}`) > 0;
                        const dt2 = d.amoxicillin_500mg !== null && parseInt(`${d.amoxicillin_500mg}`) > 0;
                        return dt1 === true || dt2 === true;
                    }).length,
                    nbr_cough_pneumonia_2_12_months_M: nbr_cough_pneumonia_2_12_months_M.filter(d => {
                        const dt1 = d.amoxicillin_250mg !== null && parseInt(`${d.amoxicillin_250mg}`) > 0;
                        const dt2 = d.amoxicillin_500mg !== null && parseInt(`${d.amoxicillin_500mg}`) > 0;
                        return dt1 === true || dt2 === true;
                    }).length,
                    nbr_cough_pneumonia_12_60_months_F: nbr_cough_pneumonia_12_60_months_F.filter(d => {
                        const dt1 = d.amoxicillin_250mg !== null && parseInt(`${d.amoxicillin_250mg}`) > 0;
                        const dt2 = d.amoxicillin_500mg !== null && parseInt(`${d.amoxicillin_500mg}`) > 0;
                        return dt1 === true || dt2 === true;
                    }).length,
                    nbr_cough_pneumonia_12_60_months_M: nbr_cough_pneumonia_12_60_months_M.filter(d => {
                        const dt1 = d.amoxicillin_250mg !== null && parseInt(`${d.amoxicillin_250mg}`) > 0;
                        const dt2 = d.amoxicillin_500mg !== null && parseInt(`${d.amoxicillin_500mg}`) > 0;
                        return dt1 === true || dt2 === true;
                    }).length,
                    nbr_diarrhea_0_2_months_F: 0,
                    nbr_diarrhea_0_2_months_M: 0,
                    nbr_diarrhea_2_12_months_F: nbr_diarrhea_2_12_months_F.filter(d => {
                        const dt1 = d.amoxicillin_250mg !== null && parseInt(`${d.amoxicillin_250mg}`) > 0;
                        const dt2 = d.amoxicillin_500mg !== null && parseInt(`${d.amoxicillin_500mg}`) > 0;
                        return dt1 === true || dt2 === true;
                    }).length,
                    nbr_diarrhea_2_12_months_M: nbr_diarrhea_2_12_months_M.filter(d => {
                        const dt1 = d.amoxicillin_250mg !== null && parseInt(`${d.amoxicillin_250mg}`) > 0;
                        const dt2 = d.amoxicillin_500mg !== null && parseInt(`${d.amoxicillin_500mg}`) > 0;
                        return dt1 === true || dt2 === true;
                    }).length,
                    nbr_diarrhea_12_60_months_F: nbr_diarrhea_12_60_months_F.filter(d => {
                        const dt1 = d.amoxicillin_250mg !== null && parseInt(`${d.amoxicillin_250mg}`) > 0;
                        const dt2 = d.amoxicillin_500mg !== null && parseInt(`${d.amoxicillin_500mg}`) > 0;
                        return dt1 === true || dt2 === true;
                    }).length,
                    nbr_diarrhea_12_60_months_M: nbr_diarrhea_12_60_months_M.filter(d => {
                        const dt1 = d.amoxicillin_250mg !== null && parseInt(`${d.amoxicillin_250mg}`) > 0;
                        const dt2 = d.amoxicillin_500mg !== null && parseInt(`${d.amoxicillin_500mg}`) > 0;
                        return dt1 === true || dt2 === true;
                    }).length,
                    nbr_malnutrition_0_2_months_F: 0,
                    nbr_malnutrition_0_2_months_M: 0,
                    nbr_malnutrition_2_12_months_F: nbr_malnutrition_2_12_months_F.filter(d => {
                        const dt1 = d.amoxicillin_250mg !== null && parseInt(`${d.amoxicillin_250mg}`) > 0;
                        const dt2 = d.amoxicillin_500mg !== null && parseInt(`${d.amoxicillin_500mg}`) > 0;
                        return dt1 === true || dt2 === true;
                    }).length,
                    nbr_malnutrition_2_12_months_M: nbr_malnutrition_2_12_months_M.filter(d => {
                        const dt1 = d.amoxicillin_250mg !== null && parseInt(`${d.amoxicillin_250mg}`) > 0;
                        const dt2 = d.amoxicillin_500mg !== null && parseInt(`${d.amoxicillin_500mg}`) > 0;
                        return dt1 === true || dt2 === true;
                    }).length,
                    nbr_malnutrition_12_60_months_F: nbr_malnutrition_12_60_months_F.filter(d => {
                        const dt1 = d.amoxicillin_250mg !== null && parseInt(`${d.amoxicillin_250mg}`) > 0;
                        const dt2 = d.amoxicillin_500mg !== null && parseInt(`${d.amoxicillin_500mg}`) > 0;
                        return dt1 === true || dt2 === true;
                    }).length,
                    nbr_malnutrition_12_60_months_M: nbr_malnutrition_12_60_months_M.filter(d => {
                        const dt1 = d.amoxicillin_250mg !== null && parseInt(`${d.amoxicillin_250mg}`) > 0;
                        const dt2 = d.amoxicillin_500mg !== null && parseInt(`${d.amoxicillin_500mg}`) > 0;
                        return dt1 === true || dt2 === true;
                    }).length,
                    nbr_total: nbr_total_pecime.filter(d => {
                        const dt1 = d.amoxicillin_250mg !== null && parseInt(`${d.amoxicillin_250mg}`) > 0;
                        const dt2 = d.amoxicillin_500mg !== null && parseInt(`${d.amoxicillin_500mg}`) > 0;
                        return dt1 === true || dt2 === true;
                    }).length + 0,
                },
                {
                    index: 6,
                    indicator: 'Nombre de cas traités avec SRO et ZINC',
                    nbr_malaria_0_2_months_F: 0,
                    nbr_malaria_0_2_months_M: 0,
                    nbr_malaria_2_12_months_F: nbr_malaria_2_12_months_F.filter(d => d.ors_zinc !== null && parseInt(`${d.ors_zinc}`) > 0).length,
                    nbr_malaria_2_12_months_M: nbr_malaria_2_12_months_M.filter(d => d.ors_zinc !== null && parseInt(`${d.ors_zinc}`) > 0).length,
                    nbr_malaria_12_60_months_F: nbr_malaria_12_60_months_F.filter(d => d.ors_zinc !== null && parseInt(`${d.ors_zinc}`) > 0).length,
                    nbr_malaria_12_60_months_M: nbr_malaria_12_60_months_M.filter(d => d.ors_zinc !== null && parseInt(`${d.ors_zinc}`) > 0).length,
                    nbr_cough_pneumonia_0_2_months_F: 0,
                    nbr_cough_pneumonia_0_2_months_M: 0,
                    nbr_cough_pneumonia_2_12_months_F: nbr_cough_pneumonia_2_12_months_F.filter(d => d.ors_zinc !== null && parseInt(`${d.ors_zinc}`) > 0).length,
                    nbr_cough_pneumonia_2_12_months_M: nbr_cough_pneumonia_2_12_months_M.filter(d => d.ors_zinc !== null && parseInt(`${d.ors_zinc}`) > 0).length,
                    nbr_cough_pneumonia_12_60_months_F: nbr_cough_pneumonia_12_60_months_F.filter(d => d.ors_zinc !== null && parseInt(`${d.ors_zinc}`) > 0).length,
                    nbr_cough_pneumonia_12_60_months_M: nbr_cough_pneumonia_12_60_months_M.filter(d => d.ors_zinc !== null && parseInt(`${d.ors_zinc}`) > 0).length,
                    nbr_diarrhea_0_2_months_F: 0,
                    nbr_diarrhea_0_2_months_M: 0,
                    nbr_diarrhea_2_12_months_F: nbr_diarrhea_2_12_months_F.filter(d => d.ors_zinc !== null && parseInt(`${d.ors_zinc}`) > 0).length,
                    nbr_diarrhea_2_12_months_M: nbr_diarrhea_2_12_months_M.filter(d => d.ors_zinc !== null && parseInt(`${d.ors_zinc}`) > 0).length,
                    nbr_diarrhea_12_60_months_F: nbr_diarrhea_12_60_months_F.filter(d => d.ors_zinc !== null && parseInt(`${d.ors_zinc}`) > 0).length,
                    nbr_diarrhea_12_60_months_M: nbr_diarrhea_12_60_months_M.filter(d => d.ors_zinc !== null && parseInt(`${d.ors_zinc}`) > 0).length,
                    nbr_malnutrition_0_2_months_F: 0,
                    nbr_malnutrition_0_2_months_M: 0,
                    nbr_malnutrition_2_12_months_F: nbr_malnutrition_2_12_months_F.filter(d => d.ors_zinc !== null && parseInt(`${d.ors_zinc}`) > 0).length,
                    nbr_malnutrition_2_12_months_M: nbr_malnutrition_2_12_months_M.filter(d => d.ors_zinc !== null && parseInt(`${d.ors_zinc}`) > 0).length,
                    nbr_malnutrition_12_60_months_F: nbr_malnutrition_12_60_months_F.filter(d => d.ors_zinc !== null && parseInt(`${d.ors_zinc}`) > 0).length,
                    nbr_malnutrition_12_60_months_M: nbr_malnutrition_12_60_months_M.filter(d => d.ors_zinc !== null && parseInt(`${d.ors_zinc}`) > 0).length,
                    nbr_total: nbr_total_pecime.filter(d => d.ors_zinc !== null && parseInt(`${d.ors_zinc}`) > 0).length + 0,
                },
                {
                    index: 7,
                    indicator: 'Nombre de cas traités avec  Paracetamol',
                    nbr_malaria_0_2_months_F: 0,
                    nbr_malaria_0_2_months_M: 0,
                    nbr_malaria_2_12_months_F: nbr_malaria_2_12_months_F.filter(d => {
                        const dt1 = d.paracetamol_250mg !== null && parseInt(`${d.paracetamol_250mg}`) > 0;
                        const dt2 = d.paracetamol_500mg !== null && parseInt(`${d.paracetamol_500mg}`) > 0;
                        return dt1 === true || dt2 === true;
                    }).length,
                    nbr_malaria_2_12_months_M: nbr_malaria_2_12_months_M.filter(d => {
                        const dt1 = d.paracetamol_250mg !== null && parseInt(`${d.paracetamol_250mg}`) > 0;
                        const dt2 = d.paracetamol_500mg !== null && parseInt(`${d.paracetamol_500mg}`) > 0;
                        return dt1 === true || dt2 === true;
                    }).length,
                    nbr_malaria_12_60_months_F: nbr_malaria_12_60_months_F.filter(d => {
                        const dt1 = d.paracetamol_250mg !== null && parseInt(`${d.paracetamol_250mg}`) > 0;
                        const dt2 = d.paracetamol_500mg !== null && parseInt(`${d.paracetamol_500mg}`) > 0;
                        return dt1 === true || dt2 === true;
                    }).length,
                    nbr_malaria_12_60_months_M: nbr_malaria_12_60_months_M.filter(d => {
                        const dt1 = d.paracetamol_250mg !== null && parseInt(`${d.paracetamol_250mg}`) > 0;
                        const dt2 = d.paracetamol_500mg !== null && parseInt(`${d.paracetamol_500mg}`) > 0;
                        return dt1 === true || dt2 === true;
                    }).length,
                    nbr_cough_pneumonia_0_2_months_F: 0,
                    nbr_cough_pneumonia_0_2_months_M: 0,
                    nbr_cough_pneumonia_2_12_months_F: nbr_cough_pneumonia_2_12_months_F.filter(d => {
                        const dt1 = d.paracetamol_250mg !== null && parseInt(`${d.paracetamol_250mg}`) > 0;
                        const dt2 = d.paracetamol_500mg !== null && parseInt(`${d.paracetamol_500mg}`) > 0;
                        return dt1 === true || dt2 === true;
                    }).length,
                    nbr_cough_pneumonia_2_12_months_M: nbr_cough_pneumonia_2_12_months_M.filter(d => {
                        const dt1 = d.paracetamol_250mg !== null && parseInt(`${d.paracetamol_250mg}`) > 0;
                        const dt2 = d.paracetamol_500mg !== null && parseInt(`${d.paracetamol_500mg}`) > 0;
                        return dt1 === true || dt2 === true;
                    }).length,
                    nbr_cough_pneumonia_12_60_months_F: nbr_cough_pneumonia_12_60_months_F.filter(d => {
                        const dt1 = d.paracetamol_250mg !== null && parseInt(`${d.paracetamol_250mg}`) > 0;
                        const dt2 = d.paracetamol_500mg !== null && parseInt(`${d.paracetamol_500mg}`) > 0;
                        return dt1 === true || dt2 === true;
                    }).length,
                    nbr_cough_pneumonia_12_60_months_M: nbr_cough_pneumonia_12_60_months_M.filter(d => {
                        const dt1 = d.paracetamol_250mg !== null && parseInt(`${d.paracetamol_250mg}`) > 0;
                        const dt2 = d.paracetamol_500mg !== null && parseInt(`${d.paracetamol_500mg}`) > 0;
                        return dt1 === true || dt2 === true;
                    }).length,
                    nbr_diarrhea_0_2_months_F: 0,
                    nbr_diarrhea_0_2_months_M: 0,
                    nbr_diarrhea_2_12_months_F: nbr_diarrhea_2_12_months_F.filter(d => {
                        const dt1 = d.paracetamol_250mg !== null && parseInt(`${d.paracetamol_250mg}`) > 0;
                        const dt2 = d.paracetamol_500mg !== null && parseInt(`${d.paracetamol_500mg}`) > 0;
                        return dt1 === true || dt2 === true;
                    }).length,
                    nbr_diarrhea_2_12_months_M: nbr_diarrhea_2_12_months_M.filter(d => {
                        const dt1 = d.paracetamol_250mg !== null && parseInt(`${d.paracetamol_250mg}`) > 0;
                        const dt2 = d.paracetamol_500mg !== null && parseInt(`${d.paracetamol_500mg}`) > 0;
                        return dt1 === true || dt2 === true;
                    }).length,
                    nbr_diarrhea_12_60_months_F: nbr_diarrhea_12_60_months_F.filter(d => {
                        const dt1 = d.paracetamol_250mg !== null && parseInt(`${d.paracetamol_250mg}`) > 0;
                        const dt2 = d.paracetamol_500mg !== null && parseInt(`${d.paracetamol_500mg}`) > 0;
                        return dt1 === true || dt2 === true;
                    }).length,
                    nbr_diarrhea_12_60_months_M: nbr_diarrhea_12_60_months_M.filter(d => {
                        const dt1 = d.paracetamol_250mg !== null && parseInt(`${d.paracetamol_250mg}`) > 0;
                        const dt2 = d.paracetamol_500mg !== null && parseInt(`${d.paracetamol_500mg}`) > 0;
                        return dt1 === true || dt2 === true;
                    }).length,
                    nbr_malnutrition_0_2_months_F: 0,
                    nbr_malnutrition_0_2_months_M: 0,
                    nbr_malnutrition_2_12_months_F: nbr_malnutrition_2_12_months_F.filter(d => {
                        const dt1 = d.paracetamol_250mg !== null && parseInt(`${d.paracetamol_250mg}`) > 0;
                        const dt2 = d.paracetamol_500mg !== null && parseInt(`${d.paracetamol_500mg}`) > 0;
                        return dt1 === true || dt2 === true;
                    }).length,
                    nbr_malnutrition_2_12_months_M: nbr_malnutrition_2_12_months_M.filter(d => {
                        const dt1 = d.paracetamol_250mg !== null && parseInt(`${d.paracetamol_250mg}`) > 0;
                        const dt2 = d.paracetamol_500mg !== null && parseInt(`${d.paracetamol_500mg}`) > 0;
                        return dt1 === true || dt2 === true;
                    }).length,
                    nbr_malnutrition_12_60_months_F: nbr_malnutrition_12_60_months_F.filter(d => {
                        const dt1 = d.paracetamol_250mg !== null && parseInt(`${d.paracetamol_250mg}`) > 0;
                        const dt2 = d.paracetamol_500mg !== null && parseInt(`${d.paracetamol_500mg}`) > 0;
                        return dt1 === true || dt2 === true;
                    }).length,
                    nbr_malnutrition_12_60_months_M: nbr_malnutrition_12_60_months_M.filter(d => {
                        const dt1 = d.paracetamol_250mg !== null && parseInt(`${d.paracetamol_250mg}`) > 0;
                        const dt2 = d.paracetamol_500mg !== null && parseInt(`${d.paracetamol_500mg}`) > 0;
                        return dt1 === true || dt2 === true;
                    }).length,
                    nbr_total: nbr_total_pecime.filter(d => {
                        const dt1 = d.paracetamol_250mg !== null && parseInt(`${d.paracetamol_250mg}`) > 0;
                        const dt2 = d.paracetamol_500mg !== null && parseInt(`${d.paracetamol_500mg}`) > 0;
                        return dt1 === true || dt2 === true;
                    }).length + 0,
                },
                {
                    index: 8,
                    indicator: 'Nombre de cas traités dans les 24 H',
                    nbr_malaria_0_2_months_F: nbr_malaria_0_2_months_F.filter(d => d.promptitude !== null && parseInt(`${d.promptitude}`) === 1).length,
                    nbr_malaria_0_2_months_M: nbr_malaria_0_2_months_M.filter(d => d.promptitude !== null && parseInt(`${d.promptitude}`) === 1).length,
                    nbr_malaria_2_12_months_F: nbr_malaria_2_12_months_F.filter(d => d.promptitude !== null && parseInt(`${d.promptitude}`) === 1).length,
                    nbr_malaria_2_12_months_M: nbr_malaria_2_12_months_M.filter(d => d.promptitude !== null && parseInt(`${d.promptitude}`) === 1).length,
                    nbr_malaria_12_60_months_F: nbr_malaria_12_60_months_F.filter(d => d.promptitude !== null && parseInt(`${d.promptitude}`) === 1).length,
                    nbr_malaria_12_60_months_M: nbr_malaria_12_60_months_M.filter(d => d.promptitude !== null && parseInt(`${d.promptitude}`) === 1).length,
                    nbr_cough_pneumonia_0_2_months_F: nbr_cough_pneumonia_0_2_months_F.filter(d => d.promptitude !== null && parseInt(`${d.promptitude}`) === 1).length,
                    nbr_cough_pneumonia_0_2_months_M: nbr_cough_pneumonia_0_2_months_M.filter(d => d.promptitude !== null && parseInt(`${d.promptitude}`) === 1).length,
                    nbr_cough_pneumonia_2_12_months_F: nbr_cough_pneumonia_2_12_months_F.filter(d => d.promptitude !== null && parseInt(`${d.promptitude}`) === 1).length,
                    nbr_cough_pneumonia_2_12_months_M: nbr_cough_pneumonia_2_12_months_M.filter(d => d.promptitude !== null && parseInt(`${d.promptitude}`) === 1).length,
                    nbr_cough_pneumonia_12_60_months_F: nbr_cough_pneumonia_12_60_months_F.filter(d => d.promptitude !== null && parseInt(`${d.promptitude}`) === 1).length,
                    nbr_cough_pneumonia_12_60_months_M: nbr_cough_pneumonia_12_60_months_M.filter(d => d.promptitude !== null && parseInt(`${d.promptitude}`) === 1).length,
                    nbr_diarrhea_0_2_months_F: nbr_diarrhea_0_2_months_F.filter(d => d.promptitude !== null && parseInt(`${d.promptitude}`) === 1).length,
                    nbr_diarrhea_0_2_months_M: nbr_diarrhea_0_2_months_M.filter(d => d.promptitude !== null && parseInt(`${d.promptitude}`) === 1).length,
                    nbr_diarrhea_2_12_months_F: nbr_diarrhea_2_12_months_F.filter(d => d.promptitude !== null && parseInt(`${d.promptitude}`) === 1).length,
                    nbr_diarrhea_2_12_months_M: nbr_diarrhea_2_12_months_M.filter(d => d.promptitude !== null && parseInt(`${d.promptitude}`) === 1).length,
                    nbr_diarrhea_12_60_months_F: nbr_diarrhea_12_60_months_F.filter(d => d.promptitude !== null && parseInt(`${d.promptitude}`) === 1).length,
                    nbr_diarrhea_12_60_months_M: nbr_diarrhea_12_60_months_M.filter(d => d.promptitude !== null && parseInt(`${d.promptitude}`) === 1).length,
                    nbr_malnutrition_0_2_months_F: nbr_malnutrition_0_2_months_F.filter(d => d.promptitude !== null && parseInt(`${d.promptitude}`) === 1).length,
                    nbr_malnutrition_0_2_months_M: nbr_malnutrition_0_2_months_M.filter(d => d.promptitude !== null && parseInt(`${d.promptitude}`) === 1).length,
                    nbr_malnutrition_2_12_months_F: nbr_malnutrition_2_12_months_F.filter(d => d.promptitude !== null && parseInt(`${d.promptitude}`) === 1).length,
                    nbr_malnutrition_2_12_months_M: nbr_malnutrition_2_12_months_M.filter(d => d.promptitude !== null && parseInt(`${d.promptitude}`) === 1).length,
                    nbr_malnutrition_12_60_months_F: nbr_malnutrition_12_60_months_F.filter(d => d.promptitude !== null && parseInt(`${d.promptitude}`) === 1).length,
                    nbr_malnutrition_12_60_months_M: nbr_malnutrition_12_60_months_M.filter(d => d.promptitude !== null && parseInt(`${d.promptitude}`) === 1).length,
                    nbr_total: nbr_total_pecime.filter(d => d.promptitude !== null && parseInt(`${d.promptitude}`) === 1).length + nbr_total_newborn.filter(d => d.promptitude !== null && parseInt(`${d.promptitude}`) === 1).length
                },
                {
                    index: 9,
                    indicator: 'Nombre de visites de suivi réalisées',
                    nbr_malaria_0_2_months_F: nbr_malaria_0_2_months_F.filter(d => d.form === 'newborn_followup').length,
                    nbr_malaria_0_2_months_M: nbr_malaria_0_2_months_M.filter(d => d.form === 'newborn_followup').length,
                    nbr_malaria_2_12_months_F: nbr_malaria_2_12_months_F.filter(d => d.form === 'pcimne_followup').length,
                    nbr_malaria_2_12_months_M: nbr_malaria_2_12_months_M.filter(d => d.form === 'pcimne_followup').length,
                    nbr_malaria_12_60_months_F: nbr_malaria_12_60_months_F.filter(d => d.form === 'pcimne_followup').length,
                    nbr_malaria_12_60_months_M: nbr_malaria_12_60_months_M.filter(d => d.form === 'pcimne_followup').length,
                    nbr_cough_pneumonia_0_2_months_F: nbr_cough_pneumonia_0_2_months_F.filter(d => d.form === 'newborn_followup').length,
                    nbr_cough_pneumonia_0_2_months_M: nbr_cough_pneumonia_0_2_months_M.filter(d => d.form === 'newborn_followup').length,
                    nbr_cough_pneumonia_2_12_months_F: nbr_cough_pneumonia_2_12_months_F.filter(d => d.form === 'pcimne_followup').length,
                    nbr_cough_pneumonia_2_12_months_M: nbr_cough_pneumonia_2_12_months_M.filter(d => d.form === 'pcimne_followup').length,
                    nbr_cough_pneumonia_12_60_months_F: nbr_cough_pneumonia_12_60_months_F.filter(d => d.form === 'pcimne_followup').length,
                    nbr_cough_pneumonia_12_60_months_M: nbr_cough_pneumonia_12_60_months_M.filter(d => d.form === 'pcimne_followup').length,
                    nbr_diarrhea_0_2_months_F: nbr_diarrhea_0_2_months_F.filter(d => d.form === 'newborn_followup').length,
                    nbr_diarrhea_0_2_months_M: nbr_diarrhea_0_2_months_M.filter(d => d.form === 'newborn_followup').length,
                    nbr_diarrhea_2_12_months_F: nbr_diarrhea_2_12_months_F.filter(d => d.form === 'pcimne_followup').length,
                    nbr_diarrhea_2_12_months_M: nbr_diarrhea_2_12_months_M.filter(d => d.form === 'pcimne_followup').length,
                    nbr_diarrhea_12_60_months_F: nbr_diarrhea_12_60_months_F.filter(d => d.form === 'pcimne_followup').length,
                    nbr_diarrhea_12_60_months_M: nbr_diarrhea_12_60_months_M.filter(d => d.form === 'pcimne_followup').length,
                    nbr_malnutrition_0_2_months_F: nbr_malnutrition_0_2_months_F.filter(d => d.form === 'newborn_followup').length,
                    nbr_malnutrition_0_2_months_M: nbr_malnutrition_0_2_months_M.filter(d => d.form === 'newborn_followup').length,
                    nbr_malnutrition_2_12_months_F: nbr_malnutrition_2_12_months_F.filter(d => d.form === 'pcimne_followup').length,
                    nbr_malnutrition_2_12_months_M: nbr_malnutrition_2_12_months_M.filter(d => d.form === 'pcimne_followup').length,
                    nbr_malnutrition_12_60_months_F: nbr_malnutrition_12_60_months_F.filter(d => d.form === 'pcimne_followup').length,
                    nbr_malnutrition_12_60_months_M: nbr_malnutrition_12_60_months_M.filter(d => d.form === 'pcimne_followup').length,
                    nbr_total: nbr_total_pecime.filter(d => d.form === 'pcimne_followup').length + nbr_total_newborn.filter(d => d.form === 'newborn_followup').length
                },
                {
                    index: 10,
                    indicator: 'Nombre de traitements de pré-référence (RECTOCAPS)',
                    nbr_malaria_0_2_months_F: nbr_malaria_0_2_months_F.filter(d => d.has_pre_reference_treatments === true).length,
                    nbr_malaria_0_2_months_M: nbr_malaria_0_2_months_M.filter(d => d.has_pre_reference_treatments === true).length,
                    nbr_malaria_2_12_months_F: nbr_malaria_2_12_months_F.filter(d => d.has_pre_reference_treatments === true).length,
                    nbr_malaria_2_12_months_M: nbr_malaria_2_12_months_M.filter(d => d.has_pre_reference_treatments === true).length,
                    nbr_malaria_12_60_months_F: nbr_malaria_12_60_months_F.filter(d => d.has_pre_reference_treatments === true).length,
                    nbr_malaria_12_60_months_M: nbr_malaria_12_60_months_M.filter(d => d.has_pre_reference_treatments === true).length,
                    nbr_cough_pneumonia_0_2_months_F: nbr_cough_pneumonia_0_2_months_F.filter(d => d.has_pre_reference_treatments === true).length,
                    nbr_cough_pneumonia_0_2_months_M: nbr_cough_pneumonia_0_2_months_M.filter(d => d.has_pre_reference_treatments === true).length,
                    nbr_cough_pneumonia_2_12_months_F: nbr_cough_pneumonia_2_12_months_F.filter(d => d.has_pre_reference_treatments === true).length,
                    nbr_cough_pneumonia_2_12_months_M: nbr_cough_pneumonia_2_12_months_M.filter(d => d.has_pre_reference_treatments === true).length,
                    nbr_cough_pneumonia_12_60_months_F: nbr_cough_pneumonia_12_60_months_F.filter(d => d.has_pre_reference_treatments === true).length,
                    nbr_cough_pneumonia_12_60_months_M: nbr_cough_pneumonia_12_60_months_M.filter(d => d.has_pre_reference_treatments === true).length,
                    nbr_diarrhea_0_2_months_F: nbr_diarrhea_0_2_months_F.filter(d => d.has_pre_reference_treatments === true).length,
                    nbr_diarrhea_0_2_months_M: nbr_diarrhea_0_2_months_M.filter(d => d.has_pre_reference_treatments === true).length,
                    nbr_diarrhea_2_12_months_F: nbr_diarrhea_2_12_months_F.filter(d => d.has_pre_reference_treatments === true).length,
                    nbr_diarrhea_2_12_months_M: nbr_diarrhea_2_12_months_M.filter(d => d.has_pre_reference_treatments === true).length,
                    nbr_diarrhea_12_60_months_F: nbr_diarrhea_12_60_months_F.filter(d => d.has_pre_reference_treatments === true).length,
                    nbr_diarrhea_12_60_months_M: nbr_diarrhea_12_60_months_M.filter(d => d.has_pre_reference_treatments === true).length,
                    nbr_malnutrition_0_2_months_F: nbr_malnutrition_0_2_months_F.filter(d => d.has_pre_reference_treatments === true).length,
                    nbr_malnutrition_0_2_months_M: nbr_malnutrition_0_2_months_M.filter(d => d.has_pre_reference_treatments === true).length,
                    nbr_malnutrition_2_12_months_F: nbr_malnutrition_2_12_months_F.filter(d => d.has_pre_reference_treatments === true).length,
                    nbr_malnutrition_2_12_months_M: nbr_malnutrition_2_12_months_M.filter(d => d.has_pre_reference_treatments === true).length,
                    nbr_malnutrition_12_60_months_F: nbr_malnutrition_12_60_months_F.filter(d => d.has_pre_reference_treatments === true).length,
                    nbr_malnutrition_12_60_months_M: nbr_malnutrition_12_60_months_M.filter(d => d.has_pre_reference_treatments === true).length,
                    nbr_total: nbr_total_pecime.filter(d => d.has_pre_reference_treatments === true).length + nbr_total_newborn.filter(d => d.has_pre_reference_treatments === true).length,
                },
                {
                    index: 11,
                    indicator: 'Nombre de cas référés',
                    nbr_malaria_0_2_months_F: nbr_malaria_0_2_months_F.filter(d => d.is_referred === true).length,
                    nbr_malaria_0_2_months_M: nbr_malaria_0_2_months_M.filter(d => d.is_referred === true).length,
                    nbr_malaria_2_12_months_F: nbr_malaria_2_12_months_F.filter(d => d.is_referred === true).length,
                    nbr_malaria_2_12_months_M: nbr_malaria_2_12_months_M.filter(d => d.is_referred === true).length,
                    nbr_malaria_12_60_months_F: nbr_malaria_12_60_months_F.filter(d => d.is_referred === true).length,
                    nbr_malaria_12_60_months_M: nbr_malaria_12_60_months_M.filter(d => d.is_referred === true).length,
                    nbr_cough_pneumonia_0_2_months_F: nbr_cough_pneumonia_0_2_months_F.filter(d => d.is_referred === true).length,
                    nbr_cough_pneumonia_0_2_months_M: nbr_cough_pneumonia_0_2_months_M.filter(d => d.is_referred === true).length,
                    nbr_cough_pneumonia_2_12_months_F: nbr_cough_pneumonia_2_12_months_F.filter(d => d.is_referred === true).length,
                    nbr_cough_pneumonia_2_12_months_M: nbr_cough_pneumonia_2_12_months_M.filter(d => d.is_referred === true).length,
                    nbr_cough_pneumonia_12_60_months_F: nbr_cough_pneumonia_12_60_months_F.filter(d => d.is_referred === true).length,
                    nbr_cough_pneumonia_12_60_months_M: nbr_cough_pneumonia_12_60_months_M.filter(d => d.is_referred === true).length,
                    nbr_diarrhea_0_2_months_F: nbr_diarrhea_0_2_months_F.filter(d => d.is_referred === true).length,
                    nbr_diarrhea_0_2_months_M: nbr_diarrhea_0_2_months_M.filter(d => d.is_referred === true).length,
                    nbr_diarrhea_2_12_months_F: nbr_diarrhea_2_12_months_F.filter(d => d.is_referred === true).length,
                    nbr_diarrhea_2_12_months_M: nbr_diarrhea_2_12_months_M.filter(d => d.is_referred === true).length,
                    nbr_diarrhea_12_60_months_F: nbr_diarrhea_12_60_months_F.filter(d => d.is_referred === true).length,
                    nbr_diarrhea_12_60_months_M: nbr_diarrhea_12_60_months_M.filter(d => d.is_referred === true).length,
                    nbr_malnutrition_0_2_months_F: nbr_malnutrition_0_2_months_F.filter(d => d.is_referred === true).length,
                    nbr_malnutrition_0_2_months_M: nbr_malnutrition_0_2_months_M.filter(d => d.is_referred === true).length,
                    nbr_malnutrition_2_12_months_F: nbr_malnutrition_2_12_months_F.filter(d => d.is_referred === true).length,
                    nbr_malnutrition_2_12_months_M: nbr_malnutrition_2_12_months_M.filter(d => d.is_referred === true).length,
                    nbr_malnutrition_12_60_months_F: nbr_malnutrition_12_60_months_F.filter(d => d.is_referred === true).length,
                    nbr_malnutrition_12_60_months_M: nbr_malnutrition_12_60_months_M.filter(d => d.is_referred === true).length,
                    nbr_total: nbr_total_pecime.filter(d => d.is_referred === true).length + nbr_total_newborn.filter(d => d.is_referred === true).length
                },
                {
                    index: 12,
                    indicator: 'Nombre de cas de malnutritions detectées',
                    nbr_malaria_0_2_months_F: nbr_malaria_0_2_months_F.filter(d => d.has_malnutrition === true).length,
                    nbr_malaria_0_2_months_M: nbr_malaria_0_2_months_M.filter(d => d.has_malnutrition === true).length,
                    nbr_malaria_2_12_months_F: nbr_malaria_2_12_months_F.filter(d => d.has_malnutrition === true).length,
                    nbr_malaria_2_12_months_M: nbr_malaria_2_12_months_M.filter(d => d.has_malnutrition === true).length,
                    nbr_malaria_12_60_months_F: nbr_malaria_12_60_months_F.filter(d => d.has_malnutrition === true).length,
                    nbr_malaria_12_60_months_M: nbr_malaria_12_60_months_M.filter(d => d.has_malnutrition === true).length,
                    nbr_cough_pneumonia_0_2_months_F: nbr_cough_pneumonia_0_2_months_F.filter(d => d.has_malnutrition === true).length,
                    nbr_cough_pneumonia_0_2_months_M: nbr_cough_pneumonia_0_2_months_M.filter(d => d.has_malnutrition === true).length,
                    nbr_cough_pneumonia_2_12_months_F: nbr_cough_pneumonia_2_12_months_F.filter(d => d.has_malnutrition === true).length,
                    nbr_cough_pneumonia_2_12_months_M: nbr_cough_pneumonia_2_12_months_M.filter(d => d.has_malnutrition === true).length,
                    nbr_cough_pneumonia_12_60_months_F: nbr_cough_pneumonia_12_60_months_F.filter(d => d.has_malnutrition === true).length,
                    nbr_cough_pneumonia_12_60_months_M: nbr_cough_pneumonia_12_60_months_M.filter(d => d.has_malnutrition === true).length,
                    nbr_diarrhea_0_2_months_F: nbr_diarrhea_0_2_months_F.filter(d => d.has_malnutrition === true).length,
                    nbr_diarrhea_0_2_months_M: nbr_diarrhea_0_2_months_M.filter(d => d.has_malnutrition === true).length,
                    nbr_diarrhea_2_12_months_F: nbr_diarrhea_2_12_months_F.filter(d => d.has_malnutrition === true).length,
                    nbr_diarrhea_2_12_months_M: nbr_diarrhea_2_12_months_M.filter(d => d.has_malnutrition === true).length,
                    nbr_diarrhea_12_60_months_F: nbr_diarrhea_12_60_months_F.filter(d => d.has_malnutrition === true).length,
                    nbr_diarrhea_12_60_months_M: nbr_diarrhea_12_60_months_M.filter(d => d.has_malnutrition === true).length,
                    nbr_malnutrition_0_2_months_F: nbr_malnutrition_0_2_months_F.filter(d => d.has_malnutrition === true).length,
                    nbr_malnutrition_0_2_months_M: nbr_malnutrition_0_2_months_M.filter(d => d.has_malnutrition === true).length,
                    nbr_malnutrition_2_12_months_F: nbr_malnutrition_2_12_months_F.filter(d => d.has_malnutrition === true).length,
                    nbr_malnutrition_2_12_months_M: nbr_malnutrition_2_12_months_M.filter(d => d.has_malnutrition === true).length,
                    nbr_malnutrition_12_60_months_F: nbr_malnutrition_12_60_months_F.filter(d => d.has_malnutrition === true).length,
                    nbr_malnutrition_12_60_months_M: nbr_malnutrition_12_60_months_M.filter(d => d.has_malnutrition === true).length,
                    nbr_total: nbr_total_pecime.filter(d => d.has_malnutrition === true).length + nbr_total_newborn.filter(d => d.has_malnutrition === true).length
                },
                {
                    index: 13,
                    indicator: 'Nombre de cas de toux detectés',
                    nbr_malaria_0_2_months_F: nbr_malaria_0_2_months_F.filter(d => d.has_cough_cold === true).length,
                    nbr_malaria_0_2_months_M: nbr_malaria_0_2_months_M.filter(d => d.has_cough_cold === true).length,
                    nbr_malaria_2_12_months_F: nbr_malaria_2_12_months_F.filter(d => d.has_cough_cold === true).length,
                    nbr_malaria_2_12_months_M: nbr_malaria_2_12_months_M.filter(d => d.has_cough_cold === true).length,
                    nbr_malaria_12_60_months_F: nbr_malaria_12_60_months_F.filter(d => d.has_cough_cold === true).length,
                    nbr_malaria_12_60_months_M: nbr_malaria_12_60_months_M.filter(d => d.has_cough_cold === true).length,
                    nbr_cough_pneumonia_0_2_months_F: nbr_cough_pneumonia_0_2_months_F.filter(d => d.has_cough_cold === true).length,
                    nbr_cough_pneumonia_0_2_months_M: nbr_cough_pneumonia_0_2_months_M.filter(d => d.has_cough_cold === true).length,
                    nbr_cough_pneumonia_2_12_months_F: nbr_cough_pneumonia_2_12_months_F.filter(d => d.has_cough_cold === true).length,
                    nbr_cough_pneumonia_2_12_months_M: nbr_cough_pneumonia_2_12_months_M.filter(d => d.has_cough_cold === true).length,
                    nbr_cough_pneumonia_12_60_months_F: nbr_cough_pneumonia_12_60_months_F.filter(d => d.has_cough_cold === true).length,
                    nbr_cough_pneumonia_12_60_months_M: nbr_cough_pneumonia_12_60_months_M.filter(d => d.has_cough_cold === true).length,
                    nbr_diarrhea_0_2_months_F: nbr_diarrhea_0_2_months_F.filter(d => d.has_cough_cold === true).length,
                    nbr_diarrhea_0_2_months_M: nbr_diarrhea_0_2_months_M.filter(d => d.has_cough_cold === true).length,
                    nbr_diarrhea_2_12_months_F: nbr_diarrhea_2_12_months_F.filter(d => d.has_cough_cold === true).length,
                    nbr_diarrhea_2_12_months_M: nbr_diarrhea_2_12_months_M.filter(d => d.has_cough_cold === true).length,
                    nbr_diarrhea_12_60_months_F: nbr_diarrhea_12_60_months_F.filter(d => d.has_cough_cold === true).length,
                    nbr_diarrhea_12_60_months_M: nbr_diarrhea_12_60_months_M.filter(d => d.has_cough_cold === true).length,
                    nbr_malnutrition_0_2_months_F: nbr_malnutrition_0_2_months_F.filter(d => d.has_cough_cold === true).length,
                    nbr_malnutrition_0_2_months_M: nbr_malnutrition_0_2_months_M.filter(d => d.has_cough_cold === true).length,
                    nbr_malnutrition_2_12_months_F: nbr_malnutrition_2_12_months_F.filter(d => d.has_cough_cold === true).length,
                    nbr_malnutrition_2_12_months_M: nbr_malnutrition_2_12_months_M.filter(d => d.has_cough_cold === true).length,
                    nbr_malnutrition_12_60_months_F: nbr_malnutrition_12_60_months_F.filter(d => d.has_cough_cold === true).length,
                    nbr_malnutrition_12_60_months_M: nbr_malnutrition_12_60_months_M.filter(d => d.has_cough_cold === true).length,
                    nbr_total: nbr_total_pecime.filter(d => d.has_cough_cold === true).length + nbr_total_newborn.filter(d => d.has_cough_cold === true).length
                },
                {
                    index: 14,
                    indicator: 'Nombre de contre références reçues',
                    nbr_malaria_0_2_months_F: nbr_malaria_0_2_months_F.filter(d => d.coupon_available === true).length,
                    nbr_malaria_0_2_months_M: nbr_malaria_0_2_months_M.filter(d => d.coupon_available === true).length,
                    nbr_malaria_2_12_months_F: nbr_malaria_2_12_months_F.filter(d => d.coupon_available === true).length,
                    nbr_malaria_2_12_months_M: nbr_malaria_2_12_months_M.filter(d => d.coupon_available === true).length,
                    nbr_malaria_12_60_months_F: nbr_malaria_12_60_months_F.filter(d => d.coupon_available === true).length,
                    nbr_malaria_12_60_months_M: nbr_malaria_12_60_months_M.filter(d => d.coupon_available === true).length,
                    nbr_cough_pneumonia_0_2_months_F: nbr_cough_pneumonia_0_2_months_F.filter(d => d.coupon_available === true).length,
                    nbr_cough_pneumonia_0_2_months_M: nbr_cough_pneumonia_0_2_months_M.filter(d => d.coupon_available === true).length,
                    nbr_cough_pneumonia_2_12_months_F: nbr_cough_pneumonia_2_12_months_F.filter(d => d.coupon_available === true).length,
                    nbr_cough_pneumonia_2_12_months_M: nbr_cough_pneumonia_2_12_months_M.filter(d => d.coupon_available === true).length,
                    nbr_cough_pneumonia_12_60_months_F: nbr_cough_pneumonia_12_60_months_F.filter(d => d.coupon_available === true).length,
                    nbr_cough_pneumonia_12_60_months_M: nbr_cough_pneumonia_12_60_months_M.filter(d => d.coupon_available === true).length,
                    nbr_diarrhea_0_2_months_F: nbr_diarrhea_0_2_months_F.filter(d => d.coupon_available === true).length,
                    nbr_diarrhea_0_2_months_M: nbr_diarrhea_0_2_months_M.filter(d => d.coupon_available === true).length,
                    nbr_diarrhea_2_12_months_F: nbr_diarrhea_2_12_months_F.filter(d => d.coupon_available === true).length,
                    nbr_diarrhea_2_12_months_M: nbr_diarrhea_2_12_months_M.filter(d => d.coupon_available === true).length,
                    nbr_diarrhea_12_60_months_F: nbr_diarrhea_12_60_months_F.filter(d => d.coupon_available === true).length,
                    nbr_diarrhea_12_60_months_M: nbr_diarrhea_12_60_months_M.filter(d => d.coupon_available === true).length,
                    nbr_malnutrition_0_2_months_F: nbr_malnutrition_0_2_months_F.filter(d => d.coupon_available === true).length,
                    nbr_malnutrition_0_2_months_M: nbr_malnutrition_0_2_months_M.filter(d => d.coupon_available === true).length,
                    nbr_malnutrition_2_12_months_F: nbr_malnutrition_2_12_months_F.filter(d => d.coupon_available === true).length,
                    nbr_malnutrition_2_12_months_M: nbr_malnutrition_2_12_months_M.filter(d => d.coupon_available === true).length,
                    nbr_malnutrition_12_60_months_F: nbr_malnutrition_12_60_months_F.filter(d => d.coupon_available === true).length,
                    nbr_malnutrition_12_60_months_M: nbr_malnutrition_12_60_months_M.filter(d => d.coupon_available === true).length,
                    nbr_total: nbr_total_pecime.filter(d => d.coupon_available === true).length + nbr_total_newborn.filter(d => d.coupon_available === true).length
                },
                {
                    index: 15,
                    indicator: 'Nombre de décès enregistrés',
                    nbr_malaria_0_2_months_F: deaths.filter(d => d.sex === 'F' && d.age_in_months >= 0 && d.age_in_months < 2 && d.has_malaria === true).length,
                    nbr_malaria_0_2_months_M: deaths.filter(d => d.sex === 'M' && d.age_in_months >= 0 && d.age_in_months < 2 && d.has_malaria === true).length,
                    nbr_malaria_2_12_months_F: deaths.filter(d => d.sex === 'F' && d.age_in_months >= 2 && d.age_in_months < 12 && d.has_malaria === true).length,
                    nbr_malaria_2_12_months_M: deaths.filter(d => d.sex === 'M' && d.age_in_months >= 2 && d.age_in_months < 12 && d.has_malaria === true).length,
                    nbr_malaria_12_60_months_F: deaths.filter(d => d.sex === 'F' && d.age_in_months >= 12 && d.age_in_months < 60 && d.has_malaria === true).length,
                    nbr_malaria_12_60_months_M: deaths.filter(d => d.sex === 'M' && d.age_in_months >= 12 && d.age_in_months < 60 && d.has_malaria === true).length,
                    nbr_cough_pneumonia_0_2_months_F: deaths.filter(d => d.sex === 'F' && d.age_in_months >= 0 && d.age_in_months < 2 && d.has_pneumonia === true).length,
                    nbr_cough_pneumonia_0_2_months_M: deaths.filter(d => d.sex === 'M' && d.age_in_months >= 0 && d.age_in_months < 2 && d.has_pneumonia === true).length,
                    nbr_cough_pneumonia_2_12_months_F: deaths.filter(d => d.sex === 'F' && d.age_in_months >= 2 && d.age_in_months < 12 && d.has_pneumonia === true).length,
                    nbr_cough_pneumonia_2_12_months_M: deaths.filter(d => d.sex === 'M' && d.age_in_months >= 2 && d.age_in_months < 12 && d.has_pneumonia === true).length,
                    nbr_cough_pneumonia_12_60_months_F: deaths.filter(d => d.sex === 'F' && d.age_in_months >= 12 && d.age_in_months < 60 && d.has_pneumonia === true).length,
                    nbr_cough_pneumonia_12_60_months_M: deaths.filter(d => d.sex === 'M' && d.age_in_months >= 12 && d.age_in_months < 60 && d.has_pneumonia === true).length,
                    nbr_diarrhea_0_2_months_F: deaths.filter(d => d.sex === 'F' && d.age_in_months >= 0 && d.age_in_months < 2 && d.has_diarrhea === true).length,
                    nbr_diarrhea_0_2_months_M: deaths.filter(d => d.sex === 'M' && d.age_in_months >= 0 && d.age_in_months < 2 && d.has_diarrhea === true).length,
                    nbr_diarrhea_2_12_months_F: deaths.filter(d => d.sex === 'F' && d.age_in_months >= 2 && d.age_in_months < 12 && d.has_diarrhea === true).length,
                    nbr_diarrhea_2_12_months_M: deaths.filter(d => d.sex === 'M' && d.age_in_months >= 2 && d.age_in_months < 12 && d.has_diarrhea === true).length,
                    nbr_diarrhea_12_60_months_F: deaths.filter(d => d.sex === 'F' && d.age_in_months >= 12 && d.age_in_months < 60 && d.has_diarrhea === true).length,
                    nbr_diarrhea_12_60_months_M: deaths.filter(d => d.sex === 'M' && d.age_in_months >= 12 && d.age_in_months < 60 && d.has_diarrhea === true).length,
                    nbr_malnutrition_0_2_months_F: deaths.filter(d => d.sex === 'F' && d.age_in_months >= 0 && d.age_in_months < 2 && d.has_malnutrition === true).length,
                    nbr_malnutrition_0_2_months_M: deaths.filter(d => d.sex === 'M' && d.age_in_months >= 0 && d.age_in_months < 2 && d.has_malnutrition === true).length,
                    nbr_malnutrition_2_12_months_F: deaths.filter(d => d.sex === 'F' && d.age_in_months >= 2 && d.age_in_months < 12 && d.has_malnutrition === true).length,
                    nbr_malnutrition_2_12_months_M: deaths.filter(d => d.sex === 'M' && d.age_in_months >= 2 && d.age_in_months < 12 && d.has_malnutrition === true).length,
                    nbr_malnutrition_12_60_months_F: deaths.filter(d => d.sex === 'F' && d.age_in_months >= 12 && d.age_in_months < 60 && d.has_malnutrition === true).length,
                    nbr_malnutrition_12_60_months_M: deaths.filter(d => d.sex === 'M' && d.age_in_months >= 12 && d.age_in_months < 60 && d.has_malnutrition === true).length,
                    nbr_total: deaths.filter(d => ['M', 'F'].includes(`${d.sex}`) && d.age_in_months >= 12 && d.age_in_months < 60 && (d.has_malaria === true || d.has_pneumonia === true || d.has_diarrhea === true || d.has_malnutrition === true)).length
                },
            ]

            const _pecimne = new PcimneNewbornReport();

            _pecimne.id = `${month}-${year}-${reco.id}`;
            _pecimne.month = month;
            _pecimne.year = year;
            _pecimne.pcimne_newborn = pcimnes_newborns;
            _pecimne.country = reco.country;
            _pecimne.region = reco.region;
            _pecimne.prefecture = reco.prefecture;
            _pecimne.commune = reco.commune;
            _pecimne.hospital = reco.hospital;
            _pecimne.district_quartier = reco.district_quartier;
            _pecimne.chw = reco.chw;
            _pecimne.village_secteur = reco.village_secteur;
            _pecimne.reco = { id: reco.id, name: reco.name, phone: reco.phone };

            await _repoPecimne.save(_pecimne);

            outPutData.SuccessCount += 1;

        } catch (err) {
            outPutData.ErrorsCount += 1;
        }
    }


    return outPutData;
}