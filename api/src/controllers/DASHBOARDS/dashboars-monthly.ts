import { Request, Response, NextFunction } from 'express';
import { DataSource } from 'typeorm';
import { AppDataSource } from '../../data-source';
import { ActiveRecoDashboard, RecoPerformanceDashboardDbOutput, RecoPerformanceDashboardFullYearDbOutput, RecoTasksStateDashboardDbOutput } from '../../models/dashboards';

let Connection: DataSource = AppDataSource.manager.connection;

const paramettersErrorMsg = 'Les paramettres renseignés sont vides';
const notAuthorizedMsg = `Vous n'êtes pas autorisé à effectuer cette action!`;
const serverErrorMsg = (error: any) => `${error || 'Erreur Interne Du Serveur'}`;


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

        const dataPerf: RecoPerformanceDashboardDbOutput[] = await Connection.query(`
            SELECT * FROM dashboards_reco_performance_view
            WHERE month IN (${monthsPlaceholders})
            AND year = ${yearPlaceholders}
            AND (reco->>'id')::text IN (${recosPlaceholders})
        `, [...months, year, ...recos]);
        // const dataTransformed = sync === true ? dataPerf : await TransformRecoPerformanceDashboard(dataPerf, dataChart);

        const recosPlaceholdersFullYear = recos.map((_: any, i: number) => `$${i + 2}`).join(',');

        const yearDataPerf: RecoPerformanceDashboardFullYearDbOutput[] = await Connection.query(`
            SELECT * FROM dashboards_reco_performance_full_year_view
            WHERE year = $1
            AND (reco->>'id')::text IN (${recosPlaceholdersFullYear})
        `, [year, ...recos]);

        return res.status(200).json({ status: 200, data: dataPerf, yearData: yearDataPerf });
    } catch (err: any) {
        return res.status(500).json({ status: 500, data: serverErrorMsg(err) });
    }
};

export async function GET_ACTIVE_RECO_DASHBOARD(req: Request, res: Response, next: NextFunction) {
    try {
        var { userId, year, recos, sync } = req.body;
        if (!userId) return res.status(201).json({ status: 201, data: notAuthorizedMsg });
        if (!year || !recos) return res.status(201).json({ status: 201, data: paramettersErrorMsg });

        const recosArray = Array.isArray(recos) ? recos : [recos];
        const recosPlaceholders = recosArray.map((_: any, i: number) => `$${i + 2}`).join(',');

        const datas: ActiveRecoDashboard[] = await Connection.query(`
            SELECT * FROM dashboards_active_reco_view
            WHERE year = $1
            AND (reco->>'id')::text IN (${recosPlaceholders})
        `, [parseInt(year), ...recosArray]);

        // const dataTransformed = sync === true ? datas : await TransformActiveRecoDashboard(datas);
        return res.status(200).json({ status: 200, data: datas });

    } catch (err: any) {
        return res.status(500).json({ status: 500, data: serverErrorMsg(err) });
    }
};

export async function GET_RECO_TASKS_STATE_DASHBOARD(req: Request, res: Response, next: NextFunction): Promise<Response> {
    try {
        const { userId, recos, start_date, end_date, sync } = req.body;
        if (!userId) return res.status(401).json({ status: 401, data: notAuthorizedMsg });
        if (!start_date || !end_date || !recos) return res.status(400).json({ status: 400, data: paramettersErrorMsg });

        const recoList: string[] = Array.isArray(recos) ? recos : [recos];
        const recosPlaceholders = recoList.map((_, i) => `$${i + 3}`).join(',');

        const datas: RecoTasksStateDashboardDbOutput[] = await Connection.query(`
            SELECT * FROM dashboards_tasks_state_view
            WHERE due_date BETWEEN $1::date AND $2::date
            AND (reco->>'id')::text IN (${recosPlaceholders})
        `, [start_date, end_date, ...recoList]);

        // const transformedData = sync === true ? datas : await TransformRecoTasksStateDashboard(datas);
        return res.status(200).json({ status: 200, data: datas });
    } catch (error) {
        return res.status(500).json({ status: 500, data: serverErrorMsg(error) });
    }
};


