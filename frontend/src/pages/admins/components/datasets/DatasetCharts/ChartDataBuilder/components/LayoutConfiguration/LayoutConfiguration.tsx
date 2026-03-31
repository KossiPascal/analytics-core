import React, { useState, useCallback, useMemo } from "react";
import { Database, Filter, Layers, Search } from "lucide-react";
import {
  LayoutDropZone,
  LayoutState,
  LayoutDataZone,
} from "../LayoutDropZone/LayoutDropZone";
import {
  ChartDimension,
  ChartFilter,
  ChartMetric,
  DatasetField,
  OPERATORS_BY_TYPE,
  INPUT_TYPE_BY_SQL_TYPE,
  NO_VALUE_OPERATORS,
  SqlDataType,
} from "@/models/dataset.models";
import { Modal } from "@/components/ui/Modal/Modal";
import {
  FormMultiSelectDualPanel,
  MultiSelectItem,
  FilterConfig,
} from "@/components/forms/FormMultiSelectDualPanel/FormMultiSelectDualPanel";
import { Button } from "@/components/ui/Button/Button";
import type {
  ChartTypeOption,
  ChartVariant,
  VisualizationOptions,
} from "../types";
import { ChartTypePickerModal } from "../../../components/chart-utils/ChartTypePickerModal";
import styles from "./LayoutConfiguration.module.css";

// ── DRAG KEYS ─────────────────────────────────────────────────────────────────
const DRAG_KEY = "layout-drag-item"; // individual sidebar items
const CHIP_DRAG_KEY = "zone-chip-drag"; // zone-chip batch swaps

const ensureZoneItems = <
  T extends ChartDimension | ChartMetric | ChartFilter,
>(
  value: unknown,
): T[] => (Array.isArray(value) ? (value as T[]) : []);

// ── MODULE-LEVEL HELPER ───────────────────────────────────────────────────────
// fromDataZone is null when the item comes from the sidebar (not yet in any zone)
function isMoveAllowed(
  from: LayoutDataZone | null,
  to: LayoutDataZone,
): boolean {
  if (from === null) return true;
  if (from === to) return false;
  if (from === "metrics") return false;
  return true;
}

// ── MODULE-LEVEL Chip ─────────────────────────────────────────────────────────
interface ChipProps {
  icon: React.ReactNode;
  label: string;
  count?: number;
  chipStyles: Record<string, string>;
  onClick: () => void;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: () => void;
}

const Chip: React.FC<ChipProps> = ({
  icon,
  label,
  count,
  chipStyles,
  onClick,
  draggable: isDraggable,
  onDragStart,
  onDragEnd,
}) => (
  <div
    className={chipStyles.chip}
    onClick={onClick}
    draggable={isDraggable}
    onDragStart={onDragStart}
    onDragEnd={onDragEnd}
    style={isDraggable ? { cursor: "grab" } : undefined}
  >
    <span className={chipStyles.chipIcon}>{icon}</span>
    <span>{label}</span>
    {count !== undefined && count > 0 && (
      <span className={chipStyles.chipBadge}>{count}</span>
    )}
    <button
      className={chipStyles.chipEllipsis}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      type="button"
    >
      •••
    </button>
  </div>
);

// ── PROPS ─────────────────────────────────────────────────────────────────────
interface LayoutConfigurationProps {
  layout: LayoutState;
  fields: DatasetField[];
  onAddLayout: (
    zone: LayoutDataZone,
    fields: (ChartDimension | ChartMetric | ChartFilter)[],
  ) => void;
  onUpdateLayout: (
    zone: keyof LayoutState,
    fields: (ChartDimension | ChartMetric | ChartFilter)[],
  ) => void;
  onMoveLayout: (
    itemId: number,
    fromZone: LayoutDataZone,
    toZone: LayoutDataZone,
    toIndex: number,
  ) => void;
  onRemoveLayout: (id: number, zone: keyof LayoutState) => void;
  chartType: ChartVariant;
  chartTypes: ChartTypeOption[];
  options: VisualizationOptions;
  onSelectChartType: (type: ChartVariant) => void;
}

