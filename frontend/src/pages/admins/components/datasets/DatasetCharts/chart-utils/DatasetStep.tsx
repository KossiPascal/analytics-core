// import { FormInput } from "@/components/forms/FormInput/FormInput";
// import { FormSelect } from "@/components/forms/FormSelect/FormSelect";
// import { ChartFormProps, Dataset, DatasetChart, DatasetQuery } from "@/models/dataset.models";
// import { Tenant } from "@/models/identity.model";
// import { useMemo } from "react";
// import { FaDatabase } from "react-icons/fa";


// export const DatasetStep = ({ chart, onChange, tenants, tenant_id, datasets, queries }: ChartFormProps) => {

//     const updateChartValue = (field: keyof DatasetChart, val: any) => {
//         onChange({ ...chart, [field]: val });
//     };

//     // const query = useMemo(() => {
//     //     return queries?.find((q) => q.id === chart.query_id);
//     // }, [queries, chart.query_id]);

//     // const fields = useMemo(() => {
//     //     return query?.fields ?? [];
//     // }, [query]);

//     return (
//         <>

//             <FormSelect
//                 label={`Select Tenant`}
//                 value={chart.tenant_id || tenant_id}
//                 options={tenants?.map((t) => ({ value: t.id, label: t.name })) ?? []}
//                 onChange={(value) => updateChartValue('tenant_id', Number(value))}
//                 placeholder="Select Tenant"
//                 leftIcon={<FaDatabase />}
//                 required={true}
//             />

//             <FormSelect
//                 label={`Select Dataset`}
//                 value={chart.dataset_id}
//                 options={datasets?.map((d) => ({ value: d.id, label: d.name })) ?? []}
//                 onChange={(value) => updateChartValue('dataset_id', Number(value))}
//                 placeholder="Select Dataset"
//                 leftIcon={<FaDatabase />}
//                 required={true}
//             />

//             <FormSelect
//                 label={`Select Query`}
//                 value={chart.query_id}
//                 options={queries?.map((q) => ({ value: q.id, label: q.name })) ?? []}
//                 onChange={(value) => updateChartValue('query_id', Number(value))}
//                 placeholder="Select Query"
//                 leftIcon={<FaDatabase />}
//                 required={true}
//             />
//         </>
//     );
// };