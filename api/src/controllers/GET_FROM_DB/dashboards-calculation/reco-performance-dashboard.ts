import { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";
import { AppDataSource } from "../../../data_source";
import { DataSource } from "typeorm";
import { RecoPerformanceDashboardUtils } from "../../../utils/Interfaces";
import { RECOS_CUSTOM_QUERY } from "../../orgunit-query/org-units-custom";
import { RecoPerformanceDashboard, getRecoPerformanceDashboardRepository } from "../../../entities/dashboards";
import { getColors, getFirstAndLastDayOfMonth } from "../../../utils/functions";
import { AdultData } from "../../../entities/_Adult-data";
import { DeliveryData } from "../../../entities/_Delivery-data";
import { FamilyPlanningData } from "../../../entities/_FamilyPlannig-data";
import { NewbornData } from "../../../entities/_Newborn-data";
import { PcimneData } from "../../../entities/_Pcimne-data";
import { PregnantData } from "../../../entities/_Pregnant-data";
import { ReferalData } from "../../../entities/_Referal-data";
import { DeathData } from "../../../entities/_Death-data";
import { EventsData } from "../../../entities/_Events-data";
import { PromotionalActivityData } from "../../../entities/_Promotional-data";
import { Family, Patient } from "../../../entities/Org-units";
import { getAgeIn } from "../../../utils/date-utils";


let Conn: DataSource = AppDataSource.manager.connection;

export async function RECO_PERFORMANCE_DASHBOARD_CALCULATION(req: Request, res: Response, next: NextFunction): Promise<any> {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(201).json({ status: 201, data: 'Informations you provided are not valid' });
    }
    var { month, year } = req.body;
    const outPutData = await RECO_PERFORMANCE_DASHBOARD_CALCULATION_DATA({ month, year });

    // if (outPutData.SuccessCount === outPutData.recos_length || outPutData.ErrorsCount === outPutData.recos_length || (outPutData.ErrorsCount + outPutData.SuccessCount) === outPutData.recos_length) {
        outPutData.status = 200;
        return res.status(200).json(outPutData);
    // }
}

