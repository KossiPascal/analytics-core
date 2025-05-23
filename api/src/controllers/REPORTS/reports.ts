import { Request, Response, NextFunction } from 'express';
import { DataSource } from 'typeorm';
import { AppDataSource } from '../../data-source';
import { ChwsRecoReport, FamilyPlanningReport, HouseholdRecapReport, MorbidityReport, PcimneNewbornReport, PromotionReport, RecoMegSituationReport } from '../../models/reports';

let Connection: DataSource = AppDataSource.manager.connection;

const paramettersErrorMsg = 'Les paramettres renseignés sont vides';
const notAuthorizedMsg = `Vous n'êtes pas autorisé à effectuer cette action!`;
const serverErrorMsg = (error: any) => `${error || 'Erreur Interne Du Serveur'}`;


export async function GET_CHWS_RECO_REPORTS(req: Request, res: Response, next: NextFunction): Promise<any> {

    try {
        var { userId, months, year, recos, sync } = req.body;
        if (!userId) return res.status(201).json({ status: 201, data: notAuthorizedMsg });

        if (!months || !year || !recos) return res.status(201).json({ status: 201, data: paramettersErrorMsg });
        months = Array.isArray(months) ? months : [months];
        recos = Array.isArray(recos) ? recos : [recos];
        const monthsPlaceholders = months.map((_: any, i: number) => `$${i + 1}`).join(',');
        const yearPlaceholders = `$${months.length + 1}`;
        const recosPlaceholders = recos.map((_: any, i: number) => `$${months.length + 2 + i}`).join(',');
        const data: ChwsRecoReport[] = await Connection.query(`
            SELECT c.*, cr.* FROM reports_chws_reco_view c 
            LEFT JOIN chws_reco_report_validation cr ON cr.uid = c.id
            WHERE c.month IN (${monthsPlaceholders})
            AND c.year = ${yearPlaceholders}
            AND (c.reco->>'id')::text IN (${recosPlaceholders})
        `, [...months, year, ...recos]);

        // const dataTransformed = sync === true ? data : await TransformChwsRecoReports(data);

        return res.status(200).json({ status: 200, data: data });

    } catch (err: any) {
        return res.status(500).json({ status: 500, data: serverErrorMsg(err) });
    }
};

export async function GET_PROMOTION_REPORTS(req: Request, res: Response, next: NextFunction): Promise<any> {

    try {
        var { userId, months, year, recos, sync } = req.body;
        if (!userId) return res.status(201).json({ status: 201, data: notAuthorizedMsg });

        if (!months || !year || !recos) return res.status(201).json({ status: 201, data: paramettersErrorMsg });
        months = Array.isArray(months) ? months : [months];
        recos = Array.isArray(recos) ? recos : [recos];
        const monthsPlaceholders = months.map((_: any, i: number) => `$${i + 1}`).join(',');
        const yearPlaceholders = `$${months.length + 1}`;
        const recosPlaceholders = recos.map((_: any, i: number) => `$${months.length + 2 + i}`).join(',');

        const data: PromotionReport[] = await Connection.query(`
            SELECT p.*, cr.* FROM reports_promotional_view p
            LEFT JOIN promotion_report_validation cr ON cr.uid = p.id
            WHERE p.month IN (${monthsPlaceholders})
            AND p.year = ${yearPlaceholders}
            AND (p.reco->>'id')::text IN (${recosPlaceholders})
        `, [...months, year, ...recos]);

        // const dataTransformed = sync === true ? data : await TransformPromotionReports(data);

        return res.status(200).json({ status: 200, data: data });

    } catch (err: any) {
        return res.status(500).json({ status: 500, data: serverErrorMsg(err) });
    }
};

export async function GET_FAMILY_PLANNING_REPORTS(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
        var { userId, months, year, recos, sync } = req.body;
        if (!userId) return res.status(201).json({ status: 201, data: notAuthorizedMsg });

        if (!months || !year || !recos) return res.status(201).json({ status: 201, data: paramettersErrorMsg });
        months = Array.isArray(months) ? months : [months];
        recos = Array.isArray(recos) ? recos : [recos];
        const monthsPlaceholders = months.map((_: any, i: number) => `$${i + 1}`).join(',');
        const yearPlaceholders = `$${months.length + 1}`;
        const recosPlaceholders = recos.map((_: any, i: number) => `$${months.length + 2 + i}`).join(',');

        const data: FamilyPlanningReport[] = await Connection.query(`
            SELECT f.*, cr.* FROM reports_family_planning_view f
            LEFT JOIN family_planning_report_validation cr ON cr.uid = f.id
            WHERE f.month IN (${monthsPlaceholders})
            AND f.year = ${yearPlaceholders}
            AND (f.reco->>'id')::text IN (${recosPlaceholders})
        `, [...months, year, ...recos]);
        // const dataTransformed = sync === true ? data : await TransformFamilyPlanningReports(data);

        return res.status(200).json({ status: 200, data: data });
    } catch (err: any) {
        return res.status(500).json({ status: 500, data: serverErrorMsg(err) });
    }
};

