import { Request, Response, NextFunction } from 'express';
import { DataSource } from 'typeorm';
import { AppDataSource } from '../../data-source';
import { ChildrenVaccines, RecoChartPerformanceDashboard, RecoPerformanceDashboard, RecoVaccinationDashboard, RecoVaccinationDashboardDbOutput } from '../../models/dashboards';
import { TransformRecoPerformanceDashboard, TransformRecoVaccinationDashboard } from './transform-dashboards';

let Connection: DataSource = AppDataSource.manager.connection;


const paramettersErrorMsg = 'Les paramettres renseignés sont vides';
const notAuthorizedMsg = `Vous n'êtes pas autorisé à effectuer cette action!`;
const serverErrorMsg = (error: any) => `${error || 'Erreur Interne Du Serveur'}`;


export async function GET_RECO_VACCINATION_DASHBOARD(req: Request, res: Response, next: NextFunction) {
    try {
        var { userId, months, year, recos, withMonthYear, fullData, sync } = req.body;
        if (!userId) return res.status(201).json({ status: 201, data: notAuthorizedMsg });

        if (withMonthYear == true && (!months || !year) || !recos) return res.status(201).json({ status: 201, data: paramettersErrorMsg });
        recos = Array.isArray(recos) ? recos : [recos];

        let datas: RecoVaccinationDashboardDbOutput[];

        if (withMonthYear == true) {
            months = Array.isArray(months) ? months : [months];

            const monthsPlaceholders = months.map((_: any, i: number) => `$${i + 1}`).join(',');
            const yearPlaceholders = `$${months.length + 1}`;
            const recosPlaceholders = recos.map((_: any, i: number) => `$${months.length + 2 + i}`).join(',');

            datas = await Connection.query(`
                SELECT * FROM dashboard_reco_vaccination_view v
                WHERE v.month IN (${monthsPlaceholders})
                AND v.year = ${yearPlaceholders}
                AND (v.reco->>'id')::text IN (${recosPlaceholders})
            `, [...months, year, ...recos]);

        } else {
            const recosIdsList = recos.map((_: any, i: number) => `$${i + 1}`).join(',');

            datas = await Connection.query(`
                SELECT * FROM dashboard_reco_vaccination_view v
                WHERE(v.reco->>'id')::text IN (${recosIdsList})
            `, [...recos]);
        }

        if (fullData == true) {

            // const dataTransformed = sync === true ? datas : await TransformRecoVaccinationDashboard(datas);
    
            return res.status(200).json({ status: 200, data: datas });
        } else {


            let fanalData: RecoVaccinationDashboardDbOutput[] = [];

            for (const vacc of datas) {
                const vaccData = { ...vacc, children_vaccines: [] }
                for (const vc of vacc.children_vaccines) {
                    const vcData = { ...vc, data: [] };
                    for (const v of vc.data) {
                        if (v.vaccine_VAR_2 != true) (vcData.data as RecoVaccinationDashboard[]).push(v)
                    }
                    if(vcData.data.length > 0) (vaccData.children_vaccines as ChildrenVaccines[]).push(vcData)
                }
                if(vaccData.children_vaccines.length > 0) fanalData.push(vaccData)
            }

            // const dataTransformed = sync === true ? fanalData : await TransformRecoVaccinationDashboard(fanalData);
    
            return res.status(200).json({ status: 200, data: fanalData });
            
        }
    } catch (err: any) {
        return res.status(500).json({ status: 500, data: serverErrorMsg(err) });
    }
};

export async function GET_RECO_PERFORMANCE_DASHBOARD(req: Request, res: Response, next: NextFunction) {
    try {
        var { userId, months, year, recos, sync } = req.body;
        if (!userId) return res.status(201).json({ status: 201, data: notAuthorizedMsg });

        if (!months || !year || !recos) return res.status(201).json({ status: 201, data: paramettersErrorMsg });
        months = Array.isArray(months) ? months : [months];
        recos = Array.isArray(recos) ? recos : [recos];
        const monthsPlaceholders = months.map((_: any, i: number) => `$${i + 1}`).join(',');
        const yearPlaceholders = `$${months.length + 1}`;
        const recosPlaceholders = recos.map((_: any, i: number) => `$${months.length + 2 + i}`).join(',');

        const dataPerf: RecoPerformanceDashboard[] = await Connection.query(`
            SELECT * FROM dashboard_reco_performance_view p
            WHERE p.month IN (${monthsPlaceholders})
            AND p.year = ${yearPlaceholders}
            AND (p.reco->>'id')::text IN (${recosPlaceholders})
        `, [...months, year, ...recos]);

        let dataChart: RecoChartPerformanceDashboard[] = [];

        if (recos.length === 1) {
            const recosPlaceholders2 = recos.map((_: any, i: number) => `$${i + 2}`).join(',');
            dataChart = await Connection.query(`
                SELECT * FROM dashboard_reco_chart_performance_view p
                WHERE p.year = $1
                AND (p.reco->>'id')::text IN (${recosPlaceholders2})
            `, [year, ...recos]);
        }

        // const dataTransformed = sync === true ? dataPerf : await TransformRecoPerformanceDashboard(dataPerf, dataChart);

        return res.status(200).json({ status: 200, data: dataPerf, chart: dataChart });
    } catch (err: any) {
        return res.status(500).json({ status: 500, data: serverErrorMsg(err) });
    }
};


export async function GET_RECO_CHART_PERFORMANCE_DASHBOARD(req: Request, res: Response, next: NextFunction) {
    try {
        if (1 != 1) return res.status(201).json({ status: 201, data: notAuthorizedMsg });
        var { year, recos, sync } = req.body;
        if (!year || !recos) return res.status(201).json({ status: 201, data: paramettersErrorMsg });
        recos = Array.isArray(recos) ? recos : [recos];
        const recosPlaceholders = recos.map((_: any, i: number) => `$${i + 2}`).join(',');

        const data: RecoChartPerformanceDashboard[] = await Connection.query(`
            SELECT * FROM dashboard_reco_chart_performance_view p
            WHERE p.year = $1
            AND (p.reco->>'id')::text IN (${recosPlaceholders})
        `, [year, ...recos]);

        return res.status(200).json({ status: 200, data: data });

    } catch (err: any) {
        return res.status(500).json({ status: 500, data: serverErrorMsg(err) });
    }
};









