import React, { useState, useCallback } from 'react';
import { FormInput, FormSelect } from '@/components/forms';
import styles from '@pages/queries/SqlBuilder/SqlBuilder.module.css';

export interface DimensionEntry {
  id: string;
  name: string;
  alias: string;
  label: string;
}

export interface MetricEntry {
  id: string;
  name: string;
  alias: string;
  label: string;
  formula: string;
}

export type DefinitionEntry = DimensionEntry | MetricEntry;

interface DefinitionItemFormProps {
  type: 'dimension' | 'metric';
  onAdd: (entry: DefinitionEntry) => void;
}

const FORMULA_OPTIONS = [
  { value: 'COUNT', label: 'COUNT' },
  { value: 'SUM', label: 'SUM' },
  { value: 'AVG', label: 'AVG' },
  { value: 'MIN', label: 'MIN' },
  { value: 'MAX', label: 'MAX' },
  { value: 'DISTINCT', label: 'DISTINCT' },
];

const generateFormAlias = (text: string): string => {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
};

export const DefinitionItemForm: React.FC<DefinitionItemFormProps> = ({ type, onAdd }) => {
  const [label, setLabel] = useState('');
  const [formula, setFormula] = useState('');

  const alias = generateFormAlias(label);
  const isMetric = type === 'metric';
  const isValid = label.trim().length > 0 && (!isMetric || formula.length > 0);

  const handleAdd = useCallback(() => {
    if (!isValid) return;

    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const base = {
      id,
      name: label.trim(),
      alias: alias || generateFormAlias(label),
      label: label.trim(),
    };

    onAdd(isMetric ? { ...base, formula } : base);

    setLabel('');
    setFormula('');
  }, [label, alias, formula, isMetric, isValid, onAdd]);

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
