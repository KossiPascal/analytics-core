import { MigrationInterface, QueryRunner } from "typeorm";
import { CreateViewIndex, DropViewIndexAndTable } from "../../../couch2pg/refresh-view";

export class PromotionalDataView1742932697109 implements MigrationInterface {
    

    public async up(queryRunner: QueryRunner): Promise<void> {
        await this.dropViews(queryRunner);

        await queryRunner.query(`
            CREATE MATERIALIZED VIEW IF NOT EXISTS  promotional_data_view AS 
                SELECT
                    (a.doc->>'_id')::UUID AS id,
                    (a.doc->>'_rev')::TEXT AS rev,
                    (a.doc->>'form')::TEXT AS form,

                    CASE WHEN a.doc->'fields'->'promotional_activity'->>'activity_method' IS NOT NULL AND a.doc->'fields'->'promotional_activity'->>'activity_method' <> '' 
                        THEN a.doc->'fields'->'promotional_activity'->>'activity_method'
                        ELSE NULL 
                    END::TEXT AS activity_method,

                    CASE WHEN a.doc->'fields'->>'is_vad_method' IS NOT NULL AND a.doc->'fields'->>'is_vad_method' IN ('true', 'yes', '1') 
                        THEN TRUE
                        ELSE NULL 
                    END::BOOLEAN AS is_vad_method,

                    CASE WHEN a.doc->'fields'->>'is_talk_method' IS NOT NULL AND a.doc->'fields'->>'is_talk_method' IN ('true', 'yes', '1') 
                        THEN TRUE
                        ELSE NULL 
                    END::BOOLEAN AS is_talk_method,

                    CASE WHEN a.doc->'fields'->>'is_interpersonal_com_method' IS NOT NULL AND a.doc->'fields'->>'is_interpersonal_com_method' IN ('true', 'yes', '1') 
                        THEN TRUE
                        ELSE NULL 
                    END::BOOLEAN AS is_interpersonal_talk_method,

                    CASE WHEN a.doc->'fields'->'promotional_activity'->>'activity_domain' IS NOT NULL AND a.doc->'fields'->'promotional_activity'->>'activity_domain' <> '' 
                        THEN string_to_array(a.doc->'fields'->'promotional_activity'->>'activity_domain', ' ')
                        ELSE NULL 
                    END::TEXT[] AS activity_domain,


                    CASE WHEN a.doc->'fields'->'promotional_activity'->>'theme' IS NOT NULL AND a.doc->'fields'->'promotional_activity'->>'theme' <> '' 
                        THEN a.doc->'fields'->'promotional_activity'->>'theme'
                        ELSE NULL 
                    END::TEXT AS theme,
                    CASE WHEN a.doc->'fields'->'promotional_activity'->>'activity_location' IS NOT NULL AND a.doc->'fields'->'promotional_activity'->>'activity_location' <> '' 
                        THEN a.doc->'fields'->'promotional_activity'->>'activity_location'
                        ELSE NULL 
                    END::TEXT AS activity_location,
                    CASE WHEN a.doc->'fields'->'promotional_activity'->>'family_number' IS NOT NULL AND a.doc->'fields'->'promotional_activity'->>'family_number' <> '' 
                        THEN a.doc->'fields'->'promotional_activity'->>'family_number'
                        ELSE NULL 
                    END::TEXT AS family_number,
                    CASE WHEN a.doc->'fields'->'promotional_activity'->>'women_number' IS NOT NULL 
                            AND a.doc->'fields'->'promotional_activity'->>'women_number' <> '' 
                            AND CAST(a.doc->'fields'->'promotional_activity'->>'women_number' AS BIGINT) > 0 
                                THEN CAST(a.doc->'fields'->'promotional_activity'->>'women_number' AS BIGINT)
                        ELSE NULL 
                    END::BIGINT AS women_number,
                    CASE WHEN a.doc->'fields'->'promotional_activity'->>'men_number' IS NOT NULL 
                            AND a.doc->'fields'->'promotional_activity'->>'men_number' <> '' 
                            AND CAST(a.doc->'fields'->'promotional_activity'->>'men_number' AS BIGINT) > 0 
                                THEN CAST(a.doc->'fields'->'promotional_activity'->>'men_number' AS BIGINT)
                        ELSE NULL 
                    END::BIGINT AS men_number,
                    CASE WHEN a.doc->'fields'->'promotional_activity'->>'total_person' IS NOT NULL 
                            AND a.doc->'fields'->'promotional_activity'->>'total_person' <> '' 
                            AND CAST(a.doc->'fields'->'promotional_activity'->>'total_person' AS BIGINT) > 0 
                                THEN CAST(a.doc->'fields'->'promotional_activity'->>'total_person' AS BIGINT)
                        ELSE NULL 
                    END::BIGINT AS total_person,



                    CASE WHEN a.doc->'fields'->'promotional_activity'->>'activity_domain' IS NOT NULL AND a.doc->'fields'->'promotional_activity'->>'activity_domain' <> '' 
                        AND 'maternel_childhealth' = ANY(string_to_array(a.doc->'fields'->'promotional_activity'->>'activity_domain', ' ')) 
                        THEN TRUE
                        ELSE NULL 
                    END::BOOLEAN AS is_maternel_childhealth_domain,
                    CASE WHEN a.doc->'fields'->'promotional_activity'->>'activity_domain' IS NOT NULL AND a.doc->'fields'->'promotional_activity'->>'activity_domain' <> '' 
                        AND 'education' = ANY(string_to_array(a.doc->'fields'->'promotional_activity'->>'activity_domain', ' ')) 
                        THEN TRUE 
                        ELSE NULL 
                    END::BOOLEAN AS is_education_domain,
                    CASE WHEN a.doc->'fields'->'promotional_activity'->>'activity_domain' IS NOT NULL AND a.doc->'fields'->'promotional_activity'->>'activity_domain' <> '' 
                        AND 'gbv' = ANY(string_to_array(a.doc->'fields'->'promotional_activity'->>'activity_domain', ' ')) 
                        THEN TRUE
                        ELSE NULL 
                    END::BOOLEAN AS is_gbv_domain,
                    CASE WHEN a.doc->'fields'->'promotional_activity'->>'activity_domain' IS NOT NULL AND a.doc->'fields'->'promotional_activity'->>'activity_domain' <> '' 
                        AND 'nutrition' = ANY(string_to_array(a.doc->'fields'->'promotional_activity'->>'activity_domain', ' ')) 
                        THEN TRUE
                        ELSE NULL 
                    END::BOOLEAN AS is_nutrition_domain,
                    CASE WHEN a.doc->'fields'->'promotional_activity'->>'activity_domain' IS NOT NULL AND a.doc->'fields'->'promotional_activity'->>'activity_domain' <> '' 
                        AND 'water_hygiene' = ANY(string_to_array(a.doc->'fields'->'promotional_activity'->>'activity_domain', ' ')) 
                        THEN TRUE
                        ELSE NULL 
                    END::BOOLEAN AS is_water_hygiene_domain,
                    CASE WHEN a.doc->'fields'->'promotional_activity'->>'activity_domain' IS NOT NULL AND a.doc->'fields'->'promotional_activity'->>'activity_domain' <> '' 
                        AND 'ist_vih' = ANY(string_to_array(a.doc->'fields'->'promotional_activity'->>'activity_domain', ' ')) 
                        THEN TRUE
                        ELSE NULL 
                    END::BOOLEAN AS is_ist_vih_domain,
                    CASE WHEN a.doc->'fields'->'promotional_activity'->>'activity_domain' IS NOT NULL AND a.doc->'fields'->'promotional_activity'->>'activity_domain' <> '' 
                        AND 'disease_control' = ANY(string_to_array(a.doc->'fields'->'promotional_activity'->>'activity_domain', ' ')) 
                        THEN TRUE
                        ELSE NULL 
                    END::BOOLEAN AS is_disease_control_domain,
                    CASE WHEN a.doc->'fields'->'promotional_activity'->>'activity_domain' IS NOT NULL AND a.doc->'fields'->'promotional_activity'->>'activity_domain' <> '' 
                        AND 'others' = ANY(string_to_array(a.doc->'fields'->'promotional_activity'->>'activity_domain', ' ')) 
                        THEN TRUE
                        ELSE NULL 
                    END::BOOLEAN AS is_others_domain,

                    CASE WHEN a.doc->'fields'->'promotional_activity'->>'other_activity_domain' IS NOT NULL AND a.doc->'fields'->'promotional_activity'->>'other_activity_domain' <> '' 
                        THEN a.doc->'fields'->'promotional_activity'->>'other_activity_domain'
                        ELSE NULL 
                    END::TEXT AS other_domain,


                    
                    CASE WHEN a.doc->'fields'->'promotional_activity'->>'theme' IS NOT NULL AND a.doc->'fields'->'promotional_activity'->>'theme' <> '' 
                        AND 'prenatal_consultation' = ANY(string_to_array(a.doc->'fields'->'promotional_activity'->>'theme', ' ')) 
                        THEN TRUE
                        ELSE NULL 
                    END::BOOLEAN AS is_prenatal_consultation_theme,
                    CASE WHEN a.doc->'fields'->'promotional_activity'->>'theme' IS NOT NULL AND a.doc->'fields'->'promotional_activity'->>'theme' <> '' 
                        AND 'birth_attended' = ANY(string_to_array(a.doc->'fields'->'promotional_activity'->>'theme', ' ')) 
                        THEN TRUE
                        ELSE NULL 
                    END::BOOLEAN AS is_birth_attended_theme,
                    CASE WHEN a.doc->'fields'->'promotional_activity'->>'theme' IS NOT NULL AND a.doc->'fields'->'promotional_activity'->>'theme' <> '' 
                        AND 'delivery' = ANY(string_to_array(a.doc->'fields'->'promotional_activity'->>'theme', ' ')) 
                        THEN TRUE
                        ELSE NULL 
                    END::BOOLEAN AS is_delivery_theme,
                    CASE WHEN a.doc->'fields'->'promotional_activity'->>'theme' IS NOT NULL AND a.doc->'fields'->'promotional_activity'->>'theme' <> '' 
                        AND 'birth_registration' = ANY(string_to_array(a.doc->'fields'->'promotional_activity'->>'theme', ' ')) 
                        THEN TRUE
                        ELSE NULL 
                    END::BOOLEAN AS is_birth_registration_theme,
                    CASE WHEN a.doc->'fields'->'promotional_activity'->>'theme' IS NOT NULL AND a.doc->'fields'->'promotional_activity'->>'theme' <> '' 
                        AND 'post_natal' = ANY(string_to_array(a.doc->'fields'->'promotional_activity'->>'theme', ' ')) 
                        THEN TRUE
                        ELSE NULL 
                    END::BOOLEAN AS is_post_natal_theme,
                    CASE WHEN a.doc->'fields'->'promotional_activity'->>'theme' IS NOT NULL AND a.doc->'fields'->'promotional_activity'->>'theme' <> '' 
                        AND 'post_abortion' = ANY(string_to_array(a.doc->'fields'->'promotional_activity'->>'theme', ' ')) 
                        THEN TRUE
                        ELSE NULL 
                    END::BOOLEAN AS is_post_abortion_theme,
                    CASE WHEN a.doc->'fields'->'promotional_activity'->>'theme' IS NOT NULL AND a.doc->'fields'->'promotional_activity'->>'theme' <> '' 
                        AND 'obstetric_fistula' = ANY(string_to_array(a.doc->'fields'->'promotional_activity'->>'theme', ' ')) 
                        THEN TRUE
                        ELSE NULL 
                    END::BOOLEAN AS is_obstetric_fistula_theme,
                    CASE WHEN a.doc->'fields'->'promotional_activity'->>'theme' IS NOT NULL AND a.doc->'fields'->'promotional_activity'->>'theme' <> '' 
                        AND 'family_planning' = ANY(string_to_array(a.doc->'fields'->'promotional_activity'->>'theme', ' ')) 
                        THEN TRUE
                        ELSE NULL 
                    END::BOOLEAN AS is_family_planning_theme,
                    CASE WHEN a.doc->'fields'->'promotional_activity'->>'theme' IS NOT NULL AND a.doc->'fields'->'promotional_activity'->>'theme' <> '' 
                        AND 'oral_contraceptive' = ANY(string_to_array(a.doc->'fields'->'promotional_activity'->>'theme', ' ')) 
                        THEN TRUE
                        ELSE NULL 
                    END::BOOLEAN AS is_oral_contraceptive_theme,
                    CASE WHEN a.doc->'fields'->'promotional_activity'->>'theme' IS NOT NULL AND a.doc->'fields'->'promotional_activity'->>'theme' <> '' 
                        AND 'vaccination' = ANY(string_to_array(a.doc->'fields'->'promotional_activity'->>'theme', ' ')) 
                        THEN TRUE
                        ELSE NULL 
                    END::BOOLEAN AS is_vaccination_theme,
                    CASE WHEN a.doc->'fields'->'promotional_activity'->>'theme' IS NOT NULL AND a.doc->'fields'->'promotional_activity'->>'theme' <> '' 
                        AND 'newborn_care_home' = ANY(string_to_array(a.doc->'fields'->'promotional_activity'->>'theme', ' ')) 
                        THEN TRUE
                        ELSE NULL 
                    END::BOOLEAN AS is_newborn_care_home_theme,
                    CASE WHEN a.doc->'fields'->'promotional_activity'->>'theme' IS NOT NULL AND a.doc->'fields'->'promotional_activity'->>'theme' <> '' 
                        AND 'care_home_illness_case' = ANY(string_to_array(a.doc->'fields'->'promotional_activity'->>'theme', ' ')) 
                        THEN TRUE
                        ELSE NULL 
                    END::BOOLEAN AS is_care_home_illness_case_theme,
                    CASE WHEN a.doc->'fields'->'promotional_activity'->>'theme' IS NOT NULL AND a.doc->'fields'->'promotional_activity'->>'theme' <> '' 
                        AND 'child_development_care' = ANY(string_to_array(a.doc->'fields'->'promotional_activity'->>'theme', ' ')) 
                        THEN TRUE
                        ELSE NULL 
                    END::BOOLEAN AS is_child_development_care_theme,
                    CASE WHEN a.doc->'fields'->'promotional_activity'->>'theme' IS NOT NULL AND a.doc->'fields'->'promotional_activity'->>'theme' <> '' 
                        AND 'advice_for_child_development' = ANY(string_to_array(a.doc->'fields'->'promotional_activity'->>'theme', ' ')) 
                        THEN TRUE
                        ELSE NULL 
                    END::BOOLEAN AS is_advice_for_child_development_theme,
                    CASE WHEN a.doc->'fields'->'promotional_activity'->>'theme' IS NOT NULL AND a.doc->'fields'->'promotional_activity'->>'theme' <> '' 
                        AND 'child_abuse' = ANY(string_to_array(a.doc->'fields'->'promotional_activity'->>'theme', ' ')) 
                        THEN TRUE
                        ELSE NULL 
                    END::BOOLEAN AS is_child_abuse_theme,
                    CASE WHEN a.doc->'fields'->'promotional_activity'->>'theme' IS NOT NULL AND a.doc->'fields'->'promotional_activity'->>'theme' <> '' 
                        AND 'female_genital_mutilation' = ANY(string_to_array(a.doc->'fields'->'promotional_activity'->>'theme', ' ')) 
                        THEN TRUE
                        ELSE NULL 
                    END::BOOLEAN AS is_female_genital_mutilation_theme,
                    CASE WHEN a.doc->'fields'->'promotional_activity'->>'theme' IS NOT NULL AND a.doc->'fields'->'promotional_activity'->>'theme' <> '' 
                        AND 'exclusive_breastfeeding' = ANY(string_to_array(a.doc->'fields'->'promotional_activity'->>'theme', ' ')) 
                        THEN TRUE
                        ELSE NULL 
                    END::BOOLEAN AS is_exclusive_breastfeeding_theme,
                    CASE WHEN a.doc->'fields'->'promotional_activity'->>'theme' IS NOT NULL AND a.doc->'fields'->'promotional_activity'->>'theme' <> '' 
                        AND 'vitamin_a_supp' = ANY(string_to_array(a.doc->'fields'->'promotional_activity'->>'theme', ' ')) 
                        THEN TRUE
                        ELSE NULL 
                    END::BOOLEAN AS is_vitamin_a_supp_theme,
                    CASE WHEN a.doc->'fields'->'promotional_activity'->>'theme' IS NOT NULL AND a.doc->'fields'->'promotional_activity'->>'theme' <> '' 
                        AND 'suppl_feeding' = ANY(string_to_array(a.doc->'fields'->'promotional_activity'->>'theme', ' ')) 
                        THEN TRUE
                        ELSE NULL 
                    END::BOOLEAN AS is_suppl_feeding_theme,
                    CASE WHEN a.doc->'fields'->'promotional_activity'->>'theme' IS NOT NULL AND a.doc->'fields'->'promotional_activity'->>'theme' <> '' 
                        AND 'malnutrition' = ANY(string_to_array(a.doc->'fields'->'promotional_activity'->>'theme', ' ')) 
                        THEN TRUE
                        ELSE NULL 
                    END::BOOLEAN AS is_malnutrition_theme,
                    CASE WHEN a.doc->'fields'->'promotional_activity'->>'theme' IS NOT NULL AND a.doc->'fields'->'promotional_activity'->>'theme' <> '' 
                        AND 'combating_iodine' = ANY(string_to_array(a.doc->'fields'->'promotional_activity'->>'theme', ' ')) 
                        THEN TRUE
                        ELSE NULL 
                    END::BOOLEAN AS is_combating_iodine_theme,
                    CASE WHEN a.doc->'fields'->'promotional_activity'->>'theme' IS NOT NULL AND a.doc->'fields'->'promotional_activity'->>'theme' <> '' 
                        AND 'hand_washing' = ANY(string_to_array(a.doc->'fields'->'promotional_activity'->>'theme', ' ')) 
                        THEN TRUE
                        ELSE NULL 
                    END::BOOLEAN AS is_hand_washing_theme,
                    CASE WHEN a.doc->'fields'->'promotional_activity'->>'theme' IS NOT NULL AND a.doc->'fields'->'promotional_activity'->>'theme' <> '' 
                        AND 'community_led' = ANY(string_to_array(a.doc->'fields'->'promotional_activity'->>'theme', ' ')) 
                        THEN TRUE
                        ELSE NULL 
                    END::BOOLEAN AS is_community_led_theme,
                    CASE WHEN a.doc->'fields'->'promotional_activity'->>'theme' IS NOT NULL AND a.doc->'fields'->'promotional_activity'->>'theme' <> '' 
                        AND 'tuberculosis' = ANY(string_to_array(a.doc->'fields'->'promotional_activity'->>'theme', ' ')) 
                        THEN TRUE
                        ELSE NULL 
                    END::BOOLEAN AS is_tuberculosis_theme,
                    CASE WHEN a.doc->'fields'->'promotional_activity'->>'theme' IS NOT NULL AND a.doc->'fields'->'promotional_activity'->>'theme' <> '' 
                        AND 'leprosy' = ANY(string_to_array(a.doc->'fields'->'promotional_activity'->>'theme', ' ')) 
                        THEN TRUE
                        ELSE NULL 
                    END::BOOLEAN AS is_leprosy_theme,
                    CASE WHEN a.doc->'fields'->'promotional_activity'->>'theme' IS NOT NULL AND a.doc->'fields'->'promotional_activity'->>'theme' <> '' 
                        AND 'buruli_ulcer' = ANY(string_to_array(a.doc->'fields'->'promotional_activity'->>'theme', ' ')) 
                        THEN TRUE
                        ELSE NULL 
                    END::BOOLEAN AS is_buruli_ulcer_theme,
                    CASE WHEN a.doc->'fields'->'promotional_activity'->>'theme' IS NOT NULL AND a.doc->'fields'->'promotional_activity'->>'theme' <> '' 
                        AND 'onchocerciasis' = ANY(string_to_array(a.doc->'fields'->'promotional_activity'->>'theme', ' ')) 
                        THEN TRUE
                        ELSE NULL 
                    END::BOOLEAN AS is_onchocerciasis_theme,
                    CASE WHEN a.doc->'fields'->'promotional_activity'->>'theme' IS NOT NULL AND a.doc->'fields'->'promotional_activity'->>'theme' <> '' 
                        AND 'bilharzia' = ANY(string_to_array(a.doc->'fields'->'promotional_activity'->>'theme', ' ')) 
                        THEN TRUE
                        ELSE NULL 
                    END::BOOLEAN AS is_bilharzia_theme,
                    CASE WHEN a.doc->'fields'->'promotional_activity'->>'theme' IS NOT NULL AND a.doc->'fields'->'promotional_activity'->>'theme' <> '' 
                        AND 'mass_deworming' = ANY(string_to_array(a.doc->'fields'->'promotional_activity'->>'theme', ' ')) 
                        THEN TRUE
                        ELSE NULL 
                    END::BOOLEAN AS is_mass_deworming_theme,
                    CASE WHEN a.doc->'fields'->'promotional_activity'->>'theme' IS NOT NULL AND a.doc->'fields'->'promotional_activity'->>'theme' <> '' 
                        AND 'human_african_trypanosomiasis' = ANY(string_to_array(a.doc->'fields'->'promotional_activity'->>'theme', ' ')) 
                        THEN TRUE
                        ELSE NULL 
                    END::BOOLEAN AS is_human_african_trypanosomiasis_theme,
                    CASE WHEN a.doc->'fields'->'promotional_activity'->>'theme' IS NOT NULL AND a.doc->'fields'->'promotional_activity'->>'theme' <> '' 
                        AND 'lymphatic' = ANY(string_to_array(a.doc->'fields'->'promotional_activity'->>'theme', ' ')) 
                        THEN TRUE
                        ELSE NULL 
                    END::BOOLEAN AS is_lymphatic_theme,
                    CASE WHEN a.doc->'fields'->'promotional_activity'->>'theme' IS NOT NULL AND a.doc->'fields'->'promotional_activity'->>'theme' <> '' 
                        AND 'trachoma' = ANY(string_to_array(a.doc->'fields'->'promotional_activity'->>'theme', ' ')) 
                        THEN TRUE
                        ELSE NULL 
                    END::BOOLEAN AS is_trachoma_theme,
                    CASE WHEN a.doc->'fields'->'promotional_activity'->>'theme' IS NOT NULL AND a.doc->'fields'->'promotional_activity'->>'theme' <> '' 
                        AND 'sti_and_hepatitis' = ANY(string_to_array(a.doc->'fields'->'promotional_activity'->>'theme', ' ')) 
                        THEN TRUE
                        ELSE NULL 
                    END::BOOLEAN AS is_sti_and_hepatitis_theme,
                    CASE WHEN a.doc->'fields'->'promotional_activity'->>'theme' IS NOT NULL AND a.doc->'fields'->'promotional_activity'->>'theme' <> '' 
                        AND 'hypertension' = ANY(string_to_array(a.doc->'fields'->'promotional_activity'->>'theme', ' ')) 
                        THEN TRUE
                        ELSE NULL 
                    END::BOOLEAN AS is_hypertension_theme,
                    CASE WHEN a.doc->'fields'->'promotional_activity'->>'theme' IS NOT NULL AND a.doc->'fields'->'promotional_activity'->>'theme' <> '' 
                        AND 'diabetes' = ANY(string_to_array(a.doc->'fields'->'promotional_activity'->>'theme', ' ')) 
                        THEN TRUE
                        ELSE NULL 
                    END::BOOLEAN AS is_diabetes_theme,
                    CASE WHEN a.doc->'fields'->'promotional_activity'->>'theme' IS NOT NULL AND a.doc->'fields'->'promotional_activity'->>'theme' <> '' 
                        AND 'cancers' = ANY(string_to_array(a.doc->'fields'->'promotional_activity'->>'theme', ' ')) 
                        THEN TRUE
                        ELSE NULL 
                    END::BOOLEAN AS is_cancers_theme,
                    CASE WHEN a.doc->'fields'->'promotional_activity'->>'theme' IS NOT NULL AND a.doc->'fields'->'promotional_activity'->>'theme' <> '' 
                        AND 'sickle_cell_disease' = ANY(string_to_array(a.doc->'fields'->'promotional_activity'->>'theme', ' ')) 
                        THEN TRUE
                        ELSE NULL 
                    END::BOOLEAN AS is_sickle_cell_disease_theme,
                    CASE WHEN a.doc->'fields'->'promotional_activity'->>'theme' IS NOT NULL AND a.doc->'fields'->'promotional_activity'->>'theme' <> '' 
                        AND 'malaria' = ANY(string_to_array(a.doc->'fields'->'promotional_activity'->>'theme', ' ')) 
                        THEN TRUE
                        ELSE NULL 
                    END::BOOLEAN AS is_malaria_theme,
                    CASE WHEN a.doc->'fields'->'promotional_activity'->>'theme' IS NOT NULL AND a.doc->'fields'->'promotional_activity'->>'theme' <> '' 
                        AND 'diarrhea' = ANY(string_to_array(a.doc->'fields'->'promotional_activity'->>'theme', ' ')) 
                        THEN TRUE
                        ELSE NULL 
                    END::BOOLEAN AS is_diarrhea_theme,
                    CASE WHEN a.doc->'fields'->'promotional_activity'->>'theme' IS NOT NULL AND a.doc->'fields'->'promotional_activity'->>'theme' <> '' 
                        AND 'bloody_diarrhea' = ANY(string_to_array(a.doc->'fields'->'promotional_activity'->>'theme', ' ')) 
                        THEN TRUE
                        ELSE NULL 
                    END::BOOLEAN AS is_bloody_diarrhea_theme,
                    CASE WHEN a.doc->'fields'->'promotional_activity'->>'theme' IS NOT NULL AND a.doc->'fields'->'promotional_activity'->>'theme' <> '' 
                        AND 'pneumonia' = ANY(string_to_array(a.doc->'fields'->'promotional_activity'->>'theme', ' ')) 
                        THEN TRUE
                        ELSE NULL 
                    END::BOOLEAN AS is_pneumonia_theme,
                    CASE WHEN a.doc->'fields'->'promotional_activity'->>'theme' IS NOT NULL AND a.doc->'fields'->'promotional_activity'->>'theme' <> '' 
                        AND 'yellow_fever' = ANY(string_to_array(a.doc->'fields'->'promotional_activity'->>'theme', ' ')) 
                        THEN TRUE
                        ELSE NULL 
                    END::BOOLEAN AS is_yellow_fever_theme,
                    CASE WHEN a.doc->'fields'->'promotional_activity'->>'theme' IS NOT NULL AND a.doc->'fields'->'promotional_activity'->>'theme' <> '' 
                        AND 'cholera' = ANY(string_to_array(a.doc->'fields'->'promotional_activity'->>'theme', ' ')) 
                        THEN TRUE
                        ELSE NULL 
                    END::BOOLEAN AS is_cholera_theme,
                    CASE WHEN a.doc->'fields'->'promotional_activity'->>'theme' IS NOT NULL AND a.doc->'fields'->'promotional_activity'->>'theme' <> '' 
                        AND 'tetanus' = ANY(string_to_array(a.doc->'fields'->'promotional_activity'->>'theme', ' ')) 
                        THEN TRUE
                        ELSE NULL 
                    END::BOOLEAN AS is_tetanus_theme,
                    CASE WHEN a.doc->'fields'->'promotional_activity'->>'theme' IS NOT NULL AND a.doc->'fields'->'promotional_activity'->>'theme' <> '' 
                        AND 'viral_diseases' = ANY(string_to_array(a.doc->'fields'->'promotional_activity'->>'theme', ' ')) 
                        THEN TRUE
                        ELSE NULL 
                    END::BOOLEAN AS is_viral_diseases_theme,
                    CASE WHEN a.doc->'fields'->'promotional_activity'->>'theme' IS NOT NULL AND a.doc->'fields'->'promotional_activity'->>'theme' <> '' 
                        AND 'meningitis' = ANY(string_to_array(a.doc->'fields'->'promotional_activity'->>'theme', ' ')) 
                        THEN TRUE
                        ELSE NULL 
                    END::BOOLEAN AS is_meningitis_theme,
                    CASE WHEN a.doc->'fields'->'promotional_activity'->>'theme' IS NOT NULL AND a.doc->'fields'->'promotional_activity'->>'theme' <> '' 
                        AND 'pfa' = ANY(string_to_array(a.doc->'fields'->'promotional_activity'->>'theme', ' ')) 
                        THEN TRUE
                        ELSE NULL 
                    END::BOOLEAN AS is_pfa_theme,
                    CASE WHEN a.doc->'fields'->'promotional_activity'->>'theme' IS NOT NULL AND a.doc->'fields'->'promotional_activity'->>'theme' <> '' 
                        AND 'urine_loss' = ANY(string_to_array(a.doc->'fields'->'promotional_activity'->>'theme', ' ')) 
                        THEN TRUE
                        ELSE NULL 
                    END::BOOLEAN AS is_urine_loss_theme,
                    CASE WHEN a.doc->'fields'->'promotional_activity'->>'theme' IS NOT NULL AND a.doc->'fields'->'promotional_activity'->>'theme' <> '' 
                        AND 'blood_pressure' = ANY(string_to_array(a.doc->'fields'->'promotional_activity'->>'theme', ' ')) 
                        THEN TRUE
                        ELSE NULL 
                    END::BOOLEAN AS is_blood_pressure_theme,
                    CASE WHEN a.doc->'fields'->'promotional_activity'->>'theme' IS NOT NULL AND a.doc->'fields'->'promotional_activity'->>'theme' <> '' 
                        AND 'hiv' = ANY(string_to_array(a.doc->'fields'->'promotional_activity'->>'theme', ' ')) 
                        THEN TRUE
                        ELSE NULL 
                    END::BOOLEAN AS is_hiv_theme,
                    CASE WHEN a.doc->'fields'->'promotional_activity'->>'theme' IS NOT NULL AND a.doc->'fields'->'promotional_activity'->>'theme' <> '' 
                        AND 'ist' = ANY(string_to_array(a.doc->'fields'->'promotional_activity'->>'theme', ' ')) 
                        THEN TRUE
                        ELSE NULL 
                    END::BOOLEAN AS is_ist_theme,
                    CASE WHEN a.doc->'fields'->'promotional_activity'->>'other_theme' IS NOT NULL AND a.doc->'fields'->'promotional_activity'->>'other_theme' <> '' 
                        THEN TRUE
                        ELSE NULL 
                    END::BOOLEAN AS is_other_theme,

                    CASE WHEN a.doc->'fields'->'promotional_activity'->>'other_theme' IS NOT NULL AND a.doc->'fields'->'promotional_activity'->>'other_theme' <> '' 
                        THEN a.doc->'fields'->'promotional_activity'->>'other_theme'
                        ELSE NULL 
                    END::TEXT AS other_theme,

                    
                    -- Location and report info
                    CASE WHEN a.doc->'fields'->>'country_id' IS NOT NULL AND a.doc->'fields'->>'country_id' <> '' 
                        THEN a.doc->'fields'->>'country_id' 
                        ELSE NULL 
                    END::UUID AS country_id,
                    CASE WHEN a.doc->'fields'->>'region_id' IS NOT NULL AND a.doc->'fields'->>'region_id' <> '' 
                        THEN a.doc->'fields'->>'region_id' 
                        ELSE NULL 
                    END::UUID AS region_id,
                    CASE WHEN a.doc->'fields'->>'prefecture_id' IS NOT NULL AND a.doc->'fields'->>'prefecture_id' <> '' 
                        THEN a.doc->'fields'->>'prefecture_id' 
                        ELSE NULL 
                    END::UUID AS prefecture_id,
                    CASE WHEN a.doc->'fields'->>'commune_id' IS NOT NULL AND a.doc->'fields'->>'commune_id' <> '' 
                        THEN a.doc->'fields'->>'commune_id' 
                        ELSE NULL 
                    END::UUID AS commune_id,
                    CASE WHEN a.doc->'fields'->>'hospital_id' IS NOT NULL AND a.doc->'fields'->>'hospital_id' <> '' 
                        THEN a.doc->'fields'->>'hospital_id' 
                        ELSE NULL 
                    END::UUID AS hospital_id,
                    CASE WHEN a.doc->'fields'->>'district_quartier_id' IS NOT NULL AND a.doc->'fields'->>'district_quartier_id' <> '' 
                        THEN a.doc->'fields'->>'district_quartier_id' 
                        ELSE NULL 
                    END::UUID AS district_quartier_id,
                    CASE WHEN a.doc->'fields'->>'village_secteur_id' IS NOT NULL AND a.doc->'fields'->>'village_secteur_id' <> '' 
                        THEN a.doc->'fields'->>'village_secteur_id' 
                        ELSE NULL 
                    END::UUID AS village_secteur_id,
                    CASE WHEN a.doc->>'form' IN ('pa_home_visit', 'pa_individual_talk')
                         AND a.doc->'fields'->>'household_id' IS NOT NULL AND a.doc->'fields'->>'household_id' <> '' 
                            THEN a.doc->'fields'->>'household_id' 
                        ELSE NULL 
                    END::UUID AS family_id,
                    CASE WHEN a.doc->'fields'->>'user_id' IS NOT NULL AND a.doc->'fields'->>'user_id' <> '' 
                        THEN a.doc->'fields'->>'user_id' 
                        ELSE NULL 
                    END::UUID AS reco_id,
                    CASE WHEN a.doc->>'form' = 'pa_individual_talk' 
                        AND a.doc->'fields'->>'patient_id' IS NOT NULL AND a.doc->'fields'->>'patient_id' <> '' 
                        THEN a.doc->'fields'->>'patient_id' 
                        ELSE NULL 
                    END::UUID AS patient_id,

                    CASE WHEN a.doc->'fields'->'promotional_activity'->>'activity_date' IS NOT NULL 
                        AND a.doc->'fields'->'promotional_activity'->>'activity_date' <> '' 
                            THEN TO_CHAR(TO_TIMESTAMP(a.doc->'fields'->'promotional_activity'->>'activity_date', 'YYYY-MM-DD'), 'YYYY-MM-DD') 
                        ELSE NULL 
                    END::DATE AS reported_date,

                    CASE WHEN a.doc->'fields'->'promotional_activity'->>'activity_date' IS NOT NULL 
                        AND a.doc->'fields'->'promotional_activity'->>'activity_date' <> '' 
                            THEN TO_CHAR(TO_TIMESTAMP(a.doc->'fields'->'promotional_activity'->>'activity_date', 'YYYY-MM-DD HH24:MI:SS'), 'YYYY-MM-DD HH24:MI:SS') 
                        ELSE NULL 
                    END::TIMESTAMP AS reported_full_date,

                    CASE WHEN a.doc->'fields'->'promotional_activity'->>'activity_date' IS NOT NULL 
                        AND a.doc->'fields'->'promotional_activity'->>'activity_date' <> '' 
                            THEN EXTRACT(EPOCH FROM TO_DATE(a.doc->'fields'->'promotional_activity'->>'activity_date', 'YYYY-MM-DD'))
                        ELSE NULL 
                    END::BIGINT AS reported_date_timestamp,

                    CASE WHEN a.doc->'fields'->'promotional_activity'->>'activity_date' IS NOT NULL 
                        AND a.doc->'fields'->'promotional_activity'->>'activity_date' <> '' 
                            THEN EXTRACT(YEAR FROM TO_TIMESTAMP(a.doc->'fields'->'promotional_activity'->>'activity_date', 'YYYY-MM-DD HH24:MI:SS')) 
                        ELSE NULL 
                    END::BIGINT AS year,

                    CASE WHEN a.doc->'fields'->'promotional_activity'->>'activity_date' IS NOT NULL 
                        AND a.doc->'fields'->'promotional_activity'->>'activity_date' <> '' 
                            THEN LPAD(EXTRACT(MONTH FROM TO_TIMESTAMP(a.doc->'fields'->'promotional_activity'->>'activity_date', 'YYYY-MM-DD HH24:MI:SS'))::TEXT, 2, '0') 
                        ELSE NULL 
                    END::TEXT AS month,

                    CASE WHEN a.doc->>'geolocation' IS NULL OR a.doc->>'geolocation' = '' THEN NULL
                        WHEN jsonb_typeof(a.doc->'geolocation') IS NOT NULL THEN (a.doc->'geolocation')::JSONB
                        ELSE NULL
                    END AS geolocation 
                FROM 
                    couchdb a
                WHERE
                    a.doc->>'form' IS NOT NULL
                    AND a.doc->'fields' IS NOT NULL 
                    AND a.doc->>'form' IN ('promotional_activity', 'pa_educational_talk', 'pa_home_visit', 'pa_individual_talk');     
            `);               
        await CreateViewIndex('promotional_data_view', queryRunner);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await this.dropViews(queryRunner);
    }

    private async dropViews(queryRunner: QueryRunner): Promise<void> {
        await DropViewIndexAndTable('promotional_data_view', queryRunner);
    }

}
