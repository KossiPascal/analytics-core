import { useQuery } from "./SqlQueryStore"
import { previewSQL } from "./SqlPreview"

export function SqlPreview() {
  const { state } = useQuery()
  return (
    <pre style={{ background: "#111", color: "#0f0" }}>
      {previewSQL(state)}
    </pre>
  )
}
