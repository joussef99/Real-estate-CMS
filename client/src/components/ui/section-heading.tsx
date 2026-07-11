import { ReactNode } from 'react';
import { cn } from '../../types';

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: 'left' | 'center';
  action?: ReactNode;
  className?: string;
  /** 'light' text for use on dark section backgrounds. Defaults to dark text for light backgrounds. */
  tone?: 'dark' | 'light';
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'left',
  action,
  className,
  tone = 'dark',
}: SectionHeadingProps) {
  const isCentered = align === 'center';
  const isLight = tone === 'light';

  return (
    <div className={cn('mb-8 sm:mb-10 md:mb-12', className)}>
      {eyebrow && (
        // On mobile the eyebrow is a highlighted pill so a section reads as
        // its own labeled block while scrolling — desktop keeps the plain
        // understated label since there's more surrounding context there.
        <div className={cn('mb-3 flex justify-center sm:mb-2 sm:justify-start', isCentered && 'sm:justify-center')}>
          <span
            className={cn(
              'inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em]',
              'sm:rounded-none sm:bg-transparent sm:px-0 sm:py-0 sm:text-xs sm:font-normal sm:tracking-[0.24em]',
              isLight
                ? 'bg-white/10 text-white sm:bg-transparent sm:text-white/50'
                : 'bg-slate-900/5 text-slate-700 sm:bg-transparent sm:text-gray-500',
            )}
          >
            {eyebrow}
          </span>
        </div>
      )}
      <div
        className={cn(
          'flex flex-col items-center gap-4 text-center sm:flex-row sm:items-end sm:justify-between sm:text-left',
          isCentered && 'sm:flex-col sm:items-center sm:text-center',
        )}
      >
        <div className={cn(isCentered && 'sm:max-w-3xl')}>
          <h2 className={cn('text-2xl font-semibold sm:text-3xl md:text-4xl', isLight ? 'text-white' : 'text-slate-950')}>{title}</h2>
          {description && (
            <p className={cn('mt-3 text-sm sm:mt-4 sm:text-base', isLight ? 'text-white/70' : 'text-gray-500')}>{description}</p>
          )}
        </div>
        {action}
      </div>
    </div>
  );
}
