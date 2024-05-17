import { Repository } from "typeorm";
import { milisecond_to_date } from "../../utils/date-utils";
import { ReferalData, getReferalDataRepository } from "../../entities/_Referal-data";
import { dataTransform, getSexe } from "../../utils/functions";


export async function SyncReferalData(report: any, _repoReferal: Repository<ReferalData> | null = null): Promise<boolean> {
    try {
        _repoReferal = _repoReferal ?? await getReferalDataRepository();

        const reported_date = milisecond_to_date(report.reported_date, 'dateOnly');
        const month = (new Date(reported_date)).getMonth() + 1;
        const fields = report.fields;

        const _referal = new ReferalData();

        _referal.id = report._id;
        _referal.rev = report._rev;
        _referal.form = report.form;
        _referal.year = (new Date(reported_date)).getFullYear();
        _referal.month = month < 10 ? `0${month}` : `${month}`;

        _referal.sex = getSexe(fields.patient_sex);
        _referal.date_of_birth = fields.patient_date_of_birth;
        _referal.age_in_years = parseFloat(`${fields.patient_age_in_years}`);
        _referal.age_in_months = parseFloat(`${fields.patient_age_in_months}`);
        _referal.age_in_days = parseFloat(`${fields.patient_age_in_days}`);

        _referal.is_present = dataTransform(fields.is_present, 'null_false');
        _referal.absence_reasons = dataTransform(fields.absence_reasons, 'string');
        _referal.went_to_health_center = dataTransform(fields.went_to_health_center, 'null_false');
        _referal.coupon_available = dataTransform(fields.coupon_available, 'null_false');
        _referal.coupon_number = dataTransform(fields.coupon_number, 'string');
        _referal.has_no_improvement = dataTransform(fields.has_no_improvement, 'null_false');
        _referal.has_getting_worse = dataTransform(fields.has_getting_worse, 'null_false');
        _referal.is_referred = dataTransform(fields.is_referred, 'null_false');

        _referal.country = fields.country_id;
        _referal.region = fields.region_id;
        _referal.prefecture = fields.prefecture_id;
        _referal.commune = fields.commune_id;
        _referal.hospital = fields.hospital_id;
        _referal.district_quartier = fields.district_quartier_id;
        _referal.village_secteur = fields.village_secteur_id;
        _referal.family = fields.household_id;
        _referal.reco = fields.user_id;
        _referal.patient = fields.patient_id;
        _referal.reported_date_timestamp = report.reported_date;
        _referal.reported_date = reported_date;
        _referal.reported_full_date = milisecond_to_date(report.reported_date, 'fulldate');
        _referal.geolocation = report.geolocation;

        await _repoReferal.save(_referal);
        return true;
    } catch (err: any) {
        return false;
    }
}