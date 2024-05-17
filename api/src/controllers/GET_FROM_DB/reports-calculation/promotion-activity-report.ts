import { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";
import { PromotionReport, getPromotionReportRepository } from "../../../entities/Reports";
import { PromotionalActivityData } from "../../../entities/_Promotional-data";
import { AppDataSource } from "../../../data_source";
import { DataSource } from "typeorm";
import { RecoCoustomQuery } from "../../../utils/Interfaces";
import { RECOS_COUSTOM_QUERY } from "../../orgunit-query/org-units-coustom";


let Connection: DataSource = AppDataSource.manager.connection;

export async function PROMOTONAL_ACTIVITIES_REPORTS_CALCULATION(req: Request, res: Response, next: NextFunction): Promise<any> {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(201).json({ status: 201, data: 'Informations you provided are not valid' });
    }

    var { month, year } = req.body;
    const outPutData = await PROMOTONAL_ACTIVITIES_REPORTS_CALCULATION_DATA({ month, year });

    if (outPutData.SuccessCount === outPutData.recos_length || outPutData.ErrorsCount === outPutData.recos_length || (outPutData.ErrorsCount + outPutData.SuccessCount) === outPutData.recos_length) {
        outPutData.status = 200;
        // outPutData.data =  await Connection.query(`SELECT * FROM chws_reco_report WHERE month = $1 AND year = $2`, [month, year]);
        return res.status(200).json(outPutData);
    }
}

