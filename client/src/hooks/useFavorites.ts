import { useCallback, useSyncExternalStore } from 'react';

export type FavoriteType = 'project' | 'resale';

export interface FavoriteItem {
  type: FavoriteType;
  id: number;
  title: string;
  slug?: string | null;
  image?: string | null;
  subtitle?: string | null;
  price?: string | null;
  savedAt: number;
}

const STORAGE_KEY = 'livin_favorites';

// There's no visitor account system on the public site, so favorites live in
// this browser's localStorage only (no cross-device sync). A lightweight
// snapshot of each item is stored at favorite-time (not just the id), so the
// Favorites page renders instantly with zero extra API calls — the tradeoff
// is it can go stale if the listing changes after being saved.
function readFavorites(): FavoriteItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

let cache: FavoriteItem[] = readFavorites();
const listeners = new Set<() => void>();

function emitChange() {
  listeners.forEach((listener) => listener());
}

function writeFavorites(next: FavoriteItem[]) {
  cache = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage full or unavailable (e.g. private browsing) — keep the in-memory
    // state so the UI still works for the rest of this session.
  }
  emitChange();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return cache;
}

function makeKey(type: FavoriteType, id: number) {
  return `${type}:${id}`;
}

export function isFavorited(type: FavoriteType, id: number): boolean {
  return cache.some((item) => item.type === type && item.id === id);
}

export function toggleFavorite(item: Omit<FavoriteItem, 'savedAt'>) {
  const key = makeKey(item.type, item.id);
  const exists = cache.some((existing) => makeKey(existing.type, existing.id) === key);
  if (exists) {
    writeFavorites(cache.filter((existing) => makeKey(existing.type, existing.id) !== key));
  } else {
    writeFavorites([{ ...item, savedAt: Date.now() }, ...cache]);
  }
}

export function removeFavorite(type: FavoriteType, id: number) {
  writeFavorites(cache.filter((existing) => !(existing.type === type && existing.id === id)));
}

/** Reactive list of all saved favorites — re-renders whenever any component toggles one. */
export function useFavoritesList(): FavoriteItem[] {
  return useSyncExternalStore(subscribe, getSnapshot, () => []);
}

/** Reactive favorited/not-favorited state + toggle for a single card. */
export function useFavorite(type: FavoriteType, id: number) {
  const list = useFavoritesList();
  const favorited = list.some((item) => item.type === type && item.id === id);

  const toggle = useCallback((snapshot: Omit<FavoriteItem, 'savedAt' | 'type' | 'id'>) => {
    toggleFavorite({ type, id, ...snapshot });
  }, [type, id]);

  return { favorited, toggle };
}
