import { NextFunction, Request, Response } from "express";
import { validationResult } from 'express-validator';
import { milisecond_to_date, date_to_milisecond, getAgeIn } from "../utils/date-utils";
import { CouchdbUsers, getCouchdbUsersRepository } from "../entities/Couchdb-users";
import { httpHeaders, isTrue, notEmpty, getFirstAndLastDayOfMonth, AxioFetchCouchDbData, getSexe } from "../utils/functions";
import { getAdultDataRepository } from "../entities/_Adult-data";
import { getFamilyPlanningDataRepository } from "../entities/_FamilyPlannig-data";
import { getPregnantDataRepository } from "../entities/_Pregnant-data";
import { getNewbornDataRepository } from "../entities/_Newborn-data";
import { getPcimneDataRepository } from "../entities/_Pcimne-data";
import { getDeliveryDataRepository } from "../entities/_Delivery-data";
import { getRecoMegDataRepository } from "../entities/_Meg-Reco-data";
import { getVaccinationDataRepository } from "../entities/_Vaccination-data";
import { getEventsDataRepository } from "../entities/_Events-data";
import { getFsMegDataRepository } from "../entities/_Meg-FS-data";
import { getPromotionalActivityDataRepository } from "../entities/_Promotional-data";
import { getReferalDataRepository } from "../entities/_Referal-data";
import { SyncAdultData } from "./couchdb-sync-models/adult-data";
import { SyncFamilyPlanningData } from "./couchdb-sync-models/fp-data";
import { SyncPregnantData } from "./couchdb-sync-models/pregnant-data";
import { SyncNewbornData } from "./couchdb-sync-models/newborn-data";
import { SyncPcimneData } from "./couchdb-sync-models/pcime-data";
import { SyncDeliveryData } from "./couchdb-sync-models/delivery-data";
import { SyncRecoMegData } from "./couchdb-sync-models/reco-meg-data";
import { SyncReferalData } from "./couchdb-sync-models/referral-data";
import { SyncVaccinationData } from "./couchdb-sync-models/vaccination-data";
import { SyncEventsData } from "./couchdb-sync-models/events-data";
import { SyncFsMegData } from "./couchdb-sync-models/fs-meg-data";
import { SyncPromotionalData } from "./couchdb-sync-models/promotional-data";
import { getCountryRepository, getRegionRepository, getPrefectureRepository, getCommuneRepository, getHospitalRepository, getDistrictQuartierRepository, getVillageSecteurRepository, getFamilyRepository, getChwRepository, getRecoRepository, getPatientRepository, Country, Region, Prefecture, Commune, Hospital, DistrictQuartier, VillageSecteur, Family, Patient, Reco, Chw, getMentorRepository, Mentor } from "../entities/Org-units";
import { SyncDeathData } from "./couchdb-sync-models/death-data";
import { getDeathDataRepository } from "../entities/_Death-data";
// const fetch = require('node-fetch');
const request = require('request');
import { dirname } from 'path';
import { config } from 'dotenv';

const apiFolder = dirname(dirname(__dirname));
const projectFolder = dirname(apiFolder);
const projectParentFolder = dirname(projectFolder);
config({ path: `${projectParentFolder}/ssl/analytics/.env` });

const { NODE_ENV, CHT_USER, CHT_PASS, CHT_HOST, CHT_PROTOCOL, CHT_PROD_PORT, CHT_DEV_PORT } = process.env;

const _sepation = `\n\n\n\n__________\n\n\n\n`;


