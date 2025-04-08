import { RecoVaccinationDashboardDbOutput, RecoPerformanceDashboard, RecoChartPerformanceDashboard, RecoVaccinationDashboard } from "../../models/dashboards";
import { IndicatorsDataOutput } from "../../models/Interfaces";


export async function TransformRecoVaccinationDashboard(reports: RecoVaccinationDashboardDbOutput[]): Promise<IndicatorsDataOutput<RecoVaccinationDashboard[][]> | undefined> {

    if (reports.length > 0) {
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
                const familiesData = r.children_vaccines.sort((a, b) => a.family_name.localeCompare(b.family_name, 'fr', { sensitivity: 'base' }));
                for (const f of familiesData) {
                    if (!(f.family_id in outputMap)) {
                        outputMap[f.family_id] = {};
                    }
                    const childrenData = f.data.sort((a, b) => a.child_name.localeCompare(a.child_name, 'fr', { sensitivity: 'base' }));

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
    return;
}




export async function TransformRecoPerformanceDashboard(recoPerfDashboard: RecoPerformanceDashboard[], chartDashboard: RecoChartPerformanceDashboard[]): Promise<IndicatorsDataOutput<RecoPerformanceDashboard> | undefined> {

    const smDash: Record<string, any> = {
        householdCount: 0,
        patientCount: 0,
        newborn0To2MonthsCount: 0,
        child2To60MonthsCount: 0,
        child5To14YearsCount: 0,
        adultOver14YearsCount: 0,
        consultationCount: 0,
        followupCount: 0,
        allActionsCount: 0,
        lineChart: {
            type: 'line',
            title: 'TOUTES LES ACTIONS DU RECO DE L\'ANNEE',
            absisseLabels: [],
            datasets: []
        },
        barChart: {
            type: 'bar',
            title: 'TENDANCE DES ACTIVITE DU RECO DE L\'ANNEE',
            absisseLabels: [],
            datasets: []
        },
        yearLineChart: {
            type: 'line',
            title: 'TOUTES LES ACTIONS DU RECO DE L\'ANNEE',
            absisseLabels: [],
            datasets: []
        },
        yearBarChart: {
            type: 'bar',
            title: 'TENDANCE DES ACTIVITE DU RECO DE L\'ANNEE',
            absisseLabels: [],
            datasets: []
        }
    }

    const monthByArg = (arg: any): { labelEN: string; labelFR: string; id: string; uid: number } => {
        const monthsList = [
            { labelEN: "January", labelFR: "Janvier", id: "01", uid: 1 },
            { labelEN: "February", labelFR: "Février", id: "02", uid: 2 },
            { labelEN: "March", labelFR: "Mars", id: "03", uid: 3 },
            { labelEN: "April", labelFR: "Avril", id: "04", uid: 4 },
            { labelEN: "May", labelFR: "Mai", id: "05", uid: 5 },
            { labelEN: "June", labelFR: "Juin", id: "06", uid: 6 },
            { labelEN: "July", labelFR: "Juillet", id: "07", uid: 7 },
            { labelEN: "August", labelFR: "Août", id: "08", uid: 8 },
            { labelEN: "September", labelFR: "Septembre", id: "09", uid: 9 },
            { labelEN: "October", labelFR: "Octobre", id: "10", uid: 10 },
            { labelEN: "November", labelFR: "Novembre", id: "11", uid: 11 },
            { labelEN: "December", labelFR: "Décembre", id: "12", uid: 12 },
        ];
        for (const m of monthsList) {
            if (arg == m.labelFR || arg == m.labelEN || arg == m.id || arg == m.uid) {
                return m;
            }
        }
        return { labelEN: '', labelFR: '', id: '', uid: 0 };
    }

    if (chartDashboard.length > 0) {
        for (const r of chartDashboard) {
            smDash.yearLineChart.datasets = r.chart.datasets;
            smDash.yearBarChart.datasets = r.chart.datasets;
            for (let i = 0; i < r.chart.datasets.length; i++) {
                for (let j = 1; j < (r.chart.datasets[i].data as number[]).length; j++) {
                    (r.chart.datasets[i].data as number[])[0] += (r.chart.datasets[i].data as number[])[j];
                }
            }

            for (let i = 0; i < r.chart.datasets.length; i++) {
                for (let j = 1; j < (r.chart.datasets[i].data as number[]).length; j++) {
                    (r.chart.datasets[i].data as number[])[0] += (r.chart.datasets[i].data as number[])[j];
                }
            }
        }

        const ry = chartDashboard[0];
        if (ry) {
            smDash.yearLineChart.absisseLabels = ry.chart.absisseLabels.map(d => monthByArg(d).labelFR);
            smDash.yearBarChart.absisseLabels = ry.chart.absisseLabels.map(d => monthByArg(d).labelFR);
        }
    }

    const exclude = [undefined, null, 'undefined', 'null', '', ' ', '{}'];

    if (recoPerfDashboard.length > 0) {
        // Iterate through recoPerfDashboard and update smDash with data
        for (const r of recoPerfDashboard) {
            smDash.householdCount += (!exclude.includes(`${r.household_count}`) ? parseInt(`${r.household_count}`, 10) : 0);
            smDash.patientCount += (!exclude.includes(`${r.patient_count}`) ? parseInt(`${r.patient_count}`, 10) : 0);
            smDash.newborn0To2MonthsCount += (!exclude.includes(`${r.newborn_less_02_months_count}`) ? parseInt(`${r.newborn_less_02_months_count}`, 10) : 0);
            smDash.child2To60MonthsCount += (!exclude.includes(`${r.child_02_to_60_months_count}`) ? parseInt(`${r.child_02_to_60_months_count}`, 10) : 0);
            smDash.child5To14YearsCount += (!exclude.includes(`${r.child_05_to_14_years_count}`) ? parseInt(`${r.child_05_to_14_years_count}`, 10) : 0);
            smDash.adultOver14YearsCount += (!exclude.includes(`${r.adult_over_14_years_count}`) ? parseInt(`${r.adult_over_14_years_count}`, 10) : 0);
            smDash.consultationCount += (!exclude.includes(`${r.consultation_count}`) ? parseInt(`${r.consultation_count}`, 10) : 0);
            smDash.followupCount += (!exclude.includes(`${r.followup_count}`) ? parseInt(`${r.followup_count}`, 10) : 0);
            smDash.allActionsCount += (!exclude.includes(`${r.all_actions_count}`) ? parseInt(`${r.all_actions_count}`, 10) : 0);

            // Update chart titles and labels
            smDash.lineChart.title = r.linechart.title ?? smDash.lineChart.title;
            smDash.lineChart.absisseLabels = r.linechart.absisseLabels ?? smDash.lineChart.absisseLabels;
            smDash.barChart.title = r.barchart.title ?? smDash.barChart.title;
            smDash.barChart.absisseLabels = r.barchart.absisseLabels ?? smDash.barChart.absisseLabels;

            // Ensure datasets are initialized before modifying them
            while (smDash.lineChart.datasets.length < r.linechart.datasets.length) {
                smDash.lineChart.datasets.push({ data: new Array(r.linechart.absisseLabels.length).fill(0) });
            }

            // Update datasets for lineChart
            for (let i = 0; i < r.linechart.datasets.length; i++) {
                const lineData = r.linechart.datasets[i].data as number[];
                const smLineData = smDash.lineChart.datasets[i].data as number[];

                smLineData[0] = lineData[0];  // Set the first value
                for (let j = 1; j < lineData.length; j++) {
                    smLineData[j] = smLineData[j] ?? 0;  // Ensure no undefined values exist
                    smLineData[j] += lineData[j];
                }
            }

            // Ensure datasets for barChart are initialized before modifying them
            while (smDash.barChart.datasets.length < r.barchart.datasets.length) {
                smDash.barChart.datasets.push({ data: new Array(r.barchart.absisseLabels.length).fill(0) });
            }

            // Update datasets for barChart
            for (let i = 0; i < r.barchart.datasets.length; i++) {
                const barData = r.barchart.datasets[i].data as number[];
                const smBarData = smDash.barChart.datasets[i].data as number[];

                for (let j = 0; j < barData.length; j++) {
                    smBarData[j] = smBarData[j] ?? 0;  // Ensure no undefined values exist
                    smBarData[j] += barData[j];
                }
            }
        }

        const reco_names = recoPerfDashboard.map(r => r.reco).reduce((unique: { id: string, name: string, phone: string }[], r: { id: string, name: string, phone: string } | null) => {
            if (r && !(unique.find(i => i.id === r.id))) {
                unique.push(r);
            }
            return unique;
        }, []);

        const firstReport = recoPerfDashboard[0];

        const outPutReport: IndicatorsDataOutput<RecoPerformanceDashboard> = {
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
            // is_validate: recoPerfDashboard.map(d => d.is_validate).reduce((acc, val) => val !== true ? acc + 1 : acc, 0) === 0,
            // already_on_dhis2: recoPerfDashboard.map(d => d.already_on_dhis2).reduce((acc, val) => val !== true ? acc + 1 : acc, 0) === 0,
            data: smDash as any
        };

        return outPutReport;
    }
    return;
}