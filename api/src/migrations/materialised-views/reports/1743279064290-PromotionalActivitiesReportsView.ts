import { MigrationInterface, QueryRunner } from "typeorm";
import { CreateViewIndex, DropViewIndexAndTable } from "../../../couch2pg/refresh-view";

export class PromotionalActivitiesReportsView1743279064290 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await this.dropViews(queryRunner);

        await queryRunner.query(`
            CREATE MATERIALIZED VIEW IF NOT EXISTS  reports_promotional_view AS
                SELECT 
                    CONCAT(a.month, '-', a.year, '-', a.reco_id) AS id,
                    a.month AS month,
                    a.year AS year,
                    a.reco_id AS reco_id,

                    jsonb_build_object(
                        'label', 'sante mère/nouveau-né/enfant',
                        'vad', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_maternel_childhealth_domain IS TRUE AND a.is_vad_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_maternel_childhealth_domain IS TRUE AND a.is_vad_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        ),
                        'talk', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_maternel_childhealth_domain IS TRUE AND a.is_talk_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_maternel_childhealth_domain IS TRUE AND a.is_talk_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        ),
                        'personal', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_maternel_childhealth_domain IS TRUE AND a.is_interpersonal_talk_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_maternel_childhealth_domain IS TRUE AND a.is_interpersonal_talk_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        )
                    ) AS maternel_childhealth_domain,
                    jsonb_build_object(
                        'label', 'Education',
                        'vad', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_education_domain IS TRUE AND a.is_vad_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_education_domain IS TRUE AND a.is_vad_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        ),
                        'talk', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_education_domain IS TRUE AND a.is_talk_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_education_domain IS TRUE AND a.is_talk_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        ),
                        'personal', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_education_domain IS TRUE AND a.is_interpersonal_talk_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_education_domain IS TRUE AND a.is_interpersonal_talk_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        )
                    ) AS education_domain,
                    jsonb_build_object(
                        'label', 'Violences basées sur le genre',
                        'vad', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_gbv_domain IS TRUE AND a.is_vad_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_gbv_domain IS TRUE AND a.is_vad_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        ),
                        'talk', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_gbv_domain IS TRUE AND a.is_talk_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_gbv_domain IS TRUE AND a.is_talk_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        ),
                        'personal', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_gbv_domain IS TRUE AND a.is_interpersonal_talk_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_gbv_domain IS TRUE AND a.is_interpersonal_talk_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        )
                    ) AS gbv_domain,
                    jsonb_build_object(
                        'label', 'Nutrition',
                        'vad', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_nutrition_domain IS TRUE AND a.is_vad_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_nutrition_domain IS TRUE AND a.is_vad_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        ),
                        'talk', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_nutrition_domain IS TRUE AND a.is_talk_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_nutrition_domain IS TRUE AND a.is_talk_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        ),
                        'personal', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_nutrition_domain IS TRUE AND a.is_interpersonal_talk_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_nutrition_domain IS TRUE AND a.is_interpersonal_talk_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        )
                    ) AS nutrition_domain,
                    jsonb_build_object(
                        'label', 'Eau-hygiène et assainissemen',
                        'vad', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_water_hygiene_domain IS TRUE AND a.is_vad_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_water_hygiene_domain IS TRUE AND a.is_vad_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        ),
                        'talk', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_water_hygiene_domain IS TRUE AND a.is_talk_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_water_hygiene_domain IS TRUE AND a.is_talk_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        ),
                        'personal', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_water_hygiene_domain IS TRUE AND a.is_interpersonal_talk_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_water_hygiene_domain IS TRUE AND a.is_interpersonal_talk_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        )
                    ) AS water_hygiene_domain,
                    jsonb_build_object(
                        'label', 'Lutte contre la maladie',
                        'vad', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_ist_vih_domain IS TRUE AND a.is_vad_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_ist_vih_domain IS TRUE AND a.is_vad_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        ),
                        'talk', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_ist_vih_domain IS TRUE AND a.is_talk_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_ist_vih_domain IS TRUE AND a.is_talk_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        ),
                        'personal', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_ist_vih_domain IS TRUE AND a.is_interpersonal_talk_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_ist_vih_domain IS TRUE AND a.is_interpersonal_talk_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        )
                    ) AS ist_vih_domain,
                    jsonb_build_object(
                        'label', 'Lutte contre la maladie',
                        'vad', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_disease_control_domain IS TRUE AND a.is_vad_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_disease_control_domain IS TRUE AND a.is_vad_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        ),
                        'talk', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_disease_control_domain IS TRUE AND a.is_talk_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_disease_control_domain IS TRUE AND a.is_talk_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        ),
                        'personal', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_disease_control_domain IS TRUE AND a.is_interpersonal_talk_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_disease_control_domain IS TRUE AND a.is_interpersonal_talk_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        )
                    ) AS disease_control_domain,
                    jsonb_build_object(
                        'label', 'Autre Domaine',
                        'vad', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_others_domain IS TRUE AND a.is_vad_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_others_domain IS TRUE AND a.is_vad_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        ),
                        'talk', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_others_domain IS TRUE AND a.is_talk_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_others_domain IS TRUE AND a.is_talk_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        ),
                        'personal', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_others_domain IS TRUE AND a.is_interpersonal_talk_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_others_domain IS TRUE AND a.is_interpersonal_talk_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        )
                    ) AS others_domain,




                    jsonb_build_object(
                        'label', 'Consultation prénatale',
                        'vad', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_prenatal_consultation_theme IS TRUE AND a.is_vad_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_prenatal_consultation_theme IS TRUE AND a.is_vad_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        ),
                        'talk', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_prenatal_consultation_theme IS TRUE AND a.is_talk_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_prenatal_consultation_theme IS TRUE AND a.is_talk_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        ),
                        'personal', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_prenatal_consultation_theme IS TRUE AND a.is_interpersonal_talk_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_prenatal_consultation_theme IS TRUE AND a.is_interpersonal_talk_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        )
                    ) AS prenatal_consultation_theme,
                    jsonb_build_object(
                        'label', 'Accouchement assisté par un personnel qualifié',
                        'vad', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_birth_attended_theme IS TRUE AND a.is_vad_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_birth_attended_theme IS TRUE AND a.is_vad_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        ),
                        'talk', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_birth_attended_theme IS TRUE AND a.is_talk_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_birth_attended_theme IS TRUE AND a.is_talk_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        ),
                        'personal', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_birth_attended_theme IS TRUE AND a.is_interpersonal_talk_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_birth_attended_theme IS TRUE AND a.is_interpersonal_talk_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        )
                    ) AS birth_attended_theme,
                    jsonb_build_object(
                        'label', 'Accouchement assisté par un personnel qualifié',
                        'vad', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_delivery_theme IS TRUE AND a.is_vad_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_delivery_theme IS TRUE AND a.is_vad_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        ),
                        'talk', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_delivery_theme IS TRUE AND a.is_talk_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_delivery_theme IS TRUE AND a.is_talk_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        ),
                        'personal', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_delivery_theme IS TRUE AND a.is_interpersonal_talk_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_delivery_theme IS TRUE AND a.is_interpersonal_talk_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        )
                    ) AS delivery_theme,
                    jsonb_build_object(
                        'label', 'Accouchement assisté par un personnel qualifié',
                        'vad', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_birth_registration_theme IS TRUE AND a.is_vad_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_birth_registration_theme IS TRUE AND a.is_vad_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        ),
                        'talk', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_birth_registration_theme IS TRUE AND a.is_talk_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_birth_registration_theme IS TRUE AND a.is_talk_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        ),
                        'personal', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_birth_registration_theme IS TRUE AND a.is_interpersonal_talk_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_birth_registration_theme IS TRUE AND a.is_interpersonal_talk_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        )
                    ) AS birth_registration_theme,
                    jsonb_build_object(
                        'label', 'Suivi post natal',
                        'vad', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_post_natal_theme IS TRUE AND a.is_vad_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_post_natal_theme IS TRUE AND a.is_vad_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        ),
                        'talk', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_post_natal_theme IS TRUE AND a.is_talk_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_post_natal_theme IS TRUE AND a.is_talk_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        ),
                        'personal', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_post_natal_theme IS TRUE AND a.is_interpersonal_talk_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_post_natal_theme IS TRUE AND a.is_interpersonal_talk_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        )
                    ) AS post_natal_theme,
                    jsonb_build_object(
                        'label', 'Soins après avortement',
                        'vad', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_post_abortion_theme IS TRUE AND a.is_vad_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_post_abortion_theme IS TRUE AND a.is_vad_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        ),
                        'talk', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_post_abortion_theme IS TRUE AND a.is_talk_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_post_abortion_theme IS TRUE AND a.is_talk_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        ),
                        'personal', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_post_abortion_theme IS TRUE AND a.is_interpersonal_talk_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_post_abortion_theme IS TRUE AND a.is_interpersonal_talk_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        )
                    ) AS post_abortion_theme,
                    jsonb_build_object(
                        'label', 'Fistule obstétricale',
                        'vad', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_obstetric_fistula_theme IS TRUE AND a.is_vad_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_obstetric_fistula_theme IS TRUE AND a.is_vad_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        ),
                        'talk', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_obstetric_fistula_theme IS TRUE AND a.is_talk_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_obstetric_fistula_theme IS TRUE AND a.is_talk_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        ),
                        'personal', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_obstetric_fistula_theme IS TRUE AND a.is_interpersonal_talk_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_obstetric_fistula_theme IS TRUE AND a.is_interpersonal_talk_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        )
                    ) AS obstetric_fistula_theme,
                    jsonb_build_object(
                        'label', 'Planification familiale (PF)',
                        'vad', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_family_planning_theme IS TRUE AND a.is_vad_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_family_planning_theme IS TRUE AND a.is_vad_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        ),
                        'talk', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_family_planning_theme IS TRUE AND a.is_talk_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_family_planning_theme IS TRUE AND a.is_talk_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        ),
                        'personal', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_family_planning_theme IS TRUE AND a.is_interpersonal_talk_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_family_planning_theme IS TRUE AND a.is_interpersonal_talk_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        )
                    ) AS family_planning_theme,
                    jsonb_build_object(
                        'label', 'Contraceptifs oraux',
                        'vad', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_oral_contraceptive_theme IS TRUE AND a.is_vad_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_oral_contraceptive_theme IS TRUE AND a.is_vad_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        ),
                        'talk', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_oral_contraceptive_theme IS TRUE AND a.is_talk_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_oral_contraceptive_theme IS TRUE AND a.is_talk_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        ),
                        'personal', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_oral_contraceptive_theme IS TRUE AND a.is_interpersonal_talk_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_oral_contraceptive_theme IS TRUE AND a.is_interpersonal_talk_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        )
                    ) AS oral_contraceptive_theme,
                    jsonb_build_object(
                        'label', 'Vaccination',
                        'vad', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_vaccination_theme IS TRUE AND a.is_vad_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_vaccination_theme IS TRUE AND a.is_vad_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        ),
                        'talk', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_vaccination_theme IS TRUE AND a.is_talk_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_vaccination_theme IS TRUE AND a.is_talk_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        ),
                        'personal', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_vaccination_theme IS TRUE AND a.is_interpersonal_talk_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_vaccination_theme IS TRUE AND a.is_interpersonal_talk_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        )
                    ) AS vaccination_theme,
                    jsonb_build_object(
                        'label', 'Prise en charge du nouveau-né à domicile',
                        'vad', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_newborn_care_home_theme IS TRUE AND a.is_vad_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_newborn_care_home_theme IS TRUE AND a.is_vad_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        ),
                        'talk', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_newborn_care_home_theme IS TRUE AND a.is_talk_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_newborn_care_home_theme IS TRUE AND a.is_talk_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        ),
                        'personal', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_newborn_care_home_theme IS TRUE AND a.is_interpersonal_talk_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_newborn_care_home_theme IS TRUE AND a.is_interpersonal_talk_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        )
                    ) AS newborn_care_home_theme,
                    jsonb_build_object(
                        'label', 'Prise en charge intégrée des cas de maladies à domicile',
                        'vad', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_care_home_illness_case_theme IS TRUE AND a.is_vad_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_care_home_illness_case_theme IS TRUE AND a.is_vad_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        ),
                        'talk', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_care_home_illness_case_theme IS TRUE AND a.is_talk_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_care_home_illness_case_theme IS TRUE AND a.is_talk_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        ),
                        'personal', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_care_home_illness_case_theme IS TRUE AND a.is_interpersonal_talk_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_care_home_illness_case_theme IS TRUE AND a.is_interpersonal_talk_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        )
                    ) AS care_home_illness_case_theme,
                    jsonb_build_object(
                        'label', 'Soins pour le développement de l’enfant',
                        'vad', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_child_development_care_theme IS TRUE AND a.is_vad_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_child_development_care_theme IS TRUE AND a.is_vad_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        ),
                        'talk', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_child_development_care_theme IS TRUE AND a.is_talk_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_child_development_care_theme IS TRUE AND a.is_talk_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        ),
                        'personal', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_child_development_care_theme IS TRUE AND a.is_interpersonal_talk_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_child_development_care_theme IS TRUE AND a.is_interpersonal_talk_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        )
                    ) AS child_development_care_theme,
                    jsonb_build_object(
                        'label', 'Maltraitance des enfants',
                        'vad', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_advice_for_child_development_theme IS TRUE AND a.is_vad_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_advice_for_child_development_theme IS TRUE AND a.is_vad_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        ),
                        'talk', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_advice_for_child_development_theme IS TRUE AND a.is_talk_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_advice_for_child_development_theme IS TRUE AND a.is_talk_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        ),
                        'personal', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_advice_for_child_development_theme IS TRUE AND a.is_interpersonal_talk_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_advice_for_child_development_theme IS TRUE AND a.is_interpersonal_talk_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        )
                    ) AS advice_for_child_development_theme,
                    jsonb_build_object(
                        'label', 'Conseils à la famille sur les problèmes en matière de soins pour le développement de l’enfant',
                        'vad', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_child_abuse_theme IS TRUE AND a.is_vad_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_child_abuse_theme IS TRUE AND a.is_vad_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        ),
                        'talk', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_child_abuse_theme IS TRUE AND a.is_talk_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_child_abuse_theme IS TRUE AND a.is_talk_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        ),
                        'personal', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_child_abuse_theme IS TRUE AND a.is_interpersonal_talk_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_child_abuse_theme IS TRUE AND a.is_interpersonal_talk_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        )
                    ) AS child_abuse_theme,
                    jsonb_build_object(
                        'label', 'Mutilation Genitale Feminine MGF et le rejet de filles non excise',
                        'vad', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_female_genital_mutilation_theme IS TRUE AND a.is_vad_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_female_genital_mutilation_theme IS TRUE AND a.is_vad_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        ),
                        'talk', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_female_genital_mutilation_theme IS TRUE AND a.is_talk_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_female_genital_mutilation_theme IS TRUE AND a.is_talk_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        ),
                        'personal', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_female_genital_mutilation_theme IS TRUE AND a.is_interpersonal_talk_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_female_genital_mutilation_theme IS TRUE AND a.is_interpersonal_talk_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        )
                    ) AS female_genital_mutilation_theme,
                    jsonb_build_object(
                        'label', 'Allaitement maternel exclusif',
                        'vad', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_exclusive_breastfeeding_theme IS TRUE AND a.is_vad_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_exclusive_breastfeeding_theme IS TRUE AND a.is_vad_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        ),
                        'talk', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_exclusive_breastfeeding_theme IS TRUE AND a.is_talk_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_exclusive_breastfeeding_theme IS TRUE AND a.is_talk_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        ),
                        'personal', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_exclusive_breastfeeding_theme IS TRUE AND a.is_interpersonal_talk_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_exclusive_breastfeeding_theme IS TRUE AND a.is_interpersonal_talk_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        )
                    ) AS exclusive_breastfeeding_theme,
                    jsonb_build_object(
                        'label', 'Supplémentation en vitamine A',
                        'vad', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_vitamin_a_supp_theme IS TRUE AND a.is_vad_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_vitamin_a_supp_theme IS TRUE AND a.is_vad_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        ),
                        'talk', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_vitamin_a_supp_theme IS TRUE AND a.is_talk_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_vitamin_a_supp_theme IS TRUE AND a.is_talk_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        ),
                        'personal', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_vitamin_a_supp_theme IS TRUE AND a.is_interpersonal_talk_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_vitamin_a_supp_theme IS TRUE AND a.is_interpersonal_talk_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        )
                    ) AS vitamin_a_supp_theme,
                    jsonb_build_object(
                        'label', 'Alimentation de complément',
                        'vad', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_suppl_feeding_theme IS TRUE AND a.is_vad_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_suppl_feeding_theme IS TRUE AND a.is_vad_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        ),
                        'talk', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_suppl_feeding_theme IS TRUE AND a.is_talk_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_suppl_feeding_theme IS TRUE AND a.is_talk_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        ),
                        'personal', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_suppl_feeding_theme IS TRUE AND a.is_interpersonal_talk_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_suppl_feeding_theme IS TRUE AND a.is_interpersonal_talk_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        )
                    ) AS suppl_feeding_theme,
                    jsonb_build_object(
                        'label', 'Malnutrition',
                        'vad', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_malnutrition_theme IS TRUE AND a.is_vad_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_malnutrition_theme IS TRUE AND a.is_vad_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        ),
                        'talk', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_malnutrition_theme IS TRUE AND a.is_talk_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_malnutrition_theme IS TRUE AND a.is_talk_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        ),
                        'personal', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_malnutrition_theme IS TRUE AND a.is_interpersonal_talk_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_malnutrition_theme IS TRUE AND a.is_interpersonal_talk_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        )
                    ) AS malnutrition_theme,
                    jsonb_build_object(
                        'label', 'Lutte contre la carence en iode',
                        'vad', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_combating_iodine_theme IS TRUE AND a.is_vad_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_combating_iodine_theme IS TRUE AND a.is_vad_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        ),
                        'talk', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_combating_iodine_theme IS TRUE AND a.is_talk_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_combating_iodine_theme IS TRUE AND a.is_talk_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        ),
                        'personal', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_combating_iodine_theme IS TRUE AND a.is_interpersonal_talk_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_combating_iodine_theme IS TRUE AND a.is_interpersonal_talk_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        )
                    ) AS combating_iodine_theme,
                    jsonb_build_object(
                        'label', 'Lavage des mains',
                        'vad', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_hand_washing_theme IS TRUE AND a.is_vad_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_hand_washing_theme IS TRUE AND a.is_vad_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        ),
                        'talk', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_hand_washing_theme IS TRUE AND a.is_talk_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_hand_washing_theme IS TRUE AND a.is_talk_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        ),
                        'personal', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_hand_washing_theme IS TRUE AND a.is_interpersonal_talk_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_hand_washing_theme IS TRUE AND a.is_interpersonal_talk_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        )
                    ) AS hand_washing_theme,
                    jsonb_build_object(
                        'label', 'Assainissement total piloté par la communauté (ATPCtpc)',
                        'vad', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_community_led_theme IS TRUE AND a.is_vad_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_community_led_theme IS TRUE AND a.is_vad_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        ),
                        'talk', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_community_led_theme IS TRUE AND a.is_talk_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_community_led_theme IS TRUE AND a.is_talk_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        ),
                        'personal', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_community_led_theme IS TRUE AND a.is_interpersonal_talk_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_community_led_theme IS TRUE AND a.is_interpersonal_talk_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        )
                    ) AS community_led_theme,
                    jsonb_build_object(
                        'label', 'Tuberculose',
                        'vad', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_tuberculosis_theme IS TRUE AND a.is_vad_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_tuberculosis_theme IS TRUE AND a.is_vad_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        ),
                        'talk', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_tuberculosis_theme IS TRUE AND a.is_talk_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_tuberculosis_theme IS TRUE AND a.is_talk_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        ),
                        'personal', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_tuberculosis_theme IS TRUE AND a.is_interpersonal_talk_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_tuberculosis_theme IS TRUE AND a.is_interpersonal_talk_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        )
                    ) AS tuberculosis_theme,
                    jsonb_build_object(
                        'label', 'Lèpre',
                        'vad', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_leprosy_theme IS TRUE AND a.is_vad_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_leprosy_theme IS TRUE AND a.is_vad_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        ),
                        'talk', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_leprosy_theme IS TRUE AND a.is_talk_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_leprosy_theme IS TRUE AND a.is_talk_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        ),
                        'personal', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_leprosy_theme IS TRUE AND a.is_interpersonal_talk_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_leprosy_theme IS TRUE AND a.is_interpersonal_talk_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        )
                    ) AS leprosy_theme,
                    jsonb_build_object(
                        'label', 'Ulcère de Buruli',
                        'vad', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_buruli_ulcer_theme IS TRUE AND a.is_vad_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_buruli_ulcer_theme IS TRUE AND a.is_vad_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        ),
                        'talk', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_buruli_ulcer_theme IS TRUE AND a.is_talk_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_buruli_ulcer_theme IS TRUE AND a.is_talk_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        ),
                        'personal', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_buruli_ulcer_theme IS TRUE AND a.is_interpersonal_talk_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_buruli_ulcer_theme IS TRUE AND a.is_interpersonal_talk_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        )
                    ) AS buruli_ulcer_theme,
                    jsonb_build_object(
                        'label', 'Onchocercose',
                        'vad', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_onchocerciasis_theme IS TRUE AND a.is_vad_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_onchocerciasis_theme IS TRUE AND a.is_vad_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        ),
                        'talk', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_onchocerciasis_theme IS TRUE AND a.is_talk_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_onchocerciasis_theme IS TRUE AND a.is_talk_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        ),
                        'personal', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_onchocerciasis_theme IS TRUE AND a.is_interpersonal_talk_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_onchocerciasis_theme IS TRUE AND a.is_interpersonal_talk_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        )
                    ) AS onchocerciasis_theme,
                    jsonb_build_object(
                        'label', 'Bilharziose ou schistosomiase',
                        'vad', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_bilharzia_theme IS TRUE AND a.is_vad_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_bilharzia_theme IS TRUE AND a.is_vad_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        ),
                        'talk', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_bilharzia_theme IS TRUE AND a.is_talk_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_bilharzia_theme IS TRUE AND a.is_talk_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        ),
                        'personal', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_bilharzia_theme IS TRUE AND a.is_interpersonal_talk_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_bilharzia_theme IS TRUE AND a.is_interpersonal_talk_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        )
                    ) AS bilharzia_theme,
                    jsonb_build_object(
                        'label', 'Déparasitage de masse',
                        'vad', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_mass_deworming_theme IS TRUE AND a.is_vad_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_mass_deworming_theme IS TRUE AND a.is_vad_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        ),
                        'talk', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_mass_deworming_theme IS TRUE AND a.is_talk_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_mass_deworming_theme IS TRUE AND a.is_talk_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        ),
                        'personal', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_mass_deworming_theme IS TRUE AND a.is_interpersonal_talk_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_mass_deworming_theme IS TRUE AND a.is_interpersonal_talk_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        )
                    ) AS mass_deworming_theme,
                    jsonb_build_object(
                        'label', 'Trypanosomiase humaine africaine (THA)',
                        'vad', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_human_african_trypanosomiasis_theme IS TRUE AND a.is_vad_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_human_african_trypanosomiasis_theme IS TRUE AND a.is_vad_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        ),
                        'talk', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_human_african_trypanosomiasis_theme IS TRUE AND a.is_talk_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_human_african_trypanosomiasis_theme IS TRUE AND a.is_talk_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        ),
                        'personal', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_human_african_trypanosomiasis_theme IS TRUE AND a.is_interpersonal_talk_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_human_african_trypanosomiasis_theme IS TRUE AND a.is_interpersonal_talk_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        )
                    ) AS human_african_trypanosomiasis_theme,
                    jsonb_build_object(
                        'label', 'Filariose lymphatique',
                        'vad', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_lymphatic_theme IS TRUE AND a.is_vad_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_lymphatic_theme IS TRUE AND a.is_vad_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        ),
                        'talk', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_lymphatic_theme IS TRUE AND a.is_talk_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_lymphatic_theme IS TRUE AND a.is_talk_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        ),
                        'personal', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_lymphatic_theme IS TRUE AND a.is_interpersonal_talk_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_lymphatic_theme IS TRUE AND a.is_interpersonal_talk_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        )
                    ) AS lymphatic_theme,
                    jsonb_build_object(
                        'label', 'Trachome',
                        'vad', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_trachoma_theme IS TRUE AND a.is_vad_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_trachoma_theme IS TRUE AND a.is_vad_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        ),
                        'talk', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_trachoma_theme IS TRUE AND a.is_talk_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_trachoma_theme IS TRUE AND a.is_talk_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        ),
                        'personal', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_trachoma_theme IS TRUE AND a.is_interpersonal_talk_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_trachoma_theme IS TRUE AND a.is_interpersonal_talk_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        )
                    ) AS trachoma_theme,
                    jsonb_build_object(
                        'label', 'IST-VIH/SIDA et les hépatites',
                        'vad', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_sti_and_hepatitis_theme IS TRUE AND a.is_vad_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_sti_and_hepatitis_theme IS TRUE AND a.is_vad_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        ),
                        'talk', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_sti_and_hepatitis_theme IS TRUE AND a.is_talk_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_sti_and_hepatitis_theme IS TRUE AND a.is_talk_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        ),
                        'personal', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_sti_and_hepatitis_theme IS TRUE AND a.is_interpersonal_talk_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_sti_and_hepatitis_theme IS TRUE AND a.is_interpersonal_talk_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        )
                    ) AS sti_and_hepatitis_theme,
                    jsonb_build_object(
                        'label', 'Hypertension artérielle',
                        'vad', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_hypertension_theme IS TRUE AND a.is_vad_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_hypertension_theme IS TRUE AND a.is_vad_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        ),
                        'talk', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_hypertension_theme IS TRUE AND a.is_talk_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_hypertension_theme IS TRUE AND a.is_talk_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        ),
                        'personal', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_hypertension_theme IS TRUE AND a.is_interpersonal_talk_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_hypertension_theme IS TRUE AND a.is_interpersonal_talk_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        )
                    ) AS hypertension_theme,
                    jsonb_build_object(
                        'label', 'Diabète',
                        'vad', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_diabetes_theme IS TRUE AND a.is_vad_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_diabetes_theme IS TRUE AND a.is_vad_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        ),
                        'talk', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_diabetes_theme IS TRUE AND a.is_talk_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_diabetes_theme IS TRUE AND a.is_talk_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        ),
                        'personal', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_diabetes_theme IS TRUE AND a.is_interpersonal_talk_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_diabetes_theme IS TRUE AND a.is_interpersonal_talk_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        )
                    ) AS diabetes_theme,
                    jsonb_build_object(
                        'label', 'Cancers',
                        'vad', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_cancers_theme IS TRUE AND a.is_vad_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_cancers_theme IS TRUE AND a.is_vad_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        ),
                        'talk', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_cancers_theme IS TRUE AND a.is_talk_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_cancers_theme IS TRUE AND a.is_talk_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        ),
                        'personal', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_cancers_theme IS TRUE AND a.is_interpersonal_talk_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_cancers_theme IS TRUE AND a.is_interpersonal_talk_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        )
                    ) AS cancers_theme,
                    jsonb_build_object(
                        'label', 'Drépanocytose',
                        'vad', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_sickle_cell_disease_theme IS TRUE AND a.is_vad_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_sickle_cell_disease_theme IS TRUE AND a.is_vad_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        ),
                        'talk', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_sickle_cell_disease_theme IS TRUE AND a.is_talk_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_sickle_cell_disease_theme IS TRUE AND a.is_talk_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        ),
                        'personal', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_sickle_cell_disease_theme IS TRUE AND a.is_interpersonal_talk_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_sickle_cell_disease_theme IS TRUE AND a.is_interpersonal_talk_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        )
                    ) AS sickle_cell_disease_theme,
                    jsonb_build_object(
                        'label', 'Paludisme',
                        'vad', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_malaria_theme IS TRUE AND a.is_vad_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_malaria_theme IS TRUE AND a.is_vad_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        ),
                        'talk', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_malaria_theme IS TRUE AND a.is_talk_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_malaria_theme IS TRUE AND a.is_talk_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        ),
                        'personal', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_malaria_theme IS TRUE AND a.is_interpersonal_talk_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_malaria_theme IS TRUE AND a.is_interpersonal_talk_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        )
                    ) AS malaria_theme,
                    jsonb_build_object(
                        'label', 'Diarrhée simple',
                        'vad', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_diarrhea_theme IS TRUE AND a.is_vad_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_diarrhea_theme IS TRUE AND a.is_vad_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        ),
                        'talk', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_diarrhea_theme IS TRUE AND a.is_talk_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_diarrhea_theme IS TRUE AND a.is_talk_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        ),
                        'personal', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_diarrhea_theme IS TRUE AND a.is_interpersonal_talk_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_diarrhea_theme IS TRUE AND a.is_interpersonal_talk_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        )
                    ) AS diarrhea_theme,
                    jsonb_build_object(
                        'label', 'Diarrhée sanglante',
                        'vad', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_bloody_diarrhea_theme IS TRUE AND a.is_vad_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_bloody_diarrhea_theme IS TRUE AND a.is_vad_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        ),
                        'talk', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_bloody_diarrhea_theme IS TRUE AND a.is_talk_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_bloody_diarrhea_theme IS TRUE AND a.is_talk_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        ),
                        'personal', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_bloody_diarrhea_theme IS TRUE AND a.is_interpersonal_talk_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_bloody_diarrhea_theme IS TRUE AND a.is_interpersonal_talk_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        )
                    ) AS bloody_diarrhea_theme,
                    jsonb_build_object(
                        'label', 'Pneumonie',
                        'vad', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_pneumonia_theme IS TRUE AND a.is_vad_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_pneumonia_theme IS TRUE AND a.is_vad_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        ),
                        'talk', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_pneumonia_theme IS TRUE AND a.is_talk_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_pneumonia_theme IS TRUE AND a.is_talk_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        ),
                        'personal', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_pneumonia_theme IS TRUE AND a.is_interpersonal_talk_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_pneumonia_theme IS TRUE AND a.is_interpersonal_talk_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        )
                    ) AS pneumonia_theme,
                    jsonb_build_object(
                        'label', 'Fièvre jaune',
                        'vad', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_yellow_fever_theme IS TRUE AND a.is_vad_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_yellow_fever_theme IS TRUE AND a.is_vad_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        ),
                        'talk', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_yellow_fever_theme IS TRUE AND a.is_talk_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_yellow_fever_theme IS TRUE AND a.is_talk_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        ),
                        'personal', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_yellow_fever_theme IS TRUE AND a.is_interpersonal_talk_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_yellow_fever_theme IS TRUE AND a.is_interpersonal_talk_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        )
                    ) AS yellow_fever_theme,
                    jsonb_build_object(
                        'label', 'Choléra',
                        'vad', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_cholera_theme IS TRUE AND a.is_vad_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_cholera_theme IS TRUE AND a.is_vad_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        ),
                        'talk', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_cholera_theme IS TRUE AND a.is_talk_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_cholera_theme IS TRUE AND a.is_talk_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        ),
                        'personal', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_cholera_theme IS TRUE AND a.is_interpersonal_talk_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_cholera_theme IS TRUE AND a.is_interpersonal_talk_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        )
                    ) AS cholera_theme,
                    jsonb_build_object(
                        'label', 'Tetanos',
                        'vad', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_tetanus_theme IS TRUE AND a.is_vad_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_tetanus_theme IS TRUE AND a.is_vad_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        ),
                        'talk', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_tetanus_theme IS TRUE AND a.is_talk_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_tetanus_theme IS TRUE AND a.is_talk_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        ),
                        'personal', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_tetanus_theme IS TRUE AND a.is_interpersonal_talk_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_tetanus_theme IS TRUE AND a.is_interpersonal_talk_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        )
                    ) AS tetanus_theme,
                    jsonb_build_object(
                        'label', 'Maladies Virales',
                        'vad', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_viral_diseases_theme IS TRUE AND a.is_vad_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_viral_diseases_theme IS TRUE AND a.is_vad_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        ),
                        'talk', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_viral_diseases_theme IS TRUE AND a.is_talk_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_viral_diseases_theme IS TRUE AND a.is_talk_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        ),
                        'personal', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_viral_diseases_theme IS TRUE AND a.is_interpersonal_talk_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_viral_diseases_theme IS TRUE AND a.is_interpersonal_talk_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        )
                    ) AS viral_diseases_theme,
                    jsonb_build_object(
                        'label', 'Méningite',
                        'vad', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_meningitis_theme IS TRUE AND a.is_vad_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_meningitis_theme IS TRUE AND a.is_vad_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        ),
                        'talk', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_meningitis_theme IS TRUE AND a.is_talk_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_meningitis_theme IS TRUE AND a.is_talk_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        ),
                        'personal', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_meningitis_theme IS TRUE AND a.is_interpersonal_talk_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_meningitis_theme IS TRUE AND a.is_interpersonal_talk_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        )
                    ) AS meningitis_theme,
                    jsonb_build_object(
                        'label', 'PFA',
                        'vad', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_pfa_theme IS TRUE AND a.is_vad_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_pfa_theme IS TRUE AND a.is_vad_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        ),
                        'talk', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_pfa_theme IS TRUE AND a.is_talk_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_pfa_theme IS TRUE AND a.is_talk_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        ),
                        'personal', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_pfa_theme IS TRUE AND a.is_interpersonal_talk_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_pfa_theme IS TRUE AND a.is_interpersonal_talk_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        )
                    ) AS pfa_theme,
                    jsonb_build_object(
                        'label', 'Perte urinaire',
                        'vad', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_urine_loss_theme IS TRUE AND a.is_vad_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_urine_loss_theme IS TRUE AND a.is_vad_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        ),
                        'talk', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_urine_loss_theme IS TRUE AND a.is_talk_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_urine_loss_theme IS TRUE AND a.is_talk_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        ),
                        'personal', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_urine_loss_theme IS TRUE AND a.is_interpersonal_talk_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_urine_loss_theme IS TRUE AND a.is_interpersonal_talk_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        )
                    ) AS urine_loss_theme,
                    jsonb_build_object(
                        'label', 'Pression artérielle',
                        'vad', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_blood_pressure_theme IS TRUE AND a.is_vad_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_blood_pressure_theme IS TRUE AND a.is_vad_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        ),
                        'talk', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_blood_pressure_theme IS TRUE AND a.is_talk_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_blood_pressure_theme IS TRUE AND a.is_talk_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        ),
                        'personal', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_blood_pressure_theme IS TRUE AND a.is_interpersonal_talk_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_blood_pressure_theme IS TRUE AND a.is_interpersonal_talk_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        )
                    ) AS blood_pressure_theme,
                    jsonb_build_object(
                        'label', 'VIH',
                        'vad', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_hiv_theme IS TRUE AND a.is_vad_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_hiv_theme IS TRUE AND a.is_vad_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        ),
                        'talk', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_hiv_theme IS TRUE AND a.is_talk_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_hiv_theme IS TRUE AND a.is_talk_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        ),
                        'personal', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_hiv_theme IS TRUE AND a.is_interpersonal_talk_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_hiv_theme IS TRUE AND a.is_interpersonal_talk_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        )
                    ) AS hiv_theme,
                    jsonb_build_object(
                        'label', 'Autres Infections Sexuellements Transtissibles',
                        'vad', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_ist_theme IS TRUE AND a.is_vad_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_ist_theme IS TRUE AND a.is_vad_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        ),
                        'talk', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_ist_theme IS TRUE AND a.is_talk_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_ist_theme IS TRUE AND a.is_talk_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        ),
                        'personal', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_ist_theme IS TRUE AND a.is_interpersonal_talk_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_ist_theme IS TRUE AND a.is_interpersonal_talk_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        )
                    ) AS ist_theme,
                    jsonb_build_object(
                        'label', 'Autres maladies',
                        'vad', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_other_theme IS TRUE AND a.is_vad_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_other_theme IS TRUE AND a.is_vad_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        ),
                        'talk', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_other_theme IS TRUE AND a.is_talk_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_other_theme IS TRUE AND a.is_talk_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        ),
                        'personal', jsonb_build_object(
                            'F', COALESCE(SUM(a.women_number) FILTER (WHERE a.is_other_theme IS TRUE AND a.is_interpersonal_talk_method IS TRUE AND a.women_number IS NOT NULL),NULL)::BIGINT,
                            'M', COALESCE(SUM(a.men_number) FILTER (WHERE a.is_other_theme IS TRUE AND a.is_interpersonal_talk_method IS TRUE AND a.men_number IS NOT NULL),NULL)::BIGINT
                        )
                    ) AS others_theme,


                    jsonb_build_object('id', r.id, 'name', r.name, 'phone', r.phone) AS reco,
                    jsonb_build_object('id', c.id, 'name', c.name) AS country,
                    jsonb_build_object('id', g.id, 'name', g.name) AS region,
                    jsonb_build_object('id', p.id, 'name', p.name) AS prefecture,
                    jsonb_build_object('id', m.id, 'name', m.name) AS commune,
                    jsonb_build_object('id', h.id, 'name', h.name) AS hospital,
                    jsonb_build_object('id', d.id, 'name', d.name) AS district_quartier,
                    jsonb_build_object('id', v.id, 'name', v.name) AS village_secteur

                FROM promotional_data_view a
                
                    LEFT JOIN reco_view r ON a.reco_id = r.id
                    LEFT JOIN country_view c ON a.country_id = c.id
                    LEFT JOIN region_view g ON a.region_id = g.id
                    LEFT JOIN prefecture_view p ON a.prefecture_id = p.id
                    LEFT JOIN commune_view m ON a.commune_id = m.id
                    LEFT JOIN hospital_view h ON a.hospital_id = h.id
                    LEFT JOIN district_quartier_view d ON a.district_quartier_id = d.id
                    LEFT JOIN village_secteur_view v ON a.village_secteur_id = v.id 

                GROUP BY a.reco_id, a.month, a.year, r.id, r.name, r.phone, 
                        c.id, c.name, g.id, g.name, p.id, p.name, 
                        m.id, m.name, h.id, h.name, d.id, d.name, 
                        v.id, v.name;
        `);


        await CreateViewIndex('reports_promotional_view', queryRunner);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await this.dropViews(queryRunner);
    }

    public async dropViews(queryRunner: QueryRunner): Promise<void> {
        await DropViewIndexAndTable('reports_promotional_view', queryRunner);
    }

}