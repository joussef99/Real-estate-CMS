import { AlertCircle, Inbox, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
  className?: string;
}

/**
 * Friendly, on-brand error state with an optional retry action. Deliberately
 * avoids surfacing raw technical error text by default — real site visitors
 * don't need to see "Failed to fetch" or a stack trace, just a way forward.
 */
export function ErrorState({ message, onRetry, className }: ErrorStateProps) {
  return (
    <div className={`rounded-2xl border border-red-200 bg-red-50 px-6 py-12 text-center ${className || ''}`}>
      <AlertCircle className="mx-auto mb-4 h-8 w-8 text-red-400" />
      <p className="text-red-700">{message || "We couldn't load this right now. Please check your connection and try again."}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-5 inline-flex items-center gap-2 rounded-full bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700"
        >
          <RefreshCw className="h-4 w-4" />
          Try Again
        </button>
      )}
    </div>
  );
}

interface EmptyStateProps {
  message: string;
  className?: string;
}

export function EmptyState({ message, className }: EmptyStateProps) {
  return (
    <div className={`rounded-2xl border border-zinc-100 bg-zinc-50 px-6 py-16 text-center ${className || ''}`}>
      <Inbox className="mx-auto mb-4 h-8 w-8 text-zinc-300" />
      <p className="text-zinc-500">{message}</p>
    </div>
  );
}
