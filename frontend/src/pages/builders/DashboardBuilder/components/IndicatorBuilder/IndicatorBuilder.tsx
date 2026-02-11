import React, { useState, useMemo, useCallback } from 'react';
import { Database, Eye, Table2, X } from 'lucide-react';
import { FormInput } from '@/components/forms/FormInput/FormInput';
import { FormSelect } from '@/components/forms/FormSelect/FormSelect';
import { FormMultiSelect } from '@/components/forms/FormSelect/FormMultiSelect';
import { FormCheckbox } from '@/components/forms/FormCheckbox/FormCheckbox';
import { FormDatePicker } from '@/components/forms/FormDatePicker/FormDatePicker';
import { CollapsibleSection } from '@pages/builders/SqlBuilder/components/CollapsibleSection';
import type { AggType, ColumnType, EntityType, FilterOp } from '../../../builders.models';
import { AGG_LABELS } from '../../../builders.models';
import styles from './IndicatorBuilder.module.css';

// ============================================================================
// TYPES
// ============================================================================

export interface SidebarColumn {
  name: string;
  type: ColumnType;
  nullable: boolean;
}

export interface SidebarEntity {
  id: string;
  label: string;
  type: EntityType;
  columns: SidebarColumn[];
}

interface IndicatorFilter {
  id: string;
  columnName: string;
  columnType: ColumnType;
  enabled: boolean;
  min: string;
  max: string;
  selectedValues: string[];
  dateStart: string;
  dateEnd: string;
}

export interface IndicatorQueryConfig {
  entityId: string;
  metric: string;
  aggType: AggType;
  indicatorName: string;
  filters: Array<{ column: string; op: FilterOp; value: unknown }>;
  periodStart: string;
  periodEnd: string;
  site: string;
}

