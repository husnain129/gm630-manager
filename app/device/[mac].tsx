import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useConnectedDevices } from '@/hooks/useConnectedDevices';
import { useMacFilter, useAddMacFilter, useRemoveMacFilter } from '@/hooks/useMacFilter';
import { lookupVendor } from '@/lib/oui';
import type { ConnectedDevice } from '@/router/gm630/types';

// ── helpers ─────────────────────────────────────────────────────────────────

function bandLabel(band: ConnectedDevice['band']): string {
  if (band === '2.4GHz') return '2.4 GHz';
  if (band === '5GHz') return '5 GHz';
  if (band === 'Ethernet') return 'Ethernet';
  return 'Unknown';
}

function bandColor(band: ConnectedDevice['band']): string {
  if (band === '2.4GHz') return '#f59e0b';
  if (band === '5GHz') return '#3b82f6';
  if (band === 'Ethernet') return '#10b981';
  return '#94a3b8';
}

// ── main screen ───────────────────────────────────────────────────────────────

export default function DeviceDetailScreen() {
  const { mac: rawMac } = useLocalSearchParams<{ mac: string }>();
  const router = useRouter();

  const mac = decodeURIComponent(rawMac ?? '').toLowerCase();

  const { data: devicesData } = useConnectedDevices();
  const { data: filterData } = useMacFilter();
  const addMutation = useAddMacFilter();
  const removeMutation = useRemoveMacFilter();

  const device = useMemo(
    () => devicesData?.devices.find((d) => d.mac.toLowerCase() === mac),
    [devicesData, mac],
  );

  const filterEntry = useMemo(
    () => filterData?.entries.find((e) => e.mac.toLowerCase() === mac),
    [filterData, mac],
  );

  const filterMode = filterData?.mode ?? 'disabled';
  const isInList = !!filterEntry;

  // Whether this device is currently blocked
  const isBlocked = useMemo(() => {
    if (filterMode === 'blacklist') return isInList;
    if (filterMode === 'whitelist') return !isInList;
    return false;
  }, [filterMode, isInList]);

  const vendor = lookupVendor(mac);
  const color = bandColor(device?.band);

  const handleToggleBlock = () => {
    if (!isInList) {
      // Adding to list
      if (filterMode === 'whitelist') {
        // Adding to whitelist = allowing, safe
        addMutation.mutate(mac, { onSuccess: () => {} });
      } else {
        // Adding to blacklist = blocking — confirm
        Alert.alert(
          'Block Device',
          `Add ${mac.toUpperCase()} to the blacklist?\n\nThis device will be blocked from connecting.`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Block',
              style: 'destructive',
              onPress: () => addMutation.mutate(mac),
            },
          ],
        );
      }
    } else {
      // Removing from list
      Alert.alert(
        'Remove from Filter List',
        `Remove ${mac.toUpperCase()} from the filter list?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: () => {
              removeMutation.mutate(filterEntry!.index, {
                onSuccess: () => {},
              });
            },
          },
        ],
      );
    }
  };

  const isMutating = addMutation.isPending || removeMutation.isPending;
  const mutationError = addMutation.error ?? removeMutation.error;

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      {/* close handle for modal */}
      <View style={styles.handle} />

      {/* MAC header */}
      <View style={styles.macHeader}>
        <Text style={styles.macText}>{mac.toUpperCase()}</Text>
        {vendor ? <Text style={styles.vendor}>{vendor}</Text> : null}
      </View>

      {/* Details card */}
      <View style={styles.card}>
        {device?.hostname ? (
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Hostname</Text>
            <Text style={styles.rowValue}>{device.hostname}</Text>
          </View>
        ) : null}

        {device?.ip ? (
          <View style={[styles.row, styles.rowBorder]}>
            <Text style={styles.rowLabel}>IP Address</Text>
            <Text style={[styles.rowValue, styles.mono]}>{device.ip}</Text>
          </View>
        ) : null}

        {device?.band ? (
          <View style={[styles.row, styles.rowBorder]}>
            <Text style={styles.rowLabel}>Connection</Text>
            <View style={[styles.bandPill, { backgroundColor: color + '22', borderColor: color }]}>
              <Text style={[styles.bandPillText, { color }]}>{bandLabel(device.band)}</Text>
            </View>
          </View>
        ) : null}

        {vendor ? (
          <View style={[styles.row, styles.rowBorder]}>
            <Text style={styles.rowLabel}>Vendor</Text>
            <Text style={styles.rowValue}>{vendor}</Text>
          </View>
        ) : null}

        {/* Filter status */}
        <View style={[styles.row, styles.rowBorder]}>
          <Text style={styles.rowLabel}>Filter Status</Text>
          {filterMode === 'disabled' ? (
            <Text style={styles.rowValueMuted}>Filtering disabled</Text>
          ) : (
            <Text style={[styles.rowValue, isBlocked ? styles.blockedText : styles.allowedText]}>
              {isBlocked ? 'Blocked' : 'Allowed'}
            </Text>
          )}
        </View>

        {isInList ? (
          <View style={[styles.row, styles.rowBorder]}>
            <Text style={styles.rowLabel}>In Filter List</Text>
            <Text style={styles.rowValue}>Yes (index {filterEntry?.index})</Text>
          </View>
        ) : null}
      </View>

      {/* mutation error */}
      {mutationError ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>{mutationError.message}</Text>
        </View>
      ) : null}

      {/* action button */}
      {filterMode !== 'disabled' && (
        <TouchableOpacity
          style={[
            styles.actionBtn,
            isInList ? styles.actionBtnDestructive : styles.actionBtnPrimary,
            isMutating && styles.actionBtnDisabled,
          ]}
          onPress={handleToggleBlock}
          disabled={isMutating}
        >
          {isMutating ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.actionBtnText}>
              {isInList
                ? filterMode === 'whitelist'
                  ? 'Remove from Whitelist'
                  : 'Unblock this Device'
                : filterMode === 'whitelist'
                ? 'Add to Whitelist'
                : 'Block this Device'}
            </Text>
          )}
        </TouchableOpacity>
      )}

      {filterMode === 'disabled' && (
        <View style={styles.disabledNote}>
          <Text style={styles.disabledNoteText}>
            MAC filtering is disabled. Enable it in the Access tab to block or allow devices.
          </Text>
        </View>
      )}

      <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
        <Text style={styles.closeBtnText}>Close</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// ── styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 20, paddingBottom: 48 },

  handle: {
    width: 36,
    height: 4,
    backgroundColor: '#e2e8f0',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 24,
  },

  macHeader: { alignItems: 'center', marginBottom: 28 },
  macText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    letterSpacing: 1,
    textAlign: 'center',
  },
  vendor: { fontSize: 14, color: '#64748b', marginTop: 6 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  rowBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#f1f5f9',
  },
  rowLabel: { fontSize: 14, color: '#475569' },
  rowValue: { fontSize: 14, fontWeight: '500', color: '#0f172a' },
  rowValueMuted: { fontSize: 14, color: '#94a3b8' },
  mono: { fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', fontSize: 13 },
  blockedText: { color: '#dc2626', fontWeight: '600' },
  allowedText: { color: '#16a34a', fontWeight: '600' },

  bandPill: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  bandPillText: { fontSize: 13, fontWeight: '600' },

  errorBanner: {
    backgroundColor: '#fef2f2',
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
  },
  errorBannerText: { color: '#dc2626', fontSize: 13, lineHeight: 18 },

  actionBtn: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
    minHeight: 52,
    justifyContent: 'center',
  },
  actionBtnPrimary: { backgroundColor: '#dc2626' },
  actionBtnDestructive: { backgroundColor: '#64748b' },
  actionBtnDisabled: { opacity: 0.6 },
  actionBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },

  disabledNote: {
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
  },
  disabledNoteText: { color: '#64748b', fontSize: 13, lineHeight: 20, textAlign: 'center' },

  closeBtn: {
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  closeBtnText: { color: '#334155', fontWeight: '600', fontSize: 15 },
});
