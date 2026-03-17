import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ResponsiveContainer
} from "recharts";

import { ChartRenderProp } from "@/models/dataset.models";
import { useMemo } from "react";

export const AreaRenderer = ({ chart, data }: ChartRenderProp) => {

  if (!data?.rows?.length || !data?.header) {
    return <div className="text-gray-400 p-4">No data</div>;
  }

  const header = data.header;

  const dimensionKeys = header.rows ?? [];
  const metrics = header._all_columns_order ?? [];

  const xKey = dimensionKeys[dimensionKeys.length-1];

  const options = useMemo(()=>({
    ...(chart.options?.area ?? {}),
    ...(chart.options ?? {})
  }),[chart.options]);

  const colors = options.color_scheme ?? [
    "#4caf50","#2196f3","#ff9800","#9c27b0"
  ];

  return (

    <ResponsiveContainer width="100%" height={options.height ?? 350}>

      <AreaChart data={data.rows}>

        {options.show_grid && <CartesianGrid strokeDasharray="3 3"/>}

        <XAxis dataKey={xKey}/>
        <YAxis/>

        {options.show_tooltip !== false && <Tooltip/>}
        {options.show_legend !== false && <Legend/>}

        {metrics.map((m,i)=>(
          <Area
            key={m}
            type="monotone"
            dataKey={m}
            stroke={colors[i % colors.length]}
            fill={colors[i % colors.length]}
            fillOpacity={0.4}
            stackId={options.stacked ? "stack" : undefined}
          />
        ))}

      </AreaChart>

    </ResponsiveContainer>

  )

}