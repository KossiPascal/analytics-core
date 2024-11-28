import { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";
import { AppDataSource } from "../../../data_source";
import { DataSource } from "typeorm";
import { RecoPerformanceDashboardUtils } from "../../../utils/Interfaces";
import { RECOS_CUSTOM_QUERY } from "../../orgunit-query/org-units-custom";
import { RecoChartPerformanceDashboard, getRecoChartPerformanceDashboardRepository } from "../../../entities/dashboards";
import { getColors } from "../../../utils/functions";


let Conn: DataSource = AppDataSource.manager.connection;

export async function RECO_CHART_PERFORMANCE_DASHBOARD_CALCULATION(req: Request, res: Response, next: NextFunction): Promise<any> {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(201).json({ status: 201, data: 'Informations you provided are not valid' });
    }
    var { year } = req.body;
    const outPutData = await RECO_CHART_PERFORMANCE_DASHBOARD_CALCULATION_DATA(year);

    if (outPutData.SuccessCount === outPutData.recos_length || outPutData.ErrorsCount === outPutData.recos_length || (outPutData.ErrorsCount + outPutData.SuccessCount) === outPutData.recos_length) {
        outPutData.status = 200;
        return res.status(200).json(outPutData);
    }
}

export async function RECO_CHART_PERFORMANCE_DASHBOARD_CALCULATION_DATA(year: number): Promise<{ status: number, ErrorsCount: number, SuccessCount: number, data: any, recos_length: number }> {
    const _repoDashboard = await getRecoChartPerformanceDashboardRepository();
    const recos = await RECOS_CUSTOM_QUERY();
    const outPutData: { status: number, ErrorsCount: number, SuccessCount: number, data: any, recos_length: number } = { status: 201, ErrorsCount: 0, SuccessCount: 0, data: null, recos_length: recos.length };

    const __adultData: any[] = await Conn.query(`SELECT * FROM adult_data WHERE year = $1`, [year]);
    const __fpData: any[] = await Conn.query(`SELECT * FROM family_planning_data WHERE year = $1`, [year]);
    const __newbornData: any[] = await Conn.query(`SELECT * FROM newborn_data WHERE year = $1`, [year]);
    const __pcimneData: any[] = await Conn.query(`SELECT * FROM pcimne_data WHERE year = $1`, [year]);
    const __pregnantData: any[] = await Conn.query(`SELECT * FROM pregnant_data WHERE year = $1`, [year]);
    const __deliveryData: any[] = await Conn.query(`SELECT * FROM delivery_data WHERE year = $1`, [year]);
    const __referalData: any[] = await Conn.query(`SELECT * FROM referal_data WHERE year = $1`, [year]);
    const __deathData: any[] = await Conn.query(`SELECT * FROM death_data WHERE year = $1`, [year]);
    const __eventsData: any[] = await Conn.query(`SELECT * FROM events_data WHERE year = $1`, [year]);
    const __promoActData: any[] = await Conn.query(`SELECT * FROM promotional_activity_data WHERE year = $1`, [year]);

    const MONTHS = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
    // const MONTHS_LABEL = ['JAN', 'FEV', 'MAR', 'AVR', 'MAI', 'JUN', 'JUI', 'AOU', 'SEP', 'OCT', 'NOV', 'DEC'];

    const color = getColors(recos.length * 20);
    let colorIndex = 0;

    for (const reco of recos) {
        try {
            const adultData = __adultData.filter(r => r.reco_id === reco.id);
            const fpData = __fpData.filter(r => r.reco_id === reco.id);
            const newbornData = __newbornData.filter(r => r.reco_id === reco.id);
            const pcimneData = __pcimneData.filter(r => r.reco_id === reco.id);
            const pregnantData = __pregnantData.filter(r => r.reco_id === reco.id);
            const deliveryData = __deliveryData.filter(r => r.reco_id === reco.id);
            const referalData = __referalData.filter(r => r.reco_id === reco.id);
            const deathData = __deathData.filter(r => r.reco_id === reco.id);
            const eventsData = __eventsData.filter(r => r.reco_id === reco.id);
            const promoActData = __promoActData.filter(r => r.reco_id === reco.id);


            const datasets = [
                {
                    label: 'Adult',
                    backgroundColor: color.backgroundColors[colorIndex + 1],
                    data: MONTHS.map(m => adultData.filter(r => r.month === m).length),
                    borderColor: color.backgroundColors[colorIndex + 1],
                },
                {
                    label: 'PF',
                    backgroundColor: color.backgroundColors[colorIndex + 2],
                    data: MONTHS.map(m => fpData.filter(r => r.month === m).length),
                    borderColor: color.backgroundColors[colorIndex + 2],
                },
                {
                    label: 'Nouveau Né',
                    backgroundColor: color.backgroundColors[colorIndex + 3],
                    data: MONTHS.map(m => newbornData.filter(r => r.month === m).length),
                    borderColor: color.backgroundColors[colorIndex + 3],
                },
                {
                    label: 'Pcimne',
                    backgroundColor: color.backgroundColors[colorIndex + 4],
                    data: MONTHS.map(m => pcimneData.filter(r => r.month === m).length),
                    borderColor: color.backgroundColors[colorIndex + 4],
                },
                {
                    label: 'Enceinte',
                    backgroundColor: color.backgroundColors[colorIndex + 5],
                    data: MONTHS.map(m => pregnantData.filter(r => r.month === m).length),
                    borderColor: color.backgroundColors[colorIndex + 5],
                },
                {
                    label: 'Accouchement',
                    backgroundColor: color.backgroundColors[colorIndex + 6],
                    data: MONTHS.map(m => deliveryData.filter(r => r.month === m).length),
                    borderColor: color.backgroundColors[colorIndex + 6],
                },
                {
                    label: 'Suivi Référence',
                    backgroundColor: color.backgroundColors[colorIndex + 7],
                    data: MONTHS.map(m => referalData.filter(r => r.month === m).length),
                    borderColor: color.backgroundColors[colorIndex + 7],
                },
                {
                    label: 'Décès',
                    backgroundColor: color.backgroundColors[colorIndex + 8],
                    data: MONTHS.map(m => deathData.filter(r => r.month === m).length),
                    borderColor: color.backgroundColors[colorIndex + 8],
                },
                {
                    label: 'Evenements',
                    backgroundColor: color.backgroundColors[colorIndex + 9],
                    data: MONTHS.map(m => eventsData.filter(r => r.month === m).length),
                    borderColor: color.backgroundColors[colorIndex + 9],
                },
                {
                    label: 'Activités Promotionnelles',
                    backgroundColor: color.backgroundColors[colorIndex + 10],
                    data: MONTHS.map(m => promoActData.filter(r => r.month === m).length),
                    borderColor: color.backgroundColors[colorIndex + 10],
                }
            ]

            const lineChart: RecoPerformanceDashboardUtils = {
                title: 'TOUTES LES ACTIONS DU RECO DE L\'ANNEE',
                type: 'line',
                absisseLabels: MONTHS,
                datasets: datasets,
            }

            const barChart: RecoPerformanceDashboardUtils = {
                title: 'TENDANCE DES ACTIVITE DU RECO DE L\'ANNEE',
                type: 'bar',
                absisseLabels: MONTHS,
                datasets: datasets
            }

            colorIndex += 1;

            const _per = new RecoChartPerformanceDashboard();

            _per.id = `${year}-${reco.id}`;
            _per.year = year;

            _per.lineChart = lineChart;
            _per.barChart = barChart;

            _per.country = reco.country;
            _per.region = reco.region;
            _per.prefecture = reco.prefecture;
            _per.commune = reco.commune;
            _per.hospital = reco.hospital;
            _per.district_quartier = reco.district_quartier;
            // _per.chw = reco.chw;
            _per.village_secteur = reco.village_secteur;
            _per.reco = { id: reco.id, name: reco.name, phone: reco.phone };

            await _repoDashboard.save(_per);
            outPutData.SuccessCount += 1;

        } catch (err) {
            outPutData.ErrorsCount += 1;
        }
    }

    return outPutData;
}