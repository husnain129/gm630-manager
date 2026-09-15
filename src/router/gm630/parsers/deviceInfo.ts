import type { DeviceInfo } from '../types';

// Extracts text content from <td id="Frm_X">...HTML entities...</td>
// ZTE status_dev_info_t.gch encodes all values as HTML entities inside named <td> cells.
function extractTdById(html: string, id: string): string | undefined {
  const pattern = new RegExp(`id="${id}"[^>]*>([^<]*)<`, 'i');
  const match = html.match(pattern);
  if (!match) return undefined;
  return decodeHtmlEntities(match[1].trim());
}

function decodeHtmlEntities(text: string): string {
  return text.replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
}

export function parseDeviceInfo(html: string): DeviceInfo {
  try {
    return {
      model: extractTdById(html, 'Frm_ModelName'),
      serialNumber: extractTdById(html, 'Frm_SerialNumber'),
      hardwareVersion: extractTdById(html, 'Frm_HardwareVer'),
      softwareVersion: extractTdById(html, 'Frm_SoftwareVer'),
      uptime: extractTdById(html, 'Frm_UpTime'),
      ponMac: extractTdById(html, 'Frm_PonMac'),
      ponMode: extractTdById(html, 'Frm_PonMode'),
    };
  } catch {
    return {};
  }
}
