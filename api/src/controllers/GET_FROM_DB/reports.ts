import { Request, Response, NextFunction } from 'express';
import { DataSource } from 'typeorm';
import { AppDataSource } from '../../data_source';
import { ChwsRecoReport, FamilyPlanningReport, HouseholdRecapReport, MorbidityReport, PcimneNewbornReport, PromotionReport, RecoMegSituationReport } from '../../entities/Reports';
let Connection: DataSource = AppDataSource.manager.connection;


export async function GET_PROMOTION_REPORTS(req: Request, res: Response, next: NextFunction) {
    try {
        if (1 == 1) {
            var { months, year, recos } = req.body;
            if (months && year && recos) {
                months = Array.isArray(months) ? months : [months];
                recos = Array.isArray(recos) ? recos : [recos];
                const monthsPlaceholders = months.map((_: any, i: number) => `$${i + 1}`).join(',');
                const yearPlaceholders = `$${months.length + 1}`;
                const recosPlaceholders = recos.map((_: any, i: number) => `$${months.length + 2 + i}`).join(',');

                const data: PromotionReport = await Connection.query(`
                    SELECT * FROM promotion_report p
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

export async function GET_FAMILY_PLANNING_REPORTS(req: Request, res: Response, next: NextFunction) {
    try {
        if (1 == 1) {
            var { months, year, recos } = req.body;
            if (months && year && recos) {
                months = Array.isArray(months) ? months : [months];
                recos = Array.isArray(recos) ? recos : [recos];
                const monthsPlaceholders = months.map((_: any, i: number) => `$${i + 1}`).join(',');
                const yearPlaceholders = `$${months.length + 1}`;
                const recosPlaceholders = recos.map((_: any, i: number) => `$${months.length + 2 + i}`).join(',');

                const data: FamilyPlanningReport = await Connection.query(`
                    SELECT * FROM family_planning_report f
                    WHERE f.month IN (${monthsPlaceholders})
                    AND f.year = ${yearPlaceholders}
                    AND (f.reco->>'id')::text IN (${recosPlaceholders})
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

export async function GET_MORBIDITY_REPORTS(req: Request, res: Response, next: NextFunction) {
    try {
        if (1 == 1) {
            var { months, year, recos } = req.body;
            if (months && year && recos) {
                months = Array.isArray(months) ? months : [months];
                recos = Array.isArray(recos) ? recos : [recos];
                const monthsPlaceholders = months.map((_: any, i: number) => `$${i + 1}`).join(',');
                const yearPlaceholders = `$${months.length + 1}`;
                const recosPlaceholders = recos.map((_: any, i: number) => `$${months.length + 2 + i}`).join(',');
                const data: MorbidityReport = await Connection.query(`
                    SELECT * FROM morbidity_report m
                    WHERE m.month IN (${monthsPlaceholders})
                    AND m.year = ${yearPlaceholders}
                    AND (m.reco->>'id')::text IN (${recosPlaceholders})
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

export async function GET_HOUSEHOLD_RECAP_REPORTS(req: Request, res: Response, next: NextFunction) {
    try {
        if (1 == 1) {
            var { months, year, recos } = req.body;
            if (months && year && recos) {
                months = Array.isArray(months) ? months : [months];
                recos = Array.isArray(recos) ? recos : [recos];
                const monthsPlaceholders = months.map((_: any, i: number) => `$${i + 1}`).join(',');
                const yearPlaceholders = `$${months.length + 1}`;
                const recosPlaceholders = recos.map((_: any, i: number) => `$${months.length + 2 + i}`).join(',');
                const data: HouseholdRecapReport = await Connection.query(`
                    SELECT * FROM household_recap_report h
                    WHERE h.month IN (${monthsPlaceholders})
                    AND h.year = ${yearPlaceholders}
                    AND (h.reco->>'id')::text IN (${recosPlaceholders})
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

export async function GET_PCIME_REPORTS(req: Request, res: Response, next: NextFunction) {
    try {
        if (1 == 1) {
            var { months, year, recos } = req.body;
            if (months && year && recos) {
                months = Array.isArray(months) ? months : [months];
                recos = Array.isArray(recos) ? recos : [recos];
                const monthsPlaceholders = months.map((_: any, i: number) => `$${i + 1}`).join(',');
                const yearPlaceholders = `$${months.length + 1}`;
                const recosPlaceholders = recos.map((_: any, i: number) => `$${months.length + 2 + i}`).join(',');
                const data: PcimneNewbornReport = await Connection.query(`
                    SELECT * FROM pcimne_newborn_report p
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

export async function GET_CHWS_RECO_REPORTS(req: Request, res: Response, next: NextFunction) {
    try {
        if (1 == 1) {
            var { months, year, recos } = req.body;
            if (months && year && recos) {
                months = Array.isArray(months) ? months : [months];
                recos = Array.isArray(recos) ? recos : [recos];
                const monthsPlaceholders = months.map((_: any, i: number) => `$${i + 1}`).join(',');
                const yearPlaceholders = `$${months.length + 1}`;
                const recosPlaceholders = recos.map((_: any, i: number) => `$${months.length + 2 + i}`).join(',');
                const data: ChwsRecoReport = await Connection.query(`
                    SELECT * FROM chws_reco_report c
                    WHERE c.month IN (${monthsPlaceholders})
                    AND c.year = ${yearPlaceholders}
                    AND (c.reco->>'id')::text IN (${recosPlaceholders})
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

export async function GET_RECO_MEG_REPORTS(req: Request, res: Response, next: NextFunction){
    try {
        if (1 == 1) {
            var { months, year, recos } = req.body;
            if (months && year && recos) {
                months = Array.isArray(months) ? months : [months];
                recos = Array.isArray(recos) ? recos : [recos];
                const monthsPlaceholders = months.map((_: any, i: number) => `$${i + 1}`).join(',');
                const yearPlaceholders = `$${months.length + 1}`;
                const recosPlaceholders = recos.map((_: any, i: number) => `$${months.length + 2 + i}`).join(',');
                const data: RecoMegSituationReport = await Connection.query(`
                    SELECT * FROM reco_meg_situation_report c
                    WHERE c.month IN (${monthsPlaceholders})
                    AND c.year = ${yearPlaceholders}
                    AND (c.reco->>'id')::text IN (${recosPlaceholders})
                `, [...months, year, ...recos]);
                return res.status(200).json({ status: 200, data: data });
            }
            return res.status(201).json({ status: 201, data: 'You provide empty filters' });
        }
        return res.status(201).json({ status: 201, data: 'Vous n\'êtes pas autorisé à effectuer cette action!' });
    } catch (err: any) {
        return res.status(500).json({ status: 500, data: `${err || 'Erreur Interne Du Serveur'}` });
    }
}






