import { ChartRenderProp } from "@/models/dataset.models";
import { getMetricKeys, sumMetric } from "./render-utils";

export const GaugeRenderer = ({ chart, data }:ChartRenderProp) => {
  const metrics = getMetricKeys(chart);
  const makeMetrics = metrics.map(m=>m.field);
  const metric = makeMetrics[0];
  const value = sumMetric(data.rows, metric);


  // 
  const percentage = Math.min(100, value);

  return (
    <div style={{ textAlign: "center", padding: 30 }}>
      <h4>{metric}</h4>
      <div
        style={{
          width: 200,
          height: 200,
          borderRadius: "50%",
          background: `conic-gradient(#4caf50 ${percentage}%, #eee ${percentage}%)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "auto",
          fontSize: 28,
          fontWeight: 700,
        }}
      >
        {percentage}%
      </div>
    </div>
  );
};