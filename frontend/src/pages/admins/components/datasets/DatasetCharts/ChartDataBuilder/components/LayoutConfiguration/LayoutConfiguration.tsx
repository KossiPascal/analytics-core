import React, { useState } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────
type Zone = 'colonnes' | 'lignes' | 'filtres';

interface Item {
  id: string;
  label: string;
}

type ZoneState = Record<Zone, Item[]>;

const DRAG_KEY = 'demo-drag-item';

// ── Demo data ─────────────────────────────────────────────────────────────────
const INITIAL_STATE: ZoneState = {
  colonnes: [
    { id: 'c1', label: 'Région' },
    { id: 'c2', label: 'Année' },
    { id: 'c3', label: 'Produit' },
  ],
  lignes: [
    { id: 'l1', label: 'Département' },
    { id: 'l2', label: 'Trimestre' },
  ],
  filtres: [
    { id: 'f1', label: 'Statut' },
    { id: 'f2', label: 'Catégorie' },
  ],
};

// ── Zone colors ───────────────────────────────────────────────────────────────
const ZONE_STYLES: Record<Zone, { bg: string; border: string; chipBg: string; chipBorder: string; label: string }> = {
  colonnes: { bg: '#f0f9ff', border: '#7dd3fc', chipBg: '#e0f2fe', chipBorder: '#38bdf8', label: 'COLONNES' },
  lignes:   { bg: '#f0fdf4', border: '#86efac', chipBg: '#dcfce7', chipBorder: '#4ade80', label: 'LIGNES'   },
  filtres:  { bg: '#fdf4ff', border: '#e879f9', chipBg: '#fae8ff', chipBorder: '#d946ef', label: 'FILTRES'  },
};

// ── DropZone ──────────────────────────────────────────────────────────────────
interface DropZoneProps {
  zone: Zone;
  items: Item[];
  onDrop: (itemId: string, fromZone: Zone, toZone: Zone) => void;
}

const DropZone: React.FC<DropZoneProps> = ({ zone, items, onDrop }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const s = ZONE_STYLES[zone];

  const handleDragStart = (e: React.DragEvent, itemId: string) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData(DRAG_KEY, JSON.stringify({ itemId, fromZone: zone }));
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (!e.dataTransfer.types.includes(DRAG_KEY)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const raw = e.dataTransfer.getData(DRAG_KEY);
    if (!raw) return;
    const { itemId, fromZone } = JSON.parse(raw) as { itemId: string; fromZone: Zone };
    if (fromZone === zone) return;
    onDrop(itemId, fromZone, zone);
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{
        flex: 1,
        minHeight: 120,
        background: isDragOver ? s.border : s.bg,
        border: `2px dashed ${isDragOver ? '#0284c7' : s.border}`,
        borderRadius: 8,
        padding: '12px 10px',
        transition: 'background 0.15s, border-color 0.15s',
        outline: isDragOver ? `3px solid #0284c7` : 'none',
        outlineOffset: 2,
      }}
    >
      <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', letterSpacing: '0.08em', marginBottom: 10 }}>
        {s.label}
        <span style={{ marginLeft: 6, background: '#e2e8f0', borderRadius: 10, padding: '1px 7px', fontSize: 10 }}>
          {items.length}
        </span>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {items.map(item => (
          <div
            key={item.id}
            draggable
            onDragStart={e => handleDragStart(e, item.id)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '4px 10px',
              background: s.chipBg,
              border: `1px solid ${s.chipBorder}`,
              borderRadius: 4,
              fontSize: 13,
              cursor: 'grab',
              userSelect: 'none',
              boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
            }}
          >
            <span style={{ fontSize: 11, opacity: 0.5 }}>⠿</span>
            {item.label}
          </div>
        ))}

        {items.length === 0 && (
          <div style={{ fontSize: 12, color: '#94a3b8', fontStyle: 'italic' }}>
            Glissez des éléments ici
          </div>
        )}
      </div>
    </div>
  );
};

// ── Props (kept for compatibility with ChatBuilderInterface) ──────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const LayoutConfiguration: React.FC<Record<string, any>> = () => {
  const [zones, setZones] = useState<ZoneState>(INITIAL_STATE);

  const handleDrop = (itemId: string, fromZone: Zone, toZone: Zone) => {
    setZones(prev => {
      const item = prev[fromZone].find(i => i.id === itemId);
      if (!item) return prev;
      return {
        ...prev,
        [fromZone]: prev[fromZone].filter(i => i.id !== itemId),
        [toZone]: [...prev[toZone], item],
      };
    });
  };

  return (
    <div style={{ padding: 24, fontFamily: 'sans-serif' }}>
      <h3 style={{ margin: '0 0 6px', fontSize: 15, color: '#1e293b' }}>
        Demo Drag &amp; Drop — 3 zones
      </h3>
      <p style={{ margin: '0 0 20px', fontSize: 12, color: '#64748b' }}>
        Glissez les chips entre les zones Colonnes, Lignes et Filtres.
      </p>
      <div style={{ display: 'flex', gap: 16 }}>
        <DropZone zone="colonnes" items={zones.colonnes} onDrop={handleDrop} />
        <DropZone zone="lignes"   items={zones.lignes}   onDrop={handleDrop} />
        <DropZone zone="filtres"  items={zones.filtres}  onDrop={handleDrop} />
      </div>
    </div>
  );
};
