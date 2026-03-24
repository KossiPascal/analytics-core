import { ChartVariant } from './domain';

const TYPES: ChartVariant[] = [
  'bar',
  'line',
  'area',
  'pie',
  'table',
];

export function ChartTypeSelector({
  value,
  onChange,
}: {
  value: ChartVariant;
  onChange: (t: ChartVariant) => void;
}) {
  return (
    <div>
      {TYPES.map((t) => (
        <button
          key={t}
          onClick={() => onChange(t)}
          style={{ fontWeight: t === value ? 'bold' : 'normal' }}
        >
          {t}
        </button>
      ))}
    </div>
  );
}
