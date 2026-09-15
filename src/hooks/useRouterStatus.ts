import { useQuery } from '@tanstack/react-query';
import { login, get } from '@/router/gm630/client';
import { parseDeviceInfo } from '@/router/gm630/parsers/deviceInfo';
import { parseWanStatus } from '@/router/gm630/parsers/wanStatus';
import { ENDPOINTS } from '@/router/gm630/endpoints';
import { useRouterStore } from '@/store/router';
import type { DeviceInfo, WanStatus } from '@/router/gm630/types';

export interface RouterStatusResult {
  deviceInfo: DeviceInfo;
  wanStatus: WanStatus;
}

export function useRouterStatus() {
  const credentials = useRouterStore((s) => s.credentials);

  return useQuery<RouterStatusResult, Error>({
    queryKey: ['routerStatus', credentials.host],
    queryFn: async () => {
      // Single-threaded server: login first, then fetch pages sequentially
      await login(credentials);
      const deviceInfoHtml = await get(ENDPOINTS.deviceInfo.path, credentials);
      const wanStatusHtml = await get(ENDPOINTS.wanStatus.path, credentials);
      return {
        deviceInfo: parseDeviceInfo(deviceInfoHtml),
        wanStatus: parseWanStatus(wanStatusHtml),
      };
    },
    staleTime: 60_000,
    retry: 1,
    retryDelay: 3000,
  });
}
