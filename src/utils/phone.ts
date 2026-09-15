/**
 * Angola Phone Number Normalization and Validation
 * Standard format: +244 9XX XXX XXX
 */

export function normalizeAngolaPhone(input: string): string {
  if (!input) return '';
  // Keep only digits and plus sign
  let cleaned = input.replace(/[^\d+]/g, '');

  // Strip leading plus if present for uniform parsing
  if (cleaned.startsWith('+')) {
    cleaned = cleaned.slice(1);
  }

  // If starts with 244 and has more digits, handle country code
  if (cleaned.startsWith('244')) {
    cleaned = cleaned.slice(3);
  }

  // Remove leading 0 if someone entered 0923...
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.slice(1);
  }

  // Return standardized format +244XXXXXXXXX
  return `+244${cleaned}`;
}

export function isValidAngolaPhone(normalized: string): boolean {
  // Must be +244 followed by 9 digits starting with 9
  // Valid operator ranges in Angola:
  // Unitel: 92X, 93X, 94X
  // Africell: 95X
  // Movicel: 91X, 99X
  const regex = /^\+2449[1-5|9]\d{7}$/;
  return regex.test(normalized);
}

export function formatAngolaPhoneDisplay(normalized: string): string {
  if (!normalized.startsWith('+244') || normalized.length !== 13) {
    return normalized;
  }
  const digits = normalized.slice(4); // 9 digits
  return `+244 ${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
}
