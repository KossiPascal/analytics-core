import { Repository } from "typeorm";
import { AdultData, getAdultDataRepository } from "../../entities/_Adult-data";
import { milisecond_to_date } from "../../utils/date-utils";
import { dataTransform, getSexe, notEmpty } from "../../utils/functions";


export async function SyncAdultData(report: any, _repoAdult: Repository<AdultData> | null = null): Promise<boolean> {
    try {
        _repoAdult = _repoAdult ?? await getAdultDataRepository();

        const reported_date = milisecond_to_date(report.reported_date, 'dateOnly');
        const month = (new Date(reported_date)).getMonth() + 1;
        const fields = report.fields;

        const visitMotif: string[] = notEmpty(fields.visit_motif) ? fields.visit_motif.split(' ') : [];

        const _adult = new AdultData();

        _adult.id = report._id;
        _adult.rev = report._rev;
        _adult.form = report.form;
        _adult.year = (new Date(reported_date)).getFullYear();
        _adult.month = month < 10 ? `0${month}` : `${month}`;

        _adult.sex = getSexe(fields.patient_sex);
        _adult.date_of_birth = fields.patient_date_of_birth;
        _adult.age_in_years = parseFloat(`${fields.patient_age_in_years}`);
        _adult.age_in_months = parseFloat(`${fields.patient_age_in_months}`);
        _adult.age_in_days = parseFloat(`${fields.patient_age_in_days}`);

        if (report.form === 'adult_consulation') {
            _adult.consultation_followup = 'consultation';
            _adult.promptitude = dataTransform(fields.promptitude, 'number');
            _adult.is_pregnant = dataTransform(fields.is_pregnant, 'null_false');
            _adult.has_malaria = dataTransform(fields.has_malaria, 'null_false');
            _adult.has_fever = dataTransform(fields.has_fever, 'null_false');
            _adult.has_diarrhea = dataTransform(fields.has_diarrhea, 'null_false');
            _adult.has_cough_cold = dataTransform(fields.has_cough_cold, 'null_false');
            _adult.rdt_given = dataTransform(fields.rdt_given, 'null_false');
            _adult.rdt_result = dataTransform(fields.rdt_result, 'string');
            
            _adult.is_referred = dataTransform(fields.is_referred, 'null_false');

            _adult.cta = dataTransform(fields.cta_quantity, 'number');
            _adult.amoxicillin_250mg = dataTransform(fields.amoxicillin_250mg_quantity, 'number');
            _adult.amoxicillin_500mg = dataTransform(fields.amoxicillin_500mg_quantity, 'number');
            _adult.paracetamol_250mg = dataTransform(fields.paracetamol_250mg_quantity, 'number');
            _adult.paracetamol_500mg = dataTransform(fields.paracetamol_500mg_quantity, 'number');
            _adult.mebendazole_250mg = dataTransform(fields.mebendazole_250mg_quantity, 'number');
            _adult.mebendazole_500mg = dataTransform(fields.mebendazole_500mg_quantity, 'number');
            _adult.ors_zinc = dataTransform(fields.ors_zinc_quantity, 'number');

            _adult.malaria = dataTransform(visitMotif.includes(`malaria`), 'null_false');
            _adult.fever = dataTransform(visitMotif.includes(`fever`), 'null_false');
            _adult.diarrhea = dataTransform(visitMotif.includes(`diarrhea`), 'null_false');
            _adult.yellow_fever = dataTransform(visitMotif.includes(`yellow_fever`), 'null_false');
            _adult.tetanus = dataTransform(visitMotif.includes(`tetanus`), 'null_false');
            _adult.cough_or_cold = dataTransform(visitMotif.includes(`cough_or_cold`), 'null_false');
            _adult.viral_diseases = dataTransform(visitMotif.includes(`viral_diseases`), 'null_false');
            _adult.acute_flaccid_paralysis = dataTransform(visitMotif.includes(`acute_flaccid_paralysis`), 'null_false');
            _adult.meningitis = dataTransform(visitMotif.includes(`meningitis`), 'null_false');
            _adult.miscarriage = dataTransform(visitMotif.includes(`miscarriage`), 'null_false');
            _adult.traffic_accident = dataTransform(visitMotif.includes(`traffic_accident`), 'null_false');
            _adult.burns = dataTransform(visitMotif.includes(`burns`), 'null_false');
            _adult.suspected_tb = dataTransform(visitMotif.includes(`suspected_tb`), 'null_false');
            _adult.dermatosis = dataTransform(visitMotif.includes(`dermatosis`), 'null_false');
            _adult.bloody_diarrhea = dataTransform(visitMotif.includes(`bloody_diarrhea`), 'null_false');
            _adult.urethral_discharge = dataTransform(visitMotif.includes(`urethral_discharge`), 'null_false');
            _adult.vaginal_discharge = dataTransform(visitMotif.includes(`vaginal_discharge`), 'null_false');
            _adult.loss_of_urine = dataTransform(visitMotif.includes(`loss_of_urine`), 'null_false');
            _adult.accidental_ingestion_caustic_products = dataTransform(visitMotif.includes(`accidental_ingestion_caustic_products`), 'null_false');
            _adult.food_poisoning = dataTransform(visitMotif.includes(`food_poisoning`), 'null_false');
            _adult.oral_and_dental_diseases = dataTransform(visitMotif.includes(`oral_and_dental_diseases`), 'null_false');
            _adult.dog_bites = dataTransform(visitMotif.includes(`dog_bites`), 'null_false');
            _adult.snake_bite = dataTransform(visitMotif.includes(`snake_bite`), 'null_false');
            _adult.parasitosis = dataTransform(visitMotif.includes(`parasitosis`), 'null_false');
            _adult.measles = dataTransform(visitMotif.includes(`measles`), 'null_false');
            _adult.trauma = dataTransform(visitMotif.includes(`trauma`), 'null_false');
            _adult.gender_based_violence = dataTransform(visitMotif.includes(`gender_based_violence`), 'null_false');
            _adult.vomit = dataTransform(visitMotif.includes(`vomit`), 'null_false');
            _adult.headaches = dataTransform(visitMotif.includes(`headaches`), 'null_false');
            _adult.abdominal_pain = dataTransform(visitMotif.includes(`abdominal_pain`), 'null_false');
            _adult.bleeding = dataTransform(visitMotif.includes(`bleeding`), 'null_false');
            _adult.feel_pain_injection = dataTransform(visitMotif.includes(`feel_pain_injection`), 'null_false');
            _adult.health_center_FP = dataTransform(visitMotif.includes(`health_center_FP`), 'null_false');
            _adult.cpn_done = dataTransform(visitMotif.includes(`cpn_done`), 'null_false');
            _adult.td1_done = dataTransform(visitMotif.includes(`td1_done`), 'null_false');
            _adult.td2_done = dataTransform(visitMotif.includes(`td2_done`), 'null_false');
            _adult.danger_sign = dataTransform(visitMotif.includes(`danger_sign`), 'null_false');
            _adult.fp_side_effect = dataTransform(visitMotif.includes(`fp_side_effect`), 'null_false');
            _adult.domestic_violence = dataTransform(visitMotif.includes(`domestic_violence`), 'null_false');
            _adult.afp = dataTransform(visitMotif.includes(`afp`), 'null_false');
            _adult.cholera = dataTransform(visitMotif.includes(`cholera`), 'null_false');
            _adult.other_problems = visitMotif.includes(`others`) ? dataTransform(fields.other_motif, 'string') : null;
        }

        if (report.form === 'adult_followup') {
            _adult.consultation_followup = 'followup';
            _adult.is_present = dataTransform(fields.is_present, 'null_false');
            _adult.is_pregnant = dataTransform(fields.is_pregnant, 'null_false');
            _adult.absence_reasons = dataTransform(fields.absence_reasons, 'string');
            _adult.went_to_health_center = dataTransform(fields.went_to_health_center, 'null_false');
            _adult.coupon_available = dataTransform(fields.coupon_available, 'null_false');
            _adult.coupon_number = dataTransform(fields.coupon_number, 'string');
            _adult.has_no_improvement = dataTransform(fields.has_no_improvement, 'null_false');
            _adult.has_getting_worse = dataTransform(fields.has_getting_worse, 'null_false');
            _adult.is_referred = dataTransform(fields.is_referred, 'null_false');
        }

        _adult.country = fields.country_id;
        _adult.region = fields.region_id;
        _adult.prefecture = fields.prefecture_id;
        _adult.commune = fields.commune_id;
        _adult.hospital = fields.hospital_id;
        _adult.district_quartier = fields.district_quartier_id;
        _adult.village_secteur = fields.village_secteur_id;
        _adult.family = fields.household_id;
        _adult.reco = fields.user_id;
        _adult.patient = fields.patient_id;
        _adult.reported_date_timestamp = report.reported_date;
        _adult.reported_date = reported_date;
        _adult.reported_full_date = milisecond_to_date(report.reported_date, 'fulldate');
        _adult.geolocation = report.geolocation;

        await _repoAdult.save(_adult);
        return true;
    } catch (err: any) {
        return false;
    }
}