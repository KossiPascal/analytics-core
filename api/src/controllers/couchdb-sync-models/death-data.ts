import { Repository } from "typeorm";
import { milisecond_to_date } from "../../utils/date-utils";
import { dataTransform, getSexe, notEmpty } from "../../utils/functions";
import { DeathData, getDeathDataRepository } from "../../entities/_Death-data";


export async function SyncDeathData(report: any, _repoDeath: Repository<DeathData> | null = null): Promise<boolean> {
    try {
        _repoDeath = _repoDeath ?? await getDeathDataRepository();

        const reported_date = milisecond_to_date(report.reported_date, 'dateOnly');
        const month = (new Date(reported_date)).getMonth() + 1;
        const fields = report.fields;
        const deathReason: any[] = notEmpty(fields.death_reason) ? fields.death_reason.split(' ') : [];

        const _death = new DeathData();

        _death.id = report._id;
        _death.rev = report._rev;
        _death.form = report.form;
        _death.year = (new Date(reported_date)).getFullYear();
        _death.month = month < 10 ? `0${month}` : `${month}`;

        _death.sex = getSexe(fields.patient_sex);
        _death.date_of_birth = fields.patient_date_of_birth;
        _death.age_in_years = parseFloat(`${fields.patient_age_in_years}`);
        _death.age_in_months = parseFloat(`${fields.patient_age_in_months}`);
        _death.age_in_days = parseFloat(`${fields.patient_age_in_days}`);

        _death.date_of_death = dataTransform(fields.date_of_death, 'string');
        _death.death_place = dataTransform(fields.death_place, 'string');
        _death.death_reason = deathReason;
        _death.death_place_label = dataTransform(fields.death_place_label, 'string');
        _death.death_reason_label = dataTransform(fields.death_reason_label, 'string');
        _death.is_maternal_death = dataTransform(fields.is_maternal_death, 'null_false');
        _death.is_home_death = dataTransform(fields.is_home_death, 'null_false');

        _death.has_malaria = dataTransform(deathReason.includes(`malaria`), `null_false`);
        _death.has_diarrhea = dataTransform(deathReason.includes(`diarrhea`), `null_false`);
        _death.has_malnutrition = dataTransform(deathReason.includes(`malnutrition`), `null_false`);
        _death.has_cough_cold = dataTransform(deathReason.includes(`cough_cold`), `null_false`);
        _death.has_pneumonia = dataTransform(deathReason.includes(`pneumonia`), `null_false`);
        _death.has_maternal_death = dataTransform(deathReason.includes(`maternal_death`), `null_false`);
        _death.has_fever = dataTransform(deathReason.includes(`fever`), `null_false`);
        _death.has_yellow_fever = dataTransform(deathReason.includes(`yellow_fever`), `null_false`);
        _death.has_tetanus = dataTransform(deathReason.includes(`tetanus`), `null_false`);
        _death.has_viral_diseases = dataTransform(deathReason.includes(`viral_diseases`), `null_false`);
        _death.has_meningitis = dataTransform(deathReason.includes(`meningitis`), `null_false`);
        _death.has_miscarriage = dataTransform(deathReason.includes(`miscarriage`), `null_false`);
        _death.has_traffic_accident = dataTransform(deathReason.includes(`traffic_accident`), `null_false`);
        _death.has_burns = dataTransform(deathReason.includes(`burns`), `null_false`);
        _death.has_tuberculosis = dataTransform(deathReason.includes(`tuberculosis`), `null_false`);
        _death.has_bloody_diarrhea = dataTransform(deathReason.includes(`bloody_diarrhea`), `null_false`);
        _death.has_accidental_ingestion_caustic_products = dataTransform(deathReason.includes(`accidental_ingestion_caustic_products`), `null_false`);
        _death.has_food_poisoning = dataTransform(deathReason.includes(`food_poisoning`), `null_false`);
        _death.has_dog_bites = dataTransform(deathReason.includes(`dog_bites`), `null_false`);
        _death.has_snake_bite = dataTransform(deathReason.includes(`snake_bite`), `null_false`);
        _death.has_trauma = dataTransform(deathReason.includes(`trauma`), `null_false`);
        _death.has_domestic_violence = dataTransform(deathReason.includes(`domestic_violence`), `null_false`);
        _death.has_cholera = dataTransform(deathReason.includes(`cholera`), `null_false`);


        _death.country = fields.country_id;
        _death.region = fields.region_id;
        _death.prefecture = fields.prefecture_id;
        _death.commune = fields.commune_id;
        _death.hospital = fields.hospital_id;
        _death.district_quartier = fields.district_quartier_id;
        _death.village_secteur = fields.village_secteur_id;
        _death.family = fields.household_id;
        _death.reco = fields.user_id;
        _death.patient = fields.patient_id;
        _death.reported_date_timestamp = report.reported_date;
        _death.reported_date = reported_date;
        _death.reported_full_date = milisecond_to_date(report.reported_date, 'fulldate');
        _death.geolocation = report.geolocation;

        await _repoDeath.save(_death);
        return true;
    } catch (err: any) {
        return false;
    }
}