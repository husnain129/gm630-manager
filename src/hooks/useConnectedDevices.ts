import { useQuery } from '@tanstack/react-query';
import { get, login } from '@/router/gm630/client';
import { parseDhcpLeases } from '@/router/gm630/parsers/dhcpLeases';
import { parseMacFilter } from '@/router/gm630/parsers/macFilter';
import { ENDPOINTS } from '@/router/gm630/endpoints';
import { useRouterStore } from '@/store/router';
import type { ConnectedDevice, MacFilterState } from '@/router/gm630/types';

export interface DevicesResult {
  devices: ConnectedDevice[];
  macFilter: MacFilterState;
}

async function fetchDevices(credentials: {
  host: string;
  username: string;
  password: string;
}): Promise<DevicesResult> {
  // Login to establish IP session before fetching data pages
  await login(credentials);

  const [dhcpHtml, macHtml] = await Promise.all([
    get(ENDPOINTS.dhcpLeases.path, credentials),
    get(ENDPOINTS.macFilter.path, credentials),
  ]);

  const devices = parseDhcpLeases(dhcpHtml);
  const macFilter = parseMacFilter(macHtml);

  return { devices, macFilter };
}

export function useConnectedDevices() {
  const credentials = useRouterStore((s) => s.credentials);
  const setLastUpdated = useRouterStore((s) => s.setLastUpdated);

  return useQuery({
    queryKey: ['devices', credentials.host],
    queryFn: async () => {
      const result = await fetchDevices(credentials);
      setLastUpdated(Date.now());
      return result;
    },
    staleTime: 45_000,
    retry: 1,
    retryDelay: 3000,
  });
}
