import { useMemo, useState } from "react";
import {
  AGGREGATE_BY_SQL_TYPE,
  ChartDimension,
  ChartFormProps,
  ChartMetric,
  ChartPivot,
  ChartStructure,
  ChartFilter,
  ChartOrderby,
  DatasetChart,
  SqlAggType,
  SqlFieldType,
  SqlOperators,
} from "@/models/dataset.models";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { FormSelect } from "@/components/forms/FormSelect/FormSelect";
import { FormInput } from "@/components/forms/FormInput/FormInput";
import { Modal } from "@/components/ui/Modal/Modal";
import { FormSwitch } from "@/components/forms/FormSwitch/FormSwitch";
import { FormMultiSelect } from "@/components/forms/FormSelect/FormMultiSelect";
import {
  AlignLeft,
  Rows2,
  BarChart2,
  Filter,
  GripVertical,
  Search,
  ChevronDown,
  X,
  Pencil,
  Plus,
} from "lucide-react";
import { ChartFilterBuilder } from "./ChartFilterBuilder";
import { FaDatabase } from "react-icons/fa";
import { ChartNodeFilterBuilder, DimMetricFieldMap } from "./ChartNodeFilterBuilder";
import styles from "./StructureStep.module.css";

/* ── Drag types ─────────────────────────────────────────────── */
interface DragItem {
  type: "dimension" | "metric";
  field_name: string;
  field_id: number;
  alias: string;
}

/* ── Draggable sidebar chip ─────────────────────────────────── */
const DraggableItem = ({
  field_name,
  field_id,
  type,
  alias,
}: DragItem) => {
  const [, drag] = useDrag(() => ({
    type,
    item: { type, field_id, alias },
  }));

  const isDim = type === "dimension";

  return (
    <div
      ref={drag as any}
      className={`${styles.fieldChip} ${isDim ? styles.fieldChipDim : styles.fieldChipMetric}`}
      title={field_name}
    >
      <GripVertical
        size={12}
        className={`${styles.fieldChipIcon} ${isDim ? styles.fieldChipIconDim : styles.fieldChipIconMetric}`}
      />
      <span className={styles.fieldChipName}>{field_name}</span>
      <span
        className={`${styles.fieldChipType} ${isDim ? styles.fieldChipTypeDim : styles.fieldChipTypeMetric}`}
      >
        {isDim ? "DIM" : "MET"}
      </span>
    </div>
  );
};

/* ── Drop zone wrapper (invisible, full area) ───────────────── */
interface DropZoneProps {
  accept: ("dimension" | "metric")[];
  onDrop: (item: DragItem) => void;
  children?: React.ReactNode;
  className?: string;
}

const DragDropZone = ({ accept, onDrop, children, className }: DropZoneProps) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept,
    drop: (item: DragItem) => onDrop(item),
    collect: (monitor) => ({ isOver: monitor.isOver() }),
  }));

  return (
    <div
      ref={drop as any}
      className={`${styles.dropTarget} ${isOver ? styles.zoneDropActive : ""} ${className ?? ""}`}
    >
      {children}
    </div>
  );
};

/* ── Internal types ─────────────────────────────────────────── */
interface ChartFieldProps {
  type?: "dimension" | "metric" | "filter";
  field_id: number;
  field_type?: SqlFieldType;
  alias?: string;
  agg?: SqlAggType;
  operator?: SqlOperators;
  value?: any;
  value2?: any;
  useSqlInClause?: boolean;
  index?: number;
}

type FilterZone = "rows_dimensions" | "cols_dimensions" | "metrics" | "filters";

interface FilterEditingProps {
  zone: FilterZone;
  filter: ChartDimension | ChartMetric;
}

/* ═══════════════════════════════════════════════════════════════
   StructureStep
   ═══════════════════════════════════════════════════════════════ */
