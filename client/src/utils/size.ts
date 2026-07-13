// Projects store size as a range (size_min/size_max); Resale units store a
// single value. Both render through these so "SQM" is never typed by hand.
export function formatSizeRange(min?: number | null, max?: number | null): string {
  if (min == null && max == null) return 'N/A';
  if (min != null && max != null && min !== max) {
    return `${min.toLocaleString()} - ${max.toLocaleString()} SQM`;
  }
  const value = min ?? max;
  return `${value!.toLocaleString()} SQM`;
}

export function formatSize(value?: number | null): string {
  if (value == null) return 'N/A';
  return `${value.toLocaleString()} SQM`;
}
