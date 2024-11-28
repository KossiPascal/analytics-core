import { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";
import { AppDataSource } from "../../../data_source";
import { DataSource } from "typeorm";
import { FamilyPlanningReport, getFamilyPlanningReportRepository } from "../../../entities/Reports";
import { FamilyPlanningData } from "../../../entities/_FamilyPlannig-data";
import { FP_Utils } from "../../../utils/Interfaces";
import { RecoMegData } from "../../../entities/_Meg-Reco-data";
import { date_to_milisecond } from "../../../utils/date-utils";
import { getFirstAndLastDayOfMonth } from "../../../utils/functions";
import { RECOS_CUSTOM_QUERY } from "../../orgunit-query/org-units-custom";


let Connection: DataSource = AppDataSource.manager.connection;


export async function FAMILY_PLANNNING_REPORTS_CALCULATION(req: Request, res: Response, next: NextFunction): Promise<any> {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(201).json({ status: 201, data: 'Informations you provided are not valid' });
    }
    
    var { month, year } = req.body;
    const outPutData = await FAMILY_PLANNNING_REPORTS_CALCULATION_DATA({ month, year });

    if (outPutData.SuccessCount === outPutData.recos_length || outPutData.ErrorsCount === outPutData.recos_length || (outPutData.ErrorsCount + outPutData.SuccessCount) === outPutData.recos_length) {
        outPutData.status = 200;
        // outPutData.data =  await Connection.query(`SELECT * FROM chws_reco_report WHERE month = $1 AND year = $2`, [month, year]);
        return res.status(200).json(outPutData);
    }
}

