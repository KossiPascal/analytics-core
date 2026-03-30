import React, { useState, useCallback, useMemo } from 'react';
import { Database, Filter, Layers, Search } from 'lucide-react';
import { LayoutDropZone, LayoutState, LayoutDataZone } from '../LayoutDropZone/LayoutDropZone';
import { ChartDimension, ChartFilter, ChartMetric, DatasetField } from '@/models/dataset.models';
import { Modal } from '@/components/ui/Modal/Modal';
import { FormMultiSelectDualPanel } from '@/components/forms/FormMultiSelectDualPanel/FormMultiSelectDualPanel';
import { Button } from '@/components/ui/Button/Button';
import styles from './LayoutConfiguration.module.css';

interface LayoutConfigurationProps {
  layout: LayoutState;
  fields: DatasetField[];
  onAddLayout: (zone: LayoutDataZone, fields: (ChartDimension | ChartMetric | ChartFilter)[]) => void;
  onUpdateLayout: (zone: keyof LayoutState, fields: (ChartDimension | ChartMetric | ChartFilter)[]) => void;
  onMoveLayout: (itemId: number, fromZone: LayoutDataZone, toZone: LayoutDataZone, toIndex: number) => void;
  onRemoveLayout: (id: number, zone: keyof LayoutState) => void;
}

