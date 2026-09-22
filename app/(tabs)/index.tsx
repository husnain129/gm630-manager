import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useConnectedDevices } from '@/hooks/useConnectedDevices';
import { useRouterStore } from '@/store/router';
import { lookupVendor } from '@/lib/oui';
import { useMacLabels } from '@/store/macLabels';
import type { ConnectedDevice, MacFilterState } from '@/router/gm630/types';

// ── helpers ──────────────────────────────────────────────────────────────────

function bandLabel(band: ConnectedDevice['band']): string {
  if (band === '2.4GHz') return '2.4G';
  if (band === '5GHz') return '5G';
  if (band === 'Ethernet') return 'ETH';
  return '?';
}

function bandColor(band: ConnectedDevice['band']): string {
  if (band === '2.4GHz') return '#f59e0b';
  if (band === '5GHz') return '#3b82f6';
  if (band === 'Ethernet') return '#10b981';
  return '#94a3b8';
}

function isBlocked(mac: string, filter: MacFilterState): boolean {
  const inList = filter.entries.some((e) => e.mac === mac.toLowerCase());
  if (filter.mode === 'blacklist') return inList;
  if (filter.mode === 'whitelist') return !inList;
  return false;
}

function timeAgo(ts: number): string {
  const diff = Math.round((Date.now() - ts) / 1000);
  if (diff < 5) return 'just now';
  if (diff < 60) return `${diff}s ago`;
  return `${Math.round(diff / 60)}m ago`;
}

// ── device row ────────────────────────────────────────────────────────────────

