import { ReactNode } from 'react';
import { cn } from '../../types';

interface GlassPanelProps {
  className?: string;
  children: ReactNode;
}

export function GlassPanel({ className, children }: GlassPanelProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-white/30 bg-white/20 backdrop-blur-xl shadow-lg transition-all duration-300',
        className
      )}
    >
      {children}
    </div>
  );
}
