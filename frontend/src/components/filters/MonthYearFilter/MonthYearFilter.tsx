import { useState, useEffect, useRef } from 'react';
import { currentYear, getYearsList } from '@/utils/date';
import styles from './MonthYearFilter.module.css';

const MONTHS = [
  { value: '01', label: 'Janvier' },
  { value: '02', label: 'Février' },
  { value: '03', label: 'Mars' },
  { value: '04', label: 'Avril' },
  { value: '05', label: 'Mai' },
  { value: '06', label: 'Juin' },
  { value: '07', label: 'Juillet' },
  { value: '08', label: 'Août' },
  { value: '09', label: 'Septembre' },
  { value: '10', label: 'Octobre' },
  { value: '11', label: 'Novembre' },
  { value: '12', label: 'Décembre' },
];

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
    defaultYear || currentYear()
  );

  const years = getYearsList();

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