function DeviceRow({
  device,
  filter,
  label,
}: {
  device: ConnectedDevice;
  filter: MacFilterState;
  label?: string;
}) {
  const blocked = isBlocked(device.mac, filter);
  const color = bandColor(device.band);
  const vendor = lookupVendor(device.mac.toLowerCase());
  const nav = useRouter();

  return (
    <TouchableOpacity
      style={styles.row}
      activeOpacity={0.7}
      onPress={() => nav.push(`/device/${encodeURIComponent(device.mac)}`)}
    >
      <View style={[styles.bandDot, { backgroundColor: color }]} />
      <View style={styles.rowMain}>
        {label ? <Text style={styles.labelText} numberOfLines={1}>{label}</Text> : null}
        <Text style={[styles.hostname, label ? styles.hostnameSecondary : null]} numberOfLines={1}>
          {device.hostname ?? device.mac.toUpperCase()}
        </Text>
        <Text style={styles.rowSub}>
          {device.ip ?? '—'}{'  ·  '}
          <Text style={styles.mac}>{device.mac.toUpperCase()}</Text>
        </Text>
        {vendor ? <Text style={styles.vendor}>{vendor}</Text> : null}
      </View>
      <View style={styles.rowRight}>
        <View style={[styles.bandPill, { backgroundColor: color + '22', borderColor: color }]}>
          <Text style={[styles.bandText, { color }]}>{bandLabel(device.band)}</Text>
        </View>
        {filter.mode !== 'disabled' && (
          <View style={[styles.statusPill, blocked ? styles.blockedPill : styles.allowedPill]}>
            <Text style={[styles.statusText, blocked ? styles.blockedText : styles.allowedText]}>
              {blocked ? 'Blocked' : 'Allowed'}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

// ── error state ───────────────────────────────────────────────────────────────

function ErrorState({ error, onRetry }: { error: Error; onRetry: () => void }) {
  const isCors =
    error.message.includes('Failed to fetch') ||
    error.message.includes('Network request failed') ||
    error.message.includes('CORS');

  return (
    <View style={styles.center}>
      <Text style={styles.errorIcon}>⚠️</Text>
      <Text style={styles.errorTitle}>
        {isCors ? 'Cannot reach router from browser' : 'Router unreachable'}
      </Text>
      <Text style={styles.errorSub}>
        {isCors
          ? 'Browsers block direct requests to local IPs (CORS). Open the app on your phone instead.'
          : error.message}
      </Text>
      <TouchableOpacity style={styles.retryBtn} onPress={onRetry}>
        <Text style={styles.retryBtnText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── main screen ───────────────────────────────────────────────────────────────

export default function DevicesScreen() {
  const { data, isLoading, isFetching, error, refetch } = useConnectedDevices();
  const lastUpdated = useRouterStore((s) => s.lastUpdated);
  const { labels } = useMacLabels();

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Connecting to router…</Text>
      </View>
    );
  }

  if (error) {
    return <ErrorState error={error as Error} onRetry={refetch} />;
  }

  const devices = data?.devices ?? [];
  const filter = data?.macFilter ?? { mode: 'disabled' as const, entries: [] };

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <View>
          <Text style={styles.countNumber}>{devices.length}</Text>
          <Text style={styles.countLabel}>devices online</Text>
        </View>
        <View style={styles.headerRight}>
          {filter.mode !== 'disabled' && (
            <View style={styles.modePill}>
              <Text style={styles.modeText}>
                {filter.mode === 'whitelist' ? '🔒 Whitelist' : '🚫 Blacklist'}
              </Text>
            </View>
          )}
          {lastUpdated && (
            <Text style={styles.lastUpdated}>Updated {timeAgo(lastUpdated)}</Text>
          )}
        </View>
      </View>

      <FlatList
        data={devices}
        keyExtractor={(d) => d.mac}
        renderItem={({ item }) => (
          <DeviceRow
            device={item}
            filter={filter}
            label={labels[item.mac.toLowerCase()]}
          />
        )}
        refreshControl={
          <RefreshControl refreshing={isFetching && !isLoading} onRefresh={refetch} />
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={devices.length === 0 ? styles.emptyContainer : styles.listContent}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.emptyText}>No devices found</Text>
          </View>
        }
      />
    </View>
  );
}

// ── styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f8fafc' },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  loadingText: { marginTop: 16, color: '#64748b', fontSize: 14 },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    backgroundColor: '#2563eb', paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 56 : 20,
    paddingBottom: 20,
  },
  countNumber: { fontSize: 52, fontWeight: '800', color: '#fff', lineHeight: 56 },
  countLabel: { fontSize: 14, color: '#bfdbfe', fontWeight: '500' },
  headerRight: { alignItems: 'flex-end', justifyContent: 'flex-end', paddingTop: 8, gap: 6 },
  modePill: {
    backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  modeText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  lastUpdated: { color: '#93c5fd', fontSize: 11 },

  listContent: { paddingBottom: 32 },
  emptyContainer: { flex: 1 },

  row: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 12,
  },
  bandDot: { width: 10, height: 10, borderRadius: 5, marginRight: 12, alignSelf: 'flex-start', marginTop: 5 },
  rowMain: { flex: 1, gap: 2 },
  labelText: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
  hostname: { fontSize: 14, fontWeight: '600', color: '#0f172a' },
  hostnameSecondary: { fontSize: 12, fontWeight: '500', color: '#475569' },
  rowSub: { fontSize: 11, color: '#64748b' },
  mac: { fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', fontSize: 11 },
  vendor: { fontSize: 11, color: '#94a3b8' },
  rowRight: { alignItems: 'flex-end', gap: 4 },

  bandPill: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  bandText: { fontSize: 11, fontWeight: '700' },

  statusPill: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  blockedPill: { backgroundColor: '#fef2f2' },
  allowedPill: { backgroundColor: '#f0fdf4' },
  statusText: { fontSize: 10, fontWeight: '600' },
  blockedText: { color: '#dc2626' },
  allowedText: { color: '#16a34a' },

  separator: { height: StyleSheet.hairlineWidth, backgroundColor: '#f1f5f9' },

  errorIcon: { fontSize: 40, marginBottom: 16 },
  errorTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a', textAlign: 'center', marginBottom: 8 },
  errorSub: { fontSize: 14, color: '#64748b', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  retryBtn: { backgroundColor: '#2563eb', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  retryBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  emptyText: { color: '#94a3b8', fontSize: 14 },
});
