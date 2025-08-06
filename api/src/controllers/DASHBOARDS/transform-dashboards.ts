import { RecoVaccinationDashboardDbOutput, RecoPerformanceDashboardDbOutput, RecoVaccinationDashboard, ActiveRecoDashboardDbOutput, ActiveRecoDashboard, ActiveRecoRecord, ActiveRecoTotal, RecoPerformanceDashboard, RecoPerformanceDashboardTotal, RecoPerformanceDashboardFullYearDbOutput, RecoPerformanceDashboardUtils, RecoTasksStateDashboardDbOutput, RecoTasksStateDashboard, RecoTasksStateDashboardUtils } from "../../models/dashboards";
import { IndicatorsDataOutput } from "../../models/Interfaces";


export async function TransformRecoVaccinationDashboard(reports: RecoVaccinationDashboardDbOutput[]): Promise<IndicatorsDataOutput<RecoVaccinationDashboard[][]> | undefined> {

    if (reports.length == 0) return;
    const reco_names = reports.map(r => r.reco).reduce((unique: { id: string, name: string, phone: string }[], r: { id: string, name: string, phone: string } | null) => {
        if (r && !(unique.find(i => i.id === r.id))) {
            unique.push(r);
        }
        return unique;
    }, []);

    const transformData = (initialData: RecoVaccinationDashboardDbOutput[]): RecoVaccinationDashboard[][] => {
        let outputMap: { [key1: string]: { [key2: string]: RecoVaccinationDashboard } } = {};
        let results: RecoVaccinationDashboard[][] = [];

        for (const r of initialData) {
            const familiesData = (r.children_vaccines?.sort((a, b) => a.family_name.localeCompare(b.family_name, 'fr', { sensitivity: 'base' }))) ?? [];
            for (const f of familiesData) {
                if (!(f.family_id in outputMap)) {
                    outputMap[f.family_id] = {};
                }
                const childrenData = (f.data?.sort((a, b) => a.child_name.localeCompare(a.child_name, 'fr', { sensitivity: 'base' }))) ?? [];

                for (const c of childrenData) {
                    if (!(c.child_id in outputMap[f.family_id])) {
                        outputMap[f.family_id][c.child_id] = c;
                    } else {
                        const len1 = Object.values(outputMap[f.family_id][c.child_id]).filter(v => v === true).length;
                        const len2 = Object.values(c).filter(v => v === true).length;
                        if (len2 > len1) outputMap[f.family_id][c.child_id] = c;
                    }
                }
            }
        }

        for (const family of Object.values(outputMap)) {
            let out: RecoVaccinationDashboard[] = [];
            for (const child of Object.values(family)) {
                out.push(child);
            }
            results.push(out);
        }

        return results;
    }

    // Exemple d'utilisation :
    const outputData = transformData(reports);

    const firstReport = reports[0];

    const outPutReport: IndicatorsDataOutput<RecoVaccinationDashboard[][]> = {
        country: firstReport.country,
        region: firstReport.region,
        prefecture: firstReport.prefecture,
        commune: firstReport.commune,
        hospital: firstReport.hospital,
        district_quartier: firstReport.district_quartier,
        // chw: firstReport.chw,
        village_secteur: firstReport.village_secteur,
        reco: reco_names.length !== 1 ? null : reco_names[0],
        reco_asc_type: reco_names.length !== 1 ? 'ASC' : 'RECO',
        // is_validate: uniqueData.map(d => d.is_validate).reduce((acc, val) => val !== true ? acc + 1 : acc, 0) === 0,
        // already_on_dhis2: uniqueData.map(d => d.already_on_dhis2).reduce((acc, val) => val !== true ? acc + 1 : acc, 0) === 0,
        data: outputData
    };

    return outPutReport;

}


