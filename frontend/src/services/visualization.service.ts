
import { Visualization, VisualizationStatus, VisualizationState, VisualizationShare, VisualizationDhis2Validation, VisualizationView, VisualizationChart, VisualizationForm } from '@/models/visualization.model';
import { CRUDService } from '@services/acrud.service';


export interface ListWith {
    tenant_id: number;
    type?: string;
    status?: VisualizationStatus;
    state?: VisualizationState;
    search?: string;
    page?: number;
    per_page?: number;
}

const visualizations = new CRUDService("/visualizations");
export const visualizationService = {
    list: (tenant_id: number) => visualizations.all<Visualization>(``, { options: { params: { tenant_id } } }),
    list_with: (prop: ListWith) => visualizations.all<Visualization>(``, { options: { params: { ...prop } } }),
    get: (tenant_id: number, id: number) => visualizations.all<Visualization>(`/${id}`, { options: { params: { tenant_id } } }),
    create: (data: VisualizationForm) => visualizations.create("", data),
    update: (id: number, data: VisualizationForm) => visualizations.update("", id, data),
    remove: (id: number) => visualizations.remove("", id),
    bulkDelete: (tenant_id:number, ids: number[]) => visualizations.post("/bulk-delete", ids, { options: { params: { tenant_id } } }),

    share: (tenant_id: number, viz_id:number) => visualizations.post<VisualizationShare>(`/${viz_id}/share`, { options: { params: { tenant_id } } }),
    dhis2_validate: (tenant_id: number, viz_id:number) => visualizations.post<VisualizationDhis2Validation>(`/${viz_id}/dhis2-validate`, { options: { params: { tenant_id } } }),
    visuals: (tenant_id: number, viz_id:number) => visualizations.post<VisualizationView>(`/${viz_id}/visual`, { options: { params: { tenant_id } } }),
    
}

const visualCharts = new CRUDService("/visualization-charts");
export const visualChartService = {
    list: (tenant_id?: number) => visualCharts.all<VisualizationChart>(``, { options: { params: { tenant_id } } }),
    get: (tenant_id: number, id: number) => visualCharts.all<VisualizationChart>(`/${id}`, { options: { params: { tenant_id } } }),
    create: (data: VisualizationChart) => visualCharts.create("", data),
    update: (id: number, data: VisualizationChart) => visualCharts.update("", id, data),
    remove: (id: number) => visualCharts.remove("", id),

    lineages: () => visualCharts.post<VisualizationShare>(`/data-lineages`, { options: { params: { } } }),
}

// const queries = new CRUDService("/dataset-queries");
// export const queryService = {
//     list: (tenant_id?: number, dataset_id?: number) => queries.all<DatasetQuery>(``, { options: { params: { tenant_id, dataset_id } } }),
//     allWithRelations: (tenant_id?: number, dataset_id?: number) => queries.all<DatasetQuery>(``, { options: { params: { include_relations: true, tenant_id, dataset_id } } }),
//     get: (tenant_id: number, id: number) => queries.all<DatasetQuery>(`/${id}`, { options: { params: { tenant_id } } }),
//     create: (data: DatasetQuery) => queries.create("", data),
//     update: (id: number, data: DatasetQuery) => queries.update("", id, data),
//     remove: (id: number) => queries.remove("", id),
// }

// const charts = new CRUDService("/dataset-charts");
// export const chartService = {
//     list: (tenant_id?: number, dataset_id?: number, query_id?: number) => charts.all<DatasetChart>(``, { options: { params: { tenant_id, dataset_id, query_id } } }),
//     allWithRelations: (tenant_id?: number, dataset_id?: number, query_id?: number) => charts.all<DatasetChart>(``, { options: { params: { include_relations: true, tenant_id, dataset_id, query_id } } }),
//     get: (tenant_id: number, id: number) => charts.all<DatasetChart>(`/${id}`, { options: { params: { tenant_id } } }),
//     execute: (query_id: number, chart: DatasetChart) => charts.post<ExecuteChartResponse>(`/execute/${query_id}`, chart),
//     create: (data: DatasetChart) => charts.create("", data),
//     update: (id: number, data: DatasetChart) => charts.update("", id, data),
//     remove: (id: number) => charts.remove("", id),
// }