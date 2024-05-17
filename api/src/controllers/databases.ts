import { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";
import { DataSource, EntityMetadata, In } from "typeorm";
import { AppDataSource } from "../data_source";
import * as path from 'path';
import * as dotenv from 'dotenv';
import request from 'request';
import { httpHeaders } from "../utils/functions";
import { Family, Patient, getChwRepository, getFamilyRepository, getPatientRepository, getRecoRepository } from "../entities/Org-units";
import { getCouchdbUsersRepository } from "../entities/Couchdb-users";
import { AdultData } from "../entities/_Adult-data";
import { DeathData } from "../entities/_Death-data";
import { DeliveryData } from "../entities/_Delivery-data";
import { EventsData } from "../entities/_Events-data";
import { FamilyPlanningData } from "../entities/_FamilyPlannig-data";
import { FsMegData } from "../entities/_Meg-FS-data";
import { RecoMegData } from "../entities/_Meg-Reco-data";
import { NewbornData } from "../entities/_Newborn-data";
import { PcimneData } from "../entities/_Pcimne-data";
import { PregnantData } from "../entities/_Pregnant-data";
import { PromotionalActivityData } from "../entities/_Promotional-data";
import { ReferalData } from "../entities/_Referal-data";
import { VaccinationData } from "../entities/_Vaccination-data";
// const axios = require('axios');
// const fetch = require('node-fetch')
const apiFolder = path.dirname(path.dirname(__dirname));
const projectFolder = path.dirname(apiFolder);
dotenv.config({ path: `${projectFolder}/.env` });
const { NODE_ENV, CHT_HOST, CHT_PROD_PORT, CHT_DEV_PORT } = process.env;

const USER_CHT_HOST = `${CHT_HOST}:${NODE_ENV === 'production' ? CHT_PROD_PORT : CHT_DEV_PORT}`;


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

export async function TruncatePostgresMysqlJsonDatabase(req: Request, res: Response, next: NextFunction) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(201).json({ status: 201, data: 'Informations you provided are not valid' });
    try {
        const { procide, entities, action } = req.body;
        if (procide == true) {
            const Connection: DataSource = AppDataSource.manager.connection;
            const _entities = entities as { name: string, table: string }[];
            for (const entity of _entities) {
                if (action === 'TRUNCATE') {
                    await Connection.query(`TRUNCATE "${entity.table}" RESTART IDENTITY CASCADE;`);
                } else if (action === 'DROP') {
                    await Connection.query(`DROP TABLE "${entity.table}" CASCADE;`);
                }
            }
            return res.status(200).json({ status: 200, data: 'Done successfully' });
        } else {
            return res.status(201).json({ status: 201, data: "You don't have permission de procide action" });
        }
    } catch (err) {
        // return next(err);
        return res.status(500).json({ status: 500, data: err });
    }
};

