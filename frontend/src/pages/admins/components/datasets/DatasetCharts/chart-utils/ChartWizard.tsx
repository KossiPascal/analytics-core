import { useEffect, useMemo, useState } from "react";
import { DatasetStep } from "./DatasetStep";
import { StructureStep } from "./StructureStep";
import { VisualOptionsStep } from "./VisualOptionsStep";
import { Dataset, DatasetChart, DatasetQuery, ExecuteChartResponse, SqlChartTypeList } from "@/models/dataset.models";
import { Tenant } from "@/models/identity.model";
import { datasetService, queryService } from "@/services/dataset.service";
import { ValidationStep } from "./ValidationStep";

interface Props {
  chart: DatasetChart;
  tenants: Tenant[];
  tenant_id: number | undefined;
  onChange: (val: DatasetChart) => void;
  onExecute: (val: ExecuteChartResponse | undefined) => void;
}

export const ChartWizard = ({ chart, tenants, tenant_id, onChange, onExecute }: Props) => {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [queries, setQueries] = useState<DatasetQuery[]>([]);
  const [step, setStep] = useState(0);

  const steps = ["Data", "Structure", "Visual", "Final"];

  const tenantId = useMemo(() => {
    return chart.tenant_id || tenant_id;
  }, [chart.tenant_id, tenant_id]);

  useEffect(() => {
    if (!tenantId) return;
    datasetService.all(tenantId).then((res) => setDatasets(res || []));
  }, [tenantId]);

  useEffect(() => {
    if (!tenantId || !chart.dataset_id) return;
    queryService.all(tenantId, chart.dataset_id).then((res) => setQueries(res || []));
  }, [tenantId, chart.dataset_id]);

  // useEffect(() => {
  //   if (!tenantId || !chart.dataset_id || !chart.query_id) return;
  // }, [tenantId, chart.dataset_id, chart.query_id]);

  return (
    <div style={{ background: "#fff", padding: 16, borderRadius: 8 }}>
      <h3>{steps[step]}</h3>

      {step === 0 && <DatasetStep chart={chart} onChange={onChange} tenants={tenants} tenant_id={tenant_id} datasets={datasets} queries={queries} />}
      {step === 1 && <StructureStep chart={chart} onChange={onChange} tenants={tenants} tenant_id={tenant_id} datasets={datasets} queries={queries} />}
      {step === 2 && <VisualOptionsStep chart={chart} onChange={onChange} tenants={tenants} tenant_id={tenant_id} datasets={datasets} queries={queries} />}
      {step === 3 && <ValidationStep chart={chart} onChange={onChange} onExecute={onExecute} tenants={tenants} tenant_id={tenant_id} datasets={datasets} queries={queries} />}

      <div style={{ marginTop: 16 }}>
        <button disabled={step === 0} onClick={() => setStep(step - 1)}>
          Back
        </button>
        <button style={{ marginLeft: 8 }} disabled={step === steps.length - 1} onClick={() => setStep(step + 1)} >
          Next
        </button>
      </div>
    </div>
  );
};