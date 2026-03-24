import { Shield } from 'lucide-react';
import { forwardRef, useMemo, useState } from 'react';
import { StatusBadge } from '@components/ui/Badge/Badge';
import { type Column } from '@components/ui/Table/Table';
import { Tenant } from '@models/identity.model';
import { AdminEntityCrudModuleRef, AdminEntityCrudModule } from '@pages/admins/AdminEntityCrudModule';
import { Dataset, DatasetField } from '@/models/dataset.models';
import { fieldService } from '@/services/dataset.service';
import { Sigma, Calculator } from 'lucide-react';
import { Modal } from '@/components/ui/Modal/Modal';
import { Button } from '@/components/ui/Button/Button';
import { DatasetFieldForm } from './components/DatasetFieldForm';

interface DatasetFieldTabProps {
    tenants: Tenant[];
    tenant_id: number;
    datasets: Dataset[];
    dataset_id: number;
}

const createDefaultForm = (tenant_id: number): DatasetField => ({
    id: null,
    name: "",
    expression: "",
    aggregation: null,
    tenant_id: tenant_id,
    dataset_id: null,
    field_type: null,
    data_type: "string",
    description: "",
    format: {},
    dimensions: [],
    metrics: [],
    select_multiple: undefined,
    is_public: false,
    is_filterable: false,
    is_groupable: false,
    is_sortable: false,
    is_selectable: false,
    is_hidden: false,
    is_active: true,
    raw_field: null,
});

const datafieldColumns: Column<DatasetField>[] = [
    {
        key: "name",
        header: "Nom",
        sortable: true,
        searchable: true,
    },
    {
        key: "expression",
        header: "Expression",
        sortable: true,
        searchable: true,
    },
    {
        key: "aggregation",
        header: "Aggregation",
        sortable: true,
        searchable: true,
    },
    {
        key: "tenant",
        header: "Tenant",
        render: (ds) => ds.tenant ? ds.tenant.name : "",
        sortable: true,
        searchable: true,
    },
    {
        key: "dataset",
        header: "Dataset",
        render: (ds) => ds.dataset ? ds.dataset.name : "",
        sortable: true,
        searchable: true,
    },
    {
        key: "field_type",
        header: "Field type",
        sortable: true,
        render: (r) =>
            r.field_type === "dimension" ?
                (<div className="flex items-center gap-2"><Sigma size={16} /> Dimension</div>) :
                (<div className="flex items-center gap-2"><Calculator size={16} /> Metric</div>),
    },
    {
        key: "data_type",
        header: "Data type",
        sortable: true,
        searchable: true,
    },
    {
        key: "description",
        header: "Description",
        sortable: true,
        searchable: true,
    },
    {
        key: "is_public",
        header: "Public",
        align: "center",
        render: (r) => <StatusBadge isActive={r.is_public} />,
    },
    {
        key: "is_active",
        header: "is_active",
        sortable: true,
        align: "center",
        render: (ou) => (<StatusBadge isActive={ou.is_active} />),
        searchable: false,
    },
    {
        key: "is_filterable",
        header: "is_filterable",
        sortable: true,
        align: "center",
        render: (ou) => (<StatusBadge isActive={ou.is_filterable} />),
        searchable: false,
    },
    {
        key: "is_groupable",
        header: "is_groupable",
        sortable: true,
        align: "center",
        render: (ou) => (<StatusBadge isActive={ou.is_groupable} />),
        searchable: false,
    },
    {
        key: "is_sortable",
        header: "is_sortable",
        sortable: true,
        align: "center",
        render: (ou) => (<StatusBadge isActive={ou.is_sortable} />),
        searchable: false,
    },
    {
        key: "is_selectable",
        header: "is_selectable",
        sortable: true,
        align: "center",
        render: (ou) => (<StatusBadge isActive={ou.is_selectable} />),
        searchable: false,
    },
    {
        key: "is_hidden",
        header: "is_hidden",
        sortable: true,
        align: "center",
        render: (ou) => (<StatusBadge isActive={ou.is_hidden} />),
        searchable: false,
    },
    {
        key: "raw_field",
        header: "raw_field",
        render: (ou) => JSON.stringify(ou.raw_field),
        sortable: true,
        searchable: true,
    },
];


