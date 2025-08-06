
export interface PromotionalDataView {
    id: string
    rev: string
    form: string
    year: number
    month: string

    activity_method: string | null,

    is_vad_method: boolean | null
    is_talk_method: boolean | null
    is_interpersonal_talk_method: boolean | null

    activity_domains: string[] | null
    activity_themes: string[] | null

    activity_location: string | null
    women_number: number | null
    men_number: number | null

    family_number: string | null
    total_person: number | null

    is_maternel_childhealth_domain: boolean | null,
    is_education_domain: boolean | null,
    is_gbv_domain: boolean | null,
    is_nutrition_domain: boolean | null,
    is_water_hygiene_domain: boolean | null,
    is_ist_vih_domain: boolean | null,
    is_disease_control_domain: boolean | null,
    is_others_domain: boolean | null,
    other_domain: string | null,

    is_prenatal_consultation_theme: boolean | null,
    is_birth_attended_theme: boolean | null,
    is_delivery_theme: boolean | null,
    is_birth_registration_theme: boolean | null,
    is_post_natal_theme: boolean | null,
    is_post_abortion_theme: boolean | null,
    is_obstetric_fistula_theme: boolean | null,
    is_family_planning_theme: boolean | null,
    is_oral_contraceptive_theme: boolean | null,
    is_vaccination_theme: boolean | null,
    is_newborn_care_home_theme: boolean | null,
    is_care_home_illness_case_theme: boolean | null,
    is_child_development_care_theme: boolean | null,
    is_advice_for_child_developmenttheme: boolean | null,
    is_child_abuse_theme: boolean | null,
    is_female_genital_mutilation_theme: boolean | null,
    is_exclusive_breastfeeding_theme: boolean | null,
    is_vitamin_a_supp_theme: boolean | null,
    is_suppl_feeding_theme: boolean | null,
    is_malnutrition_theme: boolean | null,
    is_combating_iodine_theme: boolean | null,
    is_hand_washing_theme: boolean | null,
    is_community_led_theme: boolean | null,
    is_tuberculosis_theme: boolean | null,
    is_leprosy_theme: boolean | null,
    is_buruli_ulcer_theme: boolean | null,
    is_onchocerciasis_theme: boolean | null,
    is_bilharzia_theme: boolean | null,
    is_mass_deworming_theme: boolean | null,
    is_human_african_trypanosomiasis_theme: boolean | null,
    is_lymphatic_theme: boolean | null,
    is_trachoma_theme: boolean | null,
    is_sti_and_hepatitis_theme: boolean | null,
    is_hypertension_theme: boolean | null,
    is_diabetes_theme: boolean | null,
    is_cancers_theme: boolean | null,
    is_sickle_cell_disease_theme: boolean | null,
    is_malaria_theme: boolean | null,
    is_diarrhea_theme: boolean | null,
    is_bloody_diarrhea_theme: boolean | null,
    is_pneumonia_theme: boolean | null,
    is_yellow_fever_theme: boolean | null,
    is_cholera_theme: boolean | null,
    is_tetanus_theme: boolean | null,
    is_viral_diseases_theme: boolean | null,
    is_meningitis_theme: boolean | null,
    is_pfa_theme: boolean | null,
    is_urine_loss_theme: boolean | null,
    is_blood_pressure_theme: boolean | null,
    is_hiv_theme: boolean | null,
    is_ist_theme: boolean | null,
    is_other_theme: boolean | null
    other_theme: string | null

    country_id: string | null
    region_id: string | null
    prefecture_id: string | null
    commune_id: string | null
    hospital_id: string | null
    district_quartier_id: string | null
    village_secteur_id: string | null
    family_id: string | null
    patient_id: string | null
    reco_id: string | null

    reported_date_timestamp: number
    reported_date: string
    reported_full_date: string | null

    geolocation: object | null;

} 
