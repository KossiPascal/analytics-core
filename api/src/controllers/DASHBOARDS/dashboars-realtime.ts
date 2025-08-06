import { Request, Response, NextFunction } from 'express';
import { DataSource } from 'typeorm';
import { AppDataSource } from '../../data-source';
import { ChildrenVaccines, RecoVaccinationDashboard, RecoVaccinationDashboardDbOutput } from '../../models/dashboards';

let Connection: DataSource = AppDataSource.manager.connection;

const paramettersErrorMsg = 'Les paramettres renseignés sont vides';
const notAuthorizedMsg = `Vous n'êtes pas autorisé à effectuer cette action!`;
const serverErrorMsg = (error: any) => `${error || 'Erreur Interne Du Serveur'}`;


export async function GET_RECO_VACCINATION_NOT_DONE_DASHBOARD(req: Request, res: Response, next: NextFunction) {
    try {
        var { userId, recos, fullData, sync } = req.body;
        if (!userId) return res.status(201).json({ status: 201, data: notAuthorizedMsg });

        if (!recos) return res.status(201).json({ status: 201, data: paramettersErrorMsg });
        const recosArray = Array.isArray(recos) ? recos : [recos];

        let datas: RecoVaccinationDashboardDbOutput[];

        const recosIdsList = recosArray.map((_: any, i: number) => `$${i + 1}`).join(',');
        datas = await Connection.query(`
            SELECT * FROM dashboards_reco_vaccination_not_done_view
            WHERE (reco->>'id')::text IN (${recosIdsList})
        `, [...recosArray]);

        if (fullData == true) {
            // const dataTransformed = sync === true ? datas : await TransformRecoVaccinationDashboard(datas);
            return res.status(200).json({ status: 200, data: datas });
        } else {
            let fanalData: RecoVaccinationDashboardDbOutput[] = [];

            for (const vacc of datas) {
                const vaccData = { ...vacc, children_vaccines: [] }
                for (const vc of vacc.children_vaccines) {
                    const vcData = { ...vc, data: [] };
                    for (const v of (vc.data ?? [])) {
                        // if (vaccine_VAR_2 != true) (vcData.data as RecoVaccinationDashboard[]).push(v)
                        (vcData.data as RecoVaccinationDashboard[]).push(v)
                    }
                    if (vcData.data.length > 0) (vaccData.children_vaccines as ChildrenVaccines[]).push(vcData)
                }
                if (vaccData.children_vaccines.length > 0) fanalData.push(vaccData)
            }
            // const dataTransformed = sync === true ? fanalData : await TransformRecoVaccinationDashboard(fanalData);
            return res.status(200).json({ status: 200, data: fanalData });
        }
    } catch (err: any) {
        return res.status(500).json({ status: 500, data: serverErrorMsg(err) });
    }
};

export async function GET_RECO_VACCINATION_ALL_DONE_DASHBOARD(req: Request, res: Response, next: NextFunction) {
    try {
        var { userId, recos, fullData, sync } = req.body;
        if (!userId) return res.status(201).json({ status: 201, data: notAuthorizedMsg });
        if (!recos) return res.status(201).json({ status: 201, data: paramettersErrorMsg });

        const recosArray = Array.isArray(recos) ? recos : [recos];
        const recosIdsList = recosArray.map((_: any, i: number) => `$${i + 1}`).join(',');
        let datas: RecoVaccinationDashboardDbOutput[];

        datas = await Connection.query(`
            SELECT * FROM dashboards_reco_vaccination_all_done_view
            WHERE (reco->>'id')::text IN (${recosIdsList})
        `, [...recosArray]);

        if (fullData == true) {
            // const dataTransformed = sync === true ? datas : await TransformRecoVaccinationDashboard(datas);
            return res.status(200).json({ status: 200, data: datas });
        } else {
            let fanalData: RecoVaccinationDashboardDbOutput[] = [];

            for (const vacc of datas) {
                const vaccData = { ...vacc, children_vaccines: [] }
                for (const vc of vacc.children_vaccines) {
                    const vcData = { ...vc, data: [] };
                    for (const v of (vc.data ?? [])) {
                        // if (vaccine_VAR_2 != true) (vcData.data as RecoVaccinationDashboard[]).push(v)
                        (vcData.data as RecoVaccinationDashboard[]).push(v)
                    }
                    if (vcData.data.length > 0) (vaccData.children_vaccines as ChildrenVaccines[]).push(vcData)
                }

                if (vaccData.children_vaccines.length > 0) fanalData.push(vaccData)
            }
            // const dataTransformed = sync === true ? fanalData : await TransformRecoVaccinationDashboard(fanalData);
            return res.status(200).json({ status: 200, data: fanalData });
        }
    } catch (err: any) {
        return res.status(500).json({ status: 500, data: serverErrorMsg(err) });
    }
};

export async function GET_RECO_VACCINATION_PARTIAL_DONE_DASHBOARD(req: Request, res: Response, next: NextFunction) {
    try {
        var { userId, recos, fullData, sync } = req.body;
        if (!userId) return res.status(201).json({ status: 201, data: notAuthorizedMsg });
        if (!recos) return res.status(201).json({ status: 201, data: paramettersErrorMsg });

        const recosArray = Array.isArray(recos) ? recos : [recos];

        let datas: RecoVaccinationDashboardDbOutput[];

        const recosIdsList = recosArray.map((_: any, i: number) => `$${i + 1}`).join(',');
        datas = await Connection.query(`
            SELECT * FROM dashboards_reco_vaccination_partial_done_view
            WHERE (reco->>'id')::text IN (${recosIdsList})
        `, [...recosArray]);


        if (fullData == true) {
            // const dataTransformed = sync === true ? datas : await TransformRecoVaccinationDashboard(datas);
            return res.status(200).json({ status: 200, data: datas });
        } else {
            let fanalData: RecoVaccinationDashboardDbOutput[] = [];

            for (const vacc of datas) {
                const vaccData = { ...vacc, children_vaccines: [] }
                for (const vc of vacc.children_vaccines) {
                    const vcData = { ...vc, data: [] };
                    for (const v of (vc.data ?? [])) {
                        // if (vaccine_VAR_2 != true) (vcData.data as RecoVaccinationDashboard[]).push(v)
                        (vcData.data as RecoVaccinationDashboard[]).push(v)
                    }
                    if (vcData.data.length > 0) (vaccData.children_vaccines as ChildrenVaccines[]).push(vcData)
                }

                if (vaccData.children_vaccines.length > 0) fanalData.push(vaccData)
            }
            // const dataTransformed = sync === true ? fanalData : await TransformRecoVaccinationDashboard(fanalData);
            return res.status(200).json({ status: 200, data: fanalData });
        }
    } catch (err: any) {
        return res.status(500).json({ status: 500, data: serverErrorMsg(err) });
    }
};


