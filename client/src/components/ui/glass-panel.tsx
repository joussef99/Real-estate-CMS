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
        'rounded-2xl border border-slate-300/35 bg-slate-900/12 backdrop-blur-xl shadow-lg transition-all duration-300',
        className
      )}
    >
      {children}
    </div>
  );
}
