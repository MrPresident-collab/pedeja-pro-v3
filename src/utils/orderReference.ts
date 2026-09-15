/**
 * Human-facing Pedejá order reference.
 *
 * The database UUID remains the internal identifier. Production orders should
 * provide order_reference (for example P-13496). The deterministic fallback
 * keeps legacy/demo records readable without exposing UUIDs in the UI.
 */
export function formatOrderReference(reference: string | null | undefined, id?: string | null, fallbackPrefix = 'P'): string {
  if (reference && /^[A-Z]-\d{5}$/.test(reference)) return reference;
  if (reference) return reference;
  if (!id) return 'P-00000';
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return `${fallbackPrefix}-${String(hash % 100000).padStart(5, '0')}`;
}
