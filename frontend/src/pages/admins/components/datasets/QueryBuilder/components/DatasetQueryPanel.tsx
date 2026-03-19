import { useState } from "react";
import { Save, Play, CheckCircle, AlertCircle } from "lucide-react";
import { Dataset, DatasetQuery } from "@/models/dataset.models";
import { RenderFormBuilder } from "../../DatasetQueries/query-utils/RenderFormBuilder";
import { DatasetPreviewModal } from "../../DatasetQueries/query-utils/DatasetPreviewModal";
import { CompileError } from "../../DatasetQueries/query-utils/model";
import { Button } from "@/components/ui/Button/Button";
import { queryService } from "@/services/dataset.service";

interface DatasetQueryPanelProps {
    query: DatasetQuery;
    datasets: Dataset[];
    tenant_id: number;
    errors: CompileError;
    defaultForm: DatasetQuery;
    setValue: (k: keyof DatasetQuery, v: any) => void;
    setErrors: (e: CompileError) => void;
    setPreviewSql: (sql: string | null) => void;
    onUseSql: (sql: string) => void;
}

const cleanQueryJson = (q: DatasetQuery): DatasetQuery => {
    const cleanNode = (node: any): any | null => {
        if (!node) return null;
        if (node.type === "condition") return (!node.field_id || node.field_id <= 0) ? null : node;
        if (node.type === "group") {
            const children = (node.children ?? []).map(cleanNode).filter(Boolean);
            return children.length === 0 ? null : { ...node, children };
        }
        return node;
    };
    const cleanGroups = (groups: any[]) =>
        (groups ?? []).map(g => ({ ...g, node: cleanNode(g.node) })).filter(g => g.node !== null);

    return {
        ...q,
        query_json: {
            ...q.query_json,
            filters: {
                where: cleanGroups(q.query_json?.filters?.where ?? []),
                having: cleanGroups(q.query_json?.filters?.having ?? []),
            },
        },
    };
};

export const DatasetQueryPanel: React.FC<DatasetQueryPanelProps> = ({
    query, datasets, tenant_id, errors, defaultForm,
    setValue, setErrors, setPreviewSql, onUseSql,
}) => {
    const [localPreviewSql, setLocalPreviewSql] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [saveResult, setSaveResult] = useState<"success" | "error" | null>(null);
    const [saveMessage, setSaveMessage] = useState<string>("");

    const isValid =
        Boolean(query.compiled_sql) &&
        Boolean(query.name?.trim()) &&
        Boolean(query.dataset_id) &&
        Object.keys(errors).length === 0;

    const handleSave = async () => {
        if (!isValid) return;
        setSaving(true);
        setSaveResult(null);
        try {
            const cleaned = cleanQueryJson(query);
            let saved: DatasetQuery;
            if (query.id) {
                await queryService.update(query.id, cleaned);
                setSaveMessage("Requête mise à jour avec succès");
            } else {
                const res = await queryService.create(cleaned) as any;
                setSaveMessage("Requête sauvegardée avec succès");
                const newId = res?.id ?? res?.query_id;
                if (newId) setValue("id", newId);
            }
            setSaveResult("success");
            setTimeout(() => setSaveResult(null), 3000);
        } catch (err: any) {
            setSaveResult("error");
            setSaveMessage(err?.message ?? "Erreur lors de la sauvegarde");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-4">
            <RenderFormBuilder
                datasets={datasets}
                query={query}
                tenants={[]}
                tenant_id={tenant_id}
                errors={errors}
                defaultForm={defaultForm}
                setValue={setValue}
                setPreviewSql={(sql) => { setPreviewSql(sql); setLocalPreviewSql(sql); }}
                setErrors={setErrors}
                hideFilters
            />

            {/* Feedback */}
            {saveResult === "success" && (
                <div className="flex items-center gap-2 text-green-600 text-sm">
                    <CheckCircle size={15} /> {saveMessage}
                </div>
            )}
            {saveResult === "error" && (
                <div className="flex items-center gap-2 text-red-600 text-sm">
                    <AlertCircle size={15} /> {saveMessage}
                </div>
            )}

            {/* Action buttons */}
            <div className="flex justify-end gap-2 pt-2">

                {query.compiled_sql && (
                    <Button variant="primary" size="sm" onClick={() => onUseSql(query.compiled_sql)}>
                        <Play size={14} />
                        Utiliser ce SQL
                    </Button>
                )}
            </div>
        </div>
    );
};
