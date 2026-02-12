import React, { useState, useCallback, useMemo, useRef } from 'react';
import { Grid3x3, GripVertical, Plus, X } from 'lucide-react';

import { FormSelect } from '@/components/forms/FormSelect/FormSelect';
import { Modal } from '@components/ui/Modal/Modal';
import { LayoutDropZone } from '../LayoutDropZone/LayoutDropZone';
import { IndicatorFilterBuilder } from '../IndicatorBuilder/IndicatorFilterBuilder';
import type { IndicatorFilter } from '../IndicatorBuilder/IndicatorFilterBuilder';
import { DefinitionItemForm } from '@pages/builders/SqlBuilder/components/DefinitionItemForm';
import type { DefinitionEntry } from '@pages/builders/SqlBuilder/components/DefinitionItemForm';
import type { SidebarEntity } from '../IndicatorBuilder/IndicatorBuilder';
import { FILTER_OP_LABELS } from '../../../builders.models';
import type { DimensionItem, LayoutZone } from '../types';
import styles from './LayoutConfiguration.module.css';

// ============================================================================
// HELPERS
// ============================================================================

function formatFilterLabel(filter: IndicatorFilter): string {
  const { columnName, op, value } = filter;
  const opLabel = FILTER_OP_LABELS[op];
  if (op === 'is_null' || op === 'is_not_null') return `${columnName} ${opLabel}`;
  if (op === 'between' && Array.isArray(value)) return `${columnName} entre ${value[0]} et ${value[1]}`;
  if ((op === 'in' || op === 'not_in') && Array.isArray(value)) return `${columnName} ${opLabel} (${(value as string[]).join(', ')})`;
  return `${columnName} ${opLabel} ${value}`;
}

function formatEntryLabel(entry: DefinitionEntry): string {
  const formula = 'formula' in entry ? ` (${entry.formula})` : '';
  return `${entry.label}${formula}`;
}

// ============================================================================
// TYPES
// ============================================================================

