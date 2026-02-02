/**
 * SqlBuilder Component
 * Composant principal du Query Builder
 */

import React, { useCallback, useMemo, useState } from 'react';
import type { AnalyticsModel, SqlBuilderProps, DimensionDef, MetricDef, JoinType, OrderDirection } from '../models';
import { useSqlBuilder } from '@contexts/OLD/useSqlBuilder';
import { ALLOWED_JOIN_TYPES, JOIN_TYPE_LABELS, DEFAULT_LIMIT } from '../models';
import FieldPalette from './FieldPalette';
import CollapsibleSection from './CollapsibleSection';
import DropZone from './DropZone';
import SelectedField from './SelectedField';
import FilterBuilder from './FilterBuilder';
import JSONPreview from './JSONPreview';
import styles from '@pages/query-builder/SqlBuilder/SqlBuilder.module.css';

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
  } = useSqlBuilder(model, initialQuery);

  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
          dimensions={availableDimensions}
          metrics={availableMetrics}
          onFieldClick={handleFieldClick}
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

            {/* FROM - Table Selection */}
            <CollapsibleSection
              title="Table source (FROM)"
              icon={Icons.table}
              iconClassName={styles.sectionIconFrom}
              defaultOpen={true}
            >
              <div className={styles.tableSelector}>
                {model.tables.map((table) => (
                  <div
                    key={table.id}
                    className={`${styles.tableOption} ${state.from === table.id ? styles.tableOptionSelected : ''}`}
                    onClick={() => !readOnly && setFrom(table.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        !readOnly && setFrom(table.id);
                      }
                    }}
                  >
                    <div className={styles.tableOptionIcon}>
                      {Icons.table}
                    </div>
                    <span className={styles.tableOptionName}>{table.label}</span>
                  </div>
                ))}
              </div>
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
                    onUpdate={(updates) => updateSelect(field.id, updates)}
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
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M10.5 3.5L3.5 10.5M3.5 3.5L10.5 10.5" strokeLinecap="round" />
                          </svg>
                        </button>
                      </div>
                      <div style={{ marginBottom: '8px' }}>
                        <select
                          className={styles.filterSelect}
                          value={join.table}
                          onChange={(e) => !readOnly && updateJoin(join.id, { table: e.target.value })}
                          style={{ width: '100%' }}
                        >
                          <option value="">Sélectionner une table</option>
                          {availableTables.map((t) => (
                            <option key={t.id} value={t.id}>{t.label}</option>
                          ))}
                        </select>
                      </div>
                      <div className={styles.joinCondition}>
                        <select
                          className={styles.filterSelect}
                          value={join.on.left}
                          onChange={(e) => !readOnly && updateJoin(join.id, { on: { ...join.on, left: e.target.value } })}
                        >
                          <option value="">Champ source</option>
                          {allFields.map((f) => (
                            <option key={f.id} value={f.id}>{f.label}</option>
                          ))}
                        </select>
                        <span className={styles.joinConditionEquals}>=</span>
                        <select
                          className={styles.filterSelect}
                          value={join.on.right}
                          onChange={(e) => !readOnly && updateJoin(join.id, { on: { ...join.on, right: e.target.value } })}
                        >
                          <option value="">Champ cible</option>
                          {allFields.map((f) => (
                            <option key={f.id} value={f.id}>{f.label}</option>
                          ))}
                        </select>
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
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                          <path d="M9.5 2.5L2.5 9.5M2.5 2.5L9.5 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
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
                <select
                  className={styles.filterSelect}
                  value=""
                  onChange={(e) => {
                    if (e.target.value && !readOnly) {
                      addGroupBy(e.target.value);
                    }
                  }}
                >
                  <option value="">+ Ajouter un champ</option>
                  {availableDimensions
                    .filter((d) => d.groupable && !state.groupBy.some((g) => g.field === d.id))
                    .map((d) => (
                      <option key={d.id} value={d.id}>{d.label}</option>
                    ))}
                </select>
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
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M10.5 3.5L3.5 10.5M3.5 3.5L10.5 10.5" strokeLinecap="round" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div style={{ marginTop: state.orderBy.length > 0 ? '12px' : 0 }}>
                <select
                  className={styles.filterSelect}
                  value=""
                  onChange={(e) => {
                    if (e.target.value && !readOnly) {
                      addOrderBy(e.target.value);
                    }
                  }}
                >
                  <option value="">+ Ajouter un tri</option>
                  {allFields.map((f) => (
                    <option key={f.id} value={f.id}>{f.label}</option>
                  ))}
                </select>
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
                  <label className={styles.limitLabel}>LIMIT</label>
                  <input
                    type="number"
                    className={styles.limitInput}
                    value={state.limit ?? ''}
                    onChange={(e) => !readOnly && setLimit(e.target.value ? parseInt(e.target.value, 10) : undefined)}
                    min={1}
                    max={100000}
                    placeholder="100"
                  />
                </div>
                <div className={styles.limitField}>
                  <label className={styles.limitLabel}>OFFSET</label>
                  <input
                    type="number"
                    className={styles.limitInput}
                    value={state.offset ?? ''}
                    onChange={(e) => !readOnly && setOffset(e.target.value ? parseInt(e.target.value, 10) : undefined)}
                    min={0}
                    placeholder="0"
                  />
                </div>
              </div>
            </CollapsibleSection>
          </div>
        </div>

        {/* Preview Panel */}
        <JSONPreview json={queryJSON} sql={querySQL} />
      </main>
    </div>
  );
};

export default SqlBuilder;
