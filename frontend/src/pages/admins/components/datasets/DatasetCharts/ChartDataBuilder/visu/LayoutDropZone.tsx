interface Props {
  title: string;
  items: string[];
  onRemove: (id: string) => void;
}

export function LayoutDropZone({ title, items, onRemove }: Props) {
  return (
    <div>
      <strong>{title}</strong>
      {items.length === 0 && <div>Drop here</div>}
      {items.map((id) => (
        <div key={id}>
          {id}
          <button onClick={() => onRemove(id)}>×</button>
        </div>
      ))}
    </div>
  );
}
