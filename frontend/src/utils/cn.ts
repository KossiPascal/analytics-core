import { clsx, type ClassValue } from 'clsx';

/**
 * Utility function to merge class names
 * Combines clsx for conditional classes
 *
 * @example
 * cn('base-class', condition && 'conditional-class', { 'object-class': true })
 */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}
