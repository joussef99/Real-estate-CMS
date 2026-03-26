type DownPaymentSource = {
  downPayment?: unknown;
  down_payment?: unknown;
} | null | undefined;

export type NormalizedDownPayment = {
  raw: unknown;
  value: number | null;
  hasValue: boolean;
  isValid: boolean;
};

export function normalizeDownPayment(source: DownPaymentSource): NormalizedDownPayment {
  const raw = source?.downPayment ?? source?.down_payment ?? null;
  const hasValue = raw !== null && raw !== undefined && raw !== '';

  if (!hasValue) {
    return {
      raw,
      value: null,
      hasValue: false,
      isValid: false,
    };
  }

  const parsed = Number(raw);
  const isValid = Number.isFinite(parsed);

  return {
    raw,
    value: isValid ? parsed : null,
    hasValue: true,
    isValid,
  };
}

export function formatEGP(value: number): string {
  return `${value.toLocaleString()} EGP`;
}