export async function SYNC_ALL_FORMS_FROM_COUCHDB(req: Request, resp: Response, next: NextFunction) {
    var outPutInfo: any = {};
    if (!validationResult(req).isEmpty()) {
        outPutInfo["ValidationErrors"] = "Your request provides was rejected !";
        resp.status(500).json(outPutInfo);
        return;
    }
    const { userId, start_date, end_date, year, month } = req.body;

    var filterDate = {start_date: '', end_date: ''};
    if (start_date && end_date) {
        filterDate = {start_date: start_date, end_date: end_date};
    } else {
        filterDate = getFirstAndLastDayOfMonth(year, month);
    }

    const startKey = date_to_milisecond(filterDate.start_date, true);
    const endKey = date_to_milisecond(filterDate.end_date, false);

    try {
        await AxioFetchCouchDbData('reports_by_date', { startKey, endKey }).then(async (response: any) => {
            try {
                var rows: any = response.data.rows;
                if (rows && rows.length > 0) {
                    const len = rows.length;
                    var done: number = 0;

                    const _repoAdult = await getAdultDataRepository();
                    const _repoFP = await getFamilyPlanningDataRepository();
                    const _repoPregnant = await getPregnantDataRepository();
                    const _repoNewborn = await getNewbornDataRepository();
                    const _repoPcime = await getPcimneDataRepository();
                    const _repoDelivery = await getDeliveryDataRepository();
                    const _repoRecoMeg = await getRecoMegDataRepository();
                    const _repoReferal = await getReferalDataRepository();
                    const _repoVaccination = await getVaccinationDataRepository();
                    const _repoEvent = await getEventsDataRepository();
                    const _repoFsMeg = await getFsMegDataRepository();
                    const _repoPromotional = await getPromotionalActivityDataRepository();
                    const _repoDeath = await getDeathDataRepository();

                    for (let i = 0; i < len; i++) {
                        done++;
                        const r: any = rows[i].doc;
                        if (r.hasOwnProperty('form') && r.hasOwnProperty('fields')) {

                            if (['adult_consulation', 'adult_followup'].includes(r.form)) {
                                const _adult = await SyncAdultData(r, _repoAdult);
                                if (!('adult' in outPutInfo)) outPutInfo["adult"] = { Errors: '', ErrorCount: 0, SuccessCount: 0 };
                                if (!_adult) outPutInfo["adult"]["Errors"] += `${r._id}\n | \n `;
                                if (!_adult) outPutInfo["adult"]["ErrorCount"] += 1;
                                if (_adult) outPutInfo["adult"]["SuccessCount"] += 1;
                            }
                            //---------------
                            if (['fp_danger_sign_check', 'fp_renewal'].includes(r.form)) {
                                const _fp = await SyncFamilyPlanningData(r, _repoFP);
                                if (!('familyPlanning' in outPutInfo)) outPutInfo["familyPlanning"] = { Errors: '', ErrorCount: 0, SuccessCount: 0 };
                                if (!_fp) outPutInfo["familyPlanning"]["Errors"] += `${r._id}\n | \n `;
                                if (!_fp) outPutInfo["familyPlanning"]["ErrorCount"] += 1;
                                if (_fp) outPutInfo["familyPlanning"]["SuccessCount"] += 1;
                            }
                            if (['pregnancy_family_planning', 'family_planning'].includes(r.form) && !isTrue(r.fields.is_pregnant)) {
                                const _fp = await SyncFamilyPlanningData(r, _repoFP);
                                if (!('familyPlanning' in outPutInfo)) outPutInfo["familyPlanning"] = { Errors: '', ErrorCount: 0, SuccessCount: 0 };
                                if (!_fp) outPutInfo["familyPlanning"]["Errors"] += `${r._id}\n | \n `;
                                if (!_fp) outPutInfo["familyPlanning"]["ErrorCount"] += 1;
                                if (_fp) outPutInfo["familyPlanning"]["SuccessCount"] += 1;
                            }
                            //---------------
                            if (r.form === 'prenatal_followup' || ['pregnancy_family_planning', 'pregnancy_register'].includes(r.form) && isTrue(r.fields.is_pregnant)) {
                                const _pregnant = await SyncPregnantData(r, _repoPregnant);
                                if (!('pregnant' in outPutInfo)) outPutInfo["pregnant"] = { Errors: '', ErrorCount: 0, SuccessCount: 0 };
                                if (!_pregnant) outPutInfo["pregnant"]["Errors"] += `${r._id}\n | \n `;
                                if (!_pregnant) outPutInfo["pregnant"]["ErrorCount"] += 1;
                                if (_pregnant) outPutInfo["pregnant"]["SuccessCount"] += 1;
                            }
                            if (['newborn_register', 'newborn_followup'].includes(r.form)) {
                                const _newborn = await SyncNewbornData(r, _repoNewborn);
                                if (!('newborn' in outPutInfo)) outPutInfo["newborn"] = { Errors: '', ErrorCount: 0, SuccessCount: 0 };
                                if (!_newborn) outPutInfo["newborn"]["Errors"] += `${r._id}\n | \n `;
                                if (!_newborn) outPutInfo["newborn"]["ErrorCount"] += 1;
                                if (_newborn) outPutInfo["newborn"]["SuccessCount"] += 1;
                            }
                            if (['pcimne_followup', 'pcimne_register'].includes(r.form)) {
                                const _pcimne = await SyncPcimneData(r, _repoPcime);
                                if (!('pcimne' in outPutInfo)) outPutInfo["pcimne"] = { Errors: '', ErrorCount: 0, SuccessCount: 0 };
                                if (!_pcimne) outPutInfo["pcimne"]["Errors"] += `${r._id}\n | \n `;
                                if (!_pcimne) outPutInfo["pcimne"]["ErrorCount"] += 1;
                                if (_pcimne) outPutInfo["pcimne"]["SuccessCount"] += 1;
                            }
                            if (['delivery'].includes(r.form)) {
                                const _delivery = await SyncDeliveryData(r, _repoDelivery);
                                if (!('delivery' in outPutInfo)) outPutInfo["delivery"] = { Errors: '', ErrorCount: 0, SuccessCount: 0 };
                                if (!_delivery) outPutInfo["delivery"]["Errors"] += `${r._id}\n | \n `;
                                if (!_delivery) outPutInfo["delivery"]["ErrorCount"] += 1;
                                if (_delivery) outPutInfo["delivery"]["SuccessCount"] += 1;
                            }
                            //---------------
                            if (['stock_entry', 'stock_movement', 'pcimne_register', 'adult_consulation'].includes(r.form)) {
                                const _recoMeg = await SyncRecoMegData(r, _repoRecoMeg);
                                if (!('recoMeg' in outPutInfo)) outPutInfo["recoMeg"] = { Errors: '', ErrorCount: 0, SuccessCount: 0 };
                                if (!_recoMeg) outPutInfo["recoMeg"]["Errors"] += `${r._id}\n | \n `;
                                if (!_recoMeg) outPutInfo["recoMeg"]["ErrorCount"] += 1;
                                if (_recoMeg) outPutInfo["recoMeg"]["SuccessCount"] += 1;
                            }
                            if ((['pregnancy_family_planning', 'family_planning'].includes(r.form) && !isTrue(r.fields.is_pregnant) || r.form === 'fp_renewal') && notEmpty(r.fields.fp_method) || r.form === 'fp_danger_sign_check') {
                                const _recoMeg = await SyncRecoMegData(r, _repoRecoMeg);
                                if (!('recoMeg' in outPutInfo)) outPutInfo["recoMeg"] = { Errors: '', ErrorCount: 0, SuccessCount: 0 };
                                if (!_recoMeg) outPutInfo["recoMeg"]["Errors"] += `${r._id}\n | \n `;
                                if (!_recoMeg) outPutInfo["recoMeg"]["ErrorCount"] += 1;
                                if (_recoMeg) outPutInfo["recoMeg"]["SuccessCount"] += 1;
                            }
                            //---------------
                            if (['referral_followup'].includes(r.form)) {
                                const _referal = await SyncReferalData(r, _repoReferal);
                                if (!('referal' in outPutInfo)) outPutInfo["referal"] = { Errors: '', ErrorCount: 0, SuccessCount: 0 };
                                if (!_referal) outPutInfo["referal"]["Errors"] += `${r._id}\n | \n `;
                                if (!_referal) outPutInfo["referal"]["ErrorCount"] += 1;
                                if (_referal) outPutInfo["referal"]["SuccessCount"] += 1;
                            }
                            if (['vaccination_followup'].includes(r.form)) { //vaccination_referal_followup
                                const _vaccination = await SyncVaccinationData(r, _repoVaccination);
                                if (!('vaccination' in outPutInfo)) outPutInfo["vaccination"] = { Errors: '', ErrorCount: 0, SuccessCount: 0 };
                                if (!_vaccination) outPutInfo["vaccination"]["Errors"] += `${r._id}\n | \n `;
                                if (!_vaccination) outPutInfo["vaccination"]["ErrorCount"] += 1;
                                if (_vaccination) outPutInfo["vaccination"]["SuccessCount"] += 1;
                            }

                            if (['event_register'].includes(r.form)) {
                                const _event = await SyncEventsData(r, _repoEvent);
                                if (!('event' in outPutInfo)) outPutInfo["event"] = { Errors: '', ErrorCount: 0, SuccessCount: 0 };
                                if (!_event) outPutInfo["event"]["Errors"] += `${r._id}\n | \n `;
                                if (!_event) outPutInfo["event"]["ErrorCount"] += 1;
                                if (_event) outPutInfo["event"]["SuccessCount"] += 1;
                            }
                            if (['fs_meg_situation'].includes(r.form)) {
                                const _fsMeg = await SyncFsMegData(r, _repoFsMeg);
                                if (!('fsMeg' in outPutInfo)) outPutInfo["fsMeg"] = { Errors: '', ErrorCount: 0, SuccessCount: 0 };
                                if (!_fsMeg) outPutInfo["fsMeg"]["Errors"] += `${r._id}\n | \n `;
                                if (!_fsMeg) outPutInfo["fsMeg"]["ErrorCount"] += 1;
                                if (_fsMeg) outPutInfo["fsMeg"]["SuccessCount"] += 1;
                            }
                            
                            if (['promotional_activity', 'pa_educational_talk', 'pa_home_visit', 'pa_individual_talk'].includes(r.form)) {
                                const _promoAct = await SyncPromotionalData(r, _repoPromotional);
                                if (!('promotionalActivity' in outPutInfo)) outPutInfo["promotionalActivity"] = { Errors: '', ErrorCount: 0, SuccessCount: 0 };
                                if (!_promoAct) outPutInfo["promotionalActivity"]["Errors"] += `${r._id}\n | \n `;
                                if (!_promoAct) outPutInfo["promotionalActivity"]["ErrorCount"] += 1;
                                if (_promoAct) outPutInfo["promotionalActivity"]["SuccessCount"] += 1;
                            }

                            // if (['death_report', 'undo_death_report'].includes(r.form)) {
                            if (['death_report'].includes(r.form)) {
                                const _death = await SyncDeathData(r, _repoDeath);
                                if (!('death' in outPutInfo)) outPutInfo["death"] = { Errors: '', ErrorCount: 0, SuccessCount: 0 };
                                if (!_death) outPutInfo["death"]["Errors"] += `${r._id}\n | \n `;
                                if (!_death) outPutInfo["death"]["ErrorCount"] += 1;
                                if (_death) outPutInfo["death"]["SuccessCount"] += 1;
                            }
                        }
                    }

                    if (done === len) return resp.status(200).json(outPutInfo);
                } else {
                    outPutInfo["status"] = 200;
                    if (!("Message" in outPutInfo)) {
                        outPutInfo["Message"] = { 
                            SuccessCount: 0, 
                            ErrorCount: 0, 
                            ErrorElements: 'Pas de donnée trouvée avec les paramettres renseignés', 
                            ErrorIds: '' 
                        };
                    }
                    return resp.status(200).json(outPutInfo);
                }
            } catch (err: any) {
                console.log(err)
                if (!err.statusCode) err.statusCode = 500;
                outPutInfo["catchErrors"] = err.message;
                resp.status(err.statusCode).json(outPutInfo);
            }
        }).catch((err: any) => {
            console.log(err)
        }).finally(() => {
            console.log('Finish!')
        })
    } catch (err: any) {
        console.log(err)
        if (!err.statusCode) err.statusCode = 500;
        outPutInfo["catchErrors"] = err.message;
        resp.status(err.statusCode).json(outPutInfo);
    }
}

