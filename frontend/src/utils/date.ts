/**
 * Date utility functions
 */

export interface Month {
  labelEN: string;
  labelFR: string;
  id: string;
  uid: number;
}

/**
 * Get current year
 */
export function currentYear(): number {
  return new Date().getFullYear();
}

/**
 * Get current month
 */
export function currentMonth(): Month {
  const month = new Date().getMonth() + 1;
  const monthStr = month.toString().padStart(2, '0');
  const months = getMonthsList();
  return months.find(m => m.id === monthStr) || months[0];
}

/**
 * Get list of months
 */
export function getMonthsList(): Month[] {
  return [
    { labelEN: 'January', labelFR: 'Janvier', id: '01', uid: 1 },
    { labelEN: 'February', labelFR: 'Février', id: '02', uid: 2 },
    { labelEN: 'March', labelFR: 'Mars', id: '03', uid: 3 },
    { labelEN: 'April', labelFR: 'Avril', id: '04', uid: 4 },
    { labelEN: 'May', labelFR: 'Mai', id: '05', uid: 5 },
    { labelEN: 'June', labelFR: 'Juin', id: '06', uid: 6 },
    { labelEN: 'July', labelFR: 'Juillet', id: '07', uid: 7 },
    { labelEN: 'August', labelFR: 'Août', id: '08', uid: 8 },
    { labelEN: 'September', labelFR: 'Septembre', id: '09', uid: 9 },
    { labelEN: 'October', labelFR: 'Octobre', id: '10', uid: 10 },
    { labelEN: 'November', labelFR: 'Novembre', id: '11', uid: 11 },
    { labelEN: 'December', labelFR: 'Décembre', id: '12', uid: 12 },
  ];
}

/**
 * Get list of years from 2020 to current year
 */
export function getYearsList(): number[] {
  const current = currentYear();
  const years: number[] = [];
  for (let year = 2020; year <= current; year++) {
    years.push(year);
  }
  return years;
}

/**
 * Check if value is not null and not empty
 */
export function notNull(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'string') return value.trim().length > 0;
  return true;
}
