import { useState } from 'react';
import type React from 'react';
import { Check, Share2 } from 'lucide-react';

interface ShareButtonProps {
  url: string;
  title: string;
  className?: string;
  /** 'overlay' for glass buttons on top of an image (cards); 'solid' for plain page backgrounds (detail headers). */
  variant?: 'overlay' | 'solid';
}

const VARIANT_CLASSES = {
  overlay: 'border border-white/35 bg-white/20 text-white backdrop-blur-xl hover:bg-white/35',
  solid: 'border border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100',
};

export function ShareButton({ url, title, className = '', variant = 'overlay' }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const absoluteUrl = url.startsWith('http') ? url : `${window.location.origin}${url}`;

    // Native share sheet on mobile/supporting browsers; clipboard copy elsewhere.
    if (navigator.share) {
      try {
        await navigator.share({ title, url: absoluteUrl });
      } catch {
        // User cancelled the share sheet — not an error.
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(absoluteUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked (permissions) — nothing more we can do silently.
    }
  };

  return (
    <button
      type="button"
      aria-label="Share this listing"
      onClick={handleShare}
      className={`relative flex h-9 w-9 items-center justify-center rounded-full transition-colors ${VARIANT_CLASSES[variant]} ${className}`}
    >
      {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Share2 className="h-4 w-4" />}
      {copied && (
        <span className="absolute -bottom-8 right-0 whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1 text-xs font-medium text-white shadow-lg">
          Link copied
        </span>
      )}
    </button>
  );
}
