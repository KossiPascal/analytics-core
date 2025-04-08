import { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";
import { DataSource, EntityMetadata } from "typeorm";
import { AppDataSource } from "../data-source";
import request from 'request';
import { httpHeaders, notEmpty } from "../functions/functions";
import { APP_ENV } from "../providers/constantes";
import { RecoChartPerformanceDashboard, RecoPerformanceDashboard, RecoVaccinationDashboardDbOutput } from "../models/dashboards";
import { ChwsRecoReport, FamilyPlanningReport, HouseholdRecapReport, MorbidityReport, PcimneNewbornReport, PromotionReport, RecoMegSituationReport } from "../models/reports";
// const axios = require('axios');
// const fetch = require('node-fetch')

const { NODE_ENV, CHT_PROD_HOST, CHT_DEV_HOST, CHT_PORT } = APP_ENV;

const USER_CHT_HOST = `${NODE_ENV === 'production' ? CHT_PROD_HOST : CHT_DEV_HOST}:${CHT_PORT}`;


let Connection: DataSource = AppDataSource.manager.connection;


export async function databaseEntitiesList(req: Request, res: Response, next: NextFunction) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(201).json({ status: 201, data: 'Informations you provided are not valid' });
    try {
        const Connection: DataSource = AppDataSource.manager.connection;
        const entities: EntityMetadata[] = Connection.entityMetadatas;
        var entitiesElements: { name: string, table: string }[] = [];
        for (const entity of entities) {
            entitiesElements.push({ name: entity.name, table: entity.tableName })
        }
        return res.status(200).json({ status: 200, data: entitiesElements });
    } catch (err) {
        // return next(err);
        return res.status(500).json({ status: 500, data: err });
    }
};



export async function DropOrTruncateDataFromDatabase({ procide, entities, action }: { procide: boolean, entities: { name: string, table: string }[], action: 'TRUNCATE' | 'DROP' }) {
    try {
        if (procide == true) {
            const Connection: DataSource = AppDataSource.manager.connection;
            const _entities = entities as { name: string, table: string }[];
            if (['TRUNCATE', 'DROP'].includes(action)) {
                for (const entity of _entities) {
                    if (notEmpty(entity.table)) {
                        if (action === 'TRUNCATE') {
                            await Connection.query(`TRUNCATE "${entity.table}" RESTART IDENTITY CASCADE;`);
                        } else if (action === 'DROP') {
                            await Connection.query(`DROP TABLE "${entity.table}" CASCADE;`);
                        }
                    }
                }
                return { status: 200, success: true, data: 'Done successfully' };

            } else {
                return { status: 201, success: false, data: "You must provide action in ['TRUNCATE', 'DROP']" };
            }
        } else {
            return { status: 201, success: false, data: "You don't have permission de procide action" };
        }
    } catch (err: any) {
        // return next(err);
        return { status: 500, success: false, data: err };
    }
};

export async function DeleteAllDataFromDatabase(req: Request, res: Response, next: NextFunction) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(201).json({ status: 201, data: 'Informations you provided are not valid' });
    const { procide, entities, action } = req.body;

    const result = await DropOrTruncateDataFromDatabase({ procide, entities, action })

    return res.status(result.status).json(result);
};

