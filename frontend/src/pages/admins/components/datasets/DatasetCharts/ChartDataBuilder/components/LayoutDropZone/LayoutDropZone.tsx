import React, { useState, useCallback, useMemo } from 'react';
import { GripVertical, X, Plus } from 'lucide-react';
import { AGGREGATE_BY_SQL_TYPE, ChartDimension, ChartFilter, ChartMetric, DatasetField, SqlAggType } from '@/models/dataset.models';
import styles from './LayoutDropZone.module.css';
import { Modal } from '@/components/ui/Modal/Modal';
import { FormSelect } from '@/components/forms/FormSelect/FormSelect';
import { Table } from '@/components/ui/Table/Table';
import { Button } from '@/components/ui/Button/Button';
import { InlineEditCell } from '@/components/ui/InlineEditCell';

import { ChartNodeFilterBuilder, DimMetricFieldMap } from '../../../components/chart-utils/ChartNodeFilterBuilder';


// TYPES
export type LayoutZone = 'dimension' | 'metric';

export type LayoutState = {
  columns: ChartDimension[];
  rows: ChartDimension[];
  metrics: ChartMetric[];
  filters: ChartFilter[];
};

export type LayoutDataZone = keyof LayoutState;

interface LayoutDropZoneProps {
  dataZone: LayoutDataZone;
  title: string;
  items: (ChartDimension | ChartMetric | ChartFilter)[];
  fields: DatasetField[];
  onMoveLayout: (itemId: number, fromZone: LayoutDataZone, toZone: LayoutDataZone, toIndex: number) => void;
  onAddLayout: (zone: LayoutDataZone, selectFields: (ChartDimension | ChartMetric | ChartFilter)[]) => void;
  onUpdateLayout: (zone: LayoutDataZone, selectFields: (ChartDimension | ChartMetric | ChartFilter)[]) => void;
  onRemoveLayout: (itemId: number, zone: LayoutDataZone) => void;
  placeholder?: string;
  children?: React.ReactNode;
}


// CONSTANTS
const DRAG_KEY = 'layout-drag-item';


// TABLE SELECT INPUT
interface TableProps {
  selectFields: DatasetField[];
  fields: DatasetField[];
  setSelectFields: React.Dispatch<React.SetStateAction<DatasetField[]>>;
}

const MultipleLayoutDropZoneTableInput: React.FC<TableProps> = ({ fields, selectFields, setSelectFields }) => {

  const selectedSet = useMemo(() => new Set(selectFields.map(f => f.name)), [selectFields]);
  const isAllSelected = fields.length > 0 && selectFields.length === fields.length;
  const isIndeterminate = selectFields.length > 0 && selectFields.length < fields.length;

  const columns = useMemo(() => [
    {
      key: "select",
      header: (
        <input
          type="checkbox"
          checked={isAllSelected}
          ref={(el) => { if (el) el.indeterminate = isIndeterminate; }}
          onChange={(e) => setSelectFields(e.target.checked ? fields : [])}
        />
      ),
      width: 40,
      render: (c: DatasetField) => {
        const checked = selectedSet.has(c.name);

        return (
          <input
            type="checkbox"
            checked={checked}
            onChange={() => {
              setSelectFields(prev => checked ? prev.filter(s => s.name !== c.name) : [...prev, c]);
            }}
          />
        );
      }
    },
    {
      key: "name",
      header: "Nom",
      render: (c: DatasetField) => <span>{c.name}</span>
    }
  ], [fields, selectedSet, isAllSelected, isIndeterminate]);

  return (
    <Table
      data={fields}
      keyExtractor={(c: DatasetField) => c.name}
      columns={columns}
      scrollable
      maxHeight={340}
      features={{ search: true, pagination: false }}
    />
  );
};


