import { Request, Response, NextFunction } from 'express';
import { getPromotionReportValidationRepository, getFamilyPlanningReportValidationRepository, getMorbidityReportValidationRepository, getHouseholdRecapReportValidationRepository, getPcimneNewbornReportValidationRepository, getChwsRecoReportValidationRepository, getRecoMegSituationReportValidationRepository, PromotionReportValidation, FamilyPlanningReportValidation, MorbidityReportValidation, HouseholdRecapReportValidation, PcimneNewbornReportValidation, ChwsRecoReportValidation, RecoMegSituationReportValidation } from '../../../entities/Validated-reports';


const paramettersErrorMsg = 'Les paramettres renseignés sont vides';
const notAuthorizedMsg = `Vous n'êtes pas autorisé à effectuer cette action!`;
const serverErrorMsg = (error: any) => `${error || 'Erreur Interne Du Serveur'}`;


export async function CANCEL_VALIDATE_PROMOTION_REPORTS(req: Request, res: Response, next: NextFunction) {
    try {
        var { userId, months, year, recos } = req.body;

        if (!userId) return res.status(201).json({ status: 201, data: notAuthorizedMsg });
        if (!months || !year || !recos) return res.status(201).json({ status: 201, data: paramettersErrorMsg });

        const vmonths: string[] = Array.isArray(months) ? months : [months];
        const vrecos: string[] = Array.isArray(recos) ? recos : [recos];
        const _repo = await getPromotionReportValidationRepository();
        var errorsCount = 0;
        for (const month of vmonths) {
            const updatePromises = vrecos.map(async reco => {
                const dataId = `${month}-${year}-${reco}`;
                try {
                    let dataToSave = await _repo.findOneBy({ uid: dataId })
                    if (!dataToSave) dataToSave = new PromotionReportValidation();
                    dataToSave.uid = dataId;
                    dataToSave.is_validate = false;
                    dataToSave.canceled_by = userId;
                    dataToSave.canceled_at = new Date().toISOString();
                    await _repo.save(dataToSave);
                } catch (err) {
                    errorsCount += 1;
                    console.error(`Failed to cancel update record with id: ${dataId}`, err);
                    throw err; // Ensure the error is thrown to be caught by outer transaction handler if needed
                }
            });
            await Promise.all(updatePromises); // Wait for all updates in the current month
        }
        if (errorsCount > 0) return res.status(201).json({ status: 201, data: 'error found' });
        return res.status(200).json({ status: 200, data: 'success' });
    } catch (err: any) {
        return res.status(500).json({ status: 500, data: serverErrorMsg(err) });
    }
}

export async function CANCEL_VALIDATE_FAMILY_PLANNING_REPORTS(req: Request, res: Response, next: NextFunction) {
    try {
        var { userId, months, year, recos } = req.body;

        if (!userId) return res.status(201).json({ status: 201, data: notAuthorizedMsg });
        if (!months || !year || !recos) return res.status(201).json({ status: 201, data: paramettersErrorMsg });

        const vmonths: string[] = Array.isArray(months) ? months : [months];
        const vrecos: string[] = Array.isArray(recos) ? recos : [recos];
        const _repo = await getFamilyPlanningReportValidationRepository();
        var errorsCount = 0;
        for (const month of vmonths) {
            const updatePromises = vrecos.map(async reco => {
                const dataId = `${month}-${year}-${reco}`;
                try {
                    let dataToSave = await _repo.findOneBy({ uid: dataId })
                    if (!dataToSave) dataToSave = new FamilyPlanningReportValidation();
                    dataToSave.uid = dataId;
                    dataToSave.is_validate = false;
                    dataToSave.canceled_by = userId;
                    dataToSave.canceled_at = new Date().toISOString();
                    await _repo.save(dataToSave);
                } catch (err) {
                    errorsCount += 1;
                    console.error(`Failed to cancel update record with id: ${dataId}`, err);
                    throw err; // Ensure the error is thrown to be caught by outer transaction handler if needed
                }
            });
            await Promise.all(updatePromises); // Wait for all updates in the current month
        }
        if (errorsCount > 0) return res.status(201).json({ status: 201, data: 'error found' });
        return res.status(200).json({ status: 200, data: 'success' });
    } catch (err: any) {
        return res.status(500).json({ status: 500, data: serverErrorMsg(err) });
    }
}

