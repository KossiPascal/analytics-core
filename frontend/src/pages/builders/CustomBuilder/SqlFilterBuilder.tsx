import { useQuery } from "./SqlQueryStore"
import { FilterNode } from "./SqlFilterNode"

export function FilterBuilder() {
  const { state, dispatch } = useQuery()

  if (!state.where) {
    state.where = {
      type: "group",
      logic: "AND",
      children: [],
    }
  }

  const filter = {
    type: "group",
    logic: "AND",
    children: [
      {
        type: "leaf",
        column: { tableId: "pcimne_data_view", name: "sex" },
        operator: "=",
        value: "male",
      },
    ],
  }

  // return (
  //   <button onClick={() => dispatch({ type: "SET_FILTER", filter })} >
  //     Apply filter
  //   </button>
  // )

  return (
    <>
      <h3>Filters</h3>
      <FilterNode node={state.where} onChange={(n) => dispatch({ type: "SET_FILTER", filter: n }) } />
    </>
  )
}
