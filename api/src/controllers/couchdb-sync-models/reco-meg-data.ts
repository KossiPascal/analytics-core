import { Repository } from "typeorm";
import { milisecond_to_date } from "../../utils/date-utils";
import { RecoMegData, getRecoMegDataRepository } from "../../entities/_Meg-Reco-data";
import { dataTransform, isTrue, notEmpty } from "../../utils/functions";


export async function SyncRecoMegData(report: any, _repoMeg: Repository<RecoMegData> | null = null): Promise<boolean> {
    try {
        _repoMeg = _repoMeg ?? await getRecoMegDataRepository();

        const reported_date = milisecond_to_date(report.reported_date, 'dateOnly');
        const month = (new Date(reported_date)).getMonth() + 1;
        const fields = report.fields;

        const _meg = new RecoMegData();

        _meg.id = report._id;
        _meg.rev = report._rev;
        _meg.form = report.form;
        _meg.year = (new Date(reported_date)).getFullYear();
        _meg.month = month < 10 ? `0${month}` : `${month}`;


        if (['stock_entry', 'stock_movement'].includes(report.form)) {
            if (report.form === 'stock_entry') _meg.meg_type = 'stock';
            if (report.form === 'stock_movement') _meg.meg_type = fields.med_movement_reason.movement_reason;
            _meg.pill_coc = dataTransform(fields.meg_quantity.pilule_coc, 'number');
            _meg.pill_cop = dataTransform(fields.meg_quantity.pilule_cop, 'number');
            _meg.condoms = dataTransform(fields.meg_quantity.condoms, 'number');
            _meg.depo_provera_im = dataTransform(fields.meg_quantity.depo_provera_im, 'number');
            _meg.dmpa_sc = dataTransform(fields.meg_quantity.dmpa_sc, 'number');
            _meg.cycle_necklace = dataTransform(fields.meg_quantity.cycle_necklace, 'number');
            _meg.tubal_ligation = dataTransform(fields.meg_quantity.tubal_ligation, 'number');
            _meg.cta = dataTransform(fields.meg_quantity.cta, 'number');
            _meg.tdr = dataTransform(fields.meg_quantity.tdr, 'number');
            _meg.amoxicillin_250mg = dataTransform(fields.meg_quantity.amoxicillin250_mg, 'number');
            _meg.amoxicillin_500mg = dataTransform(fields.meg_quantity.amoxicillin500_mg, 'number');
            _meg.paracetamol_250mg = dataTransform(fields.meg_quantity.paracetamol250_mg, 'number');
            _meg.paracetamol_500mg = dataTransform(fields.meg_quantity.paracetamol500_mg, 'number');
            _meg.ors_zinc = dataTransform(fields.meg_quantity.ors_zinc, 'number');
            _meg.vitamin_a = dataTransform(fields.meg_quantity.vitamin_a, 'number');
            _meg.mebendazol_250mg = dataTransform(fields.meg_quantity.mebendazol_250mg, 'number');
            _meg.mebendazol_500mg = dataTransform(fields.meg_quantity.mebendazol_500mg, 'number');
            _meg.tetracycline_ointment = dataTransform(fields.meg_quantity.tetracycline_ointment, 'number');
        }

        if (report.form === 'pcimne_register') {
            _meg.meg_type = 'consumption';
            _meg.cta = dataTransform(fields.cta_quantity, 'number');
            _meg.amoxicillin_250mg = dataTransform(fields.amoxicillin_250mg_quantity, 'number');
            _meg.amoxicillin_500mg = dataTransform(fields.amoxicillin_500mg_quantity, 'number');
            _meg.paracetamol_250mg = dataTransform(fields.paracetamol_250mg_quantity, 'number');
            _meg.paracetamol_500mg = dataTransform(fields.paracetamol_500mg_quantity, 'number');
            _meg.mebendazol_250mg = dataTransform(fields.mebendazole_250mg_quantity, 'number');
            _meg.mebendazol_500mg = dataTransform(fields.mebendazole_500mg_quantity, 'number');
            _meg.ors_zinc = dataTransform(fields.ors_zinc_quantity, 'number');
            _meg.vitamin_a = dataTransform(fields.vitamin_a_quantity, 'number');
            _meg.tetracycline_ointment = dataTransform(fields.tetracycline_ointment_quantity, 'number');
            if (isTrue(fields.rdt_given)) _meg.tdr = 1;
        }

        if (report.form === 'adult_consulation') {
            _meg.meg_type = 'consumption';
            _meg.cta = dataTransform(fields.cta_quantity, 'number')
            _meg.amoxicillin_250mg = dataTransform(fields.amoxicillin_250mg_quantity, 'number')
            _meg.amoxicillin_500mg = dataTransform(fields.amoxicillin_500mg_quantity, 'number')
            _meg.paracetamol_250mg = dataTransform(fields.paracetamol_250mg_quantity, 'number')
            _meg.paracetamol_500mg = dataTransform(fields.paracetamol_500mg_quantity, 'number')
            _meg.mebendazol_250mg = dataTransform(fields.mebendazole_250mg_quantity, 'number')
            _meg.mebendazol_500mg = dataTransform(fields.mebendazole_500mg_quantity, 'number')
            _meg.ors_zinc = dataTransform(fields.ors_zinc_quantity, 'number')
            if (isTrue(fields.rdt_given)) _meg.tdr = 1;
        }

        if (['pregnancy_family_planning', 'fp_renewal', 'fp_danger_sign_check'].includes(report.form)) {
            _meg.meg_type = 'consumption';
            _meg.fp_method = fields.fp_method;
            if (['pregnancy_family_planning', 'fp_renewal'].includes(report.form) && isTrue(fields.method_was_given)) {
                if (fields.fp_method === 'dmpa_sc') {
                    _meg.dmpa_sc = 1;
                }
                if (fields.fp_method === 'pill_coc') {
                    if (notEmpty(fields.method_months_count_1) && parseInt(`${fields.method_months_count_1}`) > 0) {
                        _meg.pill_coc = parseInt(`${fields.method_months_count_1}`);
                    }
                }
                if (fields.fp_method === 'pill_cop') {
                    if (notEmpty(fields.method_months_count_1) && parseInt(`${fields.method_months_count_1}`) > 0) {
                        _meg.pill_cop = parseInt(`${fields.method_months_count_1}`);
                    }
                }
                if (fields.fp_method === 'condoms' && notEmpty(fields.condoms_quantity_given) && parseInt(`${fields.condoms_quantity_given}`) > 0) {
                    _meg.condoms = parseInt(`${fields.condoms_quantity_given}`); // fields.method_months_count_2
                }
            }

            if (report.form === 'pregnancy_family_planning') {
                if (isTrue(fields.is_fp_referred)) {
                    _meg.is_fp_referred = true;
                }
                if (isTrue(fields.has_fp_side_effect)) {
                    _meg.has_fp_side_effect = true;
                }
            }

            if (report.form === 'fp_danger_sign_check') {
                if (isTrue(fields.is_referred)) {
                    _meg.is_fp_referred = true;
                }
                if (isTrue(fields.has_secondary_effect)) {
                    _meg.has_fp_side_effect = true;
                }
            }

            if (report.form === 'fp_renewal') {
                if (isTrue(fields.is_fp_referal)) {
                    _meg.is_fp_referred = true;
                }
                if (isTrue(fields.has_fp_side_effect)) {
                    _meg.has_fp_side_effect = true;
                }
            }
        }

        _meg.country = fields.country_id;
        _meg.region = fields.region_id;
        _meg.prefecture = fields.prefecture_id;
        _meg.commune = fields.commune_id;
        _meg.hospital = fields.hospital_id;
        _meg.district_quartier = fields.district_quartier_id;
        _meg.village_secteur = fields.village_secteur_id;
        _meg.reco = fields.user_id;
        _meg.reported_date_timestamp = report.reported_date;
        _meg.reported_date = reported_date;
        _meg.reported_full_date = milisecond_to_date(report.reported_date, 'fulldate');
        _meg.geolocation = report.geolocation;

        await _repoMeg.save(_meg);
        return true;
    } catch (err: any) {
        return false;
    }
}