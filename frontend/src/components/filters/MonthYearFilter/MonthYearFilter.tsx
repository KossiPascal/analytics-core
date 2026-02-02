import { useState, useEffect, useRef } from 'react';
import { MONTHS, getCurrentYear, getYears } from '@/models/OLD/old';
import styles from './MonthYearFilter.module.css';

interface MonthYearFilterProps {
  onChange: (month: string, year: number) => void;
  defaultMonth?: string;
  defaultYear?: number;
  showAllMonthsOption?: boolean;
  className?: string;
}

export function MonthYearFilter({
  onChange,
  defaultMonth,
  defaultYear,
  showAllMonthsOption = false,
  className = '',
}: MonthYearFilterProps) {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState<string>(
    defaultMonth || String(currentDate.getMonth() + 1).padStart(2, '0')
  );
  const [selectedYear, setSelectedYear] = useState<number>(
    defaultYear || getCurrentYear()
  );

  const years = getYears(2020);

  // Utiliser useRef pour éviter la boucle infinie causée par onChange non mémoïsé
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    onChangeRef.current(selectedMonth, selectedYear);
  }, [selectedMonth, selectedYear]);

  return (
    <div className={`${styles.container} ${className}`}>
      <div className={styles.filterGroup}>
        <label className={styles.label}>Mois</label>
        <select
          className={styles.select}
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
        >
          {showAllMonthsOption && (
            <option value="">Tous les mois</option>
          )}
          {MONTHS.map((month) => (
            <option key={month.value} value={month.value}>
              {month.label}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.filterGroup}>
        <label className={styles.label}>Annee</label>
        <select
          className={styles.select}
          value={selectedYear}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
        >
          {years.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export default MonthYearFilter;
