import { NextFunction, Request, Response } from "express";
import axios from 'axios';
import { ChwsRecoReport, FamilyPlanningReport, HouseholdRecapReport, MorbidityReport, PcimneNewbornReport, PromotionReport, RecoMegSituationReport } from "../../models/reports";
import { APP_ENV } from "../../providers/constantes";
import { notEmpty } from "../../functions/functions";

const { NODE_ENV, DHIS2_USER, DHIS2_PASS, DHIS2_PROD_HOST, DHIS2_DEV_HOST, DHIS2_PROTOCOL } = APP_ENV;

// Define the structure of the data value
export interface DataValueSet {
    dataSet: string,
    period: string,
    orgUnit: string,
    completeDate?: string,
    attributeOptionCombo?: string,
    followup?: boolean
    dataValues: {
        dataElement: string,
        categoryOptionCombo: string,
        value: number,
        comment?: string
    }[]
}

export async function SEND_MONTHLY_ACTIVITIES_TO_DHIS2(req: Request, res: Response, next: NextFunction) {
    const { userId, months, year, recos, data, period, orgunit, username, password } = req.body;
    const dataToSend = data as ChwsRecoReport;
    let dataValueSet: DataValueSet | undefined = undefined;
    if (notEmpty(orgunit)) {
        dataValueSet = {
            dataSet: '',
            period: period ? `${period.year}${period.month}` : `${dataToSend.year}${dataToSend.month}`,
            orgUnit: orgunit,
            dataValues: [
                {
                    dataElement: 'reLr94WLodi',
                    categoryOptionCombo: 'mkALVXEOmPV',
                    value: 0
                },
            ]
        };
    }

    SEND_TO_DHIS2_UTILS({
        res: res, dataValueSet: dataValueSet, username: username, password: password, errorsCount: 0, afterSuccess: async () => {
            var errorsCount = 0;
            // if (userId && months && year && recos) {
            //     const vmonths: string[] = Array.isArray(months) ? months : [months];
            //     const vrecos: string[] = Array.isArray(recos) ? recos : [recos];
            //     const _repo = await getChwsRecoReportRepository();
            //     for (const month of vmonths) {
            //         const updatePromises = vrecos.map(async reco => {
            //             const dataId = `${month}-${year}-${reco}`;
            //             try {
            //                 await _repo.update({ id: dataId }, { already_on_dhis2: true, already_on_dhis2_user_id: userId, already_on_dhis2_at: new Date().toISOString() });
            //             } catch (err) {
            //                 errorsCount += 1;
            //                 console.error(`Failed to update record with id: ${dataId}`, err);
            //                 throw err; // Ensure the error is thrown to be caught by outer transaction handler if needed
            //             }
            //         });
            //         await Promise.all(updatePromises); // Wait for all updates in the current month
            //     }
            // } else {
            //     errorsCount = 1;
            // }
            return errorsCount;
        },
    })
}

export async function SEND_FAMILY_PLANNING_ACTIVITIES_TO_DHIS2(req: Request, res: Response, next: NextFunction) {
    const { userId, months, year, recos, data, period, orgunit, username, password } = req.body;
    const dataToSend = data as FamilyPlanningReport;
    let dataValueSet: DataValueSet | undefined = undefined;
    if (notEmpty(orgunit)) {
        dataValueSet = {
            dataSet: '',
            period: period ? `${period.year}${period.month}` : `${dataToSend.year}${dataToSend.month}`,
            orgUnit: orgunit,
            dataValues: [
                {
                    dataElement: 'reLr94WLodi',
                    categoryOptionCombo: 'mkALVXEOmPV',
                    value: 0
                },
            ]
        };
    }

    SEND_TO_DHIS2_UTILS({
        res: res, dataValueSet: dataValueSet, username: username, password: password, errorsCount: 0, afterSuccess: async () => {
            var errorsCount = 0;
            // if (userId && months && year && recos) {
            //     const vmonths: string[] = Array.isArray(months) ? months : [months];
            //     const vrecos: string[] = Array.isArray(recos) ? recos : [recos];
            //     const _repo = await getFamilyPlanningReportRepository();
            //     for (const month of vmonths) {
            //         const updatePromises = vrecos.map(async reco => {
            //             const dataId = `${month}-${year}-${reco}`;
            //             try {
            //                 await _repo.update({ id: dataId }, { already_on_dhis2: true, already_on_dhis2_user_id: userId, already_on_dhis2_at: new Date().toISOString() });
            //             } catch (err) {
            //                 errorsCount += 1;
            //                 console.error(`Failed to update record with id: ${dataId}`, err);
            //                 throw err; // Ensure the error is thrown to be caught by outer transaction handler if needed
            //             }
            //         });
            //         await Promise.all(updatePromises); // Wait for all updates in the current month
            //     }
            // } else {
            //     errorsCount = 1;
            // }
            return errorsCount;
        },
    })

}

