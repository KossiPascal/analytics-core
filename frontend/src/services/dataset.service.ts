import { Dataset, DatasetChart, DatasetColumn, DatasetField, DatasetQuery, SqlWithUtils } from '@/models/dataset.models';
import { CRUDService } from '@services/acrud.service';


const datasets = new CRUDService("/datasets");
export const datasetService = {
    all: (tenant_id?: number) => datasets.all<Dataset>(`/${tenant_id}`),

    getLocalViews: () => datasets.get<{ name: string, type: string }[]>("/local-views"),
    getViewSql: (view_name:string,sql_type:string) => datasets.get<SqlWithUtils>(`/view-sql/${view_name}/${sql_type}`),

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
    all: (tenant_id?: number) => fields.all<DatasetField>(`/${tenant_id}`),
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
    all: (tenant_id?: number) => queries.all<DatasetQuery>(`/${tenant_id}`),
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
    all: (tenant_id?: number) => charts.all<DatasetChart>(`/${tenant_id}`),
    getOne: (tenant_id: number, id: number) => {
        if (!tenant_id) throw Error("tenant_id is required");
        return charts.all<DatasetChart>(`/${tenant_id}/${id}`)
    },
    create: (data: DatasetChart) => charts.create("", data),
    update: (id: number, data: DatasetChart) => charts.update("", id, data),
    remove: (id: number) => charts.remove("", id),
}