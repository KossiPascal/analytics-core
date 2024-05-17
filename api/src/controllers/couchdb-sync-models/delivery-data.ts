import { Repository } from "typeorm";
import { milisecond_to_date } from "../../utils/date-utils";
import { DeliveryData, getDeliveryDataRepository } from "../../entities/_Delivery-data";
import { dataTransform, getSexe, isTrue } from "../../utils/functions";


export async function SyncDeliveryData(report: any, _repoDelivery: Repository<DeliveryData> | null = null): Promise<boolean> {
    try {
        _repoDelivery = _repoDelivery ?? await getDeliveryDataRepository();

        const reported_date = milisecond_to_date(report.reported_date, 'dateOnly');
        const month = (new Date(reported_date)).getMonth() + 1;
        const fields = report.fields;

        const _delivery = new DeliveryData();

        _delivery.id = report._id;
        _delivery.rev = report._rev;
        _delivery.form = report.form;
        _delivery.year = (new Date(reported_date)).getFullYear();
        _delivery.month = month < 10 ? `0${month}` : `${month}`;

        _delivery.sex = getSexe(fields.patient_sex);
        _delivery.date_of_birth = fields.patient_date_of_birth;
        _delivery.age_in_years = parseFloat(`${fields.patient_age_in_years}`);
        _delivery.age_in_months = parseFloat(`${fields.patient_age_in_months}`);
        _delivery.age_in_days = parseFloat(`${fields.patient_age_in_days}`);

        _delivery.delivery_date = dataTransform(fields.delivery_date, 'string');
        _delivery.babies_alive_number = dataTransform(fields.babies_alive_number, 'number');
        _delivery.babies_deceased_number = dataTransform(fields.babies_deceased_number, 'number');
        _delivery.cpon_done = dataTransform(fields.cpon_done, 'null_false');
        _delivery.cpon_done_date = dataTransform(fields.cpon_done_date, 'string');
        _delivery.has_health_problem = dataTransform(fields.has_health_problem, 'null_false');
        _delivery.received_milda = dataTransform(fields.received_milda, 'null_false');
        _delivery.is_home_delivery = dataTransform(fields.is_home_delivery, 'null_false');

        _delivery.country = fields.country_id;
        _delivery.region = fields.region_id;
        _delivery.prefecture = fields.prefecture_id;
        _delivery.commune = fields.commune_id;
        _delivery.hospital = fields.hospital_id;
        _delivery.district_quartier = fields.district_quartier_id;
        _delivery.village_secteur = fields.village_secteur_id;
        _delivery.family = fields.household_id;
        _delivery.reco = fields.user_id;
        _delivery.patient = fields.patient_id;
        _delivery.reported_date_timestamp = report.reported_date;
        _delivery.reported_date = reported_date;
        _delivery.reported_full_date = milisecond_to_date(report.reported_date, 'fulldate');
        _delivery.geolocation = report.geolocation;

        await _repoDelivery.save(_delivery);
        return true;
    } catch (err: any) {
        return false;
    }
}