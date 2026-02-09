import React from 'react';
import { Eye, Filter, Grid3x3, RefreshCw, Save, Settings, Trash2 } from 'lucide-react';

import { FormCheckbox } from '@/components/forms/FormCheckbox/FormCheckbox';
import { FormInput } from '@/components/forms/FormInput/FormInput';

import baseStyles from '@pages/builders/DashboardBuilder/DashboardBuilder.module.css';
import styles from './BuilderMainArea.module.css';
import { LayoutDropZone } from './LayoutDropZone';
import { RenderChartPreview } from './RenderChartPreview';
import type { ChartVariant, DimensionItem, VisualizationOptions } from './types';

interface BuilderMainAreaProps {
  allItems: DimensionItem[];
  columnItems: string[];
  rowItems: string[];
  filterItems: string[];
  onRemoveColumnItem: (id: string) => void;
  onRemoveRowItem: (id: string) => void;
  onRemoveFilterItem: (id: string) => void;
  options: VisualizationOptions;
  previewOptions: VisualizationOptions;
  onOptionsChange: (next: VisualizationOptions) => void;
  previewChartType: ChartVariant;
  previewData: any[];
  previewSeries: any[];
  isPreviewStale: boolean;
  onRefreshPreview: () => void;
  onSave: () => void;
  onReset: () => void;
}

export const BuilderMainArea: React.FC<BuilderMainAreaProps> = ({
  allItems,
  columnItems,
  rowItems,
  filterItems,
  onRemoveColumnItem,
  onRemoveRowItem,
  onRemoveFilterItem,
  options,
  previewOptions,
  onOptionsChange,
  previewChartType,
  previewData,
  previewSeries,
  isPreviewStale,
  onRefreshPreview,
  onSave,
  onReset,
}) => {
  return (
    <div className={styles.mainArea}>
      <div className={styles.section}>
        <div className={styles.sectionTitle}>
          <Grid3x3 size={18} />
          Configuration de la mise en page
        </div>
        <div className={styles.layoutSection}>
          <LayoutDropZone
            title="Colonnes"
            items={columnItems}
            allItems={allItems}
            onRemove={onRemoveColumnItem}
            placeholder="Colonnes"
          />
          <LayoutDropZone
            title="Lignes"
            items={rowItems}
            allItems={allItems}
            onRemove={onRemoveRowItem}
            placeholder="Lignes"
          />
          <LayoutDropZone
            title="Filtres"
            items={filterItems}
            allItems={allItems}
            onRemove={onRemoveFilterItem}
            placeholder="Filtres"
          />
        </div>

        <div className={`${baseStyles.alert} ${baseStyles.alertInfo}`} style={{ margin: '0 1rem 1rem' }}>
          <Filter size={18} />
          <div>
            <strong>Astuce :</strong> Sélectionnez des éléments dans les dimensions ci-dessus, puis réorganisez-les
            dans les zones Colonnes, Lignes et Filtres pour personnaliser l'affichage de vos données.
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>
          <Settings size={18} />
          Options d'affichage
        </div>

        <div className={styles.optionsPanel}>
          <div className={styles.optionRow}>
            <FormInput
              label="Titre"
              value={options.title || ''}
              onChange={(event) => onOptionsChange({ ...options, title: event.target.value })}
              placeholder="Titre du graphique"
            />
          </div>

          <div className={styles.optionRow}>
            <FormInput
              label="Sous-titre"
              value={options.subtitle || ''}
              onChange={(event) => onOptionsChange({ ...options, subtitle: event.target.value })}
              placeholder="Sous-titre du graphique"
            />
          </div>

          <div className={styles.optionRow}>
            <FormCheckbox
              label="Afficher la légende"
              checked={options.showLegend}
              onChange={(event) => onOptionsChange({ ...options, showLegend: event.target.checked })}
            />
            <FormCheckbox
              label="Afficher l'infobulle"
              checked={options.showTooltip}
              onChange={(event) => onOptionsChange({ ...options, showTooltip: event.target.checked })}
            />
            <FormCheckbox
              label="Afficher la grille"
              checked={options.showGrid}
              onChange={(event) => onOptionsChange({ ...options, showGrid: event.target.checked })}
            />
            <FormCheckbox
              label="Empilé"
              checked={options.stacked}
              onChange={(event) => onOptionsChange({ ...options, stacked: event.target.checked })}
            />
            <FormCheckbox
              label="Animation"
              checked={options.animation}
              onChange={(event) => onOptionsChange({ ...options, animation: event.target.checked })}
            />
          </div>
        </div>
      </div>

      <div className={styles.previewSection}>
        <div className={styles.previewHeader}>
          <h3>
            <Eye size={18} />
            Aperçu
          </h3>
          <button
            type="button"
            className={`${baseStyles.btn} ${baseStyles.btnOutline} ${baseStyles.btnSmall} ${isPreviewStale ? styles.refreshButtonPending : ''}`}
            onClick={onRefreshPreview}
          >
            <RefreshCw size={16} className={isPreviewStale ? styles.refreshIconSpin : ''} />
            {isPreviewStale ? 'Actualiser (requis)' : 'Actualiser'}
          </button>
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
          <button type="button" className={`${baseStyles.btn} ${baseStyles.btnPrimary}`} onClick={onSave}>
            <Save size={18} />
            Sauvegarder
          </button>
          <button type="button" className={`${baseStyles.btn} ${baseStyles.btnOutline}`} onClick={onReset}>
            <Trash2 size={18} />
            Réinitialiser
          </button>
        </div>
      </div>
    </div>
  );
};
