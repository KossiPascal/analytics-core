import { useMemo, useState } from 'react';
import { DimensionItem } from './domain';

interface Props {
  title: string;
  items: DimensionItem[];
  selected: string[];
  onChange: (ids: string[]) => void;
}

export function DimensionSelector({
  title,
  items,
  selected,
  onChange,
}: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = useMemo(
    () =>
      items.filter((i) =>
        i.name.toLowerCase().includes(search.toLowerCase())
      ),
    [items, search]
  );

  const toggle = (id: string) => {
    onChange(
      selected.includes(id)
        ? selected.filter((x) => x !== id)
        : [...selected, id]
    );
  };

  return (
    <div>
      <button onClick={() => setOpen(!open)}>
        {title} ({selected.length})
      </button>

      {open && (
        <>
          <input
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {filtered.map((item) => (
            <label key={item.id}>
              <input
                type="checkbox"
                checked={selected.includes(item.id)}
                onChange={() => toggle(item.id)}
              />
              {item.name}
            </label>
          ))}
        </>
      )}
    </div>
  );
}
