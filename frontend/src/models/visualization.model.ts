import { Dataset, DatasetChart, DatasetQuery } from '@/models/dataset.models';
import { Permission, Tenant, User } from '@/models/identity.model';

export type VisualizationStatus = "draft" | "submitted" | "reviewed" | "approved" | "published" | "archived";
export type VisualizationState = "pending" | "running" | "success" | "failed" | "canceled";
export type LineageOperation = "derived_from" | "aggregated" | "filtered";



export interface VisualLayoutItem {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  chart_id?: number;

  title?: string;
  filters?: any;
  refresh_interval?: number;
}

export interface Visualization {
    id: number | null;
    tenant_id: number | null;
    name: string;
    type: 'dashboard' | 'report';
    description: string;

    status: VisualizationStatus;
    state: VisualizationState;

    parent_id?: number | null;

    layout: VisualLayoutItem[];//Record<string, any>;
    filters: Record<string, any>;
    config: Record<string, any>;
    generated_data: Record<string, any>;

    executed_at?: string;
    executed_by_id?: number
    executed_by?: { id: number, name: string }

    validated_at?: string;
    validated_by_id?: number
    validated_by?: { id: number, name: string }
    validation_comment?: string;

    tenant?: Tenant;
    parent?: Visualization;

    charts?: VisualizationChart[];
    execution_logs?: VisualizationExecutionLog[];
    shares?: VisualizationShare[];
    dhis2_validations?: VisualizationDhis2Validation[];
    views?: VisualizationView[]
    targets?: DataTarget[]
}

export interface VisualizationChart {
    chart_id: number | null;
    visualization_id: number | null;
    dataset_id: number | null;
    tenant_id: number | null;
    position: Record<string, any>;

    tenant?: Tenant,
    dataset?: Dataset,
    chart?: DatasetChart,
    visualization?: Visualization,
}

export interface VisualizationExecutionLog {
    id: number | null;
    tenant_id: number | null;
    visualization_id: number | null;
    message: string;
    status: "success" | "failed";
    details: Record<string, any>;
    executed_at?: string;
    executed_by_id?: number;

    tenant?: Tenant;
    visualization?: Visualization;
    executed_by?: User;
}

export interface VisualizationShare {
    visualization_id: number | null;
    user_id: number | null;
    permission_id: number | null;

    tenant_id: number | null;

    public_token?: string;
    can_view: boolean;
    can_edit: boolean;
    can_execute: boolean;

    tenant?: Tenant;
    visualization?: Visualization;
    permission?: Permission;
}

export interface VisualizationDhis2Validation {
    id: number | null;
    tenant_id: number | null;
    visualization_id: number | null;
    uid: string;

    on_dhis2: boolean;
    on_dhis2_at?: string;
    on_dhis2_by_id?: number;

    is_validate: boolean;
    validated_at?: string;
    validated_by_id?: number;

    canceled_at?: string;
    canceled_by_id?: number;

    tenant?: Tenant;
    visualization?: Visualization;

    on_dhis2_by?: User;
    validated_by?: User;
    canceled_by?: User;
}

export interface VisualizationView {
    id: number | null;
    tenant_id: number | null;
    visualization_id: number | null;

    name: string;
    filters: Record<string, any>;
    layout: Record<string, any>;

    tenant?: Tenant
    visualization?: Visualization
}

export interface DataTarget {
    id: number | null;
    tenant_id: number | null;
    dataset_id: number | null;
    query_id: number | null;
    visualization_id: number | null;
    type: "dataset" | "query" | "visualization"
    name: string;
    tenant?: Tenant;
    dataset?: Dataset;
    dataset_query?: DatasetQuery;
    visualization?: Visualization;

    source_lineages?: DataLineage[];
    target_lineages?: DataLineage[];
}

export interface DataLineage {
    id: number | null;
    tenant_id: number | null;
    source_id: number | null;
    target_id: number | null;
    operation: LineageOperation;

    tenant?: Tenant;
    source?: DataTarget;
    target?: DataTarget;
}

