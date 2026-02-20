import { Plus, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/Input/Input';
import { Button } from '@/components/ui/Button/Button';

// ─── IMEI Validation ──────────────────────────────────────────────────────────

/** Algorithme de Luhn */
function luhnCheck(value: string): boolean {
  let sum = 0;
  let alternate = false;
  for (let i = value.length - 1; i >= 0; i--) {
    let n = parseInt(value[i], 10);
    if (alternate) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alternate = !alternate;
  }
  return sum % 10 === 0;
}

export function validateImei(raw: string): string | null {
  const imei = raw.trim();
  if (!imei) return 'IMEI requis';
  if (!/^\d+$/.test(imei)) return 'L\'IMEI ne doit contenir que des chiffres';
  if (imei.length !== 15) return `L'IMEI doit contenir exactement 15 chiffres (${imei.length}/15)`;
  if (!luhnCheck(imei)) return 'IMEI invalide (échec validation Luhn)';
  return null;
}

// ─── Component ────────────────────────────────────────────────────────────────

interface FormImeiProps {
  values: string[];
  onChange: (values: string[]) => void;
  required?: boolean;
  label?: string;
}

export function FormImei({ values, onChange, required = false, label = 'IMEI' }: FormImeiProps) {
  const list = values.length > 0 ? values : [''];

  const handleChange = (index: number, raw: string) => {
    const trimmed = raw.replace(/\s+/g, '').replace(/[^\d]/g, '');
    const next = [...list];
    next[index] = trimmed;
    onChange(next);
  };

  const handleAdd = () => {
    onChange([...list, '']);
  };

  const handleRemove = (index: number) => {
    const next = list.filter((_, i) => i !== index);
    onChange(next.length > 0 ? next : ['']);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>
          {label}
          {required && <span style={{ color: 'var(--color-danger, #ef4444)', marginLeft: '0.25rem' }}>*</span>}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          leftIcon={<Plus size={14} />}
          onClick={handleAdd}
          style={{ fontSize: '0.75rem' }}
        >
          Ajouter IMEI {list.length + 1}
        </Button>
      </div>

      {list.map((val, idx) => {
        const error = val ? validateImei(val) : null;
        return (
          <div key={idx} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <Input
                label={list.length > 1 ? `IMEI ${idx + 1}` : undefined}
                value={val}
                onChange={(e) => handleChange(idx, e.target.value)}
                placeholder="000000000000000"
                maxLength={15}
                inputMode="numeric"
                error={error ?? undefined}
                required={required && idx === 0}
                hint={val && !error ? `✓ ${val.length}/15` : `${val.length}/15`}
              />
            </div>
            {list.length > 1 && (
              <button
                type="button"
                onClick={() => handleRemove(idx)}
                style={{
                  marginTop: '1.75rem',
                  padding: '0.375rem',
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  color: 'var(--color-danger, #ef4444)',
                  borderRadius: '0.25rem',
                }}
                aria-label={`Supprimer IMEI ${idx + 1}`}
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