export async function GetRecoDataToBeDeleteFromCouchDb(req: Request, resp: Response, next: NextFunction) {
    var { cible, type, start_date, end_date } = req.body;

    if (cible && type && start_date && end_date) {
        try {
            cible = (Array.isArray(cible) ? cible : [cible]).filter((item: any) => item !== '');
            const owners = cible.map((_: any, i: number) => `$${i + 1}`).join(',');
            const startDate = `$${cible.length + 1}`;
            const endDate = `$${cible.length + 2}`;

            let monthCurrentDate = new Date(start_date);
            let yearCurrentDate = new Date(start_date);
            const endOfDate = new Date(end_date);

            if (type == 'dashboards') {

                let bData1: any[] = [];
                let bData2: any[] = [];
                let bData3: any[] = [];

                while (monthCurrentDate <= endOfDate) {
                    // const month = monthCurrentDate.toLocaleString('default', { month: 'long' });
                    const m = monthCurrentDate.getMonth() + 1;
                    const month = m < 10 ? `0${m}` : `${m}`;
                    const year = monthCurrentDate.getFullYear();

                    const data1: RecoPerformanceDashboard[] = await Connection.query(`SELECT d.id, r.name as user, 'Performance Dashboard' AS form, 'reco_performance_dashboard' AS table FROM reco_performance_dashboard d JOIN reco r ON d.reco->>'id' = r.id WHERE (r.id IN (${owners}) OR d.village_secteur->>'id' IN (${owners})) AND d.year = ${startDate} AND d.month = ${endDate}`, [...cible, year, month]);
                    const data2: RecoVaccinationDashboardDbOutput[] = await Connection.query(`SELECT d.id, r.name as user, 'Vaccination Dashboard' AS form, 'reco_vaccination_dashboard' AS table FROM reco_vaccination_dashboard d JOIN reco r ON d.reco->>'id' = r.id WHERE (r.id IN (${owners}) OR d.village_secteur->>'id' IN (${owners})) AND d.year = ${startDate} AND d.month = ${endDate}`, [...cible, year, month]);

                    bData1 = [...bData1, ...data1];
                    bData2 = [...bData2, ...data2];

                    monthCurrentDate.setMonth(monthCurrentDate.getMonth() + 1);
                }

                while (yearCurrentDate <= endOfDate) {
                    const data3: RecoChartPerformanceDashboard[] = await Connection.query(`SELECT d.id, r.name as user, 'Chart Performance Dashboard' AS form, 'reco_chart_performance_dashboard' AS table FROM reco_chart_performance_dashboard d JOIN reco r ON d.reco->>'id' = r.id WHERE (r.id IN (${owners}) OR d.village_secteur->>'id' IN (${owners})) AND d.year = ${startDate}`, [...cible, yearCurrentDate.getFullYear()]);
                    bData3 = [...bData3, ...data3];
                    yearCurrentDate.setFullYear(yearCurrentDate.getFullYear() + 1);
                }

                return resp.status(200).json({ status: 200, data: [...bData1, ...bData2, ...bData3] });

            } else if (type == 'reports') {

                let bData1: any[] = [];
                let bData2: any[] = [];
                let bData3: any[] = [];
                let bData4: any[] = [];
                let bData5: any[] = [];
                let bData6: any[] = [];
                let bData7: any[] = [];

                while (monthCurrentDate <= endOfDate) {
                    const m = monthCurrentDate.getMonth() + 1;
                    const month = m < 10 ? `0${m}` : `${m}`;
                    const year = monthCurrentDate.getFullYear();

                    const data1: PromotionReport[] = await Connection.query(`SELECT d.id, r.name as user, 'Promotion Report' AS form, 'promotion_report' AS table FROM promotion_report d JOIN reco r ON d.reco->>'id' = r.id WHERE (r.id IN (${owners}) OR d.village_secteur->>'id' IN (${owners})) AND d.year = ${startDate} AND d.month = ${endDate}`, [...cible, year, month]);
                    const data2: FamilyPlanningReport[] = await Connection.query(`SELECT d.id, r.name as user, 'Family Planning Report' AS form, 'family_planning_report' AS table FROM family_planning_report d JOIN reco r ON d.reco->>'id' = r.id WHERE (r.id IN (${owners}) OR d.village_secteur->>'id' IN (${owners})) AND d.year = ${startDate} AND d.month = ${endDate}`, [...cible, year, month]);
                    const data3: MorbidityReport[] = await Connection.query(`SELECT d.id, r.name as user, 'Morbidity Report' AS form, 'morbidity_report' AS table FROM morbidity_report d JOIN reco r ON d.reco->>'id' = r.id WHERE (r.id IN (${owners}) OR d.village_secteur->>'id' IN (${owners})) AND d.year = ${startDate} AND d.month = ${endDate}`, [...cible, year, month]);
                    const data4: HouseholdRecapReport[] = await Connection.query(`SELECT d.id, r.name as user, 'Household Recap Report' AS form, 'household_recap_report' AS table FROM household_recap_report d JOIN reco r ON d.reco->>'id' = r.id WHERE (r.id IN (${owners}) OR d.village_secteur->>'id' IN (${owners})) AND d.year = ${startDate} AND d.month = ${endDate}`, [...cible, year, month]);
                    const data5: PcimneNewbornReport[] = await Connection.query(`SELECT d.id, r.name as user, 'Pcimne Newborn Report' AS form, 'pcimne_newborn_report' AS table FROM pcimne_newborn_report d JOIN reco r ON d.reco->>'id' = r.id WHERE (r.id IN (${owners}) OR d.village_secteur->>'id' IN (${owners})) AND d.year = ${startDate} AND d.month = ${endDate}`, [...cible, year, month]);
                    const data6: ChwsRecoReport[] = await Connection.query(`SELECT d.id, r.name as user, 'Chws Reco Report' AS form, 'chws_reco_report' AS table FROM chws_reco_report d JOIN reco r ON d.reco->>'id' = r.id WHERE (r.id IN (${owners}) OR d.village_secteur->>'id' IN (${owners})) AND d.year = ${startDate} AND d.month = ${endDate}`, [...cible, year, month]);
                    const data7: RecoMegSituationReport[] = await Connection.query(`SELECT d.id, r.name as user, 'Reco Meg Situation Report' AS form, 'reco_meg_situation_report' AS table FROM reco_meg_situation_report d JOIN reco r ON d.reco->>'id' = r.id WHERE (r.id IN (${owners}) OR d.village_secteur->>'id' IN (${owners})) AND d.year = ${startDate} AND d.month = ${endDate}`, [...cible, year, month]);

                    bData1 = [...bData1, ...data1];
                    bData2 = [...bData2, ...data2];
                    bData3 = [...bData3, ...data3];
                    bData4 = [...bData4, ...data4];
                    bData5 = [...bData5, ...data5];
                    bData6 = [...bData6, ...data6];
                    bData7 = [...bData7, ...data7];

                    monthCurrentDate.setMonth(monthCurrentDate.getMonth() + 1);
                }

                return resp.status(200).json({ status: 200, data: [...bData1, ...bData2, ...bData3, ...bData4, ...bData5, ...bData6, ...bData7] });

            } else if (['reco-data', 'patients', 'families'].includes(type)) {
                // if (type == 'reco-data') {
                //     const data1: AdultData[] = await Connection.query(`SELECT d.id, d.rev, d.form, r.name as user, 'adult_data' AS table FROM adult_data d JOIN reco r ON d.reco_id = r.id WHERE (d.reco_id IN (${owners}) OR d.village_secteur_id IN (${owners})) AND d.reported_date BETWEEN ${startDate} AND ${endDate}`, [...cible, start_date, end_date]);
                //     const data2: DeathData[] = await Connection.query(`SELECT d.id, d.rev, d.form, r.name as user, 'death_data' AS table FROM death_data d JOIN reco r ON d.reco_id = r.id WHERE (d.reco_id IN (${owners}) OR d.village_secteur_id IN (${owners})) AND d.reported_date BETWEEN ${startDate} AND ${endDate}`, [...cible, start_date, end_date]);
                //     const data3: DeliveryData[] = await Connection.query(`SELECT d.id, d.rev, d.form, r.name as user, 'delivery_data' AS table FROM delivery_data d JOIN reco r ON d.reco_id = r.id WHERE (d.reco_id IN (${owners}) OR d.village_secteur_id IN (${owners})) AND d.reported_date BETWEEN ${startDate} AND ${endDate}`, [...cible, start_date, end_date]);
                //     const data4: EventsData[] = await Connection.query(`SELECT d.id, d.rev, d.form, r.name as user, 'events_data' AS table FROM events_data d JOIN reco r ON d.reco_id = r.id WHERE (d.reco_id IN (${owners}) OR d.village_secteur_id IN (${owners})) AND d.reported_date BETWEEN ${startDate} AND ${endDate}`, [...cible, start_date, end_date]);
                //     const data5: FamilyPlanningData[] = await Connection.query(`SELECT d.id, d.rev, d.form, r.name as user, 'family_planning_data' AS table FROM family_planning_data d JOIN reco r ON d.reco_id = r.id WHERE (d.reco_id IN (${owners}) OR d.village_secteur_id IN (${owners})) AND d.reported_date BETWEEN ${startDate} AND ${endDate}`, [...cible, start_date, end_date]);

                //     const data6: RecoMegData[] = await Connection.query(`SELECT d.id, d.rev, d.form, r.name as user, 'reco_meg_data' AS table FROM reco_meg_data d JOIN reco r ON d.reco_id = r.id WHERE (d.reco_id IN (${owners}) OR d.village_secteur_id IN (${owners})) AND d.reported_date BETWEEN ${startDate} AND ${endDate}`, [...cible, start_date, end_date]);
                //     const data7: NewbornData[] = await Connection.query(`SELECT d.id, d.rev, d.form, r.name as user, 'newborn_data' AS table FROM newborn_data d JOIN reco r ON d.reco_id = r.id WHERE (d.reco_id IN (${owners}) OR d.village_secteur_id IN (${owners})) AND d.reported_date BETWEEN ${startDate} AND ${endDate}`, [...cible, start_date, end_date]);
                //     const data8: PcimneData[] = await Connection.query(`SELECT d.id, d.rev, d.form, r.name as user, 'pcimne_data' AS table FROM pcimne_data d JOIN reco r ON d.reco_id = r.id WHERE (d.reco_id IN (${owners}) OR d.village_secteur_id IN (${owners})) AND d.reported_date BETWEEN ${startDate} AND ${endDate}`, [...cible, start_date, end_date]);
                //     const data9: PregnantData[] = await Connection.query(`SELECT d.id, d.rev, d.form, r.name as user, 'pregnant_data' AS table FROM pregnant_data d JOIN reco r ON d.reco_id = r.id WHERE (d.reco_id IN (${owners}) OR d.village_secteur_id IN (${owners})) AND d.reported_date BETWEEN ${startDate} AND ${endDate}`, [...cible, start_date, end_date]);
                //     const data10: PromotionalActivityData[] = await Connection.query(`SELECT d.id, d.rev, d.form, r.name as user, 'promotional_activity_data' AS table FROM promotional_activity_data d JOIN reco r ON d.reco_id = r.id WHERE (d.reco_id IN (${owners}) OR d.village_secteur_id IN (${owners})) AND d.reported_date BETWEEN ${startDate} AND ${endDate}`, [...cible, start_date, end_date]);
                //     const data11: ReferalData[] = await Connection.query(`SELECT d.id, d.rev, d.form, r.name as user, 'referal_data' AS table FROM referal_data d JOIN reco r ON d.reco_id = r.id WHERE (d.reco_id IN (${owners}) OR d.village_secteur_id IN (${owners})) AND d.reported_date BETWEEN ${startDate} AND ${endDate}`, [...cible, start_date, end_date]);
                //     const data12: VaccinationData[] = await Connection.query(`SELECT d.id, d.rev, d.form, r.name as user, 'vaccination_data' AS table FROM vaccination_data d JOIN reco r ON d.reco_id = r.id WHERE (d.reco_id IN (${owners}) OR d.village_secteur_id IN (${owners})) AND d.reported_date BETWEEN ${startDate} AND ${endDate}`, [...cible, start_date, end_date]);
                //     return resp.status(200).json({ status: 200, data: [...data1, ...data2, ...data3, ...data4, ...data5, ...data6, ...data7, ...data8, ...data9, ...data10, ...data11, ...data12] });
                // } else if (type == 'patients') {
                //     const data: Patient[] = await Connection.query(`SELECT d.id, d.rev, d.name, r.name as user, 'patient' AS table FROM patient d JOIN reco r ON d.reco_id = r.id WHERE (d.reco_id IN (${owners}) OR d.village_secteur_id IN (${owners})) AND d.reported_date BETWEEN ${startDate} AND ${endDate}`, [...cible, start_date, end_date]);
                //     return resp.status(200).json({ status: 200, data: [...data] });
                // } else if (type == 'families') {
                //     const data: Family[] = await Connection.query(`SELECT d.id, d.rev, d.name, r.name as user, 'family' AS table FROM family d JOIN reco r ON d.reco_id = r.id WHERE (d.reco_id IN (${owners}) OR d.village_secteur_id IN (${owners})) AND d.reported_date BETWEEN ${startDate} AND ${endDate}`, [...cible, start_date, end_date]);
                //     return resp.status(200).json({ status: 200, data: [...data] });
                // }
            } else if (type === 'chws-data') {
                // await getChwsDataWithParams(req, resp, next);
                return resp.status(200).json({ status: 200, data: [] });
            } else if (type === 'mentors-data') {
                // const data: FsMegData[] = await Connection.query(`SELECT d.id, d.rev, d.form, m.name as user, 'fs_meg_data' AS table FROM fs_meg_data d JOIN mentor m ON d.mentor_id = m.id WHERE d.mentor_id IN (${owners}) AND d.reported_date BETWEEN ${startDate} AND ${endDate}`, [...cible, start_date, end_date]);
                // return resp.status(200).json({ status: 200, data: [...data] });
            }
            return resp.status(200).json({ status: 200, data: [] });
        } catch (error) {
            var errorMsg = { status: 201, data: 'Error fond when fetching data! ' };
            return resp.status(201).json(errorMsg)
        }
    } else {
        return resp.status(201).json({ status: 201, data: "You dont'provide a valide parametters" })
    }
}

