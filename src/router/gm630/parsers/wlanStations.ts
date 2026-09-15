import type { ConnectedDevice } from '../types';

// WLAN station list is served via the DHCP page (PhyPortName field).
// status_wlaninfo_t.gch shows SSID config, not associated clients.
// This parser is a no-op — use parseDhcpLeases which includes band info.
export function parseWlanStations(_html: string): ConnectedDevice[] {
  return [];
}
