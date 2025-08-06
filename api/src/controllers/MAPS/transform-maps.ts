import { RecoDataMaps, RecoDataMapsDbOutput } from "../../models/maps";
import { IndicatorsDataOutput } from "../../models/Interfaces";


export async function TransformRecoDataMaps(reports: RecoDataMapsDbOutput[]): Promise<IndicatorsDataOutput<{ withMap: RecoDataMaps[], withoutMap: RecoDataMaps[] }> | undefined> {

    if (reports.length > 0) {
        const reco_names = reports.map(r => r.reco).reduce((unique: { id: string, name: string, phone: string }[], r: { id: string, name: string, phone: string } | null) => {
            if (r && !(unique.find(i => i.id === r.id))) {
                unique.push(r);
            }
            return unique;
        }, []);

        const transformData = (initialData: RecoDataMapsDbOutput[]): { withMap: RecoDataMaps[], withoutMap: RecoDataMaps[] } => {
            let withMap: RecoDataMaps[] = [];
            let withoutMap: RecoDataMaps[] = [];

            for (const r of initialData) {
                if (r.latitude && r.longitude) {
                    withMap.push(r);
                } else {
                    withoutMap.push(r);
                }
            }

            return { withMap, withoutMap };
        }

        // Exemple d'utilisation :
        const outputData = transformData(reports);

        const firstReport = reports[0];

        const outPutReport: IndicatorsDataOutput<{ withMap: RecoDataMaps[], withoutMap: RecoDataMaps[] }> = {
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