export async function SEND_HOUSEHOLD_ACTIVITIES_TO_DHIS2(req: Request, res: Response, next: NextFunction) {
    const { userId, months, year, recos, data, period, orgunit, username, password } = req.body;
    const dataToSend = data as HouseholdRecapReport;
    let dataValueSet: DataValueSet | undefined = undefined;
    if (notEmpty(orgunit)) {
        dataValueSet = {
            dataSet: '',
            period: period ? `${period.year}${period.month}` : `${dataToSend.year}${dataToSend.month}`,
            orgUnit: orgunit,
            dataValues: [
                {
                    dataElement: 'reLr94WLodi',
                    categoryOptionCombo: 'mkALVXEOmPV',
                    value: 0
                },
            ]
        };
    }

    SEND_TO_DHIS2_UTILS({
        res: res, dataValueSet: dataValueSet, username: username, password: password, errorsCount: 0, afterSuccess: async () => {
            var errorsCount = 0;
            // if (userId && months && year && recos) {
            //     const vmonths: string[] = Array.isArray(months) ? months : [months];
            //     const vrecos: string[] = Array.isArray(recos) ? recos : [recos];
            //     const _repo = await getHouseholdRecapReportRepository();
            //     for (const month of vmonths) {
            //         const updatePromises = vrecos.map(async reco => {
            //             const dataId = `${month}-${year}-${reco}`;
            //             try {
            //                 await _repo.update({ id: dataId }, { already_on_dhis2: true, already_on_dhis2_user_id: userId, already_on_dhis2_at: new Date().toISOString() });
            //             } catch (err) {
            //                 errorsCount += 1;
            //                 console.error(`Failed to update record with id: ${dataId}`, err);
            //                 throw err; // Ensure the error is thrown to be caught by outer transaction handler if needed
            //             }
            //         });
            //         await Promise.all(updatePromises); // Wait for all updates in the current month
            //     }
            // } else {
            //     errorsCount = 1;
            // }
            return errorsCount;
        },
    })
}

export async function SEND_MORBIDITY_ACTIVITIES_TO_DHIS2(req: Request, res: Response, next: NextFunction) {
    const { userId, months, year, recos, data, period, orgunit, username, password } = req.body;
    const dataToSend = data as MorbidityReport;
    let dataValueSet: DataValueSet | undefined = undefined;
    if (notEmpty(orgunit)) {
        dataValueSet = {
            dataSet: '',
            period: period ? `${period.year}${period.month}` : `${dataToSend.year}${dataToSend.month}`,
            orgUnit: orgunit,
            dataValues: [
                {
                    dataElement: 'reLr94WLodi',
                    categoryOptionCombo: 'mkALVXEOmPV',
                    value: 0
                },
            ]
        };
    }

    SEND_TO_DHIS2_UTILS({
        res: res, dataValueSet: dataValueSet, username: username, password: password, errorsCount: 0, afterSuccess: async () => {
            var errorsCount = 0;
            // if (userId && months && year && recos) {
            //     const vmonths: string[] = Array.isArray(months) ? months : [months];
            //     const vrecos: string[] = Array.isArray(recos) ? recos : [recos];
            //     const _repo = await getMorbidityReportRepository();
            //     for (const month of vmonths) {
            //         const updatePromises = vrecos.map(async reco => {
            //             const dataId = `${month}-${year}-${reco}`;
            //             try {
            //                 await _repo.update({ id: dataId }, { already_on_dhis2: true, already_on_dhis2_user_id: userId, already_on_dhis2_at: new Date().toISOString() });
            //             } catch (err) {
            //                 errorsCount += 1;
            //                 console.error(`Failed to update record with id: ${dataId}`, err);
            //                 throw err; // Ensure the error is thrown to be caught by outer transaction handler if needed
            //             }
            //         });
            //         await Promise.all(updatePromises); // Wait for all updates in the current month
            //     }
            // } else {
            //     errorsCount = 1;
            // }
            return errorsCount;
        },
    })
}

