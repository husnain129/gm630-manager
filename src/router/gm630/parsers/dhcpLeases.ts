import type { ConnectedDevice } from '../types';

// Decodes ZTE's hex-escaped values: \x3a → :, \x2e → .
function decodeZteValue(raw: string): string {
  return raw.replace(/\\x([0-9a-fA-F]{2})/g, (_, hex) =>
    String.fromCharCode(parseInt(hex, 16)),
  );
}

// Extracts all Transfer_meaning('Key', 'value') calls from a ZTE page.
function extractTransferMeanings(html: string): Map<string, string> {
  const map = new Map<string, string>();
  const re = /Transfer_meaning\('([^']+)',\s*'([^']*)'\)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    map.set(m[1], decodeZteValue(m[2]));
  }
  return map;
}

function phyPortToBand(phyPort: string): ConnectedDevice['band'] {
  // SSID1–4 = 2.4 GHz, SSID5–8 = 5 GHz, ETH* = Ethernet
  if (/^SSID[1-4]$/i.test(phyPort)) return '2.4GHz';
  if (/^SSID[5-8]$/i.test(phyPort)) return '5GHz';
  if (/^eth/i.test(phyPort)) return 'Ethernet';
  return undefined;
}

export function parseDhcpLeases(html: string): ConnectedDevice[] {
  try {
    const fields = extractTransferMeanings(html);
    const countStr = fields.get('IF_INSTNUM');
    const count = countStr ? parseInt(countStr, 10) : 0;
    if (!count || isNaN(count)) return [];

    const devices: ConnectedDevice[] = [];
    for (let i = 0; i < count; i++) {
      const mac = fields.get(`MACAddr${i}`);
      if (!mac) continue;
      const phyPort = fields.get(`PhyPortName${i}`) ?? '';
      const expiredRaw = fields.get(`ExpiredTime${i}`);
      devices.push({
        mac: mac.toLowerCase(),
        ip: fields.get(`IPAddr${i}`),
        hostname: fields.get(`HostName${i}`) || undefined,
        band: phyPortToBand(phyPort),
        phyPort: phyPort || undefined,
        expiredTime: expiredRaw ? parseInt(expiredRaw, 10) : undefined,
        source: 'dhcp',
      });
    }
    return devices;
  } catch {
    return [];
  }
}
