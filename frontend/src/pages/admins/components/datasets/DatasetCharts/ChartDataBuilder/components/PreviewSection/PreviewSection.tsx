import React, { useCallback, useMemo, useState } from 'react';
import { Eye, FolderOpen, LayoutGrid, Palette, Settings, Tags } from 'lucide-react';
import { TransposeButton } from '@components/charts/TransposeButton/TransposeButton';
import { transposeChartData } from '@components/charts/transpose';
import { RenderChartPreview } from '../RenderChartPreview/RenderChartPreview';
import type { ChartVariant, VisualizationOptions } from '../types';
import styles from './PreviewSection.module.css';

interface PreviewSectionProps {
  previewChartType: ChartVariant;
  previewOptions: VisualizationOptions;
  previewData: any[];
  previewSeries: any[];
  isEditing: boolean;
  isExecuting?: boolean;
  executeError?: string | null;
  onSave: () => void;
  onOpenTheme: () => void;
  onOpenSaved: () => void;
  onOpenOptions: () => void;
  onOpenRenames: () => void;
  onOpenStructure: () => void;
}

interface PreviewErrorBoundaryProps {
  children: React.ReactNode;
}

interface PreviewErrorBoundaryState {
  hasError: boolean;
}

class PreviewErrorBoundary extends React.Component<PreviewErrorBoundaryProps, PreviewErrorBoundaryState> {
  state: PreviewErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): PreviewErrorBoundaryState {
    return { hasError: true };
  }

  componentDidUpdate(prevProps: PreviewErrorBoundaryProps) {
    if (this.state.hasError && prevProps.children !== this.props.children) {
      this.setState({ hasError: false });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className={styles.previewFallback}>
          <div className={styles.previewFallbackTitle}>Aperçu indisponible</div>
          <div className={styles.previewFallbackText}>
            La configuration actuelle ne peut pas etre rendue dans l&apos;aperçu.
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export const PreviewSection: React.FC<PreviewSectionProps> = ({
  previewChartType,
  previewOptions,
  previewData,
  previewSeries,
  isEditing,
  isExecuting = false,
  executeError = null,
  onSave,
  onOpenTheme,
  onOpenSaved,
  onOpenOptions,
  onOpenRenames,
  onOpenStructure,
}) => {
  const activeColors = previewOptions.colors;
  const [isTransposed, setIsTransposed] = useState(false);

  const handleToggleTranspose = useCallback(() => {
    setIsTransposed(prev => !prev);
  }, []);

  const { data: displayData, series: displaySeries } = useMemo(() => {
    if (!isTransposed) return { data: previewData, series: previewSeries };
    if (['line', 'area', 'bar', 'stacked-bar', 'stacked-area', 'radar'].includes(previewChartType)) {
      return transposeChartData(previewData, previewSeries, previewChartType === 'radar' ? 'subject' : 'name');
    }
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
          <button type="button" className={styles.headerBtn} onClick={onOpenStructure} title="Structure du graphique" >
            <LayoutGrid size={16} />
            Structure
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
          <button type="button" className={styles.headerBtn} onClick={onOpenRenames} title="Éditer les renommages" >
            <Tags size={16} />
            Renommages
          </button>
          <button type="button" className={styles.headerBtn} onClick={onOpenSaved} title="Ouvrir une visualisation" >
            <FolderOpen size={16} />
            Ouvrir
          </button>
        </div>
      </div>

      <div className={styles.previewContent}>
        {isExecuting ? (
          <div className={styles.previewState}>
            <div className={styles.spinner} />
            <span>Exécution en cours…</span>
          </div>
        ) : executeError ? (
          <div className={styles.previewStateError}>
            <span>⚠ {executeError}</span>
          </div>
        ) : previewData.length === 0 ? (
          <div className={styles.previewState}>
            <span>Cliquez sur <strong>Exécuter</strong> pour afficher les données.</span>
          </div>
        ) : (
          <PreviewErrorBoundary>
            <RenderChartPreview
              chartType={previewChartType}
              previewData={displayData}
              previewSeries={displaySeries}
              options={previewOptions}
              isTransposed={isTransposed}
            />
          </PreviewErrorBoundary>
        )}
      </div>
    </div>
  );
};
