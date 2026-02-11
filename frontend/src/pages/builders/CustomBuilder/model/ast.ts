import { DimensionNode, MetricNode, JoinNode, ConditionNode, TimeSeriesNode } from "../SQLBuilder"
import { ChartConfig } from "./chart"

export interface QueryAST {
  sourceTableId: string
  dimensions: DimensionNode[]
  metrics: MetricNode[]
  joins: JoinNode[]
  where?: ConditionNode
  timeseries?: TimeSeriesNode

  chart?: ChartConfig   // 👈 AJOUT
}
