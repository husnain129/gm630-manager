import { get, post } from '../client';
import { extractSessionToken } from '../parsers/macFilter';
import { extractTransferMeanings } from '../parsers/wlanConfig';
import type { RouterCredentials } from '../types';

const WLAN_SECURITY_BASE = '/getpage.gch?pid=1002&nextpage=net_wlan_secrity_t.gch';

const ssidViewId = (index: number) => `IGD.LD1.WLAN${index + 1}`;

export async function changeWifiPassword(
  ssidIndex: number,
  newPassword: string,
  credentials: RouterCredentials,
): Promise<void> {
  const viewId = ssidViewId(ssidIndex);

  // Fetch the SSID's security page to read current settings + session token.
  // The GET uses IF_VIEWID in the URL to select the SSID instance.
  const pageHtml = await get(`${WLAN_SECURITY_BASE}&IF_VIEWID=${viewId}`, credentials);
  const sessionToken = extractSessionToken(pageHtml);
  if (!sessionToken) throw new Error('Could not extract session token from WLAN security page.');

  // All hidden inputs start with value='' in HTML — Transfer_meaning JS fills them.
  // We must echo back all Transfer_meaning values so the server gets a complete
  // form submission, then override only the password field.
  const f = extractTransferMeanings(pageHtml);
  const body: Record<string, string> = {};
  for (const [key, value] of f.entries()) {
    body[key] = value;
  }

  // Override with new password (both fields — PreSharedKey is empty but included)
  body['KeyPassphrase'] = newPassword;
  body['PreSharedKey'] = newPassword;

  // These tags are set by page JS to signal which sections changed.
  // IF_PSKTAG=Y tells the server to apply the PSK password.
  // IF_CONFIGTAG=Y tells the server to apply general config.
  // IF_WEPKEYTAG=N means we're not changing WEP keys.
  body['IF_CONFIGTAG'] = 'Y';
  body['IF_PSKTAG'] = 'Y';
  body['IF_WEPKEYTAG'] = 'N';

  // Framework fields the ZTE page always submits
  body['IF_ACTION'] = 'apply';
  body['IF_VIEWID'] = viewId;
  body['IF_UPLOADING'] = 'N/A';
  body['temClickURL'] = '';
  body['logout'] = '';
  body['_lang'] = '';
  body['action'] = '';

  // ZTE routes settings via the page URL (not root — root only handles login).
  const postUrl = `${WLAN_SECURITY_BASE}&IF_VIEWID=${viewId}`;
  await post(postUrl, body, credentials, sessionToken);
}
