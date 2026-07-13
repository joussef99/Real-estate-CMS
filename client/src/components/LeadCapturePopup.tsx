import { apiJson } from '../utils/api';
import { useEffect, useRef, useState } from 'react';
import type React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from './Button';

// Home's lead form lives at the bottom of the page where most visitors never
// scroll, so this surfaces the same ask earlier — but only once real
// engagement is shown (scroll depth or a time delay), never on page load.
const SCROLL_TRIGGER_RATIO = 0.5;
const TIME_TRIGGER_MS = 25000;
const SESSION_SHOWN_KEY = 'livin_lead_popup_shown';
const SUBMITTED_KEY = 'livin_lead_popup_submitted';

export function LeadCapturePopup() {
  const [visible, setVisible] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const triggeredRef = useRef(false);

  useEffect(() => {
    const alreadyShownThisSession = sessionStorage.getItem(SESSION_SHOWN_KEY);
    const alreadySubmitted = localStorage.getItem(SUBMITTED_KEY);
    if (alreadyShownThisSession || alreadySubmitted) return;

    const trigger = () => {
      if (triggeredRef.current) return;
      triggeredRef.current = true;
      sessionStorage.setItem(SESSION_SHOWN_KEY, '1');
      setVisible(true);
      window.removeEventListener('scroll', handleScroll);
      window.clearTimeout(timer);
    };

    const handleScroll = () => {
      const documentHeight = document.documentElement.scrollHeight;
      if (documentHeight <= 0) return;
      const scrolledRatio = (window.scrollY + window.innerHeight) / documentHeight;
      if (scrolledRatio >= SCROLL_TRIGGER_RATIO) {
        trigger();
      }
    };

    const timer = window.setTimeout(trigger, TIME_TRIGGER_MS);
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.clearTimeout(timer);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await apiJson('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          message: 'Requested a callback from the lead popup.',
        }),
      });
      setSubmitted(true);
      localStorage.setItem(SUBMITTED_KEY, '1');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-x-0 bottom-0 z-50 sm:inset-x-auto sm:bottom-6 sm:right-6 sm:w-96"
        >
          <div className="relative rounded-t-3xl border border-zinc-200 bg-white p-6 shadow-2xl sm:rounded-3xl">
            <button
              type="button"
              onClick={() => setVisible(false)}
              aria-label="Close"
              className="absolute right-4 top-4 rounded-full p-1 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
            >
              <X className="h-4 w-4" />
            </button>

            {submitted ? (
              <div className="py-6 text-center">
                <p className="text-lg font-semibold text-zinc-900">Thank you!</p>
                <p className="mt-2 text-sm text-zinc-500">Our team will reach out within 24 hours.</p>
              </div>
            ) : (
              <>
                <p className="pr-6 text-lg font-semibold text-zinc-900">Looking for your next property?</p>
                <p className="mt-1 text-sm text-zinc-500">Leave your details and we'll call you back — no obligation.</p>
                <form onSubmit={handleSubmit} className="mt-4 space-y-3">
                  {error && (
                    <p className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>
                  )}
                  <input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-black"
                  />
                  <input
                    required
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+20 1xx xxx xxxx"
                    className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-black"
                  />
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@email.com"
                    className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-black"
                  />
                  <Button type="submit" size="lg" className="w-full" disabled={submitting}>
                    {submitting ? 'Sending...' : 'Request a Callback'}
                  </Button>
                </form>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
