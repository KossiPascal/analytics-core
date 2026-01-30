import { format, formatDistanceToNow, parseISO, isValid } from 'date-fns';
import { fr } from 'date-fns/locale';

// ============================================
// DATE FORMATTERS
// ============================================

/**
 * Format date to display format
 */
export function formatDate(date: string | Date | null | undefined, pattern = 'dd/MM/yyyy'): string {
  if (!date) return '-';

  const dateObj = typeof date === 'string' ? parseISO(date) : date;

  if (!isValid(dateObj)) return '-';

  return format(dateObj, pattern, { locale: fr });
}

/**
 * Format date with time
 */
export function formatDateTime(date: string | Date | null | undefined): string {
  return formatDate(date, 'dd/MM/yyyy HH:mm');
}

/**
 * Format date to relative time (e.g., "il y a 2 heures")
 */
export function formatRelativeTime(date: string | Date | null | undefined): string {
  if (!date) return '-';

  const dateObj = typeof date === 'string' ? parseISO(date) : date;

  if (!isValid(dateObj)) return '-';

  return formatDistanceToNow(dateObj, { addSuffix: true, locale: fr });
}

/**
 * Format month and year
 */
export function formatMonthYear(month: number, year: number): string {
  const date = new Date(year, month - 1, 1);
  return format(date, 'MMMM yyyy', { locale: fr });
}

// ============================================
// NUMBER FORMATTERS
// ============================================

/**
 * Format number with locale
 */
export function formatNumber(value: number | null | undefined, options?: Intl.NumberFormatOptions): string {
  if (value === null || value === undefined) return '-';

  return new Intl.NumberFormat('fr-FR', options).format(value);
}

/**
 * Format number as percentage
 */
export function formatPercent(value: number | null | undefined, decimals = 1): string {
  if (value === null || value === undefined) return '-';

  return `${value.toFixed(decimals)}%`;
}

/**
 * Format number as currency
 */
export function formatCurrency(value: number | null | undefined, currency = 'GNF'): string {
  if (value === null || value === undefined) return '-';

  return new Intl.NumberFormat('fr-GN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Format large numbers (e.g., 1.2K, 1.5M)
 */
export function formatCompactNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) return '-';

  return new Intl.NumberFormat('fr-FR', {
    notation: 'compact',
    compactDisplay: 'short',
  }).format(value);
}

// ============================================
// PHONE FORMATTERS
// ============================================

/**
 * Format Guinea phone number
 */
export function formatGuineaPhone(phone: string | null | undefined): string {
  if (!phone) return '-';

  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');

  // Format as +224 XXX XX XX XX
  if (digits.length === 9) {
    return `+224 ${digits.slice(0, 3)} ${digits.slice(3, 5)} ${digits.slice(5, 7)} ${digits.slice(7, 9)}`;
  }

  if (digits.length === 12 && digits.startsWith('224')) {
    return `+${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 8)} ${digits.slice(8, 10)} ${digits.slice(10, 12)}`;
  }

  return phone;
}

// ============================================
// TEXT FORMATTERS
// ============================================

/**
 * Capitalize first letter
 */
export function capitalize(text: string | null | undefined): string {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

/**
 * Capitalize all words
 */
export function capitalizeWords(text: string | null | undefined): string {
  if (!text) return '';
  return text
    .split(' ')
    .map(word => capitalize(word))
    .join(' ');
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string | null | undefined, maxLength: number): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
}

/**
 * Format role name for display
 */
export function formatRoleName(role: string | null | undefined): string {
  if (!role) return '-';

  return role
    .replace(/_/g, ' ')
    .split(' ')
    .map(word => capitalize(word))
    .join(' ');
}

// ============================================
// FILE SIZE FORMATTERS
// ============================================

/**
 * Format bytes to human readable size
 */
export function formatFileSize(bytes: number | null | undefined): string {
  if (bytes === null || bytes === undefined) return '-';

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}
