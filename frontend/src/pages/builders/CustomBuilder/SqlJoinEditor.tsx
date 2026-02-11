import { AxisSelector } from "./model/AxisSelector"
import { JoinType } from "./SQLBuilder"
import { useQuery } from "./SqlQueryStore"

export function JoinEditor({ tables, columns }: any) {
  const { state, dispatch } = useQuery()

  const addJoin = () => {
    dispatch({
      type: "ADD_JOIN",
      join: {
        id: crypto.randomUUID(),
        type: "LEFT" as JoinType,
        leftTableId: state.sourceTableId,
        rightTableId: "facility",
        on: [
          {
            left: { tableId: state.sourceTableId, name: "facility_id" },
            right: { tableId: "facility", name: "id" },
          },
        ],
      },
    })
  }



  return (
    <>
      <h3>Joins</h3>
      <button onClick={addJoin}>+ Add Join</button>

      {state.joins.map((j) => (
        <div key={j.id}>
          <span>{j.type}</span>
          <span>{j.leftTableId} → {j.rightTableId}</span>
        </div>
      ))}

      <AxisSelector
        label="X Axis"
        fields={state.dimensions.map(d => d.column.name)}
        value={state.chart?.x?.field}
        onChange={(f:any) =>
          dispatch({
            type: "SET_CHART",
            chart: { ...state.chart, x: { field: f } }
          })
        }
      />

    </>
  )
}
