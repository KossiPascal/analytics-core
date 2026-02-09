import React from 'react';
import { Edit3, Eye, FolderOpen, RefreshCw, Save, Settings } from 'lucide-react';

import { RenderChartPreview } from './RenderChartPreview';
import type { ChartVariant, VisualizationOptions } from './types';
import styles from './PreviewSection.module.css';

interface PreviewSectionProps {
  previewChartType: ChartVariant;
  previewData: any[];
  previewSeries: any[];
  previewOptions: VisualizationOptions;
  isPreviewStale: boolean;
  isEditing: boolean;
  onRefreshPreview: () => void;
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
  onOpenOptions,
  onOpenSaved,
  onSave,
}) => {
  return (
    <div className={styles.previewSection}>
      <div className={styles.previewHeader}>
        <h3>
          <Eye size={18} />
          Aperçu
        </h3>
        <div className={styles.headerActions}>
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
          previewData={previewData}
          previewSeries={previewSeries}
          options={previewOptions}
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
