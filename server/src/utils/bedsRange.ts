// `beds` is stored as free text ("1-6 Beds", "2", "Studio") rather than a
// structured range, so filtering by exact bedroom count needs to parse the
// numbers out of it rather than doing a substring match (a "3" filter should
// match a "1-6 Beds" project, but `contains: "3"` would miss it entirely).
export function getBedsBounds(beds?: string | null): { min: number | null; max: number | null } {
  if (!beds) return { min: null, max: null };

  const matches = beds.match(/\d+(\.\d+)?/g);
  if (!matches || matches.length === 0) return { min: null, max: null };

  const numbers = matches.map(Number).filter(Number.isFinite);
  if (numbers.length === 0) return { min: null, max: null };

  return { min: Math.min(...numbers), max: Math.max(...numbers) };
}

// `filterValue` is one of "1".."4" (exact bedroom count) or "5+" (5 or more).
export function bedsMatchesFilter(beds: string | null | undefined, filterValue: string): boolean {
  const { min, max } = getBedsBounds(beds);
  if (min === null || max === null) return false;

  const trimmed = filterValue.trim();
  const isPlus = trimmed.endsWith("+");
  const requestedMin = parseFloat(trimmed);
  if (!Number.isFinite(requestedMin)) return false;
  const requestedMax = isPlus ? Infinity : requestedMin;

  return max >= requestedMin && min <= requestedMax;
}