export async function SEND_PCIMNE_NEWBORN_ACTIVITIES_TO_DHIS2(req: Request, res: Response, next: NextFunction) {
    const { userId, months, year, recos, data, period, orgunit, username, password } = req.body;
    const dataToSend = data as PcimneNewbornReport;
    let dataValueSet: DataValueSet | undefined = undefined;
    if (notEmpty(orgunit)) {
        dataValueSet = {
            dataSet: '',
            period: period ? `${period.year}${period.month}` : `${dataToSend.year}${dataToSend.month}`,
            orgUnit: orgunit,
            dataValues: [
                {
                    dataElement: 'reLr94WLodi',
                    categoryOptionCombo: 'mkALVXEOmPV',
                    value: 0
                },
            ]
        };
    }

    SEND_TO_DHIS2_UTILS({
        res: res, dataValueSet: dataValueSet, username: username, password: password, errorsCount: 0, afterSuccess: async () => {
            var errorsCount = 0;
            // if (userId && months && year && recos) {
            //     const vmonths: string[] = Array.isArray(months) ? months : [months];
            //     const vrecos: string[] = Array.isArray(recos) ? recos : [recos];
            //     const _repo = await getPcimneNewbornReportRepository();
            //     for (const month of vmonths) {
            //         const updatePromises = vrecos.map(async reco => {
            //             const dataId = `${month}-${year}-${reco}`;
            //             try {
            //                 await _repo.update({ id: dataId }, { already_on_dhis2: true, already_on_dhis2_user_id: userId, already_on_dhis2_at: new Date().toISOString() });
            //             } catch (err) {
            //                 errorsCount += 1;
            //                 console.error(`Failed to update record with id: ${dataId}`, err);
            //                 throw err; // Ensure the error is thrown to be caught by outer transaction handler if needed
            //             }
            //         });
            //         await Promise.all(updatePromises); // Wait for all updates in the current month
            //     }
            // } else {
            //     errorsCount = 1;
            // }
            return errorsCount;
        },
    })
}

