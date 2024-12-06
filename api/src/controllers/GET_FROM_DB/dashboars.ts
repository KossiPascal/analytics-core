import { Request, Response, NextFunction } from 'express';
import { DataSource } from 'typeorm';
import { AppDataSource } from '../../data_source';
import { RecoChartPerformanceDashboard, RecoPerformanceDashboard, RecoVaccinationDashboard } from '../../entities/dashboards';

let Connection: DataSource = AppDataSource.manager.connection;


export async function GET_RECO_VACCINATION_DASHBOARD(req: Request, res: Response, next: NextFunction) {
    try {
        if (1 == 1) {
            var { months, year, recos } = req.body;
            if (months && year && recos) {
                months = Array.isArray(months) ? months : [months];
                recos = Array.isArray(recos) ? recos : [recos];
                const monthsPlaceholders = months.map((_: any, i: number) => `$${i + 1}`).join(',');
                const yearPlaceholders = `$${months.length + 1}`;
                const recosPlaceholders = recos.map((_: any, i: number) => `$${months.length + 2 + i}`).join(',');

                const data: RecoVaccinationDashboard[] = await Connection.query(`
                    SELECT * FROM reco_vaccination_dashboard v
                    WHERE v.month IN (${monthsPlaceholders})
                    AND v.year = ${yearPlaceholders}
                    AND (v.reco->>'id')::text IN (${recosPlaceholders})
                `, [...months, year, ...recos]);
                return res.status(200).json({ status: 200, data: data });
            }
            return res.status(201).json({ status: 201, data: 'You provide empty filters' });
        }
        return res.status(201).json({ status: 201, data: 'Vous n\'êtes pas autorisé à effectuer cette action!' });
    } catch (err: any) {
        return res.status(500).json({ status: 500, data: `${err || 'Erreur Interne Du Serveur'}` });
    }
};

export async function GET_RECO_PERFORMANCE_DASHBOARD(req: Request, res: Response, next: NextFunction) {
    try {
        if (1 == 1) {
            var { months, year, recos } = req.body;
            if (months && year && recos) {
                months = Array.isArray(months) ? months : [months];
                recos = Array.isArray(recos) ? recos : [recos];
                const monthsPlaceholders = months.map((_: any, i: number) => `$${i + 1}`).join(',');
                const yearPlaceholders = `$${months.length + 1}`;
                const recosPlaceholders = recos.map((_: any, i: number) => `$${months.length + 2 + i}`).join(',');

                const data: RecoPerformanceDashboard[] = await Connection.query(`
                    SELECT * FROM reco_performance_dashboard p
                    WHERE p.month IN (${monthsPlaceholders})
                    AND p.year = ${yearPlaceholders}
                    AND (p.reco->>'id')::text IN (${recosPlaceholders})
                `, [...months, year, ...recos]);
                return res.status(200).json({ status: 200, data: data });
            }
            return res.status(201).json({ status: 201, data: 'You provide empty filters' });
        }
        return res.status(201).json({ status: 201, data: 'Vous n\'êtes pas autorisé à effectuer cette action!' });
    } catch (err: any) {
        return res.status(500).json({ status: 500, data: `${err || 'Erreur Interne Du Serveur'}` });
    }
};


export async function GET_RECO_CHART_PERFORMANCE_DASHBOARD(req: Request, res: Response, next: NextFunction) {
    try {
        if (1 == 1) {
            var { year, recos } = req.body;
            if (year && recos) {
                recos = Array.isArray(recos) ? recos : [recos];
                const recosPlaceholders = recos.map((_: any, i: number) => `$${i + 2}`).join(',');

                const data: RecoChartPerformanceDashboard[] = await Connection.query(`
                    SELECT * FROM reco_chart_performance_dashboard p
                    WHERE p.year = $1
                    AND (p.reco->>'id')::text IN (${recosPlaceholders})
                `, [year, ...recos]);
                return res.status(200).json({ status: 200, data: data });
            }
            return res.status(201).json({ status: 201, data: 'You provide empty filters' });
        }
        return res.status(201).json({ status: 201, data: 'Vous n\'êtes pas autorisé à effectuer cette action!' });
    } catch (err: any) {
        return res.status(500).json({ status: 500, data: `${err || 'Erreur Interne Du Serveur'}` });
    }
};









