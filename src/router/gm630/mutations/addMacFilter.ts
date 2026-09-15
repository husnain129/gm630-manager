import { post, get } from '../client';
import { extractSessionToken } from '../parsers/macFilter';
import { ENDPOINTS } from '../endpoints';
import { parseMacFilter } from '../parsers/macFilter';
import type { RouterCredentials } from '../types';

export async function addMacFilter(
  mac: string,
  credentials: RouterCredentials,
): Promise<void> {
  // Fetch page first to get current session token
  const pageHtml = await get(ENDPOINTS.macFilter.path, credentials);
  const sessionToken = extractSessionToken(pageHtml);
  if (!sessionToken) throw new Error('Could not extract session token from MAC filter page.');

  // Verify MAC not already present
  const current = parseMacFilter(pageHtml);
  const normalizedMac = mac.toUpperCase();
  const alreadyExists = current.entries.some(
    (e) => e.mac.toUpperCase() === normalizedMac,
  );
  if (alreadyExists) return; // already in list, no-op

  await post(
    ENDPOINTS.macFilterAdd.path,
    {
      IF_ACTION: 'new',
      IF_INDEX: '-1',
      IF_ERRORSTR: 'SUCC',
      IF_ERRORPARAM: 'SUCC',
      IF_ERRORTYPE: '-1',
      Enable: '1',
      BlackList: '1',
      Type: 'Bridge+Route',
      Protocol: 'ALL',
      SrcMacAddr: mac.toUpperCase(),
      DstMacAddr: '00:00:00:00:00:00',
      Port: '',
    },
    credentials,
    sessionToken,
  );
}
