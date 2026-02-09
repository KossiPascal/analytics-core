CREATE MATERIALIZED VIEW IF NOT EXISTS reports_chws_reco_view AS
    SELECT 
        CONCAT(a.month, '-', a.year, '-', a.reco_id) AS id,
        a.month,
        a.year,
        a.reco_id,

        jsonb_build_object(
            'index', 1,
            'group', 'Suivi des RECO',
            'position', 'I',
            'data', jsonb_build_array(
                jsonb_build_object('index', 1, 'indicator', 'Nombre total de RECO couvert', 'de_number', (CASE WHEN COUNT(cover.*) > 0 THEN 1 ELSE 0 END), 'observation', NULL),
                jsonb_build_object('index', 2, 'indicator', 'Nombre total de RECO supervisé au cours du mois', 'de_number',  (CASE WHEN COUNT(rcsv.*) > 0 THEN 1 ELSE 0 END), 'observation', NULL),
                jsonb_build_object('index', 3, 'indicator', 'Nombre de RECO fonctionnel au cours du Mois (RECO ayant déposé le rapport)', 'de_number', (CASE WHEN COUNT(fun.*) > 0 THEN 1 ELSE 0 END), 'observation', NULL)
            )
        ) AS reco_monitoring,

        jsonb_build_object(
            'index', 2,
            'group', 'Démographie',
            'position', 'II',
            'data', jsonb_build_array(
                jsonb_build_object('index', 1,'indicator', 'Population couverte par les RECO (ce mois)','de_number', SUM(patient.patients_cover), 'observation', NULL),
                jsonb_build_object('index', 2,'indicator', 'Nombre de ménages couverts par les RECO (ce mois)','de_number', SUM(family.families_cover), 'observation', NULL),
                jsonb_build_object('index', 3,'indicator', 'Nombre de Femmes enceintes dénombrées par mois (ce mois)','de_number', SUM(pregnant.women_pregnant), 'observation', NULL),
                jsonb_build_object('index', 4,'indicator', 'Nombre d''enfants de 0 - 11 mois dénombrés (ce mois)','de_number', SUM(patient.children_0_11), 'observation', NULL),
                jsonb_build_object('index', 5,'indicator', 'Nombre d''enfants de 12-59 mois dénombrés (ce mois)','de_number', SUM(patient.children_12_59), 'observation', NULL),
                jsonb_build_object('index', 6,'indicator', 'Nombre de femmes de 15 -49 ans dénombrées (ce mois)','de_number', SUM(patient.women_15_49), 'observation', NULL),
                jsonb_build_object('index', 7,'indicator', 'Nombre de décès communautaires enregistrés par mois (ce mois)','de_number', SUM(patient.death_register), 'observation', NULL),
                jsonb_build_object('index', 8,'indicator', 'Population couverte par les RECO (total) 📌','de_number', SUM(patient.total_patients_cover), 'observation', NULL),
                jsonb_build_object('index', 9,'indicator', 'Nombre de ménages couverts par les RECO (total) 📌','de_number', SUM(family.total_families_cover), 'observation', NULL),
                jsonb_build_object('index', 10,'indicator', 'Nombre de Femmes enceintes dénombrées par mois (total) 📌','de_number', SUM(pregnant.total_women_pregnant), 'observation', NULL),
                jsonb_build_object('index', 11,'indicator', 'Nombre d''enfants de 0 - 11 mois dénombrés (total) 📌','de_number', SUM(patient.total_children_0_11), 'observation', NULL),
                jsonb_build_object('index', 12,'indicator', 'Nombre d''enfants de 12-59 mois dénombrés (total) 📌','de_number', SUM(patient.total_children_12_59), 'observation', NULL),
                jsonb_build_object('index', 13,'indicator', 'Nombre de femmes de 15 -49 ans dénombrées (total) 📌','de_number', SUM(patient.total_women_15_49), 'observation', NULL),
                jsonb_build_object('index', 14,'indicator', 'Nombre de décès communautaires enregistrés par mois (total) 📌','de_number', SUM(patient.total_death_register), 'observation', NULL)
            )
        ) AS demography,

        jsonb_build_object(
            'index', 3,
            'group', 'Santé de l''Enfant 0-59 Mois',
            'position', 'III',
            'data', jsonb_build_array(
                jsonb_build_object('index', 1, 'indicator', 'Nombre de nouveaux nés de 0-45 jours à rattrapper pour le BCG', 'de_number', SUM(vaccin.newborns_0_45d_to_catch_up_BCG), 'observation', NULL),
                jsonb_build_object('index', 2, 'indicator', 'Nombre de nouveaux nés de 0-45 jours rattrappé pour le BCG', 'de_number', SUM(vaccin.newborns_0_45d_caught_up_BCG), 'observation', NULL),
                jsonb_build_object('index', 3, 'indicator', 'Nombre de nouveaux nés de 0-45 Jours à rattrapper pour le Polio 0', 'de_number', SUM(vaccin.newborns_0_45d_to_catch_up_Polio0), 'observation', NULL),
                jsonb_build_object('index', 4, 'indicator', 'Nombre de nouveaux nés de 0-45 Jours rattrappé pour le Polio 0', 'de_number', SUM(vaccin.newborns_0_45d_caught_up_Polio0), 'observation', NULL),
                jsonb_build_object('index', 5, 'indicator', 'Nombre d''enfants de 3-5 mois à rattrapper pour le Penta 3', 'de_number', SUM(vaccin.children_3_5m_to_catch_up_Penta3), 'observation', NULL),
                jsonb_build_object('index', 6, 'indicator', 'Nombre d''enfants de 3-5 mois rattrappé pour le Penta 3', 'de_number', SUM(vaccin.children_3_5m_caught_up_Penta3), 'observation', NULL),
                jsonb_build_object('index', 7, 'indicator', 'Nombre d''enfants de 9 à 11 mois entièrement vaccinés VAR / VAA', 'de_number', SUM(vaccin.children_9_11m_fully_vaccinated_VAR_VAA), 'observation', NULL),
                jsonb_build_object('index', 8, 'indicator', 'Nombre d''enfant zéro dose à rattrapper', 'de_number', SUM(vaccin.zero_dose_children_to_catch_up), 'observation', NULL),
                jsonb_build_object('index', 9, 'indicator', 'Nombre d''enfant zéro dose rattrappé', 'de_number', SUM(vaccin.zero_dose_children_caught_up), 'observation', NULL),

                jsonb_build_object('index', 10, 'indicator', 'Nombre de nouveau nés referés avec signes de danger', 'de_number', SUM(newborn.referred_with_danger_signs), 'observation', NULL),

                jsonb_build_object('index', 11, 'indicator', 'Nombre de nouveau-nés enregistrés par mois par les RECO', 'de_number', SUM(patient.newborns_registered_per_month), 'observation', NULL),
                jsonb_build_object('index', 12, 'indicator', 'Nombre d''enfants orientés pour l''extrait de naissance', 'de_number', SUM(patient.children_referred_for_birth_certificate), 'observation', NULL),
                jsonb_build_object('index', 13, 'indicator', 'Nombre d''enfants ayant reçu l''extrait de naissance', 'de_number', SUM(patient.children_received_birth_certificate), 'observation', NULL),

                jsonb_build_object('index', 14, 'indicator', 'Nombre d''enfants de 6 à 59 mois orienté pour la vitamine A ❌', 'de_number', SUM(pcime.referred_6_59m_vitamin_A), 'observation', NULL),

                jsonb_build_object('index', 15, 'indicator', 'Nombre d''enfant  évalués pour la malnutrition', 'de_number', (SUM(pcime.screened_malnutrition) + SUM(newborn.screened_malnutrition)), 'observation', NULL),

                jsonb_build_object('index', 16, 'indicator', 'Nombre total d''enfants de 06 à 59 mois dont PB est inferieur à 12,5 Cm', 'de_number', SUM(pcime.PB_6_59m_under_125mm), 'observation', NULL),
                jsonb_build_object('index', 17, 'indicator', 'Nombre d''enfants de 6 à 59 mois à risque de Malnutrition orientés vers le centre/poste de santé (❌)', 'de_number', SUM(pcime.malnutrition_6_59m_risk_referred), 'observation', NULL),

                jsonb_build_object('index', 18, 'indicator', 'Nombre total de cas de diarrhées chez les enfants de 0 à 59 mois', 'de_number', (SUM(pcime.diarrhea_cases) + SUM(newborn.diarrhea_cases)), 'observation', NULL),

                jsonb_build_object('index', 19, 'indicator', 'Nombre d''enfants 0-59 mois avec diarrhées ayant recu SRO + Zinc', 'de_number', SUM(pcime.diarrhea_0_59m_received_SRO_Zinc), 'observation', NULL),

                jsonb_build_object('index', 20, 'indicator', 'Nombre de ménages ayant des latrines fonctionnelles dans leur foyer', 'de_number', SUM(family.households_with_functional_latrines), 'observation', NULL),
                jsonb_build_object('index', 21, 'indicator', 'Nombre de ménages vivant avec les enfants de 0 à 59 mois ayant accès à l''eau potable', 'de_number', SUM(family.households_with_children_0_59m_safe_water), 'observation', NULL)
            )
        ) AS child_health_0_59_months,

        jsonb_build_object(
            'index', 4,
            'group', 'Santé de la Mère',
            'position', 'IV',
            'data', jsonb_build_array(
                jsonb_build_object('index', 1, 'indicator', 'Nombre de femmes enceintes orientées par mois en CPN 1', 'de_number', SUM(pregnant.referred_CPN1_per_month), 'observation', NULL),

                jsonb_build_object('index', 2, 'indicator', 'Nombre d’accouchements à domicile (uniquement)', 'de_number', COUNT(delivery.*) FILTER (WHERE delivery.is_home_delivery IS TRUE), 'observation', NULL),

                jsonb_build_object('index', 3, 'indicator', 'Nombre total de femmes enceintes orienté par les RECO dans une structure de santé pour accouchement', 'de_number', SUM(pregnant.referred_for_delivery), 'observation', NULL),
                jsonb_build_object('index', 4, 'indicator', 'Nombre de décès maternels à domicile enregistrés par les RECO', 'de_number', SUM(death.maternal_deaths_at_home_RECO), 'observation', NULL),
                jsonb_build_object('index', 5, 'indicator', 'Nombre de décès néonatals (<28 jours) à domicile enregistrés par les RECO', 'de_number', SUM(death.neonatal_deaths_home_RECO), 'observation', NULL),
                jsonb_build_object('index', 6, 'indicator', 'Nombre de décès d''enfants de moins de cinq ans (<5 ans) à domicile enregistrés par les RECO', 'de_number', SUM(death.under5_deaths_home_RECO), 'observation', NULL),
                jsonb_build_object('index', 7, 'indicator', 'Nombre de femme enceintes orientée vers le CS par les RECO pour CPN', 'de_number', SUM(pregnant.referred_CPN), 'observation', NULL),
                jsonb_build_object('index', 8, 'indicator', 'Nombre de femmes nouvelles utilisatrices des methodes contraceptives dans la communauté', 'de_number', COUNT(fp.*), 'observation', NULL),
                jsonb_build_object('index', 9, 'indicator', 'Nombre de femmes enceintes referées au CS par les RECO avec signes de danger', 'de_number', SUM(pregnant.referred_danger_signs_RECO), 'observation', NULL)
            )
        ) AS mother_health,

        jsonb_build_object(
            'index', 5,
            'group', 'ACTIVITE PCIMNE',
            'position', 'V',
            'data', jsonb_build_array(
                jsonb_build_object('index', 1, 'indicator', 'Nombre de TDR palu effectué par les RECO', 'de_number', SUM(pcime.malaria_rdt_done), 'observation', NULL),
                jsonb_build_object('index', 2, 'indicator', 'Nombre de TDR palu positif réalisé par les RECO', 'de_number', SUM(pcime.malaria_rdt_positive), 'observation', NULL),
                jsonb_build_object('index', 3, 'indicator', 'Nombre de cas traités avec CTA par les RECO', 'de_number', SUM(pcime.cases_treated_with_cta), 'observation', NULL),
                jsonb_build_object('index', 4, 'indicator', 'Nombre de cas de palu grave reféré par les RECO au CS', 'de_number', SUM(pcime.severe_malaria_cases_referred), 'observation', NULL),
                jsonb_build_object('index', 5, 'indicator', 'Nombre de cas de deces lié au paludisme enregistré par le RECO', 'de_number', SUM(death.malaria_deaths_recorded), 'observation', NULL),
                jsonb_build_object('index', 6, 'indicator', 'Nombre de cas de diarrhée enregistré par les RECO', 'de_number', SUM(pcime.diarrhea_cases_recorded), 'observation', NULL),
                jsonb_build_object('index', 7, 'indicator', 'Nombre de cas de diarrhée reféré par les RECO au CS', 'de_number', SUM(pcime.diarrhea_cases_referred), 'observation', NULL),
                jsonb_build_object('index', 8, 'indicator', 'Nombre de deces dû à la diarrhée enregistré par les RECO', 'de_number', SUM(death.diarrhea_deaths_recorded), 'observation', NULL),
                jsonb_build_object('index', 9, 'indicator', 'Nombre de cas de diarrhée traités par les RECO avec SRO et ZINC', 'de_number', SUM(pcime.diarrhea_cases_treated_with_sro_zinc), 'observation', NULL),
                jsonb_build_object('index', 10, 'indicator', 'Nombre de cas de Toux/Difficulté respiratoire/pneumonie simple enregisté par les RECO', 'de_number', SUM(pcime.pneumonia_cough_cold_cases), 'observation', NULL),
                jsonb_build_object('index', 11, 'indicator', 'Nombre de cas traités avec Amoxicilline de Toux/Difficulté respiratoire/pneumonie simple enregisté par les RECO', 'de_number', SUM(pcime.pneumonia_cough_cold_cases_treated_amoxicillin), 'observation', NULL),
                jsonb_build_object('index', 12, 'indicator', 'Nombre de cas reféré de Toux/Difficulté respiratoire/pneumonie simple par les RECO', 'de_number', SUM(pcime.pneumonia_cough_cold_cases_referred), 'observation', NULL),
                jsonb_build_object('index', 13, 'indicator', 'Nombre de déces Toux/Difficulté respiratoire/pneumonie simple', 'de_number', SUM(death.pneumonia_cough_cold_deaths), 'observation', NULL),
                jsonb_build_object('index', 14, 'indicator', 'Nombre de traitements de pré-référence (RECTOCAPS) réalisées par les RECO ❌', 'de_number', SUM(pcime.pre_referral_treatments_rectocaps), 'observation', NULL)
            )
        ) AS pcimne_activity,
        
        jsonb_build_object(
            'index', 6,
            'group', 'ACTIVITES MORBIDITES',
            'position', 'VI',
            'data', jsonb_build_array(
                jsonb_build_object('index', 1, 'indicator', 'Nombre de cas d''accident de circulation notifié par les RECO', 'de_number', SUM(adult.road_accident_cases_reported), 'observation', NULL),
                jsonb_build_object('index', 2, 'indicator', 'Nombre de cas de brûlure notifié par les RECO', 'de_number', SUM(adult.burn_cases_reported), 'observation', NULL),
                jsonb_build_object('index', 3, 'indicator', 'Nombre de cas suspects de TB orienté par les RECO', 'de_number', SUM(adult.suspected_tb_cases_referred), 'observation', NULL),
                jsonb_build_object('index', 4, 'indicator', 'Nombre de cas de dermatose orienté par les RECO', 'de_number', SUM(adult.dermatosis_cases_referred), 'observation', NULL),
                jsonb_build_object('index', 5, 'indicator', 'Nombre de cas de diarrhées réferé par les RECO > à 5 ans', 'de_number', SUM(adult.diarrhea_cases_over_5_referred), 'observation', NULL),
                jsonb_build_object('index', 6, 'indicator', 'Nombre de cas d''écoulement uretrale réferé au CS par les RECO', 'de_number', SUM(adult.urethral_discharge_cases_referred), 'observation', NULL),
                jsonb_build_object('index', 7, 'indicator', 'Nombre de cas d''écoulement vaginal réferé au CS par les RECO', 'de_number', SUM(adult.vaginal_discharge_cases_referred), 'observation', NULL),
                jsonb_build_object('index', 8, 'indicator', 'Nombre de cas de perte urinaire réferé au CS par les RECO', 'de_number', SUM(adult.urine_loss_cases_referred), 'observation', NULL),
                jsonb_build_object('index', 9, 'indicator', 'Nombre de cas d''ingestion accidentelle des produits caustiques réferé au CS par les RECO', 'de_number', SUM(adult.caustic_ingestion_cases_referred), 'observation', NULL),
                jsonb_build_object('index', 10, 'indicator', 'Nombre de cas d''intoxication alimentaire réferée au CS par les RECO', 'de_number', SUM(adult.food_poisoning_cases_referred), 'observation', NULL),
                jsonb_build_object('index', 11, 'indicator', 'Nombre de cas de maladies bucco-dentaires réferé au CS par les RECO', 'de_number', SUM(adult.oral_dental_disease_cases_referred), 'observation', NULL),
                jsonb_build_object('index', 12, 'indicator', 'Nombre de cas de morsure de chien réferée au CS par les RECO', 'de_number', SUM(adult.dog_bite_cases_referred), 'observation', NULL),
                jsonb_build_object('index', 13, 'indicator', 'Nombre de cas de morsure de serpent réferée au CS par les RECO', 'de_number', SUM(adult.snake_bite_cases_referred), 'observation', NULL),
                jsonb_build_object('index', 14, 'indicator', 'Nombre de cas de rougeole réferé au CS par les RECO', 'de_number', SUM(adult.measles_cases_referred), 'observation', NULL),
                jsonb_build_object('index', 15, 'indicator', 'Nombre de cas de violence basées sur le genre (VBG) réferé au CS par les RECO', 'de_number', SUM(adult.gbv_cases_referred), 'observation', NULL)
            )
        ) AS morbidity_activities,
        
        jsonb_build_object(
            'index', 7,
            'group', 'Paludisme(supérieur à 5 ans)',
            'position', 'VII',
            'data', jsonb_build_array(
                jsonb_build_object('index', 1, 'indicator', 'Nombre de TDR effectué par les RECO', 'de_number', SUM(adult.rdt_done), 'observation', NULL),
                jsonb_build_object('index', 2, 'indicator', 'Nombre de TDR positif réalisé par les RECO', 'de_number', SUM(adult.rdt_positive), 'observation', NULL),
                jsonb_build_object('index', 3, 'indicator', 'Nombre de cas de palu traités avec CTA par les RECO', 'de_number', SUM(adult.malaria_cases_treated_with_act), 'observation', NULL),
                jsonb_build_object('index', 4, 'indicator', 'Nombre de cas  de palu reféré au CS par les RECO', 'de_number', SUM(adult.malaria_cases_referred), 'observation', NULL),
                jsonb_build_object('index', 5, 'indicator', 'Nombre de cas de deces lié au paludisme notifié par les RECO', 'de_number', SUM(adult.malaria_deaths_reported), 'observation', NULL)
            )
        ) AS malaria_more_5_years,

        jsonb_build_object(
            'index', 8,
            'bigGroup', 'ACTIVITE PROMOTIONNELLE',
            'group', 'VISITE A DOMICILE',
            'position', 'VIII',
            'data', jsonb_build_array(
                jsonb_build_object('index', 1, 'indicator', 'Nombre de visites à domicile réalisée par les RECO par mois', 'de_number', SUM(promo.home_visits), 'observation', NULL),
                jsonb_build_object('index', 2, 'indicator', 'Nombre d''homme touché  par les VAD', 'de_number', SUM(promo.men_reached_home_visits), 'observation', NULL),
                jsonb_build_object('index', 3, 'indicator', 'Nombre de femmes touchées par les VAD', 'de_number', SUM(promo.women_reached_home_visits), 'observation', NULL)
            )
        ) AS home_visit,
        
        jsonb_build_object(
            'index', 9,
            'bigGroup', 'ACTIVITE PROMOTIONNELLE',
            'group', 'CAUSERIE EDUCATIVE',
            'position', 'VIII',
            'data', jsonb_build_array(
                jsonb_build_object('index', 1, 'indicator', 'Nombre de causeries éducatives effectuées par les RECO', 'de_number', SUM(promo.educational_talks), 'observation', NULL),
                jsonb_build_object('index', 2, 'indicator', 'Nombre d''homme touché  par les causeries éducatives', 'de_number', SUM(promo.men_reached_educational_talks), 'observation', NULL),
                jsonb_build_object('index', 3, 'indicator', 'Nombre de femmes touchées par les causeries éducatives', 'de_number', SUM(promo.women_reached_educational_talks), 'observation', NULL)
            )
        ) AS educational_talk,
        
        jsonb_build_object(
            'index', 9,
            'bigGroup', 'ACTIVITE PROMOTIONNELLE',
            'group', 'CAUSERIE INTERPERSONELLE',
            'position', 'VIII',
            'data', jsonb_build_array(
                jsonb_build_object('index', 1, 'indicator', 'Nombre de causeries interpersonelles effectuées par les RECO', 'de_number', SUM(promo.interpersonal_talks), 'observation', NULL),
                jsonb_build_object('index', 2, 'indicator', 'Nombre d''homme ayant reçu de causeries interpersonelles', 'de_number', SUM(promo.men_reached_interpersonal_talks), 'observation', NULL),
                jsonb_build_object('index', 3, 'indicator', 'Nombre de femmes ayant reçu de causeries interpersonelles', 'de_number', SUM(promo.women_reached_interpersonal_talks), 'observation', NULL)
            )
        ) AS interpersonal_talk,

        jsonb_build_object(
            'index', 10,
            'group', 'DOMAINES DEVELOPPES',
            'position', 'IX',
            'data', jsonb_build_array(
                jsonb_build_object('index', 1, 'indicator', 'Paludisme', 'de_number', SUM(promo.malaria), 'observation', NULL),
                jsonb_build_object('index', 2, 'indicator', 'Planification Familiale', 'de_number', SUM(promo.family_planning), 'observation', NULL),
                jsonb_build_object('index', 3, 'indicator', 'CPN', 'de_number', SUM(promo.prenatal_consultation), 'observation', NULL),
                jsonb_build_object('index', 4, 'indicator', 'CPoN', 'de_number', SUM(promo.postnatal_care), 'observation', NULL),
                jsonb_build_object('index', 5, 'indicator', 'Accouchement', 'de_number', SUM(promo.delivery), 'observation', NULL),
                jsonb_build_object('index', 6, 'indicator', 'Vaccination', 'de_number', SUM(promo.vaccination), 'observation', NULL),
                jsonb_build_object('index', 7, 'indicator', 'IST / VIH', 'de_number', SUM(promo.disease_control), 'observation', NULL),
                jsonb_build_object('index', 8, 'indicator', 'Tuberculose', 'de_number', SUM(promo.tuberculosis), 'observation', NULL),
                jsonb_build_object('index', 9, 'indicator', 'Nutrition', 'de_number', SUM(promo.nutrition), 'observation', NULL),
                jsonb_build_object('index', 10, 'indicator', 'Eau, Hygiène et aissainement', 'de_number', SUM(promo.water_hygiene), 'observation', NULL),
                jsonb_build_object('index', 11, 'indicator', 'VBG', 'de_number', SUM(promo.gbv), 'observation', NULL),
                jsonb_build_object('index', 12, 'indicator', 'MGF', 'de_number', SUM(promo.female_genital_mutilation), 'observation', NULL),
                jsonb_build_object('index', 13, 'indicator', 'Diarrhée', 'de_number', SUM(promo.diarrhea), 'observation', NULL),
                jsonb_build_object('index', 14, 'indicator', 'Pneumonie', 'de_number', SUM(promo.pneumonia), 'observation', NULL),
                jsonb_build_object('index', 15, 'indicator', 'Enregistrement des Naissances', 'de_number', SUM(promo.birth_registration), 'observation', NULL),
                jsonb_build_object('index', 16, 'indicator', 'Lèpre', 'de_number', SUM(promo.leprosy), 'observation', NULL),
                jsonb_build_object('index', 17, 'indicator', 'Pertes d''Urines', 'de_number', SUM(promo.urine_loss), 'observation', NULL),
                jsonb_build_object('index', 18, 'indicator', 'Diabète', 'de_number', SUM(promo.diabetes), 'observation', NULL),
                jsonb_build_object('index', 19, 'indicator', 'Tension artérielle', 'de_number', SUM(promo.blood_pressure), 'observation', NULL),
                jsonb_build_object('index', 20, 'indicator', 'Onchocercose', 'de_number', SUM(promo.onchocerciasis), 'observation', NULL),
                jsonb_build_object('index', 21, 'indicator', 'Trypanosomiase Humaine Africaine', 'de_number', SUM(promo.sleeping_sickness), 'observation', NULL),
                jsonb_build_object('index', 22, 'indicator', 'PFA', 'de_number', SUM(promo.pfa), 'observation', NULL),
                jsonb_build_object('index', 23, 'indicator', 'Diarrhée sanglante', 'de_number', SUM(promo.bloody_diarrhea), 'observation', NULL),
                jsonb_build_object('index', 24, 'indicator', 'Fièvre Jaune', 'de_number', SUM(promo.yellow_fever), 'observation', NULL),
                jsonb_build_object('index', 25, 'indicator', 'Cholera', 'de_number', SUM(promo.cholera), 'observation', NULL),
                jsonb_build_object('index', 26, 'indicator', 'Tétanos Maternel et Néonatal', 'de_number', SUM(promo.maternal_neonatal_tetanus), 'observation', NULL),
                jsonb_build_object('index', 27, 'indicator', 'Maladies virales', 'de_number', SUM(promo.viral_diseases), 'observation', NULL),
                jsonb_build_object('index', 28, 'indicator', 'Méningite', 'de_number', SUM(promo.meningitis), 'observation', NULL)
            )
        ) AS developed_areas,
        
        jsonb_build_object(
            'index', 11,
            'group', 'MALADIES ET EVENEMENTS NOTIFIES ET ALERTES',
            'position', 'X',
            'data', jsonb_build_array(
                jsonb_build_object('index', 1, 'indicator', 'PFA', 'de_number', SUM(events.AFP), 'observation', NULL),
                jsonb_build_object('index', 2, 'indicator', 'Diarrhée sanglante', 'de_number', SUM(events.bloody_diarrhea), 'observation', NULL),
                jsonb_build_object('index', 3, 'indicator', 'Fièvre Jaune', 'de_number', SUM(events.yellow_fever), 'observation', NULL),
                jsonb_build_object('index', 4, 'indicator', 'Cholera', 'de_number', SUM(events.cholera), 'observation', NULL),
                jsonb_build_object('index', 5, 'indicator', 'Tétanos Maternel et Néonatal', 'de_number', SUM(events.maternal_neonatal_tetanus), 'observation', NULL),
                jsonb_build_object('index', 6, 'indicator', 'Maladies virales(ebola, marburg, lassa)', 'de_number', SUM(events.viral_diseases_ebola_marburg_lassa), 'observation', NULL),
                jsonb_build_object('index', 7, 'indicator', 'Méningite', 'de_number', SUM(events.meningitis), 'observation', NULL),
                jsonb_build_object('index', 8, 'indicator', 'Décès maternels', 'de_number', SUM(events.maternal_deaths), 'observation', NULL),
                jsonb_build_object('index', 9, 'indicator', 'Décès communautaires', 'de_number', SUM(events.community_deaths), 'observation', NULL),
                jsonb_build_object('index', 10, 'indicator', 'Fievre grippale', 'de_number', SUM(events.flu_like_fever), 'observation', NULL)
            )
        ) AS diseases_alerts,
        
        jsonb_build_object('id', MAX(r.id), 'name', MAX(r.name), 'phone', MAX(r.phone)) AS reco,
        jsonb_build_object('id', MAX(c.id), 'name', MAX(c.name)) AS country,
        jsonb_build_object('id', MAX(g.id), 'name', MAX(g.name)) AS region,
        jsonb_build_object('id', MAX(p.id), 'name', MAX(p.name)) AS prefecture,
        jsonb_build_object('id', MAX(m.id), 'name', MAX(m.name)) AS commune,
        jsonb_build_object('id', MAX(h.id), 'name', MAX(h.name)) AS hospital,
        jsonb_build_object('id', MAX(d.id), 'name', MAX(d.name)) AS district_quartier,
        jsonb_build_object('id', MAX(v.id), 'name', MAX(v.name)) AS village_secteur
        

    FROM (SELECT * FROM year_month_reco_grid_view WHERE reco_id IS NOT NULL) a
    
        JOIN reco_view r ON r.id = a.reco_id

        LEFT JOIN report_events_view events ON events.reco_id = a.reco_id AND events.month = a.month AND events.year = a.year
        LEFT JOIN report_promotional_view promo ON promo.reco_id = a.reco_id AND promo.month = a.month AND promo.year = a.year
        LEFT JOIN report_adults_view adult ON adult.reco_id = a.reco_id AND adult.month = a.month AND adult.year = a.year
        LEFT JOIN report_vaccination_view vaccin ON vaccin.reco_id = a.reco_id AND vaccin.month = a.month AND vaccin.year = a.year
        LEFT JOIN report_patient_view patient ON patient.reco_id = a.reco_id AND patient.month = a.month AND patient.year = a.year
        LEFT JOIN report_family_view family ON family.reco_id = a.reco_id AND family.month = a.month AND family.year = a.year
        LEFT JOIN report_pcime_view pcime ON pcime.reco_id = a.reco_id AND pcime.month = a.month AND pcime.year = a.year
        LEFT JOIN report_newborn_view newborn ON newborn.reco_id = a.reco_id AND newborn.month = a.month AND newborn.year = a.year
        LEFT JOIN report_pregnant_view pregnant ON pregnant.reco_id = a.reco_id AND pregnant.month = a.month AND pregnant.year = a.year
        LEFT JOIN report_death_view death ON death.reco_id = a.reco_id AND death.month = a.month AND death.year = a.year

        LEFT JOIN delivery_data_view delivery ON delivery.reco_id = a.reco_id AND delivery.month = a.month AND delivery.year = a.year
        LEFT JOIN family_planning_data_view fp ON fp.reco_id = a.reco_id AND fp.month = a.month AND fp.year = a.year AND fp.form IN ('pregnancy_family_planning', 'family_planning') AND fp.has_counseling IS TRUE AND fp.already_use_method IS NOT TRUE

        LEFT JOIN (SELECT DISTINCT reco_id FROM report_all_cover_reco_view) cover ON cover.reco_id = a.reco_id
        LEFT JOIN (SELECT DISTINCT reco_id, month, year FROM reco_chws_supervision_view) rcsv ON rcsv.reco_id = a.reco_id AND rcsv.month = a.month AND rcsv.year = a.year
        LEFT JOIN (SELECT DISTINCT reco_id, month, year FROM report_all_functional_reco_view) fun ON fun.reco_id = a.reco_id AND fun.month = a.month AND fun.year = a.year

        LEFT JOIN country_view c ON r.country_id = c.id 
        LEFT JOIN region_view g ON r.region_id = g.id 
        LEFT JOIN prefecture_view p ON r.prefecture_id = p.id 
        LEFT JOIN commune_view m ON r.commune_id = m.id 
        LEFT JOIN hospital_view h ON r.hospital_id = h.id 
        LEFT JOIN district_quartier_view d ON r.district_quartier_id = d.id 
        LEFT JOIN village_secteur_view v ON r.village_secteur_id = v.id 

    GROUP BY a.reco_id, a.month, a.year;
