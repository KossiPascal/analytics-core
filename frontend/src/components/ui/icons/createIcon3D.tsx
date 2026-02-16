import React, { useId } from 'react';
import type { Icon3DProps, ColorSet, IconVariant } from './types';
import { colorMap } from './types';
import { cn } from '@/utils/cn';
import styles from './Icon3D.module.css';

/**
 * Configuration d'un chemin SVG pour une icône 3D
 */
export interface IconPathDef {
  /** Données du chemin SVG (attribut d) */
  d: string;
  /** Mode de remplissage : fill (défaut) ou stroke */
  mode?: 'fill' | 'stroke';
  /** Épaisseur du trait (si mode = stroke) */
  strokeWidth?: number;
  /** Règle de remplissage SVG */
  fillRule?: 'nonzero' | 'evenodd';
  /** Règle de clip SVG */
  clipRule?: 'nonzero' | 'evenodd';
}

/**
 * Rendu des définitions SVG (gradients, filtres) pour l'effet 3D
 */
function renderDefs(uid: string, colors: ColorSet, variant: IconVariant) {
  return (
    <defs>
      {/* Gradient principal : haut clair → bas sombre */}
      <linearGradient id={`${uid}-main`} x1="0" y1="0" x2="0.3" y2="1">
        <stop offset="0%" stopColor={colors.light} />
        <stop offset="100%" stopColor={colors.dark} />
      </linearGradient>

      {/* Gradient face latérale (solid) */}
      <linearGradient id={`${uid}-side`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor={colors.dark} />
        <stop offset="100%" stopColor={colors.base} stopOpacity="0.6" />
      </linearGradient>

      {/* Gradient verre (glass) */}
      <linearGradient id={`${uid}-glass`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.45" />
        <stop offset="50%" stopColor="#ffffff" stopOpacity="0.1" />
        <stop offset="100%" stopColor="#ffffff" stopOpacity="0.0" />
      </linearGradient>

      {/* Reflet supérieur */}
      <linearGradient id={`${uid}-highlight`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.5" />
        <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
      </linearGradient>

      {/* Filtre ombre portée */}
      <filter id={`${uid}-shadow`} x="-20%" y="-10%" width="150%" height="150%">
        <feDropShadow dx="0.5" dy="1.5" stdDeviation="1.2" floodColor={colors.dark} floodOpacity="0.4" />
      </filter>

      {/* Filtre glow (glass) */}
      <filter id={`${uid}-glow`} x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" result="blur" />
        <feColorMatrix in="blur" type="matrix"
          values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.4 0" result="glow" />
        <feMerge>
          <feMergeNode in="glow" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      {/* Clip pour le reflet (moitié supérieure) */}
      <clipPath id={`${uid}-clip-top`}>
        <rect x="0" y="0" width="24" height="12" />
      </clipPath>
    </defs>
  );
}

/**
 * Rendu d'un chemin SVG individuel avec le style 3D approprié
 */
function renderPath(
  path: IconPathDef,
  uid: string,
  colors: ColorSet,
  variant: IconVariant,
  layer: 'shadow' | 'main' | 'highlight'
) {
  const isStroke = path.mode === 'stroke';
  const sw = path.strokeWidth ?? 2;

  const baseProps: React.SVGProps<SVGPathElement> = {
    d: path.d,
    fillRule: path.fillRule,
    clipRule: path.clipRule,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  if (layer === 'shadow') {
    return isStroke
      ? <path {...baseProps} fill="none" stroke={colors.dark} strokeWidth={sw} opacity={0.3} transform="translate(0.6, 1.2)" />
      : <path {...baseProps} fill={colors.dark} stroke="none" opacity={0.3} transform="translate(0.6, 1.2)" />;
  }

  if (layer === 'main') {
    switch (variant) {
      case 'gradient':
        return isStroke
          ? <path {...baseProps} fill="none" stroke={`url(#${uid}-main)`} strokeWidth={sw} filter={`url(#${uid}-shadow)`} />
          : <path {...baseProps} fill={`url(#${uid}-main)`} stroke="none" filter={`url(#${uid}-shadow)`} />;
      case 'solid':
        return isStroke
          ? <path {...baseProps} fill="none" stroke={colors.base} strokeWidth={sw} />
          : <path {...baseProps} fill={colors.base} stroke="none" />;
      case 'glass':
        return isStroke
          ? <path {...baseProps} fill="none" stroke={colors.base} strokeWidth={sw} opacity={0.7} filter={`url(#${uid}-glow)`} />
          : <path {...baseProps} fill={colors.base} stroke="none" opacity={0.6} filter={`url(#${uid}-glow)`} />;
    }
  }

  // highlight layer
  if (variant === 'gradient') {
    return isStroke
      ? <path {...baseProps} fill="none" stroke={`url(#${uid}-highlight)`} strokeWidth={sw * 0.6} clipPath={`url(#${uid}-clip-top)`} />
      : <path {...baseProps} fill={`url(#${uid}-highlight)`} stroke="none" clipPath={`url(#${uid}-clip-top)`} opacity={0.4} />;
  }
  if (variant === 'glass') {
    return isStroke
      ? <path {...baseProps} fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth={sw * 0.5} clipPath={`url(#${uid}-clip-top)`} />
      : <path {...baseProps} fill={`url(#${uid}-glass)`} stroke="rgba(255,255,255,0.25)" strokeWidth={0.5} />;
  }
  // solid : side face as depth
  return isStroke
    ? <path {...baseProps} fill="none" stroke={colors.dark} strokeWidth={sw} opacity={0.5} transform="translate(0.8, 1)" />
    : <path {...baseProps} fill={colors.dark} stroke="none" opacity={0.5} transform="translate(0.8, 1)" />;
}

/**
 * Factory pour créer un composant d'icône 3D à partir de chemins SVG
 *
 * @param displayName - Nom du composant React
 * @param defaultTitle - Titre d'accessibilité par défaut
 * @param paths - Chemins SVG définissant la forme de l'icône
 * @param viewBox - ViewBox SVG (défaut: "0 0 24 24")
 */
export function createIcon3D(
  displayName: string,
  defaultTitle: string,
  paths: IconPathDef[],
  viewBox = '0 0 24 24'
): React.FC<Icon3DProps> {
  const Icon3D: React.FC<Icon3DProps> = ({
    size = 24,
    color = 'primary',
    variant = 'gradient',
    className,
    title = defaultTitle,
    onClick,
  }) => {
    const reactId = useId();
    const uid = `icon3d-${reactId.replace(/:/g, '')}`;
    const colors = colorMap[color];

    const mergedClassName = cn(
      styles.icon3d,
      styles[variant],
      styles[color],
      onClick && styles.clickable,
      className,
    );

    return (
      <svg
        width={size}
        height={size}
        viewBox={viewBox}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={mergedClassName}
        onClick={onClick}
        role="img"
        aria-label={title}
      >
        <title>{title}</title>
        {renderDefs(uid, colors, variant)}

        {/* Layer 1: Ombre / Profondeur (solid=face latérale) */}
        <g>
          {variant === 'solid'
            ? paths.map((p, i) => <React.Fragment key={`side-${i}`}>{renderPath(p, uid, colors, variant, 'highlight')}</React.Fragment>)
            : paths.map((p, i) => <React.Fragment key={`shadow-${i}`}>{renderPath(p, uid, colors, variant, 'shadow')}</React.Fragment>)
          }
        </g>

        {/* Layer 2: Forme principale */}
        <g>
          {paths.map((p, i) => (
            <React.Fragment key={`main-${i}`}>
              {renderPath(p, uid, colors, variant, 'main')}
            </React.Fragment>
          ))}
        </g>

        {/* Layer 3: Reflet / Highlight (gradient & glass uniquement) */}
        {variant !== 'solid' && (
          <g>
            {paths.map((p, i) => (
              <React.Fragment key={`hl-${i}`}>
                {renderPath(p, uid, colors, variant, 'highlight')}
              </React.Fragment>
            ))}
          </g>
        )}
      </svg>
    );
  };

  Icon3D.displayName = displayName;
  return Icon3D;
}

export default createIcon3D;
