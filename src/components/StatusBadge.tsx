import React from 'react';
import { Badge } from '@/components/ui/badge';
import { StatusBadgeProps } from '@/types/gitlab';
import { cn } from '@/lib/utils';

/**
 * Utility function to determine text color based on background color
 * @param hexColor - Hex color string (e.g., '#ff6b6b')
 * @returns 'black' or 'white' based on contrast
 */
const getContrastColor = (hexColor: string): string => {
  // Remove # if present
  const color = hexColor.replace('#', '');
  
  // Convert to RGB
  const r = parseInt(color.slice(0, 2), 16);
  const g = parseInt(color.slice(2, 4), 16);
  const b = parseInt(color.slice(4, 6), 16);
  
  // Calculate relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  return luminance > 0.5 ? '#000000' : '#ffffff';
};

/**
 * Utility function to normalize color format
 * @param color - Color string in various formats
 * @returns Normalized hex color or null
 */
const normalizeColor = (color?: string): string | null => {
  if (!color) return null;
  
  // If already a hex color
  if (color.startsWith('#')) {
    return color.length === 7 ? color : null;
  }
  
  // If hex without #
  if (/^[0-9A-Fa-f]{6}$/.test(color)) {
    return `#${color}`;
  }
  
  // Named colors mapping (common GitLab colors)
  const namedColors: Record<string, string> = {
    'red': '#ff6b6b',
    'blue': '#4dabf7',
    'green': '#51cf66',
    'yellow': '#ffd43b',
    'orange': '#ff8787',
    'purple': '#9775fa',
    'gray': '#868e96',
    'grey': '#868e96',
    'pink': '#f783ac',
    'teal': '#20c997',
    'cyan': '#22b8cf'
  };
  
  return namedColors[color.toLowerCase()] || null;
};

/**
 * StatusBadge component for displaying issue statuses with appropriate colors and styling
 */
export const StatusBadge: React.FC<StatusBadgeProps> = ({ 
  status, 
  variant, 
  color, 
  className 
}) => {
  // Normalize and validate color
  const normalizedColor = normalizeColor(color);
  
  // Determine badge variant and styles
  const getBadgeProps = () => {
    switch (variant) {
      case 'status':
        if (normalizedColor) {
          // Custom color for status labels
          const textColor = getContrastColor(normalizedColor);
          return {
            variant: 'outline' as const,
            style: {
              backgroundColor: normalizedColor,
              color: textColor,
              borderColor: normalizedColor
            }
          };
        }
        // Fallback for status without color
        return { variant: 'default' as const };
        
      case 'closed':
        return { variant: 'secondary' as const };
        
      case 'opened':
      default:
        return { variant: 'default' as const };
    }
  };
  
  const badgeProps = getBadgeProps();
  
  return (
    <Badge 
      variant={badgeProps.variant}
      style={badgeProps.style}
      className={cn('font-medium text-xs', className)}
    >
      {status}
    </Badge>
  );
};

export default StatusBadge;