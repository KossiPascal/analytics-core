import { Dataset, DatasetChart, DatasetColumn, DatasetField, DatasetQuery, ExecuteChartResponse, SqlWithUtils } from '@/models/dataset.models';
import { CRUDService } from '@services/acrud.service';


const datasets = new CRUDService("/datasets");
export const datasetService = {
    full: (tenant_id?: number) => datasets.all<Dataset>(""),
    all: (tenant_id?: number) => {
        if (!tenant_id) throw Error("tenant_id is required");
        return datasets.all<Dataset>(`/${tenant_id}`);
    },
    allWithRelations: (tenant_id: number) => {
        if (!tenant_id) throw Error("tenant_id is required");
        return datasets.all<Dataset>(`/${tenant_id}`, { options: { params: { include_relations: true } } })
    },
    getLocalViews: () => datasets.get<{ name: string, type: string }[]>("/local-views"),
    getViewSql: (view_name: string, sql_type: string) => datasets.get<SqlWithUtils>(`/view-sql/${view_name}/${sql_type}`),

    getOne: (tenant_id: number, id: number) => {
        if (!tenant_id) throw Error("tenant_id is required");
        return datasets.all<Dataset>(`/${tenant_id}/${id}`)
    },
    create: (data: Dataset) => datasets.create("", data),
    update: (id: number, data: Dataset) => datasets.update("", id, data),
    remove: (id: number) => datasets.remove("", id),
}

const fields = new CRUDService("/dataset-fields");
export const fieldService = {
    full: (tenant_id?: number) => fields.all<DatasetField>(`/${tenant_id}`),
    all: (tenant_id?: number, dataset_id?: number) => {
        if (!tenant_id) throw Error("tenant_id is required");
        return fields.all<DatasetField>(`/${tenant_id}/${dataset_id}`);
    },
    allWithRelations: (tenant_id?: number, dataset_id?: number) => {
        if (!tenant_id) throw Error("tenant_id is required");
        return fields.all<DatasetField>(`/${tenant_id}/${dataset_id}`, { options: { params: { include_relations: true } } })
    },
    getOne: (tenant_id: number, id: number) => {
        if (!tenant_id) throw Error("tenant_id is required");
        return fields.all<DatasetField>(`/${tenant_id}/${id}`)
    },
    create: (data: DatasetField) => fields.create("", data),
    update: (id: number, data: DatasetField) => fields.update("", id, data),
    remove: (id: number) => fields.remove("", id),
}

const queries = new CRUDService("/dataset-queries");
export const queryService = {
    full: (tenant_id?: number) => queries.all<DatasetQuery>(`/${tenant_id}`),
    all: (tenant_id?: number, dataset_id?: number) => {
        if (!tenant_id) throw Error("tenant_id is required");
        return queries.all<DatasetQuery>(`/${tenant_id}/${dataset_id}`);
    },
    allWithRelations: (tenant_id?: number, dataset_id?: number) => {
        if (!tenant_id) throw Error("tenant_id is required");
        return queries.all<DatasetQuery>(`/${tenant_id}/${dataset_id}`, { options: { params: { include_relations: true } } })
    },
    getOne: (tenant_id: number, id: number) => {
        if (!tenant_id) throw Error("tenant_id is required");
        return queries.all<DatasetQuery>(`/${tenant_id}/${id}`)
    },
    create: (data: DatasetQuery) => queries.create("", data),
    update: (id: number, data: DatasetQuery) => queries.update("", id, data),
    remove: (id: number) => queries.remove("", id),
}

const charts = new CRUDService("/dataset-charts");
export const chartService = {
    full: (tenant_id?: number) => {
        return charts.all<DatasetChart>(`/${tenant_id}`);
    },
    all: (tenant_id?: number, dataset_id?: number, query_id?: number) => {
        if (!tenant_id) throw Error("tenant_id is required");
        return charts.all<DatasetChart>(`/${tenant_id}/${dataset_id}/${query_id}`);
    },
    allWithRelations: (tenant_id?: number, dataset_id?: number, query_id?: number) => {
        if (!tenant_id) throw Error("tenant_id is required");
        return charts.all<DatasetChart>(`/${tenant_id}/${dataset_id}/${query_id}`, { options: { params: { include_relations: true } } })
    },
    getOne: (tenant_id: number, id: number) => {
        if (!tenant_id) throw Error("tenant_id is required");
        return charts.all<DatasetChart>(`/${tenant_id}/${id}`)
    },
    execute: (query_id: number, chart: DatasetChart) => {
        if (!query_id) throw Error("query_id is required");
        return charts.post<ExecuteChartResponse>(`/execute/${query_id}`, chart)
    },
    create: (data: DatasetChart) => charts.create("", data),
    update: (id: number, data: DatasetChart) => charts.update("", id, data),
    remove: (id: number) => charts.remove("", id),
}