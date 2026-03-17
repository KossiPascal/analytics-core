import { DatasetField, QueryJson, QueryFilterNode, LinkedFilterGroup, Dataset, DatasetQuery } from "@/models/dataset.models";
import { Tenant } from "@/models/identity.model";

export interface CompileError {
    view_name?: string;
    dimensions?: string;
    metrics?: string;
    select?: string;
    order_by?: string;
    limit?: string;
    offset?: string;
    error?: string;

    query_tenant?: string;
    query_dataset?: string;
    query_name?: string;
}
export interface CompiledQuery {
    sql: string;
    values: Record<string, any>;
    error: CompileError
}
export interface SqlPreviewProps {
    title: string;
    open: boolean;
    data: string | null;
    type: "sql" | "json";
    onClose: () => void;
}
export interface OrderByBuilderProps {
    fields: DatasetField[];
    orderBy: QueryJson["order_by"];
    onChange: (orderBy: QueryJson["order_by"]) => void;
    error: string | undefined;
}
export interface FilterNodeBuilderProps {
    index: number
    node: QueryFilterNode;
    fields: DatasetField[];
    onChange: (node: QueryFilterNode) => void;
    onRemove?: () => void;
    error: string | undefined;
}
export interface FilterBuilderProps {
    name: String;
    fields: DatasetField[];
    node: LinkedFilterGroup[];
    onChange: (node: LinkedFilterGroup[]) => void;
}
export type BuiltFilter = {
    wheres: string[];
    havings: string[];
    values: Record<string, any>;
}
export interface InValuesModalProps {
    isOpen: boolean;
    onClose: () => void;
    values: string[];
    onChange: (values: string[]) => void;
    inputType: string;
}
export interface RenderFormProp {
    datasets: Dataset[],
    // queries: DatasetQuery[],
    query: DatasetQuery,
    tenants: Tenant[],
    tenant_id: number
    errors: CompileError,
    defaultForm: DatasetQuery,
    setValue: (k: keyof DatasetQuery, v: any) => void,
    setPreviewSql: (sql: string | null) => void
    setErrors: (error: CompileError) => void
}