// COMPONENT
export const LayoutDropZone: React.FC<LayoutDropZoneProps> = ({ dataZone, title, items, fields, onAddLayout, onUpdateLayout, onMoveLayout, onRemoveLayout }) => {
  // STATE
  const [isDragOver, setIsDragOver] = useState(false);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [isFieldsModalOpened, setFieldsModalOpen] = useState(false);
  const [openLayoutModal, setOpenLayoutModal] = useState(false);
  const [selectFields, setSelectFields] = useState<DatasetField[]>([]);

  // MEMO
  const fieldMap = useMemo(() => new Map(fields.map(f => [f.id!, f])), [fields]);

  const getField = useCallback((id: number) => fieldMap.get(id), [fieldMap]);

  const itemsIds = useMemo(() => new Set(items.map(i => i.field_id)), [items]);

  const layoutNotSelected = useMemo(() => fields.filter(f => !itemsIds.has(f.id!)), [fields, itemsIds]);


  // DRAG
  const handleDragStart = useCallback((e: React.DragEvent, fieldId: number) => {
    const toDragge = { field_id: fieldId, fromDataZone: dataZone };
    e.dataTransfer.setData(DRAG_KEY, JSON.stringify(toDragge));
    e.dataTransfer.effectAllowed = 'move';
  }, [dataZone]);

  // vérifie si on peut déplacer
  const isMoveAllowed = useCallback((from: LayoutDataZone, to: LayoutDataZone) => {
    if (from === 'metrics' && ['rows', 'columns', 'filters'].includes(to)) return false;
    if (['rows', 'columns'].includes(from) && ['metrics', 'filters'].includes(to)) return false;
    return true;
  }, []);

  // DRAG OVER ZONE
  const handleDragOverZone = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  // DRAG OVER ITEM
  const handleDragOverItem = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    setHoverIndex(index);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
    setHoverIndex(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const raw = e.dataTransfer.getData(DRAG_KEY);
    if (!raw) return;
    const dragged = JSON.parse(raw);
    if (!isMoveAllowed(dragged.fromDataZone, dataZone)) {
      setHoverIndex(null);
      return;
    }
    const index = hoverIndex ?? items.length;
    onMoveLayout(dragged.field_id, dragged.fromDataZone, dataZone, index);
    setHoverIndex(null);
  }, [hoverIndex, items.length, dataZone, onMoveLayout]);


  // RENDER HELPERS
  const renderDimensions = () =>
    items.map((item, i) => {
      const dim = item as ChartDimension;

      return (
        <div 
        key={dim.field_id} 
        className={styles.itemWrapper} 
        onDragOver={(e) => handleDragOverItem(e, i)}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}

         >
          <div className={hoverIndex === i ? styles.dropIndicatorActive : styles.dropIndicatorDeActive} />
          <div className={styles.item} draggable onDragStart={(e) => handleDragStart(e, dim.field_id)} >
            <GripVertical size={14} className={styles.dragIcon} />
            <div style={{ width: '100%' }}>
              <InlineEditCell

                value={dim.alias || dim.name || 'Champ inconnu'}
                onChange={(v) => {
                  const updated = [...items];
                  updated[i] = { ...dim, alias: v };
                  onUpdateLayout(dataZone, updated);
                }}
              />
            </div>
            {/* <span className={styles.label} title={field?.name ?? ''}>{field?.name ?? dim.field_id ?? ''}</span> */}
            <button className={styles.removeBtn} onClick={() => onRemoveLayout(dim.field_id, dataZone)} >
              <X size={14} />
            </button>
          </div>
        </div>
      );
    });

  const renderMetrics = () =>
    items.map((item, i) => {
      const met = item as ChartMetric;
      const field = getField(met.field_id);
      const data_type = field?.data_type ?? 'string';
      const aggregates: SqlAggType[] = AGGREGATE_BY_SQL_TYPE[data_type] ?? ['count'];

      return (
        <div key={met.field_id} className={styles.gridRow}>
          <InlineEditCell
            value={met.alias || met.name || 'Champ inconnu'}
            onChange={(v) => {
              const updated = [...items];
              updated[i] = { ...met, alias: v?.trim() };
              onUpdateLayout(dataZone, updated);
            }}
          />

          <FormSelect
            value={met.aggregation}
            options={aggregates.map(a => ({
              value: a,
              label: a.toUpperCase()
            }))}
            onChange={(v) => {
              const updated = [...items];
              updated[i] = { ...met, aggregation: v };
              onUpdateLayout(dataZone, updated);
            }}
          />

          <div className={styles.actions}>
            <button className={styles.removeBtn} onClick={() => onRemoveLayout(met.field_id, dataZone)} >
              <X size={14} />
            </button>
          </div>
        </div>
      );
    });

  const renderFilters = () =>
    items.map((item, i) => {
      const filt = item as ChartFilter;

      const filtersMap: DimMetricFieldMap[] = fields.map(f => ({
        field_id: f.id!,
        field_name: f.name,
        data_type: f.data_type,
        alias: f.name,
      }));

      return (
        <ChartNodeFilterBuilder
          key={i}
          index={i + 1}
          node={filt}
          fields={filtersMap}
          onChange={(data) => {
            const updated = [...items];
            updated[i] = data;
            onUpdateLayout(dataZone, updated);
          }}
          onRemove={() => onRemoveLayout(filt.field_id, dataZone)}
          error={undefined}
        />
      );
    });


  // JSX
  return (
    <>
      <div
        className={`${styles.layoutZone} ${isDragOver ? styles.dragOver : ''}`}
        onDragOver={handleDragOverZone}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className={styles.header}>
          <span>{title}</span>
          <span>{items.length}</span>
        </div>

        <div className={styles.content}>
          {/* {items.length === 0 && (
            <div className={styles.placeholder}>
              Aucun élément sélectionné
            </div>
          )} */}

          <Button size='sm' onClick={() => setFieldsModalOpen(true)}>
            <Plus size={14} />
            Ajouter
          </Button>

          <div className={hoverIndex === items.length ? styles.dropIndicatorActive : styles.dropIndicatorDeActive} />

        </div>
      </div>


      {/* MODAL EDIT */}
      <Modal
        isOpen={isFieldsModalOpened}
        onClose={() => setFieldsModalOpen(false)}
        title={(
          <button type="button" className={styles.addDataBtn} onClick={() => setOpenLayoutModal(true)}>
            {/* <Plus size={14} /> */}
            Ajouter {dataZone}
          </button>
        )}
        size={dataZone === 'filters' ? "fl" : dataZone === 'metrics' ? "md" : 'sm'}
        closeOnBackdrop={false}
        closeOnEscape={false}
      >
        {dataZone === 'metrics' && renderMetrics()}
        {(dataZone === 'columns' || dataZone === 'rows') && renderDimensions()}
        {dataZone === 'filters' && renderFilters()}
      </Modal>


      {/* MODAL ADD */}
      <Modal
        isOpen={openLayoutModal}
        onClose={() => setOpenLayoutModal(false)}
        title={`Ajouter ${dataZone}`}
      >
        <MultipleLayoutDropZoneTableInput
          fields={dataZone === 'filters' ? fields : layoutNotSelected}
          selectFields={selectFields}
          setSelectFields={setSelectFields}
        />

        <Button
          onClick={() => {

            const mapped: (ChartDimension | ChartMetric | ChartFilter)[] =
              dataZone === 'filters' ?
                selectFields.map(f => ({
                  field_id: f.id!,
                  field_type: f.field_type!,
                  operator: '=',
                  value: null,
                  value2: null,
                  useSqlInClause: false,
                })) :
                dataZone === 'metrics' ?
                  selectFields.map(f => ({
                    field_id: f.id!,
                    name: f.name,
                    alias: f.name,
                    data_type: f.data_type,
                    aggregation: 'sum'
                  })) :
                  selectFields.map(f => ({
                    field_id: f.id!,
                    name: f.name,
                    alias: f.name,
                    data_type: f.data_type,
                    field_type: f.field_type
                  }));

            onAddLayout(dataZone, mapped);
            setOpenLayoutModal(false);
          }}
        >
          Ajouter {selectFields.length}
        </Button>
      </Modal>
    </>
  );
};