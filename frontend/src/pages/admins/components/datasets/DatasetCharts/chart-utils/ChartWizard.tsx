import { useEffect, useRef, useState } from "react";
import { DatasetStep } from "./DatasetStep";
import { StructureStep } from "./StructureStep";
import { VisualOptionsStep } from "./VisualOptionsStep";
import { Dataset, DatasetChart, DatasetQuery, ExecuteChartResponse, SqlChartTypeList } from "@/models/dataset.models";
import { Tenant } from "@/models/identity.model";
import { chartService, datasetService, queryService } from "@/services/dataset.service";
import { tenantService } from "@/services/identity.service";
import { Button } from "@/components/ui/Button/Button";
import { FormSelect } from "@/components/forms/FormSelect/FormSelect";
import { ValidationStep } from "./ValidationStep";

interface Props {
  chart: DatasetChart;
  onChange: (val: DatasetChart) => void;
  onExecute: (val: ExecuteChartResponse | undefined) => void;
}

export const ChartWizard = ({ chart, onChange, onExecute }: Props) => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [queries, setQueries] = useState<DatasetQuery[]>([]);
  const [step, setStep] = useState(0);


  const steps = ["Data", "Structure", "Visual", "Final"];


  const didLoad = useRef(false);
  useEffect(() => {
    if (didLoad.current) return;
    didLoad.current = true;
    tenantService.all().then((res) => setTenants(res || []));
  }, []);

  useEffect(() => {
    if (!chart.tenant_id) return;
    datasetService.all(chart.tenant_id).then((res) => setDatasets(res || []));
  }, [chart.tenant_id]);

  useEffect(() => {
    if (!chart.tenant_id || !chart.dataset_id) return;
    queryService.all(chart.tenant_id, chart.dataset_id).then((res) => setQueries(res || []));
  }, [chart.tenant_id, chart.dataset_id]);

  useEffect(() => {
    if (!chart.tenant_id || !chart.dataset_id || !chart.query_id) return;
  }, [chart.tenant_id, chart.dataset_id, chart.query_id]);


  return (
    <div style={{ background: "#fff", padding: 16, borderRadius: 8 }}>
      <h3>{steps[step]}</h3>

      {step === 0 && <DatasetStep chart={chart} onChange={onChange} tenants={tenants} datasets={datasets} queries={queries} />}
      {step === 1 && <StructureStep chart={chart} onChange={onChange} tenants={tenants} datasets={datasets} queries={queries} />}
      {step === 2 && <VisualOptionsStep chart={chart} onChange={onChange} />}
      {step === 3 && <ValidationStep chart={chart} onChange={onChange} onExecute={onExecute} />}

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