export async function SEND_PROMOTONAL_ACTIVITIES_TO_DHIS2(req: Request, res: Response, next: NextFunction) {
    const { userId, months, year, recos, data, period, orgunit, username, password } = req.body;

    let dataToSend = data as PromotionReport;
    let dataValueSet: DataValueSet | undefined = undefined;

    if (notEmpty(orgunit)) {
        dataValueSet = {
            dataSet: 'eZqfjbGcX0A',
            period: period ? `${period.year}${period.month}` : `${dataToSend.year}${dataToSend.month}`,
            orgUnit: orgunit ?? 'erdjSX8MtGO',
            completeDate: "2024-12-03",
            dataValues: []
            // dataValues: [
            //     {
            //         dataElement: 'reLr94WLodi',
            //         categoryOptionCombo: 'mkALVXEOmPV', //Paludisme VAD, Féminin
            //         value: dataToSend.malaria_nbr_touched_by_VAD_F,
            //         comment: 'Paludisme VAD, Féminin'
            //     },
            //     {
            //         dataElement: 'reLr94WLodi',
            //         categoryOptionCombo: 'nNLrVZLxiPp', //Paludisme CE, Féminin
            //         value: dataToSend.malaria_nbr_touched_by_CE_F,
            //         comment: 'Paludisme CE, Féminin'
            //     },
            //     {
            //         dataElement: 'reLr94WLodi',
            //         categoryOptionCombo: 'TSV3DpdA7w9', //Paludisme Total, Féminin
            //         value: dataToSend.malaria_nbr_total_F,
            //         comment: ''
            //     },
            //     {
            //         dataElement: 'reLr94WLodi',
            //         categoryOptionCombo: 'eNSkQa5sZHi', //Paludisme VAD, Masculin
            //         value: dataToSend.malaria_nbr_touched_by_VAD_M,
            //         comment: ''
            //     },
            //     {
            //         dataElement: 'reLr94WLodi',
            //         categoryOptionCombo: 'f3r3iJeHc6u', //Paludisme CE, Masculin
            //         value: dataToSend.malaria_nbr_touched_by_CE_M,
            //         comment: ''
            //     },
            //     {
            //         dataElement: 'reLr94WLodi',
            //         categoryOptionCombo: 'PzLTFGsCfaD', //Paludisme Total, Masculin
            //         value: dataToSend.malaria_nbr_total_M,
            //         comment: ''
            //     },
            //     {
            //         dataElement: 'ZbwvBYb5QIF',
            //         categoryOptionCombo: 'QJ6Zh1w9Ixo', //Vaccination VAD, Féminin
            //         value: dataToSend.vaccination_nbr_touched_by_VAD_F,
            //         comment: ''
            //     },
            //     {
            //         dataElement: 'ZbwvBYb5QIF',
            //         categoryOptionCombo: 'FE24CbxVovJ', //Vaccination CE, Féminin
            //         value: dataToSend.vaccination_nbr_touched_by_CE_F,
            //         comment: ''
            //     },
            //     {
            //         dataElement: 'ZbwvBYb5QIF',
            //         categoryOptionCombo: 'Lcca81MKeqs', //Vaccination Total, Féminin
            //         value: dataToSend.vaccination_nbr_total_F,
            //         comment: ''
            //     },
            //     {
            //         dataElement: 'ZbwvBYb5QIF',
            //         categoryOptionCombo: 'usCbYR0Wy5X', //Vaccination VAD, Masculin
            //         value: dataToSend.vaccination_nbr_touched_by_VAD_M,
            //         comment: ''
            //     },
            //     {
            //         dataElement: 'ZbwvBYb5QIF',
            //         categoryOptionCombo: 'I6G9oRI644m', //Vaccination CE, Masculin
            //         value: dataToSend.vaccination_nbr_touched_by_CE_M,
            //         comment: ''
            //     },
            //     {
            //         dataElement: 'ZbwvBYb5QIF',
            //         categoryOptionCombo: 'kbqK0cKDJmZ', //Vaccination Total, Masculin
            //         value: dataToSend.vaccination_nbr_total_M,
            //         comment: ''
            //     },
            //     {
            //         dataElement: 'HHtuWuObqJi',
            //         categoryOptionCombo: 'n7ULwnhPmAr', //Santé Enfant VAD, Féminin
            //         value: dataToSend.child_health_nbr_touched_by_VAD_F,
            //         comment: ''
            //     },
            //     {
            //         dataElement: 'HHtuWuObqJi',
            //         categoryOptionCombo: 'aiwbLdNLhzg', //Santé Enfant CE, Féminin
            //         value: dataToSend.child_health_nbr_touched_by_CE_F,
            //         comment: ''
            //     },
            //     {
            //         dataElement: 'HHtuWuObqJi',
            //         categoryOptionCombo: 'pYRwaQnYl5u', //Santé Enfant Total, Féminin
            //         value: dataToSend.child_health_nbr_total_F,
            //         comment: ''
            //     },
            //     {
            //         dataElement: 'HHtuWuObqJi',
            //         categoryOptionCombo: 'vW8kmzUHqwp', //Santé Enfant VAD, Masculin
            //         value: dataToSend.child_health_nbr_touched_by_VAD_M,
            //         comment: ''
            //     },
            //     {
            //         dataElement: 'HHtuWuObqJi',
            //         categoryOptionCombo: 'AhtXoBVIobA', //Santé Enfant CE, Masculin
            //         value: dataToSend.child_health_nbr_touched_by_CE_M,
            //         comment: ''
            //     },
            //     {
            //         dataElement: 'HHtuWuObqJi',
            //         categoryOptionCombo: 'T9gCslKL4Ls', //Santé Enfant Total, Masculin
            //         value: dataToSend.child_health_nbr_total_M,
            //         comment: ''
            //     },
            //     {
            //         dataElement: 'ChfBVpGkz5M',
            //         categoryOptionCombo: 'NK69VuTWywA', //CPN/CPoN VAD, Féminin
            //         value: dataToSend.cpn_cpon_nbr_touched_by_VAD_F,
            //         comment: ''
            //     },
            //     {
            //         dataElement: 'ChfBVpGkz5M',
            //         categoryOptionCombo: 'liQvAH9VUVE', //CPN/CPoN CE, Féminin
            //         value: dataToSend.cpn_cpon_nbr_touched_by_CE_F,
            //         comment: ''
            //     },
            //     {
            //         dataElement: 'ChfBVpGkz5M',
            //         categoryOptionCombo: 'nDEFyvuYzdu', //CPN/CPoN Total, Féminin
            //         value: dataToSend.cpn_cpon_nbr_total_F,
            //         comment: ''
            //     },
            //     {
            //         dataElement: 'ChfBVpGkz5M',
            //         categoryOptionCombo: 'tILcB42WBVn', //CPN/CPoN VAD, Masculin
            //         value: dataToSend.cpn_cpon_nbr_touched_by_VAD_M,
            //         comment: ''
            //     },
            //     {
            //         dataElement: 'ChfBVpGkz5M',
            //         categoryOptionCombo: 'iHavRI7a5xI', //CPN/CPoN CE, Masculin
            //         value: dataToSend.cpn_cpon_nbr_touched_by_CE_M,
            //         comment: ''
            //     },
            //     {
            //         dataElement: 'ChfBVpGkz5M',
            //         categoryOptionCombo: 'GcCVmDklPK3', //CPN/CPoN Total, Masculin
            //         value: dataToSend.cpn_cpon_nbr_total_M,
            //         comment: ''
            //     },
            //     {
            //         dataElement: 'OjpoCrL4Tjj',
            //         categoryOptionCombo: 'G8TURgyVL6d', //PF VAD, Féminin
            //         value: dataToSend.family_planning_nbr_touched_by_VAD_F,
            //         comment: ''
            //     },
            //     {
            //         dataElement: 'OjpoCrL4Tjj',
            //         categoryOptionCombo: 'vxaeoYOCtoY', //PF CE, Féminin
            //         value: dataToSend.family_planning_nbr_touched_by_CE_F,
            //         comment: ''
            //     },
            //     {
            //         dataElement: 'OjpoCrL4Tjj',
            //         categoryOptionCombo: 'ubU9w7O79Lx', //PF Total, Féminin
            //         value: dataToSend.family_planning_nbr_total_F,
            //         comment: ''
            //     },
            //     {
            //         dataElement: 'OjpoCrL4Tjj',
            //         categoryOptionCombo: 'Y66GlWSiI1T', //PF VAD, Masculin
            //         value: dataToSend.family_planning_nbr_touched_by_VAD_M,
            //         comment: ''
            //     },
            //     {
            //         dataElement: 'OjpoCrL4Tjj',
            //         categoryOptionCombo: 'MxvzA5aZkHC', //PF CE, Masculin
            //         value: dataToSend.family_planning_nbr_touched_by_CE_M,
            //         comment: ''
            //     },
            //     {
            //         dataElement: 'OjpoCrL4Tjj',
            //         categoryOptionCombo: 'QDWqiGTesvJ', //PF Total, Masculin
            //         value: dataToSend.family_planning_nbr_total_M,
            //         comment: ''
            //     },
            //     {
            //         dataElement: 'KkmPdIa7V2o',
            //         categoryOptionCombo: 'vzMCrPXneax', //Eau Hygienne Assainissement VAD, Féminin
            //         value: dataToSend.hygienic_water_sanitation_nbr_touched_by_VAD_F,
            //         comment: ''
            //     },
            //     {
            //         dataElement: 'KkmPdIa7V2o',
            //         categoryOptionCombo: 'oVx6d4kyTEu', //Eau Hygienne Assainissement CE, Féminin
            //         value: dataToSend.hygienic_water_sanitation_nbr_touched_by_CE_F,
            //         comment: ''
            //     },
            //     {
            //         dataElement: 'KkmPdIa7V2o',
            //         categoryOptionCombo: 'eaS6K9KtyE1', //Eau Hygienne Assainissement Total, Féminin
            //         value: dataToSend.hygienic_water_sanitation_nbr_total_F,
            //         comment: ''
            //     },
            //     {
            //         dataElement: 'KkmPdIa7V2o',
            //         categoryOptionCombo: 'OOe0cGjJYsh', //Eau Hygienne Assainissement VAD, Masculin
            //         value: dataToSend.hygienic_water_sanitation_nbr_touched_by_VAD_M,
            //         comment: ''
            //     },
            //     {
            //         dataElement: 'KkmPdIa7V2o',
            //         categoryOptionCombo: 'DKS0Gy0wi9k', //Eau Hygienne Assainissement CE, Masculin
            //         value: dataToSend.hygienic_water_sanitation_nbr_touched_by_CE_M,
            //         comment: ''
            //     },
            //     {
            //         dataElement: 'KkmPdIa7V2o',
            //         categoryOptionCombo: 'B10GhHIJiz0', //Eau Hygienne Assainissement Total, Masculin
            //         value: dataToSend.hygienic_water_sanitation_nbr_total_M,
            //         comment: ''
            //     },
            //     {
            //         dataElement: 'OTn9Yv0V4Hf',
            //         categoryOptionCombo: 'NoM9m3ccl8q', //Autres Maladies VAD, Féminin
            //         value: dataToSend.other_diseases_nbr_touched_by_VAD_F,
            //         comment: ''
            //     },
            //     {
            //         dataElement: 'OTn9Yv0V4Hf',
            //         categoryOptionCombo: 'dGYCxhCzseB', //Autres Maladies CE, Féminin
            //         value: dataToSend.other_diseases_nbr_touched_by_CE_F,
            //         comment: ''
            //     },
            //     {
            //         dataElement: 'OTn9Yv0V4Hf',
            //         categoryOptionCombo: 'PqerZpQPbap', //Autres Maladies Total, Féminin
            //         value: dataToSend.other_diseases_nbr_total_F,
            //         comment: ''
            //     },
            //     {
            //         dataElement: 'OTn9Yv0V4Hf',
            //         categoryOptionCombo: 'IGv6dWZUJPp', //Autres Maladies VAD, Masculin
            //         value: dataToSend.other_diseases_nbr_touched_by_VAD_M,
            //         comment: ''
            //     },
            //     {
            //         dataElement: 'OTn9Yv0V4Hf',
            //         categoryOptionCombo: 'Uotr3YNyRpr', //Autres Maladies CE, Masculin
            //         value: dataToSend.other_diseases_nbr_touched_by_CE_M,
            //         comment: ''
            //     },
            //     {
            //         dataElement: 'OTn9Yv0V4Hf',
            //         categoryOptionCombo: 'OGAnbwef45x', //Autres Maladies Total, Masculin
            //         value: dataToSend.other_diseases_nbr_total_M,
            //         comment: ''
            //     }
            // ]
        };
    }

    SEND_TO_DHIS2_UTILS({
        res: res, dataValueSet: dataValueSet, username: username, password: password, errorsCount: 0, afterSuccess: async () => {
            var errorsCount = 0;
            // if (userId && months && year && recos) {
            //     const vmonths: string[] = Array.isArray(months) ? months : [months];
            //     const vrecos: string[] = Array.isArray(recos) ? recos : [recos];
            //     const _repo = await getPromotionReportRepository();

            //     for (const month of vmonths) {
            //         const updatePromises = vrecos.map(async reco => {
            //             const dataId = `${month}-${year}-${reco}`;
            //             try {
            //                 await _repo.update({ id: dataId }, { already_on_dhis2: true, already_on_dhis2_user_id: userId, already_on_dhis2_at: new Date().toISOString() });
            //             } catch (err) {
            //                 errorsCount += 1;
            //                 console.error(`Failed to update record with id: ${dataId}`, err);
            //                 throw err; // Ensure the error is thrown to be caught by outer transaction handler if needed
            //             }
            //         });
            //         await Promise.all(updatePromises); // Wait for all updates in the current month
            //     }
            // } else {
            //     errorsCount = 1;
            // }

            return errorsCount;
        },
    })
}

