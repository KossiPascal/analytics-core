import { Chart } from '@/components/charts/Chart';
import { useNotification } from '@/contexts/OLD/useNotification';
import { VisualizationRepository } from './repository';
import { useVisualizationState } from './useVisualizationState';
import { usePreviewData } from './usePreviewData';
import { ChartTypeSelector } from './ChartTypeSelector';
import { LayoutDropZone } from './LayoutDropZone';
import { DEFAULT_DIMENSIONS } from './defaultData';
import { DimensionSelector } from './DimensionSelector';
import './visualizations.css';


export default function VisualizationsTab() {
    const { showSuccess, showError } = useNotification();
    const { state, actions } = useVisualizationState();

    const previewData = usePreviewData(
        state.chartType,
        state.rows
    );

    const save = () => {
        try {
            const now = new Date().toISOString();

            VisualizationRepository.save({
                id: `viz-${Date.now()}`,
                createdAt: now,
                updatedAt: now,
                name: state.name,
                description: state.description,
                type: state.type,
                chartType: state.chartType,
                columns: [{ dimension: 'pe', items: state.columns }],
                rows: [{ dimension: 'dx', items: state.rows }],
                filters: [{ dimension: 'ou', items: state.filters }],
                options: state.options,
            });

            showSuccess('Visualisation sauvegardée');

            showSuccess(`Visualisation sauvegardée : ${state.name}`);
        } catch {
            showError('Erreur lors de la sauvegarde');
        }
    };



    return (
        <div className="visualizations">
            <DimensionSelector
                title="Indicators (dx)"
                items={DEFAULT_DIMENSIONS.dx}
                selected={state.rows}
                onChange={actions.setRows}
            />

            <DimensionSelector
                title="Periods (pe)"
                items={DEFAULT_DIMENSIONS.pe}
                selected={state.columns}
                onChange={actions.setColumns}
            />

            <DimensionSelector
                title="Organisation units (ou)"
                items={DEFAULT_DIMENSIONS.ou}
                selected={state.filters}
                onChange={actions.setFilters}
            />

            <h2>Créateur de visualisation</h2>

            <input
                value={state.name}
                onChange={(e) => actions.setName(e.target.value)}
            />

            <ChartTypeSelector
                value={state.chartType}
                onChange={actions.setChartType}
            />

            <LayoutDropZone
                title="Rows"
                items={state.rows}
                onRemove={(id) =>
                    actions.setRows(state.rows.filter((x) => x !== id))
                }
            />

            <Chart
                type={state.chartType as any}
                data={previewData}
                series={state.rows.map((r) => ({ dataKey: r, name: r }))}
            />

            <button onClick={save}>Save</button>
        </div>
    );
}
