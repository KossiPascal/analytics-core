import { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";
import { AppDataSource } from "../../../data_source";
import { DataSource } from "typeorm";
import { RecoCoustomQuery, RecoMegQuantityUtils } from "../../../utils/Interfaces";
import { RECOS_COUSTOM_QUERY } from "../../orgunit-query/org-units-coustom";
import { RecoMegData } from "../../../entities/_Meg-Reco-data";
import { getFirstAndLastDayOfMonth, getPreviousMonthYear } from "../../../utils/functions";
import { getRecoMegSituationReportRepository, RecoMegSituationReport } from "../../../entities/Reports";


let Connection: DataSource = AppDataSource.manager.connection;

export async function RECO_MEG_SITUATION_REPORTS_CALCULATION(req: Request, res: Response, next: NextFunction): Promise<any> {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(201).json({ status: 201, data: 'Informations you provided are not valid' });
    }
    var { month, year } = req.body;
    const outPutData = await RECO_MEG_SITUATION_REPORTS_CALCULATION_DATA({ month, year });

    if (outPutData.SuccessCount === outPutData.recos_length || outPutData.ErrorsCount === outPutData.recos_length || (outPutData.ErrorsCount + outPutData.SuccessCount) === outPutData.recos_length) {
        outPutData.status = 200;
        return res.status(200).json(outPutData);
    }
}

function isValidNum(data: any): boolean {
    try {
        return data !== null && data !== undefined && data > 0;
    } catch (error) { }
    return false;
}

function getSumTotal<T>(data: T[] | any[], field: string) {
    return data.filter(d => isValidNum(d[field]))
        .map(c => parseInt(`${c[field]}`))
        .reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0);
}

