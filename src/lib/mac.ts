const MAC_REGEX = /^([0-9a-fA-F]{2})[:\-]?([0-9a-fA-F]{2})[:\-]?([0-9a-fA-F]{2})[:\-]?([0-9a-fA-F]{2})[:\-]?([0-9a-fA-F]{2})[:\-]?([0-9a-fA-F]{2})$/;

export function normalizeMac(input: string): string | null {
  const trimmed = input.trim();
  const match = trimmed.match(MAC_REGEX);
  if (!match) return null;
  return [match[1], match[2], match[3], match[4], match[5], match[6]]
    .map((b) => b.toLowerCase())
    .join(':');
}

export function isValidMac(input: string): boolean {
  return normalizeMac(input) !== null;
}

export function isMulticast(mac: string): boolean {
  const normalized = normalizeMac(mac);
  if (!normalized) return false;
  const firstByte = parseInt(normalized.split(':')[0], 16);
  return (firstByte & 0x01) === 1;
}

export function isBroadcast(mac: string): boolean {
  const normalized = normalizeMac(mac);
  return normalized === 'ff:ff:ff:ff:ff:ff';
}

export function formatMacForDisplay(mac: string): string {
  const normalized = normalizeMac(mac);
  if (!normalized) return mac.toUpperCase();
  return normalized.toUpperCase();
}
