import { ConditionNode } from "./SQLBuilder"

export function FilterNode({ node, onChange, }: { node: ConditionNode, onChange: (n: ConditionNode) => void }) {
  if (node.type === "leaf") {
    return (
      <div>
        {node.column.name}
        <select
          value={node.operator}
          onChange={(e) =>
            onChange({ ...node, operator: e.target.value as any })
          }
        >
          <option value="=">=</option>
          <option value="!=">!=</option>
        </select>
        <input
          value={node.value}
          onChange={(e) =>
            onChange({ ...node, value: e.target.value })
          }
        />
      </div>
    )
  }

  return (
    <fieldset>
      <legend>{node.logic}</legend>
      {node.children.map((c, i) => (
        <FilterNode key={i} node={c} onChange={(newChild) => {
            const next = [...node.children]
            next[i] = newChild
            onChange({ ...node, children: next })
          }}
        />
      ))}
    </fieldset>
  )
}
