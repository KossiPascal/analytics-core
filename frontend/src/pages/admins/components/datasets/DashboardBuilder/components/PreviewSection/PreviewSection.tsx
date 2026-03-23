import React, { useState, useMemo, useCallback } from 'react';
import { Edit3, Eye, FolderOpen, Palette, RefreshCw, Save, Settings } from 'lucide-react';

import { TransposeButton } from '@components/charts/TransposeButton/TransposeButton';
import { transposeChartData } from '@components/charts/transpose';
import { RenderChartPreview } from '../RenderChartPreview/RenderChartPreview';
import type { ChartVariant, VisualizationOptions } from '../types';
import styles from './PreviewSection.module.css';

interface PreviewSectionProps {
  previewChartType: ChartVariant;
  previewData: any[];
  previewSeries: any[];
  previewOptions: VisualizationOptions;
  isPreviewStale: boolean;
  isEditing: boolean;
  onRefreshPreview: () => void;
  onOpenTheme: () => void;
  onOpenOptions: () => void;
  onOpenSaved: () => void;
  onSave: () => void;
}

export const PreviewSection: React.FC<PreviewSectionProps> = ({
  previewChartType,
  previewData,
  previewSeries,
  previewOptions,
  isPreviewStale,
  isEditing,
  onRefreshPreview,
  onOpenTheme,
  onOpenOptions,
  onOpenSaved,
  onSave,
}) => {
  const activeColors = previewOptions.colors;
  const [isTransposed, setIsTransposed] = useState(false);

  const handleToggleTranspose = useCallback(() => {
    setIsTransposed((prev) => !prev);
  }, []);

  // Compute transposed data when toggled
  const { data: displayData, series: displaySeries } = useMemo(() => {
    if (!isTransposed) {
      return { data: previewData, series: previewSeries };
    }

    // For chart types that use series (line, bar, area, radar, scatter, composed)
    const seriesCharts = ['line', 'area', 'bar', 'radar', 'scatter', 'composed'];
    if (seriesCharts.includes(previewChartType)) {
      return transposeChartData(previewData, previewSeries, previewChartType === 'radar' ? 'subject' : 'name');
    }

    // For table: transposition is handled inside RenderChartPreview
    // For pie/donut/treemap/funnel/radialBar: transpose swaps name ↔ value (not very meaningful, pass through)
    return { data: previewData, series: previewSeries };
  }, [isTransposed, previewData, previewSeries, previewChartType]);

  return (
    <div className={styles.previewSection}>
      <div className={styles.previewHeader}>
        <h3>
          <Eye size={18} />
          Aperçu
        </h3>
        <div className={styles.headerActions}>
          <TransposeButton
            isTransposed={isTransposed}
            onToggle={handleToggleTranspose}
          />
          <button
            type="button"
            className={`${styles.headerBtn} ${isPreviewStale ? styles.headerBtnStale : ''}`}
            onClick={onRefreshPreview}
            title="Actualiser l'aperçu"
          >
            <RefreshCw size={16} className={isPreviewStale ? styles.refreshIconSpin : ''} />
            Actualiser
          </button>
          <button
            type="button"
            className={styles.headerBtn}
            onClick={onOpenTheme}
            title="Changer le thème de couleurs"
          >
            <Palette size={16} />
            Thème
            {activeColors && (
              <span className={styles.themeSwatches}>
                {activeColors.slice(0, 4).map((c, i) => (
                  <span key={i} className={styles.themeSwatch} style={{ backgroundColor: c }} />
                ))}
              </span>
            )}
          </button>
          <button
            type="button"
            className={styles.headerBtn}
            onClick={onOpenOptions}
            title="Options d'affichage"
          >
            <Settings size={16} />
            Options
          </button>
          <button
            type="button"
            className={styles.headerBtn}
            onClick={onOpenSaved}
            title="Ouvrir une visualisation"
          >
            <FolderOpen size={16} />
            Ouvrir
          </button>
        </div>
      </div>

      <div className={styles.previewContent}>
        <RenderChartPreview
          chartType={previewChartType}
          previewData={displayData}
          previewSeries={displaySeries}
          options={previewOptions}
          isTransposed={isTransposed}
        />
      </div>

      <div className={styles.actions}>
        <button type="button" className={styles.btnPrimary} onClick={onSave}>
          {isEditing ? <Edit3 size={18} /> : <Save size={18} />}
          {isEditing ? 'Modifier' : 'Enregistrer'}
        </button>
      </div>
    </div>
  );
};
