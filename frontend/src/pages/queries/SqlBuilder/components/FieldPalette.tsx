/**
 * FieldPalette Component
 * Sidebar avec les champs disponibles (dimensions et métriques)
 */

import React, { useState, useMemo } from 'react';
import type { DimensionDef, MetricDef } from '../models';
import DraggableField from './DraggableField';
import styles from '@pages/queries/SqlBuilder/SqlBuilder.module.css';

// ============================================================================
// TYPES
// ============================================================================

interface TableDef {
  id: string;
  label: string;
  type?: string;
}

interface FieldPaletteProps {
  dimensions: DimensionDef[];
  metrics: MetricDef[];
  customMetrics?: MetricDef[];
  onFieldClick: (field: DimensionDef | MetricDef, type: 'dimension' | 'metric') => void;
  selectedSource?: TableDef | null;
  onClearSelection?: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const FieldPalette: React.FC<FieldPaletteProps> = ({
  dimensions,
  metrics,
  customMetrics = [],
  onFieldClick,
  selectedSource,
  onClearSelection,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [dimensionsOpen, setDimensionsOpen] = useState(true);
  const [metricsOpen, setMetricsOpen] = useState(true);
  const [customMetricsOpen, setCustomMetricsOpen] = useState(true);

  // Filter fields based on search
  const filteredDimensions = useMemo(() => {
    if (!searchTerm) return dimensions;
    const term = searchTerm.toLowerCase();
    return dimensions.filter(
      (d) =>
        d.label.toLowerCase().includes(term) ||
        d.id.toLowerCase().includes(term) ||
        d.table.toLowerCase().includes(term)
    );
  }, [dimensions, searchTerm]);

  const filteredMetrics = useMemo(() => {
    if (!searchTerm) return metrics;
    const term = searchTerm.toLowerCase();
    return metrics.filter(
      (m) =>
        m.label.toLowerCase().includes(term) ||
        m.id.toLowerCase().includes(term) ||
        m.table.toLowerCase().includes(term)
    );
  }, [metrics, searchTerm]);

  const filteredCustomMetrics = useMemo(() => {
    if (!searchTerm) return customMetrics;
    const term = searchTerm.toLowerCase();
    return customMetrics.filter(
      (m) =>
        m.label.toLowerCase().includes(term) ||
        m.id.toLowerCase().includes(term) ||
        m.table.toLowerCase().includes(term)
    );
  }, [customMetrics, searchTerm]);

  // Group dimensions by table
  const dimensionsByTable = useMemo(() => {
    const grouped: Record<string, DimensionDef[]> = {};
    filteredDimensions.forEach((d) => {
      if (!grouped[d.table]) {
        grouped[d.table] = [];
      }
      grouped[d.table].push(d);
    });
    return grouped;
  }, [filteredDimensions]);

  // Group metrics by table
  const metricsByTable = useMemo(() => {
    const grouped: Record<string, MetricDef[]> = {};
    filteredMetrics.forEach((m) => {
      if (!grouped[m.table]) {
        grouped[m.table] = [];
      }
      grouped[m.table].push(m);
    });
    return grouped;
  }, [filteredMetrics]);

  return (
    <div className={styles.sidebar}>
      {/* Selected Source Header */}
      {selectedSource && (
        <div className={styles.selectedSourceHeader}>
          <div className={styles.selectedSourceInfo}>
            <div className={styles.selectedSourceIcon}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="2" y="2" width="12" height="12" rx="2" />
                <line x1="2" y1="6" x2="14" y2="6" />
                <line x1="6" y1="6" x2="6" y2="14" />
              </svg>
            </div>
            <div className={styles.selectedSourceText}>
              <span className={styles.selectedSourceLabel}>{selectedSource.label}</span>
              <span className={styles.selectedSourceType}>
                {selectedSource.type === 'view' ? 'Vue' : selectedSource.type === 'materialized_view' ? 'Vue mat.' : 'Table'}
              </span>
            </div>
          </div>
          {onClearSelection && (
            <button
              type="button"
              className={styles.selectedSourceClear}
              onClick={onClearSelection}
              title="Afficher tous les champs"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10.5 3.5L3.5 10.5M3.5 3.5L10.5 10.5" strokeLinecap="round" />
              </svg>
            </button>
          )}
        </div>
      )}

      {/* Search */}
      <div className={styles.sidebarHeader}>
        <div className={styles.searchBox}>
          <svg
            className={styles.searchIcon}
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="6" cy="6" r="4" />
            <path d="M9 9L13 13" />
          </svg>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Rechercher un champ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Fields */}
      <div className={styles.sidebarContent}>
        {/* Dimensions */}
        <div className={styles.fieldGroup}>
          <div
            className={styles.fieldGroupHeader}
            onClick={() => setDimensionsOpen(!dimensionsOpen)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setDimensionsOpen(!dimensionsOpen);
              }
            }}
          >
            <div className={styles.fieldGroupTitle}>
              <div className={`${styles.fieldGroupIcon} ${styles.fieldGroupIconDimension}`}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                  <rect x="1" y="1" width="4" height="4" rx="1" />
                  <rect x="7" y="1" width="4" height="4" rx="1" />
                  <rect x="1" y="7" width="4" height="4" rx="1" />
                  <rect x="7" y="7" width="4" height="4" rx="1" />
                </svg>
              </div>
              <span>Dimensions ({filteredDimensions.length})</span>
            </div>
            <svg
              className={`${styles.fieldGroupChevron} ${dimensionsOpen ? styles.fieldGroupChevronOpen : ''}`}
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M3 4.5L6 7.5L9 4.5" />
            </svg>
          </div>
          <div
            className={`${styles.fieldGroupContent} ${
              dimensionsOpen ? styles.fieldGroupContentVisible : styles.fieldGroupContentHidden
            }`}
          >
            <div className={styles.fieldList}>
              {filteredDimensions.map((dimension) => (
                <DraggableField
                  key={dimension.id}
                  field={dimension}
                  type="dimension"
                  onClick={onFieldClick}
                />
              ))}
              {filteredDimensions.length === 0 && (
                <div style={{ padding: '12px', textAlign: 'center', color: 'var(--qb-text-muted)', fontSize: '0.8125rem' }}>
                  Aucune dimension trouvée
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Metrics */}
        <div className={styles.fieldGroup}>
          <div
            className={styles.fieldGroupHeader}
            onClick={() => setMetricsOpen(!metricsOpen)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setMetricsOpen(!metricsOpen);
              }
            }}
          >
            <div className={styles.fieldGroupTitle}>
              <div className={`${styles.fieldGroupIcon} ${styles.fieldGroupIconMetric}`}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M1 9L4 5L7 7L11 2" />
                  <circle cx="11" cy="2" r="1" fill="currentColor" />
                </svg>
              </div>
              <span>Métriques ({filteredMetrics.length})</span>
            </div>
            <svg
              className={`${styles.fieldGroupChevron} ${metricsOpen ? styles.fieldGroupChevronOpen : ''}`}
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M3 4.5L6 7.5L9 4.5" />
            </svg>
          </div>
          <div
            className={`${styles.fieldGroupContent} ${
              metricsOpen ? styles.fieldGroupContentVisible : styles.fieldGroupContentHidden
            }`}
          >
            <div className={styles.fieldList}>
              {filteredMetrics.map((metric) => (
                <DraggableField
                  key={metric.id}
                  field={metric}
                  type="metric"
                  onClick={onFieldClick}
                />
              ))}
              {filteredMetrics.length === 0 && (
                <div style={{ padding: '12px', textAlign: 'center', color: 'var(--qb-text-muted)', fontSize: '0.8125rem' }}>
                  Aucune métrique trouvée
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mes Métriques (Custom) */}
        {customMetrics.length > 0 && (
          <div className={styles.fieldGroup}>
            <div
              className={styles.fieldGroupHeader}
              onClick={() => setCustomMetricsOpen(!customMetricsOpen)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setCustomMetricsOpen(!customMetricsOpen);
                }
              }}
            >
              <div className={styles.fieldGroupTitle}>
                <div className={`${styles.fieldGroupIcon}`} style={{ background: '#fef3c7', color: '#d97706' }}>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="6" cy="6" r="4" />
                    <path d="M6 4V6L7.5 7.5" />
                  </svg>
                </div>
                <span>Mes métriques ({filteredCustomMetrics.length})</span>
              </div>
              <svg
                className={`${styles.fieldGroupChevron} ${customMetricsOpen ? styles.fieldGroupChevronOpen : ''}`}
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M3 4.5L6 7.5L9 4.5" />
              </svg>
            </div>
            <div
              className={`${styles.fieldGroupContent} ${
                customMetricsOpen ? styles.fieldGroupContentVisible : styles.fieldGroupContentHidden
              }`}
            >
              <div className={styles.fieldList}>
                {filteredCustomMetrics.map((metric) => (
                  <DraggableField
                    key={`custom-${metric.id}`}
                    field={metric}
                    type="metric"
                    onClick={onFieldClick}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FieldPalette;
