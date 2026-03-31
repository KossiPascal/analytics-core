import React, { useState, useCallback, useMemo } from 'react';
import { Database, Filter, Layers, Search, X } from "lucide-react";
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
function isMoveAllowed(from: LayoutDataZone, to: LayoutDataZone): boolean {
  if (from === to) return false;
  if (from === "metrics") return false;
  return true;
}

// ── MODULE-LEVEL DimChip (draggable individual item) ─────────────────────────
interface DimChipProps {
  item: ChartDimension | ChartFilter;
  zone: LayoutDataZone;
  fieldName?: string; // override label (needed for ChartFilter which has no name/alias)
  chipStyles: Record<string, string>;
  onDragStart: (e: React.DragEvent, fieldId: number, zone: LayoutDataZone) => void;
  onDragEnd: () => void;
  onRemove: (fieldId: number, zone: LayoutDataZone) => void;
  onEdit: () => void;
}

const DimChip: React.FC<DimChipProps> = ({
  item,
  zone,
  fieldName,
  chipStyles,
  onDragStart,
  onDragEnd,
  onRemove,
  onEdit,
}) => {
  const label =
    fieldName ||
    (item as ChartDimension).alias ||
    (item as ChartDimension).name ||
    String(item.field_id);
  return (
    <div
      className={chipStyles.dimChip}
      draggable
      onDragStart={(e) => onDragStart(e, item.field_id, zone)}
      onDragEnd={onDragEnd}
      onClick={onEdit}
    >
      <span className={chipStyles.chipIcon}>
        {zone === "filters" ? <Filter size={12} /> : <Layers size={12} />}
      </span>
      <span>{label}</span>
      <button
        type="button"
        className={chipStyles.chipRemove}
        onClick={(e) => {
          e.stopPropagation();
          onRemove(item.field_id, zone);
        }}
      >
        <X size={10} />
      </button>
    </div>
  );
};

// ── MODULE-LEVEL Chip (generic, non-draggable) ────────────────────────────────
interface ChipProps {
  icon: React.ReactNode;
  label: string;
  count?: number;
  chipStyles: Record<string, string>;
  onClick: () => void;
}

const Chip: React.FC<ChipProps> = ({
  icon,
  label,
  count,
  chipStyles,
  onClick,
}) => (
  <div className={chipStyles.chip} onClick={onClick}>
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
  const dimItems = useMemo(
    () => zoneDimensions.map((f) => ({ id: String(f.id), name: f.name })),
    [zoneDimensions],
  );
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
      onUpdateLayout(dimsModalZone, dims);
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
  const handleDragStart = useCallback(
    (e: React.DragEvent, fieldId: number, zone: LayoutDataZone) => {
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData(
        DRAG_KEY,
        JSON.stringify({ field_id: fieldId, fromDataZone: zone }),
      );
    },
    [],
  );

  const handleDragEnd = useCallback(() => {
    setDragOverZone(null);
  }, []);

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

  const handleDropZone = useCallback(
    (e: React.DragEvent, toZone: LayoutDataZone) => {
      e.preventDefault();
      setDragOverZone(null);
      const raw = e.dataTransfer.getData(DRAG_KEY);
      if (!raw) return;
      const { field_id, fromDataZone } = JSON.parse(raw) as {
        field_id: number;
        fromDataZone: LayoutDataZone;
      };
      if (!isMoveAllowed(fromDataZone, toZone)) return;
      onMoveLayout(field_id, fromDataZone, toZone, layout[toZone].length);
    },
    [layout, onMoveLayout],
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
              />
              <Chip
                icon={<Layers size={13} />}
                label="Dimensions"
                count={layout.columns.length}
                chipStyles={styles as any}
                onClick={() => setDimsModalZone("columns")}
              />
              {layout.columns.map((col) => (
                <DimChip
                  key={col.field_id}
                  item={col}
                  zone="columns"
                  chipStyles={styles as any}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                  onRemove={onRemoveLayout}
                  onEdit={() => setDimsModalZone("columns")}
                />
              ))}
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
              />
              {layout.filters.map((filt) => (
                <DimChip
                  key={filt.field_id}
                  item={filt}
                  zone="filters"
                  fieldName={fields.find((f) => f.id === filt.field_id)?.name}
                  chipStyles={styles as any}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                  onRemove={onRemoveLayout}
                  onEdit={() => setFiltersModalOpen(true)}
                />
              ))}
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
            />
            {layout.rows.map((row) => (
              <DimChip
                key={row.field_id}
                item={row}
                zone="rows"
                chipStyles={styles as any}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onRemove={onRemoveLayout}
                onEdit={() => setDimsModalZone("rows")}
              />
            ))}
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



