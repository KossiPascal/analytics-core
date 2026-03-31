import React, { useState, useMemo } from 'react';
import { X } from 'lucide-react';

import {
  ChartDimension,
  ChartFilter,
  ChartMetric,
  DatasetField,
} from '@/models/dataset.models';
import type { ChartTypeOption, ChartVariant } from '../../components/types';
import { LayoutDataZone, LayoutState } from '../LayoutDropZone/LayoutDropZone';
import styles from './LayoutConfiguration.module.css';

// ── Props ─────────────────────────────────────────────────────────────────────
interface LayoutConfigurationProps {
  layout: LayoutState;
  fields: DatasetField[];
  onRemoveLayout: (id: number, zone: keyof LayoutState) => void;
  onMoveLayout: (
    itemId: number,
    fromZone: LayoutDataZone,
    toZone: LayoutDataZone,
    toIndex: number,
  ) => void;
  onUpdateLayout: (
    zone: keyof LayoutState,
    fields: (ChartDimension | ChartMetric | ChartFilter)[],
  ) => void;
  onAddLayout: (
    zone: LayoutDataZone,
    items: (ChartDimension | ChartMetric | ChartFilter)[],
  ) => void;
  chartType?: ChartVariant;
  chartTypes?: ChartTypeOption[];
  options?: unknown;
  onSelectChartType?: (type: ChartVariant) => void;
}

// ── Drag ─────────────────────────────────────────────────────────────────────
const DRAG_KEY = 'chart-layout-dnd';

type DragPayload =
  | { source: 'zone'; field_id: number; fromZone: LayoutDataZone }
  | { source: 'sidebar'; field_id: number };

// ── DimChip — module-level to avoid remount during drag ──────────────────────
interface DimChipProps {
  field_id: number;
  label: string;
  zone: LayoutDataZone;
  onRemove: () => void;
}

const DimChip: React.FC<DimChipProps> = ({ field_id, label, zone, onRemove }) => {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData(
      DRAG_KEY,
      JSON.stringify({ source: 'zone', field_id, fromZone: zone } satisfies DragPayload),
    );
  };

  return (
    <div className={styles.dimChip} draggable onDragStart={handleDragStart}>
      {label}
      <button
        type="button"
        className={styles.chipRemove}
        onClick={(e) => { e.stopPropagation(); onRemove(); }}
      >
        <X size={11} />
      </button>
    </div>
  );
};

// ── SidebarField — draggable field from the left panel ───────────────────────
const SidebarField: React.FC<{ field: DatasetField }> = ({ field }) => {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData(
      DRAG_KEY,
      JSON.stringify({ source: 'sidebar', field_id: field.id! } satisfies DragPayload),
    );
  };

  return (
    <div className={styles.dimItem} draggable onDragStart={handleDragStart}>
      <span className={styles.dimLabel}>{field.name}</span>
    </div>
  );
};

// ── LayoutZone — drop target for a single zone ────────────────────────────────
interface LayoutZoneProps {
  zone: LayoutDataZone;
  label: string;
  items: (ChartDimension | ChartFilter)[];
  fieldMap: Map<number, DatasetField>;
  onMove: (
    field_id: number,
    fromZone: LayoutDataZone,
    toZone: LayoutDataZone,
    toIndex: number,
  ) => void;
  onAdd: (
    zone: LayoutDataZone,
    items: (ChartDimension | ChartMetric | ChartFilter)[],
  ) => void;
  onRemove: (id: number, zone: keyof LayoutState) => void;
  className?: string;
}

