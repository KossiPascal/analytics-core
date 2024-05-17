import { Repository } from "typeorm";
import { milisecond_to_date } from "../../utils/date-utils";
import { PromotionalActivityData, getPromotionalActivityDataRepository } from "../../entities/_Promotional-data";
import { dataTransform } from "../../utils/functions";


export async function SyncPromotionalData(report: any, _repoPA: Repository<PromotionalActivityData> | null = null): Promise<boolean> {
    try {
        _repoPA = _repoPA ?? await getPromotionalActivityDataRepository();

        const reported_date = milisecond_to_date(report.reported_date, 'dateOnly');
        const month = (new Date(reported_date)).getMonth() + 1;
        const fields = report.fields;

        const activityDomain: string[] = fields.promotional_activity.activity_domain.split(' ');

        const _pac = new PromotionalActivityData();

        _pac.id = report._id;
        _pac.rev = report._rev;
        _pac.form = report.form;
        _pac.year = (new Date(reported_date)).getFullYear();
        _pac.month = month < 10 ? `0${month}` : `${month}`;

        _pac.activity_date = dataTransform(fields.promotional_activity.activity_date, 'string');
        _pac.activity_method = dataTransform(fields.promotional_activity.activity_method, 'string');
        _pac.is_vad_method = dataTransform(fields.is_vad_method, 'null_false');
        _pac.is_talk_method = dataTransform(fields.is_talk_method, 'null_false');
        _pac.is_interpersonal_com_method = dataTransform(fields.is_interpersonal_com_method, 'null_false');

        _pac.activity_domain = activityDomain;
        _pac.theme = dataTransform(fields.promotional_activity.theme, 'string');
        _pac.activity_location = dataTransform(fields.promotional_activity.activity_location, 'string');
        _pac.women_number = dataTransform(fields.promotional_activity.women_number, 'number');
        _pac.men_number = dataTransform(fields.promotional_activity.men_number, 'number');
        _pac.family_number = dataTransform(fields.promotional_activity.family_number, 'string');
        _pac.total_person = dataTransform(fields.promotional_activity.total_person, 'number');

        _pac.is_malaria_domain = dataTransform(activityDomain.includes(`malaria`), `null_false`)
        _pac.is_family_planning_domain = dataTransform(activityDomain.includes(`family_planning`), `null_false`)
        _pac.is_cpn_domain = dataTransform(activityDomain.includes(`cpn`), `null_false`)
        _pac.is_cpon_domain = dataTransform(activityDomain.includes(`cpon`), `null_false`)
        _pac.is_child_birth_domain = dataTransform(activityDomain.includes(`child_birth`), `null_false`)
        _pac.is_vaccination_domain = dataTransform(activityDomain.includes(`vaccination`), `null_false`)
        _pac.is_sti_hiv_domain = dataTransform(activityDomain.includes(`sti_hiv`), `null_false`)
        _pac.is_tuberculosis_domain = dataTransform(activityDomain.includes(`tuberculosis`), `null_false`)
        _pac.is_nutrition_domain = dataTransform(activityDomain.includes(`nutrition`), `null_false`)
        _pac.is_water_hygiene_sanitation_domain = dataTransform(activityDomain.includes(`water_hygiene_sanitation`), `null_false`)
        _pac.is_gbv_domain = dataTransform(activityDomain.includes(`gbv`), `null_false`)
        _pac.is_fgm_domain = dataTransform(activityDomain.includes(`fgm`), `null_false`)
        _pac.is_diarrhea_domain = dataTransform(activityDomain.includes(`diarrhea`), `null_false`)
        _pac.is_pneumonia_domain = dataTransform(activityDomain.includes(`pneumonia`), `null_false`)
        _pac.is_birth_registration_domain = dataTransform(activityDomain.includes(`birth_registration`), `null_false`)
        _pac.is_meadow_domain = dataTransform(activityDomain.includes(`meadow`), `null_false`)
        _pac.is_urine_loss_domain = dataTransform(activityDomain.includes(`urine_loss`), `null_false`)
        _pac.is_diabetes_domain = dataTransform(activityDomain.includes(`diabetes`), `null_false`)
        _pac.is_blood_pressure_domain = dataTransform(activityDomain.includes(`blood_pressure`), `null_false`)
        _pac.is_onchocerciasis_domain = dataTransform(activityDomain.includes(`onchocerciasis`), `null_false`)
        _pac.is_human_african_trypanosomiasis_domain = dataTransform(activityDomain.includes(`human_african_trypanosomiasis`), `null_false`)
        _pac.is_pfa_domain = dataTransform(activityDomain.includes(`pfa`), `null_false`)
        _pac.is_bloody_diarrhea_domain = dataTransform(activityDomain.includes(`bloody_diarrhea`), `null_false`)
        _pac.is_yellow_fever_domain = dataTransform(activityDomain.includes(`yellow_fever`), `null_false`)
        _pac.is_cholera_domain = dataTransform(activityDomain.includes(`cholera`), `null_false`)
        _pac.is_maternal_and_neonatal_tetanus_domain = dataTransform(activityDomain.includes(`maternal_and_neonatal_tetanus`), `null_false`)
        _pac.is_viral_diseases_domain = dataTransform(activityDomain.includes(`viral_diseases`), `null_false`)
        _pac.is_meningitis_domain = dataTransform(activityDomain.includes(`meningitis`), `null_false`)
        _pac.is_child_health_domain = dataTransform(activityDomain.includes(`child_health_domain`), `null_false`)
        _pac.is_other_diseases_domain = dataTransform(activityDomain.includes(`other_diseases_domain`), `null_false`)


        _pac.country = fields.country_id;
        _pac.region = fields.region_id;
        _pac.prefecture = fields.prefecture_id;
        _pac.commune = fields.commune_id;
        _pac.hospital = fields.hospital_id;
        _pac.district_quartier = fields.district_quartier_id;
        _pac.village_secteur = fields.village_secteur_id;
        _pac.reco = fields.user_id;
        _pac.reported_date_timestamp = report.reported_date;
        _pac.reported_date = reported_date;
        _pac.reported_full_date = milisecond_to_date(report.reported_date, 'fulldate');
        _pac.geolocation = report.geolocation;

        await _repoPA.save(_pac);
        return true;
    } catch (err: any) {
        return false;
    }
}