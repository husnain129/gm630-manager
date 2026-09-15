import { post, get } from '../client';
import { extractSessionToken } from '../parsers/macFilter';
import { ENDPOINTS } from '../endpoints';
import type { RouterCredentials } from '../types';

export async function setFilterMode(
  mode: 'disabled' | 'blacklist' | 'whitelist',
  credentials: RouterCredentials,
): Promise<void> {
  const pageHtml = await get(ENDPOINTS.macFilter.path, credentials);
  const sessionToken = extractSessionToken(pageHtml);
  if (!sessionToken) throw new Error('Could not extract session token from MAC filter page.');

  // MacFilterEnable: '1'=on, '0'=off
  // MacFilterTarget: 'Permit'=whitelist, 'Deny'=blacklist
  const enable = mode === 'disabled' ? '0' : '1';
  const target = mode === 'whitelist' ? 'Permit' : 'Deny';

  await post(
    ENDPOINTS.macFilterSetMode.path,
    {
      IF_ACTION: 'basic_apply',
      IF_ERRORSTR: 'SUCC',
      IF_ERRORPARAM: 'SUCC',
      IF_ERRORTYPE: '-1',
      MacFilterEnable: enable,
      MacFilterTarget: target,
    },
    credentials,
    sessionToken,
  );
}
