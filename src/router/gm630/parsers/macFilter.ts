import type { MacFilterState, MacFilterEntry } from '../types';

function decodeZteValue(raw: string): string {
  return raw.replace(/\\x([0-9a-fA-F]{2})/g, (_, hex) =>
    String.fromCharCode(parseInt(hex, 16)),
  );
}

function extractTransferMeanings(html: string): Map<string, string> {
  const map = new Map<string, string>();
  const re = /Transfer_meaning\('([^']+)',\s*'([^']*)'\)/g;
  let m: RegExpExecArray | null;
  // Use the LAST occurrence of each key — ZTE pages emit keys twice (empty then filled)
  while ((m = re.exec(html)) !== null) {
    map.set(m[1], decodeZteValue(m[2]));
  }
  return map;
}

function resolveMode(
  enable: string | undefined,
  target: string | undefined,
): MacFilterState['mode'] {
  if (enable !== '1') return 'disabled';
  // MacFilterTarget: 'Permit' = whitelist (only listed allowed), 'Deny' = blacklist
  return target === 'Permit' ? 'whitelist' : 'blacklist';
}

export function parseMacFilter(html: string): MacFilterState {
  try {
    const fields = extractTransferMeanings(html);

    const mode = resolveMode(
      fields.get('MacFilterEnable'),
      fields.get('MacFilterTarget'),
    );

    const countStr = fields.get('IF_INSTNUM');
    const count = countStr ? parseInt(countStr, 10) : 0;

    const entries: MacFilterEntry[] = [];
    for (let i = 0; i < count; i++) {
      const mac = fields.get(`SrcMacAddr${i}`);
      if (!mac || mac === '00:00:00:00:00:00') continue;
      entries.push({
        mac: mac.toLowerCase(),
        index: i,
        enabled: fields.get(`Enable${i}`) === '1',
      });
    }

    return { mode, entries };
  } catch {
    return { mode: 'disabled', entries: [] };
  }
}

// Extracts _SESSION_TOKEN from any page — required for all POST mutations
export function extractSessionToken(html: string): string | null {
  const m = html.match(/var session_token\s*=\s*"([^"]+)"/);
  return m ? m[1] : null;
}
