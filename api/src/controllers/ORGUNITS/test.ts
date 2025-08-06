
            // const vaccines = await _repoVaccine.findBy({ reco: { id: reco.id }, month: month, year: year, age_in_months: LessThan(60) });
            // const pcimnes = await _repoPcimne.findBy({ reco: { id: reco.id }, month: month, year: year, age_in_months: LessThan(60) });
            // const newborns = await _repoNewborn.findBy({ reco: { id: reco.id }, month: month, year: year, age_in_months: LessThan(60) });
            // const Allfamilies = await _repoFamily.findBy({ reco: { id: reco.id }, month: month, year: year });
            // const families = Allfamilies.filter(p => p.month === month && p.year === year);
            // const AllPatients = await _repoPatient.findBy({ reco: { id: reco.id } });
            // const patients = AllPatients.filter(p => p.month === month && p.year === year);
            // const deaths = await _repoDeath.findBy({ reco: { id: reco.id }, month: month, year: year });
            // const adults = await _repoAdult.findBy({ reco: { id: reco.id }, month: month, year: year });
            // const promotionalsA = await _repoPA.findBy({ reco: { id: reco.id }, month: month, year: year });
            // const events = await _repoEvent.findBy({ reco: { id: reco.id }, month: month, year: year });
            // const pregnants = await _repoPregnant.findBy({ form: IN('pregnancy_family_planning', 'pregnancy_register'), month: month, year: year });
            // const deliveries = await _repoDelivery.findBy({ month: month, year: year });
            // const familyPlannings = await _repoFP.findBy({ month: month, year: year });
            