export async function PROMOTONAL_ACTIVITIES_REPORTS_CALCULATION_DATA({ month, year }: { month: string, year: number }): Promise<{ status: number, ErrorsCount: number, SuccessCount: number, data: any, recos_length: number }> {
    const _repoReport = await getPromotionReportRepository();

    const recos: RecoCoustomQuery[] = await RECOS_COUSTOM_QUERY();
    const outPutData: { status: number, ErrorsCount: number, SuccessCount: number, data: any, recos_length: number } = { status: 201, ErrorsCount: 0, SuccessCount: 0, data: null, recos_length: recos.length };

    const __promotionalsA: any[] = await Connection.query(`SELECT * FROM promotional_activity_data WHERE month = $1 AND year = $2`, [month, year]);


    for (const reco of recos) {
        try {
            const promotionalsA: PromotionalActivityData[] = __promotionalsA.filter(d => d.reco_id === reco.id);
            const _promoReport = new PromotionReport();

            _promoReport.id = `${month}-${year}-${reco.id}`;
            _promoReport.month = month;
            _promoReport.year = year;
            _promoReport.malaria_nbr_touched_by_VAD_F = (promotionalsA.filter(p => p.is_vad_method === true && p.is_malaria_domain && p.women_number != null).map(p => parseInt(`${p.women_number}`))).reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0);
            _promoReport.malaria_nbr_touched_by_VAD_M = (promotionalsA.filter(p => p.is_vad_method === true && p.is_malaria_domain && p.men_number != null).map(p => parseInt(`${p.men_number}`))).reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0);
            _promoReport.malaria_nbr_touched_by_CE_F = (promotionalsA.filter(p => p.is_talk_method === true && p.is_malaria_domain && p.women_number != null).map(p => parseInt(`${p.women_number}`))).reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0);
            _promoReport.malaria_nbr_touched_by_CE_M = (promotionalsA.filter(p => p.is_talk_method === true && p.is_malaria_domain && p.men_number != null).map(p => parseInt(`${p.men_number}`))).reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0);
            _promoReport.malaria_nbr_total_F = _promoReport.malaria_nbr_touched_by_VAD_F + _promoReport.malaria_nbr_touched_by_CE_F;
            _promoReport.malaria_nbr_total_M = _promoReport.malaria_nbr_touched_by_VAD_M + _promoReport.malaria_nbr_touched_by_CE_M;

            _promoReport.vaccination_nbr_touched_by_VAD_F = (promotionalsA.filter(p => p.is_vad_method === true && p.is_vaccination_domain && p.women_number != null).map(p => parseInt(`${p.women_number}`))).reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0);
            _promoReport.vaccination_nbr_touched_by_VAD_M = (promotionalsA.filter(p => p.is_vad_method === true && p.is_vaccination_domain && p.men_number != null).map(p => parseInt(`${p.men_number}`))).reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0);
            _promoReport.vaccination_nbr_touched_by_CE_F = (promotionalsA.filter(p => p.is_talk_method === true && p.is_vaccination_domain && p.women_number != null).map(p => parseInt(`${p.women_number}`))).reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0);
            _promoReport.vaccination_nbr_touched_by_CE_M = (promotionalsA.filter(p => p.is_talk_method === true && p.is_vaccination_domain && p.men_number != null).map(p => parseInt(`${p.men_number}`))).reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0);
            _promoReport.vaccination_nbr_total_F = _promoReport.malaria_nbr_touched_by_VAD_F + _promoReport.malaria_nbr_touched_by_CE_F;
            _promoReport.vaccination_nbr_total_M = _promoReport.malaria_nbr_touched_by_VAD_M + _promoReport.malaria_nbr_touched_by_CE_M;

            //
            _promoReport.child_health_nbr_touched_by_VAD_F = (promotionalsA.filter(p => p.is_vad_method === true && p.is_child_health_domain && p.women_number != null).map(p => parseInt(`${p.women_number}`))).reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0);
            _promoReport.child_health_nbr_touched_by_VAD_M = (promotionalsA.filter(p => p.is_vad_method === true && p.is_child_health_domain && p.men_number != null).map(p => parseInt(`${p.men_number}`))).reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0);
            _promoReport.child_health_nbr_touched_by_CE_F = (promotionalsA.filter(p => p.is_talk_method === true && p.is_child_health_domain && p.women_number != null).map(p => parseInt(`${p.women_number}`))).reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0);
            _promoReport.child_health_nbr_touched_by_CE_M = (promotionalsA.filter(p => p.is_talk_method === true && p.is_child_health_domain && p.men_number != null).map(p => parseInt(`${p.men_number}`))).reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0);
            _promoReport.child_health_nbr_total_F = _promoReport.child_health_nbr_touched_by_VAD_F + _promoReport.child_health_nbr_touched_by_CE_F;
            _promoReport.child_health_nbr_total_M = _promoReport.child_health_nbr_touched_by_VAD_M + _promoReport.child_health_nbr_touched_by_CE_M;

            _promoReport.cpn_cpon_nbr_touched_by_VAD_F = (promotionalsA.filter(p => p.is_vad_method === true && (p.is_cpn_domain === true || p.is_cpon_domain === true) && p.women_number != null).map(p => parseInt(`${p.women_number}`))).reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0);
            _promoReport.cpn_cpon_nbr_touched_by_VAD_M = (promotionalsA.filter(p => p.is_vad_method === true && (p.is_cpn_domain === true || p.is_cpon_domain === true) && p.men_number != null).map(p => parseInt(`${p.men_number}`))).reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0);
            _promoReport.cpn_cpon_nbr_touched_by_CE_F = (promotionalsA.filter(p => p.is_talk_method === true && (p.is_cpn_domain === true || p.is_cpon_domain === true) && p.women_number != null).map(p => parseInt(`${p.women_number}`))).reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0);
            _promoReport.cpn_cpon_nbr_touched_by_CE_M = (promotionalsA.filter(p => p.is_talk_method === true && (p.is_cpn_domain === true || p.is_cpon_domain === true) && p.men_number != null).map(p => parseInt(`${p.men_number}`))).reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0);
            _promoReport.cpn_cpon_nbr_total_F = _promoReport.cpn_cpon_nbr_touched_by_VAD_F + _promoReport.cpn_cpon_nbr_touched_by_CE_F;
            _promoReport.cpn_cpon_nbr_total_M = _promoReport.cpn_cpon_nbr_touched_by_VAD_M + _promoReport.cpn_cpon_nbr_touched_by_CE_M;

            _promoReport.family_planning_nbr_touched_by_VAD_F = (promotionalsA.filter(p => p.is_vad_method === true && p.is_family_planning_domain === true && p.women_number != null).map(p => parseInt(`${p.women_number}`))).reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0);
            _promoReport.family_planning_nbr_touched_by_VAD_M = (promotionalsA.filter(p => p.is_vad_method === true && p.is_family_planning_domain === true && p.men_number != null).map(p => parseInt(`${p.men_number}`))).reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0);
            _promoReport.family_planning_nbr_touched_by_CE_F = (promotionalsA.filter(p => p.is_talk_method === true && p.is_family_planning_domain === true && p.women_number != null).map(p => parseInt(`${p.women_number}`))).reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0);
            _promoReport.family_planning_nbr_touched_by_CE_M = (promotionalsA.filter(p => p.is_talk_method === true && p.is_family_planning_domain === true && p.men_number != null).map(p => parseInt(`${p.men_number}`))).reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0);
            _promoReport.family_planning_nbr_total_F = _promoReport.family_planning_nbr_touched_by_VAD_F + _promoReport.family_planning_nbr_touched_by_CE_F;
            _promoReport.family_planning_nbr_total_M = _promoReport.family_planning_nbr_touched_by_VAD_M + _promoReport.family_planning_nbr_touched_by_CE_M;

            _promoReport.hygienic_water_sanitation_nbr_touched_by_VAD_F = (promotionalsA.filter(p => p.is_vad_method === true && p.is_water_hygiene_sanitation_domain === true && p.women_number != null).map(p => parseInt(`${p.women_number}`))).reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0);
            _promoReport.hygienic_water_sanitation_nbr_touched_by_VAD_M = (promotionalsA.filter(p => p.is_vad_method === true && p.is_water_hygiene_sanitation_domain === true && p.men_number != null).map(p => parseInt(`${p.men_number}`))).reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0);
            _promoReport.hygienic_water_sanitation_nbr_touched_by_CE_F = (promotionalsA.filter(p => p.is_talk_method === true && p.is_water_hygiene_sanitation_domain === true && p.women_number != null).map(p => parseInt(`${p.women_number}`))).reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0);
            _promoReport.hygienic_water_sanitation_nbr_touched_by_CE_M = (promotionalsA.filter(p => p.is_talk_method === true && p.is_water_hygiene_sanitation_domain === true && p.men_number != null).map(p => parseInt(`${p.men_number}`))).reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0);
            _promoReport.hygienic_water_sanitation_nbr_total_F = _promoReport.hygienic_water_sanitation_nbr_touched_by_VAD_F + _promoReport.hygienic_water_sanitation_nbr_touched_by_CE_F;
            _promoReport.hygienic_water_sanitation_nbr_total_M = _promoReport.hygienic_water_sanitation_nbr_touched_by_VAD_M + _promoReport.hygienic_water_sanitation_nbr_touched_by_CE_M;

            _promoReport.other_diseases_nbr_touched_by_VAD_F = (promotionalsA.filter(p => p.is_vad_method === true && p.is_other_diseases_domain && p.women_number != null).map(p => parseInt(`${p.women_number}`))).reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0);
            _promoReport.other_diseases_nbr_touched_by_VAD_M = (promotionalsA.filter(p => p.is_vad_method === true && p.is_other_diseases_domain && p.men_number != null).map(p => parseInt(`${p.men_number}`))).reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0);
            _promoReport.other_diseases_nbr_touched_by_CE_F = (promotionalsA.filter(p => p.is_talk_method === true && p.is_other_diseases_domain && p.women_number != null).map(p => parseInt(`${p.women_number}`))).reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0);
            _promoReport.other_diseases_nbr_touched_by_CE_M = (promotionalsA.filter(p => p.is_talk_method === true && p.is_other_diseases_domain && p.men_number != null).map(p => parseInt(`${p.men_number}`))).reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0);
            _promoReport.other_diseases_nbr_total_F = _promoReport.other_diseases_nbr_touched_by_VAD_F + _promoReport.other_diseases_nbr_touched_by_CE_F;
            _promoReport.other_diseases_nbr_total_M = _promoReport.other_diseases_nbr_touched_by_VAD_M + _promoReport.other_diseases_nbr_touched_by_CE_M;

            _promoReport.country = reco.country;
            _promoReport.region = reco.region;
            _promoReport.prefecture = reco.prefecture;
            _promoReport.commune = reco.commune;
            _promoReport.hospital = reco.hospital;
            _promoReport.district_quartier = reco.district_quartier;
            _promoReport.chw = reco.chw;
            _promoReport.village_secteur = reco.village_secteur;
            _promoReport.reco = { id: reco.id, name: reco.name, phone: reco.phone };

            await _repoReport.save(_promoReport);
            outPutData.SuccessCount += 1;

        } catch (err) {
            outPutData.ErrorsCount += 1;
        }
    }

    return outPutData;
}
