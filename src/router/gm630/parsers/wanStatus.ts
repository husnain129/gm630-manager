import type { WanStatus } from '../types';

function decodeHtmlEntities(text: string): string {
  return text.replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
}

// Extracts the text next to a label in the WAN status table.
// Table rows: <td class="tdleft_1">Label</td><td class="tdright">Value</td>
function extractByLabel(html: string, label: string): string | undefined {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(
    `<td[^>]*>${escaped}<\\/td>\\s*<td[^>]*>([^<]*)<\\/td>`,
    'i',
  );
  const m = html.match(re);
  return m ? decodeHtmlEntities(m[1].trim()) || undefined : undefined;
}

export function parseWanStatus(html: string): WanStatus {
  try {
    return {
      connectionType: extractByLabel(html, 'Type'),
      connectionName: extractByLabel(html, 'Connection Name'),
      ip: extractByLabel(html, 'IP'),
      gateway: extractByLabel(html, 'Gateway'),
      dns1: extractByLabel(html, 'DNS1'),
      dns2: extractByLabel(html, 'DNS2'),
      wanMac: extractByLabel(html, 'WAN MAC'),
      connectionStatus: extractByLabel(html, 'Connection Status'),
      onlineDuration: extractByLabel(html, 'Online Duration'),
    };
  } catch {
    return {};
  }
}