export async function DeleteFromCouchDb(req: Request, res: Response, next: NextFunction) {
    var todelete: { _deleted: boolean, _id: string, _rev: string, _table: string }[] = req.body.data_to_delete;
    var reqType = req.body.type;
    const allIds: string[] = todelete.map(data => data._id);

    if (todelete.length > 0 && allIds.length > 0 && reqType) {
        request({
            url: `https://${USER_CHT_HOST}/medic/_bulk_docs`,
            method: 'POST',
            body: JSON.stringify({ "docs": todelete }),
            headers: httpHeaders()
        }, async function (err: any, response: any, body: any) {
            if (err) {
                return res.status(201).json({ status: 201, data: err });
            } else {

                for (const dt of todelete) {
                    await Connection.query(`DELETE FROM ${dt._table} WHERE id = $1`, [dt._id]);
                }
                // if (reqType == 'data') {
                //     // const _repoData = await getChwsDataSyncRepository();
                //     // _repoData.delete({ id: In(allIds) });
                // } else if (reqType == 'patients') {
                //     const _repoPatient = await getPatientRepository();
                //     _repoPatient.delete({ id: In(allIds) });
                // } else if (reqType == 'families') {
                //     const _repoFamily = await getFamilyRepository();
                //     _repoFamily.delete({ id: In(allIds) });
                // }
                return res.status(200).json({ status: 200, data: body })
            }
        });
    } else {
        return res.status(201).json({ status: 201, data: 'No Data Provided' });
    }
}

