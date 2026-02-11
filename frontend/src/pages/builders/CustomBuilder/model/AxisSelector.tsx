export function AxisSelector({ label, fields, value, onChange }: any) {
  return (
    <label>
      {label}
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {fields.map((f: string) => (
          <option key={f} value={f}>{f}</option>
        ))}
      </select>
    </label>
  )
}