export const StructureStep = ({ chart, onChange, queries }: ChartFormProps) => {
  /* ── State ──────────────────────────────────────────────────── */
  const [_chart, setChart] = useState<DatasetChart>(chart);
  const [editing, setEditing] = useState<number | null>(null);
  const [filterEditing, setFilterEditing] = useState<FilterEditingProps | null>(null);
  const [menuOpen, setMenuOpen] = useState<number | null>(null);

  // New UI-only state
  const [search, setSearch] = useState("");
  const [pivotOpen, setPivotOpen] = useState(false);

  /* ── Helpers ────────────────────────────────────────────────── */
  const updateChart = (
    updater: DatasetChart | ((prev: DatasetChart) => DatasetChart)
  ) => {
    setChart((prev) => {
      const newChart =
        typeof updater === "function" ? updater(prev) : updater;
      onChange(newChart);
      return newChart;
    });
  };

  const updateStructure = (key: keyof ChartStructure, val: any) => {
    updateChart((prev) => ({
      ...prev,
      structure: { ...prev.structure, [key]: val },
    }));
  };

  const updateChartValue = (key: keyof DatasetChart, val: any) => {
    updateChart((prev) => ({ ...prev, [key]: val }));
  };

  /* ── Derived data ───────────────────────────────────────────── */
  const query = useMemo(
    () => queries?.find((q) => q.id === (_chart.query_id ?? chart.query_id)),
    [queries, _chart.query_id, chart.query_id]
  );

  const fields = useMemo(() => query?.fields ?? [], [query]);

  const queryDimensions: DimMetricFieldMap[] = useMemo(() => {
    const dims = query?.query_json?.select?.dimensions ?? [];
    const fm = new Map(fields.map((f) => [f.id, f]));
    return dims
      .filter((d) => fm.has(d.field_id))
      .map((q) => {
        const fd = fm.get(q.field_id);
        const field_name = q?.alias ?? fd?.name ?? "";
        const fl = fields.find((f) => f.id === q.field_id);
        const data_type = fl?.data_type ?? "string";
        return { ...q, field_name, data_type };
      });
  }, [query, fields]);

  const queryMetrics: DimMetricFieldMap[] = useMemo(() => {
    const metrs = query?.query_json?.select?.metrics ?? [];
    const fm = new Map(fields.map((f) => [f.id, f]));
    return metrs
      .filter((d) => fm.has(d.field_id))
      .map((q) => {
        const fd = fm.get(q.field_id);
        const field_name = q?.alias ?? fd?.name ?? "";
        const fl = fields.find((f) => f.id === q.field_id);
        const data_type = fl?.data_type ?? "string";
        const aggregation = fl?.aggregation ?? "count";
        return { ...q, field_name, data_type, aggregation };
      });
  }, [query, fields]);

  const { dimMap, metricMap, fieldMap } = useMemo(() => {
    const dimMap: Map<number, DimMetricFieldMap> = new Map();
    const metricMap: Map<number, DimMetricFieldMap> = new Map();
    const fieldMap: Map<number, DimMetricFieldMap> = new Map();
    queryDimensions.forEach((d) => {
      dimMap.set(d.field_id, d);
      fieldMap.set(d.field_id, d);
    });
    queryMetrics.forEach((m) => {
      metricMap.set(m.field_id, m);
      fieldMap.set(m.field_id, m);
    });
    return { dimMap, metricMap, fieldMap };
  }, [queryDimensions, queryMetrics]);

  const structure: ChartStructure = useMemo(() => {
    const str = { ...(_chart.structure ?? {}) };

    const rowsDimsMap = new Map<string, ChartDimension>();
    [...(str.rows_dimensions ?? [])].forEach((rd, i) => {
      const dim = dimMap.get(rd.field_id);
      const alias = rd.alias ?? dim?.field_name ?? "";
      const name = dim?.field_name ?? rd.alias ?? "";
      const key = `${i}`;
      rowsDimsMap.set(key, { ...rd, alias, name });
    });
    const rows_dimensions = Array.from(rowsDimsMap.values());

    const colsDimsMap = new Map<string, ChartDimension>();
    [...(str.cols_dimensions ?? [])].forEach((cd, i) => {
      const dim = dimMap.get(cd.field_id);
      const alias = cd.alias ?? dim?.field_name ?? "";
      const name = dim?.field_name ?? cd.alias ?? "";
      const key = `${i}`;
      colsDimsMap.set(key, { ...cd, alias, name });
    });
    const cols_dimensions = Array.from(colsDimsMap.values());

    const metricsMap = new Map<string, ChartMetric>();
    [...(str.metrics ?? [])].forEach((m, i) => {
      const metr = metricMap.get(m.field_id);
      const alias = m.alias ?? metr?.field_name ?? "";
      const name = metr?.field_name ?? m.alias ?? "";
      const key = `${i}`;
      metricsMap.set(key, { ...m, alias, name });
    });
    const metrics = Array.from(metricsMap.values());

    const filtersMap = new Map<string, ChartFilter>();
    [...(str.filters ?? [])].forEach((ft, i) => {
      const key = `${i}`;
      filtersMap.set(key, { ...ft });
    });
    const filters = Array.from(filtersMap.values());

    const orderMap = new Map<string, ChartOrderby>();
    [...(str.order_by ?? [])].forEach((o, i) => {
      const key = `${i}`;
      orderMap.set(key, { ...o });
    });
    const order_by = Array.from(orderMap.values());

    const limit = str.limit;
    const offset = str.offset;
    const pivot = { ...(str.pivot ?? {}) };

    return {
      rows_dimensions,
      cols_dimensions,
      metrics,
      filters,
      limit,
      offset,
      order_by,
      pivot,
    };
  }, [_chart.structure, queryDimensions, queryMetrics]);

  /* ── Mutation handlers (unchanged logic) ────────────────────── */
  const addChartField = (zone: FilterZone, data: ChartFieldProps) => {
    const {
      field_id,
      type,
      field_type,
      alias,
      agg,
      operator,
      value,
      value2,
      useSqlInClause,
      index,
    } = data;

    if (
      ["rows_dimensions", "cols_dimensions"].includes(zone) &&
      type !== "dimension"
    )
      return;
    if (zone === "metrics" && type !== "metric") return;

    const newData: any = { field_id };
    if (alias !== undefined) newData.alias = alias;
    if (agg !== undefined) newData.aggregation = agg;
    if (operator !== undefined) newData.operator = operator;
    if (value !== undefined) newData.value = value;
    if (value2 !== undefined) newData.value2 = value2;
    if (field_type !== undefined) newData.field_type = field_type;
    if (useSqlInClause !== undefined) newData.useSqlInClause = useSqlInClause;

    updateChart((prev) => {
      const rows = prev.structure?.rows_dimensions ?? [];
      const cols = prev.structure?.cols_dimensions ?? [];
      const metrics = prev.structure?.metrics ?? [];
      const filters = prev.structure?.filters ?? [];

      let newRows = [...rows];
      let newCols = [...cols];
      let newMetrics = [...metrics];
      let newFilters = [...filters];

      if (zone === "rows_dimensions") {
        if (!newRows.map((n) => n.field_id).includes(field_id))
          newRows.push(newData);
        newCols = cols.filter((c) => c.field_id !== field_id);
      }
      if (zone === "cols_dimensions") {
        if (!newCols.map((n) => n.field_id).includes(field_id))
          newCols.push(newData);
        newRows = rows.filter((r) => r.field_id !== field_id);
      }
      if (zone === "metrics") {
        const field = fields.find((f) => f.id === field_id);
        const data_type = field?.data_type ?? "string";
        const aggregates: SqlAggType[] =
          AGGREGATE_BY_SQL_TYPE[data_type] ?? ["count"];
        newMetrics.push({ ...newData, aggregation: aggregates[0] });
      }
      if (zone === "filters") {
        newFilters.push({
          ...newData,
          operator: "=",
          field_type: "dimension",
          useSqlInClause: false,
        });
      }

      return {
        ...prev,
        structure: {
          ...(prev.structure ?? {}),
          rows_dimensions: newRows,
          cols_dimensions: newCols,
          metrics: newMetrics,
          filters: newFilters,
        },
      };
    });
  };

  const updateChartFields = (zone: FilterZone, data: ChartFieldProps) => {
    const {
      field_id,
      type,
      field_type,
      alias,
      agg,
      operator,
      value,
      value2,
      useSqlInClause,
      index,
    } = data;

    const newData: any = { field_id };
    if (alias !== undefined) newData.alias = alias;
    if (agg !== undefined) newData.aggregation = agg;
    if (operator !== undefined) newData.operator = operator;
    if (value !== undefined) newData.value = value;
    if (value2 !== undefined) newData.value2 = value2;
    if (field_type !== undefined) newData.field_type = field_type;
    if (useSqlInClause !== undefined) newData.useSqlInClause = useSqlInClause;

    updateChart((prev) => {
      let rows_dims = prev.structure?.rows_dimensions ?? [];
      let cols_dims = prev.structure?.cols_dimensions ?? [];
      let metrics = prev.structure?.metrics ?? [];
      let filters = prev.structure?.filters ?? [];

      if (zone === "rows_dimensions") {
        rows_dims = rows_dims.map((m) =>
          m.field_id === field_id ? { ...m, ...newData } : m
        );
      }
      if (zone === "cols_dimensions") {
        cols_dims = cols_dims.map((m) =>
          m.field_id === field_id ? { ...m, ...newData } : m
        );
      }
      if (zone === "metrics" && index !== undefined) {
        metrics = metrics.map((m, i) =>
          i === index ? { ...m, ...newData } : m
        );
      }
      if (zone === "filters" && index !== undefined) {
        const dimensionIds = queryDimensions.map((d) => d.field_id);
        const field_type: SqlFieldType = dimensionIds.includes(field_id)
          ? "dimension"
          : "metric";
        filters = filters.map((m, i) =>
          i === index ? { ...m, ...newData, field_type } : m
        );
      }

      return {
        ...prev,
        structure: {
          ...prev.structure,
          rows_dimensions: rows_dims,
          cols_dimensions: cols_dims,
          metrics: metrics,
          filters: filters,
        },
      };
    });
  };

  const removeChartFields = (
    zone: FilterZone,
    field_id: number,
    index: number
  ) => {
    updateChart((prev) => {
      let cols_dims = prev.structure?.cols_dimensions ?? [];
      let rows_dims = prev.structure?.rows_dimensions ?? [];
      let metrics = prev.structure?.metrics ?? [];
      let filters = prev.structure?.filters ?? [];

      if (zone === "rows_dimensions") {
        rows_dims = rows_dims.filter((m) => m.field_id !== field_id);
      }
      if (zone === "cols_dimensions") {
        cols_dims = cols_dims.filter((m) => m.field_id !== field_id);
      }
      if (zone === "metrics" && index !== undefined) {
        metrics = metrics.filter((m, i) => i !== index);
      }
      if (zone === "filters" && index !== undefined) {
        filters = filters.filter((m, i) => i !== index);
      }

      return {
        ...prev,
        structure: {
          ...prev.structure,
          rows_dimensions: rows_dims,
          cols_dimensions: cols_dims,
          metrics: metrics,
          filters: filters,
        },
      };
    });
  };

  const updateChartPivot = (key: keyof ChartPivot, val: any) => {
    updateChart((prev) => {
      const pivot = { ...(prev.structure?.pivot ?? {}), [key]: val };
      return { ...prev, structure: { ...(prev.structure ?? {}), pivot } };
    });
  };

  /* ── Filtered sidebar lists ─────────────────────────────────── */
  const filteredDims = useMemo(() => {
    if (!search.trim()) return queryDimensions;
    const q = search.toLowerCase();
    return queryDimensions.filter((d) =>
      d.field_name.toLowerCase().includes(q)
    );
  }, [queryDimensions, search]);

  const filteredMetrics = useMemo(() => {
    if (!search.trim()) return queryMetrics;
    const q = search.toLowerCase();
    return queryMetrics.filter((m) => m.field_name.toLowerCase().includes(q));
  }, [queryMetrics, search]);

  /* ════════════════════════════════════════════════════════════
     JSX
     ════════════════════════════════════════════════════════════ */
  return (
    <>
      <DndProvider backend={HTML5Backend}>
        <div className={styles.root}>

          {/* ── Sidebar ──────────────────────────────────────── */}
          <aside className={styles.sidebar}>

            {/* Chart name */}
            <div className={styles.chartNameSection}>
              <FormInput
                label="Nom du chart"
                value={chart.name}
                onChange={(e) => updateChartValue("name", e.target.value)}
                placeholder="Saisir le nom du chart"
                leftIcon={<FaDatabase />}
                required={true}
              />
            </div>

            {/* Header + search */}
            <div className={styles.sidebarHeader}>
              <div className={styles.sidebarTitle}>
                <FaDatabase className={styles.sidebarTitleIcon} size={13} />
                Champs disponibles
              </div>
              <div className={styles.searchBox}>
                <Search size={13} className={styles.searchBoxIcon} />
                <input
                  type="text"
                  className={styles.searchBoxInput}
                  placeholder="Rechercher…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            {/* Dimensions list */}
            <div className={styles.fieldSection} style={{ flex: "1 1 0", minHeight: 0 }}>
              <div className={styles.fieldSectionHeader}>
                <span className={styles.sectionLabel}>
                  DIMENSIONS ({filteredDims.length})
                </span>
              </div>
              <div className={styles.fieldList}>
                {filteredDims.map((dim) => (
                  <DraggableItem
                    key={dim.field_id}
                    field_id={dim.field_id}
                    type="dimension"
                    field_name={dim.field_name}
                    alias={dim.field_name}
                  />
                ))}
                {filteredDims.length === 0 && (
                  <div style={{ fontSize: 11, color: "#94a3b8", padding: "6px 4px" }}>
                    Aucun résultat
                  </div>
                )}
              </div>
            </div>

            {/* Metrics list */}
            <div className={styles.fieldSection} style={{ flex: "1 1 0", minHeight: 0 }}>
              <div className={styles.fieldSectionHeader}>
                <span className={styles.sectionLabel}>
                  MÉTRIQUES ({filteredMetrics.length})
                </span>
              </div>
              <div className={styles.fieldList}>
                {filteredMetrics.map((m) => (
                  <DraggableItem
                    key={m.field_id}
                    field_id={m.field_id}
                    type="metric"
                    field_name={m.field_name}
                    alias={m.field_name}
                  />
                ))}
                {filteredMetrics.length === 0 && (
                  <div style={{ fontSize: 11, color: "#94a3b8", padding: "6px 4px" }}>
                    Aucun résultat
                  </div>
                )}
              </div>
            </div>
          </aside>

          {/* ── Main area ─────────────────────────────────────── */}
          <div className={styles.main}>

            {/* 2x2 zones grid */}
            <div className={styles.zonesGrid}>

              {/* ── Lignes (rows_dimensions) ──── top-left */}
              {(() => {
                const cible = "rows_dimensions";
                const items = structure[cible];
                return (
                  <div className={`${styles.zone} ${styles.zoneRows}`}>
                    <div className={styles.zoneHeader}>
                      <Rows2 size={15} className={styles.zoneIconRows} />
                      <span className={styles.zoneTitle}>Lignes</span>
                      <span className={`${styles.zoneBadge} ${styles.zoneBadgeDim}`}>
                        {items.length}
                      </span>
                    </div>
                    <div className={styles.zoneBody}>
                      <DragDropZone
                        accept={["dimension"]}
                        onDrop={(item) => addChartField(cible, item)}
                      >
                        {items.length === 0 ? (
                          <div className={styles.zoneEmpty}>Déposez ici</div>
                        ) : (
                          items.map((rd, i) => (
                            <div
                              key={rd.field_id}
                              className={`${styles.fieldRow} ${styles.fieldRowDim}`}
                            >
                              <GripVertical size={13} className={styles.fieldRowHandle} />
                              <span className={styles.fieldRowName} title={rd.name ?? rd.alias}>
                                {rd.name ?? rd.alias}
                              </span>
                              {editing === rd.field_id ? (
                                <FormInput
                                  type="text"
                                  value={rd.alias || ""}
                                  className={styles.fieldRowAlias}
                                  onChange={(e) =>
                                    updateChartFields(cible, {
                                      field_id: rd.field_id,
                                      alias: e.target.value?.trim(),
                                    })
                                  }
                                  onBlur={() => setEditing(null)}
                                />
                              ) : (
                                <span
                                  className={styles.fieldRowAliasDisplay}
                                  title={rd.alias}
                                  onClick={() => setEditing(rd.field_id)}
                                >
                                  {rd.alias || "—"}
                                </span>
                              )}
                              <div className={styles.fieldRowActions}>
                                <button
                                  className={styles.actionBtn}
                                  title="Renommer"
                                  onClick={() => setEditing(rd.field_id)}
                                >
                                  <Pencil size={13} />
                                </button>
                                <button
                                  className={styles.actionBtn}
                                  title="Filtre"
                                  onClick={() => {
                                    const field = fields.find((f) => f.id === rd.field_id);
                                    const data_type = field?.data_type ?? "string";
                                    setFilterEditing({
                                      zone: cible,
                                      filter: { ...rd, data_type },
                                    });
                                  }}
                                >
                                  <Filter size={13} />
                                </button>
                                <button
                                  className={styles.removeBtn}
                                  title="Supprimer"
                                  onClick={() =>
                                    removeChartFields(cible, rd.field_id, i)
                                  }
                                >
                                  <X size={13} />
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </DragDropZone>
                    </div>
                  </div>
                );
              })()}

              {/* ── Colonnes (cols_dimensions) ── top-right */}
              {(() => {
                const cible = "cols_dimensions";
                const items = structure[cible];
                return (
                  <div className={`${styles.zone} ${styles.zoneCols}`}>
                    <div className={styles.zoneHeader}>
                      <AlignLeft size={15} className={styles.zoneIconCols} />
                      <span className={styles.zoneTitle}>Colonnes</span>
                      <span className={`${styles.zoneBadge} ${styles.zoneBadgeCols}`}>
                        {items.length}
                      </span>
                    </div>
                    <div className={styles.zoneBody}>
                      <DragDropZone
                        accept={["dimension"]}
                        onDrop={(item) => addChartField(cible, item)}
                      >
                        {items.length === 0 ? (
                          <div className={styles.zoneEmpty}>Déposez ici</div>
                        ) : (
                          items.map((cd, i) => (
                            <div
                              key={cd.field_id}
                              className={`${styles.fieldRow} ${styles.fieldRowDimCols}`}
                            >
                              <GripVertical size={13} className={styles.fieldRowHandle} />
                              <span className={styles.fieldRowName} title={cd.name ?? cd.alias}>
                                {cd.name ?? cd.alias}
                              </span>
                              {editing === cd.field_id ? (
                                <FormInput
                                  type="text"
                                  value={cd.alias || ""}
                                  className={styles.fieldRowAlias}
                                  onChange={(e) =>
                                    updateChartFields(cible, {
                                      field_id: cd.field_id,
                                      alias: e.target.value?.trim(),
                                    })
                                  }
                                  onBlur={() => setEditing(null)}
                                />
                              ) : (
                                <span
                                  className={styles.fieldRowAliasDisplay}
                                  title={cd.alias}
                                  onClick={() => setEditing(cd.field_id)}
                                >
                                  {cd.alias || "—"}
                                </span>
                              )}
                              <div className={styles.fieldRowActions}>
                                <button
                                  className={styles.actionBtn}
                                  title="Renommer"
                                  onClick={() => setEditing(cd.field_id)}
                                >
                                  <Pencil size={13} />
                                </button>
                                <button
                                  className={styles.actionBtn}
                                  title="Filtre"
                                  onClick={() => {
                                    const field = fields.find((f) => f.id === cd.field_id);
                                    const data_type = field?.data_type ?? "string";
                                    setFilterEditing({
                                      zone: cible,
                                      filter: { ...cd, data_type },
                                    });
                                  }}
                                >
                                  <Filter size={13} />
                                </button>
                                <button
                                  className={styles.removeBtn}
                                  title="Supprimer"
                                  onClick={() =>
                                    updateStructure(
                                      cible,
                                      structure[cible].filter(
                                        (d) => d.field_id !== cd.field_id
                                      )
                                    )
                                  }
                                >
                                  <X size={13} />
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </DragDropZone>
                    </div>
                  </div>
                );
              })()}

              {/* ── Métriques ────────────────────── bottom-left */}
              {(() => {
                const cible = "metrics";
                const items = structure[cible];
                return (
                  <div className={`${styles.zone} ${styles.zoneMetrics}`}>
                    <div className={styles.zoneHeader}>
                      <BarChart2 size={15} className={styles.zoneIconMetric} />
                      <span className={styles.zoneTitle}>Métriques</span>
                      <span className={`${styles.zoneBadge} ${styles.zoneBadgeMetric}`}>
                        {items.length}
                      </span>
                    </div>
                    <div className={styles.zoneBody}>
                      <DragDropZone
                        accept={["metric"]}
                        onDrop={(item) => addChartField(cible, item)}
                      >
                        {items.length === 0 ? (
                          <div className={styles.zoneEmpty}>Déposez ici</div>
                        ) : (
                          items.map((m, i) => {
                            const field = fields.find((f) => f.id === m.field_id);
                            const data_type = field?.data_type ?? "string";
                            const aggregates: SqlAggType[] =
                              AGGREGATE_BY_SQL_TYPE[data_type] ?? ["count"];
                            return (
                              <div
                                key={`${m.field_id}_${i}`}
                                className={`${styles.fieldRow} ${styles.fieldRowMetric}`}
                              >
                                <GripVertical size={13} className={styles.fieldRowHandle} />
                                <span
                                  className={styles.fieldRowName}
                                  title={m.name ?? m.alias}
                                >
                                  {m.name ?? m.alias}
                                </span>
                                {editing === m.field_id ? (
                                  <FormInput
                                    type="text"
                                    value={m.alias || ""}
                                    className={styles.fieldRowAlias}
                                    onChange={(e) =>
                                      updateChartFields(cible, {
                                        field_id: m.field_id,
                                        alias: e.target.value?.trim(),
                                        index: i,
                                      })
                                    }
                                    onBlur={() => setEditing(null)}
                                  />
                                ) : (
                                  <span
                                    className={styles.fieldRowAliasDisplay}
                                    title={m.alias}
                                    onClick={() => setEditing(m.field_id)}
                                  >
                                    {m.alias || "—"}
                                  </span>
                                )}
                                <div className={styles.fieldRowAgg}>
                                  <FormSelect
                                    value={m.aggregation}
                                    options={aggregates.map((a) => ({
                                      value: a,
                                      label: a.toUpperCase(),
                                    }))}
                                    onChange={(val) =>
                                      updateChartFields(cible, {
                                        field_id: m.field_id,
                                        agg: val,
                                        index: i,
                                      })
                                    }
                                  />
                                </div>
                                <div className={styles.fieldRowActions}>
                                  <button
                                    className={styles.actionBtn}
                                    title="Renommer"
                                    onClick={() => setEditing(m.field_id)}
                                  >
                                    <Pencil size={13} />
                                  </button>
                                  <button
                                    className={styles.actionBtn}
                                    title="Filtre"
                                    onClick={() => {
                                      const field = fields.find((f) => f.id === m.field_id);
                                      const data_type = field?.data_type ?? "string";
                                      setFilterEditing({
                                        zone: cible,
                                        filter: { ...m, data_type },
                                      });
                                    }}
                                  >
                                    <Filter size={13} />
                                  </button>
                                  <button
                                    className={styles.removeBtn}
                                    title="Supprimer"
                                    onClick={() =>
                                      removeChartFields(cible, m.field_id, i)
                                    }
                                  >
                                    <X size={13} />
                                  </button>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </DragDropZone>
                    </div>
                  </div>
                );
              })()}

              {/* ── Filtres ──────────────────────── bottom-right */}
              {(() => {
                const cible = "filters";
                const items = structure[cible];
                return (
                  <div className={`${styles.zone} ${styles.zoneFilters}`}>
                    <div className={styles.zoneHeader}>
                      <Filter size={15} className={styles.zoneIconFilter} />
                      <span className={styles.zoneTitle}>Filtres</span>
                      <span className={`${styles.zoneBadge} ${styles.zoneBadgeFilter}`}>
                        {items.length}
                      </span>
                      <span className={styles.zoneHeaderSpacer} />
                      <button
                        className={styles.addFilterBtn}
                        onClick={() => addChartField(cible, { field_id: 0 })}
                      >
                        <Plus size={12} />
                        Ajouter
                      </button>
                    </div>
                    <div className={styles.zoneBody}>
                      {items.length === 0 ? (
                        <div className={styles.zoneEmpty}>Aucun filtre défini</div>
                      ) : (
                        <table style={{ width: "100%" }}>
                          <tbody>
                            {items.map((filter, i) => (
                              <ChartNodeFilterBuilder
                                key={i}
                                index={i + 1}
                                node={filter}
                                fields={[...queryDimensions, ...queryMetrics]}
                                onChange={(updated) =>
                                  updateChartFields(cible, { ...updated, index: i })
                                }
                                onRemove={() =>
                                  removeChartFields(cible, filter.field_id, i)
                                }
                                error={undefined}
                              />
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* ── Pivot section (collapsible) ─────────────────── */}
            <div className={styles.pivotSection}>
              <div
                className={styles.pivotHeader}
                onClick={() => setPivotOpen((o) => !o)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && setPivotOpen((o) => !o)}
              >
                <span className={styles.pivotTitle}>Options de pivot</span>
                <ChevronDown
                  size={16}
                  className={`${styles.pivotChevron} ${pivotOpen ? styles.pivotChevronOpen : ""}`}
                />
              </div>

              <div
                className={`${styles.pivotContent} ${pivotOpen ? styles.pivotContentOpen : ""}`}
              >
                <div className={styles.pivotInner}>
                  {/* Switches row 1 */}
                  <div className={styles.pivotRow}>
                    <FormSwitch
                      label="Rows totals"
                      checked={chart?.structure?.pivot?.rows_total}
                      onChange={(e) =>
                        updateChartPivot("rows_total", e.target.checked)
                      }
                    />
                    <FormSwitch
                      label="Columns totals"
                      checked={chart?.structure?.pivot?.cols_total}
                      onChange={(e) =>
                        updateChartPivot("cols_total", e.target.checked)
                      }
                    />
                    <FormSwitch
                      label="Rows subtotals"
                      checked={chart?.structure?.pivot?.rows_subtotal}
                      onChange={(e) =>
                        updateChartPivot("rows_subtotal", e.target.checked)
                      }
                    />
                    <FormSwitch
                      label="Columns subtotals"
                      checked={chart?.structure?.pivot?.cols_subtotal}
                      onChange={(e) =>
                        updateChartPivot("cols_subtotal", e.target.checked)
                      }
                    />
                  </div>

                  {/* Switches row 2 + fill value */}
                  <div className={styles.pivotRow}>
                    <FormSwitch
                      label="Active"
                      checked={chart?.structure?.pivot?.active}
                      onChange={(e) =>
                        updateChartPivot("active", e.target.checked)
                      }
                    />
                    <FormSwitch
                      label="Sort desc"
                      checked={chart?.structure?.pivot?.sort_desc}
                      onChange={(e) =>
                        updateChartPivot("sort_desc", e.target.checked)
                      }
                    />
                    <FormInput
                      value={chart?.structure?.pivot?.fill_value ?? 0}
                      type="number"
                      onChange={(e) =>
                        updateChartPivot("fill_value", e.target.value)
                      }
                    />
                  </div>

                  {/* Selects row */}
                  <div className={styles.pivotRowWide}>
                    <div className={styles.pivotSelectWrap}>
                      <FormMultiSelect
                        label="percent_metrics"
                        value={chart?.structure?.pivot?.percent_metrics ?? []}
                        options={
                          structure.metrics?.map((m) => {
                            const label =
                              m.alias ??
                              fields.find((f) => f.id === m.field_id)?.name ??
                              "";
                            return { value: m.field_id, label };
                          }) ?? []
                        }
                        onChange={(values) => {
                          const vals = values?.filter(Boolean) || [];
                          const metVals = (structure.metrics ?? []).filter(
                            (d) => vals.includes(d.field_id)
                          );
                          updateChartPivot(
                            "percent_metrics",
                            metVals.map((m) => m.field_id)
                          );
                        }}
                        placeholder="percent_metrics"
                      />
                    </div>
                    <div className={styles.pivotSelectWrap}>
                      <FormSelect
                        label="sort_metric"
                        value={chart?.structure?.pivot?.sort_metric}
                        options={
                          structure.metrics?.map((m) => {
                            const label =
                              m.alias ??
                              fields.find((f) => f.id === m.field_id)?.name ??
                              "";
                            return { value: m.field_id, label };
                          }) ?? []
                        }
                        onChange={(val) => updateChartPivot("sort_metric", val)}
                        placeholder="sort_metric"
                      />
                    </div>
                    <div className={styles.pivotSelectWrap}>
                      <FormSelect
                        label="top_n"
                        value={chart?.structure?.pivot?.top_n}
                        options={[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => ({
                          value: d,
                          label: `${d}`,
                        }))}
                        onChange={(val) => updateChartPivot("top_n", val)}
                        placeholder="top_n"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DndProvider>

      {/* ── Filter builder modal ─────────────────────────────── */}
      <Modal
        title="Edit Map Values"
        isOpen={filterEditing !== null}
        size="md"
        showCloseButton={false}
        onClose={() => {}}
      >
        {filterEditing && (
          <ChartFilterBuilder
            filter={filterEditing.filter}
            onChange={(filter) => {
              updateChartFields(filterEditing.zone, { ...filter });
              setFilterEditing(null);
            }}
          />
        )}
      </Modal>
    </>
  );
};
