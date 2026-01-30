import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { RecoPerformanceDashboardUtils } from '@/types/dashboard.types';
import styles from './PerformanceChartModal.module.css';

interface PerformanceChartModalProps {
  isOpen: boolean;
  onClose: () => void;
  recoName: string;
  chartData?: RecoPerformanceDashboardUtils;
}

export function PerformanceChartModal({
  isOpen,
  onClose,
  recoName,
  chartData,
}: PerformanceChartModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Transform chart data for Recharts
  const transformedData = chartData?.absisseLabels?.map((label, index) => {
    const dataPoint: Record<string, string | number> = { name: String(label) };
    chartData.datasets?.forEach((dataset) => {
      dataPoint[dataset.label] = dataset.data[index] || 0;
    });
    return dataPoint;
  }) || [];

  const colors = [
    '#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6',
    '#06b6d4', '#ec4899', '#84cc16', '#f97316', '#6366f1',
  ];

  return (
    <div className={styles.overlay}>
      <div className={styles.modal} ref={modalRef}>
        <div className={styles.header}>
          <h2 className={styles.title}>
            {chartData?.title || `Performances de ${recoName}`}
          </h2>
          <button className={styles.closeButton} onClick={onClose} aria-label="Fermer">
            <X size={24} />
          </button>
        </div>

        <div className={styles.content}>
          {chartData && transformedData.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <LineChart
                data={transformedData}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  axisLine={{ stroke: '#cbd5e1' }}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  axisLine={{ stroke: '#cbd5e1' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  }}
                />
                <Legend
                  wrapperStyle={{ paddingTop: '20px' }}
                />
                {chartData.datasets?.map((dataset, index) => (
                  <Line
                    key={dataset.label}
                    type="monotone"
                    dataKey={dataset.label}
                    stroke={dataset.borderColor as string || colors[index % colors.length]}
                    strokeWidth={2}
                    dot={{ fill: dataset.borderColor as string || colors[index % colors.length], strokeWidth: 2 }}
                    activeDot={{ r: 6 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className={styles.noData}>
              <p>Aucune donnée de graphique disponible pour ce RECO</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
