import React from 'react';
import { cn } from '../../lib/utils';

export type BadgeTone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'info';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
}

const toneClasses: Record<BadgeTone, string> = {
  neutral: 'bg-[#1c2029] text-gray-400 border-[#2e3340]',
  brand: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  danger: 'bg-red-500/10 text-red-400 border-red-500/20',
  info: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
};

/**
 * Small status/label pill. Tone should communicate real state (success /
 * warning / danger / info) or the app's one brand accent — not be picked
 * decoratively per-card.
 */
export const Badge: React.FC<BadgeProps> = ({ tone = 'neutral', className, ...props }) => {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] font-mono font-semibold uppercase tracking-wide',
        toneClasses[tone],
        className
      )}
      {...props}
    />
  );
};