export const LayoutConfiguration: React.FC<LayoutConfigurationProps> = ({
  layout, fields, onAddLayout, onUpdateLayout, onMoveLayout, onRemoveLayout,
}) => {
  const [dimSearch, setDimSearch] = useState('');

  // Modal states
  const [donneesModalOpen, setDonneesModalOpen] = useState(false);
  const [colsEditOpen, setColsEditOpen] = useState(false);
  const [rowsEditOpen, setRowsEditOpen] = useState(false);
  const [filtersEditOpen, setFiltersEditOpen] = useState(false);

  const zoneMetrics = useMemo(() => fields.filter(f => f.field_type !== 'dimension'), [fields]);
  const zoneDimensions = useMemo(() => fields.filter(f => f.field_type === 'dimension'), [fields]);

  // FormMultiSelectDualPanel items for Données modal
  const donneesItems = useMemo(
    () => zoneMetrics.map(f => ({ id: String(f.id), name: f.name })),
    [zoneMetrics],
  );

  const donneesSelected = useMemo(
    () => layout.metrics.map(m => ({
      id: String(m.field_id),
      name: m.name || m.alias || String(m.field_id),
    })),
    [layout.metrics],
  );

  const handleDonneesChange = useCallback(
    (selected: { id: string; name: string }[]) => {
      const metrics: ChartMetric[] = selected.map(s => {
        const existing = layout.metrics.find(m => m.field_id === Number(s.id));
        const field = zoneMetrics.find(f => String(f.id) === s.id);
        return existing ?? {
          field_id: Number(s.id),
          name: s.name,
          alias: s.name,
          data_type: field?.data_type ?? 'string',
          aggregation: 'sum',
        };
      });
      onUpdateLayout('metrics', metrics);
    },
    [layout.metrics, zoneMetrics, onUpdateLayout],
  );

  // Chip helper
  const Chip: React.FC<{
    icon: React.ReactNode;
    label: string;
    count?: number;
    onClick: () => void;
  }> = ({ icon, label, count, onClick }) => (
    <div className={styles.chip} onClick={onClick}>
      <span className={styles.chipIcon}>{icon}</span>
      <span>{label}</span>
      {count !== undefined && count > 0 && (
        <span className={styles.chipBadge}>{count}</span>
      )}
      <button
        className={styles.chipEllipsis}
        onClick={e => { e.stopPropagation(); onClick(); }}
        type="button"
      >
        •••
      </button>
    </div>
  );

  return (
    <div className={styles.dhisLayout}>
      {/* ── LEFT SIDEBAR ── */}
      <div className={styles.sidebar}>
        <div className={styles.sidebarSearch}>
          <Search size={13} color="#94a3b8" />
          <input
            className={styles.sidebarSearchInput}
            placeholder="Filtrer les dimensions"
            value={dimSearch}
            onChange={e => setDimSearch(e.target.value)}
          />
        </div>

        <div className={styles.dimSection}>
          <span className={styles.sectionLabel}>DIMENSIONS PRINCIPALES</span>

          {/* Données */}
          <div
            className={`${styles.dimItem} ${layout.metrics.length > 0 ? styles.dimItemActive : ''}`}
            onClick={() => setDonneesModalOpen(true)}
          >
            <Database size={14} className={styles.dimIcon} />
            <span className={styles.dimLabel}>Données</span>
            <button
              type="button"
              className={styles.dimEllipsis}
              onClick={e => { e.stopPropagation(); setColsEditOpen(true); }}
            >
              •••
            </button>
          </div>

          {/* Dimensions (was Période) */}
          <div className={styles.dimItem} onClick={() => setRowsEditOpen(true)}>
            <Layers size={14} className={styles.dimIcon} />
            <span className={styles.dimLabel}>Dimensions</span>
          </div>

          {/* Filtres (was Unité d'organisation) */}
          <div className={styles.dimItem} onClick={() => setFiltersEditOpen(true)}>
            <Filter size={14} className={styles.dimIcon} />
            <span className={styles.dimLabel}>Filtres</span>
          </div>
        </div>
      </div>

      {/* ── RIGHT ZONES ── */}
      <div className={styles.zonesArea}>
        {/* Top row: Colonnes + Filtrer */}
        <div className={styles.topZones}>
          {/* Colonnes */}
          <div className={styles.colsZone}>
            <span className={styles.zoneLabel}>Colonnes</span>
            <div className={styles.zoneChips}>
              <Chip
                icon={<Database size={13} />}
                label="Données"
                count={layout.metrics.length}
                onClick={() => setColsEditOpen(true)}
              />
              {layout.columns.map(col => (
                <div key={col.field_id} className={styles.chip}>
                  <span className={styles.chipIcon}><Layers size={13} /></span>
                  <span>{col.name || col.alias}</span>
                  <button
                    type="button"
                    className={styles.chipEllipsis}
                    onClick={() => setColsEditOpen(true)}
                  >
                    •••
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Filtrer (top-right) */}
          <div className={styles.filterZone}>
            <span className={styles.zoneLabel}>Filtrer</span>
            <div className={styles.zoneChips}>
              <Chip
                icon={<Filter size={13} />}
                label="Filtres"
                count={layout.filters.length}
                onClick={() => setFiltersEditOpen(true)}
              />
            </div>
          </div>
        </div>

        {/* Lignes */}
        <div className={styles.zoneRow}>
          <span className={styles.zoneLabel}>Lignes</span>
          <div className={styles.zoneChips}>
            <Chip
              icon={<Layers size={13} />}
              label="Dimensions"
              count={layout.rows.length}
              onClick={() => setRowsEditOpen(true)}
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
      <LayoutDropZone
        dataZone="rows"
        title="Lignes - Dimensions"
        items={layout.rows}
        fields={zoneDimensions}
        onAddLayout={onAddLayout}
        onUpdateLayout={onUpdateLayout}
        onRemoveLayout={onRemoveLayout}
        onMoveLayout={onMoveLayout}
        isEditOpen={rowsEditOpen}
        onEditClose={() => setRowsEditOpen(false)}
        hideZoneUI
      />
      <LayoutDropZone
        dataZone="filters"
        title="Filtres"
        items={layout.filters}
        fields={fields}
        onAddLayout={onAddLayout}
        onUpdateLayout={onUpdateLayout}
        onRemoveLayout={onRemoveLayout}
        onMoveLayout={onMoveLayout}
        isEditOpen={filtersEditOpen}
        onEditClose={() => setFiltersEditOpen(false)}
        hideZoneUI
      />

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
          <Button variant="secondary" onClick={() => setDonneesModalOpen(false)}>
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
