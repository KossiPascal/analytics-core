import React, { useState, useCallback } from 'react';
import { FormInput } from '@/components/forms/FormInput/FormInput';
import { FormSelect } from '@/components/forms/FormSelect/FormSelect';
import { FormCheckbox } from '@/components/forms/FormCheckbox/FormCheckbox';
import styles from '@pages/builders/SqlBuilder/SqlBuilder.module.css';

export interface DimensionEntry {
  id: string;
  attributeId: string;
  name: string;
  alias: string;
  label: string;
  unique: boolean;
}

export interface MetricEntry {
  id: string;
  attributeId: string;
  name: string;
  alias: string;
  label: string;
  formula: string;
  unique: boolean;
}

export type DefinitionEntry = DimensionEntry | MetricEntry;

interface DefinitionItemFormProps {
  type: 'dimension' | 'metric';
  tableName: string;
  attributeColumnName: string;
  attributeId: string;
  onAdd: (entry: DefinitionEntry) => void;
}

export const FORMULA_OPTIONS = [
  { value: 'COUNT', label: 'COUNT' },
  { value: 'SUM', label: 'SUM' },
  { value: 'AVG', label: 'AVG' },
  { value: 'MIN', label: 'MIN' },
  { value: 'MAX', label: 'MAX' },
  { value: 'DISTINCT', label: 'DISTINCT' },
];

export const buildAlias = (tableName: string, columnName: string, unique: boolean, formula?: string): string => {
  const safeTable = (tableName || '').trim();
  let safeColumn = (columnName || '').trim();

  if (safeTable && safeColumn.startsWith(`${safeTable}.`)) {
    safeColumn = safeColumn.slice(safeTable.length + 1);
  } else if (safeTable && safeColumn.startsWith(`${safeTable}_`)) {
    safeColumn = safeColumn.slice(safeTable.length + 1);
  }

  const parts = [safeTable, safeColumn, formula ? formula.toLowerCase() : undefined].filter(Boolean);
  const raw = parts.join('_') || 'champ';
  const base = raw
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
  return unique ? `${base}_unique` : base;
};

export const DefinitionItemForm: React.FC<DefinitionItemFormProps> = ({
  type,
  tableName,
  attributeColumnName,
  attributeId,
  onAdd,
}) => {
  const isMetric = type === 'metric';
  const [label, setLabel] = useState('');
  const [formula, setFormula] = useState('');
  const [unique, setUnique] = useState(false);

  const alias = buildAlias(tableName, attributeColumnName, unique, isMetric ? formula : undefined);
  const isValid = label.trim().length > 0 && (!isMetric || formula.length > 0);

  const handleAdd = useCallback(() => {
    if (!isValid) return;

    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const base = {
      id,
      attributeId,
      name: label.trim(),
      alias,
      label: label.trim(),
      unique,
    };

    onAdd(isMetric ? { ...base, formula } : base);

    setLabel('');
    setFormula('');
    setUnique(false);
  }, [label, alias, formula, unique, isMetric, isValid, onAdd, attributeId]);

  return (
    <div className={styles.definitionItemForm}>
      <div className={styles.definitionItemFormTitle}>
        {isMetric ? 'Nouvelle métrique' : 'Nouvelle dimension'}
      </div>
      <FormInput
        label="Libellé"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder="Libellé"
        required
      />
      <FormInput
        label="Alias"
        value={alias}
        disabled
        placeholder="Auto-généré"
      />
      <FormCheckbox
        label="Unique (DISTINCT)"
        checked={unique}
        onChange={(e) => setUnique(e.target.checked)}
      />
      {isMetric && (
        <FormSelect
          label="Formule"
          options={FORMULA_OPTIONS}
          value={formula}
          onChange={(value) => setFormula(value)}
          placeholder="Sélectionner une formule"
          required
        />
      )}
      <button
        type="button"
        className={`${styles.btn} ${styles.btnPrimary} ${styles.btnSmall}`}
        onClick={handleAdd}
        disabled={!isValid}
        style={{ alignSelf: 'flex-start', marginTop: '4px' }}
      >
        Ajouter
      </button>
    </div>
  );
};
