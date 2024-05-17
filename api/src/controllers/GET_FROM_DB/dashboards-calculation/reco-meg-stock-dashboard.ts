import { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";
import { AppDataSource } from "../../../data_source";
import { DataSource } from "typeorm";
import { RecoCoustomQuery, RecoMegDashboardUtils } from "../../../utils/Interfaces";
import { RECOS_COUSTOM_QUERY } from "../../orgunit-query/org-units-coustom";
import { RecoMegData } from "../../../entities/_Meg-Reco-data";
import { RecoMegDashboard, getRecoMegDashboardRepository } from "../../../entities/dashboards";
import { getFirstAndLastDayOfMonth } from "../../../utils/functions";


let Connection: DataSource = AppDataSource.manager.connection;

export async function RECO_MEG_STOCK_DASHBOARD_CALCULATION(req: Request, res: Response, next: NextFunction): Promise<any> {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(201).json({ status: 201, data: 'Informations you provided are not valid' });
    }
    var { month, year } = req.body;
    const outPutData = await RECO_MEG_STOCK_DASHBOARD_CALCULATION_DATA({ month, year });

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

export async function RECO_MEG_STOCK_DASHBOARD_CALCULATION_DATA({ month, year }: { month: string, year: number }): Promise<{ status: number, ErrorsCount: number, SuccessCount: number, data: any, recos_length: number }> {
    const _repoDashboard = await getRecoMegDashboardRepository();
    const recos: RecoCoustomQuery[] = await RECOS_COUSTOM_QUERY();
    const outPutData: { status: number, ErrorsCount: number, SuccessCount: number, data: any, recos_length: number } = { status: 201, ErrorsCount: 0, SuccessCount: 0, data: null, recos_length: recos.length };

    const filterDate = getFirstAndLastDayOfMonth(year, month);
    // const timestamp = parseInt(date_to_milisecond(filterDate.end_date, false));

    const __AllMegs: any[] = await Connection.query(`SELECT * FROM reco_meg_data WHERE reported_date <= $1`, [filterDate.end_date]);
    // const __AllMegs: any[] = await Connection.query(`SELECT * FROM reco_meg_data WHERE reported_date_timestamp <= $1`, [timestamp]);
    const __monthMegs: any[] = await Connection.query(`SELECT * FROM reco_meg_data WHERE month = $1 AND year = $2`, [month, year]);

    // SELECT (SUM(stock) - SUM(COALESCE(consumption, 0)) - SUM(COALESCE(loss, 0))) as total FROM dt_table;
    // const _monthMegs: any[] = __AllMegs.filter(a => a.month === month && a.year === year);

    for (const reco of recos) {
        try {
            const allMegs: RecoMegData[] = __AllMegs.filter(a => a.reco_id === reco.id);
            const monthMegs: RecoMegData[] = __monthMegs.filter(a => a.reco_id === reco.id);

            const stockMonth: RecoMegData[] = monthMegs.filter(a => a.meg_type === 'stock');
            const consumptionMonth: RecoMegData[] = monthMegs.filter(a => a.meg_type === 'consumption');
            const lossMonth: RecoMegData[] = monthMegs.filter(a => a.meg_type === 'loss');
            const damagedMonth: RecoMegData[] = monthMegs.filter(a => a.meg_type === 'damaged');
            const brokenMonth: RecoMegData[] = monthMegs.filter(a => a.meg_type === 'broken');
            const obseleteMonth: RecoMegData[] = monthMegs.filter(a => a.meg_type === 'obselete');

            const monthStockAll: RecoMegData[] = allMegs.filter(a => a.meg_type === 'stock');

            const consumptionAll: RecoMegData[] = allMegs.filter(a => a.meg_type === 'consumption');
            const lossAll: RecoMegData[] = allMegs.filter(a => a.meg_type === 'loss');
            const damagedAll: RecoMegData[] = allMegs.filter(a => a.meg_type === 'damaged');
            const brokenAll: RecoMegData[] = allMegs.filter(a => a.meg_type === 'broken');
            const obseleteAll: RecoMegData[] = allMegs.filter(a => a.meg_type === 'obselete');
            const megsOutAll: RecoMegData[] = [...consumptionAll, ...lossAll, ...damagedAll, ...brokenAll, ...obseleteAll];


            const meg_data: RecoMegDashboardUtils[] = [
                {
                    index: 1,
                    label: 'Amoxicilline 250 mg',
                    available_stock: monthStockAll.filter(d => isValidNum(d.amoxicillin_250mg)).map(c => parseInt(`${c.amoxicillin_250mg}`)).reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0) - 
                                     megsOutAll.filter(d => isValidNum(d.amoxicillin_250mg)).map(c => parseInt(`${c.amoxicillin_250mg}`)).reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0),
                    month_stock: stockMonth.filter(d => isValidNum(d.amoxicillin_250mg)).map(c => parseInt(`${c.amoxicillin_250mg}`)).reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0),
                    consumption: consumptionMonth.filter(d => isValidNum(d.amoxicillin_250mg)).map(c => parseInt(`${c.amoxicillin_250mg}`)).reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0),
                    loss: lossMonth.filter(d => isValidNum(d.amoxicillin_250mg)).map(c => parseInt(`${c.amoxicillin_250mg}`)).reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0),
                    damaged: damagedMonth.filter(d => isValidNum(d.amoxicillin_250mg)).map(c => parseInt(`${c.amoxicillin_250mg}`)).reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0),
                    broken: brokenMonth.filter(d => isValidNum(d.amoxicillin_250mg)).map(c => parseInt(`${c.amoxicillin_250mg}`)).reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0),
                    obselete: obseleteMonth.filter(d => isValidNum(d.amoxicillin_250mg)).map(c => parseInt(`${c.amoxicillin_250mg}`)).reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0),
                },
                {
                    index: 2,
                    label: 'Amoxicilline 500 mg',
                    available_stock: monthStockAll.filter(d => isValidNum(d.amoxicillin_500mg)).map(c => parseInt(`${c.amoxicillin_500mg}`)).reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0) - 
                                     megsOutAll.filter(d => isValidNum(d.amoxicillin_500mg)).map(c => parseInt(`${c.amoxicillin_500mg}`)).reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0),
                    month_stock: stockMonth.filter(d => isValidNum(d.amoxicillin_500mg)).map(c => parseInt(`${c.amoxicillin_500mg}`)).reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0),
                    consumption: consumptionMonth.filter(d => isValidNum(d.amoxicillin_500mg)).map(c => parseInt(`${c.amoxicillin_500mg}`)).reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0),
                    loss: lossMonth.filter(d => isValidNum(d.amoxicillin_500mg)).map(c => parseInt(`${c.amoxicillin_500mg}`)).reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0),
                    damaged: damagedMonth.filter(d => isValidNum(d.amoxicillin_500mg)).map(c => parseInt(`${c.amoxicillin_500mg}`)).reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0),
                    broken: brokenMonth.filter(d => isValidNum(d.amoxicillin_500mg)).map(c => parseInt(`${c.amoxicillin_500mg}`)).reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0),
                    obselete: obseleteMonth.filter(d => isValidNum(d.amoxicillin_500mg)).map(c => parseInt(`${c.amoxicillin_500mg}`)).reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0),
                },
                {
                    index: 3,
                    label: 'Paracetamol 250 mg',
                    available_stock: monthStockAll.filter(d => isValidNum(d.paracetamol_250mg)).map(c => parseInt(`${c.paracetamol_250mg}`)).reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0) - 
                                     megsOutAll.filter(d => isValidNum(d.paracetamol_250mg)).map(c => parseInt(`${c.paracetamol_250mg}`)).reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0),
                    month_stock: stockMonth.filter(d => isValidNum(d.paracetamol_250mg)).map(c => parseInt(`${c.paracetamol_250mg}`)).reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0),
                    consumption: consumptionMonth.filter(d => isValidNum(d.paracetamol_250mg)).map(c => parseInt(`${c.paracetamol_250mg}`)).reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0),
                    loss: lossMonth.filter(d => isValidNum(d.paracetamol_250mg)).map(c => parseInt(`${c.paracetamol_250mg}`)).reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0),
                    damaged: damagedMonth.filter(d => isValidNum(d.paracetamol_250mg)).map(c => parseInt(`${c.paracetamol_250mg}`)).reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0),
                    broken: brokenMonth.filter(d => isValidNum(d.paracetamol_250mg)).map(c => parseInt(`${c.paracetamol_250mg}`)).reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0),
                    obselete: obseleteMonth.filter(d => isValidNum(d.paracetamol_250mg)).map(c => parseInt(`${c.paracetamol_250mg}`)).reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0),
                },
                {
                    index: 4,
                    label: 'Paracetamol 500 mg',
                    available_stock: monthStockAll.filter(d => isValidNum(d.paracetamol_500mg)).map(c => parseInt(`${c.paracetamol_500mg}`)).reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0) - 
                                     megsOutAll.filter(d => isValidNum(d.paracetamol_500mg)).map(c => parseInt(`${c.paracetamol_500mg}`)).reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0),
                    month_stock: stockMonth.filter(d => isValidNum(d.paracetamol_500mg)).map(c => parseInt(`${c.paracetamol_500mg}`)).reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0),
                    consumption: consumptionMonth.filter(d => isValidNum(d.paracetamol_500mg)).map(c => parseInt(`${c.paracetamol_500mg}`)).reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0),
                    loss: lossMonth.filter(d => isValidNum(d.paracetamol_500mg)).map(c => parseInt(`${c.paracetamol_500mg}`)).reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0),
                    damaged: damagedMonth.filter(d => isValidNum(d.paracetamol_500mg)).map(c => parseInt(`${c.paracetamol_500mg}`)).reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0),
                    broken: brokenMonth.filter(d => isValidNum(d.paracetamol_500mg)).map(c => parseInt(`${c.paracetamol_500mg}`)).reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0),
                    obselete: obseleteMonth.filter(d => isValidNum(d.paracetamol_500mg)).map(c => parseInt(`${c.paracetamol_500mg}`)).reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0),
                },
                {
                    index: 5,
                    label: 'Mebendazol 250 mg',
                    available_stock: monthStockAll.filter(d => isValidNum(d.mebendazol_250mg)).map(c => parseInt(`${c.mebendazol_250mg}`)).reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0) - 
                                     megsOutAll.filter(d => isValidNum(d.mebendazol_250mg)).map(c => parseInt(`${c.mebendazol_250mg}`)).reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0),
                    month_stock: stockMonth.filter(d => isValidNum(d.mebendazol_250mg)).map(c => parseInt(`${c.mebendazol_250mg}`)).reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0),
                    consumption: consumptionMonth.filter(d => isValidNum(d.mebendazol_250mg)).map(c => parseInt(`${c.mebendazol_250mg}`)).reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0),
                    loss: lossMonth.filter(d => isValidNum(d.mebendazol_250mg)).map(c => parseInt(`${c.mebendazol_250mg}`)).reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0),
                    damaged: damagedMonth.filter(d => isValidNum(d.mebendazol_250mg)).map(c => parseInt(`${c.mebendazol_250mg}`)).reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0),
                    broken: brokenMonth.filter(d => isValidNum(d.mebendazol_250mg)).map(c => parseInt(`${c.mebendazol_250mg}`)).reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0),
                    obselete: obseleteMonth.filter(d => isValidNum(d.mebendazol_250mg)).map(c => parseInt(`${c.mebendazol_250mg}`)).reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0),
                },
                {
                    index: 6,
                    label: 'Mebendazol 500 mg',
                    available_stock: monthStockAll.filter(d => isValidNum(d.mebendazol_500mg)).map(c => parseInt(`${c.mebendazol_500mg}`)).reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0) - 
                                     megsOutAll.filter(d => isValidNum(d.mebendazol_500mg)).map(c => parseInt(`${c.mebendazol_500mg}`)).reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0),
                    month_stock: stockMonth.filter(d => isValidNum(d.mebendazol_500mg)).map(c => parseInt(`${c.mebendazol_500mg}`)).reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0),
                    consumption: consumptionMonth.filter(d => isValidNum(d.mebendazol_500mg)).map(c => parseInt(`${c.mebendazol_500mg}`)).reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0),
                    loss: lossMonth.filter(d => isValidNum(d.mebendazol_500mg)).map(c => parseInt(`${c.mebendazol_500mg}`)).reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0),
                    damaged: damagedMonth.filter(d => isValidNum(d.mebendazol_500mg)).map(c => parseInt(`${c.mebendazol_500mg}`)).reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0),
                    broken: brokenMonth.filter(d => isValidNum(d.mebendazol_500mg)).map(c => parseInt(`${c.mebendazol_500mg}`)).reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0),
                    obselete: obseleteMonth.filter(d => isValidNum(d.mebendazol_500mg)).map(c => parseInt(`${c.mebendazol_500mg}`)).reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0),
                },
                {
                    index: 7,
                    label: 'Ors / Zinc',
                    available_stock: monthStockAll.filter(d => isValidNum(d.ors_zinc)).map(c => parseInt(`${c.ors_zinc}`)).reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0) - 
                                     megsOutAll.filter(d => isValidNum(d.ors_zinc)).map(c => parseInt(`${c.ors_zinc}`)).reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0),
                    month_stock: stockMonth.filter(d => isValidNum(d.ors_zinc)).map(c => parseInt(`${c.ors_zinc}`)).reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0),
                    consumption: consumptionMonth.filter(d => isValidNum(d.ors_zinc)).map(c => parseInt(`${c.ors_zinc}`)).reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0),
                    loss: lossMonth.filter(d => isValidNum(d.ors_zinc)).map(c => parseInt(`${c.ors_zinc}`)).reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0),
                    damaged: damagedMonth.filter(d => isValidNum(d.ors_zinc)).map(c => parseInt(`${c.ors_zinc}`)).reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0),
                    broken: brokenMonth.filter(d => isValidNum(d.ors_zinc)).map(c => parseInt(`${c.ors_zinc}`)).reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0),
                    obselete: obseleteMonth.filter(d => isValidNum(d.ors_zinc)).map(c => parseInt(`${c.ors_zinc}`)).reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0),
                },
                {
                    index: 8,
                    label: 'CTA',
                    available_stock: monthStockAll.filter(d => isValidNum(d.cta)).map(c => parseInt(`${c.cta}`)).reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0) - 
                                     megsOutAll.filter(d => isValidNum(d.cta)).map(c => parseInt(`${c.cta}`)).reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0),
                    month_stock: stockMonth.filter(d => isValidNum(d.cta)).map(c => parseInt(`${c.cta}`)).reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0),
                    consumption: consumptionMonth.filter(d => isValidNum(d.cta)).map(c => parseInt(`${c.cta}`)).reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0),
                    loss: lossMonth.filter(d => isValidNum(d.cta)).map(c => parseInt(`${c.cta}`)).reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0),
                    damaged: damagedMonth.filter(d => isValidNum(d.cta)).map(c => parseInt(`${c.cta}`)).reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0),
                    broken: brokenMonth.filter(d => isValidNum(d.cta)).map(c => parseInt(`${c.cta}`)).reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0),
                    obselete: obseleteMonth.filter(d => isValidNum(d.cta)).map(c => parseInt(`${c.cta}`)).reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0),
                },
                {
                    index: 9,
                    label: 'TDR',
                    available_stock: monthStockAll.filter(d => isValidNum(d.tdr)).map(c => parseInt(`${c.tdr}`)).reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0) - 
                                     megsOutAll.filter(d => isValidNum(d.tdr)).map(c => parseInt(`${c.tdr}`)).reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0),
                    month_stock: stockMonth.filter(d => isValidNum(d.tdr)).map(c => parseInt(`${c.tdr}`)).reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0),
                    consumption: consumptionMonth.filter(d => isValidNum(d.tdr)).map(c => parseInt(`${c.tdr}`)).reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0),
                    loss: lossMonth.filter(d => isValidNum(d.tdr)).map(c => parseInt(`${c.tdr}`)).reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0),
                    damaged: damagedMonth.filter(d => isValidNum(d.tdr)).map(c => parseInt(`${c.tdr}`)).reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0),
                    broken: brokenMonth.filter(d => isValidNum(d.tdr)).map(c => parseInt(`${c.tdr}`)).reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0),
                    obselete: obseleteMonth.filter(d => isValidNum(d.tdr)).map(c => parseInt(`${c.tdr}`)).reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0),
                },
                {
                    index: 10,
                    label: 'Vitamin A',
                    available_stock: monthStockAll.filter(d => isValidNum(d.vitamin_a)).map(c => parseInt(`${c.vitamin_a}`)).reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0) - 
                                     megsOutAll.filter(d => isValidNum(d.vitamin_a)).map(c => parseInt(`${c.vitamin_a}`)).reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0),
                    month_stock: stockMonth.filter(d => isValidNum(d.vitamin_a)).map(c => parseInt(`${c.vitamin_a}`)).reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0),
                    consumption: consumptionMonth.filter(d => isValidNum(d.vitamin_a)).map(c => parseInt(`${c.vitamin_a}`)).reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0),
                    loss: lossMonth.filter(d => isValidNum(d.vitamin_a)).map(c => parseInt(`${c.vitamin_a}`)).reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0),
                    damaged: damagedMonth.filter(d => isValidNum(d.vitamin_a)).map(c => parseInt(`${c.vitamin_a}`)).reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0),
                    broken: brokenMonth.filter(d => isValidNum(d.vitamin_a)).map(c => parseInt(`${c.vitamin_a}`)).reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0),
                    obselete: obseleteMonth.filter(d => isValidNum(d.vitamin_a)).map(c => parseInt(`${c.vitamin_a}`)).reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0),
                },
                // meg_type!: 'stock' | 'consumption' | 'loss' | 'damaged' | 'broken' | 'obselete'
                // fp_method!: 'pill_coc' | 'pill_cop' | 'condoms' | 'dmpa_sc' | 'depo_provera_im' | 'cycle_necklace' | 'diu' | 'implant' | 'tubal_ligation' | null
                {
                    index: 11,
                    label: 'Pillule COC',
                    available_stock: monthStockAll.filter(d => isValidNum(d.pill_coc)).map(c => parseInt(`${c.pill_coc}`)).reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0) - 
                                     megsOutAll.filter(d => isValidNum(d.pill_coc)).map(c => parseInt(`${c.pill_coc}`)).reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0),
                    month_stock: stockMonth.filter(d => isValidNum(d.pill_coc)).map(c => parseInt(`${c.pill_coc}`)).reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0),
                    consumption: consumptionMonth.filter(d => isValidNum(d.pill_coc)).map(c => parseInt(`${c.pill_coc}`)).reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0),
                    loss: lossMonth.filter(d => isValidNum(d.pill_coc)).map(c => parseInt(`${c.pill_coc}`)).reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0),
                    damaged: damagedMonth.filter(d => isValidNum(d.pill_coc)).map(c => parseInt(`${c.pill_coc}`)).reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0),
                    broken: brokenMonth.filter(d => isValidNum(d.pill_coc)).map(c => parseInt(`${c.pill_coc}`)).reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0),
                    obselete: obseleteMonth.filter(d => isValidNum(d.pill_coc)).map(c => parseInt(`${c.pill_coc}`)).reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0),
                },
                {
                    index: 12,
                    label: 'Pillule COP',
                    available_stock: monthStockAll.filter(d => isValidNum(d.pill_cop)).map(c => parseInt(`${c.pill_cop}`)).reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0) - 
                                     megsOutAll.filter(d => isValidNum(d.pill_cop)).map(c => parseInt(`${c.pill_cop}`)).reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0),
                    month_stock: stockMonth.filter(d => isValidNum(d.pill_cop)).map(c => parseInt(`${c.pill_cop}`)).reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0),
                    consumption: consumptionMonth.filter(d => isValidNum(d.pill_cop)).map(c => parseInt(`${c.pill_cop}`)).reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0),
                    loss: lossMonth.filter(d => isValidNum(d.pill_cop)).map(c => parseInt(`${c.pill_cop}`)).reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0),
                    damaged: damagedMonth.filter(d => isValidNum(d.pill_cop)).map(c => parseInt(`${c.pill_cop}`)).reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0),
                    broken: brokenMonth.filter(d => isValidNum(d.pill_cop)).map(c => parseInt(`${c.pill_cop}`)).reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0),
                    obselete: obseleteMonth.filter(d => isValidNum(d.pill_cop)).map(c => parseInt(`${c.pill_cop}`)).reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0),
                },
                {
                    index: 13,
                    label: 'Condoms',
                    available_stock: monthStockAll.filter(d => isValidNum(d.condoms)).map(c => parseInt(`${c.condoms}`)).reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0) - 
                                     megsOutAll.filter(d => isValidNum(d.condoms)).map(c => parseInt(`${c.condoms}`)).reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0),
                    month_stock: stockMonth.filter(d => isValidNum(d.condoms)).map(c => parseInt(`${c.condoms}`)).reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0),
                    consumption: consumptionMonth.filter(d => isValidNum(d.condoms)).map(c => parseInt(`${c.condoms}`)).reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0),
                    loss: lossMonth.filter(d => isValidNum(d.condoms)).map(c => parseInt(`${c.condoms}`)).reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0),
                    damaged: damagedMonth.filter(d => isValidNum(d.condoms)).map(c => parseInt(`${c.condoms}`)).reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0),
                    broken: brokenMonth.filter(d => isValidNum(d.condoms)).map(c => parseInt(`${c.condoms}`)).reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0),
                    obselete: obseleteMonth.filter(d => isValidNum(d.condoms)).map(c => parseInt(`${c.condoms}`)).reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0),
                },
                {
                    index: 14,
                    label: 'Dmpa SC (Sayana-press)',
                    available_stock: monthStockAll.filter(d => isValidNum(d.dmpa_sc)).map(c => parseInt(`${c.dmpa_sc}`)).reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0) - 
                                     megsOutAll.filter(d => isValidNum(d.dmpa_sc)).map(c => parseInt(`${c.dmpa_sc}`)).reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0),
                    month_stock: stockMonth.filter(d => isValidNum(d.dmpa_sc)).map(c => parseInt(`${c.dmpa_sc}`)).reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0),
                    consumption: consumptionMonth.filter(d => isValidNum(d.dmpa_sc)).map(c => parseInt(`${c.dmpa_sc}`)).reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0),
                    loss: lossMonth.filter(d => isValidNum(d.dmpa_sc)).map(c => parseInt(`${c.dmpa_sc}`)).reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0),
                    damaged: damagedMonth.filter(d => isValidNum(d.dmpa_sc)).map(c => parseInt(`${c.dmpa_sc}`)).reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0),
                    broken: brokenMonth.filter(d => isValidNum(d.dmpa_sc)).map(c => parseInt(`${c.dmpa_sc}`)).reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0),
                    obselete: obseleteMonth.filter(d => isValidNum(d.dmpa_sc)).map(c => parseInt(`${c.dmpa_sc}`)).reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0),
                },
                {
                    index: 15,
                    label: 'Implant',
                    available_stock: monthStockAll.filter(d => isValidNum(d.implant)).map(c => parseInt(`${c.implant}`)).reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0) - 
                                     megsOutAll.filter(d => isValidNum(d.implant)).map(c => parseInt(`${c.implant}`)).reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0),
                    month_stock: stockMonth.filter(d => isValidNum(d.implant)).map(c => parseInt(`${c.implant}`)).reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0),
                    consumption: consumptionMonth.filter(d => isValidNum(d.implant)).map(c => parseInt(`${c.implant}`)).reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0),
                    loss: lossMonth.filter(d => isValidNum(d.implant)).map(c => parseInt(`${c.implant}`)).reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0),
                    damaged: damagedMonth.filter(d => isValidNum(d.implant)).map(c => parseInt(`${c.implant}`)).reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0),
                    broken: brokenMonth.filter(d => isValidNum(d.implant)).map(c => parseInt(`${c.implant}`)).reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0),
                    obselete: obseleteMonth.filter(d => isValidNum(d.implant)).map(c => parseInt(`${c.implant}`)).reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0),
                }
            ];


            const _meg = new RecoMegDashboard();

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

            await _repoDashboard.save(_meg);
            outPutData.SuccessCount += 1;
        } catch (err) {
            outPutData.ErrorsCount += 1;
        }
    }

    return outPutData;
}