export async function TransformRecoPerformanceDashboard(reports1: RecoPerformanceDashboardDbOutput[], reports2: RecoPerformanceDashboardFullYearDbOutput[]): Promise<IndicatorsDataOutput<RecoPerformanceDashboard> | undefined> {
    const createEmptyMetrics = (): RecoPerformanceDashboardTotal => ({
        family_count: 0,
        patient_count: 0,

        adult_data_count: { consultation: 0, followup: 0, total: 0 },
        family_planning_data_count: { consultation: 0, followup: 0, total: 0 },
        newborn_data_count: { consultation: 0, followup: 0, total: 0 },
        pcimne_data_count: { consultation: 0, followup: 0, total: 0 },
        pregnant_data_count: { consultation: 0, followup: 0, total: 0 },
        all_consultation_followup_count: { consultation: 0, followup: 0, total: 0 },

        referal_data_count: 0,
        delivery_data_count: 0,
        events_data_count: 0,
        promotional_data_count: 0,
        death_data_count: 0,
        all_actions_count: 0,
    });

    const excludedValues = [undefined, null, 'undefined', 'null', '', ' ', '{}'];

    const parseToInt = (value: any): number => {
        return excludedValues.includes(value) ? 0 : parseInt(value, 10) || 0;
    };

    if (reports1.length === 0) return;

    const singleValueMetrics: string[] = [
        'family_count',
        'patient_count',
        'referal_data_count',
        'delivery_data_count',
        'events_data_count',
        'promotional_data_count',
        'death_data_count',
        'all_actions_count',
    ];

    const complexMetrics: string[] = [
        'adult_data_count',
        'family_planning_data_count',
        'newborn_data_count',
        'pcimne_data_count',
        'pregnant_data_count',
        'all_consultation_followup_count'
    ];

    const yearlyMetrics: string[] = [
        'adult_data_count',
        'family_planning_data_count',
        'newborn_data_count',
        'pcimne_data_count',
        'pregnant_data_count',
        'referal_data_count',
        'delivery_data_count',
        'events_data_count',
        'promotional_data_count',
        'death_data_count',
    ];

    const getMonthLabel = (month: string): string => {
        return {
            '01': 'JAN', '02': 'FEV', '03': 'MAR', '04': 'AVR',
            '05': 'MAI', '06': 'JUI', '07': 'JUL', '08': 'AOU',
            '09': 'SEP', '10': 'OCT', '11': 'NOV', '12': 'DEC'
        }[month] ?? ''
    }




    const generateRandomColors = (numberOfColors: number): string[] => {
        const colors: string[] = [];
        const MOD = 16777216; // 24-bit color space (hex RGB)
        const MULTIPLIER = 2654435761; // Knuth's multiplicative hash constant

        for (let i = 1; i <= numberOfColors; i++) {
            const seed = (i * MULTIPLIER) % MOD;
            const hex = seed.toString(16).padStart(6, '0');
            colors.push('#' + hex);
        }
        return colors;
    }

    const performanceByReco: Record<string, RecoPerformanceDashboardDbOutput> = {};
    const yearDatas: Record<string, RecoPerformanceDashboardUtils> = {};
    const total = createEmptyMetrics();

    // Agrégation des données mensuelles
    for (const report1 of reports1) {
        const recoId = report1.reco.id;

        if (!performanceByReco[recoId]) {
            performanceByReco[recoId] = { ...createEmptyMetrics(), ...report1 };
        }

        const target = performanceByReco[recoId];

        for (const key of singleValueMetrics) {
            const value = parseToInt((report1 as any)[key]);
            (target as any)[key] = parseToInt((target as any)[key]) + value;
            (total as any)[key] = parseToInt((total as any)[key]) + value;
        }

        for (const key of complexMetrics) {
            for (const subKey of ['consultation', 'followup', 'total']) {
                const value = parseToInt((report1 as any)[key][subKey]);
                (target as any)[key][subKey] = parseToInt((target as any)[key][subKey]) + value;
                (total as any)[key][subKey] = parseToInt((total as any)[key][subKey]) + value;
            }
        }
    }

    const colors = generateRandomColors(yearlyMetrics.length);


    // Agrégation des données annuelles
    for (const report2 of reports2) {
        const recoId = report2.reco.id;

        const lineChart: RecoPerformanceDashboardUtils = {
            type: 'line',
            title: 'TOUTES LES ACTIONS DU RECO' + report2.reco.name + ' DE L\'ANNEE',
            absisseLabels: [],
            datasets: []
        }
        const labelsSet = new Set<string>();

        for (let index = 0; index < yearlyMetrics.length; index++) {
            const metric = yearlyMetrics[index];
            const label = (report2 as any)[metric]?.label ?? metric;
            const color = colors[index] //(report2 as any)[metric]?.color ?? '#000';
            const metricData = (report2 as any)[metric]?.data ?? {};

            const sortedKeys = Object.keys(metricData).sort((a, b) => parseToInt(a) - parseToInt(b));
            const dataPoints = sortedKeys.map(month => metricData[month]);
            sortedKeys.forEach(m => labelsSet.add(getMonthLabel(m)));

            lineChart.datasets.push({
                label,
                backgroundColor: color,
                borderColor: color,
                data: dataPoints
            });
        }

        lineChart.absisseLabels = Array.from(labelsSet);
        yearDatas[recoId] = lineChart
    }

    const data: RecoPerformanceDashboard = {
        performances: Object.values(performanceByReco),
        yearDatas,
        total,
    };

    const uniqueRecoList = reports1
        .map(r => r.reco)
        .filter((r, index, self) => r && self.findIndex(i => i.id === r.id) === index);

    const firstReport = reports1[0];

    const output: IndicatorsDataOutput<RecoPerformanceDashboard> = {
        country: firstReport.country,
        region: firstReport.region,
        prefecture: firstReport.prefecture,
        commune: firstReport.commune,
        hospital: firstReport.hospital,
        district_quartier: firstReport.district_quartier,
        village_secteur: firstReport.village_secteur,
        reco: uniqueRecoList.length === 1 ? uniqueRecoList[0] : null,
        reco_asc_type: uniqueRecoList.length === 1 ? 'RECO' : 'ASC',
        data,
    };

    return output;
}