interface LayoutConfigurationProps {
  allItems: DimensionItem[];
  columnItems: string[];
  rowItems: string[];
  filterItems: string[];
  onRemoveColumnItem: (id: string) => void;
  onRemoveRowItem: (id: string) => void;
  onRemoveFilterItem: (id: string) => void;
  onMoveItem: (itemId: string, fromZone: LayoutZone, toZone: LayoutZone) => void;
  entities: SidebarEntity[];
  // Filter zone — IndicatorFilterBuilder
  layoutFilters: IndicatorFilter[];
  onLayoutFiltersChange: (filters: IndicatorFilter[]) => void;
  // Row zone — DefinitionItemForm
  layoutData: DefinitionEntry[];
  onLayoutDataChange: (data: DefinitionEntry[]) => void;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const FILTER_DRAG_KEY = 'filter-reorder';
const DATA_DRAG_KEY = 'data-reorder';

const TYPE_OPTIONS = [
  { value: 'dimension', label: 'Dimension' },
  { value: 'metric', label: 'Métrique' },
];

// ============================================================================
// COMPONENT
// ============================================================================

export const LayoutConfiguration: React.FC<LayoutConfigurationProps> = ({
  allItems,
  columnItems,
  rowItems,
  filterItems,
  onRemoveColumnItem,
  onRemoveRowItem,
  onRemoveFilterItem,
  onMoveItem,
  entities = [],
  layoutFilters = [],
  onLayoutFiltersChange,
  layoutData = [],
  onLayoutDataChange,
}) => {
  // ── Filter modal state ──────────────────────────────
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [tempFilters, setTempFilters] = useState<IndicatorFilter[]>([]);
  const [filterEntityId, setFilterEntityId] = useState<string | null>(null);

  // ── Data modal state ────────────────────────────────
  const [isDataModalOpen, setIsDataModalOpen] = useState(false);
  const [dataEntityId, setDataEntityId] = useState<string | null>(null);
  const [selectedColumnName, setSelectedColumnName] = useState('');
  const [definitionType, setDefinitionType] = useState<'dimension' | 'metric'>('dimension');

  // ── Filter drag reorder ─────────────────────────────
  const filterDragRef = useRef<number | null>(null);
  const [filterDragOver, setFilterDragOver] = useState<number | null>(null);

  // ── Data drag reorder ───────────────────────────────
  const dataDragRef = useRef<number | null>(null);
  const [dataDragOver, setDataDragOver] = useState<number | null>(null);

  // ── Derived state ───────────────────────────────────

  const entityOptions = useMemo(
    () => entities.map((e) => ({ value: e.id, label: `${e.label} (${e.type})` })),
    [entities]
  );

  const filterEntity = useMemo(
    () => entities.find((e) => e.id === filterEntityId) ?? null,
    [entities, filterEntityId]
  );

  const dataEntity = useMemo(
    () => entities.find((e) => e.id === dataEntityId) ?? null,
    [entities, dataEntityId]
  );

  const columnOptions = useMemo(() => {
    if (!dataEntity) return [];
    return dataEntity.columns.map((col) => ({
      value: col.name,
      label: `${col.name} (${col.type})`,
    }));
  }, [dataEntity]);

  // ====================================================================
  // FILTER MODAL (IndicatorFilterBuilder)
  // ====================================================================

  const handleOpenFilterModal = useCallback(() => {
    setTempFilters([...layoutFilters]);
    setFilterEntityId(entities.length > 0 ? entities[0].id : null);
    setIsFilterModalOpen(true);
  }, [layoutFilters, entities]);

  const handleSaveFilters = useCallback(() => {
    onLayoutFiltersChange(tempFilters);
    setIsFilterModalOpen(false);
  }, [tempFilters, onLayoutFiltersChange]);

  const handleCancelFilterModal = useCallback(() => {
    setIsFilterModalOpen(false);
  }, []);

  const handleRemoveFilter = useCallback(
    (filterId: string) => {
      onLayoutFiltersChange(layoutFilters.filter((f) => f.id !== filterId));
    },
    [layoutFilters, onLayoutFiltersChange]
  );

  // Filter drag reorder
  const handleFilterDragStart = useCallback((e: React.DragEvent, index: number) => {
    filterDragRef.current = index;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData(FILTER_DRAG_KEY, String(index));
  }, []);

  const handleFilterDragOver = useCallback((e: React.DragEvent, index: number) => {
    if (e.dataTransfer.types.includes(FILTER_DRAG_KEY)) {
      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer.dropEffect = 'move';
      setFilterDragOver(index);
    }
  }, []);

  const handleFilterDragLeave = useCallback(() => {
    setFilterDragOver(null);
  }, []);

  const handleFilterDrop = useCallback(
    (e: React.DragEvent, dropIndex: number) => {
      e.preventDefault();
      e.stopPropagation();
      setFilterDragOver(null);
      const fromIndex = filterDragRef.current;
      if (fromIndex === null || fromIndex === dropIndex) return;
      const reordered = [...layoutFilters];
      const [moved] = reordered.splice(fromIndex, 1);
      reordered.splice(dropIndex, 0, moved);
      onLayoutFiltersChange(reordered);
      filterDragRef.current = null;
    },
    [layoutFilters, onLayoutFiltersChange]
  );

  const handleFilterDragEnd = useCallback(() => {
    filterDragRef.current = null;
    setFilterDragOver(null);
  }, []);

  // ====================================================================
  // DATA MODAL (DefinitionItemForm)
  // ====================================================================

  const handleOpenDataModal = useCallback(() => {
    setDataEntityId(entities.length > 0 ? entities[0].id : null);
    setSelectedColumnName('');
    setDefinitionType('dimension');
    setIsDataModalOpen(true);
  }, [entities]);

  const handleCloseDataModal = useCallback(() => {
    setIsDataModalOpen(false);
  }, []);

  const handleDataEntityChange = useCallback((entityId: string) => {
    setDataEntityId(entityId);
    setSelectedColumnName('');
  }, []);

  const handleAddDataEntry = useCallback(
    (entry: DefinitionEntry) => {
      onLayoutDataChange([...layoutData, entry]);
    },
    [layoutData, onLayoutDataChange]
  );

  const handleRemoveDataEntry = useCallback(
    (entryId: string) => {
      onLayoutDataChange(layoutData.filter((d) => d.id !== entryId));
    },
    [layoutData, onLayoutDataChange]
  );

  // Data drag reorder
  const handleDataDragStart = useCallback((e: React.DragEvent, index: number) => {
    dataDragRef.current = index;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData(DATA_DRAG_KEY, String(index));
  }, []);

  const handleDataDragOver = useCallback((e: React.DragEvent, index: number) => {
    if (e.dataTransfer.types.includes(DATA_DRAG_KEY)) {
      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer.dropEffect = 'move';
      setDataDragOver(index);
    }
  }, []);

  const handleDataDragLeave = useCallback(() => {
    setDataDragOver(null);
  }, []);

  const handleDataDrop = useCallback(
    (e: React.DragEvent, dropIndex: number) => {
      e.preventDefault();
      e.stopPropagation();
      setDataDragOver(null);
      const fromIndex = dataDragRef.current;
      if (fromIndex === null || fromIndex === dropIndex) return;
      const reordered = [...layoutData];
      const [moved] = reordered.splice(fromIndex, 1);
      reordered.splice(dropIndex, 0, moved);
      onLayoutDataChange(reordered);
      dataDragRef.current = null;
    },
    [layoutData, onLayoutDataChange]
  );

  const handleDataDragEnd = useCallback(() => {
    dataDragRef.current = null;
    setDataDragOver(null);
  }, []);

  // ====================================================================
  // JSX
  // ====================================================================

  return (
    <div className={styles.section}>
      <div className={styles.sectionTitle}>
        <Grid3x3 size={18} />
        Configuration de la mise en page
      </div>

      <div className={styles.layoutSection}>

        {/* ── Lignes + "Ajouter donnée" ── */}
        <LayoutDropZone
          zone="row"
          title="Données"
          items={rowItems}
          allItems={allItems}
          onRemove={onRemoveRowItem}
          onMoveItem={onMoveItem}
          placeholder="Lignes"
        >
          {/* Data chips from DefinitionItemForm */}
          {layoutData.length > 0 && (
            <>
              {rowItems.length > 0 && <hr className={styles.filterSeparator} />}
              {layoutData.map((entry, index) => (
                <div
                  key={entry.id}
                  className={`${styles.dataChip} ${dataDragOver === index ? styles.dataChipDragOver : ''}`}
                  draggable
                  onDragStart={(e) => handleDataDragStart(e, index)}
                  onDragOver={(e) => handleDataDragOver(e, index)}
                  onDragLeave={handleDataDragLeave}
                  onDrop={(e) => handleDataDrop(e, index)}
                  onDragEnd={handleDataDragEnd}
                >
                  <GripVertical size={14} />
                  <span title={formatEntryLabel(entry)}>{formatEntryLabel(entry)}</span>
                  <button
                    type="button"
                    className={styles.removeDataBtn}
                    onClick={() => handleRemoveDataEntry(entry.id)}
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </>
          )}

          <button
            type="button"
            className={styles.addDataBtn}
            onClick={handleOpenDataModal}
          >
            <Plus size={14} />
            Ajouter donnée
          </button>
        </LayoutDropZone>

        {/* ── Filtres + "Ajouter filtre" ── */}
        <LayoutDropZone
          zone="filter"
          title="Filtres"
          items={filterItems}
          allItems={allItems}
          onRemove={onRemoveFilterItem}
          onMoveItem={onMoveItem}
          placeholder="Filtres"
        >
          {/* Filter chips from IndicatorFilterBuilder */}
          {layoutFilters.length > 0 && (
            <>
              {filterItems.length > 0 && <hr className={styles.filterSeparator} />}
              {layoutFilters.map((filter, index) => (
                <div
                  key={filter.id}
                  className={`${styles.filterChip} ${filterDragOver === index ? styles.filterChipDragOver : ''}`}
                  draggable
                  onDragStart={(e) => handleFilterDragStart(e, index)}
                  onDragOver={(e) => handleFilterDragOver(e, index)}
                  onDragLeave={handleFilterDragLeave}
                  onDrop={(e) => handleFilterDrop(e, index)}
                  onDragEnd={handleFilterDragEnd}
                >
                  <GripVertical size={14} />
                  <span title={formatFilterLabel(filter)}>{formatFilterLabel(filter)}</span>
                  <button
                    type="button"
                    className={styles.removeFilterBtn}
                    onClick={() => handleRemoveFilter(filter.id)}
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </>
          )}

          <button
            type="button"
            className={styles.addFilterBtn}
            onClick={handleOpenFilterModal}
          >
            <Plus size={14} />
            Ajouter filtre
          </button>
        </LayoutDropZone>
      </div>

      {/* ════════════════════════════════════════════════════
          FILTER MODAL — IndicatorFilterBuilder
         ════════════════════════════════════════════════════ */}
      <Modal
        isOpen={isFilterModalOpen}
        onClose={handleCancelFilterModal}
        title="Filtres de layout"
        size="lg"
        closeOnBackdrop
        closeOnEscape
      >
        <div className={styles.modalContent}>
          <div className={styles.entitySelector}>
            <label className={styles.entityLabel}>Source de données</label>
            <FormSelect
              options={entityOptions}
              value={filterEntityId ?? ''}
              onChange={(value) => setFilterEntityId(value)}
              placeholder="Sélectionner une entité..."
              searchable
            />
          </div>

          {filterEntity && (
            <IndicatorFilterBuilder
              columns={filterEntity.columns}
              filters={tempFilters}
              onFiltersChange={setTempFilters}
            />
          )}

          <div className={styles.modalFooter}>
            <button type="button" className={styles.btnCancel} onClick={handleCancelFilterModal}>
              Annuler
            </button>
            <button type="button" className={styles.btnSave} onClick={handleSaveFilters}>
              Enregistrer
            </button>
          </div>
        </div>
      </Modal>

      {/* ════════════════════════════════════════════════════
          DATA MODAL — DefinitionItemForm
         ════════════════════════════════════════════════════ */}
      <Modal
        isOpen={isDataModalOpen}
        onClose={handleCloseDataModal}
        title="Ajouter une donnée"
        size="lg"
        closeOnBackdrop
        closeOnEscape
      >
        <div className={styles.modalContent}>
          <div className={styles.entitySelector}>
            <label className={styles.entityLabel}>Source de données</label>
            <FormSelect
              options={entityOptions}
              value={dataEntityId ?? ''}
              onChange={handleDataEntityChange}
              placeholder="Sélectionner une entité..."
              searchable
            />
          </div>

          {dataEntity && (
            <div className={styles.entitySelector}>
              <label className={styles.entityLabel}>Colonne</label>
              <FormSelect
                options={columnOptions}
                value={selectedColumnName}
                onChange={(value) => setSelectedColumnName(value)}
                placeholder="Sélectionner une colonne..."
                searchable
              />
            </div>
          )}

          {selectedColumnName && (
            <div className={styles.entitySelector}>
              <label className={styles.entityLabel}>Type</label>
              <FormSelect
                options={TYPE_OPTIONS}
                value={definitionType}
                onChange={(value) => setDefinitionType(value as 'dimension' | 'metric')}
              />
            </div>
          )}

          {dataEntity && selectedColumnName && (
            <DefinitionItemForm
              type={definitionType}
              tableName={dataEntity.label}
              attributeColumnName={selectedColumnName}
              attributeId={`${dataEntity.id}.${selectedColumnName}`}
              onAdd={handleAddDataEntry}
            />
          )}

          <div className={styles.modalFooter}>
            <button type="button" className={styles.btnCancel} onClick={handleCloseDataModal}>
              Fermer
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