async function UpdateRecoVillageSecteur(recoId: string, villageSecteurId: any) {
    // try {
    //     const _repo = await getRecoRepository();
    //     const reco = await _repo.findOneBy({ id: recoId });
    //     if (reco) {
    //         reco.village_secteur = villageSecteurId;
    //         await _repo.save(reco);
    //         return true;
    //     }
    // } catch (err: any) { }
    return false;
}

async function UpdateChwsDistrictQuartier(chwId: string, districtQuartierId: any) {
    // try {
    //     const _repo = await getChwRepository();
    //     const chw = await _repo.findOneBy({ id: chwId });
    //     if (chw) {
    //         chw.district_quartier = districtQuartierId;
    //         await _repo.save(chw);
    //         return true;
    //     }
    // } catch (err: any) { }
    return false;
}

export async function UpdateUserFacilityIdAndContactPlace(req: Request, res: Response, next: NextFunction) {
    // const req_params: ChwUserParams = req.body;  
    // try {
    //     const { code, role, parent, contact, new_parent, } = req.body;
    //     const _repo = await getCouchdbUserRepository();
    //     const user = await _repo.findOneBy({ type: role, roles: role, code: code, place: parent, contact: contact });

    //     if (user) {
    //         // start updating facility_id
    //         return request({
    //             url: `https://${USER_CHT_HOST}/api/v1/users/${user.username}`,
    //             method: 'POST',
    //             body: JSON.stringify({ "place": new_parent }),
    //             headers: httpHeaders()
    //         }, function (error: any, response: any, body: any) {
    //             if (error) return res.status(201).json({ status: 201, message: 'Error Found!' });
    //             request({
    //                 url: `https://${USER_CHT_HOST}/medic/${user.contact}`,
    //                 method: 'GET',
    //                 headers: httpHeaders()
    //             }, function (error: any, response: any, body: any) {
    //                 try {
    //                     if (error) return res.status(201).json({ status: 201, message: 'Error Found!' });
    //                     const data = JSON.parse(body);
    //                     data.parent._id = new_parent;
    //                     // start updating Contact Place Informations
    //                     request({
    //                         url: `https://${USER_CHT_HOST}/api/v1/people`,
    //                         method: 'POST',
    //                         body: JSON.stringify(data),
    //                         headers: httpHeaders()
    //                     }, async function (error: any, response: any, body: any) {
    //                         try {
    //                             if (error) return res.status(201).json({ status: 201, message: 'Error Found!' });
    //                             var update: boolean = false;
    //                             if (role == 'reco') update = await UpdateRecoVillageSecteur(contact, new_parent);
    //                             if (role == 'chw') update = await UpdateChwsDistrictQuartier(contact, new_parent);

    //                             if (update) {
    //                                 user.place = new_parent;
    //                                 await _repo.save(user);
    //                                 return res.status(200).json({ status: 200, message: "Vous avez changé la zone de l'ASC avec succes!" });
    //                             } else {
    //                                 return res.status(201).json({ status: 201, message: "Erruer trouvée, Contacter immédiatement l'administrateur!" });
    //                             }
    //                         } catch (err: any) {
    //                             return res.status(500).json({ status: 500, message: err.toString() });
    //                         }
    //                     });
    //                 } catch (err: any) {
    //                     return res.status(500).json({ status: 500, message: err.toString() });
    //                 }
    //             });
    //         });
    //     } else {
    //         return res.status(201).json({ status: 201, message: "Pas d'ASC trouvé pour procéder à l'opération, Réessayer !" });
    //     }
    // } catch (err: any) {
    //     return res.status(500).json({ status: 500, message: err.toString() });
    // }

    return res.status(500).json({ status: 500, message: 'Server error' });
}


