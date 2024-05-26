import { NextFunction, Request, Response } from "express";
import { validationResult } from 'express-validator';
import { ChwsRecoReport, getChwsRecoReportRepository } from "../../../entities/Reports";
import { ChwsRecoReportElements, RecoCoustomQuery } from "../../../utils/Interfaces";
import { Family, Patient, Reco } from "../../../entities/Org-units";
import { PregnantData } from "../../../entities/_Pregnant-data";
import { AdultData } from "../../../entities/_Adult-data";
import { DeliveryData } from "../../../entities/_Delivery-data";
import { EventsData } from "../../../entities/_Events-data";
import { FamilyPlanningData } from "../../../entities/_FamilyPlannig-data";
import { NewbornData } from "../../../entities/_Newborn-data";
import { PcimneData } from "../../../entities/_Pcimne-data";
import { PromotionalActivityData } from "../../../entities/_Promotional-data";
import { VaccinationData } from "../../../entities/_Vaccination-data";
import { DataSource } from "typeorm";
import { AppDataSource } from "../../../data_source";
import { DeathData } from "../../../entities/_Death-data";
import { date_to_milisecond, isChildUnder5 } from "../../../utils/date-utils";
import { getFirstAndLastDayOfMonth, notEmpty } from "../../../utils/functions";
import { RECOS_COUSTOM_QUERY } from "../../orgunit-query/org-units-coustom";

let Connection: DataSource = AppDataSource.manager.connection;

export async function CHW_RECO_REPORTS_CALCULATION(req: Request, res: Response, next: NextFunction): Promise<any> {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(201).json({ status: 201, data: 'Informations you provided are not valid' });
    }
    
    var { month, year } = req.body;
    const outPutData = await CHW_RECO_REPORTS_CALCULATION_DATA({ month, year });

    if (outPutData.SuccessCount === outPutData.recos_length || outPutData.ErrorsCount === outPutData.recos_length || (outPutData.ErrorsCount + outPutData.SuccessCount) === outPutData.recos_length) {
        outPutData.status = 200;
        // outPutData.data =  await Connection.query(`SELECT * FROM chws_reco_report WHERE month = $1 AND year = $2`, [month, year]);
        return res.status(200).json(outPutData);
    }
}