export async function GetRecoDataToBeDeleteFromCouchDb(req: Request, resp: Response, next: NextFunction) {
    var { cible, type, start_date, end_date } = req.body;

    if (cible && type && start_date && end_date) {
        try {
            cible = Array.isArray(cible) ? cible : [cible];
            const owners = cible.map((_: any, i: number) => `$${i + 1}`).join(',');
            const startDate = `$${cible.length + 1}`;
            const endDate = `$${cible.length + 2}`;
            if (['reco-data', 'patients', 'families'].includes(type)) {
                if (type == 'reco-data') {
                    const data1: AdultData[] = await Connection.query(`SELECT d.id, d.rev, d.form, r.name as user, 'adult_data' AS table FROM adult_data d JOIN reco r ON d.reco_id = r.id WHERE (d.reco_id IN (${owners}) OR d.village_secteur_id IN (${owners})) AND d.reported_date BETWEEN ${startDate} AND ${endDate}`, [...cible, start_date, end_date]);
                    const data2: DeathData[] = await Connection.query(`SELECT d.id, d.rev, d.form, r.name as user, 'death_data' AS table FROM death_data d JOIN reco r ON d.reco_id = r.id WHERE (d.reco_id IN (${owners}) OR d.village_secteur_id IN (${owners})) AND d.reported_date BETWEEN ${startDate} AND ${endDate}`, [...cible, start_date, end_date]);
                    const data3: DeliveryData[] = await Connection.query(`SELECT d.id, d.rev, d.form, r.name as user, 'delivery_data' AS table FROM delivery_data d JOIN reco r ON d.reco_id = r.id WHERE (d.reco_id IN (${owners}) OR d.village_secteur_id IN (${owners})) AND d.reported_date BETWEEN ${startDate} AND ${endDate}`, [...cible, start_date, end_date]);
                    const data4: EventsData[] = await Connection.query(`SELECT d.id, d.rev, d.form, r.name as user, 'events_data' AS table FROM events_data d JOIN reco r ON d.reco_id = r.id WHERE (d.reco_id IN (${owners}) OR d.village_secteur_id IN (${owners})) AND d.reported_date BETWEEN ${startDate} AND ${endDate}`, [...cible, start_date, end_date]);
                    const data5: FamilyPlanningData[] = await Connection.query(`SELECT d.id, d.rev, d.form, r.name as user, 'family_planning_data' AS table FROM family_planning_data d JOIN reco r ON d.reco_id = r.id WHERE (d.reco_id IN (${owners}) OR d.village_secteur_id IN (${owners})) AND d.reported_date BETWEEN ${startDate} AND ${endDate}`, [...cible, start_date, end_date]);
                    const data6: RecoMegData[] = await Connection.query(`SELECT d.id, d.rev, d.form, r.name as user, 'reco_meg_data' AS table FROM reco_meg_data d JOIN reco r ON d.reco_id = r.id WHERE (d.reco_id IN (${owners}) OR d.village_secteur_id IN (${owners})) AND d.reported_date BETWEEN ${startDate} AND ${endDate}`, [...cible, start_date, end_date]);
                    const data7: NewbornData[] = await Connection.query(`SELECT d.id, d.rev, d.form, r.name as user, 'newborn_data' AS table FROM newborn_data d JOIN reco r ON d.reco_id = r.id WHERE (d.reco_id IN (${owners}) OR d.village_secteur_id IN (${owners})) AND d.reported_date BETWEEN ${startDate} AND ${endDate}`, [...cible, start_date, end_date]);
                    const data8: PcimneData[] = await Connection.query(`SELECT d.id, d.rev, d.form, r.name as user, 'pcimne_data' AS table FROM pcimne_data d JOIN reco r ON d.reco_id = r.id WHERE (d.reco_id IN (${owners}) OR d.village_secteur_id IN (${owners})) AND d.reported_date BETWEEN ${startDate} AND ${endDate}`, [...cible, start_date, end_date]);
                    const data9: PregnantData[] = await Connection.query(`SELECT d.id, d.rev, d.form, r.name as user, 'pregnant_data' AS table FROM pregnant_data d JOIN reco r ON d.reco_id = r.id WHERE (d.reco_id IN (${owners}) OR d.village_secteur_id IN (${owners})) AND d.reported_date BETWEEN ${startDate} AND ${endDate}`, [...cible, start_date, end_date]);
                    const data10: PromotionalActivityData[] = await Connection.query(`SELECT d.id, d.rev, d.form, r.name as user, 'promotional_activity_data' AS table FROM promotional_activity_data d JOIN reco r ON d.reco_id = r.id WHERE (d.reco_id IN (${owners}) OR d.village_secteur_id IN (${owners})) AND d.reported_date BETWEEN ${startDate} AND ${endDate}`, [...cible, start_date, end_date]);
                    const data11: ReferalData[] = await Connection.query(`SELECT d.id, d.rev, d.form, r.name as user, 'referal_data' AS table FROM referal_data d JOIN reco r ON d.reco_id = r.id WHERE (d.reco_id IN (${owners}) OR d.village_secteur_id IN (${owners})) AND d.reported_date BETWEEN ${startDate} AND ${endDate}`, [...cible, start_date, end_date]);
                    const data12: VaccinationData[] = await Connection.query(`SELECT d.id, d.rev, d.form, r.name as user, 'vaccination_data' AS table FROM vaccination_data d JOIN reco r ON d.reco_id = r.id WHERE (d.reco_id IN (${owners}) OR d.village_secteur_id IN (${owners})) AND d.reported_date BETWEEN ${startDate} AND ${endDate}`, [...cible, start_date, end_date]);
                    return resp.status(200).json({ status: 200, data: [...data1, ...data2, ...data3, ...data4, ...data5, ...data6, ...data7, ...data8, ...data9, ...data10, ...data11, ...data12] });
                } else if (type == 'patients') {
                    const data: Patient[] = await Connection.query(`SELECT d.id, d.rev, d.name, r.name as user, 'patient' AS table FROM patient d JOIN reco r ON d.reco_id = r.id WHERE (d.reco_id IN (${owners}) OR d.village_secteur_id IN (${owners})) AND d.reported_date BETWEEN ${startDate} AND ${endDate}`, [...cible, start_date, end_date]);
                    return resp.status(200).json({ status: 200, data: [...data] });
                } else if (type == 'families') {
                    const data: Family[] = await Connection.query(`SELECT d.id, d.rev, d.name, r.name as user, 'family' AS table FROM family d JOIN reco r ON d.reco_id = r.id WHERE (d.reco_id IN (${owners}) OR d.village_secteur_id IN (${owners})) AND d.reported_date BETWEEN ${startDate} AND ${endDate}`, [...cible, start_date, end_date]);
                    return resp.status(200).json({ status: 200, data: [...data] });
                }
            } else if (type === 'chws-data') {
                // await getChwsDataWithParams(req, resp, next);
                return resp.status(200).json({ status: 200, data: [] });
            } else if (type === 'mentors-data') {
                const data: FsMegData[] = await Connection.query(`SELECT d.id, d.rev, d.form, m.name as user, 'fs_meg_data' AS table FROM fs_meg_data d JOIN mentor m ON d.mentor_id = m.id WHERE d.mentor_id IN (${owners}) AND d.reported_date BETWEEN ${startDate} AND ${endDate}`, [...cible, start_date, end_date]);
                return resp.status(200).json({ status: 200, data: [...data] });
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
                    await Connection.query(`DELETE FROM $1 WHERE id = $2`, [dt._table, dt._id]);
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
    try {
        const _repo = await getRecoRepository();
        const reco = await _repo.findOneBy({ id: recoId });
        if (reco) {
            reco.village_secteur = villageSecteurId;
            await _repo.save(reco);
            return true;
        }
    } catch (err: any) { }
    return false;
}

async function UpdateChwsDistrictQuartier(chwId: string, districtQuartierId: any) {
    try {
        const _repo = await getChwRepository();
        const chw = await _repo.findOneBy({ id: chwId });
        if (chw) {
            chw.district_quartier = districtQuartierId;
            await _repo.save(chw);
            return true;
        }
    } catch (err: any) { }
    return false;
}

export async function UpdateUserFacilityIdAndContactPlace(req: Request, res: Response, next: NextFunction) {
    // const req_params: ChwUserParams = req.body;  
    try {
        const { code, role, parent, contact, new_parent, } = req.body;
        const _repo = await getCouchdbUsersRepository();
        const user = await _repo.findOneBy({ type: role, role: role, code: code, place: parent, contact: contact });

        if (user) {
            // start updating facility_id
            return request({
                url: `https://${USER_CHT_HOST}/api/v1/users/${user.username}`,
                method: 'POST',
                body: JSON.stringify({ "place": new_parent }),
                headers: httpHeaders()
            }, function (error: any, response: any, body: any) {
                if (error) return res.status(201).json({ status: 201, message: 'Error Found!' });
                request({
                    url: `https://${USER_CHT_HOST}/medic/${user.contact}`,
                    method: 'GET',
                    headers: httpHeaders()
                }, function (error: any, response: any, body: any) {
                    try {
                        if (error) return res.status(201).json({ status: 201, message: 'Error Found!' });
                        const data = JSON.parse(body);
                        data.parent._id = new_parent;
                        // start updating Contact Place Informations
                        request({
                            url: `https://${USER_CHT_HOST}/api/v1/people`,
                            method: 'POST',
                            body: JSON.stringify(data),
                            headers: httpHeaders()
                        }, async function (error: any, response: any, body: any) {
                            try {
                                if (error) return res.status(201).json({ status: 201, message: 'Error Found!' });
                                var update: boolean = false;
                                if (role == 'reco') update = await UpdateRecoVillageSecteur(contact, new_parent);
                                if (role == 'chw') update = await UpdateChwsDistrictQuartier(contact, new_parent);

                                if (update) {
                                    user.place = new_parent;
                                    await _repo.save(user);
                                    return res.status(200).json({ status: 200, message: "Vous avez changé la zone de l'ASC avec succes!" });
                                } else {
                                    return res.status(201).json({ status: 201, message: "Erruer trouvée, Contacter immédiatement l'administrateur!" });
                                }
                            } catch (err: any) {
                                return res.status(500).json({ status: 500, message: err.toString() });
                            }
                        });
                    } catch (err: any) {
                        return res.status(500).json({ status: 500, message: err.toString() });
                    }
                });
            });
        } else {
            return res.status(201).json({ status: 201, message: "Pas d'ASC trouvé pour procéder à l'opération, Réessayer !" });
        }
    } catch (err: any) {
        return res.status(500).json({ status: 500, message: err.toString() });
    }
}


