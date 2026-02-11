import { useQuery } from "./SqlQueryStore"

export function MetricPanel() {
  const { dispatch } = useQuery()

  return (
    <>
      <h3>Metrics</h3>
      <button
        onClick={() =>
          dispatch({
            type: "ADD_METRIC",
            metric: {
              id: crypto.randomUUID(),
              agg: "count",
              column: { tableId: "pcimne_data_view", name: "id" },
              alias: "total",
            },
          })
        }
      >
        COUNT(id)
      </button>
    </>
  )
}