export async function TransformActiveRecoDashboard(reports: ActiveRecoDashboardDbOutput[]): Promise<IndicatorsDataOutput<ActiveRecoDashboard> | undefined> {

    if (reports.length == 0) return;

    const reco_names = reports.map(r => r.reco).reduce((unique: { id: string, name: string, phone: string }[], r: { id: string, name: string, phone: string } | null) => {
        if (r && !(unique.find(i => i.id === r.id))) {
            unique.push(r);
        }
        return unique;
    }, []);

    // Initialisation du total
    const initMonthData = () => ({ cover: 0, supervised: 0, fonctionnal: 0 });

    const months: (keyof ActiveRecoTotal)[] = ['jan', 'fev', 'mar', 'avr', 'mai', 'jui', 'jul', 'aou', 'sep', 'oct', 'nov', 'dec'];

    const transformData = (data: ActiveRecoDashboardDbOutput[]): ActiveRecoDashboard => {
        const chwsMap: Record<string, ActiveRecoRecord> = {}

        const total: ActiveRecoTotal = {} as any;
        for (const d of data) {
            const chwId = d.chw.id;
            if (!(chwId in chwsMap)) {
                chwsMap[chwId] = {
                    ...d.chw,
                    country: d.country,
                    region: d.region,
                    prefecture: d.prefecture,
                    commune: d.commune,
                    hospital: d.hospital,
                    district_quartier: d.district_quartier,
                    recos: []
                };
            }

            const fullData: any = {};

            // Agrégation dans le total
            for (const m of months) {
                if (!(m in total)) total[m] = initMonthData()

                total[m].cover += (d[m]?.cover ? 1 : 0);
                total[m].supervised += (d[m]?.supervised ? 1 : 0);
                total[m].fonctionnal += (d[m]?.fonctionnal ? 1 : 0);
                fullData[m] = d[m];
            }

            const recoEntry = {
                ...d.reco,
                ...fullData,
                village_secteur: d.village_secteur
            }

            chwsMap[chwId].recos.push(recoEntry);
        }

        return { record: Object.values(chwsMap), total };
    }

    const outputData = transformData(reports);

    const firstReport = reports[0];

    const outPutReport: IndicatorsDataOutput<ActiveRecoDashboard> = {
        country: firstReport.country,
        region: firstReport.region,
        prefecture: firstReport.prefecture,
        commune: firstReport.commune,
        hospital: firstReport.hospital,
        district_quartier: firstReport.district_quartier,
        // chw: firstReport.chw,
        village_secteur: firstReport.village_secteur,
        reco: reco_names.length !== 1 ? null : reco_names[0],
        reco_asc_type: reco_names.length !== 1 ? 'ASC' : 'RECO',
        // is_validate: uniqueData.map(d => d.is_validate).reduce((acc, val) => val !== true ? acc + 1 : acc, 0) === 0,
        // already_on_dhis2: uniqueData.map(d => d.already_on_dhis2).reduce((acc, val) => val !== true ? acc + 1 : acc, 0) === 0,
        data: outputData
    };

    return outPutReport;

}