const LayoutZone: React.FC<LayoutZoneProps> = ({
  zone,
  label,
  items,
  fieldMap,
  onMove,
  onAdd,
  onRemove,
  className,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    if (!e.dataTransfer.types.includes(DRAG_KEY)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const raw = e.dataTransfer.getData(DRAG_KEY);
    if (!raw) return;

    const payload = JSON.parse(raw) as DragPayload;

    if (payload.source === 'sidebar') {
      const field = fieldMap.get(payload.field_id);
      if (!field) return;

      // Avoid duplicates
      if (items.some(i => i.field_id === field.id)) return;

      const newItem: ChartDimension | ChartFilter =
        zone === 'filters'
          ? {
              field_id: field.id!,
              field_type: field.field_type ?? 'dimension',
              operator: '=',
              value: null,
              value2: null,
              useSqlInClause: false,
            }
          : {
              field_id: field.id!,
              name: field.name,
              alias: field.name,
              data_type: field.data_type,
              field_type: field.field_type ?? undefined,
            };

      onAdd(zone, [newItem]);
    } else {
      const { field_id, fromZone } = payload;
      if (fromZone === zone) return;
      onMove(field_id, fromZone, zone, items.length);
    }
  };

  return (
    <div
      className={`${className ?? ''} ${isDragOver ? styles.zoneDropOver : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <span className={styles.zoneLabel}>{label}</span>
      <div className={styles.zoneChips}>
        {items.map((item) => {
          const field = fieldMap.get(item.field_id);
          const chipLabel =
            (item as ChartDimension).alias ||
            (item as ChartDimension).name ||
            field?.name ||
            String(item.field_id);

          return (
            <DimChip
              key={item.field_id}
              field_id={item.field_id}
              label={chipLabel}
              zone={zone}
              onRemove={() => onRemove(item.field_id, zone)}
            />
          );
        })}

        {items.length === 0 && (
          <span style={{ fontSize: 12, color: '#94a3b8', fontStyle: 'italic' }}>
            Glissez des éléments ici
          </span>
        )}
      </div>
    </div>
  );
};

// ── LayoutConfiguration ───────────────────────────────────────────────────────
export const LayoutConfiguration: React.FC<LayoutConfigurationProps> = ({
  layout,
  fields,
  onRemoveLayout,
  onMoveLayout,
  onAddLayout,
  chartType,
  chartTypes,
  onSelectChartType,
}) => {
  const [search, setSearch] = useState('');

  const fieldMap = useMemo(
    () => new Map(fields.map(f => [f.id!, f])),
    [fields],
  );

  const usedIds = useMemo(
    () =>
      new Set([
        ...layout.columns.map(i => i.field_id),
        ...layout.rows.map(i => i.field_id),
        ...layout.filters.map(i => i.field_id),
        ...layout.metrics.map(i => i.field_id),
      ]),
    [layout],
  );

  const availableFields = useMemo(
    () =>
      fields.filter(
        f =>
          !usedIds.has(f.id!) &&
          f.name.toLowerCase().includes(search.toLowerCase()),
      ),
    [fields, usedIds, search],
  );

  const currentChartType = chartTypes?.find(ct => ct.id === chartType);

  return (
    <div className={styles.dhisLayout}>
      {/* ── Sidebar ─────────────────────────────────────── */}
      <div className={styles.sidebar}>
        {chartTypes && onSelectChartType && (
          <button
            type="button"
            className={styles.chartTypeBtn}
            onClick={() => {
              const next = chartTypes[(chartTypes.findIndex(ct => ct.id === chartType) + 1) % chartTypes.length];
              onSelectChartType(next.id);
            }}
          >
            {currentChartType?.icon}
            <span className={styles.chartTypeName}>
              {currentChartType?.name ?? 'Type'}
            </span>
          </button>
        )}

        <div className={styles.sidebarSearch}>
          <input
            className={styles.sidebarSearchInput}
            placeholder="Rechercher un champ..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className={styles.dimSection}>
          <span className={styles.sectionLabel}>
            Disponibles ({availableFields.length})
          </span>
          {availableFields.map(field => (
            <SidebarField key={field.id} field={field} />
          ))}
          {availableFields.length === 0 && fields.length > 0 && (
            <span style={{ fontSize: 12, color: '#94a3b8', padding: '6px 12px', display: 'block' }}>
              Tous les champs sont utilisés
            </span>
          )}
        </div>
      </div>

      {/* ── Zones area ──────────────────────────────────── */}
      <div className={styles.zonesArea}>
        {/* Top row: Colonnes + Filtres */}
        <div className={styles.topZones}>
          <LayoutZone
            zone="columns"
            label="COLONNES"
            items={layout.columns as ChartDimension[]}
            fieldMap={fieldMap}
            onMove={onMoveLayout}
            onAdd={onAddLayout}
            onRemove={onRemoveLayout}
            className={styles.colsZone}
          />
          <LayoutZone
            zone="filters"
            label="FILTRES"
            items={layout.filters as ChartFilter[]}
            fieldMap={fieldMap}
            onMove={onMoveLayout}
            onAdd={onAddLayout}
            onRemove={onRemoveLayout}
            className={styles.filterZone}
          />
        </div>

        {/* Second row: Lignes */}
        <LayoutZone
          zone="rows"
          label="LIGNES"
          items={layout.rows as ChartDimension[]}
          fieldMap={fieldMap}
          onMove={onMoveLayout}
          onAdd={onAddLayout}
          onRemove={onRemoveLayout}
          className={styles.zoneRow}
        />
      </div>
    </div>
  );
};