export async function SEND_RECO_MEG_SITUATION_ACTIVITIES_TO_DHIS2(req: Request, res: Response, next: NextFunction) {
    const { userId, months, year, recos, data, period, orgunit, username, password } = req.body;
    const dataToSend = data as RecoMegSituationReport;
    let dataValueSet: DataValueSet | undefined = undefined;
    if (notEmpty(orgunit)) {
        dataValueSet = {
            dataSet: '',
            period: period ? `${period.year}${period.month}` : `${dataToSend.year}${dataToSend.month}`,
            orgUnit: orgunit,
            dataValues: [
                {
                    dataElement: 'reLr94WLodi',
                    categoryOptionCombo: 'mkALVXEOmPV',
                    value: 0
                },
            ]
        };
    }

    SEND_TO_DHIS2_UTILS({
        res: res, dataValueSet: dataValueSet, username: username, password: password, errorsCount: 0, afterSuccess: async () => {
            var errorsCount = 0;
            // if (userId && months && year && recos) {
            //     const vmonths: string[] = Array.isArray(months) ? months : [months];
            //     const vrecos: string[] = Array.isArray(recos) ? recos : [recos];
            //     const _repo = await getRecoMegSituationReportRepository();
            //     for (const month of vmonths) {
            //         const updatePromises = vrecos.map(async reco => {
            //             const dataId = `${month}-${year}-${reco}`;
            //             try {
            //                 await _repo.update({ id: dataId }, { already_on_dhis2: true, already_on_dhis2_user_id: userId, already_on_dhis2_at: new Date().toISOString() });
            //             } catch (err) {
            //                 errorsCount += 1;
            //                 console.error(`Failed to update record with id: ${dataId}`, err);
            //                 throw err; // Ensure the error is thrown to be caught by outer transaction handler if needed
            //             }
            //         });
            //         await Promise.all(updatePromises); // Wait for all updates in the current month
            //     }
            // } else {
            //     errorsCount = 1;
            // }
            return errorsCount;
        },
    })
}