export async function FAMILY_PLANNNING_REPORTS_CALCULATION_DATA({ month, year }: { month: string, year: number }): Promise<{ status: number, ErrorsCount: number, SuccessCount: number, data: any, recos_length: number }> {
    const _repoReport = await getFamilyPlanningReportRepository();

    const recos = await RECOS_CUSTOM_QUERY();
    const outPutData: { status: number, ErrorsCount: number, SuccessCount: number, data: any, recos_length: number } = { status: 201, ErrorsCount: 0, SuccessCount: 0, data: null, recos_length: recos.length };

    const __familyPlannings: any[] = await Connection.query(`SELECT * FROM family_planning_data WHERE month = $1 AND year = $2`, [month, year]);
    const __megAllStock: any[] = await QUERY_RECO_MEG_DATA_STOCKS({ month, year });

    for (const reco of recos) {
        try {
            const familyPlannings: FamilyPlanningData[] = __familyPlannings.filter(fp => fp.reco_id === reco.id);
            const megAllStock: RecoMegData[] = __megAllStock.filter(fp => fp.reco_id === reco.id);
            const megStockNumber = RECO_MEG_FULL_STOCKS(megAllStock);
            const pill_coc: FP_Utils = {
                nbr_new_user: familyPlannings.filter(f => ['pregnancy_family_planning', 'family_planning'].includes(f.form) && f.has_counseling === true && f.already_use_method !== true && f.is_method_avaible_reco === true && f.method_was_given === true && f.fp_method === 'pill_coc').length,
                nbr_regular_user: familyPlannings.reduce((unique: FamilyPlanningData[], f: FamilyPlanningData) => {
                    if (!(['pregnancy_family_planning', 'family_planning'].includes(f.form) && f.has_counseling === true && f.already_use_method !== true && f.is_method_avaible_reco === true) && f.method_was_given === true && f.fp_method === 'pill_coc') {
                        if (!(unique.find(i => i.patient.id === f.patient.id))) {
                            unique.push(f);
                        }
                    }
                    return unique;
                }, []).length,
                nbr_total_user: familyPlannings.reduce((unique: FamilyPlanningData[], f: FamilyPlanningData) => {
                    if (f.method_was_given === true && f.fp_method === 'pill_coc') {
                        if (!(unique.find(i => i.patient.id === f.patient.id))) {
                            unique.push(f);
                        }
                    }
                    return unique;
                }, []).length,
                nbr_delivered: megStockNumber.pill_coc.consumption,
                nbr_in_stock: megStockNumber.pill_coc.stock_available,
                nbr_referred: megStockNumber.pill_coc.referred,
                nbr_side_effect: megStockNumber.pill_coc.side_effect,
            };
            const pill_cop: FP_Utils = {
                nbr_new_user: familyPlannings.filter(f => ['pregnancy_family_planning', 'family_planning'].includes(f.form) && f.has_counseling === true && f.already_use_method !== true && f.is_method_avaible_reco === true && f.method_was_given === true && f.fp_method === 'pill_cop').length,
                nbr_regular_user: familyPlannings.reduce((unique: FamilyPlanningData[], f: FamilyPlanningData) => {
                    if (!(['pregnancy_family_planning', 'family_planning'].includes(f.form) && f.has_counseling === true && f.already_use_method !== true && f.is_method_avaible_reco === true) && f.method_was_given === true && f.fp_method === 'pill_cop') {
                        if (!(unique.find(i => i.patient.id === f.patient.id))) {
                            unique.push(f);
                        }
                    }
                    return unique;
                }, []).length,
                nbr_total_user: familyPlannings.reduce((unique: FamilyPlanningData[], f: FamilyPlanningData) => {
                    if (f.method_was_given === true && f.fp_method === 'pill_cop') {
                        if (!(unique.find(i => i.patient.id === f.patient.id))) {
                            unique.push(f);
                        }
                    }
                    return unique;
                }, []).length,
                nbr_delivered: megStockNumber.pill_cop.consumption,
                nbr_in_stock: megStockNumber.pill_cop.stock_available,
                nbr_referred: megStockNumber.pill_cop.referred,
                nbr_side_effect: megStockNumber.pill_cop.side_effect,
            };
            const condoms: FP_Utils = {
                nbr_new_user: familyPlannings.filter(f => ['pregnancy_family_planning', 'family_planning'].includes(f.form) && f.has_counseling === true && f.already_use_method !== true && f.is_method_avaible_reco === true && f.method_was_given === true && f.fp_method === 'condoms').length,
                nbr_regular_user: familyPlannings.reduce((unique: FamilyPlanningData[], f: FamilyPlanningData) => {
                    if (!(['pregnancy_family_planning', 'family_planning'].includes(f.form) && f.has_counseling === true && f.already_use_method !== true && f.is_method_avaible_reco === true) && f.method_was_given === true && f.fp_method === 'condoms') {
                        if (!(unique.find(i => i.patient.id === f.patient.id))) {
                            unique.push(f);
                        }
                    }
                    return unique;
                }, []).length,
                nbr_total_user: familyPlannings.reduce((unique: FamilyPlanningData[], f: FamilyPlanningData) => {
                    if (f.method_was_given === true && f.fp_method === 'condoms') {
                        if (!(unique.find(i => i.patient.id === f.patient.id))) {
                            unique.push(f);
                        }
                    }
                    return unique;
                }, []).length,
                nbr_delivered: megStockNumber.condoms.consumption,
                nbr_in_stock: megStockNumber.condoms.stock_available,
                nbr_referred: megStockNumber.condoms.referred,
                nbr_side_effect: megStockNumber.condoms.side_effect,
            };
            const depo_provera_im: FP_Utils = {
                nbr_new_user: familyPlannings.filter(f => ['pregnancy_family_planning', 'family_planning'].includes(f.form) && f.has_counseling === true && f.already_use_method !== true && f.is_method_avaible_reco === true && f.method_was_given === true && f.fp_method === 'depo_provera_im').length,
                nbr_regular_user: familyPlannings.reduce((unique: FamilyPlanningData[], f: FamilyPlanningData) => {
                    if (!(['pregnancy_family_planning', 'family_planning'].includes(f.form) && f.has_counseling === true && f.already_use_method !== true && f.is_method_avaible_reco === true) && f.method_was_given === true && f.fp_method === 'depo_provera_im') {
                        if (!(unique.find(i => i.patient.id === f.patient.id))) {
                            unique.push(f);
                        }
                    }
                    return unique;
                }, []).length,
                nbr_total_user: familyPlannings.reduce((unique: FamilyPlanningData[], f: FamilyPlanningData) => {
                    if (f.method_was_given === true && f.fp_method === 'depo_provera_im') {
                        if (!(unique.find(i => i.patient.id === f.patient.id))) {
                            unique.push(f);
                        }
                    }
                    return unique;
                }, []).length,
                nbr_delivered: megStockNumber.depo_provera_im.consumption,
                nbr_in_stock: megStockNumber.depo_provera_im.stock_available,
                nbr_referred: megStockNumber.depo_provera_im.referred,
                nbr_side_effect: megStockNumber.depo_provera_im.side_effect,
            };
            const dmpa_sc: FP_Utils = {
                nbr_new_user: familyPlannings.filter(f => ['pregnancy_family_planning', 'family_planning'].includes(f.form) && f.has_counseling === true && f.already_use_method !== true && f.is_method_avaible_reco === true && f.method_was_given === true && f.fp_method === 'dmpa_sc').length,
                nbr_regular_user: familyPlannings.reduce((unique: FamilyPlanningData[], f: FamilyPlanningData) => {
                    if (!(['pregnancy_family_planning', 'family_planning'].includes(f.form) && f.has_counseling === true && f.already_use_method !== true && f.is_method_avaible_reco === true) && f.method_was_given === true && f.fp_method === 'dmpa_sc') {
                        if (!(unique.find(i => i.patient.id === f.patient.id))) {
                            unique.push(f);
                        }
                    }
                    return unique;
                }, []).length,
                nbr_total_user: familyPlannings.reduce((unique: FamilyPlanningData[], f: FamilyPlanningData) => {
                    if (f.method_was_given === true && f.fp_method === 'dmpa_sc') {
                        if (!(unique.find(i => i.patient.id === f.patient.id))) {
                            unique.push(f);
                        }
                    }
                    return unique;
                }, []).length,
                nbr_delivered: megStockNumber.dmpa_sc.consumption,
                nbr_in_stock: megStockNumber.dmpa_sc.stock_available,
                nbr_referred: megStockNumber.dmpa_sc.referred,
                nbr_side_effect: megStockNumber.dmpa_sc.side_effect,
            };
            const cycle_necklace: FP_Utils = {
                nbr_new_user: familyPlannings.filter(f => ['pregnancy_family_planning', 'family_planning'].includes(f.form) && f.has_counseling === true && f.already_use_method !== true && f.is_method_avaible_reco === true && f.method_was_given === true && f.fp_method === 'cycle_necklace').length,
                nbr_regular_user: familyPlannings.reduce((unique: FamilyPlanningData[], f: FamilyPlanningData) => {
                    if (!(['pregnancy_family_planning', 'family_planning'].includes(f.form) && f.has_counseling === true && f.already_use_method !== true && f.is_method_avaible_reco === true) && f.method_was_given === true && f.fp_method === 'cycle_necklace') {
                        if (!(unique.find(i => i.patient.id === f.patient.id))) {
                            unique.push(f);
                        }
                    }
                    return unique;
                }, []).length,
                nbr_total_user: familyPlannings.reduce((unique: FamilyPlanningData[], f: FamilyPlanningData) => {
                    if (f.method_was_given === true && f.fp_method === 'cycle_necklace') {
                        if (!(unique.find(i => i.patient.id === f.patient.id))) {
                            unique.push(f);
                        }
                    }
                    return unique;
                }, []).length,
                nbr_delivered: megStockNumber.cycle_necklace.consumption,
                nbr_in_stock: megStockNumber.cycle_necklace.stock_available,
                nbr_referred: megStockNumber.cycle_necklace.referred,
                nbr_side_effect: megStockNumber.cycle_necklace.side_effect,
            };
            const diu: FP_Utils = {
                nbr_new_user: familyPlannings.filter(f => ['pregnancy_family_planning', 'family_planning'].includes(f.form) && f.has_counseling === true && f.already_use_method !== true && f.is_method_avaible_reco === true && f.method_was_given === true && f.fp_method === 'diu').length,
                nbr_regular_user: familyPlannings.reduce((unique: FamilyPlanningData[], f: FamilyPlanningData) => {
                    if (!(['pregnancy_family_planning', 'family_planning'].includes(f.form) && f.has_counseling === true && f.already_use_method !== true && f.is_method_avaible_reco === true) && f.method_was_given === true && f.fp_method === 'diu') {
                        if (!(unique.find(i => i.patient.id === f.patient.id))) {
                            unique.push(f);
                        }
                    }
                    return unique;
                }, []).length,
                nbr_total_user: familyPlannings.reduce((unique: FamilyPlanningData[], f: FamilyPlanningData) => {
                    if (f.method_was_given === true && f.fp_method === 'diu') {
                        if (!(unique.find(i => i.patient.id === f.patient.id))) {
                            unique.push(f);
                        }
                    }
                    return unique;
                }, []).length,
                nbr_delivered: megStockNumber.diu.consumption,
                nbr_in_stock: megStockNumber.diu.stock_available,
                nbr_referred: megStockNumber.diu.referred,
                nbr_side_effect: megStockNumber.diu.side_effect,
            };
            const implant: FP_Utils = {
                nbr_new_user: familyPlannings.filter(f => ['pregnancy_family_planning', 'family_planning'].includes(f.form) && f.has_counseling === true && f.already_use_method !== true && f.is_method_avaible_reco === true && f.method_was_given === true && f.fp_method === 'implant').length,
                nbr_regular_user: familyPlannings.reduce((unique: FamilyPlanningData[], f: FamilyPlanningData) => {
                    if (!(['pregnancy_family_planning', 'family_planning'].includes(f.form) && f.has_counseling === true && f.already_use_method !== true && f.is_method_avaible_reco === true) && f.method_was_given === true && f.fp_method === 'implant') {
                        if (!(unique.find(i => i.patient.id === f.patient.id))) {
                            unique.push(f);
                        }
                    }
                    return unique;
                }, []).length,
                nbr_total_user: familyPlannings.reduce((unique: FamilyPlanningData[], f: FamilyPlanningData) => {
                    if (f.method_was_given === true && f.fp_method === 'implant') {
                        if (!(unique.find(i => i.patient.id === f.patient.id))) {
                            unique.push(f);
                        }
                    }
                    return unique;
                }, []).length,
                nbr_delivered: megStockNumber.implant.consumption,
                nbr_in_stock: megStockNumber.implant.stock_available,
                nbr_referred: megStockNumber.implant.referred,
                nbr_side_effect: megStockNumber.implant.side_effect,
            };
            const tubal_ligation: FP_Utils = {
                nbr_new_user: familyPlannings.filter(f => ['pregnancy_family_planning', 'family_planning'].includes(f.form) && f.has_counseling === true && f.already_use_method !== true && f.is_method_avaible_reco === true && f.method_was_given === true && f.fp_method === 'tubal_ligation').length,
                nbr_regular_user: familyPlannings.reduce((unique: FamilyPlanningData[], f: FamilyPlanningData) => {
                    if (!(['pregnancy_family_planning', 'family_planning'].includes(f.form) && f.has_counseling === true && f.already_use_method !== true && f.is_method_avaible_reco === true) && f.method_was_given === true && f.fp_method === 'tubal_ligation') {
                        if (!(unique.find(i => i.patient.id === f.patient.id))) {
                            unique.push(f);
                        }
                    }
                    return unique;
                }, []).length,
                nbr_total_user: familyPlannings.reduce((unique: FamilyPlanningData[], f: FamilyPlanningData) => {
                    if (f.method_was_given === true && f.fp_method === 'tubal_ligation') {
                        if (!(unique.find(i => i.patient.id === f.patient.id))) {
                            unique.push(f);
                        }
                    }
                    return unique;
                }, []).length,
                nbr_delivered: megStockNumber.tubal_ligation.consumption,
                nbr_in_stock: megStockNumber.tubal_ligation.stock_available,
                nbr_referred: megStockNumber.tubal_ligation.referred,
                nbr_side_effect: megStockNumber.tubal_ligation.side_effect,
            };

            const _fp = new FamilyPlanningReport();
            _fp.id = `${month}-${year}-${reco.id}`;
            _fp.month = month;
            _fp.year = year;
            _fp.pill_coc = pill_coc;
            _fp.pill_cop = pill_cop;
            _fp.condoms = condoms;
            _fp.depo_provera_im = depo_provera_im;
            _fp.dmpa_sc = dmpa_sc;
            _fp.cycle_necklace = cycle_necklace;
            _fp.diu = diu;
            _fp.implant = implant;
            _fp.tubal_ligation = tubal_ligation;

            _fp.country = reco.country;
            _fp.region = reco.region;
            _fp.prefecture = reco.prefecture;
            _fp.commune = reco.commune;
            _fp.hospital = reco.hospital;
            _fp.district_quartier = reco.district_quartier;
            // _fp.chw = reco.chw;
            _fp.village_secteur = reco.village_secteur;
            _fp.reco = { id: reco.id, name: reco.name, phone: reco.phone };

            await _repoReport.save(_fp);
            outPutData.SuccessCount += 1;
        } catch (err) {
            outPutData.ErrorsCount += 1;
        }
    }

    return outPutData;
}

