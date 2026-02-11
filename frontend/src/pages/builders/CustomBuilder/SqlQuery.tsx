import { QueryProvider } from "./SqlQueryStore"
import { TableSelector } from "./SqlTableSelector"
import { DimensionPanel } from "./SqlDimensionPanel"
import { MetricPanel } from "./SqlMetricPanel"
import { FilterBuilder } from "./SqlFilterBuilder"
import { AxisSelector } from "./model/AxisSelector"

export default function SqlQuery() {
  return (
    <>
      <QueryProvider>
        <h2>SQL Builder</h2>
        <TableSelector />
        <DimensionPanel columns={["sex", "age_in_years"]} />
        <MetricPanel />
        <FilterBuilder />
      </QueryProvider>
    </>
  )
}
