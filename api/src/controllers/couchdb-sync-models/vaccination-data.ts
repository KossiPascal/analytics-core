import { Repository } from "typeorm";
import { milisecond_to_date } from "../../utils/date-utils";
import { VaccinationData, getVaccinationDataRepository } from "../../entities/_Vaccination-data";
import { dataTransform, getSexe } from "../../utils/functions";


export async function SyncVaccinationData(report: any, _repoVaccine: Repository<VaccinationData> | null = null): Promise<boolean> {
    try {
        _repoVaccine = _repoVaccine ?? await getVaccinationDataRepository();
        const reported_date = milisecond_to_date(report.reported_date, 'dateOnly');
        const month = (new Date(reported_date)).getMonth() + 1;
        const fields = report.fields;
        const _vaccine = new VaccinationData();

        _vaccine.id = report._id;
        _vaccine.rev = report._rev;
        _vaccine.form = report.form;
        _vaccine.year = (new Date(reported_date)).getFullYear();
        _vaccine.month = month < 10 ? `0${month}` : `${month}`;

        _vaccine.sex = getSexe(fields.patient_sex);
        _vaccine.date_of_birth = fields.patient_date_of_birth;
        _vaccine.age_in_years = parseFloat(`${fields.patient_age_in_years}`);
        _vaccine.age_in_months = parseFloat(`${fields.patient_age_in_months}`);
        _vaccine.age_in_days = parseFloat(`${fields.patient_age_in_days}`);

        _vaccine.vaccine_BCG = dataTransform(fields.vaccine_BCG, 'null_false')
        _vaccine.vaccine_VPO_0 = dataTransform(fields.vaccine_VPO_0, 'null_false')
        _vaccine.vaccine_PENTA_1 = dataTransform(fields.vaccine_PENTA_1, 'null_false')
        _vaccine.vaccine_VPO_1 = dataTransform(fields.vaccine_VPO_1, 'null_false')
        _vaccine.vaccine_PENTA_2 = dataTransform(fields.vaccine_PENTA_2, 'null_false')
        _vaccine.vaccine_VPO_2 = dataTransform(fields.vaccine_VPO_2, 'null_false')
        _vaccine.vaccine_PENTA_3 = dataTransform(fields.vaccine_PENTA_3, 'null_false')
        _vaccine.vaccine_VPO_3 = dataTransform(fields.vaccine_VPO_3, 'null_false')
        _vaccine.vaccine_VPI_1 = dataTransform(fields.vaccine_VPI_1, 'null_false')
        _vaccine.vaccine_VAR_1 = dataTransform(fields.vaccine_VAR_1, 'null_false')
        _vaccine.vaccine_VAA = dataTransform(fields.vaccine_VAA, 'null_false')
        _vaccine.vaccine_VPI_2 = dataTransform(fields.vaccine_VPI_2, 'null_false')
        _vaccine.vaccine_MEN_A = dataTransform(fields.vaccine_MEN_A, 'null_false')
        _vaccine.vaccine_VAR_2 = dataTransform(fields.vaccine_VAR_2, 'null_false')

        _vaccine.is_birth_vaccine_ok = dataTransform(fields.is_birth_vaccine_ok, 'null_false')
        _vaccine.is_six_weeks_vaccine_ok = dataTransform(fields.is_six_weeks_vaccine_ok, 'null_false')
        _vaccine.is_ten_weeks_vaccine_ok = dataTransform(fields.is_ten_weeks_vaccine_ok, 'null_false')
        _vaccine.is_forteen_weeks_vaccine_ok = dataTransform(fields.is_forteen_weeks_vaccine_ok, 'null_false')
        _vaccine.is_nine_months_vaccine_ok = dataTransform(fields.is_nine_months_vaccine_ok, 'null_false')
        _vaccine.is_fifty_months_vaccine_ok = dataTransform(fields.is_fifty_months_vaccine_ok, 'null_false')

        _vaccine.is_vaccine_referal = dataTransform(fields.is_vaccine_referal, 'null_false')
        _vaccine.has_all_vaccine_done = dataTransform(fields.has_all_vaccine_done, 'null_false')

        _vaccine.country = fields.country_id;
        _vaccine.region = fields.region_id;
        _vaccine.prefecture = fields.prefecture_id;
        _vaccine.commune = fields.commune_id;
        _vaccine.hospital = fields.hospital_id;
        _vaccine.district_quartier = fields.district_quartier_id;
        _vaccine.village_secteur = fields.village_secteur_id;
        _vaccine.family = fields.household_id;
        _vaccine.reco = fields.user_id;
        _vaccine.patient = fields.patient_id;
        _vaccine.reported_date_timestamp = report.reported_date;
        _vaccine.reported_date = reported_date;

        _vaccine.reported_full_date = milisecond_to_date(report.reported_date, 'fulldate');
        _vaccine.geolocation = report.geolocation;

        await _repoVaccine.save(_vaccine);
        return true;
    } catch (err: any) {
        return false;
    }
}