import { Repository } from "typeorm";
import { milisecond_to_date } from "../../utils/date-utils";
import { PregnantData, getPregnantDataRepository } from "../../entities/_Pregnant-data";
import { dataTransform, getSexe, isTrue } from "../../utils/functions";


export async function SyncPregnantData(report: any, _repoPregnant: Repository<PregnantData> | null = null): Promise<boolean> {
    try {
        _repoPregnant = _repoPregnant ?? await getPregnantDataRepository();

        const reported_date = milisecond_to_date(report.reported_date, 'dateOnly');
        const month = (new Date(reported_date)).getMonth() + 1;
        const fields = report.fields;

        const _pregnant = new PregnantData();

        _pregnant.id = report._id;
        _pregnant.rev = report._rev;
        _pregnant.form = report.form;
        _pregnant.year = (new Date(reported_date)).getFullYear();
        _pregnant.month = month < 10 ? `0${month}` : `${month}`;

        _pregnant.sex = getSexe(fields.patient_sex);
        _pregnant.date_of_birth = fields.patient_date_of_birth;
        _pregnant.age_in_years = parseFloat(`${fields.patient_age_in_years}`);
        _pregnant.age_in_months = parseFloat(`${fields.patient_age_in_months}`);
        _pregnant.age_in_days = parseFloat(`${fields.patient_age_in_days}`);

        if (report.form === 'pregnancy_family_planning') {
            _pregnant.consultation_followup = 'consultation';
            _pregnant.is_pregnant = dataTransform(fields.is_pregnant, 'null_false');
            _pregnant.next_cpn_visit_date = dataTransform(fields.next_cpn_visit_date, 'string');
            _pregnant.is_cpn_late = dataTransform(fields.is_cpn_late, 'null_false');
            _pregnant.is_pregnant_referred = dataTransform(fields.is_pregnant_referred, 'null_false');
            _pregnant.has_danger_sign = dataTransform(fields.has_danger_sign, 'null_false');
            _pregnant.is_referred = dataTransform(fields.is_referred, 'null_false');
            _pregnant.cpn_done = dataTransform(fields.cpn_done, 'null_false');
            _pregnant.td1_done = dataTransform(fields.td1_done, 'null_false');
            _pregnant.td2_done = dataTransform(fields.td2_done, 'null_false');
            _pregnant.has_milda = dataTransform(fields.has_milda, 'null_false');
            _pregnant.cpn_number = dataTransform(fields.cpn_number, 'number');
            _pregnant.date_cpn1 = dataTransform(fields.date_cpn1, 'string');
            _pregnant.date_cpn2 = dataTransform(fields.date_cpn2, 'string');
            _pregnant.date_cpn3 = dataTransform(fields.date_cpn3, 'string');
            _pregnant.date_cpn4 = dataTransform(fields.date_cpn4, 'string');
            _pregnant.next_cpn_date = dataTransform(fields.next_cpn_date, 'string');
            _pregnant.cpn_next_number = dataTransform(fields.cpn_next_number, 'number');
            _pregnant.delivery_place_wanted = dataTransform(fields.delivery_place_wanted, 'string');
            _pregnant.is_home_delivery_wanted = dataTransform(fields.is_home_delivery_wanted, 'null_false');
        }

        if (report.form === 'prenatal_followup') {
            _pregnant.consultation_followup = 'followup';
            _pregnant.cpn_already_count = dataTransform(fields.cpn_already_count, 'number');
            _pregnant.is_closed = dataTransform(fields.is_closed, 'null_false');
            _pregnant.close_reason = dataTransform(fields.close_reason, 'string');
            _pregnant.close_reason_name = dataTransform(fields.close_reason_name, 'string');
            _pregnant.has_danger_sign = dataTransform(fields.has_danger_sign, 'null_false');
            _pregnant.is_miscarriage_referred = dataTransform(fields.is_miscarriage_referred, 'null_false');
            _pregnant.is_pregnant = dataTransform(fields.is_pregnant, 'null_false');
            _pregnant.cpn_done = dataTransform(fields.cpn_done, 'null_false');
            _pregnant.cpn_number = dataTransform(fields.cpn_number, 'number');
            _pregnant.date_cpn1 = dataTransform(fields.date_cpn1, 'string');
            _pregnant.date_cpn2 = dataTransform(fields.date_cpn2, 'string');
            _pregnant.date_cpn3 = dataTransform(fields.date_cpn3, 'string');
            _pregnant.date_cpn4 = dataTransform(fields.date_cpn4, 'string');
            _pregnant.td1_done = dataTransform(fields.td1_done, 'null_false');
            _pregnant.td2_done = dataTransform(fields.td2_done, 'null_false');
            _pregnant.has_milda = dataTransform(fields.has_milda, 'null_false');
            _pregnant.cpn_next_number = dataTransform(fields.cpn_next_number, 'number');
            _pregnant.next_cpn_date = dataTransform(fields.next_cpn_date, 'string');
            _pregnant.next_cpn_visit_date = dataTransform(fields.next_cpn_visit_date, 'string');
            _pregnant.is_cpn_late = dataTransform(fields.is_cpn_late, 'null_false');
            _pregnant.is_referred = dataTransform(fields.is_referred, 'null_false');
        }


        _pregnant.country = fields.country_id;
        _pregnant.region = fields.region_id;
        _pregnant.prefecture = fields.prefecture_id;
        _pregnant.commune = fields.commune_id;
        _pregnant.hospital = fields.hospital_id;
        _pregnant.district_quartier = fields.district_quartier_id;
        _pregnant.village_secteur = fields.village_secteur_id;
        _pregnant.family = fields.household_id;
        _pregnant.reco = fields.user_id;
        _pregnant.patient = fields.patient_id;
        _pregnant.reported_date_timestamp = report.reported_date;
        _pregnant.reported_date = reported_date;
        _pregnant.reported_full_date = milisecond_to_date(report.reported_date, 'fulldate');
        _pregnant.geolocation = report.geolocation;

        await _repoPregnant.save(_pregnant);
        return true;
    } catch (err: any) {
        return false;
    }
}