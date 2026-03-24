import { useMemo, useState } from "react";
import { StructureStep } from "./StructureStep";
import { VisualOptionsStep } from "./VisualOptionsStep";
import { Dataset, DatasetChart, DatasetQuery, ExecuteChartResponse } from "@/models/dataset.models";
import { Tenant } from "@/models/identity.model";
import { ValidationStep } from "./ValidationStep";

interface Props {
  chart: DatasetChart;
  tenants: Tenant[];
  tenant_id: number;
  datasets: Dataset[];
  dataset_id: number;
  queries: DatasetQuery[];
  query_id: number;
  onChange: (val: DatasetChart) => void;
  onExecute: (val: ExecuteChartResponse | undefined) => void;
}

export const ChartWizard = ({ chart, tenants, datasets, queries, onChange, onExecute }: Props) => {
  const [step, setStep] = useState(0);
  const steps = ["Structure", "Visual", "Final"];

  // const tenantId = useMemo(() => {
  //   return chart.tenant_id || tenant_id;
  // }, [chart.tenant_id, tenant_id]);

  return (
    <div style={{ background: "#fff", padding: 16, borderRadius: 8 }}>
      <h3>{steps[step]}</h3>

      {/* {step === 0 && <DatasetStep chart={chart} onChange={onChange} tenants={tenants} datasets={datasets} queries={queries} />} */}
      {step === 0 && <StructureStep chart={chart} onChange={onChange} tenants={tenants}  datasets={datasets} queries={queries} />}
      {step === 1 && <VisualOptionsStep chart={chart} onChange={onChange} tenants={tenants}  datasets={datasets} queries={queries} />}
      {step === 2 && <ValidationStep chart={chart} onChange={onChange} onExecute={onExecute} datasets={datasets} queries={queries} />}

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