export async function TransformRecoTasksStateDashboard(reports: RecoTasksStateDashboardDbOutput[]): Promise<IndicatorsDataOutput<RecoTasksStateDashboard[]> | undefined> {

    if (reports.length == 0) return;

    const reco_names = reports.map(r => r.reco).reduce((unique: { id: string, name: string, phone: string }[], r: { id: string, name: string, phone: string } | null) => {
        if (r && !(unique.find(i => i.id === r.id))) {
            unique.push(r);
        }
        return unique;
    }, []);

    const transformData = (data: RecoTasksStateDashboardDbOutput[]): RecoTasksStateDashboard[] => {
        const recoMap: Record<string, {
            id: string;
            name: string;
            phone: string;
            code: string;
            external_id: string;
            chw: any;
            village_secteur: any;
            families: Record<string, {
                id: string;
                name: string;
                given_name: string;
                external_id: string;
                code: string;
                patients: Record<string, {
                    id: string;
                    name: string;
                    external_id: string;
                    code: string;
                    data: Record<string, RecoTasksStateDashboardUtils>;
                }>
            }>
        }> = {};

        for (const item of data) {
            const recoId = item.reco.id;

            if (!recoMap[recoId]) {
                recoMap[recoId] = {
                    id: item.reco.id,
                    name: item.reco.name,
                    phone: item.reco.phone,
                    code: item.reco.code,
                    external_id: item.reco.external_id,
                    chw: item.chw,
                    village_secteur: item.village_secteur,
                    families: {}
                };
            }

            const reco = recoMap[recoId];

            for (const taskList of Object.values(item.state_data)) {
                for (const task of taskList) {
                    const familyId = task.family_id;
                    const patientId = task.patient_id;

                    if (!reco.families[familyId]) {
                        reco.families[familyId] = {
                            id: task.family_id,
                            name: task.family_name,
                            given_name: task.family_given_name,
                            external_id: task.family_external_id,
                            code: task.family_code,
                            patients: {}
                        };
                    }

                    const family = reco.families[familyId];

                    if (!family.patients[patientId]) {
                        family.patients[patientId] = {
                            id: task.patient_id,
                            name: task.patient_name,
                            external_id: task.patient_external_id,
                            code: task.patient_code,
                            data: {}
                        };
                    }

                    const dataId = `${task.patient_id}-${task.form}`

                    family.patients[patientId].data[dataId] = task;
                }
            }
        }

        // Convert map structure to array
        return Object.values(recoMap).map(reco => ({
            id: reco.id,
            name: reco.name,
            phone: reco.phone,
            code: reco.code,
            external_id: reco.external_id,
            chw: reco.chw,
            village_secteur: reco.village_secteur,
            families: Object.values(reco.families).map(family => ({
                id: family.id,
                name: family.name,
                given_name: family.given_name,
                external_id: family.external_id,
                code: family.code,
                patients: Object.values(family.patients).map(patient => ({
                    id: patient.id,
                    name: patient.name,
                    external_id: patient.external_id,
                    code: patient.code,
                    data: Object.values(patient.data)
                }))
            }))
        }));
    };


    // const transformData = (data: RecoTasksStateDashboardDbOutput[]):RecoTasksStateDashboard => {

    //     const recos: Record<string, { id: string, name: string, phone: string, village_secteur: any, data: RecoTasksStateDashboardUtils[] }> = {};
    //     const finalRecos: Record<
    //     string, { 
    //         id: string, 
    //         name: string, 
    //         phone: string, 
    //         village_secteur: any, 
    //         data: Record<
    //             string, { 
    //                 id: string, 
    //                 name: string, 
    //                 given_name: string,
    //                 external_id: string, 
    //                 code: any, 
    //                 data: Record<
    //                     string, { 
    //                         id: string, 
    //                         name: string, 
    //                         external_id: string, 
    //                         code: any, 
    //                         data: RecoTasksStateDashboardUtils[] }> }> }> = {};

    //     for (const d of data) {
    //         const recoId = d.reco.id;
    //         if (!(recoId in recos)) {
    //             recos[recoId] = {
    //                 id: d.reco.id,
    //                 name: d.reco.name,
    //                 phone: d.reco.phone,
    //                 village_secteur: d.village_secteur,
    //                 data: []
    //             }
    //         }

    //         for (const p of Object.values(d.state_data)) {
    //             (recos[recoId].data).push(...p)
    //         }
    //     }

    //     for (const r of Object.values(recos)) {
    //         const recoId = r.id;
    //         if (!(recoId in finalRecos)) {
    //             finalRecos[recoId] = {
    //                 id: recoId,
    //                 name: r.name,
    //                 phone: r.phone,
    //                 village_secteur: r.village_secteur,
    //                 data: {}
    //             }
    //         }

    //         for (const p of r.data) {
    //             const familyId = p.family_id;
    //             const patientId = p.patient_id;
    //             if (!(familyId in finalRecos[recoId].data)) {
    //                 finalRecos[recoId].data[familyId] = {
    //                     id: p.family_id,
    //                     name: p.family_name,
    //                     given_name: p.family_given_name,
    //                     external_id: p.family_external_id,
    //                     code: p.family_code,
    //                     data: {}
    //                 }
    //             }

    //             if (!(patientId in finalRecos[recoId].data[familyId].data)) {
    //                 finalRecos[recoId].data[familyId].data[patientId] = {
    //                     id: p.patient_id,
    //                     name: p.patient_name,
    //                     external_id: p.patient_external_id,
    //                     code: p.patient_code,
    //                     data: []
    //                 }
    //             }

    //             finalRecos[recoId].data[familyId].data[patientId].data.push(p)
    //         }
    //     }


    //     return finalRecos
    // }

    const outputData = transformData(reports);

    const firstReport = reports[0];

    const outPutReport: IndicatorsDataOutput<RecoTasksStateDashboard[]> = {
        country: firstReport.country,
        region: firstReport.region,
        prefecture: firstReport.prefecture,
        commune: firstReport.commune,
        hospital: firstReport.hospital,
        district_quartier: firstReport.district_quartier,
        // chw: firstReport.chw,
        village_secteur: firstReport.village_secteur,
        reco: reco_names.length !== 1 ? null : reco_names[0],
        reco_asc_type: reco_names.length !== 1 ? 'ASC' : 'RECO',
        // is_validate: uniqueData.map(d => d.is_validate).reduce((acc, val) => val !== true ? acc + 1 : acc, 0) === 0,
        // already_on_dhis2: uniqueData.map(d => d.already_on_dhis2).reduce((acc, val) => val !== true ? acc + 1 : acc, 0) === 0,
        data: outputData
    };

    return outPutReport;
}