export async function GET_MORBIDITY_REPORTS(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
        var { userId, months, year, recos, sync } = req.body;
        if (!userId) return res.status(201).json({ status: 201, data: notAuthorizedMsg });

        if (!months || !year || !recos) return res.status(201).json({ status: 201, data: paramettersErrorMsg });
        months = Array.isArray(months) ? months : [months];
        recos = Array.isArray(recos) ? recos : [recos];
        const monthsPlaceholders = months.map((_: any, i: number) => `$${i + 1}`).join(',');
        const yearPlaceholders = `$${months.length + 1}`;
        const recosPlaceholders = recos.map((_: any, i: number) => `$${months.length + 2 + i}`).join(',');
        const data: MorbidityReport[] = await Connection.query(`
            SELECT m.*, cr.* FROM reports_morbidity_view m
            LEFT JOIN morbidity_report_validation cr ON cr.uid = m.id
            WHERE m.month IN (${monthsPlaceholders})
            AND m.year = ${yearPlaceholders}
            AND (m.reco->>'id')::text IN (${recosPlaceholders})
        `, [...months, year, ...recos]);


        // const dataTransformed = sync === true ? data : await TransformMorbidityReports(data);

        return res.status(200).json({ status: 200, data: data });
    } catch (err: any) {
        return res.status(500).json({ status: 500, data: serverErrorMsg(err) });
    }
};

export async function GET_HOUSEHOLD_RECAP_REPORTS(req: Request, res: Response, next: NextFunction): Promise<any> {

    try {
        var { userId, months, year, recos, sync } = req.body;
        if (!userId) return res.status(201).json({ status: 201, data: notAuthorizedMsg });

        if (!months || !year || !recos) return res.status(201).json({ status: 201, data: paramettersErrorMsg });
        months = Array.isArray(months) ? months : [months];
        recos = Array.isArray(recos) ? recos : [recos];
        const monthsPlaceholders = months.map((_: any, i: number) => `$${i + 1}`).join(',');
        const yearPlaceholders = `$${months.length + 1}`;
        const recosPlaceholders = recos.map((_: any, i: number) => `$${months.length + 2 + i}`).join(',');
        const data: HouseholdRecapReport[] = await Connection.query(`
            SELECT h.*, cr.* FROM reports_household_view h
            LEFT JOIN household_recap_report_validation cr ON cr.uid = h.id
            WHERE h.month IN (${monthsPlaceholders})
            AND h.year = ${yearPlaceholders}
            AND (h.reco->>'id')::text IN (${recosPlaceholders})
        `, [...months, year, ...recos]);

        // const dataTransformed = sync === true ? data : await TransformHouseholdRecapReports(data);

        return res.status(200).json({ status: 200, data: data });
    } catch (err: any) {
        return res.status(500).json({ status: 500, data: serverErrorMsg(err) });
    }
};

export async function GET_PCIME_REPORTS(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
        var { userId, months, year, recos, sync } = req.body;
        if (!userId) return res.status(201).json({ status: 201, data: notAuthorizedMsg });

        if (!months || !year || !recos) return res.status(201).json({ status: 201, data: paramettersErrorMsg });
        months = Array.isArray(months) ? months : [months];
        recos = Array.isArray(recos) ? recos : [recos];
        const monthsPlaceholders = months.map((_: any, i: number) => `$${i + 1}`).join(',');
        const yearPlaceholders = `$${months.length + 1}`;
        const recosPlaceholders = recos.map((_: any, i: number) => `$${months.length + 2 + i}`).join(',');
        const data: PcimneNewbornReport[] = await Connection.query(`
            SELECT p.*, cr.* FROM reports_pcime_newborn_view p
            LEFT JOIN pcimne_newborn_report_validation cr ON cr.uid = p.id
            WHERE p.month IN (${monthsPlaceholders})
            AND p.year = ${yearPlaceholders}
            AND (p.reco->>'id')::text IN (${recosPlaceholders})
        `, [...months, year, ...recos]);

        // const dataTransformed = sync === true ? data : await TransformPcimneNewbornReports(data);

        return res.status(200).json({ status: 200, data: data });
    } catch (err: any) {
        return res.status(500).json({ status: 500, data: serverErrorMsg(err) });
    }
};

export async function GET_RECO_MEG_REPORTS(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
        var { userId, months, year, recos, sync } = req.body;
        if (!userId) return res.status(201).json({ status: 201, data: notAuthorizedMsg });

        if (!months || !year || !recos) return res.status(201).json({ status: 201, data: paramettersErrorMsg });
        months = Array.isArray(months) ? months : [months];
        recos = Array.isArray(recos) ? recos : [recos];
        const monthsPlaceholders = months.map((_: any, i: number) => `$${i + 1}`).join(',');
        const yearPlaceholders = `$${months.length + 1}`;
        const recosPlaceholders = recos.map((_: any, i: number) => `$${months.length + 2 + i}`).join(',');
        const data: RecoMegSituationReport[] = await Connection.query(`
            SELECT c.*, cr.* FROM reports_reco_meg_situation_view c
            LEFT JOIN reco_meg_situation_report_validation cr ON cr.uid = c.id
            WHERE c.month IN (${monthsPlaceholders})
            AND c.year = ${yearPlaceholders}
            AND (c.reco->>'id')::text IN (${recosPlaceholders})
        `, [...months, year, ...recos]);

        // const dataTransformed = sync === true ? data : await TransformRecoMegSituationReports(data);

        return res.status(200).json({ status: 200, data: data });
    } catch (err: any) {
        return res.status(500).json({ status: 500, data: serverErrorMsg(err) });
    }
}





