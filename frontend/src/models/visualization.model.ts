import { Dataset, DatasetChart, DatasetQuery } from '@/models/dataset.models';
import { Permission, Tenant, User } from '@/models/identity.model';
import type { Layout, LayoutItem } from "react-grid-layout";

export type VisualizationStatus = "draft" | "submitted" | "reviewed" | "approved" | "published" | "archived";
export type VisualizationState = "pending" | "running" | "success" | "failed" | "canceled";
export type LineageOperation = "derived_from" | "aggregated" | "filtered";


export type LayoutMeta = {
    // moved: boolean;
    // static: boolean;
    id: number | undefined;
    chart_id: number | undefined;
    tenant_id: number | undefined;
    dataset_id: number | undefined;
    visualization_id: number | undefined;
    title?: string,
    filters?: any;
    refresh_interval?: number;
}

export interface VisualLayoutItem extends LayoutItem {
    meta?: LayoutMeta;
}


export function layoutToVisualItems(layout: LayoutItem[], meta: LayoutMeta): VisualLayoutItem[] {
    return layout.map(item => ({
        ...item,
        meta
    }));
}


export function visualItemsToLayout(items: VisualLayoutItem[]): Layout | readonly LayoutItem[] {
    return items.map(item => ({
        i: item.i,
        x: item.x,
        y: item.y,
        w: item.w,
        h: item.h,
        moved: item.moved,
        static: item.static,
    }));
}

export type BreakPointType = keyof ResponsiveLayouts;

export type ResponsiveLayouts = {
    lg: VisualLayoutItem[];
    md: VisualLayoutItem[];
    sm: VisualLayoutItem[];
};
export interface VisualizationFormDefinition {
    id?: number;
    tenant_id?: number;
    visualization_id?: number;
    version?: number;
    config?: Record<string, any>;
    filters?: Record<string, any>;
    is_active?: boolean;
}

export interface VisualizationFormLayout {
    id?: number;
    dataset_id?: number;
    tenant_id?: number;
    visualization_id?: number;
    version?: number;
    items?: ResponsiveLayouts;
    options?: Record<string, any>;
}

export interface VisualizationFormCharts {
    id?: number;
    chart_id: number | undefined;
    tenant_id: number | undefined;
    dataset_id: number | undefined;
    visualization_id: number | undefined;
    layout_id: number | undefined;
    position?: Record<string, any>;
}

export interface VisualizationFormView {
    id?: number;
    tenant_id: number | undefined;
    visualization_id: number | undefined;
    layout_id: number | undefined;
    name?: string;
    is_default?: boolean;
}

export interface VisualizationForm {
    id?: number;
    tenant_id?: number;
    parent_id?: number;

    name: string;
    type: "dashboard" | "report";
    description?: string;
    status: VisualizationStatus;
    is_template: boolean;
    // 🔥 Definition ACTIVE
    definition: VisualizationFormDefinition;
    // 🔥 Layout ACTIF (flatten pour UI)
    layout: VisualizationFormLayout;
    // 🔥 Charts liés
    charts: VisualizationFormCharts[];
    // 🔥 View active
    view: VisualizationFormView;
}

export function toVisualizationForm(viz: Visualization): VisualizationForm {
    // 🔥 Layout (latest version)
    const layouts = viz.layouts ?? [];
    const latestLayout = layouts.length
        ? [...layouts].sort((a, b) => (b.version ?? 0) - (a.version ?? 0))[0]
        : null;

    // 🔥 Definition (active)
    const definitions = viz.definitions ?? [];
    const activeDefinition =
        definitions.find((d) => d.is_active) ||
        [...definitions].sort((a, b) => (b.version ?? 0) - (a.version ?? 0))[0];

    // 🔥 Charts (default)
    const charts = viz.charts ?? [];
    const lastedViews = charts.map(chart => ({ ...chart }))

    // 🔥 View (default)
    const views = viz.views ?? [];
    const defaultView = views.find((v) => v.is_default) || views[0];

    return {
        id: viz.id,
        tenant_id: viz.tenant_id,
        parent_id: viz.parent_id,

        name: viz.name,
        type: viz.type,
        description: viz.description,
        status: viz.status,
        is_template: viz.is_template,

        layout: { ...latestLayout, items: latestLayout?.layout },
        definition: { ...activeDefinition },
        charts: lastedViews,
        view: defaultView,
    };
}

