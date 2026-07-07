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
    <div className={cn('mb-8 sm:mb-10 md:mb-12', className)}>
      {eyebrow && (
        <p className={cn('mb-2 text-xs uppercase tracking-[0.24em] text-gray-500 sm:mb-3', isCentered && 'text-center')}>
          {eyebrow}
        </p>
      )}
      <div className={cn('flex flex-col items-start gap-4 sm:flex-row sm:items-end sm:justify-between', isCentered && 'sm:flex-col sm:items-center')}>
        <div className={cn(isCentered && 'max-w-3xl text-center')}>
          <h2 className="text-2xl font-semibold text-slate-950 sm:text-3xl md:text-4xl">{title}</h2>
          {description && <p className="mt-3 text-sm text-gray-500 sm:mt-4 sm:text-base">{description}</p>}
        </div>
        {action}
      </div>
    </div>
  );
}