// export async function TransformRecoPerformanceDashboard(recoPerfDashboard: RecoPerformanceDashboard[], chartDashboard: RecoChartPerformanceDashboard[]): Promise<IndicatorsDataOutput<RecoPerformanceDashboard> | undefined> {

//     const smDash: Record<string, any> = {
//         householdCount: 0,
//         patientCount: 0,
//         newborn0To2MonthsCount: 0,
//         child2To60MonthsCount: 0,
//         child5To14YearsCount: 0,
//         adultOver14YearsCount: 0,
//         consultationCount: 0,
//         followupCount: 0,
//         allActionsCount: 0,
//         lineChart: {
//             type: 'line',
//             title: 'TOUTES LES ACTIONS DU RECO DE L\'ANNEE',
//             absisseLabels: [],
//             datasets: []
//         },
//         barChart: {
//             type: 'bar',
//             title: 'TENDANCE DES ACTIVITE DU RECO DE L\'ANNEE',
//             absisseLabels: [],
//             datasets: []
//         },
//         yearLineChart: {
//             type: 'line',
//             title: 'TOUTES LES ACTIONS DU RECO DE L\'ANNEE',
//             absisseLabels: [],
//             datasets: []
//         },
//         yearBarChart: {
//             type: 'bar',
//             title: 'TENDANCE DES ACTIVITE DU RECO DE L\'ANNEE',
//             absisseLabels: [],
//             datasets: []
//         }
//     }