// de_number: patients.filter(p => getAgeInMonths(p.birth_date) >=0 && getAgeInMonths(p.birth_date) < 12).length,
                    // de_number: await _repoPatient.createQueryBuilder('nbr11')
                    //     .where({
                    //         reco: reco.id,
                    //         month: month,
                    //         year: year,
                    //     })
                    //     .andWhere('(nbr11.age_in_month_on_creation IS NOT NULL AND nbr11.age_in_month_on_creation < 12)')
                    //     .getCount(),



                                    // de_number: patients.filter(p => p.birth_date !==null && getAgeInMonths(p.birth_date) >= 12 && getAgeInMonths(p.birth_date) < 60).length,
                    // de_number: await _repoPatient.createQueryBuilder('p')
                    //     .where({
                    //         reco: reco.id,
                    //         month: month,
                    //         year: year,
                    //     })
                    //     .andWhere('(p.age_in_month_on_creation IS NOT NULL AND p.age_in_month_on_creation >= 12 AND p.age_in_month_on_creation < 60)')
                    //     .getCount(),

                    // de_number: patients.filter(p => p.sex === 'F' && p.birth_date !==null && getAgeInYear(p.birth_date) >= 15 && getAgeInYear(p.birth_date) < 60).length,
                    // de_number: await _repoPatient.createQueryBuilder('p')
                    //     .where({
                    //         reco: reco.id,
                    //         month: month,
                    //         year: year,
                    //         sex: 'F'
                    //     })
                    //     .andWhere('(p.age_in_year_on_creation IS NOT NULL AND p.age_in_year_on_creation >= 15 AND p.age_in_year_on_creation < 50)')
                    //     .getCount(),



                    // de_number: (await Connection.query(`
                    //     SELECT COUNT(*) AS count
                    //     FROM pcimne_data p
                    //     JOIN newborn_data n ON (p.month = n.month AND p.year = n.year)
                    //     WHERE (p.reco_id = $1 OR n.reco_id = $1)
                    //     AND (p.month = $2 OR n.month = $2)
                    //     AND (p.year = $3 OR n.year = $3)
                    //     AND ((p.age_in_months IS NOT NULL AND p.age_in_months < 60) OR (n.age_in_months IS NOT NULL AND n.age_in_months < 60))
                    //     AND (p.has_malnutrition = $4 OR n.has_malnutrition = $4)
                    //     GROUP BY p.patient_id, n.patient_id
                    // `, [reco.id, month, year, true]))[0]?.count || 0,


                    // de_number: await _repoPcimne.createQueryBuilder('childPB')
                    //     .where({
                    //         reco: reco.id,
                    //         month: month,
                    //         year: year,
                    //         has_malnutrition: true
                    //     })
                    //     .andWhere('(childPB.age_in_months IS NOT NULL AND childPB.age_in_months >= 6 AND childPB.age_in_months < 60)')
                    //     .groupBy('childPB.patient')
                    //     .getCount(),



                    // de_number: await _repoPcimne.createQueryBuilder('childPB')
                    //     .where({
                    //         reco: reco.id,
                    //         month: month,
                    //         year: year,
                    //         has_malnutrition: true
                    //     })
                    //     .andWhere('(childPB.age_in_months IS NOT NULL AND childPB.age_in_months >= 6 AND childPB.age_in_months < 60)')
                    //     .groupBy('childPB.patient')
                    //     .getCount(),


                    // de_number: (await Connection.query(`
                    //     SELECT COUNT(*) AS count
                    //     FROM pcimne_data p
                    //     JOIN newborn_data n ON (p.month = n.month AND p.year = n.year)
                    //     WHERE (p.reco_id = $1 OR n.reco_id = $1)
                    //     AND (p.month = $2 OR n.month = $2)
                    //     AND (p.year = $3 OR n.year = $3)
                    //     AND ((p.age_in_months IS NOT NULL AND p.age_in_months < 60) OR (n.age_in_months IS NOT NULL AND n.age_in_months < 60))
                    //     AND (p.has_diarrhea = $4 OR n.has_diarrhea = $4)
                    //     GROUP BY p.patient_id, n.patient_id
                    // `, [reco.id, month, year, true]))[0]?.count || 0,



                    // de_number: (await Connection.query(`
                    //     SELECT COUNT(*) AS count
                    //     FROM pcimne_data p
                    //     WHERE (p.reco_id = $1)
                    //     AND (p.month = $2)
                    //     AND (p.year = $3)
                    //     AND (p.age_in_months IS NOT NULL AND p.age_in_months < 60)
                    //     AND (p.has_diarrhea = $4)
                    //     AND ((p.ors IS NOT NULL AND p.ors > 0) OR (p.zinc IS NOT NULL AND p.zinc > 0))
                    //     GROUP BY p.patient_id
                    // `, [reco.id, month, year, true]))[0]?.count || 0,



                    // de_number: (await Connection.query(`
                    //     SELECT COUNT(*) AS count 
                    //     FROM family f
                    //     JOIN patient p ON (f.id = p.family_id)
                    //     WHERE (f.reco_id = $1)
                    //     AND (f.month = $2)
                    //     AND (f.year = $3)
                    //     AND (f.household_has_good_water_access = $4)
                    //     AND (p.birth_date IS NULL)
                    //     AND (EXTRACT(YEAR FROM AGE(CURRENT_DATE, CAST(p.birth_date AS DATE))) * 12 + 
                    //     EXTRACT(MONTH FROM AGE(CURRENT_DATE, CAST(p.birth_date AS DATE))) IS NOT NULL AND 
                    //     EXTRACT(YEAR FROM AGE(CURRENT_DATE, CAST(p.birth_date AS DATE))) * 12 + 
                    //     EXTRACT(MONTH FROM AGE(CURRENT_DATE, CAST(p.birth_date AS DATE))) < 60)
                    //     GROUP BY f.id
                    // `, [reco.id, month, year, true]))[0]?.count || 0,



                    // de_number: (await Connection.query(`
                    //             SELECT COUNT(*) AS count
                    //             FROM death_data d
                    //             JOIN patient p ON (d.reco_id = p.reco_id AND d.month = p.month AND d.year = p.year)
                    //             WHERE (
                    //                 (p.age_in_month_on_creation >= 0 AND p.age_in_month_on_creation < 60 AND p.is_home_death = true) 
                    //                 OR (d.age_in_months >= 0 AND d.age_in_months < 60 AND d.is_home_death = true)
                    //             )
                    //             AND (d.reco_id = $1 OR p.reco_id = $1)
                    //             AND (d.month = $2 OR p.month = $2)
                    //             AND (d.year = $3 OR p.year = $3)
                    //             GROUP BY d.patient_id, p.id
                    //         `, [reco.id, month, year]))[0]?.count || 0,


                                        // de_number: await _repoDeath
                    //     .createQueryBuilder('death')
                    //     .where('death.has_malaria = :value', { value: true })
                    //     .andWhere('death.reco = :reco', { reco: reco })
                    //     .andWhere('death.month = :month', { month: month })
                    //     .andWhere('death.year = :year', { year: year })
                    //     .andWhere('death.age_in_months IS NOT NULL')
                    //     .andWhere('death.age_in_months < :age', { age: 60 })
                    //     .getCount(),


                                        // de_number: await _repoDeath
                    //     .createQueryBuilder('death')
                    //     .where('death.has_diarrhea = :value', { value: true })
                    //     .andWhere('death.reco = :reco', { reco: reco })
                    //     .andWhere('death.month = :month', { month: month })
                    //     .andWhere('death.year = :year', { year: year })
                    //     .andWhere('death.age_in_months IS NOT NULL')
                    //     .andWhere('death.age_in_months < :age', { age: 60 })
                    //     .getCount(),



                    // de_number: (await Connection.query(`
                    //             SELECT COUNT(*) AS count
                    //             FROM pcimne_data p 
                    //             WHERE (p.reco_id = $1)
                    //             AND (p.month = $2)
                    //             AND (p.year = $3)
                    //             AND (p.age_in_months >= 0 AND p.age_in_months < 60)
                    //             AND (p.has_pneumonia IS NOT NULL OR p.has_cough_cold IS NOT NULL)
                    //             AND (p.has_pneumonia = $4 OR p.has_cough_cold = $4)
                    //             AND (p.amoxicillin_250mg IS NOT NULL OR p.amoxicillin_500mg IS NOT NULL)
                    //             AND (p.amoxicillin_250mg > 0 OR p.amoxicillin_500mg > 0)
                    //             GROUP BY p.patient_id
                    //         `, [reco.id, month, year, true]))[0]?.count || 0,



                    // de_number: (await Connection.query(`
                    //             SELECT COUNT(*) AS count
                    //             FROM pcimne_data p 
                    //             WHERE (p.reco_id = $1)
                    //             AND (p.month = $2)
                    //             AND (p.year = $3)
                    //             AND (p.age_in_months IS NOT NULL AND p.age_in_months < 60)
                    //             AND (p.has_pneumonia IS NOT NULL OR p.has_cough_cold IS NOT NULL)
                    //             AND (p.has_pneumonia = $4 OR p.has_cough_cold = $4)
                    //             AND (p.is_referred IS NOT NULL AND p.is_referred = $4)
                    //             GROUP BY p.patient_id
                    //         `, [reco.id, month, year, true]))[0]?.count || 0,



                    // de_number: await _repoDeath
                    //     .createQueryBuilder('d')
                    //     .where('d.has_cough_cold = :value OR d.has_pneumonia = :value', { value: true })
                    //     .andWhere('d.reco = :reco', { reco: reco })
                    //     .andWhere('d.month = :month', { month: month })
                    //     .andWhere('d.year = :year', { year: year })
                    //     .andWhere('d.age_in_months IS NOT NULL')
                    //     .andWhere('d.age_in_months < :age', { age: 60 })
                    //     .getCount(),



                    // de_number: (await Connection.query(`
                    //             SELECT SUM(p.men_number) AS count
                    //             FROM promotional_activity_data p 
                    //             WHERE (p.reco_id = $1)
                    //             AND (p.month = $2)
                    //             AND (p.year = $3)
                    //             AND (p.is_vad_method IS NOT NULL AND p.is_vad_method = $4)
                    //         `, [reco.id, month, year, true]))[0]?.count || 0,




                    // de_number: (await Connection.query(`
                    //             SELECT SUM(p.women_number) AS count
                    //             FROM promotional_activity_data p 
                    //             WHERE (p.reco_id = $1)
                    //             AND (p.month = $2)
                    //             AND (p.year = $3)
                    //             AND (p.is_vad_method IS NOT NULL AND p.is_vad_method = $4)
                    //         `, [reco.id, month, year, true]))[0]?.count || 0,



                                        // de_number: (await Connection.query(`
                    //             SELECT SUM(p.men_number) AS count
                    //             FROM promotional_activity_data p 
                    //             WHERE (p.reco_id = $1)
                    //             AND (p.month = $2)
                    //             AND (p.year = $3)
                    //             AND (p.is_talk_method IS NOT NULL AND p.is_talk_method = $4)
                    //         `, [reco.id, month, year, true]))[0]?.count || 0,


                                        // de_number: (await Connection.query(`
                    //             SELECT SUM(p.women_number) AS count
                    //             FROM promotional_activity_data p  
                    //             WHERE (p.reco_id = $1)
                    //             AND (p.month = $2)
                    //             AND (p.year = $3)
                    //             AND (p.is_talk_method IS NOT NULL AND p.is_talk_method = $4)
                    //         `, [reco.id, month, year, true]))[0]?.count || 0,