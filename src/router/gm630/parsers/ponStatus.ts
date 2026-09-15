import type { PonStatus } from '../types';

// gpon_status_link_t.gch exposes only LoidState and FecEnable via Transfer_meaning.
// Optical RX/TX power is not exposed in the web UI on this firmware version.
export function parsePonStatus(html: string): PonStatus {
  try {
    const loidMatch = html.match(/Transfer_meaning\('LoidState',\s*'([^']*)'\)/);
    return {
      loidState: loidMatch ? loidMatch[1] : undefined,
    };
  } catch {
    return {};
  }
}