//     const monthByArg = (arg: any): { labelEN: string; labelFR: string; id: string; uid: number } => {
//         const monthsList = [
//             { labelEN: "January", labelFR: "Janvier", id: "01", uid: 1 },
//             { labelEN: "February", labelFR: "Février", id: "02", uid: 2 },
//             { labelEN: "March", labelFR: "Mars", id: "03", uid: 3 },
//             { labelEN: "April", labelFR: "Avril", id: "04", uid: 4 },
//             { labelEN: "May", labelFR: "Mai", id: "05", uid: 5 },
//             { labelEN: "June", labelFR: "Juin", id: "06", uid: 6 },
//             { labelEN: "July", labelFR: "Juillet", id: "07", uid: 7 },
//             { labelEN: "August", labelFR: "Août", id: "08", uid: 8 },
//             { labelEN: "September", labelFR: "Septembre", id: "09", uid: 9 },
//             { labelEN: "October", labelFR: "Octobre", id: "10", uid: 10 },
//             { labelEN: "November", labelFR: "Novembre", id: "11", uid: 11 },
//             { labelEN: "December", labelFR: "Décembre", id: "12", uid: 12 },
//         ];
//         for (const m of monthsList) {
//             if (arg == m.labelFR || arg == m.labelEN || arg == m.id || arg == m.uid) {
//                 return m;
//             }
//         }
//         return { labelEN: '', labelFR: '', id: '', uid: 0 };
//     }

//     if (chartDashboard.length > 0) {
//         for (const r of chartDashboard) {
//             smDash.yearLineChart.datasets = r.chart.datasets;
//             smDash.yearBarChart.datasets = r.chart.datasets;
//             for (let i = 0; i < r.chart.datasets.length; i++) {
//                 for (let j = 1; j < (r.chart.datasets[i].data as number[]).length; j++) {
//                     (r.chart.datasets[i].data as number[])[0] += (r.chart.datasets[i].data as number[])[j];
//                 }
//             }

//             for (let i = 0; i < r.chart.datasets.length; i++) {
//                 for (let j = 1; j < (r.chart.datasets[i].data as number[]).length; j++) {
//                     (r.chart.datasets[i].data as number[])[0] += (r.chart.datasets[i].data as number[])[j];
//                 }
//             }
//         }

//         const ry = chartDashboard[0];
//         if (ry) {
//             smDash.yearLineChart.absisseLabels = ry.chart.absisseLabels.map(d => monthByArg(d).labelFR);
//             smDash.yearBarChart.absisseLabels = ry.chart.absisseLabels.map(d => monthByArg(d).labelFR);
//         }
//     }

//     const exclude = [undefined, null, 'undefined', 'null', '', ' ', '{}'];

//     if (recoPerfDashboard.length > 0) {
//         // Iterate through recoPerfDashboard and update smDash with data
//         for (const r of recoPerfDashboard) {
//             smDash.householdCount += (!exclude.includes(`${r.household_count}`) ? parseInt(`${r.household_count}`, 10) : 0);
//             smDash.patientCount += (!exclude.includes(`${r.patient_count}`) ? parseInt(`${r.patient_count}`, 10) : 0);
//             smDash.newborn0To2MonthsCount += (!exclude.includes(`${r.newborn_less_02_months_count}`) ? parseInt(`${r.newborn_less_02_months_count}`, 10) : 0);
//             smDash.child2To60MonthsCount += (!exclude.includes(`${r.child_02_to_60_months_count}`) ? parseInt(`${r.child_02_to_60_months_count}`, 10) : 0);
//             smDash.child5To14YearsCount += (!exclude.includes(`${r.child_05_to_14_years_count}`) ? parseInt(`${r.child_05_to_14_years_count}`, 10) : 0);
//             smDash.adultOver14YearsCount += (!exclude.includes(`${r.adult_over_14_years_count}`) ? parseInt(`${r.adult_over_14_years_count}`, 10) : 0);
//             smDash.consultationCount += (!exclude.includes(`${r.consultation_count}`) ? parseInt(`${r.consultation_count}`, 10) : 0);
//             smDash.followupCount += (!exclude.includes(`${r.followup_count}`) ? parseInt(`${r.followup_count}`, 10) : 0);
//             smDash.allActionsCount += (!exclude.includes(`${r.all_actions_count}`) ? parseInt(`${r.all_actions_count}`, 10) : 0);