export async function SEND_TO_DHIS2_UTILS(dhis2: { res: Response, dataValueSet: DataValueSet | undefined, username: string, password: string, errorsCount: number, afterSuccess: () => Promise<number> }) {
    if (dhis2.dataValueSet) {
        // const dhis2Host = NODE_ENV === 'production' ? DHIS2_PROD_HOST : DHIS2_DEV_HOST;
        const dhis2Host = DHIS2_PROD_HOST;

        const baseURL = `${DHIS2_PROTOCOL}://${dhis2Host}/api`;
        const endpoint = '/dataValueSets'; // Endpoint for posting dataValueSets

        const dhis2Api = axios.create({
            baseURL: baseURL,
            auth: {
                username: dhis2.username,//DHIS2_USER ?? '',
                password: dhis2.password,//DHIS2_PASS ?? ''
            },
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: 5000, // Optional timeout
        });

        try {
            const response = await dhis2Api.post(endpoint, dhis2.dataValueSet);
            if (response.status === 200) {
                const responseData = response.data;
                if (responseData.status === 'SUCCESS') {
                    // ###############################
                    var errorsCount = await dhis2.afterSuccess();

                    if (errorsCount > 0) return dhis2.res.status(201).json({ status: 201, data: 'ERROR: Erreur survenue lors de l\'envoi des données.' });
                    return dhis2.res.status(200).json({ status: 200, data: `SUCCESS: Envoyé avec succès! Total envoi = ${responseData.importCount}` });
                } else if (responseData.status === 'WARNING') {
                    return dhis2.res.status(201).json({ status: 201, data: `WARNING: Problème survenue lors de la sauvegarde des données.` });
                } else {
                    return dhis2.res.status(201).json({ status: 201, data: `ERROR: Erreur survenue lors de l\'envoi des données.` });
                }
            } else {
                return dhis2.res.status(201).json({ status: 201, data: `ERROR: Erreur lors du traitement des données` });
            }

        } catch (error: any) {
            if (error.response) {
                // Handle specific HTTP error codes
                if (error.response.status === 401) {
                    return dhis2.res.status(201).json({ status: 201, data: `ERROR: Authentication échoué, problème avec vos identifiants DHIS2: ${error.response.data}` });
                } else if (error.response.status === 400) {
                    return dhis2.res.status(201).json({ status: 201, data: `ERROR: Un champs requis est vide dans vos données` });
                } else {
                    return dhis2.res.status(201).json({ status: 201, data: `ERROR: Erreur avec l'API d'envoi. (Status: ${error.response.status}): ${error.response.data}` });
                }
            } else if (error.request) {
                return dhis2.res.status(201).json({ status: 201, data: `ERROR: Pas de réponse du serveur DHIS2, vérifier vos paramettres!: ${error.request}` });
            } else {
                return dhis2.res.status(201).json({ status: 201, data: `ERROR: Problème avec les paramettre de la requête: ${error.message}` });
            }
        }

    } else {
        return dhis2.res.status(201).json({ status: 201, data: `ERROR: Données à envoyer vide ou introuvable` });
    }

}
