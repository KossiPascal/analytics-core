// import { uid } from "../utils/id"
import { useQuery } from "./SqlQueryStore"

const TABLES = ["pcimne_data_view", "facility"]

export function TableSelector() {
  const { dispatch } = useQuery()

  return (
    <select
      onChange={(e) =>
        dispatch({
          type: "SET_SOURCE",
          table: {
            id: e.target.value,
            name: e.target.value,
            alias: "t0",
          },
        })
      }
    >
      <option value="">Select table</option>
      {TABLES.map((t) => (
        <option key={t} value={t}>
          {t}
        </option>
      ))}
    </select>
  )
}
