import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { login, get } from '@/router/gm630/client';
import { mergeWlanData } from '@/router/gm630/parsers/wlanConfig';
import { changeWifiPassword } from '@/router/gm630/mutations/changeWifiPassword';
import { useRouterStore } from '@/store/router';

const WLAN_INFO_PATH = '/getpage.gch?pid=1002&nextpage=status_wlaninfo_t.gch';
const WLAN_SEC_BASE = '/getpage.gch?pid=1002&nextpage=net_wlan_secrity_t.gch';

// ZTE TR-069 WLAN object paths: SSID index 0 → WLAN1, index 4 → WLAN5, etc.
const ssidViewId = (index: number) => `IGD.LD1.WLAN${index + 1}`;

// Primary SSID indices: 0 = 2.4GHz, 4 = 5GHz
const PRIMARY_SSID_INDICES = [0, 4];

export function useWifi() {
  const credentials = useRouterStore((s) => s.credentials);

  return useQuery({
    queryKey: ['wifi', credentials.host],
    queryFn: async () => {
      await login(credentials);
      const [infoHtml, ...secHtmls] = await Promise.all([
        get(WLAN_INFO_PATH, credentials),
        ...PRIMARY_SSID_INDICES.map((i) =>
          get(`${WLAN_SEC_BASE}&IF_VIEWID=${ssidViewId(i)}`, credentials),
        ),
      ]);
      return mergeWlanData(
        infoHtml,
        secHtmls.map((html, pos) => ({ html, ssidIndex: PRIMARY_SSID_INDICES[pos] })),
      );
    },
    staleTime: 60_000,
    retry: 1,
  });
}

export function useChangeWifiPassword() {
  const credentials = useRouterStore((s) => s.credentials);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ssidIndex, password }: { ssidIndex: number; password: string }) =>
      changeWifiPassword(ssidIndex, password, credentials),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['wifi'] });
    },
  });
}
