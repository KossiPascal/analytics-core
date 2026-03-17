import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid
} from "recharts";

import { ChartRenderProp } from "@/models/dataset.models";
import { useMemo } from "react";

export const HorizontalBarRenderer = ({ chart, data }: ChartRenderProp) => {

  if (!data?.rows?.length || !data?.header) {
    return <div className="text-gray-400 p-4">No data</div>;
  }

  const header = data.header;

  const dimensionKeys = header.rows ?? [];
  const metrics = header._all_columns_order ?? [];

  const xKey = dimensionKeys[dimensionKeys.length - 1];

  const options = useMemo(() => ({
    ...(chart.options?.bar ?? {}),
    ...(chart.options ?? {})
  }), [chart.options]);

  const colors = options.color_scheme ?? [
    "#4caf50","#2196f3","#ff9800","#9c27b0","#f44336"
  ];

  return (

    <ResponsiveContainer width="100%" height={options.height ?? 400}>

      <BarChart
        data={data.rows}
        layout="vertical"
        margin={{ top:20,left:20,right:20,bottom:20 }}
      >

        {options.show_grid && <CartesianGrid strokeDasharray="3 3"/>}

        <XAxis type="number"/>
        <YAxis type="category" dataKey={xKey} width={150}/>

        {options.show_tooltip !== false && <Tooltip/>}
        {options.show_legend !== false && <Legend/>}

        {metrics.map((m,i)=>(
          <Bar
            key={m}
            dataKey={m}
            fill={colors[i % colors.length]}
            stackId={options.stacked ? "stack" : undefined}
          />
        ))}

      </BarChart>

    </ResponsiveContainer>

  );

};