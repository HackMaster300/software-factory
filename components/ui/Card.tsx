import React from 'react';
import { cn } from '../../lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Renders without the outer border/background — for a card nested inside another Card. */
  flat?: boolean;
  interactive?: boolean;
}

/**
 * Shared surface primitive: one consistent bg/border/radius/padding
 * combination instead of the ad-hoc `bg-[#181a20] border border-[#2b303d]
 * rounded-xl p-4` strings repeated across every view. Use `flat` for content
 * nested inside another Card (a divider + no border reads clearer than a
 * box-in-a-box).
 */
export const Card: React.FC<CardProps> = ({ flat, interactive, className, ...props }) => {
  return (
    <div
      className={cn(
        'rounded-lg p-4',
        flat
          ? 'bg-transparent'
          : 'bg-[#181a20] border border-[#2b303d]',
        interactive && 'transition-colors hover:border-blue-500/40 cursor-pointer',
        className
      )}
      {...props}
    />
  );
};

export const CardDivider: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div className={cn('border-t border-[#262a36] my-3', className)} {...props} />
);