// ── COMPONENT ─────────────────────────────────────────────────────────────────
export const LayoutConfiguration: React.FC<LayoutConfigurationProps> = ({
  layout,
  fields,
  onAddLayout,
  onUpdateLayout,
  onMoveLayout,
  onRemoveLayout,
  chartType,
  chartTypes,
  options,
  onSelectChartType,
}) => {
  const safeLayout = useMemo<LayoutState>(
    () => ({
      columns: ensureZoneItems<ChartDimension>(layout?.columns),
      rows: ensureZoneItems<ChartDimension>(layout?.rows),
      metrics: ensureZoneItems<ChartMetric>(layout?.metrics),
      filters: ensureZoneItems<ChartFilter>(layout?.filters),
    }),
    [layout],
  );

  const currentChartType = useMemo(
    () => chartTypes.find((t) => t.id === chartType),
    [chartTypes, chartType],
  );

  const [dimSearch, setDimSearch] = useState("");
  const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);

  // Modal states
  const [donneesModalOpen, setDonneesModalOpen] = useState(false);
  const [colsEditOpen, setColsEditOpen] = useState(false);
  const [dimsModalZone, setDimsModalZone] = useState<"columns" | "rows" | null>(
    null,
  );
  const [filtersModalOpen, setFiltersModalOpen] = useState(false);

  // Drag-over indicator
  const [dragOverZone, setDragOverZone] = useState<LayoutDataZone | null>(null);

  // Tracks which zone the "Données" chip currently lives in
  const [donneesZone, setDonneesZone] = useState<"columns" | "rows">("columns");

  const zoneMetrics = useMemo(
    () => fields.filter((f) => f.field_type !== "dimension"),
    [fields],
  );
  const zoneDimensions = useMemo(
    () => fields.filter((f) => f.field_type === "dimension"),
    [fields],
  );

  // ── Données modal ──
  const donneesItems = useMemo(
    () => zoneMetrics.map((f) => ({ id: String(f.id), name: f.name, type: f.data_type ?? '' })),
    [zoneMetrics],
  );
  const donneesSelected = useMemo(
    () =>
      safeLayout.metrics.map((m) => {
        const field = fields.find((f) => f.id === m.field_id);
        return {
          id: String(m.field_id),
          name: m.name || m.alias || String(m.field_id),
          type: field?.data_type ?? '',
          aggregation: m.aggregation ?? 'sum',
        };
      }),
    [safeLayout.metrics, fields],
  );
  const handleDonneesChange = useCallback(
    (selected: MultiSelectItem[]) => {
      const metrics: ChartMetric[] = selected.map((s) => {
        const existing = safeLayout.metrics.find(
          (m) => m.field_id === Number(s.id),
        );
        const field = zoneMetrics.find((f) => String(f.id) === s.id);
        return existing
          ? { ...existing, aggregation: (s.aggregation ?? existing.aggregation) as ChartMetric['aggregation'] }
          : {
              field_id: Number(s.id),
              name: s.name,
              alias: s.name,
              data_type: field?.data_type ?? "string",
              aggregation: (s.aggregation ?? "sum") as ChartMetric['aggregation'],
            };
      });
      onUpdateLayout("metrics", metrics);
    },
    [safeLayout.metrics, zoneMetrics, onUpdateLayout],
  );

  // ── Dimensions modal ──
  const dimItems = useMemo(() => {
    // Exclude items already in the opposing zone (columns ↔ rows are mutually exclusive)
    const otherZone = dimsModalZone === "columns" ? "rows" : "columns";
    const otherIds = new Set(
      (safeLayout[otherZone] as ChartDimension[]).map((d) => d.field_id),
    );
    return zoneDimensions
      .filter((f) => !otherIds.has(f.id as number))
      .map((f) => ({ id: String(f.id), name: f.name }));
  }, [zoneDimensions, dimsModalZone, safeLayout]);
  const dimsSelected = useMemo(
    () =>
      (dimsModalZone ? (safeLayout[dimsModalZone] as ChartDimension[]) : []).map(
        (d) => ({
          id: String(d.field_id),
          name: d.alias || d.name || String(d.field_id),
        }),
      ),
    [dimsModalZone, safeLayout],
  );
  const handleDimsChange = useCallback(
    (selected: { id: string; name: string }[]) => {
      if (!dimsModalZone) return;
      const otherZone = dimsModalZone === "columns" ? "rows" : "columns";
      const dims: ChartDimension[] = selected.map((s) => {
        const existing = (safeLayout[dimsModalZone] as ChartDimension[]).find(
          (d) => d.field_id === Number(s.id),
        );
        const field = zoneDimensions.find((f) => String(f.id) === s.id);
        return (
          existing ?? {
            field_id: Number(s.id),
            name: s.name,
            alias: s.name,
            data_type: field?.data_type ?? "string",
          }
        );
      });
      // Mutual exclusion: remove from the other zone any item just selected here
      const selectedIds = new Set(selected.map((s) => Number(s.id)));
      const otherDims = (safeLayout[otherZone] as ChartDimension[]).filter(
        (d) => !selectedIds.has(d.field_id),
      );
      onUpdateLayout(dimsModalZone, dims);
      onUpdateLayout(otherZone, otherDims);
    },
    [dimsModalZone, safeLayout, zoneDimensions, onUpdateLayout],
  );

  // ── Filtres modal ──
  const filterItems = useMemo(
    () => fields.map((f) => ({ id: String(f.id), name: f.name, type: f.data_type ?? '' })),
    [fields],
  );
  const filtersSelected = useMemo(
    () =>
      safeLayout.filters.map((f) => {
        const field = fields.find((fd) => fd.id === f.field_id);
        return {
          id: String(f.field_id),
          name: field?.name ?? String(f.field_id),
          type: field?.data_type ?? '',
          operator: f.operator,
          value: f.value != null ? String(f.value) : '',
          value2: f.value2 != null ? String(f.value2) : '',
        };
      }),
    [safeLayout.filters, fields],
  );
  const handleFiltersChange = useCallback(
    (selected: MultiSelectItem[]) => {
      const filters: ChartFilter[] = selected.map((s) => {
        const existing = safeLayout.filters.find((f) => f.field_id === Number(s.id));
        const field = fields.find((f) => String(f.id) === s.id);
        return {
          field_id: Number(s.id),
          field_type: (field?.field_type ?? "dimension") as ChartFilter["field_type"],
          operator: (s.operator ?? existing?.operator ?? "=") as ChartFilter["operator"],
          value: s.value || null,
          value2: s.value2 || null,
          useSqlInClause: existing?.useSqlInClause ?? false,
        };
      });
      onUpdateLayout("filters", filters);
    },
    [safeLayout.filters, fields, onUpdateLayout],
  );

  // ── Filter config for the filter modal ──
  const filterConfig = useMemo<FilterConfig>(() => ({
    getOperators: (item) => {
      const field = fields.find((f) => String(f.id) === item.id);
      const dt = field?.data_type as SqlDataType | undefined;
      return (dt && OPERATORS_BY_TYPE[dt]) ? OPERATORS_BY_TYPE[dt] : OPERATORS_BY_TYPE['string'];
    },
    getInputType: (item) => {
      const field = fields.find((f) => String(f.id) === item.id);
      const dt = field?.data_type as SqlDataType | undefined;
      if (!dt) return 'text';
      const t = INPUT_TYPE_BY_SQL_TYPE[dt];
      return (t === 'select' || t === 'textarea') ? 'text' : (t ?? 'text');
    },
    noValueOperators: NO_VALUE_OPERATORS,
    rangeOperators: ['BETWEEN', 'NOT BETWEEN'],
  }), [fields]);

  // ── Drag handlers ──
  const handleDragOverZone = useCallback(
    (e: React.DragEvent, zone: LayoutDataZone) => {
      const { types } = e.dataTransfer;
      if (!types.includes(DRAG_KEY) && !types.includes(CHIP_DRAG_KEY)) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      setDragOverZone(zone);
    },
    [],
  );

  const handleDragLeaveZone = useCallback((e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOverZone(null);
    }
  }, []);

  // Convert items from one zone type to another
  const convertItemsForZone = useCallback(
    (
      items: (ChartDimension | ChartMetric | ChartFilter)[],
      fromZone: LayoutDataZone,
      toZone: LayoutDataZone,
    ): (ChartDimension | ChartFilter)[] => {
      if (fromZone === toZone) return items as (ChartDimension | ChartFilter)[];

      if (toZone === "metrics") {
        // → ChartMetric
        return items.map((item) => {
          const field = fields.find((f) => f.id === item.field_id);
          return {
            field_id: item.field_id,
            name: field?.name,
            alias: field?.name ?? String(item.field_id),
            data_type: field?.data_type,
            aggregation: "sum",
          } as ChartMetric;
        });
      }

      if (toZone === "filters") {
        // → ChartFilter
        return items.map((item) => {
          const field = fields.find((f) => f.id === item.field_id);
          return {
            field_id: item.field_id,
            field_type: (field?.field_type ??
              "dimension") as ChartFilter["field_type"],
            operator: "=" as const,
            value: null,
            value2: null,
            useSqlInClause: false,
          } as ChartFilter;
        });
      }

      if (fromZone === "filters") {
        // ChartFilter → ChartDimension
        return items.map((item) => {
          const field = fields.find((f) => f.id === item.field_id);
          return {
            field_id: item.field_id,
            alias: field?.name ?? String(item.field_id),
            name: field?.name,
            data_type: field?.data_type,
          } as ChartDimension;
        });
      }

      // columns ↔ rows or metrics → columns/rows: already ChartDimension-compatible
      return items as ChartDimension[];
    },
    [fields],
  );

  const handleDropZone = useCallback(
    (e: React.DragEvent, toZone: LayoutDataZone) => {
      e.preventDefault();
      setDragOverZone(null);

      // ── Chip drag: SWAP the two groups ──
      const chipRaw = e.dataTransfer.getData(CHIP_DRAG_KEY);
      if (chipRaw) {
        const { fromZone } = JSON.parse(chipRaw) as {
          fromZone: LayoutDataZone;
        };
        if (fromZone === toZone) return;

        // "Données" chip: just move its position, don't swap contents
        if (fromZone === "metrics") {
          if (toZone === "columns" || toZone === "rows") {
            setDonneesZone(toZone);
          }
          return;
        }

        // All other chips: SWAP the contents of the two zones
        const fromContent = safeLayout[fromZone];
        const toContent = safeLayout[toZone];
        onUpdateLayout(
          toZone,
          convertItemsForZone(fromContent, fromZone, toZone) as any,
        );
        onUpdateLayout(
          fromZone,
          convertItemsForZone(toContent, toZone, fromZone) as any,
        );
      } else {
        // ── Sidebar individual item drag ──
        const raw = e.dataTransfer.getData(DRAG_KEY);
        if (!raw) return;

        const parsed = JSON.parse(raw);
        const { field_id, fromDataZone } = parsed;
        if (!isMoveAllowed(fromDataZone, toZone)) return;
        if (fromDataZone !== null) {
          onMoveLayout(field_id, fromDataZone, toZone, safeLayout[toZone].length);
        } else {
          if (safeLayout[toZone].some((item) => item.field_id === field_id)) return;
          const field = fields.find((f) => f.id === field_id);
          if (!field) return;
          if (toZone === "filters") {
            onAddLayout(toZone, [
              {
                field_id,
                field_type: (field.field_type ??
                  "dimension") as ChartFilter["field_type"],
                operator: "=" as const,
                value: null,
                value2: null,
                useSqlInClause: false,
              },
            ]);
          } else {
            onAddLayout(toZone, [
              {
                field_id,
                name: field.name,
                alias: field.name,
                data_type: field.data_type ?? "string",
              } as ChartDimension,
            ]);
          }
        }
      }
    },
    [
      safeLayout,
      fields,
      onMoveLayout,
      onAddLayout,
      onUpdateLayout,
      convertItemsForZone,
    ],
  );

  return (
    <div className={styles.dhisLayout}>
      {/* ── LEFT SIDEBAR ── */}
      <div className={styles.sidebar}>
        {/* Bouton type de graphe */}
        <button
          type="button"
          className={styles.chartTypeBtn}
          onClick={() => setIsTypeModalOpen(true)}
        >
          {currentChartType?.icon}
          <span className={styles.chartTypeName}>
            {currentChartType?.name ?? chartType}
          </span>
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            style={{ marginLeft: "auto", opacity: 0.5 }}
          >
            <path
              d="M3 4.5L6 7.5L9 4.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {/* Recherche */}
        <div className={styles.sidebarSearch}>
          <Search size={13} color="#94a3b8" />
          <input
            className={styles.sidebarSearchInput}
            placeholder="Filtrer les dimensions"
            value={dimSearch}
            onChange={(e) => setDimSearch(e.target.value)}
          />
        </div>

        <div className={styles.dimSection}>
          <span className={styles.sectionLabel}>DIMENSIONS PRINCIPALES</span>

          <div
            className={`${styles.dimItem} ${safeLayout.metrics.length > 0 ? styles.dimItemActive : ""}`}
            onClick={() => setDonneesModalOpen(true)}
          >
            <Database size={14} className={styles.dimIcon} />
            <span className={styles.dimLabel}>Données</span>
            <button
              type="button"
              className={styles.dimEllipsis}
              onClick={(e) => {
                e.stopPropagation();
                setColsEditOpen(true);
              }}
            >
              •••
            </button>
          </div>

          <div
            className={styles.dimItem}
            onClick={() => setDimsModalZone("columns")}
          >
            <Layers size={14} className={styles.dimIcon} />
            <span className={styles.dimLabel}>Dimensions</span>
          </div>

          <div
            className={styles.dimItem}
            onClick={() => setFiltersModalOpen(true)}
          >
            <Filter size={14} className={styles.dimIcon} />
            <span className={styles.dimLabel}>Filtres</span>
          </div>
        </div>

        {/* ── Individual draggable dimension items ── */}
        <div className={styles.dimSection}>
          <span className={styles.sectionLabel}>CHAMPS DISPONIBLES</span>
          {zoneDimensions
            .filter(
              (f) =>
                !dimSearch ||
                f.name.toLowerCase().includes(dimSearch.toLowerCase()),
            )
            .map((f) => {
              const inZone = safeLayout.columns.some((c) => c.field_id === f.id)
                ? ("columns" as const)
                : safeLayout.rows.some((r) => r.field_id === f.id)
                  ? ("rows" as const)
                  : safeLayout.filters.some((fi) => fi.field_id === f.id)
                    ? ("filters" as const)
                    : null;
              return (
                <div
                  key={f.id}
                  className={`${styles.dimItem} ${inZone ? styles.dimItemActive : ""}`}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.effectAllowed = "move";
                    e.dataTransfer.setData(
                      DRAG_KEY,
                      JSON.stringify({ field_id: f.id, fromDataZone: inZone }),
                    );
                  }}
                  onDragEnd={() => setDragOverZone(null)}
                  onClick={() => {
                    if (inZone === "columns") setDimsModalZone("columns");
                    else if (inZone === "filters") setFiltersModalOpen(true);
                    else setDimsModalZone("rows");
                  }}
                >
                  <Layers size={14} className={styles.dimIcon} />
                  <span className={styles.dimLabel}>{f.name}</span>
                  {inZone && (
                    <span className={styles.dimZoneBadge}>
                      {inZone === "columns"
                        ? "Col"
                        : inZone === "rows"
                          ? "Lig"
                          : "Fil"}
                    </span>
                  )}
                </div>
              );
            })}
        </div>
      </div>

      {/* ── RIGHT ZONES ── */}
      <div className={styles.zonesArea}>
        {/* Top row: Colonnes + Filtrer */}
        <div className={styles.topZones}>
          {/* Zone Colonnes */}
          <div
            className={`${styles.colsZone} ${dragOverZone === "columns" ? styles.zoneDropOver : ""}`}
            onDragOver={(e) => handleDragOverZone(e, "columns")}
            onDragLeave={handleDragLeaveZone}
            onDrop={(e) => handleDropZone(e, "columns")}
          >
            <span className={styles.zoneLabel}>Colonnes</span>
            <div className={styles.zoneChips}>
                {donneesZone === "columns" && (
                  <Chip
                    icon={<Database size={13} />}
                    label="Données"
                    count={safeLayout.metrics.length}
                    chipStyles={styles as any}
                    onClick={() => setColsEditOpen(true)}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.effectAllowed = "move";
                      e.dataTransfer.setData(
                        CHIP_DRAG_KEY,
                        JSON.stringify({ fromZone: "metrics" }),
                      );
                    }}
                    onDragEnd={() => setDragOverZone(null)}
                  />
                )}
                <Chip
                  icon={<Layers size={13} />}
                  label="Dim. Col."
                  count={safeLayout.columns.length}
                  chipStyles={styles as any}
                  onClick={() => setDimsModalZone("columns")}
                  draggable={true}
                  onDragStart={(e) => {
                    e.dataTransfer.effectAllowed = "move";
                    e.dataTransfer.setData(
                      CHIP_DRAG_KEY,
                      JSON.stringify({ fromZone: "columns" }),
                    );
                  }}
                  onDragEnd={() => setDragOverZone(null)}
              />
            </div>
          </div>

          {/* Zone Filtrer */}
          <div
            className={`${styles.filterZone} ${dragOverZone === "filters" ? styles.zoneDropOver : ""}`}
            onDragOver={(e) => handleDragOverZone(e, "filters")}
            onDragLeave={handleDragLeaveZone}
            onDrop={(e) => handleDropZone(e, "filters")}
          >
            <span className={styles.zoneLabel}>Filtrer</span>
            <div className={styles.zoneChips}>
                <Chip
                  icon={<Filter size={13} />}
                  label="Filtres"
                  count={safeLayout.filters.length}
                  chipStyles={styles as any}
                  onClick={() => setFiltersModalOpen(true)}
                  draggable={safeLayout.filters.length > 0}
                  onDragStart={(e) => {
                    e.dataTransfer.effectAllowed = "move";
                    e.dataTransfer.setData(
                      CHIP_DRAG_KEY,
                      JSON.stringify({ fromZone: "filters" }),
                    );
                  }}
                  onDragEnd={() => setDragOverZone(null)}
              />
            </div>
          </div>
        </div>

        {/* Zone Lignes */}
        <div
          className={`${styles.zoneRow} ${dragOverZone === "rows" ? styles.zoneDropOver : ""}`}
          onDragOver={(e) => handleDragOverZone(e, "rows")}
          onDragLeave={handleDragLeaveZone}
          onDrop={(e) => handleDropZone(e, "rows")}
        >
          <span className={styles.zoneLabel}>Lignes</span>
          <div className={styles.zoneChips}>
            {donneesZone === "rows" && (
              <Chip
                icon={<Database size={13} />}
                label="Données"
                count={safeLayout.metrics.length}
                chipStyles={styles as any}
                onClick={() => setColsEditOpen(true)}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.effectAllowed = "move";
                  e.dataTransfer.setData(
                    CHIP_DRAG_KEY,
                    JSON.stringify({ fromZone: "metrics" }),
                  );
                }}
                onDragEnd={() => setDragOverZone(null)}
              />
            )}
            <Chip
              icon={<Layers size={13} />}
              label="Dim. Lig."
              count={safeLayout.rows.length}
              chipStyles={styles as any}
              onClick={() => setDimsModalZone("rows")}
              draggable={true}
              onDragStart={(e) => {
                e.dataTransfer.effectAllowed = "move";
                e.dataTransfer.setData(
                  CHIP_DRAG_KEY,
                  JSON.stringify({ fromZone: "rows" }),
                );
              }}
              onDragEnd={() => setDragOverZone(null)}
            />
          </div>
        </div>
      </div>

      {/* ── HIDDEN LAYOUT DROP ZONES (modals only) ── */}
      <LayoutDropZone
        dataZone="metrics"
        title="Colonnes - Données"
        items={safeLayout.metrics}
        fields={zoneMetrics}
        onAddLayout={onAddLayout}
        onUpdateLayout={onUpdateLayout}
        onRemoveLayout={onRemoveLayout}
        onMoveLayout={onMoveLayout}
        isEditOpen={colsEditOpen}
        onEditClose={() => setColsEditOpen(false)}
        hideZoneUI
      />

      {/* ── MODAL TYPE DE GRAPHE ── */}
      <ChartTypePickerModal
        isOpen={isTypeModalOpen}
        selectedChartType={chartType}
        options={options}
        onClose={() => setIsTypeModalOpen(false)}
        onSelectChartType={(type) => {
          onSelectChartType(type);
          setIsTypeModalOpen(false);
        }}
      />

      {/* ── DIMENSIONS MODAL (tabbed) ── */}
      <Modal
        isOpen={dimsModalZone !== null}
        onClose={() => setDimsModalZone(null)}
        title="Dimensions"
        size="lg"
        closeOnBackdrop
        closeOnEscape
      >
        {/* Tabs */}
        <div className={styles.dimModalTabs}>
          <button
            type="button"
            className={`${styles.dimModalTab} ${dimsModalZone === "columns" ? styles.dimModalTabActive : ""}`}
            onClick={() => setDimsModalZone("columns")}
          >
            <Layers size={13} />
            Dim. Col.
            {safeLayout.columns.length > 0 && (
              <span className={styles.dimModalTabBadge}>{safeLayout.columns.length}</span>
            )}
          </button>
          <button
            type="button"
            className={`${styles.dimModalTab} ${dimsModalZone === "rows" ? styles.dimModalTabActive : ""}`}
            onClick={() => setDimsModalZone("rows")}
          >
            <Layers size={13} />
            Dim. Lig.
            {safeLayout.rows.length > 0 && (
              <span className={styles.dimModalTabBadge}>{safeLayout.rows.length}</span>
            )}
          </button>
        </div>

        <FormMultiSelectDualPanel
          items={dimItems}
          selectedItems={dimsSelected}
          onChange={handleDimsChange}
          leftTitle="Dimensions disponibles"
          rightTitle={dimsModalZone === "columns" ? "Colonnes sélectionnées" : "Lignes sélectionnées"}
        />
        <div className={styles.modalFooter}>
          <Button variant="secondary" onClick={() => setDimsModalZone(null)}>
            Masquer
          </Button>
          <Button onClick={() => setDimsModalZone(null)}>Mettre à jour</Button>
        </div>
      </Modal>

      {/* ── FILTRES MODAL ── */}
      <Modal
        isOpen={filtersModalOpen}
        onClose={() => setFiltersModalOpen(false)}
        title="Filtres"
        size="lg"
        closeOnBackdrop
        closeOnEscape
      >
        <FormMultiSelectDualPanel
          items={filterItems}
          selectedItems={filtersSelected}
          onChange={handleFiltersChange}
          leftTitle="Champs disponibles"
          rightTitle="Filtres sélectionnés"
          rightPanelMode="filter"
          filterConfig={filterConfig}
        />
        <div className={styles.modalFooter}>
          <Button
            variant="secondary"
            onClick={() => setFiltersModalOpen(false)}
          >
            Masquer
          </Button>
          <Button onClick={() => setFiltersModalOpen(false)}>
            Mettre à jour
          </Button>
        </div>
      </Modal>

      {/* ── DONNÉES MODAL ── */}
      <Modal
        isOpen={donneesModalOpen}
        onClose={() => setDonneesModalOpen(false)}
        title="Données"
        size="lg"
        closeOnBackdrop
        closeOnEscape
      >
        <FormMultiSelectDualPanel
          items={donneesItems}
          selectedItems={donneesSelected}
          onChange={handleDonneesChange}
          leftTitle="Données disponibles"
          rightTitle="Éléments sélectionnés"
          rightPanelMode="table"
        />
        <div className={styles.modalFooter}>
          <Button
            variant="secondary"
            onClick={() => setDonneesModalOpen(false)}
          >
            Masquer
          </Button>
          <Button onClick={() => setDonneesModalOpen(false)}>
            Mettre à jour
          </Button>
        </div>
      </Modal>
    </div>
  );
};
