// Projects store price as a range (price_min/price_max); Resale units store a
// single value (with an optional price_display override for rare marketing
// cases like "Negotiable"). Both render through these so nobody hand-types
// "5M EGP" — the compact notation is generated automatically.
function compactNumber(value: number): string {
  if (value >= 1_000_000) {
    const millions = value / 1_000_000;
    return `${Number.isInteger(millions) ? millions : millions.toFixed(1)}M`;
  }
  if (value >= 1_000) {
    const thousands = value / 1_000;
    return `${Number.isInteger(thousands) ? thousands : thousands.toFixed(1)}K`;
  }
  return value.toLocaleString();
}

export function formatPriceRange(min?: number | null, max?: number | null): string {
  if (min == null && max == null) return 'Contact for details';
  if (min != null && max != null && min !== max) {
    return `${compactNumber(min)} - ${compactNumber(max)} EGP`;
  }
  const value = (min ?? max) as number;
  return `${compactNumber(value)} EGP`;
}

export function formatPrice(value?: number | null, override?: string | null): string {
  const trimmedOverride = override?.trim();
  if (trimmedOverride) return trimmedOverride;
  if (value == null) return 'Price on request';
  return `${compactNumber(value)} EGP`;
}
