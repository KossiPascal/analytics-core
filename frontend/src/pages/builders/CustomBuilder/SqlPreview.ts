import { QueryAST } from "./SQLBuilder"

export function previewSQL(ast: QueryAST): string {
  const dims = ast.dimensions.map((d) => `${d.column.tableId}.${d.column.name}`)

  const metrics = ast.metrics.map(
    (m) => `${m.agg.toUpperCase()}(${m.column.tableId}.${m.column.name}) AS ${m.alias}`
  )

  let sql = `SELECT ${[...dims, ...metrics].join(", ")}`
  sql += ` FROM ${ast.sourceTableId}`

  ast.joins.forEach((j) => {
    sql += ` ${j.type} JOIN ${j.rightTableId} ON `
    sql += j.on
      .map(
        (c) =>
          `${c.left.tableId}.${c.left.name} = ${c.right.tableId}.${c.right.name}`
      )
      .join(" AND ")
  })

  return sql
}