//             // Update chart titles and labels
//             smDash.lineChart.title = r.linechart.title ?? smDash.lineChart.title;
//             smDash.lineChart.absisseLabels = r.linechart.absisseLabels ?? smDash.lineChart.absisseLabels;
//             smDash.barChart.title = r.barchart.title ?? smDash.barChart.title;
//             smDash.barChart.absisseLabels = r.barchart.absisseLabels ?? smDash.barChart.absisseLabels;

//             // Ensure datasets are initialized before modifying them
//             while (smDash.lineChart.datasets.length < r.linechart.datasets.length) {
//                 smDash.lineChart.datasets.push({ data: new Array(r.linechart.absisseLabels.length).fill(0) });
//             }

//             // Update datasets for lineChart
//             for (let i = 0; i < r.linechart.datasets.length; i++) {
//                 const lineData = r.linechart.datasets[i].data as number[];
//                 const smLineData = smDash.lineChart.datasets[i].data as number[];

//                 smLineData[0] = lineData[0];  // Set the first value
//                 for (let j = 1; j < lineData.length; j++) {
//                     smLineData[j] = smLineData[j] ?? 0;  // Ensure no undefined values exist
//                     smLineData[j] += lineData[j];
//                 }
//             }

//             // Ensure datasets for barChart are initialized before modifying them
//             while (smDash.barChart.datasets.length < r.barchart.datasets.length) {
//                 smDash.barChart.datasets.push({ data: new Array(r.barchart.absisseLabels.length).fill(0) });
//             }

//             // Update datasets for barChart
//             for (let i = 0; i < r.barchart.datasets.length; i++) {
//                 const barData = r.barchart.datasets[i].data as number[];
//                 const smBarData = smDash.barChart.datasets[i].data as number[];

//                 for (let j = 0; j < barData.length; j++) {
//                     smBarData[j] = smBarData[j] ?? 0;  // Ensure no undefined values exist
//                     smBarData[j] += barData[j];
//                 }
//             }
//         }

//         const reco_names = recoPerfDashboard.map(r => r.reco).reduce((unique: { id: string, name: string, phone: string }[], r: { id: string, name: string, phone: string } | null) => {
//             if (r && !(unique.find(i => i.id === r.id))) {
//                 unique.push(r);
//             }
//             return unique;
//         }, []);

//         const firstReport = recoPerfDashboard[0];

//         const outPutReport: IndicatorsDataOutput<RecoPerformanceDashboard> = {
//             country: firstReport.country,
//             region: firstReport.region,
//             prefecture: firstReport.prefecture,
//             commune: firstReport.commune,
//             hospital: firstReport.hospital,
//             district_quartier: firstReport.district_quartier,
//             // chw: firstReport.chw,
//             village_secteur: firstReport.village_secteur,
//             reco: reco_names.length !== 1 ? null : reco_names[0],
//             reco_asc_type: reco_names.length !== 1 ? 'ASC' : 'RECO',
//             // is_validate: recoPerfDashboard.map(d => d.is_validate).reduce((acc, val) => val !== true ? acc + 1 : acc, 0) === 0,
//             // already_on_dhis2: recoPerfDashboard.map(d => d.already_on_dhis2).reduce((acc, val) => val !== true ? acc + 1 : acc, 0) === 0,
//             data: smDash as any
//         };

//         return outPutReport;
//     }
//     return;
// }