export async function QUERY_RECO_MEG_DATA_STOCKS({ reco_id, month, year }: { reco_id?: string, month: string, year: number }): Promise<RecoMegData[]> {
    const filterDate = getFirstAndLastDayOfMonth(year, month);
    const timestamp = parseInt(date_to_milisecond(filterDate.end_date, false));
    let query:string = `SELECT * FROM reco_meg_data WHERE reported_date_timestamp <= $1`;
    let params:any = [timestamp];
    if (reco_id !== null && reco_id !== undefined) {
        query = `SELECT * FROM reco_meg_data WHERE reco_id = $1 AND reported_date_timestamp <= $2`;
        params = [reco_id, timestamp];
    }
    return await Connection.query(query, [...params]);
}

export function RECO_MEG_STOCKS(megStock: RecoMegData[], cible: 'pill_coc' | 'pill_cop' | 'diu' | 'condoms' | 'depo_provera_im' | 'implant' | 'dmpa_sc' | 'cycle_necklace' | 'tubal_ligation' | 'cta_nn' | 'cta_pe' | 'cta_ge' | 'cta_ad' | 'tdr' | 'amoxicillin_250mg' | 'amoxicillin_500mg' | 'paracetamol_250mg' | 'paracetamol_500mg' | 'ors' | 'zinc' | 'vitamin_a' | 'mebendazol_250mg' | 'mebendazol_500mg' | 'tetracycline_ointment') {
    const total_stock: number = megStock.filter(m => m.meg_type === 'stock' && m[cible] !== null && (m as any)[cible] >= 0).map(c => parseInt(`${c[cible]}`)).reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0);
    const consumption: number = megStock.filter(m => m.meg_type === 'consumption' && m[cible] !== null && (m as any)[cible] >= 0).map(c => parseInt(`${c[cible]}`)).reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0);
    const loss: number = megStock.filter(m => m.meg_type === 'loss' && m[cible] !== null && (m as any)[cible] >= 0).map(c => parseInt(`${c[cible]}`)).reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0);
    const damaged: number = megStock.filter(m => m.meg_type === 'damaged' && m[cible] !== null && (m as any)[cible] >= 0).map(c => parseInt(`${c[cible]}`)).reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0);
    const broken: number = megStock.filter(m => m.meg_type === 'broken' && m[cible] !== null && (m as any)[cible] >= 0).map(c => parseInt(`${c[cible]}`)).reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0);
    const expired: number = megStock.filter(m => m.meg_type === 'expired' && m[cible] !== null && (m as any)[cible] >= 0).map(c => parseInt(`${c[cible]}`)).reduce((total, num) => parseInt(`${total}`) + parseInt(`${num}`), 0);
    const stock_available: number = total_stock - consumption - loss - damaged - broken - expired;
    const referred: number = megStock.filter(m => m.fp_method === cible && m.is_fp_referred === true).length;
    const side_effect: number = megStock.filter(m => m.fp_method === cible && m.has_fp_side_effect === true).length;
    return {
        total_stock: total_stock,
        consumption: consumption,
        loss: loss,
        damaged: damaged,
        broken: broken,
        expired: expired,
        stock_available: stock_available,
        referred: referred,
        side_effect: side_effect,
    };
}