interface IndicatorBuilderProps {
  entities: SidebarEntity[];
  sites: { value: string; label: string }[];
  onShowTable: (config: IndicatorQueryConfig) => void;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const AGG_OPTIONS = (['avg', 'sum', 'count', 'min', 'max'] as AggType[]).map((agg) => ({
  value: agg,
  label: `${AGG_LABELS[agg]} (${agg.toUpperCase()})`,
}));

const ENTITY_ICONS: Record<EntityType, React.ReactNode> = {
  materialized_view: <Database size={16} />,
  table: <Table2 size={16} />,
  view: <Eye size={16} />,
};

const ENTITY_SECTION_LABELS: Record<EntityType, string> = {
  materialized_view: 'Matviews',
  table: 'Tables',
  view: 'Views',
};

// ============================================================================
// HELPERS
// ============================================================================

const createFilter = (col: SidebarColumn): IndicatorFilter => ({
  id: `filter-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  columnName: col.name,
  columnType: col.type,
  enabled: false,
  min: '',
  max: '',
  selectedValues: [],
  dateStart: '',
  dateEnd: '',
});

// ============================================================================
// COMPONENT
// ============================================================================

export const IndicatorBuilder: React.FC<IndicatorBuilderProps> = ({
  entities,
  sites,
  onShowTable,
}) => {
  // Sidebar selection
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);

  // Top row
  const [selectedMetric, setSelectedMetric] = useState('');
  const [aggType, setAggType] = useState<AggType>('avg');
  const [indicatorName, setIndicatorName] = useState('');

  // Filters
  const [filters, setFilters] = useState<IndicatorFilter[]>([]);
  const [showFilterPicker, setShowFilterPicker] = useState(false);

  // Period
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');

  // Location
  const [selectedSite, setSelectedSite] = useState('');

  // ---------- Derived state ----------

  const entityGroups = useMemo(() => {
    const groups: Record<EntityType, SidebarEntity[]> = {
      materialized_view: [],
      table: [],
      view: [],
    };
    for (const entity of entities) {
      groups[entity.type]?.push(entity);
    }
    return groups;
  }, [entities]);

  const selectedEntity = useMemo(
    () => entities.find((e) => e.id === selectedEntityId) ?? null,
    [entities, selectedEntityId]
  );

  const metricOptions = useMemo(() => {
    if (!selectedEntity) return [];
    return selectedEntity.columns
      .filter((col) => col.type === 'number')
      .map((col) => ({ value: col.name, label: col.name }));
  }, [selectedEntity]);

  const availableFilterColumns = useMemo(() => {
    if (!selectedEntity) return [];
    const usedColumns = new Set(filters.map((f) => f.columnName));
    return selectedEntity.columns.filter((col) => !usedColumns.has(col.name));
  }, [selectedEntity, filters]);

  const filterColumnOptions = useMemo(
    () => availableFilterColumns.map((col) => ({ value: col.name, label: `${col.name} (${col.type})` })),
    [availableFilterColumns]
  );

  const isFormValid = useMemo(
    () => !!(selectedEntityId && selectedMetric && aggType && indicatorName.trim()),
    [selectedEntityId, selectedMetric, aggType, indicatorName]
  );

  // ---------- Handlers ----------

  const handleSelectEntity = useCallback((entityId: string) => {
    setSelectedEntityId(entityId);
    setSelectedMetric('');
    setFilters([]);
    setShowFilterPicker(false);
  }, []);

  const handleAddFilter = useCallback(
    (columnName: string) => {
      const col = selectedEntity?.columns.find((c) => c.name === columnName);
      if (!col) return;
      setFilters((prev) => [...prev, createFilter(col)]);
      setShowFilterPicker(false);
    },
    [selectedEntity]
  );

  const handleToggleFilter = useCallback((filterId: string) => {
    setFilters((prev) =>
      prev.map((f) => (f.id === filterId ? { ...f, enabled: !f.enabled } : f))
    );
  }, []);

  const handleUpdateFilter = useCallback((filterId: string, updates: Partial<IndicatorFilter>) => {
    setFilters((prev) =>
      prev.map((f) => (f.id === filterId ? { ...f, ...updates } : f))
    );
  }, []);

  const handleRemoveFilter = useCallback((filterId: string) => {
    setFilters((prev) => prev.filter((f) => f.id !== filterId));
  }, []);

  const handleShowTable = useCallback(() => {
    if (!selectedEntityId || !isFormValid) return;

    const activeFilters = filters
      .filter((f) => f.enabled)
      .map((f) => {
        if (f.columnType === 'number') {
          return { column: f.columnName, op: 'between' as FilterOp, value: [f.min, f.max] };
        }
        if (f.columnType === 'string') {
          return { column: f.columnName, op: 'in' as FilterOp, value: f.selectedValues };
        }
        if (f.columnType === 'date') {
          return { column: f.columnName, op: 'between' as FilterOp, value: [f.dateStart, f.dateEnd] };
        }
        return { column: f.columnName, op: '=' as FilterOp, value: '' };
      });

    onShowTable({
      entityId: selectedEntityId,
      metric: selectedMetric,
      aggType,
      indicatorName: indicatorName.trim(),
      filters: activeFilters,
      periodStart,
      periodEnd,
      site: selectedSite,
    });
  }, [selectedEntityId, selectedMetric, aggType, indicatorName, filters, periodStart, periodEnd, selectedSite, isFormValid, onShowTable]);

  // ---------- Render helpers ----------

  const renderFilterControls = (filter: IndicatorFilter) => {
    if (!filter.enabled) return null;

    switch (filter.columnType) {
      case 'number':
        return (
          <div className={styles.filterControls}>
            <FormInput
              label="Mini:"
              type="number"
              value={filter.min}
              onChange={(e) => handleUpdateFilter(filter.id, { min: e.target.value })}
              placeholder="Min"
            />
            <FormInput
              label="Max:"
              type="number"
              value={filter.max}
              onChange={(e) => handleUpdateFilter(filter.id, { max: e.target.value })}
              placeholder="Max"
            />
          </div>
        );
      case 'string':
        return (
          <div className={styles.filterControls}>
            <FormMultiSelect
              label="Dans:"
              options={filter.selectedValues.map((v) => ({ value: v, label: v }))}
              value={filter.selectedValues}
              onChange={(values) => handleUpdateFilter(filter.id, { selectedValues: values })}
              placeholder="Saisir des valeurs..."
              searchable
            />
          </div>
        );
      case 'date':
        return (
          <div className={styles.filterControls}>
            <FormDatePicker
              label="De:"
              value={filter.dateStart}
              onChange={(e) => handleUpdateFilter(filter.id, { dateStart: e.target.value })}
            />
            <FormDatePicker
              label="A:"
              value={filter.dateEnd}
              onChange={(e) => handleUpdateFilter(filter.id, { dateEnd: e.target.value })}
            />
          </div>
        );
      default:
        return null;
    }
  };

  // ---------- JSX ----------

  return (
    <div className={styles.container}>
      {/* ===== LEFT SIDEBAR ===== */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarTitle}>Liste des matview</div>

        {(['materialized_view', 'table', 'view'] as EntityType[]).map((entityType) => {
          const group = entityGroups[entityType];
          if (group.length === 0) return null;

          return (
            <CollapsibleSection
              key={entityType}
              title={ENTITY_SECTION_LABELS[entityType]}
              icon={ENTITY_ICONS[entityType]}
              defaultOpen={entityType === 'materialized_view'}
              badge={group.length}
            >
              {group.map((entity) => (
                <div
                  key={entity.id}
                  className={entity.id === selectedEntityId ? styles.entityItemActive : styles.entityItem}
                  onClick={() => handleSelectEntity(entity.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleSelectEntity(entity.id);
                    }
                  }}
                >
                  {entity.label}
                </div>
              ))}
            </CollapsibleSection>
          );
        })}
      </aside>

      {/* ===== RIGHT PANEL ===== */}
      <main className={styles.mainPanel}>
        <h3 className={styles.panelTitle}>Indicator Builder</h3>

        {/* --- Top Row --- */}
        <div className={styles.topRow}>
          <FormSelect
            label="Sélectionner:"
            options={metricOptions}
            value={selectedMetric}
            onChange={(value) => setSelectedMetric(value)}
            placeholder="Liste des metrics..."
            searchable
            disabled={!selectedEntity}
          />
          <FormSelect
            label="Type agrégatif:"
            options={AGG_OPTIONS}
            value={aggType}
            onChange={(value) => setAggType(value as AggType)}
          />
          <FormInput
            label="Nom de l'indicateur:"
            value={indicatorName}
            onChange={(e) => setIndicatorName(e.target.value)}
            placeholder="Nom de l'indicateur"
          />
        </div>

        {/* --- Filtres --- */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>Filtres</span>
            <button
              type="button"
              className={styles.addFilterBtn}
              onClick={() => setShowFilterPicker(true)}
              disabled={!selectedEntity || availableFilterColumns.length === 0}
            >
              + Ajouter filtre+
            </button>
          </div>

          {/* Filter picker */}
          {showFilterPicker && (
            <div className={styles.filterPickerRow}>
              <FormSelect
                value=""
                onChange={(value) => {
                  if (value) handleAddFilter(value);
                }}
                placeholder="Choisir une colonne..."
                options={filterColumnOptions}
                searchable
              />
              <button
                type="button"
                className={styles.btnCancel}
                onClick={() => setShowFilterPicker(false)}
              >
                Annuler
              </button>
            </div>
          )}

          {/* Filter list */}
          {filters.length > 0 && (
            <div className={styles.filtersList}>
              {filters.map((filter) => (
                <div key={filter.id} className={styles.filterRow}>
                  <div className={styles.filterCheckbox}>
                    <FormCheckbox
                      label={filter.columnName}
                      checked={filter.enabled}
                      onChange={() => handleToggleFilter(filter.id)}
                    />
                  </div>
                  {renderFilterControls(filter)}
                  <button
                    type="button"
                    className={styles.filterRemove}
                    onClick={() => handleRemoveFilter(filter.id)}
                    aria-label="Supprimer le filtre"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {filters.length === 0 && !showFilterPicker && (
            <div className={styles.emptyFilters}>Aucun filtre défini</div>
          )}
        </div>

        {/* --- Période --- */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>Période</span>
          </div>
          <div className={styles.dateRow}>
            <span className={styles.dateLabel}>Sélectionner la range de période :</span>
            <FormDatePicker
              value={periodStart}
              onChange={(e) => setPeriodStart(e.target.value)}
            />
            <span className={styles.dateLabel}>-</span>
            <FormDatePicker
              value={periodEnd}
              onChange={(e) => setPeriodEnd(e.target.value)}
            />
          </div>
        </div>

        {/* --- Lieu --- */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>Lieu.</span>
          </div>
          <div className={styles.lieuRow}>
            <span className={styles.lieuLabel}>Site</span>
            <FormSelect
              options={sites}
              value={selectedSite}
              onChange={(value) => setSelectedSite(value)}
              placeholder="Sélectionner..."
              searchable
            />
          </div>
        </div>

        {/* --- Action --- */}
        <div className={styles.actionRow}>
          <button
            type="button"
            className={styles.showTableBtn}
            onClick={handleShowTable}
            disabled={!isFormValid}
          >
            Afficher la table
          </button>
        </div>
      </main>
    </div>
  );
};

export default IndicatorBuilder;
