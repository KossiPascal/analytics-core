import { useQuery } from "./SqlQueryStore"

export function DimensionPanel({ columns }: any) {
  const { dispatch } = useQuery()

  return (
    <>
      <h3>Dimensions</h3>
      {columns.map((c: string) => (
        <button
          key={c}
          onClick={() =>
            dispatch({
              type: "ADD_DIMENSION",
              column: { tableId: "pcimne_data_view", name: c },
            })
          }
        >
          {c}
        </button>
      ))}
    </>
  )
}
