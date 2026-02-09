import React from 'react';
import { FaTrash, FaTimes, FaTimesCircle } from 'react-icons/fa';

export interface RemoveIconProps {
  /** Taille de l'icone en pixels */
  size?: number;
  /** Couleur de l'icone (valeur CSS) */
  color?: string ;
  /** Variante d'icone */
  variant?: 'trash' | 'cross' | 'circle-cross';
  /** Classes CSS additionnelles */
  className?: string;
  /** Title pour l'accessibilite */
  title?: string;
}

export const RemoveIcon: React.FC<RemoveIconProps> = ({
  size = 14,
  color = 'red',
  variant = 'trash',
  className = '',
  title = 'Supprimer',
}) => {
  const props = {
    size,
    color,
    className,
    title,
  };

  if (variant === 'cross') {
    return <FaTimes {...props} />;
  }

  if (variant === 'circle-cross') {
    return <FaTimesCircle {...props} />;
  }

  return <FaTrash {...props} />;
};

export default RemoveIcon;