export async function RECO_PERFORMANCE_DASHBOARD_CALCULATION_DATA({ month, year }: { month: string, year: number }): Promise<{ status: number, ErrorsCount: number, SuccessCount: number, data: any, recos_length: number }> {
    const _repoDashboard = await getRecoPerformanceDashboardRepository();
    const recos = await RECOS_CUSTOM_QUERY();
    const outPutData: { status: number, ErrorsCount: number, SuccessCount: number, data: any, recos_length: number } = { status: 201, ErrorsCount: 0, SuccessCount: 0, data: null, recos_length: recos.length };

    const filterDate = getFirstAndLastDayOfMonth(year, month);

    // const __adultData: AdultData[] = await Conn.query(`SELECT * FROM adult_data WHERE month = $1 AND year = $2`, [month, year]);
    // const __fpData: FamilyPlanningData[] = await Conn.query(`SELECT COUNT(CASE WHEN consultation_followup = 'consultation' THEN 1 END) as consultation, COUNT(CASE WHEN consultation_followup != 'consultation' THEN 1 END) as followup FROM family_planning_data WHERE month = $1 AND year = $2`, [month, year]);
    // const __newbornData: NewbornData[] = await Conn.query(`SELECT * FROM newborn_data WHERE month = $1 AND year = $2`, [month, year]);
    // const __pcimneData: PcimneData[] = await Conn.query(`SELECT * FROM pcimne_data WHERE month = $1 AND year = $2`, [month, year]);
    // const __pregnantData: PregnantData[] = await Conn.query(`SELECT * FROM pregnant_data WHERE month = $1 AND year = $2`, [month, year]);

    // const __deliveryData: DeliveryData[] = await Conn.query(`SELECT COUNT(*) as consultation FROM delivery_data WHERE month = $1 AND year = $2`, [month, year]);

    // const __referalData: ReferalData[] = await Conn.query(`SELECT COUNT(*) as followup FROM referal_data WHERE month = $1 AND year = $2`, [month, year]);

    // const __deathData: DeathData[] = await Conn.query(`SELECT COUNT(*) as count FROM death_data WHERE month = $1 AND year = $2`, [month, year]);
    // const __eventsData: EventsData[] = await Conn.query(`SELECT COUNT(*) as count FROM events_data WHERE month = $1 AND year = $2`, [month, year]);
    // const __promoActData: PromotionalActivityData[] = await Conn.query(`SELECT COUNT(*) as count FROM promotional_activity_data WHERE month = $1 AND year = $2`, [month, year]);


    const __adultData: any[] = await Conn.query(`SELECT * FROM adult_data WHERE month = $1 AND year = $2`, [month, year]);
    const __fpData: any[] = await Conn.query(`SELECT * FROM family_planning_data WHERE month = $1 AND year = $2`, [month, year]);
    const __newbornData: any[] = await Conn.query(`SELECT * FROM newborn_data WHERE month = $1 AND year = $2`, [month, year]);
    const __pcimneData: any[] = await Conn.query(`SELECT * FROM pcimne_data WHERE month = $1 AND year = $2`, [month, year]);
    const __pregnantData: any[] = await Conn.query(`SELECT * FROM pregnant_data WHERE month = $1 AND year = $2`, [month, year]);
    const __deliveryData: any[] = await Conn.query(`SELECT * FROM delivery_data WHERE month = $1 AND year = $2`, [month, year]);
    const __referalData: any[] = await Conn.query(`SELECT * FROM referal_data WHERE month = $1 AND year = $2`, [month, year]);
    const __deathData: any[] = await Conn.query(`SELECT * FROM death_data WHERE month = $1 AND year = $2`, [month, year]);
    const __eventsData: any[] = await Conn.query(`SELECT * FROM events_data WHERE month = $1 AND year = $2`, [month, year]);
    const __promoActData: any[] = await Conn.query(`SELECT * FROM promotional_activity_data WHERE month = $1 AND year = $2`, [month, year]);
    const __Allfamilies: any[] = await Conn.query(`SELECT * FROM family WHERE reported_date <= $1`, [filterDate.end_date]);
    const __AllPatients: any[] = await Conn.query(`SELECT * FROM patient WHERE reported_date <= $1 AND (date_of_death IS NULL OR date_of_death = '')`, [filterDate.end_date]);

    const color = getColors(recos.length);
    let colorIndex = 0;

    for (const reco of recos) {
        try {
            const adultData: AdultData[] = __adultData.filter(r => r.reco_id === reco.id);
            const fpData: FamilyPlanningData[] = __fpData.filter(r => r.reco_id === reco.id);
            const newbornData: NewbornData[] = __newbornData.filter(r => r.reco_id === reco.id);
            const pcimneData: PcimneData[] = __pcimneData.filter(r => r.reco_id === reco.id);
            const pregnantData: PregnantData[] = __pregnantData.filter(r => r.reco_id === reco.id);
            const deliveryData: DeliveryData[] = __deliveryData.filter(r => r.reco_id === reco.id);
            const referalData: ReferalData[] = __referalData.filter(r => r.reco_id === reco.id);
            const deathData: DeathData[] = __deathData.filter(r => r.reco_id === reco.id);
            const eventsData: EventsData[] = __eventsData.filter(r => r.reco_id === reco.id);
            const promoActData: PromotionalActivityData[] = __promoActData.filter(r => r.reco_id === reco.id);
            const Allfamilies: Family[] = __Allfamilies.filter(d => d.reco_id === reco.id);
            const AllPatients: Patient[] = __AllPatients.filter(d => d.reco_id === reco.id);

            const CONSULTATION_FOLLOWUP: any[] = [...adultData, ...fpData, ...newbornData, ...pcimneData, ...pregnantData];

            const ALL_ACTION: any[] = [...adultData, ...fpData, ...newbornData, ...pcimneData, ...pregnantData, ...deliveryData, ...referalData, ...deathData, ...eventsData, ...promoActData];

            const householdCount: number = Allfamilies.length;
            const patientCount: number = AllPatients.length;
            const newborn0To2MonthsCount: number = AllPatients.filter(p => {
                const age_in_month = getAgeIn('months', p.date_of_birth, filterDate.end_date);
                return age_in_month >= 0 && age_in_month < 2;
            }).length;
            const child2To60MonthsCount: number = AllPatients.filter(p => {
                const age_in_month = getAgeIn('months', p.date_of_birth, filterDate.end_date);
                return age_in_month >= 2 && age_in_month < 60;
            }).length;
            const child5To14YearsCount: number = AllPatients.filter(p => {
                const age_in_year = getAgeIn('years', p.date_of_birth, filterDate.end_date);
                return age_in_year >= 5 && age_in_year < 15;
            }).length;
            const adultOver14YearsCount: number = AllPatients.filter(p => {
                const age_in_year = getAgeIn('years', p.date_of_birth, filterDate.end_date);
                return age_in_year >= 15;
            }).length;
            const consultationCount: number = CONSULTATION_FOLLOWUP.filter(r => r.consultation_followup === 'consultation').length + deliveryData.length;
            const followupCount: number = CONSULTATION_FOLLOWUP.filter(r => r.consultation_followup !== 'consultation').length + referalData.length;
            const allActionsCount: number = ALL_ACTION.length;



            const absisseLabels = ['Adult', 'PF', 'Nouveau Né', 'Pcime', 'Enceinte', 'Accouchement', 'Suivi Référence', 'Décès', 'Evenements', 'Activités Promotionnelles'];
            const chartData = [adultData.length, fpData.length, newbornData.length, pcimneData.length, pregnantData.length, deliveryData.length, referalData.length, deathData.length, eventsData.length, promoActData.length];

            const lineChart: RecoPerformanceDashboardUtils = {
                title: 'TOUS LES ACTIONS DU RECO',
                type: 'line',
                absisseLabels: ['ACTIONS A DOMICILE'],
                datasets: [
                    {
                        label: reco.name,
                        backgroundColor: color.backgroundColors[colorIndex],
                        data: [chartData.length],
                        borderColor: color.backgroundColors[colorIndex],
                    }
                ]
            }

            const barChart: RecoPerformanceDashboardUtils = {
                title: 'TENDANCE DES ACTIVITE DU RECO',
                type: 'bar',
                absisseLabels: absisseLabels,
                datasets: [
                    {
                        label: reco.name,
                        backgroundColor: color.backgroundColors[colorIndex],
                        data: chartData,
                        borderColor: color.backgroundColors[colorIndex],
                    }
                ]
            }

            colorIndex += 1;

            const _per = new RecoPerformanceDashboard();

            _per.id = `${month}-${year}-${reco.id}`;
            _per.month = month;
            _per.year = year;

            _per.householdCount = householdCount;
            _per.patientCount = patientCount;
            _per.newborn0To2MonthsCount = newborn0To2MonthsCount;
            _per.child2To60MonthsCount = child2To60MonthsCount;
            _per.child5To14YearsCount = child5To14YearsCount;
            _per.adultOver14YearsCount = adultOver14YearsCount;

            _per.consultationCount = consultationCount;
            _per.followupCount = followupCount;
            _per.allActionsCount = allActionsCount;

            _per.lineChart = lineChart;
            _per.barChart = barChart;

            _per.country = reco.country;
            _per.region = reco.region;
            _per.prefecture = reco.prefecture;
            _per.commune = reco.commune;
            _per.hospital = reco.hospital;
            _per.district_quartier = reco.district_quartier;
            // _per.chw = reco.chw;
            _per.village_secteur = reco.village_secteur;
            _per.reco = { id: reco.id, name: reco.name, phone: reco.phone };

            await _repoDashboard.save(_per);
            outPutData.SuccessCount += 1;
        } catch (err) {
            outPutData.ErrorsCount += 1;
        }
    }

    return outPutData;
}