export async function RECO_MEG_SITUATION_REPORTS_CALCULATION_DATA({ month, year }: { month: string, year: number }): Promise<{ status: number, ErrorsCount: number, SuccessCount: number, data: any, recos_length: number }> {
    const _repo = await getRecoMegSituationReportRepository();
    const recos: RecoCoustomQuery[] = await RECOS_COUSTOM_QUERY();
    const outPutData: { status: number, ErrorsCount: number, SuccessCount: number, data: any, recos_length: number } = { status: 201, ErrorsCount: 0, SuccessCount: 0, data: null, recos_length: recos.length };


    const lmfDate = getPreviousMonthYear(month, year);

    const __currentMonthMegs: any[] = await Connection.query(`SELECT * FROM reco_meg_data WHERE month = $1 AND year = $2`, [month, year]);
    const __lastMonthMegs: any[] = await Connection.query(`SELECT * FROM reco_meg_data WHERE month = $1 AND year = $2`, [lmfDate.month, lmfDate.year]);

    const megLabels: { name: string, field: string }[] = [
        { name: 'Amoxicilline 250 mg', field: 'amoxicillin_250mg' },
        { name: 'Amoxicilline 500 mg', field: 'amoxicillin_500mg' },
        { name: 'Paracetamol 250 mg', field: 'paracetamol_250mg' },
        { name: 'Paracetamol 500 mg', field: 'paracetamol_500mg' },
        { name: 'Mebendazol 250 mg', field: 'mebendazol_250mg' },
        { name: 'Mebendazol 500 mg', field: 'mebendazol_500mg' },
        { name: 'SRO', field: 'ors' },
        { name: 'Zinc', field: 'zinc' },
        { name: 'CTA: AL (NN)', field: 'cta_nn' },
        { name: 'CTA: AL (PE)', field: 'cta_pe' },
        { name: 'CTA: AL (GE)', field: 'cta_ge' },
        { name: 'CTA: AL (AD)', field: 'cta_ad' },
        { name: 'TDR', field: 'tdr' },
        { name: 'Vitamin A', field: 'vitamin_a' },
        { name: 'Pillule COC', field: 'pill_coc' },
        { name: 'Pillule COP', field: 'pill_cop' },
        { name: 'Condoms', field: 'condoms' },
        { name: 'Dmpa SC (Sayana-press)', field: 'dmpa_sc' },
        { name: 'Implant', field: 'implant' },
    ];

    for (const reco of recos) {
        try {
            const monthMegs: RecoMegData[] = __currentMonthMegs.filter(a => a.reco_id === reco.id);
            const lastMonthMegs: RecoMegData[] = __lastMonthMegs.filter(a => a.reco_id === reco.id);

            const inventoryLastMonth: RecoMegData[] = lastMonthMegs.filter(a => a.meg_type === 'inventory');
            const inventoryCurrestMonth: RecoMegData[] = monthMegs.filter(a => a.meg_type === 'inventory');
            const stockMonth: RecoMegData[] = monthMegs.filter(a => a.meg_type === 'stock');
            const consumptionMonth: RecoMegData[] = monthMegs.filter(a => a.meg_type === 'consumption');
            const lossMonth: RecoMegData[] = monthMegs.filter(a => a.meg_type === 'loss');
            const damagedMonth: RecoMegData[] = monthMegs.filter(a => a.meg_type === 'damaged');
            const brokenMonth: RecoMegData[] = monthMegs.filter(a => a.meg_type === 'broken');
            const expiredMonth: RecoMegData[] = monthMegs.filter(a => a.meg_type === 'expired');            

            const meg_data: RecoMegQuantityUtils[] = [];

            for (let i = 0; i < megLabels.length; i++) {
                const d = megLabels[i];
                const month_beginning = getSumTotal(inventoryLastMonth, d.field);
                const month_received = getSumTotal(stockMonth, d.field);
                const month_consumption = getSumTotal(consumptionMonth, d.field);
                const month_loss = getSumTotal(lossMonth, d.field);
                const month_damaged = getSumTotal(damagedMonth, d.field);
                const month_broken = getSumTotal(brokenMonth, d.field);
                const month_expired = getSumTotal(expiredMonth, d.field);
                const month_inventory = getSumTotal(inventoryCurrestMonth, d.field);
                meg_data.push({
                    index: i + 1,
                    label: d.name,
                    month_beginning: month_beginning,
                    month_received: month_received,
                    month_total_start: month_beginning + month_received,
                    month_consumption: month_consumption,
                    month_theoreticaly: (month_beginning + month_received) - (month_consumption) - (month_loss + month_damaged + month_broken + month_expired),
                    month_inventory: month_inventory,
                    month_loss: month_loss,
                    month_damaged: month_damaged,
                    month_broken: month_broken,
                    month_expired: month_expired,
                });
            }

            const _meg = new RecoMegSituationReport();

            _meg.id = `${month}-${year}-${reco.id}`;
            _meg.month = month;
            _meg.year = year;

            _meg.meg_data = meg_data;

            _meg.country = reco.country;
            _meg.region = reco.region;
            _meg.prefecture = reco.prefecture;
            _meg.commune = reco.commune;
            _meg.hospital = reco.hospital;
            _meg.district_quartier = reco.district_quartier;
            _meg.chw = reco.chw;
            _meg.village_secteur = reco.village_secteur;
            _meg.reco = { id: reco.id, name: reco.name, phone: reco.phone };

            await _repo.save(_meg);
            outPutData.SuccessCount += 1;
        } catch (err) {
            outPutData.ErrorsCount += 1;
        }
    }

    return outPutData;
}



            // const allMegs: RecoMegData[] = __AllMegs.filter(a => a.reco_id === reco.id);
// const filterDate = getFirstAndLastDayOfMonth(year, month);
// const timestamp = parseInt(date_to_milisecond(filterDate.end_date, false));

// const __AllMegs: any[] = await Connection.query(`SELECT * FROM reco_meg_data WHERE reported_date <= $1`, [filterDate.end_date]);
// const __AllMegs: any[] = await Connection.query(`SELECT * FROM reco_meg_data WHERE reported_date_timestamp <= $1`, [timestamp]);
    

    // const monthStockAll: RecoMegData[] = allMegs.filter(a => a.meg_type === 'stock');
    // const consumptionAll: RecoMegData[] = allMegs.filter(a => a.meg_type === 'consumption');
    // const lossAll: RecoMegData[] = allMegs.filter(a => a.meg_type === 'loss');
    // const damagedAll: RecoMegData[] = allMegs.filter(a => a.meg_type === 'damaged');
    // const brokenAll: RecoMegData[] = allMegs.filter(a => a.meg_type === 'broken');
    // const expiredAll: RecoMegData[] = allMegs.filter(a => a.meg_type === 'expired');
    // const megsOutAll: RecoMegData[] = [...consumptionAll, ...lossAll, ...damagedAll, ...brokenAll, ...expiredAll];



// SELECT (SUM(stock) - SUM(COALESCE(consumption, 0)) - SUM(COALESCE(loss, 0))) as total FROM dt_table;
// const _monthMegs: any[] = __AllMegs.filter(a => a.month === month && a.year === year);