export async function CHW_RECO_REPORTS_CALCULATION_DATA({ month, year }: { month: string, year: number }): Promise<{ status: number, ErrorsCount: number, SuccessCount: number, data: any, recos_length: number }> {
    const _repoReport = await getChwsRecoReportRepository();
    const recos: RecoCoustomQuery[] = await RECOS_COUSTOM_QUERY();
    const outPutData: { status: number, ErrorsCount: number, SuccessCount: number, data: any, recos_length: number } = { status: 201, ErrorsCount: 0, SuccessCount: 0, data: null, recos_length: recos.length };
    const filterDate = getFirstAndLastDayOfMonth(year, month);
    const timestamp = parseInt(date_to_milisecond(filterDate.end_date, false));

    const __vaccines: any[] = await Connection.query(`SELECT * FROM vaccination_data WHERE month = $1 AND year = $2 AND age_in_months >=0 AND age_in_months < 60`, [month, year]);
    const __pcimnes: any[] = await Connection.query(`SELECT * FROM pcimne_data WHERE month = $1 AND year = $2 AND age_in_months >=0 AND age_in_months < 60`, [month, year]);
    const __newborns: any[] = await Connection.query(`SELECT * FROM pcimne_data WHERE month = $1 AND year = $2 AND age_in_months >=0 AND age_in_months < 2`, [month, year]);
    const __Allfamilies: any[] = await Connection.query(`SELECT * FROM family WHERE reported_date_timestamp <= $1`, [timestamp]);
    const __families: any[] = __Allfamilies.filter(p => p.month === month && p.year === year);
    const __AllPatients: any[] = await Connection.query(`SELECT * FROM patient WHERE reported_date_timestamp <= $1`, [timestamp]);
    const __patients: any[] = __AllPatients.filter(p => p.month === month && p.year === year);
    const __deaths: any[] = await Connection.query(`SELECT * FROM death_data WHERE month = $1 AND year = $2`, [month, year]);
    const __adults: any[] = await Connection.query(`SELECT * FROM adult_data WHERE month = $1 AND year = $2`, [month, year]);
    const __promotionalsA: any[] = await Connection.query(`SELECT * FROM promotional_activity_data WHERE month = $1 AND year = $2`, [month, year]);
    const __events: any[] = await Connection.query(`SELECT * FROM events_data WHERE month = $1 AND year = $2`, [month, year]);
    const __pregnants: any[] = await Connection.query(`SELECT * FROM pregnant_data WHERE month = $1 AND year = $2 AND form IN ($3, $4)`, [month, year, 'pregnancy_family_planning', 'pregnancy_register']);
    const __deliveries: any[] = await Connection.query(`SELECT * FROM delivery_data WHERE month = $1 AND year = $2`, [month, year]);
    const __familyPlannings: any[] = await Connection.query(`SELECT * FROM family_planning_data WHERE month = $1 AND year = $2`, [month, year]);

    for (const reco of recos) {
        const vaccines: VaccinationData[] = __vaccines.filter(d => d.reco_id === reco.id);
        const pcimnes: PcimneData[] = __pcimnes.filter(d => d.reco_id === reco.id);
        const newborns: NewbornData[] = __newborns.filter(d => d.reco_id === reco.id);
        const Allfamilies: Family[] = __Allfamilies.filter(d => d.reco_id === reco.id);
        const families: Family[] = __families.filter(d => d.reco_id === reco.id);
        const AllPatients: Patient[] = __AllPatients.filter(d => d.reco_id === reco.id);
        const patients: Patient[] = __patients.filter(d => d.reco_id === reco.id);
        const deaths: DeathData[] = __deaths.filter(d => d.reco_id === reco.id);
        const adults: AdultData[] = __adults.filter(d => d.reco_id === reco.id);
        const promotionalsA: PromotionalActivityData[] = __promotionalsA.filter(d => d.reco_id === reco.id);
        const events: EventsData[] = __events.filter(d => d.reco_id === reco.id);
        const pregnants: PregnantData[] = __pregnants.filter(d => d.reco_id === reco.id);
        const deliveries: DeliveryData[] = __deliveries.filter(d => d.reco_id === reco.id);
        const familyPlannings: FamilyPlanningData[] = __familyPlannings.filter(d => d.reco_id === reco.id);

        try {
            const reco_monitoring: ChwsRecoReportElements = {
                index: 1,
                group: 'Suivi des RECO',
                position: 'I',
                data: [
                    {
                        index: 1,
                        indicator: 'Nombre total de RECO couvert',
                        de_number: 1,
                        observation: null
                    },
                    {
                        index: 2,
                        indicator: 'Nombre total de RECO supervisé au cours du mois',
                        de_number: 1,
                        observation: null
                    },
                    {
                        index: 3,
                        indicator: 'Nombre de RECO fonctionnel au cours du Mois( RECO ayant deposé le rapport)',
                        de_number: 1,
                        observation: null
                    },
                ]
            };
            const demography: ChwsRecoReportElements = {
                index: 2,
                group: 'Démographie',
                position: 'II',
                data: [
                    {
                        index: 1,
                        indicator: 'Population couverte par les RECO',
                        de_number: AllPatients.length,
                        observation: null
                    },
                    {
                        index: 2,
                        indicator: 'Nombre de menage couvert par les RECO',
                        de_number: Allfamilies.length,
                        observation: null
                    },
                    {
                        index: 3,
                        indicator: 'Nombre de Femmes enceintes dénombrées par mois',
                        de_number: pregnants.length,
                        observation: null
                    },
                    {
                        index: 4,
                        indicator: 'Nombre d\'enfants  de 0 - 11 mois dénombrés ',
                        de_number: patients.filter(p => p.age_in_month_on_creation >= 0 && p.age_in_month_on_creation < 12).length,
                        observation: null
                    },
                    {
                        index: 5,
                        indicator: 'Nombre d\'enfants de 12-59 mois dénombrés',
                        de_number: patients.filter(p => p.date_of_birth !== null && p.age_in_month_on_creation >= 12 && p.age_in_month_on_creation < 60).length,
                        observation: null
                    },
                    {
                        index: 6,
                        indicator: 'Nombre de femmes de 15 -49 ans denombrées',
                        de_number: patients.filter(p => p.sex === 'F' && p.date_of_birth !== null && p.age_in_year_on_creation >= 15 && p.age_in_year_on_creation < 50).length,
                        observation: null
                    },
                    {
                        index: 7,
                        indicator: 'Nombre de décès communautaires enregistré par mois',
                        de_number: AllPatients.filter(p => p.date_of_death !== null && p.date_of_death !== '' && p.month_of_death === month && p.year_of_death === year).length,
                        observation: null
                    },
                ]
            };
            const child_health_0_59_months: ChwsRecoReportElements = {
                index: 3,
                group: 'Santé de l\'Enfant 0- 59 Mois',
                position: 'III',
                data: [
                    {
                        index: 1,
                        indicator: 'Nombre de nouveaux nés de 0-45 jours à rattrapper pour le BCG',
                        de_number: vaccines.filter(r => r.vaccine_BCG !== true && r.age_in_days >= 0 && r.age_in_days <= 45).length,
                        observation: null
                    },
                    {
                        index: 2,
                        indicator: 'Nombre de nouveaux nés de 0-45 jours rattrappé pour le BCG',
                        de_number: vaccines.filter(r => r.vaccine_BCG === true && r.age_in_days >= 0 && r.age_in_days <= 45).length,
                        observation: null
                    },
                    {
                        index: 3,
                        indicator: 'Nombre de nouveaux nés de 0-45 Jours à rattrapper pour le Polio 0',
                        de_number: vaccines.filter(r => r.vaccine_VPO_0 !== true && r.age_in_days >= 0 && r.age_in_days <= 45).length,
                        observation: null
                    },
                    {
                        index: 4,
                        indicator: 'Nombre de nouveaux nés de 0-45 Jours rattrappé pour le Polio 0',
                        de_number: vaccines.filter(r => r.vaccine_VPO_0 === true && r.age_in_days >= 0 && r.age_in_days <= 45).length,
                        observation: null
                    },
                    {
                        index: 5,
                        indicator: 'Nombre d\'enfants de 3-5 mois à rattrapper pour le Penta 3',
                        de_number: vaccines.filter(r => r.vaccine_PENTA_3 !== true && r.age_in_months >= 3 && r.age_in_months <= 5).length,
                        observation: null
                    },
                    {
                        index: 6,
                        indicator: 'Nombre d\'enfants de 3-5 mois rattrappé pour le Penta 3',
                        de_number: vaccines.filter(r => r.vaccine_PENTA_3 === true && r.age_in_months >= 3 && r.age_in_months <= 5).length,
                        observation: null
                    },
                    {
                        index: 7,
                        indicator: 'Nombre d\'enfants de 9 à 11 mois entièrement vaccinés VAR / VAA',
                        de_number: vaccines.filter(r => (r.vaccine_VAR_2 === true || r.vaccine_VAA === true) && r.age_in_months >= 9 && r.age_in_months <= 11).length,
                        observation: null
                    },
                    {
                        index: 8,
                        indicator: 'Nombre d\'enfant zéro dose à rattrapper ',
                        de_number: vaccines.filter(r => {
                            return r.is_birth_vaccine_ok !== true && r.is_six_weeks_vaccine_ok !== true && r.is_ten_weeks_vaccine_ok !== true && r.is_forteen_weeks_vaccine_ok !== true && r.is_nine_months_vaccine_ok !== true && r.is_fifty_months_vaccine_ok !== true && r.age_in_months < 60;
                        }).length,
                        observation: null
                    },
                    {
                        index: 9,
                        indicator: 'Nombre d\'enfant zéro dose rattrappé ',
                        de_number: vaccines.filter(r => {
                            if (r.age_in_months < 60) {
                                return r.is_birth_vaccine_ok === true || r.is_six_weeks_vaccine_ok === true || r.is_ten_weeks_vaccine_ok === true || r.is_forteen_weeks_vaccine_ok === true || r.is_nine_months_vaccine_ok === true || r.is_fifty_months_vaccine_ok === true;
                            }
                            return false;
                        }).length,
                        observation: null
                    },
                    {
                        index: 10,
                        indicator: 'Nombre de nouveau nés  referés avec signes de danger',
                        de_number: newborns.reduce((unique: NewbornData[], r: NewbornData) => {
                            if (r.is_referred === true && r.has_danger_sign === true && r.age_in_months >= 0 && r.age_in_months < 2) {
                                const exist = unique.find(i => notEmpty(i.patient) && notEmpty(r.patient) && i.patient?.id === r.patient?.id);
                                if (!exist) unique.push(r);
                            }
                            return unique;
                        }, []).length,
                        observation: null
                    },
                    {
                        index: 11,
                        indicator: 'Nombre de nouveau-nés enregistrés par mois par les RECO',
                        de_number: patients.filter(r => r.age_in_month_on_creation >= 0 && r.age_in_month_on_creation < 2).length,
                        observation: null
                    },
                    {
                        index: 12,
                        indicator: 'Nombre d\'enfants orientés pour l\'extrait  de naissance',
                        de_number: patients.filter(r => {
                            return r.has_birth_certificate !== true && r.age_in_month_on_creation >= 0 && r.age_in_month_on_creation < 60;
                        }).length,
                        observation: null
                    },
                    {
                        index: 13,
                        indicator: 'Nombre d\'enfants ayant reçu l\'extrait  de naissance',
                        de_number: patients.filter(r => {
                            return r.has_birth_certificate === true && r.age_in_month_on_creation >= 0 && r.age_in_month_on_creation < 60;
                        }).length,
                        observation: null
                    },
                    {
                        index: 14,
                        indicator: 'Nombre d\'enfants de 6 à 59 mois orienté pour la vitamine A (-------)',
                        de_number: 0,
                        observation: null
                    },
                    {
                        index: 15,
                        indicator: 'Nombre d\'enfant  évalués pour la malnutrition',
                        de_number: [...pcimnes, ...newborns].reduce((unique: PcimneData[] | NewbornData[], r: PcimneData | NewbornData) => {
                            if (r.has_malnutrition === true && !(unique.find(i => {
                                return notEmpty(i.patient) && notEmpty(r.patient) && i.patient?.id === r.patient?.id;
                            }))) {
                                unique.push(r as any);
                            }
                            return unique;
                        }, []).length,
                        observation: null
                    },
                    {
                        index: 16,
                        indicator: 'Nombre total d\'enfants de 06 à 59 mois dont PB est inferieur à 12,5 Cm',
                        de_number: pcimnes.reduce((unique: PcimneData[], r: PcimneData) => {
                            if (r.has_malnutrition === true && r.age_in_months >= 6 && r.age_in_months < 60 && !(unique.find(i => {
                                return notEmpty(i.patient) && notEmpty(r.patient) && i.patient?.id === r.patient?.id;
                            }))) {
                                unique.push(r);
                            }
                            return unique;
                        }, []).length,
                        observation: null
                    },
                    {
                        index: 17,
                        indicator: 'Nombre d\'enfants de 6 à 59 mois à risque de  Malnutrition orientés vers le centre/poste de santé (--------)',
                        de_number: pcimnes.reduce((unique: PcimneData[], r: PcimneData) => {
                            if (r.has_malnutrition === true && r.age_in_months >= 6 && r.age_in_months < 60 && !(unique.find(i => notEmpty(i.patient) && notEmpty(r.patient) && i.patient?.id === r.patient?.id))) {
                                unique.push(r);
                            }
                            return unique;
                        }, []).length,
                        observation: null
                    },
                    {
                        index: 18,
                        indicator: 'Nombre total de cas de diarrhées chez les enfants de 0 à 59 mois',
                        de_number: [...pcimnes, ...newborns].reduce((unique: PcimneData[] | NewbornData[], r: PcimneData | NewbornData) => {
                            if (r.has_diarrhea === true && r.age_in_months >= 0 && r.age_in_months < 60 && !(unique.find(i => {
                                return notEmpty(i.patient) && notEmpty(r.patient) && i.patient?.id === r.patient?.id;
                            }))) {
                                unique.push(r as any);
                            }
                            return unique;
                        }, []).length,
                        observation: null
                    },
                    {
                        index: 19,
                        indicator: 'Nombre d\'enfants 0-59 mois avec diarrhées ayant recu SRO + Zinc',
                        de_number: pcimnes.reduce((unique: PcimneData[], r: PcimneData) => {
                            if (r.has_diarrhea === true && (r.ors !== null && r.ors > 0 || r.zinc !== null && r.zinc > 0) && r.age_in_months >= 6 && r.age_in_months < 60 && !(unique.find(i => notEmpty(i.patient) && notEmpty(r.patient) && i.patient?.id === r.patient?.id))) {
                                unique.push(r);
                            }
                            return unique;
                        }, []).length,
                        observation: null
                    },
                    {
                        index: 20,
                        indicator: 'Nombre de ménages ayant des latrines fonctionnelles dans leur foyer',
                        de_number: families.filter(f => f.household_has_working_latrine === true).length,
                        observation: null
                    },
                    {
                        index: 21,
                        indicator: 'Nombre de ménages vivant avec les enfants de 0 à 59 mois ayant accès à l\'eau potable',
                        de_number: families.filter(f => {
                            const fCibles = (patients.filter(p => notEmpty(p.date_of_birth) && isChildUnder5(p.date_of_birth))).map(p => p.family.id)
                            return fCibles.includes(f.id) && f.household_has_good_water_access === true;
                        }).length,
                        observation: null
                    },
                ]
            };
            const mother_health: ChwsRecoReportElements = {
                index: 4,
                group: 'Santé de la Mère',
                position: 'IV',
                data: [
                    {
                        index: 1,
                        indicator: 'Nombre de femmes enceintes orientées par mois en CPN 1',
                        de_number: pregnants.filter(p => p.cpn_done === false && (p.cpn_number === null || p.cpn_number <= 0)).length,
                        observation: null
                    },
                    {
                        index: 2,
                        indicator: 'Nombre d’accouchements à domicile (uniquement)',
                        de_number: deliveries.filter(p => p.is_home_delivery === false).length,
                        observation: null
                    },
                    {
                        index: 3,
                        indicator: 'Nombre total de femmes enceintes orienté par les RECO dans une structure de santé pour accouchement',
                        de_number: pregnants.filter(p => p.is_home_delivery_wanted === true).length,
                        observation: null
                    },
                    {
                        index: 4,
                        indicator: 'Nombre de décès maternels à domicile enregistrés par les RECO',
                        de_number: deaths.filter(d => d.sex === 'F' && d.is_maternal_death === true && d.is_home_death === true).length,
                        observation: null
                    },
                    {
                        index: 5,
                        indicator: 'Nombre de décès néonatals (<28 jours) à domicile enregistrés par les RECO',
                        de_number: deaths.filter(d => d.is_home_death === true && d.age_in_days >= 0 && d.age_in_days < 28).length + patients.filter(p => p.age_in_day_on_creation >= 0 && p.age_in_day_on_creation < 28 && p.is_home_death === true).length,
                        observation: null
                    },
                    {
                        index: 6,
                        indicator: 'Nombre de décès d\'enfants de moins de cinq ans (<5 ans) à domicile enregistrés par les RECO',
                        de_number: deaths.filter(d => d.is_home_death === true && d.age_in_months >= 0 && d.age_in_months < 60).length + patients.filter(p => p.age_in_month_on_creation >= 0 && p.age_in_month_on_creation < 60 && p.is_home_death === true).length,
                        observation: null
                    },
                    {
                        index: 7,
                        indicator: 'Nombre de femme enceintes orientée vers le CS par les RECO pour CPN',
                        de_number: pregnants.filter(p => p.cpn_done === false).length,
                        observation: null
                    },
                    {
                        index: 8,
                        indicator: 'Nombre de femmes nouvelles utilisatrices des methodes contraceptives dans la communauté',
                        de_number: familyPlannings.filter(f =>  ['pregnancy_family_planning'].includes(f.form) && f.has_counseling === true && f.already_use_method !== true).length,
                        observation: null
                    },
                    {
                        index: 9,
                        indicator: 'Nombre de femmes enceintes referées au CS par les RECO avec signes de danger',
                        de_number: pregnants.filter(p => p.is_referred === true && p.has_danger_sign === true).length,
                        observation: null
                    },
                ]
            };
            const pcimne_activity: ChwsRecoReportElements = {
                index: 5,
                group: 'ACTIVITE PCIMNE',
                position: 'V',
                data: [
                    {
                        index: 1,
                        indicator: 'Nombre de TDR palu effectué par les RECO',
                        de_number: pcimnes.filter(p => p.rdt_given === true).length,
                        observation: null
                    },
                    {
                        index: 2,
                        indicator: 'Nombre de TDR palu positif réalisé par les RECO',
                        de_number: pcimnes.filter(p => p.rdt_given === true && p.has_malaria === true).length,
                        observation: null
                    },
                    {
                        index: 3,
                        indicator: 'Nombre de cas traités avec CTA par les RECO',
                        de_number: pcimnes.filter(p => p.rdt_given === true && p.has_malaria === true && p.cta !== null && p.cta > 0).length,
                        observation: null
                    },
                    {
                        index: 4,
                        indicator: 'Nombre de cas de palu grave reféré par les RECO au CS',
                        de_number: pcimnes.filter(p => p.rdt_given === true && p.has_malaria === true && p.is_principal_referal === true && p.has_serious_malaria === true).length,
                        observation: null
                    },
                    {
                        index: 5,
                        indicator: 'Nombre de cas de deces lié au paludisme  enregistré par le RECO',
                        de_number: deaths.filter(d => d.has_malaria === true && d.age_in_months !== null && d.age_in_months < 60).length,
                        observation: null
                    },
                    {
                        index: 6,
                        indicator: 'Nombre de cas de diarrhée enregistré par les RECO',
                        de_number: pcimnes.filter(p => p.has_diarrhea === true).length,
                        observation: null
                    },
                    {
                        index: 7,
                        indicator: 'Nombre de cas de diarrhée reféré par les RECO au CS',
                        de_number: pcimnes.filter(p => p.has_diarrhea === true && p.is_referred === true).length,
                        observation: null
                    },
                    {
                        index: 8,
                        indicator: 'Nombre de deces dû à la diarrhée enregistré par les RECO',
                        de_number: deaths.filter(d => d.has_diarrhea === true && d.age_in_months >= 0 && d.age_in_months < 60).length,
                        observation: null
                    },
                    {
                        index: 9,
                        indicator: 'Nombre de cas de diarrhée traités par les RECO avec SRO et ZINC',
                        de_number: pcimnes.filter(p => p.has_diarrhea === true && (p.ors !== null && p.ors > 0 || p.zinc !== null && p.zinc > 0)).length,
                        observation: null
                    },
                    {
                        index: 10,
                        indicator: 'Nombre de cas de Toux/Difficulté respiratoire/pneumonie simple enregisté par les RECO',
                        de_number: pcimnes.filter(p => p.has_pneumonia === true).length,
                        observation: null
                    },
                    {
                        index: 11,
                        indicator: 'Nombre de cas  traités avec Amoxicilline de Toux/Difficulté respiratoire/pneumonie simple enregisté par les RECO',
                        de_number: pcimnes.filter(p =>
                            p.age_in_months >= 0 && p.age_in_months < 60 &&
                            (p.has_pneumonia === true || p.has_cough_cold === true) &&
                            (p.amoxicillin_250mg !== null && p.amoxicillin_250mg > 0 || p.amoxicillin_500mg !== null && p.amoxicillin_500mg > 0)
                        ).length,
                        observation: null
                    },
                    {
                        index: 12,
                        indicator: 'Nombre de cas  reféré de Toux/Difficulté respiratoire/pneumonie simple par les RECO',
                        de_number: pcimnes.reduce((unique: PcimneData[], p: PcimneData) => {
                            if (p.age_in_months !== null && p.age_in_months < 60 && p.is_referred === true && (p.has_pneumonia === true && p.has_cough_cold === true)) {
                                if (!(unique.find(i => i.patient.id === p.patient.id))) {
                                    unique.push(p);
                                }
                            }
                            return unique;
                        }, []).length,
                        observation: null
                    },
                    {
                        index: 13,
                        indicator: 'Nombre de deces Toux/Difficulté respiratoire/pneumonie simple',
                        de_number: deaths.filter(d => d.age_in_months !== null && d.age_in_months < 60 && (d.has_cough_cold === true || d.has_pneumonia === true)).length,
                        observation: null
                    },
                    {
                        index: 14,
                        indicator: 'Nombre de traitements de pré-référence (RECTOCAPS) réalisées par les RECO (-------)',
                        de_number: 0,
                        observation: null
                    },
                ]
            };
            const morbidity_activities: ChwsRecoReportElements = {
                index: 6,
                group: 'ACTIVITES MORBIDITES',
                position: 'VI',
                data: [
                    {
                        index: 1,
                        indicator: 'Nombre de cas d\'accident de circulation notifié par les RECO',
                        de_number: adults.filter(a => a.traffic_accident === true).length,
                        observation: null
                    },
                    {
                        index: 2,
                        indicator: 'Nombre de cas de brûlure notifié par les RECO',
                        de_number: adults.filter(a => a.burns === true).length,
                        observation: null
                    },
                    {
                        index: 3,
                        indicator: 'Nombre de cas suspects de TB orienté par les RECO',
                        de_number: adults.filter(a => a.suspected_tb === true).length,
                        observation: null
                    },
                    {
                        index: 4,
                        indicator: 'Nombre de cas de dermatose orienté par les RECO',
                        de_number: adults.filter(a => a.dermatosis === true).length,
                        observation: null
                    },
                    {
                        index: 5,
                        indicator: 'Nombre de cas de diarrhées réferé par les RECO > à 5 ans',
                        de_number: adults.filter(a => a.diarrhea === true && a.is_referred === true).length,
                        observation: null
                    },
                    {
                        index: 6,
                        indicator: 'Nombre de cas d\'écoulement uretrale réferé au CS par les RECO ',
                        de_number: adults.filter(a => a.urethral_discharge === true && a.is_referred === true).length,
                        observation: null
                    },
                    {
                        index: 7,
                        indicator: 'Nombre de cas d\'écoulement vaginal réferé au CS par les RECO',
                        de_number: adults.filter(a => a.vaginal_discharge === true && a.is_referred === true).length,
                        observation: null
                    },
                    {
                        index: 8,
                        indicator: 'Nombre de cas de perte urinaire réferé au CS par les RECO',
                        de_number: adults.filter(a => a.loss_of_urine === true && a.is_referred === true).length,
                        observation: null
                    },
                    {
                        index: 9,
                        indicator: 'Nombre de cas d\'ingestion accidentelle des produits caustiques réferé au CS par les RECO',
                        de_number: adults.filter(a => a.accidental_ingestion_caustic_products === true && a.is_referred === true).length,
                        observation: null
                    },
                    {
                        index: 10,
                        indicator: 'Nombre de cas d\'intoxication alimentaire réferée au CS par les RECO',
                        de_number: adults.filter(a => a.food_poisoning === true && a.is_referred === true).length,
                        observation: null
                    },
                    {
                        index: 11,
                        indicator: 'Nombre de cas de maladies bucco-dentaires réferé au CS par les RECO',
                        de_number: adults.filter(a => a.oral_and_dental_diseases === true && a.is_referred === true).length,
                        observation: null
                    },
                    {
                        index: 12,
                        indicator: 'Nombre de cas de morsure de chien réferée au CS par les RECO',
                        de_number: adults.filter(a => a.dog_bites === true && a.is_referred === true).length,
                        observation: null
                    },
                    {
                        index: 13,
                        indicator: 'Nombre de cas de morsure de serpent réferée au CS par les RECO',
                        de_number: adults.filter(a => a.snake_bite === true && a.is_referred === true).length,
                        observation: null
                    },
                    {
                        index: 14,
                        indicator: 'Nombre de cas de rougeole réferé au CS par les RECO',
                        de_number: adults.filter(a => a.measles === true && a.is_referred === true).length,
                        observation: null
                    },
                    {
                        index: 15,
                        indicator: 'Nombre de cas de violence basées sur le genre (VBG) réferé au CS par les RECO',
                        de_number: adults.filter(a => a.gender_based_violence === true && a.is_referred === true).length,
                        observation: null
                    },
                ]
            };
            const malaria_more_5_years: ChwsRecoReportElements = {
                index: 7,
                group: 'Paludisme(supérieur à 5 ans)',
                position: 'VII',
                data: [
                    {
                        index: 1,
                        indicator: 'Nombre de TDR effectué par les RECO',
                        de_number: adults.filter(a => a.rdt_given === true).length,
                        observation: null
                    },
                    {
                        index: 2,
                        indicator: 'Nombre de TDR positif réalisé par les RECO',
                        de_number: adults.filter(a => a.rdt_given === true && a.rdt_result === 'positive').length,
                        observation: null
                    },
                    {
                        index: 3,
                        indicator: 'Nombre de cas de palu traités avec CTA par les RECO',
                        de_number: adults.filter(a => a.has_malaria === true && a.cta !== null && a.cta > 0).length,
                        observation: null
                    },
                    {
                        index: 4,
                        indicator: 'Nombre de cas  de palu reféré au CS par les RECO',
                        de_number: adults.filter(a => a.has_malaria === true && a.is_referred === true).length,
                        observation: null
                    },
                    {
                        index: 5,
                        indicator: 'Nombre de cas de deces lié au paludisme notifié par les RECO',
                        de_number: deaths.filter(d => d.age_in_months >= 60 && d.has_malaria === true).length,
                        observation: null
                    },

                ]
            };
            const home_visit: ChwsRecoReportElements = {
                index: 8,
                bigGroup: 'ACTIVITE PROMOTIONNELLE',
                group: 'VISITE A DOMICILE',
                position: 'VIII',
                data: [
                    {
                        index: 1,
                        indicator: 'Nombre de visites à domicile réalisée par les RECO par mois',
                        de_number: promotionalsA.filter(p => p.is_vad_method === true).length,
                        observation: null
                    },
                    {
                        index: 2,
                        indicator: 'Nombre d\'homme touché  par les VAD',
                        de_number: (promotionalsA.filter(p => p.is_vad_method === true && p.men_number != null)
                                                 .map(p => parseInt(`${p.men_number}`)))
                                                 .reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0),
                        observation: null
                    },
                    {
                        index: 3,
                        indicator: 'Nombre de femmes touchées par les VAD',
                        de_number: (promotionalsA.filter(p => p.is_vad_method === true && p.women_number != null)
                                                 .map(p => parseInt(`${p.women_number}`)))
                                                 .reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0),
                        observation: null
                    },
                ]
            };
            const educational_chat: ChwsRecoReportElements = {
                index: 9,
                bigGroup: 'ACTIVITE PROMOTIONNELLE',
                group: 'CAUSERIE EDUCATIVE',
                position: 'VIII',
                data: [
                    {
                        index: 1,
                        indicator: 'Nombre de causeries éducatives effectuées par les RECO',
                        de_number: promotionalsA.filter(p => p.is_talk_method == true).length,
                        observation: null
                    },
                    {
                        index: 2,
                        indicator: 'Nombre d\'homme touché  par les causeries éducatives',
                        de_number: (promotionalsA.filter(p => p.is_talk_method === true && p.men_number != null)
                                                 .map(p => parseInt(`${p.men_number}`)))
                                                 .reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0),
                        observation: null
                    },
                    {
                        index: 3,
                        indicator: 'Nombre de femmes touchées par les causeries éducatives',
                        de_number: (promotionalsA.filter(p => p.is_talk_method === true && p.women_number != null)
                                                 .map(p => parseInt(`${p.women_number}`)))
                                                 .reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0),
                        observation: null
                    },
                ]
            };
            const developed_areas: ChwsRecoReportElements = {
                index: 10,
                group: 'DOMAINES DEVELOPPES',
                position: 'IX',
                data: [
                    {
                        index: 1,
                        indicator: 'Paludisme',
                        de_number: promotionalsA.filter(p => p.is_malaria_domain === true).length,
                        observation: null
                    },
                    {
                        index: 2,
                        indicator: 'Planification Familiale',
                        de_number: promotionalsA.filter(p => p.is_family_planning_domain === true).length,
                        observation: null
                    },
                    {
                        index: 3,
                        indicator: 'CPN',
                        de_number: promotionalsA.filter(p => p.is_cpn_domain === true).length,
                        observation: null
                    },
                    {
                        index: 4,
                        indicator: 'CPoN',
                        de_number: promotionalsA.filter(p => p.is_cpon_domain === true).length,
                        observation: null
                    },
                    {
                        index: 5,
                        indicator: 'Accouchement',
                        de_number: promotionalsA.filter(p => p.is_child_birth_domain === true).length,
                        observation: null
                    },
                    {
                        index: 6,
                        indicator: 'Vaccination',
                        de_number: promotionalsA.filter(p => p.is_vaccination_domain === true).length,
                        observation: null
                    },
                    {
                        index: 7,
                        indicator: 'IST / VIH',
                        de_number: promotionalsA.filter(p => p.is_sti_hiv_domain === true).length,
                        observation: null
                    },
                    {
                        index: 8,
                        indicator: 'Tuberculose',
                        de_number: promotionalsA.filter(p => p.is_tuberculosis_domain === true).length,
                        observation: null
                    },
                    {
                        index: 9,
                        indicator: 'Nutrition',
                        de_number: promotionalsA.filter(p => p.is_nutrition_domain === true).length,
                        observation: null
                    },
                    {
                        index: 10,
                        indicator: 'Eau, Hygiène et aissainement',
                        de_number: promotionalsA.filter(p => p.is_water_hygiene_sanitation_domain === true).length,
                        observation: null
                    },
                    {
                        index: 11,
                        indicator: 'VBG',
                        de_number: promotionalsA.filter(p => p.is_gbv_domain === true).length,
                        observation: null
                    },
                    {
                        index: 12,
                        indicator: 'MGF',
                        de_number: promotionalsA.filter(p => p.is_fgm_domain === true).length,
                        observation: null
                    },
                    {
                        index: 13,
                        indicator: 'Diarrhée',
                        de_number: promotionalsA.filter(p => p.is_diarrhea_domain === true).length,
                        observation: null
                    },
                    {
                        index: 14,
                        indicator: 'Pneumonie',
                        de_number: promotionalsA.filter(p => p.is_pneumonia_domain === true).length,
                        observation: null
                    },
                    {
                        index: 15,
                        indicator: 'Enregistrement des Naissances',
                        de_number: promotionalsA.filter(p => p.is_birth_registration_domain === true).length,
                        observation: null
                    },
                    {
                        index: 16,
                        indicator: 'Lèpre',
                        de_number: promotionalsA.filter(p => p.is_meadow_domain === true).length,
                        observation: null
                    },
                    {
                        index: 17,
                        indicator: 'Pertes d\'Urines',
                        de_number: promotionalsA.filter(p => p.is_urine_loss_domain === true).length,
                        observation: null
                    },
                    {
                        index: 18,
                        indicator: 'Diabète',
                        de_number: promotionalsA.filter(p => p.is_diabetes_domain === true).length,
                        observation: null
                    },
                    {
                        index: 19,
                        indicator: 'Tension artérielle',
                        de_number: promotionalsA.filter(p => p.is_blood_pressure_domain === true).length,
                        observation: null
                    },
                    {
                        index: 20,
                        indicator: 'Onchocercose',
                        de_number: promotionalsA.filter(p => p.is_onchocerciasis_domain === true).length,
                        observation: null
                    },
                    {
                        index: 21,
                        indicator: 'Trypanosomiase Humaine Africaine',
                        de_number: promotionalsA.filter(p => p.is_human_african_trypanosomiasis_domain === true).length,
                        observation: null
                    },
                    {
                        index: 22,
                        indicator: 'PFA',
                        de_number: promotionalsA.filter(p => p.is_pfa_domain === true).length,
                        observation: null
                    },
                    {
                        index: 23,
                        indicator: 'Diarrhée sanglante',
                        de_number: promotionalsA.filter(p => p.is_bloody_diarrhea_domain === true).length,
                        observation: null
                    },
                    {
                        index: 24,
                        indicator: 'Fièvre Jaune',
                        de_number: promotionalsA.filter(p => p.is_yellow_fever_domain === true).length,
                        observation: null
                    },
                    {
                        index: 25,
                        indicator: 'Cholera',
                        de_number: promotionalsA.filter(p => p.is_cholera_domain === true).length,
                        observation: null
                    },
                    {
                        index: 26,
                        indicator: 'Tétanos Maternel et Néonatal',
                        de_number: promotionalsA.filter(p => p.is_maternal_and_neonatal_tetanus_domain === true).length,
                        observation: null
                    },
                    {
                        index: 27,
                        indicator: 'Maladies virales',
                        de_number: promotionalsA.filter(p => p.is_viral_diseases_domain === true).length,
                        observation: null
                    },
                    {
                        index: 28,
                        indicator: 'Méningite',
                        de_number: promotionalsA.filter(p => p.is_meningitis_domain === true).length,
                        observation: null
                    },
                ]
            };
            const diseases_alerts: ChwsRecoReportElements = {
                index: 11,
                group: 'MALADIES ET EVENEMENTS NOTIFIES ET ALERTES',
                position: 'X',
                data: [
                    {
                        index: 1,
                        indicator: 'PFA',
                        de_number: events.filter(e => e.is_pfa === true).length,
                        observation: null
                    },
                    {
                        index: 2,
                        indicator: 'Diarrhée sanglante',
                        de_number: events.filter(e => e.is_bloody_diarrhea === true).length,
                        observation: null
                    },
                    {
                        index: 3,
                        indicator: 'Fièvre Jaune',
                        de_number: events.filter(e => e.is_yellow_fever === true).length,
                        observation: null
                    },
                    {
                        index: 4,
                        indicator: 'Cholera',
                        de_number: events.filter(e => e.is_cholera === true).length,
                        observation: null
                    },
                    {
                        index: 5,
                        indicator: 'Tétanos Maternel et Néonatal',
                        de_number: events.filter(e => e.is_maternal_and_neonatal_tetanus === true).length,
                        observation: null
                    },
                    {
                        index: 6,
                        indicator: 'Maladies virales(ebola, marburg, lassa)',
                        de_number: events.filter(e => e.is_viral_diseases === true).length,
                        observation: null
                    },
                    {
                        index: 7,
                        indicator: 'Méningite',
                        de_number: events.filter(e => e.is_meningitis === true).length,
                        observation: null
                    },
                    {
                        index: 8,
                        indicator: 'Décès maternels',
                        de_number: events.filter(e => e.is_maternal_deaths === true).length,
                        observation: null
                    },
                    {
                        index: 9,
                        indicator: 'Décès communautaires',
                        de_number: events.filter(e => e.is_community_deaths === true).length,
                        observation: null
                    },
                    {
                        index: 10,
                        indicator: 'Décès groupés d\'animaux',
                        de_number: events.filter(e => e.is_cluster_animal_deaths === true).length,
                        observation: null
                    },
                    {
                        index: 11,
                        indicator: 'Fievre grippale',
                        de_number: events.filter(e => e.is_influenza_fever === true).length,
                        observation: null
                    },


                ]
            };


            const _chwReco = new ChwsRecoReport();

            _chwReco.id = `${month}-${year}-${reco.id}`;
            _chwReco.month = month;
            _chwReco.year = year;
            _chwReco.reco_monitoring = reco_monitoring;
            _chwReco.demography = demography;
            _chwReco.child_health_0_59_months = child_health_0_59_months;
            _chwReco.mother_health = mother_health;
            _chwReco.pcimne_activity = pcimne_activity;
            _chwReco.morbidity_activities = morbidity_activities;
            _chwReco.malaria_more_5_years = malaria_more_5_years;
            _chwReco.home_visit = home_visit;
            _chwReco.educational_chat = educational_chat;
            _chwReco.developed_areas = developed_areas;
            _chwReco.diseases_alerts = diseases_alerts;

            _chwReco.country = reco.country;
            _chwReco.region = reco.region;
            _chwReco.prefecture = reco.prefecture;
            _chwReco.commune = reco.commune;
            _chwReco.hospital = reco.hospital;
            _chwReco.district_quartier = reco.district_quartier;
            _chwReco.chw = reco.chw;
            _chwReco.village_secteur = reco.village_secteur;
            _chwReco.reco = { id: reco.id, name: reco.name, phone: reco.phone };

            await _repoReport.save(_chwReco);
            outPutData.SuccessCount += 1;
        } catch (err) {
            console.log(err)
            outPutData.ErrorsCount += 1;
        }
    }


    return outPutData;
}