export function RECO_MEG_FULL_STOCKS(megStock: RecoMegData[]) {
    return {
        pill_coc: RECO_MEG_STOCKS(megStock, 'pill_coc'),
        pill_cop: RECO_MEG_STOCKS(megStock, 'pill_cop'),
        condoms: RECO_MEG_STOCKS(megStock, 'condoms'),
        depo_provera_im: RECO_MEG_STOCKS(megStock, 'depo_provera_im'),
        dmpa_sc: RECO_MEG_STOCKS(megStock, 'dmpa_sc'),
        cycle_necklace: RECO_MEG_STOCKS(megStock, 'cycle_necklace'),
        diu: RECO_MEG_STOCKS(megStock, 'diu'),
        implant: RECO_MEG_STOCKS(megStock, 'implant'),
        tubal_ligation: RECO_MEG_STOCKS(megStock, 'tubal_ligation'),
        cta_nn: RECO_MEG_STOCKS(megStock, 'cta_nn'),
        cta_pe: RECO_MEG_STOCKS(megStock, 'cta_pe'),
        cta_ge: RECO_MEG_STOCKS(megStock, 'cta_ge'),
        cta_ad: RECO_MEG_STOCKS(megStock, 'cta_ad'),
        tdr: RECO_MEG_STOCKS(megStock, 'tdr'),
        amoxicillin_250mg: RECO_MEG_STOCKS(megStock, 'amoxicillin_250mg'),
        amoxicillin_500mg: RECO_MEG_STOCKS(megStock, 'amoxicillin_500mg'),
        paracetamol_250mg: RECO_MEG_STOCKS(megStock, 'paracetamol_250mg'),
        paracetamol_500mg: RECO_MEG_STOCKS(megStock, 'paracetamol_500mg'),
        ors: RECO_MEG_STOCKS(megStock, 'ors'),
        zinc: RECO_MEG_STOCKS(megStock, 'zinc'),
        vitamin_a: RECO_MEG_STOCKS(megStock, 'vitamin_a'),
        mebendazol_250mg: RECO_MEG_STOCKS(megStock, 'mebendazol_250mg'),
        mebendazol_500mg: RECO_MEG_STOCKS(megStock, 'mebendazol_500mg'),
        tetracycline_ointment: RECO_MEG_STOCKS(megStock, 'tetracycline_ointment')
    };
}
