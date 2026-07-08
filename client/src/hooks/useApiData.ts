import { useCallback, useEffect, useRef, useState } from 'react';
import { apiJson } from '../utils/api';

type CacheEntry<T> = { data: T };

// Module-level, in-memory, session-lifetime cache shared by every useApiData
// call. Keyed by request path, so revisiting a page (or a paginated/filtered
// URL) already fetched this session renders instantly instead of refetching.
const cache = new Map<string, CacheEntry<any>>();

export interface UseApiDataResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Cached data-fetching hook for public pages.
 *
 * - Cache hit: data renders immediately (no loading flash), then a silent
 *   background revalidation runs and swaps in fresh data if it changed.
 * - Cache miss: `loading` is true until the fetch resolves.
 * - `refetch()` forces a fresh (non-cached) fetch — wire it to a "Try again"
 *   button in an error state.
 *
 * Pass `null` for `path` to skip fetching (e.g. while a route param isn't
 * ready yet).
 */
export function useApiData<T>(path: string | null, normalize: (raw: any) => T = (raw) => raw as T): UseApiDataResult<T> {
  const normalizeRef = useRef(normalize);
  normalizeRef.current = normalize;

  const getCached = useCallback((): CacheEntry<T> | undefined => (path ? cache.get(path) : undefined), [path]);

  const [data, setData] = useState<T | null>(() => getCached()?.data ?? null);
  const [loading, setLoading] = useState<boolean>(() => Boolean(path) && !getCached());
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback((targetPath: string, silent: boolean, signal: AbortSignal) => {
    if (!silent) {
      setLoading(true);
      setError(null);
    }

    apiJson<any>(targetPath, { signal })
      .then((raw) => {
        if (signal.aborted) return;
        const normalized = normalizeRef.current(raw);
        cache.set(targetPath, { data: normalized });
        setData(normalized);
        setLoading(false);
      })
      .catch((err) => {
        if (signal.aborted) return;
        // A failed background revalidation just keeps showing the cached
        // data — only a foreground (non-cached) fetch surfaces an error.
        if (!silent) {
          setError(err?.message || 'Something went wrong.');
          setLoading(false);
        }
      });
  }, []);

  useEffect(() => {
    if (!path) {
      setData(null);
      setLoading(false);
      setError(null);
      return;
    }

    const controller = new AbortController();
    const existing = cache.get(path);

    if (existing) {
      setData(existing.data);
      setLoading(false);
      setError(null);
      fetchData(path, true, controller.signal);
    } else {
      setData(null);
      fetchData(path, false, controller.signal);
    }

    return () => controller.abort();
  }, [path, fetchData]);

  const refetch = useCallback(() => {
    if (!path) return;
    const controller = new AbortController();
    fetchData(path, false, controller.signal);
  }, [path, fetchData]);

  return { data, loading, error, refetch };
}
