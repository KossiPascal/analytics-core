import { Repository } from "typeorm";
import { milisecond_to_date } from "../../utils/date-utils";
import { FamilyPlanningData, getFamilyPlanningDataRepository } from "../../entities/_FamilyPlannig-data";
import { dataTransform, getSexe } from "../../utils/functions";


export async function SyncFamilyPlanningData(report: any, _repoFP: Repository<FamilyPlanningData> | null = null): Promise<boolean> {
    try {
        _repoFP = _repoFP ?? await getFamilyPlanningDataRepository();

        const reported_date = milisecond_to_date(report.reported_date, 'dateOnly');
        const month = (new Date(reported_date)).getMonth() + 1;
        const fields = report.fields;

        const _fp = new FamilyPlanningData();

        _fp.id = report._id;
        _fp.rev = report._rev;
        _fp.form = report.form;
        _fp.year = (new Date(reported_date)).getFullYear();
        _fp.month = month < 10 ? `0${month}` : `${month}`;

        _fp.sex = getSexe(fields.patient_sex);
        _fp.date_of_birth = fields.patient_date_of_birth;
        _fp.age_in_years = parseFloat(`${fields.patient_age_in_years}`);
        _fp.age_in_months = parseFloat(`${fields.patient_age_in_months}`);
        _fp.age_in_days = parseFloat(`${fields.patient_age_in_days}`);
        

        if (report.form === 'pregnancy_family_planning') {
            _fp.consultation_followup = 'consultation';
            _fp.has_counseling = dataTransform(fields.has_counseling, 'null_false');
            _fp.no_counseling_reasons = dataTransform(fields.no_counseling_reasons, 'string');
            _fp.no_counseling_reasons_name = dataTransform(fields.no_counseling_reasons_name, 'string');
            _fp.already_use_method = dataTransform(fields.already_use_method, 'null_false');
            _fp.method_already_used = dataTransform(fields.method_already_used, 'string');
            _fp.is_currently_using_method = dataTransform(fields.is_currently_using_method, 'null_false');
            _fp.has_changed_method = dataTransform(fields.has_changed_method, 'null_false');
            _fp.want_renew_method = dataTransform(fields.want_renew_method, 'null_false');
            _fp.want_renew_method_date = dataTransform(fields.want_renew_method_date, 'string');
            _fp.refuse_renew_method_reasons = dataTransform(fields.refuse_renew_method_reasons, 'string');
            _fp.refuse_renew_method_reasons_name = dataTransform(fields.refuse_renew_method_reasons_name, 'string');
            _fp.new_method_wanted = dataTransform(fields.new_method_wanted, 'string');
            _fp.who_will_give_method = dataTransform(fields.who_will_give_method, 'string');
            _fp.method_was_given = dataTransform(fields.method_was_given, 'null_false');
            _fp.method_start_date = dataTransform(fields.method_start_date, 'string');
            _fp.method_not_given_reason = dataTransform(fields.method_not_given_reason, 'string');
            _fp.method_not_given_reason_name = dataTransform(fields.method_not_given_reason_name, 'string');
            _fp.is_method_avaible_reco = dataTransform(fields.is_method_avaible_reco, 'null_false');
            _fp.fp_method = dataTransform(fields.fp_method, 'string');
            _fp.fp_method_name = dataTransform(fields.fp_method_name, 'string');
            _fp.next_fp_renew_date = dataTransform(fields.next_fp_renew_date, 'string');
            _fp.is_fp_referal = dataTransform(fields.is_fp_referred, 'null_false');
        }

        if (report.form === 'fp_danger_sign_check') {
            _fp.consultation_followup = 'danger_sign_check';
            _fp.fp_method = dataTransform(fields.fp_method, 'string');
            _fp.fp_method_name = dataTransform(fields.fp_method_name, 'string');
            _fp.has_health_problem = dataTransform(fields.has_health_problem, 'null_false');
            _fp.has_fever = dataTransform(fields.has_fever, 'null_false');
            _fp.has_vomit = dataTransform(fields.has_vomit, 'null_false');
            _fp.has_headaches = dataTransform(fields.has_headaches, 'null_false');
            _fp.has_abdominal_pain = dataTransform(fields.has_abdominal_pain, 'null_false');
            _fp.has_bleeding = dataTransform(fields.has_bleeding, 'null_false');
            _fp.has_feel_pain_injection = dataTransform(fields.has_feel_pain_injection, 'null_false');
            _fp.has_secondary_effect = dataTransform(fields.has_secondary_effect, 'null_false');
            _fp.other_health_problem_written = dataTransform(fields.other_health_problem_written, 'string');
        }

        if (report.form === 'fp_renewal') {
            _fp.consultation_followup = 'renewal';
            _fp.fp_method = dataTransform(fields.fp_method, 'string');
            _fp.fp_method_name = dataTransform(fields.fp_method_name, 'string');
            _fp.next_fp_renew_date = dataTransform(fields.next_fp_renew_date, 'string');
            _fp.method_was_given = dataTransform(fields.method_was_given, 'null_false');
            _fp.method_start_date = dataTransform(fields.method_start_date, 'string');
            _fp.method_not_given_reason = dataTransform(fields.method_not_given_reason, 'string');
            _fp.method_not_given_reason_name = dataTransform(fields.method_not_given_reason_name, 'string');
            _fp.is_fp_referal = dataTransform(fields.is_fp_referal, 'null_false');
            _fp.is_health_problem_referal = dataTransform(fields.is_health_problem_referal, 'null_false');
        }

        _fp.country = fields.country_id;
        _fp.region = fields.region_id;
        _fp.prefecture = fields.prefecture_id;
        _fp.commune = fields.commune_id;
        _fp.hospital = fields.hospital_id;
        _fp.district_quartier = fields.district_quartier_id;
        _fp.village_secteur = fields.village_secteur_id;
        _fp.family = fields.household_id;
        _fp.reco = fields.user_id;
        _fp.patient = fields.patient_id;
        _fp.reported_date_timestamp = report.reported_date;
        _fp.reported_date = reported_date;
        _fp.reported_full_date = milisecond_to_date(report.reported_date, 'fulldate');
        _fp.geolocation = report.geolocation;

        await _repoFP.save(_fp);
        return true;
    } catch (err: any) {
        return false;
    }
}