export const DatasetFieldTab = forwardRef<AdminEntityCrudModuleRef, DatasetFieldTabProps>(({ tenants, tenant_id, datasets, dataset_id }, ref) => {
    const [showColumns, setShowColumns] = useState<boolean>(false);
    const [hasFormError, setHasFormError] = useState(false);
    const [loading, setLoading] = useState(true);

    const defaultTenant = useMemo(() => {
        return { required: true, ids: [tenant_id, dataset_id] };
    }, [tenant_id, dataset_id]);

    const datasetMap = useMemo(() => {
        const map = new Map<number, Dataset>();
        datasets.forEach(d => {
            if (d.id != null) map.set(Number(d.id), d);
        });
        return map;
    }, [datasets]);

    const DEFAULT_FORM = useMemo(() => ({
        ...createDefaultForm(tenant_id),
        dataset_id: dataset_id ?? null,
    }), [tenant_id, dataset_id])


    return (
        <>
            <AdminEntityCrudModule<DatasetField>
                ref={ref}
                title="Gestion des Fields"
                icon={<Shield size={20} />}
                entityName="DatasetField"
                modalSize="lg"
                columns={datafieldColumns}
                defaultValue={DEFAULT_FORM}
                service={fieldService}
                defaultTenant={defaultTenant}
                onBeforeSave={(df) => ({ ...df, dataset_id: df.dataset_id ?? dataset_id ?? null })}
                isValid={df => {
                    const isOk1 = !hasFormError && Boolean(df.dataset_id);

                    const isOk2 = Boolean(df.name.trim() && df.expression.trim() &&
                        (
                            (df.field_type === "dimension" && !df.aggregation) ||
                            (df.field_type === "calculated_metric" && !df.aggregation) ||
                            (df.field_type === "metric" && df.aggregation)
                        )
                    )

                    const isDimens = df.field_type === "dimension" && (df.dimensions?.length ?? 0) > 0;
                    const isMetric = df.field_type === "metric" && (df.metrics?.length ?? 0) > 0;

                    return isOk1 && (df.select_multiple === true && (isDimens || isMetric) ? true : isOk2);
                }}
                renderForm={(field, setValue, saving) => (
                    <DatasetFieldForm
                        field={field}
                        setValue={setValue}
                        tenants={tenants}
                        tenant_id={tenant_id}
                        datasets={datasets}
                        dataset_id={dataset_id}
                        datasetMap={datasetMap}
                        saving={saving}
                        showColumns={showColumns}
                        setShowColumns={setShowColumns}
                        onValidationChange={setHasFormError}
                    />
                )}
            />

            {/* Modal "Voir les colonnes" (switch général) */}
            <Modal
                isOpen={showColumns}
                onClose={() => setShowColumns(false)}
                title={"Field - Columns"}
                size="sm"
                footer={
                    <div className="flex gap-3">
                        <Button variant="outline" size="sm" onClick={() => setShowColumns(false)}>
                            Fermer
                        </Button>
                    </div>
                }
            >
                <div className="flex-1 overflow-auto bg-[#1e1e1e] p-6">
                    <table className="w-full table-auto border-collapse border border-gray-600">
                        <thead>
                            <tr>
                                <th>Nom</th>
                                <th>Type</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Array.from(datasetMap.values())
                                .flatMap(d => d.columns || [])
                                .map((c, idx) => (
                                    <tr key={idx} className="hover:bg-gray-700">
                                        <td className="border border-gray-600 px-2 py-1">{c.name}</td>
                                        <td className="border border-gray-600 px-2 py-1">{c.type}</td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>
            </Modal>
        </>
    );
});
