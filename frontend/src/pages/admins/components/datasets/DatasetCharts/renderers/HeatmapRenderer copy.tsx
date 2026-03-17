import { ChartRenderProp } from "@/models/dataset.models";
import { useMemo } from "react";

export const HeatmapRenderer = ({ chart, data }: ChartRenderProp) => {

  if (!data?.rows?.length || !data?.header) {
    return <div className="text-gray-400 p-4">No data</div>;
  }

  const header = data.header;

  const dimensionKeys = header.rows ?? [];
  const metrics = header._all_columns_order ?? [];

  const options = useMemo(() => ({
    ...(chart.options?.heatmap ?? {}),
    ...(chart.options ?? {})
  }), [chart.options]);

  const max = Math.max(
    ...data.rows.flatMap((r:any)=>metrics.map(m=>Number(r[m]) || 0))
  );

  return (

    <div style={{ display:"grid", gap:4 }}>

      {data.rows.map((row:any,i)=>(

        <div key={i} style={{ display:"flex", gap:4 }}>

          {metrics.map((m:any)=>{

            const val = Number(row[m]) || 0;
            const intensity = max ? val / max : 0;

            return (

              <div
                key={m}
                title={`${m}: ${val}`}
                style={{
                  width:40,
                  height:40,
                  background:`rgba(33,150,243,${intensity})`
                }}
              />

            )

          })}

        </div>

      ))}

    </div>

  );

};