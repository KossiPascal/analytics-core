import { Request, Response, NextFunction } from 'express';
import { DataSource, getManager } from 'typeorm';
import { AppDataSource } from '../../data_source';
import { ChwsRecoReport, FamilyPlanningReport, HouseholdRecapReport, MorbidityReport, PcimneNewbornReport, PromotionReport, getChwsRecoReportRepository, getFamilyPlanningReportRepository, getHouseholdRecapReportRepository, getMorbidityReportRepository, getPcimneNewbornReportRepository, getPromotionReportRepository } from '../../entities/Reports';
let Conn: DataSource = AppDataSource.manager.connection;


export async function VALIDATE_PROMOTION_REPORTS(req: Request, res: Response, next: NextFunction) {
    try {
        var { userId, months, year, recos } = req.body;
        if (1 == 1) {
            if (userId && months && year && recos) {
                const vmonths: string[] = Array.isArray(months) ? months : [months];
                const vrecos: string[] = Array.isArray(recos) ? recos : [recos];
                const _repo = await getPromotionReportRepository();
                var errorsCount = 0;
                for (const month of vmonths) {
                    const updatePromises = vrecos.map(async reco => {
                        const dataId = `${month}-${year}-${reco}`;
                        try {
                            await _repo.update({ id: dataId }, { is_validate: true, validate_user_id: userId });
                        } catch (err) {
                            errorsCount += 1;
                            console.error(`Failed to update record with id: ${dataId}`, err);
                            throw err; // Ensure the error is thrown to be caught by outer transaction handler if needed
                        }
                    });
                    await Promise.all(updatePromises); // Wait for all updates in the current month
                }
                if (errorsCount > 0) {
                    return res.status(201).json({ status: 201, data: 'error found' });
                }
                return res.status(200).json({ status: 200, data: 'success' });

            }
            return res.status(201).json({ status: 201, data: 'You provide empty filters' });
        }
        return res.status(201).json({ status: 201, data: 'not autorized' });
    } catch (err: any) {
        return res.status(500).json({ status: 500, data: `${err || 'Internal Server Error'}` });
    }
};

export async function VALIDATE_FAMILY_PLANNING_REPORTS(req: Request, res: Response, next: NextFunction) {
    try {
        var { userId, months, year, recos } = req.body;
        if (1 == 1) {
            if (months && year && recos) {
                const vmonths: string[] = Array.isArray(months) ? months : [months];
                const vrecos: string[] = Array.isArray(recos) ? recos : [recos];
                const _repo = await getFamilyPlanningReportRepository();
                var errorsCount = 0;
                for (const month of vmonths) {
                    const updatePromises = vrecos.map(async reco => {
                        const dataId = `${month}-${year}-${reco}`;
                        try {
                            await _repo.update({ id: dataId }, { is_validate: true, validate_user_id: userId });
                        } catch (err) {
                            errorsCount += 1;
                            console.error(`Failed to update record with id: ${dataId}`, err);
                            throw err; // Ensure the error is thrown to be caught by outer transaction handler if needed
                        }
                    });
                    await Promise.all(updatePromises); // Wait for all updates in the current month
                }
                if (errorsCount > 0) {
                    return res.status(201).json({ status: 201, data: 'error found' });
                }
                return res.status(200).json({ status: 200, data: 'success' });
            }
            return res.status(201).json({ status: 201, data: 'You provide empty filters' });
        }
        return res.status(201).json({ status: 201, data: 'not autorized' });
    } catch (err: any) {
        return res.status(500).json({ status: 500, data: `${err || 'Internal Server Error'}` });
    }
};

export async function VALIDATE_MORBIDITY_REPORTS(req: Request, res: Response, next: NextFunction) {
    try {
        var { userId, months, year, recos } = req.body;
        if (1 == 1) {
            if (months && year && recos) {
                const vmonths: string[] = Array.isArray(months) ? months : [months];
                const vrecos: string[] = Array.isArray(recos) ? recos : [recos];
                const _repo = await getMorbidityReportRepository();
                var errorsCount = 0;
                for (const month of vmonths) {
                    const updatePromises = vrecos.map(async reco => {
                        const dataId = `${month}-${year}-${reco}`;
                        try {
                            await _repo.update({ id: dataId }, { is_validate: true, validate_user_id: userId });
                        } catch (err) {
                            errorsCount += 1;
                            console.error(`Failed to update record with id: ${dataId}`, err);
                            throw err; // Ensure the error is thrown to be caught by outer transaction handler if needed
                        }
                    });
                    await Promise.all(updatePromises); // Wait for all updates in the current month
                }
                if (errorsCount > 0) {
                    return res.status(201).json({ status: 201, data: 'error found' });
                }
                return res.status(200).json({ status: 200, data: 'success' });
            }
            return res.status(201).json({ status: 201, data: 'You provide empty filters' });
        }
        return res.status(201).json({ status: 201, data: 'not autorized' });
    } catch (err: any) {
        return res.status(500).json({ status: 500, data: `${err || 'Internal Server Error'}` });
    }
};

