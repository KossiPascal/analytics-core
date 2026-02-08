import { ReactNode } from 'react';
import styles from './Badge.module.css';

export type BadgeVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info';
export type BadgeSize = 'sm' | 'md' | 'lg';

export interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  rounded?: boolean;
  icon?: ReactNode;
  className?: string;
}

export function Badge({
  children,
  variant = 'primary',
  size = 'md',
  rounded = true,
  icon,
  className = '',
}: BadgeProps) {
  const classes = [
    styles.badge,
    styles[variant],
    styles[size],
    rounded ? styles.rounded : styles.square,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={classes}>
      {icon && <span className={styles.icon}>{icon}</span>}
      {children}
    </span>
  );
}

// Variantes prédéfinies pour les cas courants
export function BadgeSuccess({ children, ...props }: Omit<BadgeProps, 'variant'>) {
  return <Badge variant="success" {...props}>{children}</Badge>;
}

export function BadgeDanger({ children, ...props }: Omit<BadgeProps, 'variant'>) {
  return <Badge variant="danger" {...props}>{children}</Badge>;
}

export function BadgeWarning({ children, ...props }: Omit<BadgeProps, 'variant'>) {
  return <Badge variant="warning" {...props}>{children}</Badge>;
}

export function BadgeInfo({ children, ...props }: Omit<BadgeProps, 'variant'>) {
  return <Badge variant="info" {...props}>{children}</Badge>;
}

// Badge pour les statuts actif/inactif
export function StatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <Badge variant={isActive ? 'success' : 'danger'} size="sm">
      {isActive ? 'Actif' : 'Inactif'}
    </Badge>
  );
}

// Badge pour les statuts actif/inactif
export function SyncBadge({ sync }: { sync: boolean }) {
  return (
    <Badge variant={sync ? 'success' : 'danger'} size="sm">
      {sync ? 'SYNC' : ''}
    </Badge>
  );
}

// Badge pour les permissions CRUD
export function CrudBadge({ label, title }: { label: string; title: string }) {
  return (
    <span className={styles.crudBadge} title={title}>
      {label}
    </span>
  );
}

// Badge pour les permissions/rôles
export function PermissionBadge({ children }: { children: ReactNode }) {
  return (
    <span className={styles.permBadge}>
      {children}
    </span>
  );
}

// Badge pour les rôles utilisateur
export function RoleBadge({ children }: { children: ReactNode }) {
  return (
    <span className={styles.roleBadge}>
      {children}
    </span>
  );
}