export async function SYNC_APP_USERS_FROM_COUCHDB(req: Request, res: Response, next: NextFunction) {
    request({
        url: `${CHT_PROTOCOL}://${CHT_HOST}:${NODE_ENV === 'production' ? CHT_PROD_PORT : CHT_DEV_PORT}/api/v1/users`,
        method: 'GET',
        headers: httpHeaders()
    }, async function (error: any, response: any, body: any) {
        if (error) return res.status(201).json({ status: 201, message: 'Error Found!' });
        try {
            const users = JSON.parse(body);
            const _repo = await getCouchdbUsersRepository();
            for (let i = 0; i < users.length; i++) {
                const user = users[i];
                if (user.contact?._id && user.place?._id) {
                    const _sync = new CouchdbUsers();
                    _sync.id = user.id;
                    _sync.rev = user.rev;
                    _sync.username = user.username;
                    _sync.fullname = user.contact.name;
                    _sync.code = user.contact.external_id;
                    _sync.type = user.type;
                    _sync.contact = user.contact._id;
                    _sync.role = user.contact.role;
                    _sync.place = user.place._id;
                    await _repo.save(_sync);
                }
            }
            const couchUsers = await _repo.find();
            if (couchUsers.length <= 0) return res.status(201).json({ status: 201, data: "Pas d'utilisateur couchDb trouvé" });
            return res.status(200).json({ status: 200, data: couchUsers });
        } catch (err: any) {
            return res.status(500).json({ status: 500, data: err.toString() });
        }

    });
}