export interface Visualization {
    id: number | undefined;
    tenant_id: number | undefined;
    parent_id?: number | undefined;
    name: string;
    type: 'dashboard' | 'report';
    description: string;
    status: VisualizationStatus;
    is_template: boolean;
    tenant?: Tenant;
    parent?: Visualization;
    charts?: VisualizationChart[];
    executions?: VisualizationExecution[];
    shares?: VisualizationShare[];
    views?: VisualizationView[]
    targets?: DataTarget[];
    definitions?: VisualizationDefinition[]
    layouts?: VisualizationLayout[]
    dhis2_validations?: VisualizationDhis2Validation[];
}

export interface VisualizationDefinition {
    id: number | undefined;
    tenant_id: number | undefined;
    visualization_id: number | undefined;
    version: number;
    config: Record<string, any>;
    filters: Record<string, any>;
    is_active: boolean
    tenant?: Tenant;
    visualization?: Visualization;
}

export interface VisualizationLayout {
    id: number | undefined;
    tenant_id: number | undefined;
    visualization_id: number | undefined;
    layout: ResponsiveLayouts;
    options: Record<string, any>;
    version: number;
    tenant?: Tenant;
    visualization?: Visualization;
    views?: VisualizationView;
    charts?: VisualizationChart;
}

export interface VisualizationChart {
    id: number | undefined
    chart_id: number | undefined;
    tenant_id: number | undefined;
    dataset_id: number | undefined;
    visualization_id: number | undefined;
    layout_id: number | undefined;
    position: Record<string, any>;

    tenant?: Tenant,
    dataset?: Dataset,
    chart?: DatasetChart,
    visualization?: Visualization,
    layout?: VisualizationLayout,
}

export interface VisualizationView {
    id: number | undefined;
    tenant_id: number | undefined;
    layout_id: number | undefined;
    visualization_id: number | undefined;
    name: string;
    is_default: boolean;
    tenant?: Tenant;
    visualization?: Visualization;
    layout?: VisualizationLayout;
}

export interface VisualizationExecution {
    id: number | undefined;
    tenant_id: number | undefined;
    visualization_id: number | undefined;
    started_at?: string;
    finished_at?: string;
    state: VisualizationState;
    result: Record<string, any>;
    error?: string;
    tenant?: Tenant;
    visualization?: Visualization;
    executed_by?: User;
    logs?: VisualizationExecutionLog[]
}

export interface VisualizationExecutionLog {
    id: number | undefined;
    execution_id: number | undefined;
    details: Record<string, any>;
    message: string;
    level: 'info' | 'warning' | 'error'
    execution?: VisualizationExecution
}

export interface VisualizationShare {
    tenant_id: number | undefined;
    visualization_id: number | undefined;
    user_id: number | undefined;
    permission_id: number | undefined;

    public_token?: string;
    can_view: boolean;
    can_edit: boolean;
    can_execute: boolean;

    tenant?: Tenant;
    visualization?: Visualization;
    permission?: Permission;
}

export interface VisualizationDhis2Validation {
    id: number | undefined;
    tenant_id: number | undefined;
    visualization_id: number | undefined;
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

export interface DataTarget {
    id: number | undefined;
    tenant_id: number | undefined;
    dataset_id: number | undefined;
    query_id: number | undefined;
    visualization_id: number | undefined;
    name: string;
    type: "dataset" | "query" | "visualization"

    tenant?: Tenant;
    dataset?: Dataset;
    dataset_query?: DatasetQuery;
    visualization?: Visualization;
    source_lineages?: DataLineage[];
    target_lineages?: DataLineage[];
}

export interface DataLineage {
    id: number | undefined;
    tenant_id: number | undefined;
    source_id: number | undefined;
    target_id: number | undefined;
    operation: LineageOperation;

    tenant?: Tenant;
    source?: DataTarget;
    target?: DataTarget;
}

