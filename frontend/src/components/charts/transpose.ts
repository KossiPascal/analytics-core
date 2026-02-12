import type { ChartDataItem, ChartSeries } from './types';

// ============================================================================
// TYPES
// ============================================================================

export interface TransposeChartResult {
  data: ChartDataItem[];
  series: ChartSeries[];
}

export interface TransposeTableResult<T extends Record<string, unknown> = Record<string, unknown>> {
  data: T[];
  headerKey: string;
}

// ============================================================================
// CHART TRANSPOSITION
// ============================================================================

/**
 * Transpose chart data: what was on the X axis (categories) becomes series,
 * and what was series becomes categories on the X axis.
 *
 * Example:
 *   Before: data=[{name:'Jan', ind1:100, ind2:200}, {name:'Fév', ind1:150, ind2:250}]
 *           series=[{dataKey:'ind1'}, {dataKey:'ind2'}]
 *   After:  data=[{name:'ind1', Jan:100, Fév:150}, {name:'ind2', Jan:200, Fév:250}]
 *           series=[{dataKey:'Jan', name:'Jan'}, {dataKey:'Fév', name:'Fév'}]
 */
export function transposeChartData(
  data: ChartDataItem[],
  series: ChartSeries[],
  nameKey: string = 'name',
): TransposeChartResult {
  if (data.length === 0 || series.length === 0) {
    return { data, series };
  }

  // Extract X-axis labels (e.g., 'Jan', 'Fév', ...)
  const xLabels = data.map((item) => String(item[nameKey] ?? ''));

  // Each original series becomes a row in the new data
  const newData: ChartDataItem[] = series.map((s) => {
    const row: ChartDataItem = { [nameKey]: s.name ?? s.dataKey };
    data.forEach((item, i) => {
      row[xLabels[i]] = item[s.dataKey] as string | number;
    });
    return row;
  });

  // Each original X-axis label becomes a new series
  const newSeries: ChartSeries[] = xLabels.map((label, i) => ({
    dataKey: label,
    name: label,
    color: series[i]?.color,
  }));

  return { data: newData, series: newSeries };
}

// ============================================================================
// TABLE TRANSPOSITION
// ============================================================================

/**
 * Transpose table data: rows become columns and columns become rows.
 *
 * Example:
 *   Before: [{indicateur:'Ind1', jan:100, fev:200}, {indicateur:'Ind2', jan:150, fev:250}]
 *           headerKey='indicateur'
 *   After:  [{indicateur:'jan', Ind1:100, Ind2:150}, {indicateur:'fev', Ind1:200, Ind2:250}]
 */
export function transposeTableData<T extends Record<string, unknown> = Record<string, unknown>>(
  data: T[],
  headerKey: string,
): TransposeTableResult<T> {
  if (data.length === 0) return { data, headerKey };

  // Get the row labels (values in the headerKey column)
  const rowLabels = data.map((row) => String(row[headerKey] ?? ''));

  // Get all other column keys
  const columnKeys = Object.keys(data[0]).filter((k) => k !== headerKey);

  // Each column becomes a row
  const newData = columnKeys.map((colKey) => {
    const row: Record<string, unknown> = { [headerKey]: colKey };
    data.forEach((originalRow, i) => {
      row[rowLabels[i]] = originalRow[colKey];
    });
    return row as T;
  });

  return { data: newData, headerKey };
}
