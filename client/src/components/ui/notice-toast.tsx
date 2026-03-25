import { CheckCircle2, Info } from 'lucide-react';

type NoticeTone = 'info' | 'success';

export function NoticeToast({ message, tone = 'info' }: { message: string | null; tone?: NoticeTone }) {
  if (!message) return null;

  const Icon = tone === 'success' ? CheckCircle2 : Info;
  const toneClasses = tone === 'success'
    ? 'border-emerald-200/70 bg-emerald-50/90 text-emerald-900'
    : 'border-sky-200/70 bg-sky-50/90 text-slate-900';

  return (
    <div className={`fixed right-6 top-6 z-50 max-w-sm rounded-2xl border px-4 py-3 shadow-2xl backdrop-blur-xl ${toneClasses}`}>
      <div className="flex items-start gap-3">
        <Icon className="mt-0.5 h-4 w-4 shrink-0" />
        <p className="text-sm font-medium leading-5">{message}</p>
      </div>
    </div>
  );
}