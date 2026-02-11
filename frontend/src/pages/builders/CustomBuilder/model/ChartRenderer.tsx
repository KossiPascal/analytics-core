import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid
} from "recharts"

export function ChartRenderer({ data, chart }: any) {
  if (chart.type === "line") {
    return (
      <LineChart width={800} height={400} data={data}>
        <XAxis dataKey={chart.x.field} />
        <YAxis />
        <Tooltip />
        <CartesianGrid stroke="#eee" />
        {chart.series.map((s: any) => (
          <Line
            key={s.metric}
            dataKey={s.metric}
            stroke={s.color ?? "#8884d8"}
          />
        ))}
      </LineChart>
    )
  }

  return null
}
