import { useEffect, useState } from 'react';

const PENDING_NOTICE_KEY = 'admin_temp_media_notice';

export function queueCleanupNotice(message: string) {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(PENDING_NOTICE_KEY, message);
}

export function useCleanupNotice(timeoutMs = 2600) {
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const pendingNotice = sessionStorage.getItem(PENDING_NOTICE_KEY);
    if (pendingNotice) {
      sessionStorage.removeItem(PENDING_NOTICE_KEY);
      setNotice(pendingNotice);
    }
  }, []);

  useEffect(() => {
    if (!notice) return;

    const timeoutId = window.setTimeout(() => {
      setNotice(null);
    }, timeoutMs);

    return () => window.clearTimeout(timeoutId);
  }, [notice, timeoutMs]);

  return {
    notice,
    showNotice: setNotice,
  };
}