export async function SYNC_ORG_UNITS_AND_CONTACTS_FROM_COUCHDB(req: Request, resp: Response, next: NextFunction) {
    var outPutInfo: any = {};
    if (!validationResult(req).isEmpty()) {
        outPutInfo["status"] = 500;
        outPutInfo["validationError"] = "Your request provides was rejected !";
        return resp.status(500).json(outPutInfo);
    }
    
    
    const { userId, start_date, end_date, year, month, country, region, prefecture, commune, hospital, district_quartier, mentor, village_secteur, chw, reco, family, patient } = req.body;
    var filterDate = {start_date: '', end_date: ''};
    if (start_date && end_date) {
        filterDate = {start_date: start_date, end_date: end_date};
    } else {
        filterDate = getFirstAndLastDayOfMonth(year, month);
    }
    try {
        // const startKey = date_to_milisecond('2024-04-01', true);
        const startKey = date_to_milisecond(filterDate.start_date, true);
        const endKey = date_to_milisecond(filterDate.end_date, false);
        await AxioFetchCouchDbData('contacts_by_date', { startKey, endKey }).then(async (response: any) => {
            try {
                const _repoCountry = await getCountryRepository();
                const _repoRegion = await getRegionRepository();
                const _repoPrefecture = await getPrefectureRepository();
                const _repoCommune = await getCommuneRepository();
                const _repoHospital = await getHospitalRepository();
                const _repoDistrictQuartier = await getDistrictQuartierRepository();
                const _repoVillageSecteur = await getVillageSecteurRepository();
                const _repoFamily = await getFamilyRepository();
                const _repoMentor = await getMentorRepository();
                const _repoChw = await getChwRepository();
                const _repoReco = await getRecoRepository();
                const _repoPatient = await getPatientRepository();

                var rows: any = response.data.rows;
                if (rows && rows.length > 0) {
                    var len = rows.length;
                    var done: number = 0;
                    var outDoneLenght: number = 0;

                    if (country === true) {
                        outDoneLenght++;
                        for (let i = 0; i < len; i++) {
                            done++;
                            const r: any = rows[i].doc;
                            if (!("Country" in outPutInfo)) outPutInfo["Country"] = { SuccessCount: 0, ErrorCount: 0, ErrorElements: '', ErrorIds: '' };
                            try {
                                if (r && (r.type === 'country' || r.contact_type === 'country')) {
                                    const reported_date = milisecond_to_date(r.reported_date, 'dateOnly');
                                    const m = (new Date(reported_date)).getMonth() + 1;
                                    const year = (new Date(reported_date)).getFullYear();
                                    const month = m < 10 ? `0${m}` : `${m}`

                                    const _country = new Country();
                                    _country.id = r._id;
                                    _country.rev = r._rev;
                                    _country.name = r.name;
                                    _country.external_id = r.external_id;
                                    _country.code = r.code;
                                    _country.geolocation = r.geolocation;
                                    _country.reported_date_timestamp = r.reported_date;
                                    _country.reported_date = reported_date;
                                    _country.reported_full_date = milisecond_to_date(r.reported_date, 'fulldate');
                                    _country.year = year;
                                    _country.month = month;
                                    await _repoCountry.save(_country);
                                    outPutInfo["Country"]["SuccessCount"] += 1;
                                }
                            } catch (err: any) {
                                outPutInfo["Country"]["ErrorCount"] += 1;
                                outPutInfo["Country"]["ErrorElements"] += `${_sepation}${err.toString()}`;
                                outPutInfo["Country"]["ErrorIds"] += `${_sepation}${r._id}`;
                            }
                        }
                    }
                    if (region === true) {
                        outDoneLenght++;
                        for (let i = 0; i < len; i++) {
                            done++;
                            const r: any = rows[i].doc;
                            if (!("Region" in outPutInfo)) outPutInfo["Region"] = { SuccessCount: 0, ErrorCount: 0, ErrorElements: '', ErrorIds: '' };
                            try {
                                if (r &&
                                    'parent' in r &&
                                    (r.type === 'region' || r.contact_type === 'region')) {
                                    const reported_date = milisecond_to_date(r.reported_date, 'dateOnly');
                                    const m = (new Date(reported_date)).getMonth() + 1;
                                    const year = (new Date(reported_date)).getFullYear();
                                    const month = m < 10 ? `0${m}` : `${m}`

                                    const _region = new Region();
                                    _region.id = r._id;
                                    _region.rev = r._rev;
                                    _region.name = r.name;
                                    _region.external_id = r.external_id;
                                    _region.code = r.code;
                                    _region.geolocation = r.geolocation;
                                    _region.country = r.parent._id;
                                    _region.reported_date_timestamp = r.reported_date;
                                    _region.reported_date = reported_date;
                                    _region.reported_full_date = milisecond_to_date(r.reported_date, 'fulldate');
                                    _region.year = year;
                                    _region.month = month;
                                    await _repoRegion.save(_region);
                                    outPutInfo["Region"]["SuccessCount"] += 1;
                                }
                            } catch (err: any) {
                                outPutInfo["Region"]["ErrorCount"] += 1;
                                outPutInfo["Region"]["ErrorElements"] += `${_sepation}${err.toString()}`;
                                outPutInfo["Region"]["ErrorIds"] += `${_sepation}${r._id}`;
                            }
                        }
                    }
                    if (prefecture === true) {
                        outDoneLenght++;
                        for (let i = 0; i < len; i++) {
                            done++;
                            const r: any = rows[i].doc;
                            if (!("Prefecture" in outPutInfo)) outPutInfo["Prefecture"] = { SuccessCount: 0, ErrorCount: 0, ErrorElements: '', ErrorIds: '' };
                            try {
                                if (r &&
                                    'parent' in r &&
                                    'parent' in r.parent &&
                                    (r.type === 'prefecture' || r.contact_type === 'prefecture')) {
                                    const reported_date = milisecond_to_date(r.reported_date, 'dateOnly');
                                    const m = (new Date(reported_date)).getMonth() + 1;
                                    const year = (new Date(reported_date)).getFullYear();
                                    const month = m < 10 ? `0${m}` : `${m}`

                                    const _prefecture = new Prefecture();
                                    _prefecture.id = r._id;
                                    _prefecture.rev = r._rev;
                                    _prefecture.name = r.name;
                                    _prefecture.external_id = r.external_id;
                                    _prefecture.code = r.code;
                                    _prefecture.geolocation = r.geolocation;
                                    _prefecture.region = r.parent._id;
                                    _prefecture.country = r.parent.parent._id;
                                    _prefecture.reported_date_timestamp = r.reported_date;
                                    _prefecture.reported_date = reported_date;
                                    _prefecture.reported_full_date = milisecond_to_date(r.reported_date, 'fulldate');
                                    _prefecture.year = year;
                                    _prefecture.month = month;
                                    await _repoPrefecture.save(_prefecture);
                                    outPutInfo["Prefecture"]["SuccessCount"] += 1;
                                }
                            } catch (err: any) {
                                outPutInfo["Prefecture"]["ErrorCount"] += 1;
                                outPutInfo["Prefecture"]["ErrorElements"] += `${_sepation}${err.toString()}`;
                                outPutInfo["Prefecture"]["ErrorIds"] += `${_sepation}${r._id}`;
                            }
                        }

                    }
                    if (commune === true) {
                        outDoneLenght++;
                        for (let i = 0; i < len; i++) {
                            done++;
                            const r: any = rows[i].doc;
                            if (!("Commune" in outPutInfo)) outPutInfo["Commune"] = { SuccessCount: 0, ErrorCount: 0, ErrorElements: '', ErrorIds: '' };
                            try {
                                if (r &&
                                    'parent' in r &&
                                    'parent' in r.parent &&
                                    'parent' in r.parent.parent &&
                                    (r.type === 'commune' || r.contact_type === 'commune')) {
                                    const reported_date = milisecond_to_date(r.reported_date, 'dateOnly');
                                    const m = (new Date(reported_date)).getMonth() + 1;
                                    const year = (new Date(reported_date)).getFullYear();
                                    const month = m < 10 ? `0${m}` : `${m}`

                                    const _commune = new Commune();
                                    _commune.id = r._id;
                                    _commune.rev = r._rev;
                                    _commune.name = r.name;
                                    _commune.external_id = r.external_id;
                                    _commune.code = r.code;
                                    _commune.geolocation = r.geolocation;
                                    _commune.prefecture = r.parent._id;
                                    _commune.region = r.parent.parent._id;
                                    _commune.country = r.parent.parent.parent._id;
                                    _commune.reported_date_timestamp = r.reported_date;
                                    _commune.reported_date = reported_date;
                                    _commune.reported_full_date = milisecond_to_date(r.reported_date, 'fulldate');
                                    _commune.year = year;
                                    _commune.month = month;
                                    await _repoCommune.save(_commune);
                                    outPutInfo["Commune"]["SuccessCount"] += 1;
                                }
                            } catch (err: any) {
                                outPutInfo["Commune"]["ErrorCount"] += 1;
                                outPutInfo["Commune"]["ErrorElements"] += `${_sepation}${err.toString()}`;
                                outPutInfo["Commune"]["ErrorIds"] += `${_sepation}${r._id}`;
                            }
                        }

                    }
                    if (hospital === true) {
                        outDoneLenght++;
                        for (let i = 0; i < len; i++) {
                            done++;
                            const r: any = rows[i].doc;
                            if (!("Hospital" in outPutInfo)) outPutInfo["Hospital"] = { SuccessCount: 0, ErrorCount: 0, ErrorElements: '', ErrorIds: '' };
                            try {
                                if (r &&
                                    'parent' in r &&
                                    'parent' in r.parent &&
                                    'parent' in r.parent.parent &&
                                    'parent' in r.parent.parent.parent && (r.type === 'hospital' || r.contact_type === 'hospital')) {
                                    const reported_date = milisecond_to_date(r.reported_date, 'dateOnly');
                                    const m = (new Date(reported_date)).getMonth() + 1;
                                    const year = (new Date(reported_date)).getFullYear();
                                    const month = m < 10 ? `0${m}` : `${m}`

                                    const _hospital = new Hospital();
                                    _hospital.id = r._id;
                                    _hospital.rev = r._rev;
                                    _hospital.name = r.name;
                                    _hospital.external_id = r.external_id;
                                    _hospital.code = r.code;
                                    _hospital.geolocation = r.geolocation;
                                    _hospital.commune = r.parent._id;
                                    _hospital.prefecture = r.parent.parent._id;
                                    _hospital.region = r.parent.parent.parent._id;
                                    _hospital.country = r.parent.parent.parent.parent._id;
                                    _hospital.reported_date_timestamp = r.reported_date;
                                    _hospital.reported_date = reported_date;
                                    _hospital.reported_full_date = milisecond_to_date(r.reported_date, 'fulldate');
                                    _hospital.year = year;
                                    _hospital.month = month;
                                    await _repoHospital.save(_hospital);
                                    outPutInfo["Hospital"]["SuccessCount"] += 1;
                                }
                            } catch (err: any) {
                                outPutInfo["Hospital"]["ErrorCount"] += 1;
                                outPutInfo["Hospital"]["ErrorElements"] += `${_sepation}${err.toString()}`;
                                outPutInfo["Hospital"]["ErrorIds"] += `${_sepation}${r._id}`;
                            }
                        }
                    }
                    if (district_quartier === true) {
                        outDoneLenght++;
                        for (let i = 0; i < len; i++) {
                            done++;
                            const r: any = rows[i].doc;
                            if (!("DistrictQuartier" in outPutInfo)) outPutInfo["DistrictQuartier"] = { SuccessCount: 0, ErrorCount: 0, ErrorElements: '', ErrorIds: '' };
                            try {
                                if (r &&
                                    'parent' in r &&
                                    'parent' in r.parent &&
                                    'parent' in r.parent.parent &&
                                    'parent' in r.parent.parent.parent &&
                                    'parent' in r.parent.parent.parent.parent &&
                                    (r.type === 'district_hospital' || r.contact_type === 'district_hospital')) {
                                    const reported_date = milisecond_to_date(r.reported_date, 'dateOnly');
                                    const m = (new Date(reported_date)).getMonth() + 1;
                                    const year = (new Date(reported_date)).getFullYear();
                                    const month = m < 10 ? `0${m}` : `${m}`

                                    const _districtH = new DistrictQuartier();
                                    _districtH.id = r._id;
                                    _districtH.rev = r._rev;
                                    _districtH.name = r.name;
                                    _districtH.external_id = r.external_id;
                                    _districtH.code = r.code;
                                    _districtH.geolocation = r.geolocation;
                                    _districtH.hospital = r.parent._id;
                                    _districtH.commune = r.parent.parent._id;
                                    _districtH.prefecture = r.parent.parent.parent._id;
                                    _districtH.region = r.parent.parent.parent.parent._id;
                                    _districtH.country = r.parent.parent.parent.parent.parent._id;
                                    _districtH.chw_id = r.contact._id;
                                    _districtH.reported_date_timestamp = r.reported_date;
                                    _districtH.reported_date = reported_date;
                                    _districtH.reported_full_date = milisecond_to_date(r.reported_date, 'fulldate');
                                    _districtH.year = year;
                                    _districtH.month = month;
                                    await _repoDistrictQuartier.save(_districtH);
                                    outPutInfo["DistrictQuartier"]["SuccessCount"] += 1;
                                }
                            } catch (err: any) {
                                outPutInfo["DistrictQuartier"]["ErrorCount"] += 1;
                                outPutInfo["DistrictQuartier"]["ErrorElements"] += `${_sepation}${err.toString()}`;
                                outPutInfo["DistrictQuartier"]["ErrorIds"] += `${_sepation}${r._id}`;
                            }
                        }
                    }
                    if (village_secteur === true) {
                        outDoneLenght++;
                        for (let i = 0; i < len; i++) {
                            done++;
                            const r: any = rows[i].doc;
                            if (!("VillageSecteur" in outPutInfo)) outPutInfo["VillageSecteur"] = { SuccessCount: 0, ErrorCount: 0, ErrorElements: '', ErrorIds: '' };
                            try {
                                if (r &&
                                    'parent' in r &&
                                    'parent' in r.parent &&
                                    'parent' in r.parent.parent &&
                                    'parent' in r.parent.parent.parent &&
                                    'parent' in r.parent.parent.parent.parent &&
                                    'parent' in r.parent.parent.parent.parent.parent &&
                                    (r.type === 'health_center' || r.contact_type === 'health_center')) {
                                    const reported_date = milisecond_to_date(r.reported_date, 'dateOnly');
                                    const m = (new Date(reported_date)).getMonth() + 1;
                                    const year = (new Date(reported_date)).getFullYear();
                                    const month = m < 10 ? `0${m}` : `${m}`

                                    const _villageS = new VillageSecteur();
                                    _villageS.id = r._id;
                                    _villageS.rev = r._rev;
                                    _villageS.name = r.name;
                                    _villageS.external_id = r.external_id;
                                    _villageS.code = r.code;
                                    _villageS.geolocation = r.geolocation;
                                    _villageS.district_quartier = r.parent._id;
                                    _villageS.hospital = r.parent.parent._id;
                                    _villageS.commune = r.parent.parent.parent._id;
                                    _villageS.prefecture = r.parent.parent.parent.parent._id;
                                    _villageS.region = r.parent.parent.parent.parent.parent._id;
                                    _villageS.country = r.parent.parent.parent.parent.parent.parent._id;
                                    _villageS.reco_id = r.contact._id;
                                    _villageS.reported_date_timestamp = r.reported_date;
                                    _villageS.reported_date = reported_date;
                                    _villageS.reported_full_date = milisecond_to_date(r.reported_date, 'fulldate');
                                    _villageS.year = year;
                                    _villageS.month = month;
                                    await _repoVillageSecteur.save(_villageS);
                                    outPutInfo["VillageSecteur"]["SuccessCount"] += 1;
                                }
                            } catch (err: any) {
                                outPutInfo["VillageSecteur"]["ErrorCount"] += 1;
                                outPutInfo["VillageSecteur"]["ErrorElements"] += `${_sepation}${err.toString()}`;
                                outPutInfo["VillageSecteur"]["ErrorIds"] += `${_sepation}${r._id}`;
                            }
                        }

                    }
                    if (mentor === true) {
                        outDoneLenght++;
                        for (let i = 0; i < len; i++) {
                            done++;
                            const r: any = rows[i].doc;
                            if (!("Mentor" in outPutInfo)) outPutInfo["Mentor"] = { SuccessCount: 0, ErrorCount: 0, ErrorElements: '', ErrorIds: '' };
                            try {
                                if (r &&
                                    'parent' in r &&
                                    'parent' in r.parent &&
                                    'parent' in r.parent.parent &&
                                    'parent' in r.parent.parent.parent &&
                                    'parent' in r.parent.parent.parent.parent &&
                                    r.type === 'person' && r.role === 'mentor') {
                                    const reported_date = milisecond_to_date(r.reported_date, 'dateOnly');
                                    const m = (new Date(reported_date)).getMonth() + 1;
                                    const year = (new Date(reported_date)).getFullYear();
                                    const month = m < 10 ? `0${m}` : `${m}`

                                    const _mentor = new Mentor();
                                    _mentor.id = r._id;
                                    _mentor.rev = r._rev;
                                    _mentor.name = r.name;
                                    _mentor.external_id = r.external_id;
                                    _mentor.code = r.code;
                                    _mentor.role = r.role;
                                    _mentor.sex = getSexe(r.sex);
                                    _mentor.date_of_birth = r.date_of_birth;
                                    _mentor.phone = r.phone;
                                    _mentor.email = r.email;
                                    _mentor.profession = r.profession;
                                    _mentor.geolocation = r.geolocation;
                                    _mentor.hospital = r.parent._id;
                                    _mentor.commune = r.parent.parent._id;
                                    _mentor.prefecture = r.parent.parent.parent._id;
                                    _mentor.region = r.parent.parent.parent.parent._id;
                                    _mentor.country = r.parent.parent.parent.parent.parent._id;
                                    _mentor.reported_date_timestamp = r.reported_date;
                                    _mentor.reported_date = reported_date;
                                    _mentor.reported_full_date = milisecond_to_date(r.reported_date, 'fulldate');
                                    _mentor.year = year;
                                    _mentor.month = month;
                                    await _repoMentor.save(_mentor);
                                    outPutInfo["Mentor"]["SuccessCount"] += 1;
                                }
                            } catch (err: any) {
                                outPutInfo["Mentor"]["ErrorCount"] += 1;
                                outPutInfo["Mentor"]["ErrorElements"] += `${_sepation}${err.toString()}`;
                                outPutInfo["Mentor"]["ErrorIds"] += `${_sepation}${r._id}`;
                            }
                        }

                    }
                    if (chw === true) {
                        outDoneLenght++;
                        for (let i = 0; i < len; i++) {
                            done++;
                            const r: any = rows[i].doc;
                            if (!("Chw" in outPutInfo)) outPutInfo["Chw"] = { SuccessCount: 0, ErrorCount: 0, ErrorElements: '', ErrorIds: '' };
                            try {
                                if (r &&
                                    'parent' in r &&
                                    'parent' in r.parent &&
                                    'parent' in r.parent.parent &&
                                    'parent' in r.parent.parent.parent &&
                                    'parent' in r.parent.parent.parent.parent &&
                                    'parent' in r.parent.parent.parent.parent.parent &&
                                    r.type === 'person' && r.role === 'chw') {
                                    const reported_date = milisecond_to_date(r.reported_date, 'dateOnly');
                                    const m = (new Date(reported_date)).getMonth() + 1;
                                    const year = (new Date(reported_date)).getFullYear();
                                    const month = m < 10 ? `0${m}` : `${m}`

                                    const _chw = new Chw();
                                    _chw.id = r._id;
                                    _chw.rev = r._rev;
                                    _chw.name = r.name;
                                    _chw.external_id = r.external_id;
                                    _chw.code = r.code;
                                    _chw.role = r.role;
                                    _chw.sex = getSexe(r.sex);;
                                    _chw.date_of_birth = r.date_of_birth;
                                    _chw.phone = r.phone;
                                    _chw.email = r.email;
                                    _chw.profession = r.profession;
                                    _chw.geolocation = r.geolocation;
                                    _chw.district_quartier = r.parent._id;
                                    _chw.hospital = r.parent.parent._id;
                                    _chw.commune = r.parent.parent.parent._id;
                                    _chw.prefecture = r.parent.parent.parent.parent._id;
                                    _chw.region = r.parent.parent.parent.parent.parent._id;
                                    _chw.country = r.parent.parent.parent.parent.parent.parent._id;
                                    _chw.reported_date_timestamp = r.reported_date;
                                    _chw.reported_date = reported_date;
                                    _chw.reported_full_date = milisecond_to_date(r.reported_date, 'fulldate');
                                    _chw.year = year;
                                    _chw.month = month;
                                    await _repoChw.save(_chw);
                                    outPutInfo["Chw"]["SuccessCount"] += 1;
                                }
                            } catch (err: any) {
                                outPutInfo["Chw"]["ErrorCount"] += 1;
                                outPutInfo["Chw"]["ErrorElements"] += `${_sepation}${err.toString()}`;
                                outPutInfo["Chw"]["ErrorIds"] += `${_sepation}${r._id}`;
                            }
                        }

                    }
                    if (reco === true) {
                        outDoneLenght++;
                        for (let i = 0; i < len; i++) {
                            done++;
                            const r: any = rows[i].doc;
                            if (!("Reco" in outPutInfo)) outPutInfo["Reco"] = { SuccessCount: 0, ErrorCount: 0, ErrorElements: '', ErrorIds: '' };
                            try {
                                if (r &&
                                    'parent' in r &&
                                    'parent' in r.parent &&
                                    'parent' in r.parent.parent &&
                                    'parent' in r.parent.parent.parent &&
                                    'parent' in r.parent.parent.parent.parent &&
                                    'parent' in r.parent.parent.parent.parent.parent &&
                                    'parent' in r.parent.parent.parent.parent.parent.parent &&
                                    r.type === 'person' && r.role === 'reco') {
                                    const reported_date = milisecond_to_date(r.reported_date, 'dateOnly');
                                    const m = (new Date(reported_date)).getMonth() + 1;
                                    const year = (new Date(reported_date)).getFullYear();
                                    const month = m < 10 ? `0${m}` : `${m}`

                                    const _reco = new Reco();
                                    _reco.id = r._id;
                                    _reco.rev = r._rev;
                                    _reco.name = r.name;
                                    _reco.external_id = r.external_id;
                                    _reco.code = r.code;
                                    _reco.role = r.role;
                                    _reco.sex = getSexe(r.sex);;
                                    _reco.date_of_birth = r.date_of_birth;
                                    _reco.phone = r.phone;
                                    _reco.email = r.email;
                                    _reco.profession = r.profession;
                                    _reco.chw = (await _repoChw.findOneBy({ district_quartier: { id: r.parent.parent._id } }));
                                    _reco.geolocation = r.geolocation;
                                    _reco.village_secteur = r.parent._id;
                                    _reco.district_quartier = r.parent.parent._id;
                                    _reco.hospital = r.parent.parent.parent._id;
                                    _reco.commune = r.parent.parent.parent.parent._id;
                                    _reco.prefecture = r.parent.parent.parent.parent.parent._id;
                                    _reco.region = r.parent.parent.parent.parent.parent.parent._id;
                                    _reco.country = r.parent.parent.parent.parent.parent.parent.parent._id;
                                    _reco.reported_date_timestamp = r.reported_date;
                                    _reco.reported_date = reported_date;
                                    _reco.reported_full_date = milisecond_to_date(r.reported_date, 'fulldate');
                                    _reco.year = year;
                                    _reco.month = month;
                                    await _repoReco.save(_reco);
                                    outPutInfo["Reco"]["SuccessCount"] += 1;
                                }
                            } catch (err: any) {
                                outPutInfo["Reco"]["ErrorCount"] += 1;
                                outPutInfo["Reco"]["ErrorElements"] += `${_sepation}${err.toString()}`;
                                outPutInfo["Reco"]["ErrorIds"] += `${_sepation}${r._id}`;
                            }
                        }

                    }
                    if (family === true) {
                        outDoneLenght++;
                        for (let i = 0; i < len; i++) {
                            done++;
                            const r: any = rows[i].doc;
                            if (!("Family" in outPutInfo)) outPutInfo["Family"] = { SuccessCount: 0, ErrorCount: 0, ErrorElements: '', ErrorIds: '' };
                            try {
                                if (r &&
                                    'parent' in r &&
                                    'parent' in r.parent &&
                                    'parent' in r.parent.parent &&
                                    'parent' in r.parent.parent.parent &&
                                    'parent' in r.parent.parent.parent.parent &&
                                    'parent' in r.parent.parent.parent.parent.parent &&
                                    'parent' in r.parent.parent.parent.parent.parent.parent &&
                                    (r.type === 'clinic' || r.contact_type === 'clinic')) {
                                    const reported_date = milisecond_to_date(r.reported_date, 'dateOnly');
                                    const m = (new Date(reported_date)).getMonth() + 1;
                                    const year = (new Date(reported_date)).getFullYear();
                                    const month = m < 10 ? `0${m}` : `${m}`

                                    const _family = new Family();
                                    _family.id = r._id;
                                    _family.rev = r._rev;
                                    _family.name = r.name;
                                    _family.external_id = r.external_id;
                                    _family.code = r.code;
                                    _family.geolocation = r.geolocation;
                                    _family.village_secteur = r.parent._id;
                                    _family.district_quartier = r.parent.parent._id;
                                    _family.hospital = r.parent.parent.parent._id;
                                    _family.commune = r.parent.parent.parent.parent._id;
                                    _family.prefecture = r.parent.parent.parent.parent.parent._id;
                                    _family.region = r.parent.parent.parent.parent.parent.parent._id;
                                    _family.country = r.parent.parent.parent.parent.parent.parent.parent._id;
                                    _family.reco = r.user_info.created_user_id
                                    _family.chw = (await _repoChw.findOneBy({ district_quartier: { id: r.parent.parent._id } }));
                                    _family.household_has_working_latrine = r.household_has_working_latrine;
                                    _family.household_has_good_water_access = r.household_has_good_water_access;
                                    _family.reported_date_timestamp = r.reported_date;
                                    _family.reported_date = reported_date;
                                    _family.reported_full_date = milisecond_to_date(r.reported_date, 'fulldate');
                                    _family.year = year;
                                    _family.month = month;
                                    await _repoFamily.save(_family);
                                    outPutInfo["Family"]["SuccessCount"] += 1;
                                }
                            } catch (err: any) {
                                outPutInfo["Family"]["ErrorCount"] += 1;
                                outPutInfo["Family"]["ErrorElements"] += `${_sepation}${err.toString()}`;
                                outPutInfo["Family"]["ErrorIds"] += `${_sepation}${r._id}`;
                            }
                        }

                    }
                    if (patient === true) {
                        outDoneLenght++;
                        for (let i = 0; i < len; i++) {
                            done++;
                            const r: any = rows[i].doc;
                            if (!("Patient" in outPutInfo)) outPutInfo["Patient"] = { SuccessCount: 0, ErrorCount: 0, ErrorElements: '', ErrorIds: '' };
                            try {
                                if (r &&
                                    'parent' in r &&
                                    'parent' in r.parent &&
                                    'parent' in r.parent.parent &&
                                    'parent' in r.parent.parent.parent &&
                                    'parent' in r.parent.parent.parent.parent &&
                                    'parent' in r.parent.parent.parent.parent.parent &&
                                    'parent' in r.parent.parent.parent.parent.parent.parent &&
                                    'parent' in r.parent.parent.parent.parent.parent.parent.parent &&
                                    r.type === 'person' && r.role === 'patient') {
                                    const reported_date = milisecond_to_date(r.reported_date, 'dateOnly');
                                    const m = (new Date(reported_date)).getMonth() + 1;
                                    const year = (new Date(reported_date)).getFullYear();
                                    const month = m < 10 ? `0${m}` : `${m}`

                                    const _patient = new Patient();
                                    var date_of_death = null;
                                    var year_of_death = null;
                                    var month_of_death = null;

                                    if (notEmpty(r.date_of_death) && parseFloat(`${r.date_of_death}`) > 0) {
                                        date_of_death = milisecond_to_date(r.date_of_death, 'dateOnly');
                                        const dm = (new Date(date_of_death)).getMonth() + 1;
                                        year_of_death = (new Date(date_of_death)).getFullYear();
                                        month_of_death = dm < 10 ? `0${dm}` : `${dm}`
                                    }
                                    _patient.id = r._id;
                                    _patient.rev = r._rev;
                                    _patient.name = r.name;
                                    _patient.external_id = r.external_id;
                                    _patient.code = r.code;
                                    _patient.role = r.role;
                                    _patient.sex = getSexe(r.sex);
                                    _patient.date_of_birth = r.date_of_birth;
                                    _patient.phone = r.phone;
                                    _patient.profession = r.profession;
                                    _patient.has_birth_certificate = isTrue(r.has_birth_certificate);
                                    _patient.geolocation = r.geolocation;
                                    _patient.family = r.parent._id;
                                    _patient.village_secteur = r.parent.parent._id;
                                    _patient.district_quartier = r.parent.parent.parent._id;
                                    _patient.hospital = r.parent.parent.parent.parent._id;
                                    _patient.commune = r.parent.parent.parent.parent.parent._id;
                                    _patient.prefecture = r.parent.parent.parent.parent.parent.parent._id;
                                    _patient.region = r.parent.parent.parent.parent.parent.parent.parent._id;
                                    _patient.country = r.parent.parent.parent.parent.parent.parent.parent.parent._id;
                                    _patient.chw = (await _repoChw.findOneBy({ district_quartier: { id: r.parent.parent.parent._id } }));
                                    _patient.reco = r.user_info.created_user_id
                                    _patient.reported_date_timestamp = r.reported_date;
                                    _patient.reported_date = reported_date;
                                    _patient.reported_full_date = milisecond_to_date(r.reported_date, 'fulldate');
                                    _patient.year = year;
                                    _patient.month = month;
                                    _patient.age_in_year_on_creation = getAgeIn("years", r.date_of_birth, r.reported_date);
                                    _patient.age_in_month_on_creation = getAgeIn("months", r.date_of_birth, r.reported_date);
                                    _patient.age_in_day_on_creation = getAgeIn("days", r.date_of_birth, r.reported_date);
                                    _patient.date_of_death = date_of_death;
                                    _patient.year_of_death = year_of_death;
                                    _patient.month_of_death = month_of_death;
                                    _patient.place_of_death = r.place_of_death;
                                    _patient.is_home_death = isTrue(r.is_home_death)
                                    _patient.is_stillbirth = isTrue(r.is_stillbirth)
                                    await _repoPatient.save(_patient);
                                    outPutInfo["Patient"]["SuccessCount"] += 1;
                                }
                            } catch (err: any) {
                                outPutInfo["Patient"]["ErrorCount"] += 1;
                                outPutInfo["Patient"]["ErrorElements"] += `${_sepation}${err.toString()}`;
                                outPutInfo["Patient"]["ErrorIds"] += `${_sepation}${r._id}`;
                            }
                        }

                    }

                    if (done === len * outDoneLenght) {
                        outPutInfo["status"] = 200;
                        return resp.status(200).json(outPutInfo);
                    }
                } else {
                    outPutInfo["status"] = 200;
                    if (!("Message" in outPutInfo)) {
                        outPutInfo["Message"] = { 
                            SuccessCount: 0, 
                            ErrorCount: 0, 
                            ErrorElements: 'Pas de donnée trouvée avec les paramettres renseignés', 
                            ErrorIds: '' 
                        };
                    }
                    return resp.status(200).json(outPutInfo);
                }
            } catch (err: any) {
                if (!err.statusCode) err.statusCode = 500;
                outPutInfo["status"] = err.statusCode;
                outPutInfo["InnerCatch"] = "Inner Catch Error";
                return resp.status(err.statusCode).json(outPutInfo);
            }
        }).catch((err: any) => {
            if (!err.statusCode) err.statusCode = 500;
            outPutInfo["status"] = err.statusCode;
            outPutInfo["AxioCatch"] = "Axio Catch Error";
            return resp.status(err.statusCode).json(outPutInfo);
        });
    } catch (err: any) {
        if (!err.statusCode) err.statusCode = 500;
        outPutInfo["status"] = err.statusCode;
        outPutInfo["GlobalCatch"] = "Global Catch Error";
        return resp.status(err.statusCode).json(outPutInfo);
    }
}