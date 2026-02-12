import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Database, Eye, Table2 } from 'lucide-react';
import { FormInput } from '@/components/forms/FormInput/FormInput';
import { FormSelect } from '@/components/forms/FormSelect/FormSelect';
import { Modal } from '@components/ui/Modal/Modal';
import { CollapsibleSection } from '@pages/builders/SqlBuilder/components/CollapsibleSection';
import type { AggType, ColumnType, EntityType, FilterOp } from '../../../builders.models';
import { AGG_LABELS } from '../../../builders.models';
import type { DimensionItem } from '../types';
import { IndicatorFilterBuilder } from './IndicatorFilterBuilder';
import type { IndicatorFilter } from './IndicatorFilterBuilder';
import { IndicatorPeriodBuilder } from './IndicatorPeriodBuilder';
import type { IndicatorPeriodConfig } from './IndicatorPeriodBuilder';
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

export interface IndicatorQueryConfig {
  entityId: string;
  metric: string;
  aggType: AggType;
  indicatorName: string;
  filters: Array<{ column: string; op: FilterOp; value: unknown }>;
  period: IndicatorPeriodConfig | null;
  site: string;
}

interface IndicatorBuilderProps {
  isOpen: boolean;
  onClose: () => void;
  entities: SidebarEntity[];
  sites: { value: string; label: string }[];
  onSaveIndicator: (indicator: DimensionItem, config: IndicatorQueryConfig) => void;
  /** ID of the indicator being edited (null = creation mode) */
  editingIndicatorId?: string | null;
  /** Pre-filled config when editing an existing indicator */
  initialConfig?: IndicatorQueryConfig | null;
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
// COMPONENT
// ============================================================================

export const IndicatorBuilder: React.FC<IndicatorBuilderProps> = ({
  isOpen,
  onClose,
  entities,
  sites,
  onSaveIndicator,
  editingIndicatorId = null,
  initialConfig = null,
}) => {
  // Sidebar selection
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);

  // Top row
  const [selectedMetric, setSelectedMetric] = useState('');
  const [aggType, setAggType] = useState<AggType>('avg');
  const [indicatorName, setIndicatorName] = useState('');

  // Filters
  const [filters, setFilters] = useState<IndicatorFilter[]>([]);

  // Period
  const [periodConfig, setPeriodConfig] = useState<IndicatorPeriodConfig | null>(null);

  // Location
  const [selectedSite, setSelectedSite] = useState('');

  // Pre-fill form when opening in edit mode
  const prevIsOpenRef = useRef(false);
  useEffect(() => {
    const justOpened = isOpen && !prevIsOpenRef.current;
    prevIsOpenRef.current = isOpen;

    if (!justOpened) return;

    if (initialConfig && editingIndicatorId) {
      setSelectedEntityId(initialConfig.entityId);
      setSelectedMetric(initialConfig.metric);
      setAggType(initialConfig.aggType);
      setIndicatorName(initialConfig.indicatorName);
      setPeriodConfig(initialConfig.period ?? null);
      setSelectedSite(initialConfig.site);

      // Rebuild filters from config
      const entity = entities.find((e) => e.id === initialConfig.entityId);
      if (entity) {
        const restoredFilters: IndicatorFilter[] = initialConfig.filters.map((f) => {
          const col = entity.columns.find((c) => c.name === f.column);
          return {
            id: `filter-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
            columnName: f.column,
            columnType: col?.type ?? 'string',
            op: f.op,
            value: f.value,
          };
        });
        setFilters(restoredFilters);
      }
    }
  }, [isOpen, initialConfig, editingIndicatorId, entities]);

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

  const isFormValid = useMemo(
    () => !!(selectedEntityId && selectedMetric && aggType && indicatorName.trim()),
    [selectedEntityId, selectedMetric, aggType, indicatorName]
  );

  // ---------- Handlers ----------

  const resetForm = useCallback(() => {
    setSelectedEntityId(null);
    setSelectedMetric('');
    setAggType('avg');
    setIndicatorName('');
    setFilters([]);
    setPeriodConfig(null);
    setSelectedSite('');
  }, []);

  const handleSelectEntity = useCallback((entityId: string) => {
    setSelectedEntityId(entityId);
    setSelectedMetric('');
    setFilters([]);
  }, []);

  const handleSave = useCallback(() => {
    if (!selectedEntityId || !isFormValid) return;

    const config: IndicatorQueryConfig = {
      entityId: selectedEntityId,
      metric: selectedMetric,
      aggType,
      indicatorName: indicatorName.trim(),
      filters: filters.map((f) => ({ column: f.columnName, op: f.op, value: f.value })),
      period: periodConfig,
      site: selectedSite,
    };

    const indicator: DimensionItem = {
      id: editingIndicatorId ?? `ind-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      name: indicatorName.trim(),
      code: `${aggType.toUpperCase()}(${selectedMetric})`,
    };

    onSaveIndicator(indicator, config);
    resetForm();
    onClose();
  }, [selectedEntityId, selectedMetric, aggType, indicatorName, filters, periodConfig, selectedSite, isFormValid, onSaveIndicator, editingIndicatorId, resetForm, onClose]);

  // ---------- JSX ----------

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingIndicatorId ? 'Modifier l\'indicateur' : 'Indicator Builder'}
      size="full"
      closeOnBackdrop
      closeOnEscape
    >
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
          <IndicatorFilterBuilder
            columns={selectedEntity?.columns ?? []}
            filters={filters}
            onFiltersChange={setFilters}
          />

          {/* --- Période --- */}
          <IndicatorPeriodBuilder
            columns={selectedEntity?.columns ?? []}
            config={periodConfig}
            onConfigChange={setPeriodConfig}
          />

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
              onClick={handleSave}
              disabled={!isFormValid}
            >
              {editingIndicatorId ? 'Modifier l\'indicateur' : 'Enregistrer l\'indicateur'}
            </button>
          </div>
        </main>
      </div>
    </Modal>
  );
};

export default IndicatorBuilder;
