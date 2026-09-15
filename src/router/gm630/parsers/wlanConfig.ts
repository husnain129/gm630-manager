export interface WlanSSID {
  index: number;       // 0-based
  ssidName: string;
  enabled: boolean;
  authMode?: string;
  encryptType?: string;
  preSharedKey?: string;
  band: '2.4GHz' | '5GHz';
}

// Matches:  getObj("Table_wlanstat_"+ RowNum +"_2_table").innerHTML = "SsidName";
// The variable name is literally in the HTML so we just anchor on the table prefix.
const SSID_NAME_RE = /Table_wlanstat_[^_]*_2_table[^.]*\.innerHTML\s*=\s*"([^"]*)"/g;

// Matches:  getObj("Table_wlaninfo_"+ RowNum_info +"_2_table").innerHTML = "Enable";
const ENABLE_RE = /Table_wlaninfo_[^_]*_2_table[^.]*\.innerHTML\s*=\s*"(Enable|Disable)"/g;

function parseWlanInfoPage(html: string): Pick<WlanSSID, 'index' | 'ssidName' | 'enabled' | 'band'>[] {
  const names: string[] = [];
  const enabled: boolean[] = [];

  let m: RegExpExecArray | null;

  const nameRe = new RegExp(SSID_NAME_RE.source, 'g');
  while ((m = nameRe.exec(html)) !== null) names.push(m[1]);

  const enableRe = new RegExp(ENABLE_RE.source, 'g');
  while ((m = enableRe.exec(html)) !== null) enabled.push(m[1] === 'Enable');

  return names.map((name, i) => ({
    index: i,
    ssidName: name,
    enabled: enabled[i] ?? false,
    band: i < 4 ? '2.4GHz' : '5GHz',
  }));
}

function decodeZteValue(raw: string): string {
  return raw.replace(/\\x([0-9a-fA-F]{2})/g, (_, hex) =>
    String.fromCharCode(parseInt(hex, 16)),
  );
}

export function extractTransferMeanings(html: string): Map<string, string> {
  const map = new Map<string, string>();
  const re = /Transfer_meaning\('([^']+)',\s*'([^']*)'\)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    map.set(m[1], decodeZteValue(m[2]));
  }
  return map;
}

// Parses a single-SSID view of net_wlan_secrity_t.gch.
// The page shows one SSID at a time (selected by IF_VIEWID URL param).
// Fields are singular: PreSharedKey, Enable, WPAAuthMode, WPAEncryptType.
// WLAN_SSID0–7 give the name for each SSID index.
export function parseWlanSecurityPage(html: string, ssidIndex: number): Partial<WlanSSID> {
  const fields = extractTransferMeanings(html);
  return {
    index: ssidIndex,
    ssidName: fields.get(`WLAN_SSID${ssidIndex}`),
    authMode: fields.get('WPAAuthMode') ?? fields.get('11iAuthMode'),
    encryptType: fields.get('WPAEncryptType') ?? fields.get('11iEncryptType'),
    // PreSharedKey is often empty; KeyPassphrase holds the real WPA password
    preSharedKey: fields.get('KeyPassphrase') || fields.get('PreSharedKey') || undefined,
    enabled: fields.get('Enable') === '1',
    band: ssidIndex < 4 ? '2.4GHz' : '5GHz',
  };
}

// Merges info page (names + enable state) with per-SSID security data
export function mergeWlanData(
  infoHtml: string,
  securityPages: { html: string; ssidIndex: number }[],
): WlanSSID[] {
  const infoList = parseWlanInfoPage(infoHtml);
  const secMap = new Map<number, Partial<WlanSSID>>();
  for (const { html, ssidIndex } of securityPages) {
    secMap.set(ssidIndex, parseWlanSecurityPage(html, ssidIndex));
  }

  return infoList.map((info) => {
    const sec = secMap.get(info.index) ?? {};
    return {
      ...info,
      ssidName: sec.ssidName || info.ssidName,
      enabled: info.enabled || (sec.enabled ?? false),
      authMode: sec.authMode,
      encryptType: sec.encryptType,
      preSharedKey: sec.preSharedKey,
    };
  });
}

export function parseWlanInfo(html: string): WlanSSID[] {
  return parseWlanInfoPage(html).map((info) => ({
    ...info,
    authMode: undefined,
    encryptType: undefined,
    preSharedKey: undefined,
  }));
}
