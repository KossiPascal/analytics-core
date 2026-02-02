/**
 * VisualizationCard - Component to display a saved visualization with its chart
 */

import { motion } from 'framer-motion';
import { MoreVertical, Trash2, Edit, Download, Maximize2 } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { Card, CardBody, CardHeader } from '@components/ui';
import { Chart } from '@components/charts';
import type { VisualizationWithData, ChartVariant } from '@/contexts/OLD/useVisualizations';
import type { ChartType } from '@components/charts';
import styles from './VisualizationCard.module.css';

export interface VisualizationCardProps {
  visualization: VisualizationWithData;
  onDelete?: (id: string) => void;
  onEdit?: (id: string) => void;
  onExpand?: (visualization: VisualizationWithData) => void;
  className?: string;
}

// Map ChartVariant to ChartType
const mapChartType = (variant: ChartVariant): ChartType => {
  const mapping: Record<ChartVariant, ChartType> = {
    line: 'line',
    area: 'area',
    bar: 'bar',
    pie: 'pie',
    donut: 'donut',
    radar: 'radar',
    radialBar: 'radialBar',
    scatter: 'scatter',
    composed: 'composed',
    treemap: 'treemap',
    funnel: 'funnel',
    table: 'bar', // fallback for table
  };
  return mapping[variant] || 'bar';
};

// Check if chart type needs dataKey instead of series
const needsDataKey = (chartType: ChartVariant): boolean => {
  return ['pie', 'donut', 'radialBar', 'treemap', 'funnel'].includes(chartType);
};

export function VisualizationCard({
  visualization,
  onDelete,
  onEdit,
  onExpand,
  className,
}: VisualizationCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen]);

  const handleDelete = () => {
    setMenuOpen(false);
    onDelete?.(visualization.id);
  };

  const handleEdit = () => {
    setMenuOpen(false);
    onEdit?.(visualization.id);
  };

  const handleExpand = () => {
    setMenuOpen(false);
    onExpand?.(visualization);
  };

  const chartType = mapChartType(visualization.chartType);
  const usesDataKey = needsDataKey(visualization.chartType);

  return (
    <motion.div
      className={`${styles.wrapper} ${className || ''}`}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      <Card className={styles.card}>
        <CardHeader className={styles.header}>
          <div className={styles.titleSection}>
            <h3 className={styles.title}>{visualization.name}</h3>
            {visualization.description && (
              <p className={styles.description}>{visualization.description}</p>
            )}
          </div>

          <div className={styles.actions} ref={menuRef}>
            <button
              type="button"
              className={styles.menuButton}
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Actions"
            >
              <MoreVertical size={18} />
            </button>

            {menuOpen && (
              <motion.div
                className={styles.menu}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                {onExpand && (
                  <button type="button" className={styles.menuItem} onClick={handleExpand}>
                    <Maximize2 size={16} />
                    <span>Agrandir</span>
                  </button>
                )}
                {onEdit && (
                  <button type="button" className={styles.menuItem} onClick={handleEdit}>
                    <Edit size={16} />
                    <span>Modifier</span>
                  </button>
                )}
                <button type="button" className={styles.menuItem}>
                  <Download size={16} />
                  <span>Exporter</span>
                </button>
                {onDelete && (
                  <>
                    <div className={styles.menuDivider} />
                    <button
                      type="button"
                      className={`${styles.menuItem} ${styles.menuItemDanger}`}
                      onClick={handleDelete}
                    >
                      <Trash2 size={16} />
                      <span>Supprimer</span>
                    </button>
                  </>
                )}
              </motion.div>
            )}
          </div>
        </CardHeader>

        <CardBody className={styles.body}>
          <div className={styles.chartContainer}>
            <Chart
              type={chartType}
              data={visualization.data}
              series={usesDataKey ? undefined : visualization.series}
              dataKey={usesDataKey ? 'value' : undefined}
              nameKey={usesDataKey ? 'name' : undefined}
              height={280}
              xAxis={{ dataKey: 'name' }}
              tooltip={{ enabled: true }}
              legend={{ enabled: visualization.options.showLegend }}
              grid={{ enabled: visualization.options.showGrid }}
              animation={{ enabled: visualization.options.animation }}
              colors={visualization.options.colors}
            />
          </div>
        </CardBody>
      </Card>
    </motion.div>
  );
}
