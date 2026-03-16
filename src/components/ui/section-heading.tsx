import { ReactNode } from 'react';
import { cn } from '../../types';

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: 'left' | 'center';
  action?: ReactNode;
  className?: string;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'left',
  action,
  className,
}: SectionHeadingProps) {
  const isCentered = align === 'center';

  return (
    <div className={cn('mb-12', className)}>
      {eyebrow && (
        <p className={cn('mb-3 text-xs uppercase tracking-[0.24em] text-gray-500', isCentered && 'text-center')}>
          {eyebrow}
        </p>
      )}
      <div className={cn('flex items-end justify-between gap-4', isCentered && 'flex-col items-center')}>
        <div className={cn(isCentered && 'max-w-3xl text-center')}>
          <h2 className="text-3xl font-semibold text-slate-950 md:text-4xl">{title}</h2>
          {description && <p className="mt-4 text-gray-500">{description}</p>}
        </div>
        {action}
      </div>
    </div>
  );
}