export async function CANCEL_VALIDATE_MORBIDITY_REPORTS(req: Request, res: Response, next: NextFunction) {
    try {
        var { userId, months, year, recos } = req.body;

        if (!userId) return res.status(201).json({ status: 201, data: notAuthorizedMsg });
        if (!months || !year || !recos) return res.status(201).json({ status: 201, data: paramettersErrorMsg });

        const vmonths: string[] = Array.isArray(months) ? months : [months];
        const vrecos: string[] = Array.isArray(recos) ? recos : [recos];
        const _repo = await getMorbidityReportValidationRepository();
        var errorsCount = 0;
        for (const month of vmonths) {
            const updatePromises = vrecos.map(async reco => {
                const dataId = `${month}-${year}-${reco}`;
                try {
                    let dataToSave = await _repo.findOneBy({ uid: dataId })
                    if (!dataToSave) dataToSave = new MorbidityReportValidation();
                    dataToSave.uid = dataId;
                    dataToSave.is_validate = false;
                    dataToSave.canceled_by = userId;
                    dataToSave.canceled_at = new Date().toISOString();
                    await _repo.save(dataToSave);
                } catch (err) {
                    errorsCount += 1;
                    console.error(`Failed to cancel update record with id: ${dataId}`, err);
                    throw err; // Ensure the error is thrown to be caught by outer transaction handler if needed
                }
            });
            await Promise.all(updatePromises); // Wait for all updates in the current month
        }
        if (errorsCount > 0) return res.status(201).json({ status: 201, data: 'error found' });
        return res.status(200).json({ status: 200, data: 'success' });
    } catch (err: any) {
        return res.status(500).json({ status: 500, data: serverErrorMsg(err) });
    }
}

export async function CANCEL_VALIDATE_HOUSEHOLD_RECAP_REPORTS(req: Request, res: Response, next: NextFunction) {
    try {
        var { userId, months, year, recos, dataIds } = req.body;

        if (!userId) return res.status(201).json({ status: 201, data: notAuthorizedMsg });
        if (!months || !year || !recos || !dataIds) return res.status(201).json({ status: 201, data: paramettersErrorMsg });

        // const vMonths: string[] = Array.isArray(months) ? months : [months];
        // const vRecos: string[] = Array.isArray(recos) ? recos : [recos];
        const vDataIds: string[] = Array.isArray(dataIds) ? dataIds : [dataIds];
        const _repo = await getHouseholdRecapReportValidationRepository();
        var errorsCount = 0;
        // for (const month of vMonths) {
        const updatePromises = vDataIds.map(async dataId => {
            // const dataId = `${month}-${year}-${reco}`;
            try {
                let dataToSave = await _repo.findOneBy({ uid: dataId })
                if (!dataToSave) {
                    dataToSave = new HouseholdRecapReportValidation();
                }
                dataToSave.uid = dataId;
                dataToSave.is_validate = false;
                dataToSave.canceled_by = userId;
                dataToSave.canceled_at = new Date().toISOString();
                await _repo.save(dataToSave);
            } catch (err) {
                errorsCount += 1;
                console.error(`Failed to cancel update record with id: ${dataId}`, err);
                throw err; // Ensure the error is thrown to be caught by outer transaction handler if needed
            }
        });
        await Promise.all(updatePromises); // Wait for all updates in the current month
        // }
        if (errorsCount > 0) return res.status(201).json({ status: 201, data: 'error found' });
        return res.status(200).json({ status: 200, data: 'success' });
    } catch (err: any) {
        return res.status(500).json({ status: 500, data: serverErrorMsg(err) });
    }
}

