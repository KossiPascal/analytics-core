import React from 'react';
import { Edit3, Eye, FolderOpen, Palette, RefreshCw, Save, Settings } from 'lucide-react';
import { RenderChartPreview } from '../RenderChartPreview/RenderChartPreview';
import type { ChartVariant, VisualizationOptions } from '../types';
import styles from './PreviewSection.module.css';

interface PreviewSectionProps {
  previewChartType: ChartVariant;
  previewOptions: VisualizationOptions;
  isPreviewStale: boolean;
  isEditing: boolean;
  onSave: () => void;
  onOpenTheme: () => void;
  onOpenSaved: () => void;
  onOpenOptions: () => void;
  onRefreshPreview: () => void;
}


export const PreviewSection: React.FC<PreviewSectionProps> = ({
  previewChartType,
  previewOptions,
  isPreviewStale,
  isEditing,
  onSave,
  onOpenTheme,
  onOpenSaved,
  onOpenOptions,
  onRefreshPreview,
}) => {

  const activeColors = previewOptions.colors;

  return (
    <div className={styles.previewSection}>
      <div className={styles.previewHeader}>
        <h3>
          <Eye size={18} />
          Aperçu
        </h3>
        <div className={styles.headerActions}>
          <button type="button" className={`${styles.headerBtn} ${isPreviewStale ? styles.headerBtnStale : ''}`} onClick={onRefreshPreview} title="Actualiser l'aperçu" >
            <RefreshCw size={16} className={isPreviewStale ? styles.refreshIconSpin : ''} />
            Actualiser
          </button>
          <button type="button" className={styles.headerBtn} onClick={onOpenTheme} title="Changer le thème de couleurs" >
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
          <button type="button" className={styles.headerBtn} onClick={onOpenOptions} title="Options d'affichage" >
            <Settings size={16} />
            Options
          </button>
          <button type="button" className={styles.headerBtn} onClick={onOpenSaved} title="Ouvrir une visualisation" >
            <FolderOpen size={16} />
            Ouvrir
          </button>
        </div>
      </div>

      <div className={styles.previewContent}>
        <RenderChartPreview
          chartType={previewChartType}
          previewData={[]}
          previewSeries={[]}
          options={previewOptions}
          isTransposed={false}
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
