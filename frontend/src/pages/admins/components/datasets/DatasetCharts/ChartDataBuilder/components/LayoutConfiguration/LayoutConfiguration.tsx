import React, { useState, useCallback, useMemo } from 'react';
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
} from "@/models/dataset.models";
import { Modal } from "@/components/ui/Modal/Modal";
import { FormMultiSelectDualPanel } from "@/components/forms/FormMultiSelectDualPanel/FormMultiSelectDualPanel";
import { Button } from "@/components/ui/Button/Button";
import type {
  ChartTypeOption,
  ChartVariant,
  VisualizationOptions,
} from "../types";
import { ChartTypePickerModal } from "../../../components/chart-utils/ChartTypePickerModal";
import styles from "./LayoutConfiguration.module.css";

// ── DRAG KEY (must match LayoutDropZone) ──────────────────────────────────────
const DRAG_KEY = "layout-drag-item";

// ── MODULE-LEVEL HELPER ───────────────────────────────────────────────────────
// fromDataZone is null when the item comes from the sidebar (not yet in any zone)
function isMoveAllowed(from: LayoutDataZone | null, to: LayoutDataZone): boolean {
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
  const currentChartType = useMemo(
    () => chartTypes.find((t) => t.id === chartType),
    [chartTypes, chartType],
  );

  const [dimSearch, setDimSearch] = useState("");
  const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);

  // Modal states
  const [donneesModalOpen, setDonneesModalOpen] = useState(false);
  const [colsEditOpen, setColsEditOpen] = useState(false);
  const [dimsModalZone, setDimsModalZone] = useState<'columns' | 'rows' | null>(null);
  const [filtersModalOpen, setFiltersModalOpen] = useState(false);

  // Drag-over indicator
  const [dragOverZone, setDragOverZone] = useState<LayoutDataZone | null>(null);

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
    () => zoneMetrics.map((f) => ({ id: String(f.id), name: f.name })),
    [zoneMetrics],
  );
  const donneesSelected = useMemo(
    () =>
      layout.metrics.map((m) => ({
        id: String(m.field_id),
        name: m.name || m.alias || String(m.field_id),
      })),
    [layout.metrics],
  );
  const handleDonneesChange = useCallback(
    (selected: { id: string; name: string }[]) => {
      const metrics: ChartMetric[] = selected.map((s) => {
        const existing = layout.metrics.find(
          (m) => m.field_id === Number(s.id),
        );
        const field = zoneMetrics.find((f) => String(f.id) === s.id);
        return (
          existing ?? {
            field_id: Number(s.id),
            name: s.name,
            alias: s.name,
            data_type: field?.data_type ?? "string",
            aggregation: "sum",
          }
        );
      });
      onUpdateLayout("metrics", metrics);
    },
    [layout.metrics, zoneMetrics, onUpdateLayout],
  );

  // ── Dimensions modal ──
  const dimItems = useMemo(() => {
    // Exclude items already in the opposing zone (columns ↔ rows are mutually exclusive)
    const otherZone = dimsModalZone === "columns" ? "rows" : "columns";
    const otherIds = new Set(
      (layout[otherZone] as ChartDimension[]).map((d) => d.field_id),
    );
    return zoneDimensions
      .filter((f) => !otherIds.has(f.id as number))
      .map((f) => ({ id: String(f.id), name: f.name }));
  }, [zoneDimensions, dimsModalZone, layout]);
  const dimsSelected = useMemo(
    () =>
      (dimsModalZone ? (layout[dimsModalZone] as ChartDimension[]) : []).map(
        (d) => ({
          id: String(d.field_id),
          name: d.alias || d.name || String(d.field_id),
        }),
      ),
    [dimsModalZone, layout],
  );
  const handleDimsChange = useCallback(
    (selected: { id: string; name: string }[]) => {
      if (!dimsModalZone) return;
      const otherZone = dimsModalZone === "columns" ? "rows" : "columns";
      const dims: ChartDimension[] = selected.map((s) => {
        const existing = (layout[dimsModalZone] as ChartDimension[]).find(
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
      const otherDims = (layout[otherZone] as ChartDimension[]).filter(
        (d) => !selectedIds.has(d.field_id),
      );
      onUpdateLayout(dimsModalZone, dims);
      onUpdateLayout(otherZone, otherDims);
    },
    [dimsModalZone, layout, zoneDimensions, onUpdateLayout],
  );

  // ── Filtres modal ──
  const filterItems = useMemo(
    () => fields.map((f) => ({ id: String(f.id), name: f.name })),
    [fields],
  );
  const filtersSelected = useMemo(
    () =>
      layout.filters.map((f) => {
        const field = fields.find((fd) => fd.id === f.field_id);
        return { id: String(f.field_id), name: field?.name ?? String(f.field_id) };
      }),
    [layout.filters, fields],
  );
  const handleFiltersChange = useCallback(
    (selected: { id: string; name: string }[]) => {
      const filters: ChartFilter[] = selected.map((s) => {
        const existing = layout.filters.find(
          (f) => f.field_id === Number(s.id),
        );
        const field = fields.find((f) => String(f.id) === s.id);
        return (
          existing ?? {
            field_id: Number(s.id),
            field_type: (field?.field_type ?? "dimension") as ChartFilter["field_type"],
            operator: "=" as const,
            value: null,
            value2: null,
            useSqlInClause: false,
          }
        );
      });
      onUpdateLayout("filters", filters);
    },
    [layout.filters, fields, onUpdateLayout],
  );

  // ── Drag handlers ──
  const handleDragOverZone = useCallback(
    (e: React.DragEvent, zone: LayoutDataZone) => {
      if (!e.dataTransfer.types.includes(DRAG_KEY)) return;
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
      toZone: LayoutDataZone,
    ): (ChartDimension | ChartFilter)[] => {
      if (toZone === "filters") {
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
      // toZone is "columns" or "rows" — produce ChartDimension
      return items.map((item) => {
        const asFilter = item as ChartFilter;
        if ("operator" in asFilter && !("alias" in item)) {
          // coming from filters zone
          const field = fields.find((f) => f.id === item.field_id);
          return {
            field_id: item.field_id,
            alias: field?.name ?? String(item.field_id),
            name: field?.name,
            data_type: field?.data_type,
          } as ChartDimension;
        }
        return item as ChartDimension;
      });
    },
    [fields],
  );

  const handleDropZone = useCallback(
    (e: React.DragEvent, toZone: LayoutDataZone) => {
      e.preventDefault();
      setDragOverZone(null);
      const raw = e.dataTransfer.getData(DRAG_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as
        | { isChipDrag: true; fromZone: LayoutDataZone }
        | { isChipDrag?: false; field_id: number; fromDataZone: LayoutDataZone | null };

      if (parsed.isChipDrag) {
        // ── Chip drag: move all items from fromZone → toZone ──
        const { fromZone } = parsed;
        if (fromZone === toZone) return;
        const sourceItems = layout[fromZone];
        if (!sourceItems.length) return;
        const converted = convertItemsForZone(sourceItems, toZone);
        // Merge into target, deduplicating by field_id
        const existingIds = new Set(layout[toZone].map((i) => i.field_id));
        const toAdd = converted.filter((i) => !existingIds.has(i.field_id));
        onUpdateLayout(toZone, [...(layout[toZone] as any[]), ...toAdd]);
        onUpdateLayout(fromZone, []);
      } else {
        // ── Sidebar individual item drag ──
        const { field_id, fromDataZone } = parsed;
        if (!isMoveAllowed(fromDataZone, toZone)) return;
        if (fromDataZone !== null) {
          onMoveLayout(field_id, fromDataZone, toZone, layout[toZone].length);
        } else {
          if (layout[toZone].some((item) => item.field_id === field_id)) return;
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
    [layout, fields, onMoveLayout, onAddLayout, onUpdateLayout, convertItemsForZone],
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
            className={`${styles.dimItem} ${layout.metrics.length > 0 ? styles.dimItemActive : ""}`}
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

          <div className={styles.dimItem} onClick={() => setDimsModalZone("rows")}>
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
              const inZone = layout.columns.some((c) => c.field_id === f.id)
                ? ("columns" as const)
                : layout.rows.some((r) => r.field_id === f.id)
                  ? ("rows" as const)
                  : layout.filters.some((fi) => fi.field_id === f.id)
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
              <Chip
                icon={<Database size={13} />}
                label="Données"
                count={layout.metrics.length}
                chipStyles={styles as any}
                onClick={() => setColsEditOpen(true)}
                draggable={layout.metrics.length > 0}
                onDragStart={(e) => {
                  e.dataTransfer.effectAllowed = "move";
                  e.dataTransfer.setData(
                    DRAG_KEY,
                    JSON.stringify({ isChipDrag: true, fromZone: "metrics" }),
                  );
                }}
                onDragEnd={() => setDragOverZone(null)}
              />
              <Chip
                icon={<Layers size={13} />}
                label="Dimensions"
                count={layout.columns.length}
                chipStyles={styles as any}
                onClick={() => setDimsModalZone("columns")}
                draggable={layout.columns.length > 0}
                onDragStart={(e) => {
                  e.dataTransfer.effectAllowed = "move";
                  e.dataTransfer.setData(
                    DRAG_KEY,
                    JSON.stringify({ isChipDrag: true, fromZone: "columns" }),
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
                count={layout.filters.length}
                chipStyles={styles as any}
                onClick={() => setFiltersModalOpen(true)}
                draggable={layout.filters.length > 0}
                onDragStart={(e) => {
                  e.dataTransfer.effectAllowed = "move";
                  e.dataTransfer.setData(
                    DRAG_KEY,
                    JSON.stringify({ isChipDrag: true, fromZone: "filters" }),
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
            <Chip
              icon={<Layers size={13} />}
              label="Dimensions"
              count={layout.rows.length}
              chipStyles={styles as any}
              onClick={() => setDimsModalZone("rows")}
              draggable={layout.rows.length > 0}
              onDragStart={(e) => {
                e.dataTransfer.effectAllowed = "move";
                e.dataTransfer.setData(
                  DRAG_KEY,
                  JSON.stringify({ isChipDrag: true, fromZone: "rows" }),
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
        items={layout.metrics}
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

      {/* ── DIMENSIONS MODAL ── */}
      <Modal
        isOpen={dimsModalZone !== null}
        onClose={() => setDimsModalZone(null)}
        title={dimsModalZone === "columns" ? "Dimensions — Colonnes" : "Dimensions — Lignes"}
        size="lg"
        closeOnBackdrop
        closeOnEscape
      >
        <FormMultiSelectDualPanel
          items={dimItems}
          selectedItems={dimsSelected}
          onChange={handleDimsChange}
          leftTitle="Dimensions disponibles"
          rightTitle="Dimensions sélectionnées"
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



