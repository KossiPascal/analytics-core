import { useState } from 'react';
import { ChartVariant, VisualizationOptions, VisualizationType } from './domain';

export function useVisualizationState() {
  const [type, setType] = useState<VisualizationType>('dashboard');
  const [chartType, setChartType] = useState<ChartVariant>('bar');
  const [name, setName] = useState('Nouvelle visualisation');
  const [description, setDescription] = useState('');

  const [columns, setColumns] = useState<string[]>([]);
  const [rows, setRows] = useState<string[]>([]);
  const [filters, setFilters] = useState<string[]>([]);

  const [options, setOptions] = useState<VisualizationOptions>({
    showLegend: true,
    showTooltip: true,
    showGrid: true,
    stacked: false,
    animation: true,
  });

  return {
    state: {
      type,
      chartType,
      name,
      description,
      columns,
      rows,
      filters,
      options,
    },
    actions: {
      setType,
      setChartType,
      setName,
      setDescription,
      setColumns,
      setRows,
      setFilters,
      setOptions,
    },
  };
}
