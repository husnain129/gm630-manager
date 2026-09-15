import { post, get } from '../client';
import { extractSessionToken } from '../parsers/macFilter';
import { ENDPOINTS } from '../endpoints';
import type { RouterCredentials } from '../types';

export async function removeMacFilter(
  index: number,
  credentials: RouterCredentials,
): Promise<void> {
  const pageHtml = await get(ENDPOINTS.macFilter.path, credentials);
  const sessionToken = extractSessionToken(pageHtml);
  if (!sessionToken) throw new Error('Could not extract session token from MAC filter page.');

  await post(
    ENDPOINTS.macFilterDelete.path,
    {
      IF_ACTION: 'delete',
      IF_INDEX: String(index),
      IF_ERRORSTR: 'SUCC',
      IF_ERRORPARAM: 'SUCC',
      IF_ERRORTYPE: '-1',
    },
    credentials,
    sessionToken,
  );
}
