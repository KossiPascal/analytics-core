import React, { useMemo } from 'react';
import {
  Activity,
  AreaChart,
  BarChart3,
  Gauge,
  Grid3x3,
  Layers,
  LineChart,
  PieChart,
  Table,
  Target,
} from 'lucide-react';

import { Modal } from '@components/ui/Modal/Modal';
import type { ChartTypeOption, ChartVariant, VisualizationOptions } from '../../ChartDataBuilder/components/types';
import styles from './ChartTypePickerModal.module.css';

interface ChartTypePickerModalProps {
  isOpen: boolean;
  selectedChartType: ChartVariant;
  options: VisualizationOptions;
  onClose: () => void;
  onSelectChartType: (type: ChartVariant) => void;
}

const CHART_TYPES: ChartTypeOption[] = [
  { id: 'bar', name: 'Barres', icon: <BarChart3 size={20} />, description: 'Comparaison simple', category: 'comparison' },
  { id: 'stacked-bar', name: 'Barres empilees', icon: <Layers size={20} />, description: 'Comparaison cumulee', category: 'comparison' },
  { id: 'line', name: 'Ligne', icon: <LineChart size={20} />, description: 'Evolution dans le temps', category: 'trend' },
  { id: 'area', name: 'Zone', icon: <AreaChart size={20} />, description: 'Courbe avec remplissage', category: 'trend' },
  { id: 'stacked-area', name: 'Zone empilee', icon: <Layers size={20} />, description: 'Series empilees', category: 'trend' },
  { id: 'pie', name: 'Camembert', icon: <PieChart size={20} />, description: 'Repartition', category: 'composition' },
  { id: 'donut', name: 'Anneau', icon: <Target size={20} />, description: 'Repartition avec centre vide', category: 'composition' },
  { id: 'radar', name: 'Radar', icon: <Activity size={20} />, description: 'Comparaison multidimensionnelle', category: 'comparison' },
  { id: 'gauge', name: 'Jauge', icon: <Gauge size={20} />, description: 'Suivi de progression', category: 'other' },
  { id: 'heatmap', name: 'Heatmap', icon: <Grid3x3 size={20} />, description: 'Intensite par cellule', category: 'distribution' },
  { id: 'kpi', name: 'KPI', icon: <Target size={20} />, description: 'Valeur cle', category: 'other' },
  { id: 'table', name: 'Tableau', icon: <Table size={20} />, description: 'Donnees tabulaires', category: 'other' },
];

const BAR_DATA = [42, 68, 51, 79];
const LINE_POINTS = '8,90 48,60 88,72 128,36 168,52';
const AREA_POINTS = '8,90 48,60 88,72 128,36 168,52 168,108 8,108';
const STACKED_ONE = [28, 40, 36, 52];
const STACKED_TWO = [16, 28, 22, 27];
const HEATMAP_VALUES = [0.25, 0.55, 0.8, 0.4, 0.72, 0.18, 0.9, 0.62, 0.33];
const RADAR_POLYGON = '88,18 148,52 130,120 46,120 28,52';

