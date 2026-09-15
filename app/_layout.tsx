import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 45_000,
      retry: 1,
    },
  },
});

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="probe" options={{ title: 'Raw Probe', presentation: 'modal' }} />
        <Stack.Screen name="device/[mac]" options={{ title: 'Device', presentation: 'modal' }} />
      </Stack>
    </QueryClientProvider>
  );
}
