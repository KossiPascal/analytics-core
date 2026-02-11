import { useQuery } from "../SqlQueryStore"

export function ChartBuilder() {
  const { state, dispatch } = useQuery()

  return (
    <>
      <h3>Chart</h3>

      <select
        value={state.chart?.type ?? "bar"}
        onChange={(e) =>
          dispatch({
            type: "SET_CHART",
            chart: { ...(state.chart ?? {}), type: e.target.value },
          })
        }
      >
        <option value="bar">Bar</option>
        <option value="line">Line</option>
        <option value="area">Area</option>
        <option value="pie">Pie</option>
        <option value="kpi">KPI</option>
      </select>
    </>
  )
}
