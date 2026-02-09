import { useMemo } from 'react';
import { ChartVariant } from './domain';

export function usePreviewData(chartType: ChartVariant,seriesKeys: string[]) {
  return useMemo(() => {
    if (chartType === 'table') return [];

    return ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun'].map((month) => {
      const row: any = { name: month };
      seriesKeys.forEach((k) => {
        row[k] = Math.floor(Math.random() * 300) + 50;
      });
      return row;
    });
  }, [chartType, seriesKeys]);
}