function polarToCartesian(cx: number, cy: number, r: number, angle: number) {
  const rad = (angle - 90) * (Math.PI / 180);
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeArc(cx: number, cy: number, r: number, start: number, end: number) {
  const startPoint = polarToCartesian(cx, cy, r, end);
  const endPoint = polarToCartesian(cx, cy, r, start);
  const largeArcFlag = end - start <= 180 ? '0' : '1';
  return `M ${startPoint.x} ${startPoint.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${endPoint.x} ${endPoint.y}`;
}

const ChartThumbnail: React.FC<{ chartType: ChartVariant; colors: string[] }> = ({ chartType, colors }) => {
  const palette = colors.length > 0 ? colors : ['#2563eb', '#16a34a', '#f59e0b', '#dc2626'];

  if (chartType === 'kpi') {
    return (
      <div className={styles.kpiThumb}>
        <span className={styles.kpiLabel}>Patients</span>
        <span className={styles.kpiValue} style={{ color: palette[0] }}>128</span>
        <span className={styles.kpiDelta}>+12%</span>
      </div>
    );
  }

  if (chartType === 'table') {
    return (
      <div className={styles.tableThumb}>
        <div className={styles.tableRowHeader}>
          <span>Zone</span>
          <span>Val.</span>
        </div>
        {['Nord', 'Sud', 'Centre'].map((label, index) => (
          <div key={label} className={styles.tableRow}>
            <span>{label}</span>
            <span style={{ color: palette[index] }}>{[42, 58, 35][index]}</span>
          </div>
        ))}
      </div>
    );
  }

  if (chartType === 'heatmap') {
    return (
      <div className={styles.heatmapThumb}>
        {HEATMAP_VALUES.map((value, index) => (
          <span
            key={index}
            className={styles.heatCell}
            style={{
              backgroundColor: palette[index % palette.length],
              opacity: 0.18 + value * 0.82,
            }}
          />
        ))}
      </div>
    );
  }

  if (chartType === 'gauge') {
    return (
      <svg viewBox="0 0 180 120" className={styles.svgThumb} aria-hidden="true">
        <path d={describeArc(90, 96, 54, 180, 360)} stroke="#e2e8f0" strokeWidth="16" fill="none" strokeLinecap="round" />
        <path d={describeArc(90, 96, 54, 180, 312)} stroke={palette[0]} strokeWidth="16" fill="none" strokeLinecap="round" />
        <text x="90" y="82" textAnchor="middle" className={styles.svgBigText}>72%</text>
      </svg>
    );
  }

  if (chartType === 'pie' || chartType === 'donut') {
    const donut = chartType === 'donut';
    return (
      <svg viewBox="0 0 180 120" className={styles.svgThumb} aria-hidden="true">
        <circle cx="90" cy="60" r="34" fill="none" stroke={palette[0]} strokeWidth={donut ? 18 : 68} strokeDasharray="84 130" strokeLinecap="butt" transform="rotate(-90 90 60)" />
        <circle cx="90" cy="60" r="34" fill="none" stroke={palette[1]} strokeWidth={donut ? 18 : 68} strokeDasharray="48 166" strokeDashoffset="-86" strokeLinecap="butt" transform="rotate(-90 90 60)" />
        <circle cx="90" cy="60" r="34" fill="none" stroke={palette[2]} strokeWidth={donut ? 18 : 68} strokeDasharray="34 180" strokeDashoffset="-136" strokeLinecap="butt" transform="rotate(-90 90 60)" />
        {donut && <circle cx="90" cy="60" r="20" fill="#fff" />}
      </svg>
    );
  }

  if (chartType === 'radar') {
    return (
      <svg viewBox="0 0 180 140" className={styles.svgThumb} aria-hidden="true">
        <polygon points="88,30 136,56 122,112 54,112 40,56" fill="none" stroke="#cbd5e1" strokeWidth="1" />
        <polygon points="88,18 148,52 130,120 46,120 28,52" fill="none" stroke="#e2e8f0" strokeWidth="1" />
        <polygon points={RADAR_POLYGON} fill={palette[0]} opacity="0.28" stroke={palette[0]} strokeWidth="2" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 180 120" className={styles.svgThumb} aria-hidden="true">
      <line x1="14" y1="108" x2="168" y2="108" className={styles.axis} />
      <line x1="14" y1="12" x2="14" y2="108" className={styles.axis} />

      {(chartType === 'bar' || chartType === 'stacked-bar') && (
        <>
          {BAR_DATA.map((value, index) => {
            const x = 28 + index * 34;
            const second = chartType === 'stacked-bar' ? STACKED_TWO[index] : 0;
            return (
              <g key={index}>
                <rect x={x} y={108 - value} width="18" height={value} rx="4" fill={palette[0]} opacity="0.95" />
                {chartType === 'stacked-bar' && (
                  <rect x={x} y={108 - value - second} width="18" height={second} rx="4" fill={palette[1]} opacity="0.9" />
                )}
              </g>
            );
          })}
        </>
      )}

      {(chartType === 'line' || chartType === 'area' || chartType === 'stacked-area') && (
        <>
          {(chartType === 'area' || chartType === 'stacked-area') && (
            <polygon points={AREA_POINTS} fill={palette[0]} opacity="0.22" />
          )}
          {chartType === 'stacked-area' && (
            <polygon points="8,74 48,52 88,58 128,30 168,44 168,108 8,108" fill={palette[1]} opacity="0.22" />
          )}
          <polyline points={LINE_POINTS} fill="none" stroke={palette[0]} strokeWidth="4" strokeLinejoin="round" strokeLinecap="round" />
          {chartType === 'stacked-area' && (
            <polyline points="8,74 48,52 88,58 128,30 168,44" fill="none" stroke={palette[1]} strokeWidth="4" strokeLinejoin="round" strokeLinecap="round" />
          )}
        </>
      )}
    </svg>
  );
};

export const ChartTypePickerModal: React.FC<ChartTypePickerModalProps> = ({
  isOpen,
  selectedChartType,
  options,
  onClose,
  onSelectChartType,
}) => {
  const previewColors = useMemo(
    () => options.colors ?? ['#2563eb', '#16a34a', '#f59e0b', '#dc2626'],
    [options.colors],
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Choisir un graphique" size="full" closeOnBackdrop>
      <div className={styles.grid}>
        {CHART_TYPES.map((chart) => (
          <div
            key={chart.id}
            role="button"
            tabIndex={0}
            className={`${styles.card} ${selectedChartType === chart.id ? styles.cardActive : ''}`}
            onClick={() => {
              onSelectChartType(chart.id);
              onClose();
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onSelectChartType(chart.id);
                onClose();
              }
            }}
          >
            <div className={styles.cardHeader}>
              <div className={styles.cardTitle}>
                {chart.icon}
                <span>{chart.name}</span>
              </div>
              <span className={styles.cardDescription}>{chart.description}</span>
            </div>

            <div className={styles.preview}>
              <ChartThumbnail chartType={chart.id} colors={previewColors} />
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
};
