import React, { useState, useCallback, useMemo, useRef } from 'react';
import { LayoutDropZone, LayoutState, LayoutDataZone } from '../LayoutDropZone/LayoutDropZone';
import { ChartDimension, ChartFilter, ChartMetric, DatasetField } from '@/models/dataset.models';
import { Grid3x3 } from 'lucide-react';

import styles from './LayoutConfiguration.module.css';

interface LayoutConfigurationProps {
  layout: LayoutState;
  fields: DatasetField[];
  onAddLayout: (zone: LayoutDataZone, fields: (ChartDimension | ChartMetric | ChartFilter)[]) => void
  onUpdateLayout: (zone: keyof LayoutState, fields: (ChartDimension | ChartMetric | ChartFilter)[]) => void
  onMoveLayout: (itemId: number, fromZone: LayoutDataZone, toZone: LayoutDataZone, toIndex: number) => void;
  onRemoveLayout: (id: number, zone: keyof LayoutState) => void;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const TYPE_OPTIONS = [
  { value: 'dimension', label: 'Dimension' },
  { value: 'metric', label: 'Métrique' },
];

const DATA_DRAG_KEY = 'data-reorder';

// ============================================================================
// COMPONENT
// ============================================================================

export const LayoutConfiguration: React.FC<LayoutConfigurationProps> = ({ layout, fields, onAddLayout, onUpdateLayout, onMoveLayout, onRemoveLayout }) => {
  // ── DATA MODAL STATE ─────────────────────────────
  const [isDataModalOpen, setIsDataModalOpen] = useState(false);
  const [dataEntityId, setDataEntityId] = useState<string | null>(null);
  const [selectedColumnName, setSelectedColumnName] = useState('');

  // ── Data drag reorder ───────────────────────────
  const dataDragRef = useRef<number | null>(null);
  const [dataDragOver, setDataDragOver] = useState<number | null>(null);


  const handleCloseDataModal = useCallback(() => setIsDataModalOpen(false), []);

  const handleDataEntityChange = useCallback((entityId: string) => {
    setDataEntityId(entityId);
    setSelectedColumnName('');
  }, []);

  // ── DATA DRAG HANDLERS ─────────────────────────
  const handleDataDragStart = useCallback((e: React.DragEvent, index: number) => {
    dataDragRef.current = index;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData(DATA_DRAG_KEY, String(index));
  }, []);

  const handleDataDragOver = useCallback((e: React.DragEvent, index: number) => {
    if (e.dataTransfer.types.includes(DATA_DRAG_KEY)) {
      e.preventDefault();
      setDataDragOver(index);
    }
  }, []);

  const handleDataDragLeave = useCallback(() => setDataDragOver(null), []);

  // const handleDataDrop = useCallback((e: React.DragEvent, dropIndex: number) => {
  //     e.preventDefault();
  //     const fromIndex = dataDragRef.current;
  //     if (fromIndex === null || fromIndex === dropIndex) return;
  //     const reordered = [...layout];
  //     const [moved] = reordered.splice(fromIndex, 1);
  //     reordered.splice(dropIndex, 0, moved);
  //     onLayoutDataChange(reordered);
  //     dataDragRef.current = null;
  //     setDataDragOver(null);
  //   },
  //   [layout, onLayoutDataChange]
  // );

  const handleDataDragEnd = useCallback(() => {
    dataDragRef.current = null;
    setDataDragOver(null);
  }, []);

  const zoneMetrics = useMemo(() => fields.filter(f => f.field_type !== 'dimension'), [fields]);

  const zoneDimensions = useMemo(() => fields.filter(f => f.field_type === 'dimension'), [fields]);

  // ── JSX ───────────────────────────────────────
  return (
    <div className={styles.section}>
      <div className={styles.sectionTitle}>
        <Grid3x3 size={18} />
        Configuration de la mise en page
      </div>

      <div className={styles.layoutSection}>
        {/* ── METRICS ── */}
        <LayoutDropZone
          dataZone="metrics"
          title="Données / Indicateurs"
          // placeholder="Données"
          items={layout.metrics}
          fields={zoneMetrics}
          onAddLayout={onAddLayout}
          onUpdateLayout={onUpdateLayout}
          onRemoveLayout={onRemoveLayout}
          onMoveLayout={onMoveLayout}
        />

        {/* ── COLUMNS ── */}
        <LayoutDropZone
          key="columns-zone"
          dataZone="columns"
          title="Column Dimension"
          items={layout.columns}
          fields={zoneDimensions}
          onAddLayout={onAddLayout}
          onUpdateLayout={onUpdateLayout}
          onRemoveLayout={onRemoveLayout}
          onMoveLayout={onMoveLayout}
          // placeholder="Column Dimension"
        />

        {/* ── ROWS ── */}
        <LayoutDropZone
          key="rows-zone"
          dataZone="rows"
          title="Row Dimension"
          items={layout.rows}
          fields={zoneDimensions}
          onAddLayout={onAddLayout}
          onUpdateLayout={onUpdateLayout}
          onRemoveLayout={onRemoveLayout}
          onMoveLayout={onMoveLayout}
          // placeholder="Row Dimension"
        />

        {/* ── ROWS ── */}
        <LayoutDropZone
          key="filters-zone"
          dataZone="filters"
          title="Filters"
          items={layout.filters}
          fields={fields}
          onAddLayout={onAddLayout}
          onUpdateLayout={onUpdateLayout}
          onRemoveLayout={onRemoveLayout}
          onMoveLayout={onMoveLayout}
          // placeholder="Filters"
        />
      </div>

      {/* ── DATA MODAL ── */}
      {/* <Modal
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
      </Modal> */}
    </div>
  );
};