export async function VALIDATE_HOUSEHOLD_RECAP_REPORTS(req: Request, res: Response, next: NextFunction) {
    try {
        var { userId, months, year, recos, dataIds } = req.body;

        if (1 == 1) {
            if (months && year && recos && dataIds) {
                // const vMonths: string[] = Array.isArray(months) ? months : [months];
                // const vRecos: string[] = Array.isArray(recos) ? recos : [recos];
                const vDataIds: string[] = Array.isArray(dataIds) ? dataIds : [dataIds];
                const _repo = await getHouseholdRecapReportRepository();
                var errorsCount = 0;
                // for (const month of vMonths) {
                    const updatePromises = vDataIds.map(async dataId => {
                        // const dataId = `${month}-${year}-${reco}`;
                        try {
                            await _repo.update({ id: dataId }, { is_validate: true, validate_user_id: userId });
                        } catch (err) {
                            errorsCount += 1;
                            console.error(`Failed to update record with id: ${dataId}`, err);
                            throw err; // Ensure the error is thrown to be caught by outer transaction handler if needed
                        }
                    });
                    await Promise.all(updatePromises); // Wait for all updates in the current month
                // }
                if (errorsCount > 0) {
                    return res.status(201).json({ status: 201, data: 'error found' });
                }
                return res.status(200).json({ status: 200, data: 'success' });
            }
            return res.status(201).json({ status: 201, data: 'You provide empty filters' });
        }
        return res.status(201).json({ status: 201, data: 'not autorized' });
    } catch (err: any) {
        return res.status(500).json({ status: 500, data: `${err || 'Internal Server Error'}` });
    }
};

export async function VALIDATE_PCIME_REPORTS(req: Request, res: Response, next: NextFunction) {
    try {
        var { userId, months, year, recos } = req.body;
        if (1 == 1) {
            if (months && year && recos) {
                const vmonths: string[] = Array.isArray(months) ? months : [months];
                const vrecos: string[] = Array.isArray(recos) ? recos : [recos];
                const _repo = await getPcimneNewbornReportRepository();
                var errorsCount = 0;
                for (const month of vmonths) {
                    const updatePromises = vrecos.map(async reco => {
                        const dataId = `${month}-${year}-${reco}`;
                        try {
                            await _repo.update({ id: dataId }, { is_validate: true, validate_user_id: userId });
                        } catch (err) {
                            errorsCount += 1;
                            console.error(`Failed to update record with id: ${dataId}`, err);
                            throw err; // Ensure the error is thrown to be caught by outer transaction handler if needed
                        }
                    });
                    await Promise.all(updatePromises); // Wait for all updates in the current month
                }
                if (errorsCount > 0) {
                    return res.status(201).json({ status: 201, data: 'error found' });
                }
                return res.status(200).json({ status: 200, data: 'success' });
            }
            return res.status(201).json({ status: 201, data: 'You provide empty filters' });
        }
        return res.status(201).json({ status: 201, data: 'not autorized' });
    } catch (err: any) {
        return res.status(500).json({ status: 500, data: `${err || 'Internal Server Error'}` });
    }
};

export async function VALIDATE_CHWS_RECO_REPORTS(req: Request, res: Response, next: NextFunction) {
    try {
        var { userId, months, year, recos } = req.body;
        if (1 == 1) {
            if (months && year && recos) {
                const vmonths: string[] = Array.isArray(months) ? months : [months];
                const vrecos: string[] = Array.isArray(recos) ? recos : [recos];
                const _repo = await getChwsRecoReportRepository();
                var errorsCount = 0;
                for (const month of vmonths) {
                    const updatePromises = vrecos.map(async reco => {
                        const dataId = `${month}-${year}-${reco}`;
                        try {
                            await _repo.update({ id: dataId }, { is_validate: true, validate_user_id: userId });
                        } catch (err) {
                            errorsCount += 1;
                            console.error(`Failed to update record with id: ${dataId}`, err);
                            throw err; // Ensure the error is thrown to be caught by outer transaction handler if needed
                        }
                    });
                    await Promise.all(updatePromises); // Wait for all updates in the current month
                }
                if (errorsCount > 0) {
                    return res.status(201).json({ status: 201, data: 'error found' });
                }
                return res.status(200).json({ status: 200, data: 'success' });
            }
            return res.status(201).json({ status: 201, data: 'You provide empty filters' });
        }
        return res.status(201).json({ status: 201, data: 'not autorized' });
    } catch (err: any) {
        return res.status(500).json({ status: 500, data: `${err || 'Internal Server Error'}` });
    }
};