export async function CANCEL_VALIDATE_PCIME_REPORTS(req: Request, res: Response, next: NextFunction) {
    try {
        var { userId, months, year, recos } = req.body;

        if (!userId) return res.status(201).json({ status: 201, data: notAuthorizedMsg });
        if (!months || !year || !recos) return res.status(201).json({ status: 201, data: paramettersErrorMsg });

        const vmonths: string[] = Array.isArray(months) ? months : [months];
        const vrecos: string[] = Array.isArray(recos) ? recos : [recos];
        const _repo = await getPcimneNewbornReportValidationRepository();
        var errorsCount = 0;
        for (const month of vmonths) {
            const updatePromises = vrecos.map(async reco => {
                const dataId = `${month}-${year}-${reco}`;
                try {
                    let dataToSave = await _repo.findOneBy({ uid: dataId })
                    if (!dataToSave) dataToSave = new PcimneNewbornReportValidation();
                    dataToSave.uid = dataId;
                    dataToSave.is_validate = false;
                    dataToSave.canceled_by = userId;
                    dataToSave.canceled_at = new Date().toISOString();
                    await _repo.save(dataToSave);
                } catch (err) {
                    errorsCount += 1;
                    console.error(`Failed to cancel update record with id: ${dataId}`, err);
                    throw err; // Ensure the error is thrown to be caught by outer transaction handler if needed
                }
            });
            await Promise.all(updatePromises); // Wait for all updates in the current month
        }
        if (errorsCount > 0) return res.status(201).json({ status: 201, data: 'error found' });
        return res.status(200).json({ status: 200, data: 'success' });
    } catch (err: any) {
        return res.status(500).json({ status: 500, data: serverErrorMsg(err) });
    }
}

export async function CANCEL_VALIDATE_CHWS_RECO_REPORTS(req: Request, res: Response, next: NextFunction) {
    try {
        var { userId, months, year, recos } = req.body;

        if (!userId) return res.status(201).json({ status: 201, data: notAuthorizedMsg });
        if (!months || !year || !recos) return res.status(201).json({ status: 201, data: paramettersErrorMsg });

        const vmonths: string[] = Array.isArray(months) ? months : [months];
        const vrecos: string[] = Array.isArray(recos) ? recos : [recos];
        const _repo = await getChwsRecoReportValidationRepository();
        var errorsCount = 0;
        for (const month of vmonths) {
            const updatePromises = vrecos.map(async reco => {
                const dataId = `${month}-${year}-${reco}`;
                try {
                    let dataToSave = await _repo.findOneBy({ uid: dataId })
                    if (!dataToSave) dataToSave = new ChwsRecoReportValidation();
                    dataToSave.uid = dataId;
                    dataToSave.is_validate = false;
                    dataToSave.canceled_by = userId;
                    dataToSave.canceled_at = new Date().toISOString();
                    await _repo.save(dataToSave);
                } catch (err) {
                    errorsCount += 1;
                    console.error(`Failed to cancel update record with id: ${dataId}`, err);
                    throw err; // Ensure the error is thrown to be caught by outer transaction handler if needed
                }
            });
            await Promise.all(updatePromises); // Wait for all updates in the current month
        }
        if (errorsCount > 0) return res.status(201).json({ status: 201, data: 'error found' });
        return res.status(200).json({ status: 200, data: 'success' });
    } catch (err: any) {
        return res.status(500).json({ status: 500, data: serverErrorMsg(err) });
    }
}

export async function CANCEL_VALIDATE_RECO_MEG_REPORTS(req: Request, res: Response, next: NextFunction) {
    try {
        var { userId, months, year, recos } = req.body;

        if (!userId) return res.status(201).json({ status: 201, data: notAuthorizedMsg });
        if (!months || !year || !recos) return res.status(201).json({ status: 201, data: paramettersErrorMsg });

        const vmonths: string[] = Array.isArray(months) ? months : [months];
        const vrecos: string[] = Array.isArray(recos) ? recos : [recos];

        const _repo = await getRecoMegSituationReportValidationRepository();
        var errorsCount = 0;
        for (const month of vmonths) {
            const updatePromises = vrecos.map(async reco => {
                const dataId = `${month}-${year}-${reco}`;
                try {
                    let dataToSave = await _repo.findOneBy({ uid: dataId })
                    if (!dataToSave) dataToSave = new RecoMegSituationReportValidation();
                    dataToSave.uid = dataId;
                    dataToSave.is_validate = false;
                    dataToSave.canceled_by = userId;
                    dataToSave.canceled_at = new Date().toISOString();
                    await _repo.save(dataToSave);
                } catch (err) {
                    errorsCount += 1;
                    console.error(`Failed to cancel update record with id: ${dataId}`, err);
                    throw err; // Ensure the error is thrown to be caught by outer transaction handler if needed
                }
            });
            await Promise.all(updatePromises); // Wait for all updates in the current month
        }
        if (errorsCount > 0) return res.status(201).json({ status: 201, data: 'error found' });
        return res.status(200).json({ status: 200, data: 'success' });
    } catch (err: any) {
        return res.status(500).json({ status: 500, data: serverErrorMsg(err) });
    }
}

