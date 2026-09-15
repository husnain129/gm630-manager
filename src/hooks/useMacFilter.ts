import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { login, get } from '@/router/gm630/client';
import { parseMacFilter } from '@/router/gm630/parsers/macFilter';
import { addMacFilter } from '@/router/gm630/mutations/addMacFilter';
import { removeMacFilter } from '@/router/gm630/mutations/removeMacFilter';
import { setFilterMode } from '@/router/gm630/mutations/setFilterMode';
import { ENDPOINTS } from '@/router/gm630/endpoints';
import { useRouterStore } from '@/store/router';
import type { MacFilterState } from '@/router/gm630/types';

export function useMacFilter() {
  const credentials = useRouterStore((s) => s.credentials);

  return useQuery<MacFilterState, Error>({
    queryKey: ['macFilter', credentials.host],
    queryFn: async () => {
      await login(credentials);
      const html = await get(ENDPOINTS.macFilter.path, credentials);
      return parseMacFilter(html);
    },
    staleTime: 45_000,
    retry: 1,
    retryDelay: 3000,
  });
}

export function useAddMacFilter() {
  const credentials = useRouterStore((s) => s.credentials);
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (mac: string) => addMacFilter(mac, credentials),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['macFilter'] });
      void queryClient.invalidateQueries({ queryKey: ['devices'] });
    },
  });
}

export function useRemoveMacFilter() {
  const credentials = useRouterStore((s) => s.credentials);
  const queryClient = useQueryClient();

  return useMutation<void, Error, number>({
    mutationFn: (index: number) => removeMacFilter(index, credentials),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['macFilter'] });
      void queryClient.invalidateQueries({ queryKey: ['devices'] });
    },
  });
}

export function useSetFilterMode() {
  const credentials = useRouterStore((s) => s.credentials);
  const queryClient = useQueryClient();

  return useMutation<void, Error, 'disabled' | 'blacklist' | 'whitelist'>({
    mutationFn: (mode: 'disabled' | 'blacklist' | 'whitelist') =>
      setFilterMode(mode, credentials),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['macFilter'] });
      void queryClient.invalidateQueries({ queryKey: ['devices'] });
    },
  });
}
