import { Tenant } from "@/models/identity.model";
import { Dataset, DatasetQuery } from "@/models/dataset.models";
import { RenderFormBuilder } from "../../DatasetQueries/query-utils/RenderFormBuilder";
import { DatasetPreviewModal } from "../../DatasetQueries/query-utils/DatasetPreviewModal";
import { CompileError } from "../../DatasetQueries/query-utils/model";
import { Button } from "@/components/ui/Button/Button";
import { Play } from "lucide-react";
import { useState } from "react";

interface DatasetQueryPanelProps {
    query: DatasetQuery;
    datasets: Dataset[];
    tenants: Tenant[];
    tenant_id: number;
    errors: CompileError;
    defaultForm: DatasetQuery;
    setValue: (k: keyof DatasetQuery, v: any) => void;
    setErrors: (e: CompileError) => void;
    setPreviewSql: (sql: string | null) => void;
    onUseSql: (sql: string) => void;
}

export const DatasetQueryPanel: React.FC<DatasetQueryPanelProps> = ({
    query, datasets, tenants, tenant_id, errors, defaultForm,
    setValue, setErrors, setPreviewSql, onUseSql,
}) => {
    const [localPreviewSql, setLocalPreviewSql] = useState<string | null>(null);

    return (
        <div className="space-y-4">
            <RenderFormBuilder
                datasets={datasets}
                query={query}
                tenants={tenants}
                tenant_id={tenant_id}
                errors={errors}
                defaultForm={defaultForm}
                setValue={setValue}
                setPreviewSql={(sql) => { setPreviewSql(sql); setLocalPreviewSql(sql); }}
                setErrors={setErrors}
                hideFilters
            />

            {query.compiled_sql && (
                <div className="flex justify-end pt-2">
                    <Button variant="primary" size="sm" onClick={() => onUseSql(query.compiled_sql)}>
                        <Play size={14} />
                        Utiliser ce SQL
                    </Button>
                </div>
            )}

            <DatasetPreviewModal
                title="SQL Preview"
                open={Boolean(localPreviewSql)}
                data={localPreviewSql || ""}
                onClose={() => setLocalPreviewSql(null)}
                type="sql"
            />
        </div>
    );
};
