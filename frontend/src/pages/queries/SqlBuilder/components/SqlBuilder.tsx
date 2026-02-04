/**
 * SqlBuilder Component
 * Composant principal du Query Builder
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { AnalyticsModel, SqlBuilderProps, DimensionDef, MetricDef, JoinType, OrderDirection } from '../models';
import { useSqlBuilder } from '@contexts/OLD/useSqlBuilder';
import { ALLOWED_JOIN_TYPES, JOIN_TYPE_LABELS, DEFAULT_LIMIT } from '../models';
import FieldPalette from './FieldPalette';
import CollapsibleSection from './CollapsibleSection';
import DropZone from './DropZone';
import SelectedField from './SelectedField';
import FilterBuilder from './FilterBuilder';
import JSONPreview from './JSONPreview';
import styles from '@pages/queries/SqlBuilder/SqlBuilder.module.css';
import { Modal } from '@components/ui/Modal/Modal';
import { Button } from '@/components/ui';
import { DatabaseConnectionTab } from '@/pages/admins/components';
import { FormRadioGroup, FormInput, FormSelect, FormCheckbox } from '@/components/forms';
import { RemoveIcon } from '@/components/ui/icons';
import { DefinitionItemForm, buildAlias, FORMULA_OPTIONS, type DimensionEntry, type MetricEntry } from './DefinitionItemForm';

type AggregationType = 'sum' | 'avg' | 'count' | 'min' | 'max';

type AttributeDefinition = {
  attributeLabel: string | null;
  selectedAction: 'dimension' | 'metric' | null;
  dimensions: DimensionEntry[];
  metrics: MetricEntry[];
};

type DefinitionSelections = {
  [tableId: string]: {
    [attributeId: string]: AttributeDefinition;
  };
};

const AGGREGATION_OPTIONS: { value: AggregationType; label: string }[] = [
  { value: 'count', label: 'COUNT' },
  { value: 'sum', label: 'SUM' },
  { value: 'avg', label: 'AVG' },
  { value: 'min', label: 'MIN' },
  { value: 'max', label: 'MAX' },
];

type SourceType = 'all' | 'table' | 'view' | 'materialized_view';

const SOURCE_TYPE_FILTERS: { value: SourceType; label: string }[] = [
  { value: 'all', label: 'Tout' },
  { value: 'table', label: 'Tables' },
  { value: 'view', label: 'Vues' },
  { value: 'materialized_view', label: 'Vues mat.' },
];

const generateAlias = (label: string): string => {
  return label
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
};


// ============================================================================
// ICONS
// ============================================================================

const Icons = {
  table: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="2" width="12" height="12" rx="2" />
      <line x1="2" y1="6" x2="14" y2="6" />
      <line x1="6" y1="6" x2="6" y2="14" />
    </svg>
  ),
  tableLarge: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="2" width="16" height="16" rx="2" />
      <line x1="2" y1="7" x2="18" y2="7" />
      <line x1="7" y1="7" x2="7" y2="18" />
    </svg>
  ),
  view: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="10" cy="10" r="3" />
      <path d="M2 10C4 6 7 4 10 4C13 4 16 6 18 10C16 14 13 16 10 16C7 16 4 14 2 10Z" />
    </svg>
  ),
  materializedView: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="3" width="14" height="14" rx="2" />
      <path d="M7 10L9 12L13 8" />
    </svg>
  ),
  database: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <ellipse cx="8" cy="4" rx="5" ry="2" />
      <path d="M3 4V12C3 13.1 5.24 14 8 14C10.76 14 13 13.1 13 12V4" />
      <path d="M3 8C3 9.1 5.24 10 8 10C10.76 10 13 9.1 13 8" />
    </svg>
  ),
  add: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M7 2V12" strokeLinecap="round" />
      <path d="M2 7H12" strokeLinecap="round" />
    </svg>
  ),
  dropHere: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="3" width="18" height="18" rx="3" strokeDasharray="4 2" />
      <path d="M12 8V16M8 12H16" />
    </svg>
  ),
  customMetric: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="8" cy="8" r="6" />
      <path d="M8 5V8L10 10" />
    </svg>
  ),
  select: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M2 4L6 8L2 12" />
      <line x1="8" y1="12" x2="14" y2="12" />
    </svg>
  ),
  join: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="5" cy="8" r="3" />
      <circle cx="11" cy="8" r="3" />
    </svg>
  ),
  filter: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <polygon points="14 2 2 2 7 8 7 12 9 14 9 8 14 2" />
    </svg>
  ),
  group: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="2" width="5" height="5" rx="1" />
      <rect x="9" y="2" width="5" height="5" rx="1" />
      <rect x="2" y="9" width="5" height="5" rx="1" />
      <rect x="9" y="9" width="5" height="5" rx="1" />
    </svg>
  ),
  order: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M4 2V14M4 14L2 12M4 14L6 12" />
      <path d="M12 14V2M12 2L10 4M12 2L14 4" />
    </svg>
  ),
  limit: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="4" width="12" height="8" rx="1" />
      <path d="M6 7V11M10 7V11" />
    </svg>
  ),
  play: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M4 2L14 8L4 14V2Z" />
    </svg>
  ),
  reset: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M2 8C2 11.3137 4.68629 14 8 14C11.3137 14 14 11.3137 14 8C14 4.68629 11.3137 2 8 2C5.87827 2 4.01061 3.09783 2.92893 4.75736" />
      <path d="M2 2V5.5H5.5" />
    </svg>
  ),
  more: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
      <circle cx="9" cy="4" r="1.8" />
      <circle cx="9" cy="9" r="1.8" />
      <circle cx="9" cy="14" r="1.8" />
    </svg>
  ),
  edit: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M9.5 2.5L11.5 4.5L4.5 11.5H2.5V9.5L9.5 2.5Z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  save: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M2 7L5.5 10.5L12 4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  close: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M10.5 3.5L3.5 10.5M3.5 3.5L10.5 10.5" strokeLinecap="round" />
    </svg>
  ),
  trash: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M3 4H11" strokeLinecap="round" />
      <path d="M5 4V2.8H9V4" strokeLinecap="round" />
      <path d="M4 4L4.7 11.2H9.3L10 4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  entities: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="1" y="1" width="6" height="6" rx="1" />
      <rect x="9" y="1" width="6" height="6" rx="1" />
      <rect x="1" y="9" width="6" height="6" rx="1" />
      <rect x="9" y="9" width="6" height="6" rx="1" />
    </svg>
  ),
  databaseLarge: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <ellipse cx="10" cy="5" rx="6" ry="2.5" />
      <path d="M4 5V15C4 16.4 6.69 17.5 10 17.5C13.31 17.5 16 16.4 16 15V5" />
      <path d="M4 10C4 11.4 6.69 12.5 10 12.5C13.31 12.5 16 11.4 16 10" />
    </svg>
  ),
  check: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M2 7L5.5 10.5L12 4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

// ============================================================================
// COMPONENT
// ============================================================================

export const SqlBuilder: React.FC<SqlBuilderProps> = ({
  model,
  initialQuery,
  onQueryChange,
  onRun,
  onSave,
  readOnly = false,
  compact = false,
}) => {
  const [definitionSelections, setDefinitionSelections] = useState<DefinitionSelections>(() => {
    const initial: DefinitionSelections = {};
    model.tables.forEach((table) => {
      initial[table.id] = {};
    });
    model.dimensions.forEach((dimension) => {
      if (!initial[dimension.table]) {
        initial[dimension.table] = {};
      }
      initial[dimension.table][dimension.id] = {
        attributeLabel: null,
        selectedAction: null,
        dimensions: [],
        metrics: [],
      };
    });
    return initial;
  });

  const [tableMenuOpenId, setTableMenuOpenId] = useState<string | null>(null);
  const [definitionTableId, setDefinitionTableId] = useState<string | null>(null);
  const [dimensionsTableId, setDimensionsTableId] = useState<string | null>(null);
  const [metricsTableId, setMetricsTableId] = useState<string | null>(null);
  const [editingDimId, setEditingDimId] = useState<string | null>(null);
  const [editDimData, setEditDimData] = useState<{ label: string; unique: boolean }>({ label: '', unique: false });
  const [editingMetId, setEditingMetId] = useState<string | null>(null);
  const [editMetData, setEditMetData] = useState<{ label: string; formula: string; unique: boolean }>({ label: '', formula: '', unique: false });
  const [sourceTypeFilter, setSourceTypeFilter] = useState<SourceType>('all');
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
  const [selectedDatabaseIds, setSelectedDatabaseIds] = useState<Set<string>>(() => {
    // Select all databases by default
    const allDbIds = model.databases?.map((db) => db.id) || [];
    return new Set(allDbIds);
  });

  const [isConnectionModalOpen, setIsConnectionModalOpen] = useState(false);

  useEffect(() => {
    if (!tableMenuOpenId) return;
    const handleClick = () => {
      setTableMenuOpenId(null);
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [tableMenuOpenId]);

  const effectiveModel = useMemo(() => {
    const additionalDimensions: DimensionDef[] = [];
    const additionalMetrics: MetricDef[] = [];

    Object.entries(definitionSelections).forEach(([tableId, attrs]) => {
      Object.entries(attrs).forEach(([attrId, config]) => {
        const baseDim = model.dimensions.find((d) => d.id === attrId);
        if (!baseDim) return;

        config.dimensions.forEach((dim) => {
          additionalDimensions.push({
            ...baseDim,
            id: `${attrId}__dim__${dim.id}`,
            label: dim.label,
            defaultAgg: dim.unique ? 'distinct' : undefined,
          });
        });

        config.metrics.forEach((met) => {
          additionalMetrics.push({
            id: `${attrId}__met__${met.id}`,
            label: met.label,
            table: tableId,
            returnType: 'number',
            defaultAgg: met.unique ? 'distinct' : (met.formula?.toLowerCase() as AggregationType | undefined),
          });
        });
      });
    });

    return {
      ...model,
      dimensions: [...model.dimensions, ...additionalDimensions],
      metrics: [...model.metrics, ...additionalMetrics],
    };
  }, [model, definitionSelections]);

  const {
    state,
    validation,
    availableDimensions,
    availableMetrics,
    availableTables,
    buildJSON,
    buildSQL,
    setFrom,
    addSelect,
    updateSelect,
    removeSelect,
    reorderSelect,
    addJoin,
    updateJoin,
    removeJoin,
    addFilter,
    updateFilter,
    removeFilter,
    addGroupBy,
    removeGroupBy,
    addOrderBy,
    updateOrderBy,
    removeOrderBy,
    reorderOrderBy,
    setLimit,
    setOffset,
    reset,
    autoGroupBy,
  } = useSqlBuilder(effectiveModel, initialQuery);

  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Build JSON and SQL
  const queryJSON = useMemo(() => buildJSON(), [buildJSON]);
  const querySQL = useMemo(() => buildSQL(), [buildSQL]);

  // Notify on change
  React.useEffect(() => {
    onQueryChange?.(queryJSON);
  }, [queryJSON, onQueryChange]);

  // Handle field click from palette
  const handleFieldClick = useCallback(
    (field: DimensionDef | MetricDef, type: 'dimension' | 'metric') => {
      if (readOnly) return;
      addSelect(field.id, type === 'metric');
    },
    [addSelect, readOnly]
  );

  // Handle drop on select zone
  const handleSelectDrop = useCallback(
    (data: { type: string; field: string; label: string }) => {
      if (readOnly) return;
      addSelect(data.field, data.type === 'metric');
    },
    [addSelect, readOnly]
  );

  // Handle field reorder
  const handleReorderSelect = useCallback(
    (fromIndex: number, toIndex: number) => {
      if (readOnly) return;
      reorderSelect(fromIndex, toIndex);
    },
    [reorderSelect, readOnly]
  );

  // Handle run
  const handleRun = useCallback(() => {
    if (!validation.isValid) return;
    onRun?.(queryJSON);
  }, [validation.isValid, queryJSON, onRun]);

  // Handle reset
  const handleReset = useCallback(() => {
    if (readOnly) return;
    reset();
  }, [reset, readOnly]);

  // All available fields for filters
  const allFields = useMemo(
    () => [...availableDimensions, ...availableMetrics],
    [availableDimensions, availableMetrics]
  );

  // Custom metrics (created by user via definitions modal)
  const customMetrics = useMemo(() => {
    const baseMetricIds = new Set(model.metrics.map((m) => m.id));
    return availableMetrics.filter((m) => !baseMetricIds.has(m.id));
  }, [model.metrics, availableMetrics]);

  // Base metrics (original metrics from model)
  const baseMetrics = useMemo(() => {
    const baseMetricIds = new Set(model.metrics.map((m) => m.id));
    return availableMetrics.filter((m) => baseMetricIds.has(m.id));
  }, [model.metrics, availableMetrics]);

  // Check if multiple databases are selected
  const hasMultipleDatabases = useMemo(() => {
    return (model.databases?.length || 0) > 1 && selectedDatabaseIds.size > 1;
  }, [model.databases, selectedDatabaseIds]);

  // Get database label by ID
  const getDatabaseLabel = useCallback((databaseId: string | undefined) => {
    if (!databaseId || !model.databases) return null;
    return model.databases.find((db) => db.id === databaseId)?.label || null;
  }, [model.databases]);

  // Toggle database selection
  const toggleDatabase = useCallback((databaseId: string) => {
    setSelectedDatabaseIds((prev) => {
      const next = new Set(prev);
      if (next.has(databaseId)) {
        // Don't allow deselecting the last database
        if (next.size > 1) {
          next.delete(databaseId);
        }
      } else {
        next.add(databaseId);
      }
      return next;
    });
  }, []);

  // Select/deselect all databases
  const toggleAllDatabases = useCallback(() => {
    if (!model.databases) return;
    const allDbIds = model.databases.map((db) => db.id);
    setSelectedDatabaseIds((prev) => {
      if (prev.size === allDbIds.length) {
        // If all selected, select only first
        return new Set([allDbIds[0]]);
      }
      return new Set(allDbIds);
    });
  }, [model.databases]);

  // Filter entities (tables/views) by type AND selected databases
  const filteredEntities = useMemo(() => {
    let filtered = model.tables;

    // Filter by selected databases
    if (model.databases && model.databases.length > 0) {
      filtered = filtered.filter((table) => {
        const tableDb = (table as { database?: string }).database;
        return !tableDb || selectedDatabaseIds.has(tableDb);
      });
    }

    // Filter by entity type
    if (sourceTypeFilter !== 'all') {
      filtered = filtered.filter((table) => {
        const tableType = (table as { type?: string }).type || 'table';
        return tableType === sourceTypeFilter;
      });
    }

    return filtered;
  }, [model.tables, model.databases, selectedDatabaseIds, sourceTypeFilter]);

  // All dimensions from model (not filtered by FROM)
  const allModelDimensions = useMemo(() => {
    return effectiveModel.dimensions;
  }, [effectiveModel.dimensions]);

  // All metrics from model (not filtered by FROM)
  const allModelMetrics = useMemo(() => {
    return effectiveModel.metrics;
  }, [effectiveModel.metrics]);

  // Base metric IDs from original model
  const baseMetricIds = useMemo(() => new Set(model.metrics.map((m) => m.id)), [model.metrics]);

  // Dimensions filtered by selected source (using full model, not FROM-filtered)
  const sidebarDimensions = useMemo(() => {
    if (!selectedSourceId) return allModelDimensions;
    return allModelDimensions.filter((d) => d.table === selectedSourceId);
  }, [allModelDimensions, selectedSourceId]);

  // Base metrics filtered by selected source (using full model)
  const sidebarBaseMetrics = useMemo(() => {
    const allBaseMetrics = allModelMetrics.filter((m) => baseMetricIds.has(m.id));
    if (!selectedSourceId) return allBaseMetrics;
    return allBaseMetrics.filter((m) => m.table === selectedSourceId);
  }, [allModelMetrics, baseMetricIds, selectedSourceId]);

  // Custom metrics filtered by selected source (using full model)
  const sidebarCustomMetrics = useMemo(() => {
    const allCustomMetrics = allModelMetrics.filter((m) => !baseMetricIds.has(m.id));
    if (!selectedSourceId) return allCustomMetrics;
    return allCustomMetrics.filter((m) => m.table === selectedSourceId);
  }, [allModelMetrics, baseMetricIds, selectedSourceId]);

  // Selected source info
  const selectedSource = useMemo(
    () => model.tables.find((t) => t.id === selectedSourceId) ?? null,
    [model.tables, selectedSourceId]
  );

  const definitionTable = useMemo(
    () => model.tables.find((table) => table.id === definitionTableId) ?? null,
    [definitionTableId, model.tables]
  );
  const metricsTable = useMemo(
    () => model.tables.find((table) => table.id === metricsTableId) ?? null,
    [metricsTableId, model.tables]
  );
  const dimensionsTable = useMemo(
    () => model.tables.find((table) => table.id === dimensionsTableId) ?? null,
    [dimensionsTableId, model.tables]
  );

  const definitionAttributes = useMemo(() => {
    if (!definitionTableId) return [];
    return model.dimensions.filter((dimension) => dimension.table === definitionTableId);
  }, [definitionTableId, model.dimensions]);

  const metricsForTable = useMemo(() => {
    if (!metricsTableId) return [];
    return effectiveModel.metrics.filter((metric) => metric.table === metricsTableId);
  }, [effectiveModel.metrics, metricsTableId]);

  const dimensionsForTable = useMemo(() => {
    if (!dimensionsTableId) return [];
    return effectiveModel.dimensions.filter((dim) => dim.table === dimensionsTableId);
  }, [effectiveModel.dimensions, dimensionsTableId]);

  const parseCustomDimensionId = (id: string) => {
    const parts = id.split('__dim__');
    if (parts.length !== 2) return null;
    return { attributeId: parts[0], entryId: parts[1] };
  };

  const parseCustomMetricId = (id: string) => {
    const parts = id.split('__met__');
    if (parts.length !== 2) return null;
    return { attributeId: parts[0], entryId: parts[1] };
  };

  const getCustomDimensionEntry = (dim: DimensionDef) => {
    const parsed = parseCustomDimensionId(dim.id);
    if (!parsed) return null;
    const selection = definitionSelections[dim.table]?.[parsed.attributeId];
    const entry = selection?.dimensions.find((d) => d.id === parsed.entryId) ?? null;
    if (!entry) return null;
    const attribute = model.dimensions.find((d) => d.id === parsed.attributeId) ?? null;
    const table = model.tables.find((t) => t.id === dim.table) ?? null;
    return { parsed, entry, attribute, table };
  };

  const getCustomMetricEntry = (metric: MetricDef) => {
    const parsed = parseCustomMetricId(metric.id);
    if (!parsed) return null;
    const selection = definitionSelections[metric.table]?.[parsed.attributeId];
    const entry = selection?.metrics.find((m) => m.id === parsed.entryId) ?? null;
    if (!entry) return null;
    const attribute = model.dimensions.find((d) => d.id === parsed.attributeId) ?? null;
    const table = model.tables.find((t) => t.id === metric.table) ?? null;
    return { parsed, entry, attribute, table };
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerTitle}>
          <div className={styles.headerIcon}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="2" y="2" width="16" height="16" rx="3" />
              <line x1="2" y1="7" x2="18" y2="7" />
              <line x1="7" y1="7" x2="7" y2="18" />
            </svg>
          </div>
          <h1>Query Builder</h1>
        </div>
        <div className={styles.headerActions}>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnSecondary}`}
            onClick={handleReset}
            disabled={readOnly}
          >
            {Icons.reset}
            Réinitialiser
          </button>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnPrimary}`}
            onClick={handleRun}
            disabled={!validation.isValid}
          >
            {Icons.play}
            Exécuter
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className={styles.main}>
        {/* Sidebar - Field Palette */}
        <FieldPalette
          dimensions={sidebarDimensions}
          metrics={sidebarBaseMetrics}
          customMetrics={sidebarCustomMetrics}
          onFieldClick={handleFieldClick}
          selectedSource={selectedSource}
          onClearSelection={() => setSelectedSourceId(null)}
        />

        {/* Workspace */}
        <div className={styles.workspace}>
          <div className={styles.workspaceInner}>
            {/* Validation errors */}
            {!validation.isValid && (
              <div className={styles.validationPanel} style={{ marginBottom: '16px', borderRadius: 'var(--qb-radius)' }}>
                {validation.errors.slice(0, 3).map((error, i) => (
                  <div key={i} className={styles.validationError}>
                    <span className={styles.validationIcon}>⚠️</span>
                    {error.message}
                  </div>
                ))}
              </div>
            )}

            {/* Bases de données */}
            <CollapsibleSection
              title="Bases de données"
              icon={Icons.database}
              iconClassName={styles.sectionIconDatabase}
              badge={model.databases && model.databases.length > 0 ? selectedDatabaseIds.size : undefined}
              defaultOpen={true}
              actions={(
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={Icons.add}
                  onClick={() => setIsConnectionModalOpen(true)}
                >
                  Ajouter
                </Button>
              )}
            >
              {model.databases && model.databases.length > 0 ? (
                <>
                  <div className={styles.databaseGrid}>
                    {model.databases.map((database) => {
                      const isSelected = selectedDatabaseIds.has(database.id);
                      return (
                        <div
                          key={database.id}
                          className={`${styles.databaseCard} ${isSelected ? styles.databaseCardSelected : ''}`}
                          onClick={() => !readOnly && toggleDatabase(database.id)}
                          role="checkbox"
                          aria-checked={isSelected}
                          tabIndex={0}
                        >
                          <div className={styles.databaseCardCheck}>
                            {isSelected && Icons.check}
                          </div>
                          <div className={styles.databaseCardIcon}>
                            {Icons.databaseLarge}
                          </div>
                          <div className={styles.databaseCardInfo}>
                            <span className={styles.databaseCardName}>{database.label}</span>
                            {database.type && (
                              <span className={styles.databaseCardType}>{database.type}</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {model.databases.length > 1 && (
                    <button
                      type="button"
                      className={styles.selectAllBtn}
                      onClick={() => !readOnly && toggleAllDatabases()}
                    >
                      {selectedDatabaseIds.size === model.databases.length ? 'Désélectionner tout' : 'Sélectionner tout'}
                    </button>
                  )}
                </>
              ) : (
                <div className={styles.databaseEmptyState}>
                  <div className={styles.databaseEmptyIcon}>
                    {Icons.databaseLarge}
                  </div>
                  <div className={styles.databaseEmptyText}>
                    Aucune base de données configurée
                  </div>
                  <div className={styles.databaseEmptyHint}>
                    Les bases de données seront affichées ici une fois connectées
                  </div>
                </div>
              )}
            </CollapsibleSection>

            {/* Entités (Tables, Vues, Vues Matérialisées) */}
            <CollapsibleSection
              title="Entités"
              icon={Icons.entities}
              iconClassName={styles.sectionIconEntities}
              badge={filteredEntities.length}
              defaultOpen={true}
            >
              {/* Filtre par type */}
              <div className={styles.sourceTypeFilter}>
                {SOURCE_TYPE_FILTERS.map((filter) => (
                  <button
                    key={filter.value}
                    type="button"
                    className={`${styles.sourceTypeBtn} ${sourceTypeFilter === filter.value ? styles.sourceTypeBtnActive : ''}`}
                    onClick={() => setSourceTypeFilter(filter.value)}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>

              <div className={styles.dataSourcesGrid}>
                {filteredEntities.map((table) => {
                  const tableType = (table as { type?: string }).type || 'table';
                  const tableDatabase = (table as { database?: string }).database;
                  const databaseLabel = getDatabaseLabel(tableDatabase);
                  const isSelected = selectedSourceId === table.id;
                  const iconClass = tableType === 'view'
                    ? styles.dataSourceIconView
                    : tableType === 'materialized_view'
                      ? styles.dataSourceIconMaterialized
                      : styles.dataSourceIconTable;
                  const icon = tableType === 'view'
                    ? Icons.view
                    : tableType === 'materialized_view'
                      ? Icons.materializedView
                      : Icons.tableLarge;
                  const typeLabel = tableType === 'view'
                    ? 'Vue'
                    : tableType === 'materialized_view'
                      ? 'Vue mat.'
                      : 'Table';

                  return (
                    <div
                      key={table.id}
                      className={`${styles.dataSourceCard} ${isSelected ? styles.dataSourceCardSelected : ''}`}
                      draggable={!readOnly}
                      onDragStart={(e) => {
                        e.dataTransfer.setData('application/json', JSON.stringify({ type: 'table', id: table.id }));
                        e.currentTarget.classList.add(styles.dataSourceCardDragging);
                      }}
                      onDragEnd={(e) => {
                        e.currentTarget.classList.remove(styles.dataSourceCardDragging);
                      }}
                      onClick={() => {
                        if (readOnly) return;
                        // Clic = sélectionner la source pour afficher ses champs dans la sidebar
                        setSelectedSourceId((prev) => (prev === table.id ? null : table.id));
                      }}
                      role="button"
                      tabIndex={0}
                    >
                      <div className={`${styles.dataSourceIcon} ${iconClass}`}>
                        {icon}
                      </div>
                      <span className={styles.dataSourceName}>{table.label}</span>
                      {hasMultipleDatabases && databaseLabel && (
                        <span className={styles.dataSourceDatabase}>{databaseLabel}</span>
                      )}
                      <span className={styles.dataSourceType}>{typeLabel}</span>
                      <div
                        className={styles.dataSourceMenu}
                        onClick={(event) => event.stopPropagation()}
                      >
                        <button
                          type="button"
                          className={styles.dataSourceMenuButton}
                          onClick={(event) => {
                            event.stopPropagation();
                            setTableMenuOpenId((prev) => (prev === table.id ? null : table.id));
                          }}
                          aria-label={`Options pour ${table.label}`}
                        >
                          {Icons.more}
                        </button>
                        {tableMenuOpenId === table.id && (
                          <div className={styles.dataSourceMenuList} role="menu">
                            <button
                              type="button"
                              className={styles.dataSourceMenuItem}
                              onClick={(event) => {
                                event.stopPropagation();
                                setDefinitionTableId(table.id);
                                setTableMenuOpenId(null);
                              }}
                              role="menuitem"
                            >
                              Définitions
                            </button>
                            <button
                              type="button"
                              className={styles.dataSourceMenuItem}
                              onClick={(event) => {
                                event.stopPropagation();
                                setDimensionsTableId(table.id);
                                setTableMenuOpenId(null);
                              }}
                              role="menuitem"
                            >
                              Liste des dimensions
                            </button>
                            <button
                              type="button"
                              className={styles.dataSourceMenuItem}
                              onClick={(event) => {
                                event.stopPropagation();
                                setMetricsTableId(table.id);
                                setTableMenuOpenId(null);
                              }}
                              role="menuitem"
                            >
                              Liste des métriques
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              {filteredEntities.length === 0 && (
                <div className={styles.emptyState} style={{ padding: '20px' }}>
                  <div className={styles.emptyStateText}>Aucune entité de ce type</div>
                </div>
              )}
            </CollapsibleSection>

            {/* FROM - Table sélectionnée */}
            <CollapsibleSection
              title="Table source (FROM)"
              icon={Icons.table}
              iconClassName={styles.sectionIconFrom}
              defaultOpen={true}
            >
              {state.from ? (
                <div className={styles.fromSelectedTable}>
                  <div className={styles.fromSelectedIcon}>
                    {Icons.tableLarge}
                  </div>
                  <div className={styles.fromSelectedInfo}>
                    <div className={styles.fromSelectedName}>
                      {model.tables.find((t) => t.id === state.from)?.label || state.from}
                    </div>
                    <div className={styles.fromSelectedId}>{state.from}</div>
                  </div>
                  {!readOnly && (
                    <button
                      type="button"
                      className={styles.fromSelectedRemove}
                      onClick={() => setFrom('')}
                      title="Retirer la table"
                    >
                      <RemoveIcon size={10} variant="cross" />
                    </button>
                  )}
                </div>
              ) : (
                <div
                  className={`${styles.fromDropZone}`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.add(styles.fromDropZoneActive);
                  }}
                  onDragLeave={(e) => {
                    e.currentTarget.classList.remove(styles.fromDropZoneActive);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.remove(styles.fromDropZoneActive);
                    try {
                      const data = JSON.parse(e.dataTransfer.getData('application/json'));
                      if (data.type === 'table' && data.id) {
                        setFrom(data.id);
                      }
                    } catch (err) {
                      // Ignore invalid data
                    }
                  }}
                >
                  <span className={styles.fromDropZoneIcon}>{Icons.dropHere}</span>
                  <span className={styles.fromDropZoneText}>
                    Glissez une source de données ici
                  </span>
                </div>
              )}
            </CollapsibleSection>

            {/* SELECT - Fields */}
            <CollapsibleSection
              title="Champs (SELECT)"
              icon={Icons.select}
              iconClassName={styles.sectionIconSelect}
              badge={state.select.length}
              defaultOpen={true}
            >
              <DropZone
                onDrop={handleSelectDrop}
                emptyText="Glissez des champs ici"
                emptyHint="ou cliquez sur un champ dans la palette"
              >
                {state.select.map((field, index) => (
                  <SelectedField
                    key={field.id}
                    field={field}
                    index={index}
                    onRemove={() => removeSelect(field.id)}
                    onDragStart={() => setDragOverIndex(null)}
                    onDragEnd={() => setDragOverIndex(null)}
                    onDragOver={(i) => {
                      if (dragOverIndex !== i) {
                        setDragOverIndex(i);
                      }
                    }}
                  />
                ))}
              </DropZone>
            </CollapsibleSection>

            {/* JOINS */}
            <CollapsibleSection
              title="Jointures (JOIN)"
              icon={Icons.join}
              iconClassName={styles.sectionIconJoin}
              badge={state.joins.length}
              defaultOpen={state.joins.length > 0}
            >
              {state.joins.length > 0 && (
                <div className={styles.joinList}>
                  {state.joins.map((join) => (
                    <div key={join.id} className={styles.joinItem}>
                      <div className={styles.joinHeader}>
                        <div className={styles.joinType}>
                          {ALLOWED_JOIN_TYPES.map((type) => (
                            <button
                              key={type}
                              type="button"
                              className={`${styles.joinTypeBtn} ${join.type === type ? styles.joinTypeBtnActive : ''}`}
                              onClick={() => !readOnly && updateJoin(join.id, { type })}
                            >
                              {type.toUpperCase()}
                            </button>
                          ))}
                        </div>
                        <button
                          type="button"
                          className={styles.filterRemove}
                          onClick={() => !readOnly && removeJoin(join.id)}
                        >
                          <RemoveIcon size={14} variant="trash" />
                        </button>
                      </div>
                      <div style={{ marginBottom: '8px' }}>
                        <FormSelect
                          value={join.table}
                          onChange={(value) => !readOnly && updateJoin(join.id, { table: value })}
                          options={[
                            ...(join.table && !availableTables.some((t) => t.id === join.table)
                              ? effectiveModel.tables.filter((t) => t.id === join.table).map((t) => ({ value: t.id, label: t.label }))
                              : []),
                            ...availableTables.map((t) => ({ value: t.id, label: t.label })),
                          ]}
                          placeholder="Sélectionner une table"
                          disabled={readOnly}
                        />
                      </div>
                      <div className={styles.joinCondition}>
                        <FormSelect
                          value={join.on.left}
                          onChange={(value) => !readOnly && updateJoin(join.id, { on: { ...join.on, left: value } })}
                          options={allFields.map((f) => ({ value: f.id, label: f.label }))}
                          placeholder="Champ source"
                          disabled={readOnly}
                        />
                        <span className={styles.joinConditionEquals}>=</span>
                        <FormSelect
                          value={join.on.right}
                          onChange={(value) => !readOnly && updateJoin(join.id, { on: { ...join.on, right: value } })}
                          options={allFields.map((f) => ({ value: f.id, label: f.label }))}
                          placeholder="Champ cible"
                          disabled={readOnly}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {availableTables.length > 0 && (
                <button
                  type="button"
                  className={styles.addButton}
                  onClick={() => !readOnly && addJoin(availableTables[0]?.id || '')}
                  style={{ marginTop: state.joins.length > 0 ? '12px' : 0 }}
                >
                  <span className={styles.addButtonIcon}>+</span>
                  Ajouter une jointure
                </button>
              )}
            </CollapsibleSection>

            {/* WHERE Filters */}
            <CollapsibleSection
              title="Filtres (WHERE)"
              icon={Icons.filter}
              iconClassName={styles.sectionIconFilter}
              badge={state.filters.length}
              defaultOpen={state.filters.length > 0}
            >
              <FilterBuilder
                filters={state.filters}
                availableFields={availableDimensions}
                onAdd={(field) => !readOnly && addFilter(field, 'where')}
                onUpdate={(id, updates) => !readOnly && updateFilter(id, updates, 'where')}
                onRemove={(id) => !readOnly && removeFilter(id, 'where')}
              />
            </CollapsibleSection>

            {/* GROUP BY */}
            <CollapsibleSection
              title="Regroupement (GROUP BY)"
              icon={Icons.group}
              iconClassName={styles.sectionIconGroup}
              badge={state.groupBy.length}
              defaultOpen={state.groupBy.length > 0}
              actions={
                state.select.some((s) => !s.agg && !s.isMetric) && (
                  <button
                    type="button"
                    className={`${styles.btn} ${styles.btnSmall} ${styles.btnSecondary}`}
                    onClick={() => !readOnly && autoGroupBy()}
                    style={{ marginRight: '8px' }}
                  >
                    Auto
                  </button>
                )
              }
            >
              {state.groupBy.length > 0 ? (
                <div className={styles.selectedFields}>
                  {state.groupBy.map((g) => (
                    <div key={g.id} className={styles.selectedField}>
                      <span className={styles.selectedFieldName}>{g.fieldLabel}</span>
                      <button
                        type="button"
                        className={styles.selectedFieldRemove}
                        onClick={() => !readOnly && removeGroupBy(g.id)}
                      >
                        <RemoveIcon size={12} variant="trash" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.emptyState} style={{ padding: '20px' }}>
                  <div className={styles.emptyStateText}>Aucun regroupement</div>
                </div>
              )}
              <div style={{ marginTop: '12px' }}>
                <FormSelect
                  value=""
                  onChange={(value) => {
                    if (value && !readOnly) {
                      addGroupBy(value);
                    }
                  }}
                  options={availableDimensions
                    .filter((d) => d.groupable && !state.groupBy.some((g) => g.field === d.id))
                    .map((d) => ({ value: d.id, label: d.label }))}
                  placeholder="+ Ajouter un champ"
                  disabled={readOnly}
                />
              </div>
            </CollapsibleSection>

            {/* HAVING */}
            <CollapsibleSection
              title="Conditions agrégées (HAVING)"
              icon={Icons.filter}
              iconClassName={styles.sectionIconFilter}
              badge={state.having.length}
              defaultOpen={state.having.length > 0}
            >
              <FilterBuilder
                filters={state.having}
                availableFields={availableMetrics}
                onAdd={(field) => !readOnly && addFilter(field, 'having')}
                onUpdate={(id, updates) => !readOnly && updateFilter(id, updates, 'having')}
                onRemove={(id) => !readOnly && removeFilter(id, 'having')}
                title="HAVING"
              />
            </CollapsibleSection>

            {/* ORDER BY */}
            <CollapsibleSection
              title="Tri (ORDER BY)"
              icon={Icons.order}
              iconClassName={styles.sectionIconOrder}
              badge={state.orderBy.length}
              defaultOpen={state.orderBy.length > 0}
            >
              {state.orderBy.length > 0 && (
                <div className={styles.orderList}>
                  {state.orderBy.map((o, index) => (
                    <div key={o.id} className={styles.orderItem}>
                      <div className={styles.orderHandle}>
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                          <circle cx="3" cy="2" r="1" />
                          <circle cx="3" cy="6" r="1" />
                          <circle cx="3" cy="10" r="1" />
                          <circle cx="9" cy="2" r="1" />
                          <circle cx="9" cy="6" r="1" />
                          <circle cx="9" cy="10" r="1" />
                        </svg>
                      </div>
                      <span className={styles.orderField}>{o.fieldLabel}</span>
                      <div className={styles.orderDirection}>
                        <button
                          type="button"
                          className={`${styles.orderDirectionBtn} ${o.direction === 'asc' ? styles.orderDirectionBtnActive : ''}`}
                          onClick={() => !readOnly && updateOrderBy(o.id, { direction: 'asc' })}
                          title="Croissant"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          className={`${styles.orderDirectionBtn} ${o.direction === 'desc' ? styles.orderDirectionBtnActive : ''}`}
                          onClick={() => !readOnly && updateOrderBy(o.id, { direction: 'desc' })}
                          title="Décroissant"
                        >
                          ↓
                        </button>
                      </div>
                      <button
                        type="button"
                        className={styles.filterRemove}
                        onClick={() => !readOnly && removeOrderBy(o.id)}
                      >
                        <RemoveIcon size={14} variant="trash" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div style={{ marginTop: state.orderBy.length > 0 ? '12px' : 0 }}>
                <FormSelect
                  value=""
                  onChange={(value) => {
                    if (value && !readOnly) {
                      addOrderBy(value);
                    }
                  }}
                  options={allFields.map((f) => ({ value: f.id, label: f.label }))}
                  placeholder="+ Ajouter un tri"
                  disabled={readOnly}
                />
              </div>
            </CollapsibleSection>

            {/* LIMIT / OFFSET */}
            <CollapsibleSection
              title="Pagination (LIMIT / OFFSET)"
              icon={Icons.limit}
              iconClassName={styles.sectionIconLimit}
              defaultOpen={false}
            >
              <div className={styles.limitOffset}>
                <div className={styles.limitField}>
                  <FormInput
                    type="number"
                    label="LIMIT"
                    layout="inline"
                    value={state.limit ?? ''}
                    onChange={(e) => !readOnly && setLimit(e.target.value ? parseInt(e.target.value, 10) : undefined)}
                    min={1}
                    max={100000}
                    placeholder="100"
                    disabled={readOnly}
                  />
                </div>
                <div className={styles.limitField}>
                  <FormInput
                    type="number"
                    label="OFFSET"
                    layout="inline"
                    value={state.offset ?? ''}
                    onChange={(e) => !readOnly && setOffset(e.target.value ? parseInt(e.target.value, 10) : undefined)}
                    min={0}
                    placeholder="0"
                    disabled={readOnly}
                  />
                </div>
              </div>
            </CollapsibleSection>
          </div>
        </div>

        {/* Preview Panel */}
        <JSONPreview json={queryJSON} sql={querySQL} />
      </main>


      <Modal
        isOpen={isConnectionModalOpen}
        onClose={() => setIsConnectionModalOpen(false)}
        title="Ajouter une connexion"
        size="lg"
      // footer={(
      //   <div className={styles.modalFooter}>
      //     <Button variant="outline" onClick={() => setIsConnectionModalOpen(false)}>
      //       Annuler
      //     </Button>
      //     <Button isLoading={connectionLoading} onClick={handleSaveConnection} disabled={!isConnectionValid || connectionLoading}>
      //       Enregistrer
      //     </Button>
      //   </div>
      // )}
      >
        <DatabaseConnectionTab showTitle={false}/>
      </Modal>

      <Modal
        isOpen={Boolean(definitionTableId)}
        onClose={() => setDefinitionTableId(null)}
        title={definitionTable ? `Définitions - ${definitionTable.label}` : 'Définitions'}
        size="xl"
        footer={(
          <div className={styles.modalFooter}>
            <button
              type="button"
              className={`${styles.btn} ${styles.btnSecondary}`}
              onClick={() => setDefinitionTableId(null)}
            >
              Fermer
            </button>
          </div>
        )}
      >
        {definitionAttributes.length === 0 ? (
          <div className={styles.modalEmptyState}>
            Aucun attribut disponible pour cette table.
          </div>
        ) : (
          <div className={styles.definitionTableWrapper}>
            <table className={styles.definitionTable}>
              <thead>
                <tr>
                  <th>Attribut</th>
                  <th>Actions</th>
                  <th>Formulaire</th>
                </tr>
              </thead>
              <tbody>
                {definitionAttributes.map((attribute) => {
                  const selection = definitionSelections[attribute.table]?.[attribute.id] ?? {
                    attributeLabel: null,
                    selectedAction: null,
                    dimensions: [],
                    metrics: [],
                  };
                  const typeLabels: Record<string, string> = {
                    string: 'Texte',
                    number: 'Nombre',
                    date: 'Date',
                    boolean: 'Booléen',
                  };
                  return (
                    <tr key={attribute.id}>
                      <td>
                        <div className={styles.definitionAttribute}>
                          <input
                            type="text"
                            className={styles.definitionAttributeLabelInput}
                            value={selection.attributeLabel ?? attribute.label}
                            disabled={readOnly}
                            onChange={(e) => {
                              setDefinitionSelections((prev) => ({
                                ...prev,
                                [attribute.table]: {
                                  ...prev[attribute.table],
                                  [attribute.id]: {
                                    ...(prev[attribute.table]?.[attribute.id] ?? {
                                      attributeLabel: null,
                                      selectedAction: null,
                                      dimensions: [],
                                      metrics: [],
                                    }),
                                    attributeLabel: e.target.value,
                                  },
                                },
                              }));
                            }}
                            placeholder={attribute.label}
                          />
                          <span className={styles.definitionAttributeId}>{attribute.id}</span>
                          <span className={styles.definitionAttributeType}>
                            Type: {typeLabels[attribute.type] || attribute.type}
                          </span>
                        </div>
                      </td>
                      <td>
                        <FormRadioGroup
                          name={`action-${attribute.id}`}
                          options={[
                            { value: 'dimension', label: 'Ajouter dimension' },
                            { value: 'metric', label: 'Ajouter métrique' },
                          ]}
                          value={selection.selectedAction || ''}
                          onChange={(value) => {
                            if (readOnly) return;
                            setDefinitionSelections((prev) => ({
                              ...prev,
                              [attribute.table]: {
                                ...prev[attribute.table],
                                [attribute.id]: {
                                  ...(prev[attribute.table]?.[attribute.id] ?? {
                                    attributeLabel: null,
                                    selectedAction: null,
                                    dimensions: [],
                                    metrics: [],
                                  }),
                                  selectedAction: value as 'dimension' | 'metric',
                                },
                              },
                            }));
                          }}
                          orientation="vertical"
                          disabled={readOnly}
                        />
                      </td>
                      <td>
                        <div className={styles.definitionFormColumn}>
                          {selection.selectedAction && (
                            <DefinitionItemForm
                              type={selection.selectedAction}
                              tableName={definitionTable?.id || attribute.table}
                              attributeColumnName={attribute.id}
                              attributeId={attribute.id}
                              onAdd={(entry) => {
                                setDefinitionSelections((prev) => {
                                  const current = prev[attribute.table]?.[attribute.id] ?? {
                                    attributeLabel: null,
                                    selectedAction: selection.selectedAction,
                                    dimensions: [],
                                    metrics: [],
                                  };
                                  if (selection.selectedAction === 'dimension') {
                                    return {
                                      ...prev,
                                      [attribute.table]: {
                                        ...prev[attribute.table],
                                        [attribute.id]: {
                                          ...current,
                                          dimensions: [...current.dimensions, entry as DimensionEntry],
                                        },
                                      },
                                    };
                                  } else {
                                    return {
                                      ...prev,
                                      [attribute.table]: {
                                        ...prev[attribute.table],
                                        [attribute.id]: {
                                          ...current,
                                          metrics: [...current.metrics, entry as MetricEntry],
                                        },
                                      },
                                    };
                                  }
                                });
                              }}
                            />
                          )}

                          {selection.dimensions.length > 0 && (
                            <div className={styles.definitionEntryList}>
                              <div className={styles.definitionEntryListTitle}>
                                Dimensions ({selection.dimensions.length})
                              </div>
                              {selection.dimensions.map((dim) => (
                                <div key={dim.id} className={styles.definitionEntry}>
                                  <div className={styles.definitionEntryInfo}>
                                    <span className={styles.definitionEntryLabel}>{dim.label}</span>
                                    <span className={styles.definitionEntryAlias}>{dim.alias}</span>
                                    <span className={dim.unique ? styles.definitionUniqueBadgeActive : styles.definitionUniqueBadgeInactive}>
                                      {dim.unique ? 'Unique' : 'Standard'}
                                    </span>
                                  </div>
                                  <button
                                    type="button"
                                    
                                    onClick={() => {
                                      setDefinitionSelections((prev) => ({
                                        ...prev,
                                        [attribute.table]: {
                                          ...prev[attribute.table],
                                          [attribute.id]: {
                                            ...(prev[attribute.table]?.[attribute.id] ?? {
                                              attributeLabel: null,
                                              selectedAction: null,
                                              dimensions: [],
                                              metrics: [],
                                            }),
                                            dimensions: (prev[attribute.table]?.[attribute.id]?.dimensions ?? []).filter(
                                              (d) => d.id !== dim.id
                                            ),
                                          },
                                        },
                                      }));
                                    }}
                                    title="Supprimer"
                                  >
                                    <RemoveIcon size={14} variant="trash" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}

                          {selection.metrics.length > 0 && (
                            <div className={styles.definitionEntryList}>
                              <div className={styles.definitionEntryListTitle}>
                                Métriques ({selection.metrics.length})
                              </div>
                              {selection.metrics.map((met) => (
                                <div key={met.id} className={styles.definitionEntry}>
                                  <div className={styles.definitionEntryInfo}>
                                    <span className={styles.definitionEntryLabel}>{met.label}</span>
                                    <span className={styles.definitionEntryAlias}>{met.alias}</span>
                                    {met.formula && (
                                      <span className={styles.definitionEntryFormula}>{met.formula}</span>
                                    )}
                                    <span className={met.unique ? styles.definitionUniqueBadgeActive : styles.definitionUniqueBadgeInactive}>
                                      {met.unique ? 'Unique' : 'Standard'}
                                    </span>
                                  </div>
                                  <button
                                    type="button"
                                    
                                    onClick={() => {
                                      setDefinitionSelections((prev) => ({
                                        ...prev,
                                        [attribute.table]: {
                                          ...prev[attribute.table],
                                          [attribute.id]: {
                                            ...(prev[attribute.table]?.[attribute.id] ?? {
                                              attributeLabel: null,
                                              selectedAction: null,
                                              dimensions: [],
                                              metrics: [],
                                            }),
                                            metrics: (prev[attribute.table]?.[attribute.id]?.metrics ?? []).filter(
                                              (m) => m.id !== met.id
                                            ),
                                          },
                                        },
                                      }));
                                    }}
                                    title="Supprimer"
                                  >
                                    <RemoveIcon size={14} variant="trash" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}

                          {!selection.selectedAction && selection.dimensions.length === 0 && selection.metrics.length === 0 && (
                            <span className={styles.definitionFormPlaceholder}>
                              Sélectionnez une action pour afficher le formulaire
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={Boolean(dimensionsTableId)}
        onClose={() => {
          setDimensionsTableId(null);
          setEditingDimId(null);
          setEditDimData({ label: '', unique: false });
        }}
        title={dimensionsTable ? `Dimensions - ${dimensionsTable.label}` : 'Dimensions'}
        size="lg"
        footer={(
          <div className={styles.modalFooter}>
            <button
              type="button"
              className={`${styles.btn} ${styles.btnSecondary}`}
              onClick={() => {
                setDimensionsTableId(null);
                setEditingDimId(null);
                setEditDimData({ label: '', unique: false });
              }}
            >
              Fermer
            </button>
          </div>
        )}
      >
        {dimensionsForTable.length === 0 ? (
          <div className={styles.modalEmptyState}>
            Aucune dimension configurée pour cette table.
          </div>
        ) : (
          <div className={styles.definitionTableWrapper}>
            <table className={styles.definitionTable}>
              <thead>
                <tr>
                  <th>Attribut</th>
                  <th>Libellé</th>
                  <th>Alias</th>
                  <th>Unique</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {dimensionsForTable.map((dim) => {
                  const customInfo = getCustomDimensionEntry(dim);
                  const isEditing = editingDimId === dim.id;
                  const isEditable = Boolean(customInfo);
                  const uniqueValue = customInfo?.entry.unique ?? false;
                  const aliasValue = customInfo?.entry.alias ?? '—';
                  const attributeName = customInfo?.attribute?.label ?? dim.label;
                  const labelValue = customInfo?.entry.label ?? dim.label;
                  const editAlias = isEditing && customInfo
                    ? buildAlias(
                      customInfo.table?.id || dim.table,
                      customInfo.attribute?.id || customInfo.parsed.attributeId,
                      editDimData.unique
                    )
                    : aliasValue;
                  return (
                    <tr key={dim.id} className={isEditing ? styles.definitionEditRow : undefined}>
                      <td>
                        <span className={styles.definitionAttributeLabel}>{attributeName}</span>
                      </td>
                      <td>
                        {isEditing ? (
                          <FormInput
                            value={editDimData.label}
                            onChange={(event) => setEditDimData((prev) => ({ ...prev, label: event.target.value }))}
                            placeholder="Libellé"
                          />
                        ) : (
                          <span>{labelValue}</span>
                        )}
                      </td>
                      <td>
                        <span className={styles.definitionEntryAlias}>{isEditing ? editAlias : aliasValue}</span>
                      </td>
                      <td>
                        {isEditing ? (
                          <FormCheckbox
                            label="Unique"
                            checked={editDimData.unique}
                            onChange={(event) => setEditDimData((prev) => ({ ...prev, unique: event.target.checked }))}
                          />
                        ) : (
                          <span className={uniqueValue ? styles.definitionUniqueBadgeActive : styles.definitionUniqueBadgeInactive}>
                            {uniqueValue ? 'Unique' : 'Standard'}
                          </span>
                        )}
                      </td>
                      <td>
                        <div className={styles.definitionActionIcons}>
                          {isEditing ? (
                            <>
                              <button
                                type="button"
                                className={`${styles.definitionActionBtn} ${styles.definitionActionBtnSuccess}`}
                                onClick={() => {
                                  const nextLabel = editDimData.label.trim();
                                  if (!nextLabel || !customInfo) return;
                                  const nextAlias = buildAlias(
                                    customInfo.table?.id || dim.table,
                                    customInfo.attribute?.id || customInfo.parsed.attributeId,
                                    editDimData.unique
                                  );
                                  setDefinitionSelections((prev) => ({
                                    ...prev,
                                    [dim.table]: {
                                      ...prev[dim.table],
                                      [customInfo.parsed.attributeId]: {
                                        ...(prev[dim.table]?.[customInfo.parsed.attributeId] ?? {
                                          attributeLabel: null,
                                          selectedAction: null,
                                          dimensions: [],
                                          metrics: [],
                                        }),
                                        dimensions: (prev[dim.table]?.[customInfo.parsed.attributeId]?.dimensions ?? []).map((entry) =>
                                          entry.id === customInfo.parsed.entryId
                                            ? {
                                              ...entry,
                                              label: nextLabel,
                                              name: nextLabel,
                                              unique: editDimData.unique,
                                              alias: nextAlias,
                                            }
                                            : entry
                                        ),
                                      },
                                    },
                                  }));
                                  setEditingDimId(null);
                                }}
                                title="Enregistrer"
                                disabled={!customInfo}
                              >
                                {Icons.save}
                              </button>
                              <button
                                type="button"
                                className={styles.definitionActionBtn}
                                onClick={() => {
                                  setEditingDimId(null);
                                  setEditDimData({ label: '', unique: false });
                                }}
                                title="Annuler"
                              >
                                {Icons.close}
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                className={`${styles.definitionActionBtn} ${!isEditable ? styles.definitionActionBtnDisabled : ''}`}
                                onClick={() => {
                                  if (!customInfo) return;
                                  setEditingDimId(dim.id);
                                  setEditDimData({ label: customInfo.entry.label, unique: customInfo.entry.unique });
                                }}
                                title={customInfo ? 'Modifier' : 'Non modifiable'}
                                aria-disabled={!isEditable}
                              >
                                {Icons.edit}
                              </button>
                              <button
                                type="button"
                                className={`${styles.definitionActionBtn} ${styles.definitionActionBtnDanger} ${!isEditable ? styles.definitionActionBtnDisabled : ''}`}
                                onClick={() => {
                                  if (!customInfo) return;
                                  setDefinitionSelections((prev) => ({
                                    ...prev,
                                    [dim.table]: {
                                      ...prev[dim.table],
                                      [customInfo.parsed.attributeId]: {
                                        ...(prev[dim.table]?.[customInfo.parsed.attributeId] ?? {
                                          attributeLabel: null,
                                          selectedAction: null,
                                          dimensions: [],
                                          metrics: [],
                                        }),
                                        dimensions: (prev[dim.table]?.[customInfo.parsed.attributeId]?.dimensions ?? []).filter(
                                          (entry) => entry.id !== customInfo.parsed.entryId
                                        ),
                                      },
                                    },
                                  }));
                                  if (editingDimId === dim.id) {
                                    setEditingDimId(null);
                                    setEditDimData({ label: '', unique: false });
                                  }
                                }}
                                title={customInfo ? 'Supprimer' : 'Non modifiable'}
                                aria-disabled={!isEditable}
                              >
                                {Icons.trash}
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={Boolean(metricsTableId)}
        onClose={() => {
          setMetricsTableId(null);
          setEditingMetId(null);
          setEditMetData({ label: '', formula: '', unique: false });
        }}
        title={metricsTable ? `Métriques - ${metricsTable.label}` : 'Métriques'}
        size="lg"
        footer={(
          <div className={styles.modalFooter}>
            <button
              type="button"
              className={`${styles.btn} ${styles.btnSecondary}`}
              onClick={() => {
                setMetricsTableId(null);
                setEditingMetId(null);
                setEditMetData({ label: '', formula: '', unique: false });
              }}
            >
              Fermer
            </button>
          </div>
        )}
      >
        {metricsForTable.length === 0 ? (
          <div className={styles.modalEmptyState}>
            Aucune métrique configurée pour cette table.
          </div>
        ) : (
          <div className={styles.definitionTableWrapper}>
            <table className={styles.definitionTable}>
              <thead>
                <tr>
                  <th>Attribut</th>
                  <th>Libellé</th>
                  <th>Alias</th>
                  <th>Formule</th>
                  <th>Unique</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {metricsForTable.map((metric) => {
                  const customInfo = getCustomMetricEntry(metric);
                  const isEditing = editingMetId === metric.id;
                  const isEditable = Boolean(customInfo);
                  const uniqueValue = customInfo?.entry.unique ?? false;
                  const aliasValue = customInfo?.entry.alias ?? '—';
                  const attributeName = customInfo?.attribute?.label ?? metric.label;
                  const labelValue = customInfo?.entry.label ?? metric.label;
                  const formulaValue = customInfo?.entry.formula || (metric.defaultAgg ? metric.defaultAgg.toUpperCase() : 'AUTO');
                  const editAlias = isEditing && customInfo
                    ? buildAlias(
                      customInfo.table?.id || metric.table,
                      customInfo.attribute?.id || customInfo.parsed.attributeId,
                      editMetData.unique,
                      editMetData.formula
                    )
                    : aliasValue;
                  const canSave = editMetData.label.trim().length > 0 && editMetData.formula.length > 0;

                  return (
                    <tr key={metric.id} className={isEditing ? styles.definitionEditRow : undefined}>
                      <td>
                        <span className={styles.definitionAttributeLabel}>{attributeName}</span>
                      </td>
                      <td>
                        {isEditing ? (
                          <FormInput
                            value={editMetData.label}
                            onChange={(event) => setEditMetData((prev) => ({ ...prev, label: event.target.value }))}
                            placeholder="Libellé"
                          />
                        ) : (
                          <span>{labelValue}</span>
                        )}
                      </td>
                      <td>
                        <span className={styles.definitionEntryAlias}>{isEditing ? editAlias : aliasValue}</span>
                      </td>
                      <td>
                        {isEditing ? (
                          <FormSelect
                            options={FORMULA_OPTIONS}
                            value={editMetData.formula}
                            onChange={(value) => setEditMetData((prev) => ({ ...prev, formula: value }))}
                            placeholder="Sélectionner"
                          />
                        ) : (
                          <span className={styles.metricAgg}>
                            {formulaValue}
                          </span>
                        )}
                      </td>
                      <td>
                        {isEditing ? (
                          <FormCheckbox
                            label="Unique"
                            checked={editMetData.unique}
                            onChange={(event) => setEditMetData((prev) => ({ ...prev, unique: event.target.checked }))}
                          />
                        ) : (
                          <span className={uniqueValue ? styles.definitionUniqueBadgeActive : styles.definitionUniqueBadgeInactive}>
                            {uniqueValue ? 'Unique' : 'Standard'}
                          </span>
                        )}
                      </td>
                      <td>
                        <div className={styles.definitionActionIcons}>
                          {isEditing ? (
                            <>
                              <button
                                type="button"
                                className={`${styles.definitionActionBtn} ${styles.definitionActionBtnSuccess}`}
                                onClick={() => {
                                  if (!canSave || !customInfo) return;
                                  const nextLabel = editMetData.label.trim();
                                  const nextAlias = buildAlias(
                                    customInfo.table?.id || metric.table,
                                    customInfo.attribute?.id || customInfo.parsed.attributeId,
                                    editMetData.unique,
                                    editMetData.formula
                                  );
                                  setDefinitionSelections((prev) => ({
                                    ...prev,
                                    [metric.table]: {
                                      ...prev[metric.table],
                                      [customInfo.parsed.attributeId]: {
                                        ...(prev[metric.table]?.[customInfo.parsed.attributeId] ?? {
                                          attributeLabel: null,
                                          selectedAction: null,
                                          dimensions: [],
                                          metrics: [],
                                        }),
                                        metrics: (prev[metric.table]?.[customInfo.parsed.attributeId]?.metrics ?? []).map((entry) =>
                                          entry.id === customInfo.parsed.entryId
                                            ? {
                                              ...entry,
                                              label: nextLabel,
                                              name: nextLabel,
                                              unique: editMetData.unique,
                                              formula: editMetData.formula,
                                              alias: nextAlias,
                                            }
                                            : entry
                                        ),
                                      },
                                    },
                                  }));
                                  setEditingMetId(null);
                                }}
                                title="Enregistrer"
                                disabled={!canSave || !customInfo}
                              >
                                {Icons.save}
                              </button>
                              <button
                                type="button"
                                className={styles.definitionActionBtn}
                                onClick={() => {
                                  setEditingMetId(null);
                                  setEditMetData({ label: '', formula: '', unique: false });
                                }}
                                title="Annuler"
                              >
                                {Icons.close}
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                className={`${styles.definitionActionBtn} ${!isEditable ? styles.definitionActionBtnDisabled : ''}`}
                                onClick={() => {
                                  if (!customInfo) return;
                                  setEditingMetId(metric.id);
                                  setEditMetData({
                                    label: customInfo.entry.label,
                                    formula: customInfo.entry.formula,
                                    unique: customInfo.entry.unique,
                                  });
                                }}
                                title={customInfo ? 'Modifier' : 'Non modifiable'}
                                aria-disabled={!isEditable}
                              >
                                {Icons.edit}
                              </button>
                              <button
                                type="button"
                                className={`${styles.definitionActionBtn} ${styles.definitionActionBtnDanger} ${!isEditable ? styles.definitionActionBtnDisabled : ''}`}
                                onClick={() => {
                                  if (!customInfo) return;
                                  setDefinitionSelections((prev) => ({
                                    ...prev,
                                    [metric.table]: {
                                      ...prev[metric.table],
                                      [customInfo.parsed.attributeId]: {
                                        ...(prev[metric.table]?.[customInfo.parsed.attributeId] ?? {
                                          attributeLabel: null,
                                          selectedAction: null,
                                          dimensions: [],
                                          metrics: [],
                                        }),
                                        metrics: (prev[metric.table]?.[customInfo.parsed.attributeId]?.metrics ?? []).filter(
                                          (entry) => entry.id !== customInfo.parsed.entryId
                                        ),
                                      },
                                    },
                                  }));
                                  if (editingMetId === metric.id) {
                                    setEditingMetId(null);
                                    setEditMetData({ label: '', formula: '', unique: false });
                                  }
                                }}
                                title={customInfo ? 'Supprimer' : 'Non modifiable'}
                                aria-disabled={!isEditable}
                              >
                                {Icons.trash}
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default SqlBuilder;
