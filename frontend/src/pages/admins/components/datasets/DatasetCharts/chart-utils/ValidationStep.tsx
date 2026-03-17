import { FormSwitch } from "@/components/forms/FormSwitch/FormSwitch";
import { FormTextarea } from "@/components/forms/FormTextarea/FormTextarea";
import { Button } from "@/components/ui/Button/Button";
import { ChartFormProps, DatasetChart, suggestChartType } from "@/models/dataset.models";
import { chartService } from "@/services/dataset.service";
import { useMemo } from "react";


export const ValidationStep = ({ chart, onChange, onExecute, queries }: ChartFormProps) => {

    const query = useMemo(() => {
        return queries?.find((q) => q.id === chart.query_id);
    }, [queries, chart.query_id]);

    const fields = useMemo(() => {
        return query?.fields ?? [];
    }, [query]);

    const updateChartValue = (key: keyof DatasetChart, val: any) => {
        let updated: DatasetChart = { ...chart, [key]: val };
        // si tu veux suggérer le type après chaque changement de structure
        if (key === "structure") {
            if (!("structure" in updated)) {
                updated = {
                    ...updated as any, structure: {
                        rows_dimensions: [],
                        cols_dimensions: [],
                        metrics: [], filters: []
                    }
                };
            }
            const dimensions = [...updated.structure.rows_dimensions, ...updated.structure.cols_dimensions].map(d => d.field_id);
            const metrics = updated.structure.metrics.map(m => m.field_id);
            updated.type = suggestChartType(dimensions, metrics);
        }
        onChange(updated);
    };

    const executeQuery = async () => {
        if (!chart.query_id || !onExecute) return;
        chartService.execute(chart.query_id, chart).then(res => onExecute(res))
    }

    return (
        <>
            <FormSwitch
                label="Active"
                checked={chart.is_active}
                onChange={e => updateChartValue("is_active", e.target.checked)}
            />

            <FormTextarea
                label="Commentaire / Analyse"
                value={chart.description ?? ""}
                onChange={e => updateChartValue("description", e.target.value)}
            />

            <Button variant="warning" size="sm" onClick={() => executeQuery()}>
                Executer
            </Button>
        </>
    );
};