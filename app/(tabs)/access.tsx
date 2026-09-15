import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import { useMacFilter, useAddMacFilter, useRemoveMacFilter, useSetFilterMode } from '@/hooks/useMacFilter';
import { useConnectedDevices } from '@/hooks/useConnectedDevices';
import { lookupVendor } from '@/lib/oui';
import type { MacFilterEntry } from '@/router/gm630/types';

// ── helpers ─────────────────────────────────────────────────────────────────

const MAC_REGEX = /^([0-9a-fA-F]{2}:){5}[0-9a-fA-F]{2}$/;

function normaliseMac(input: string): string {
  // Accept with colons, dashes, or no separator; normalise to lowercase colon-separated
  const clean = input.replace(/[^0-9a-fA-F]/g, '');
  if (clean.length !== 12) return input.trim();
  return (
    clean.slice(0, 2) + ':' +
    clean.slice(2, 4) + ':' +
    clean.slice(4, 6) + ':' +
    clean.slice(6, 8) + ':' +
    clean.slice(8, 10) + ':' +
    clean.slice(10, 12)
  ).toLowerCase();
}

function modeLabel(mode: 'disabled' | 'blacklist' | 'whitelist'): string {
  if (mode === 'blacklist') return 'Blacklist — block listed';
  if (mode === 'whitelist') return 'Whitelist — allow only listed';
  return 'Disabled';
}

function modeBadgeColor(mode: 'disabled' | 'blacklist' | 'whitelist'): string {
  if (mode === 'blacklist') return '#dc2626';
  if (mode === 'whitelist') return '#16a34a';
  return '#64748b';
}

// ── filter entry row ─────────────────────────────────────────────────────────

function EntryRow({
  entry,
  onDelete,
  isDeleting,
}: {
  entry: MacFilterEntry;
  onDelete: () => void;
  isDeleting: boolean;
}) {
  const vendor = lookupVendor(entry.mac.toLowerCase());

  return (
    <View style={styles.entryRow}>
      <View style={styles.entryMain}>
        <Text style={styles.entryMac}>{entry.mac.toUpperCase()}</Text>
        {vendor ? <Text style={styles.entryVendor}>{vendor}</Text> : null}
      </View>
      <View style={styles.entryRight}>
        <View style={[styles.enabledBadge, entry.enabled ? styles.badgeOn : styles.badgeOff]}>
          <Text style={[styles.enabledBadgeText, entry.enabled ? styles.badgeOnText : styles.badgeOffText]}>
            {entry.enabled ? 'On' : 'Off'}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={onDelete}
          disabled={isDeleting}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          {isDeleting ? (
            <ActivityIndicator size="small" color="#dc2626" />
          ) : (
            <Text style={styles.deleteBtnText}>✕</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── pick-from-devices modal ───────────────────────────────────────────────────

function PickDeviceModal({
  visible,
  existingMacs,
  onPick,
  onClose,
}: {
  visible: boolean;
  existingMacs: string[];
  onPick: (mac: string) => void;
  onClose: () => void;
}) {
  const { data } = useConnectedDevices();
  const devices = data?.devices ?? [];
  const existingSet = new Set(existingMacs.map((m) => m.toLowerCase()));
  const candidates = devices.filter((d) => !existingSet.has(d.mac.toLowerCase()));

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Pick a Connected Device</Text>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.modalClose}>Done</Text>
          </TouchableOpacity>
        </View>
        {candidates.length === 0 ? (
          <View style={styles.modalEmpty}>
            <Text style={styles.modalEmptyText}>
              {devices.length === 0
                ? 'No connected devices found.\nLoad the Devices tab first.'
                : 'All connected devices are already in the filter list.'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={candidates}
            keyExtractor={(d) => d.mac}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            renderItem={({ item }) => {
              const vendor = lookupVendor(item.mac.toLowerCase());
              return (
                <TouchableOpacity
                  style={styles.pickRow}
                  onPress={() => onPick(item.mac.toLowerCase())}
                  activeOpacity={0.7}
                >
                  <View style={styles.pickRowMain}>
                    <Text style={styles.pickRowHostname}>
                      {item.hostname ?? item.mac.toUpperCase()}
                    </Text>
                    <Text style={styles.pickRowSub}>
                      {item.mac.toUpperCase()}{vendor ? `  ·  ${vendor}` : ''}
                    </Text>
                    {item.ip ? <Text style={styles.pickRowIp}>{item.ip}</Text> : null}
                  </View>
                  <Text style={styles.pickRowChevron}>+</Text>
                </TouchableOpacity>
              );
            }}
          />
        )}
      </View>
    </Modal>
  );
}

// ── manual MAC input modal ────────────────────────────────────────────────────

function ManualMacModal({
  visible,
  onAdd,
  onClose,
}: {
  visible: boolean;
  onAdd: (mac: string) => void;
  onClose: () => void;
}) {
  const [value, setValue] = useState('');
  const [error, setError] = useState('');

  const handleAdd = useCallback(() => {
    const normalised = normaliseMac(value);
    if (!MAC_REGEX.test(normalised)) {
      setError('Invalid MAC address. Format: aa:bb:cc:dd:ee:ff');
      return;
    }
    onAdd(normalised);
    setValue('');
    setError('');
  }, [value, onAdd]);

  const handleClose = useCallback(() => {
    setValue('');
    setError('');
    onClose();
  }, [onClose]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={styles.modalContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Enter MAC Address</Text>
          <TouchableOpacity onPress={handleClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.modalClose}>Cancel</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.manualBody}>
          <Text style={styles.manualLabel}>MAC Address</Text>
          <TextInput
            style={styles.manualInput}
            value={value}
            onChangeText={(t) => { setValue(t); setError(''); }}
            placeholder="aa:bb:cc:dd:ee:ff"
            placeholderTextColor="#94a3b8"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="default"
            returnKeyType="done"
            onSubmitEditing={handleAdd}
          />
          {error ? <Text style={styles.manualError}>{error}</Text> : null}
          <TouchableOpacity style={styles.manualAddBtn} onPress={handleAdd}>
            <Text style={styles.manualAddBtnText}>Add to Filter List</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ── main screen ───────────────────────────────────────────────────────────────

export default function AccessScreen() {
  const { data, isLoading, error, refetch } = useMacFilter();
  const addMutation = useAddMacFilter();
  const removeMutation = useRemoveMacFilter();
  const setModeMutation = useSetFilterMode();

  const [pickVisible, setPickVisible] = useState(false);
  const [manualVisible, setManualVisible] = useState(false);
  const [deletingIndex, setDeletingIndex] = useState<number | null>(null);

  const mode = data?.mode ?? 'disabled';
  const entries = data?.entries ?? [];

  const handleChangeMode = useCallback(() => {
    Alert.alert('Change Filter Mode', 'Select a new mode for MAC filtering.', [
      {
        text: 'Disabled (off)',
        onPress: () => setModeMutation.mutate('disabled'),
      },
      {
        text: 'Blacklist — block listed',
        onPress: () => setModeMutation.mutate('blacklist'),
      },
      {
        text: 'Whitelist — allow only listed',
        style: 'destructive',
        onPress: () => {
          Alert.alert(
            'Enable Whitelist Mode',
            'Warning: Make sure your device\'s MAC is in the list before enabling whitelist mode, or you will be locked out.',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Enable Whitelist',
                style: 'destructive',
                onPress: () => setModeMutation.mutate('whitelist'),
              },
            ],
          );
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }, [setModeMutation]);

  const handleAddPress = useCallback(() => {
    Alert.alert('Add MAC Filter Entry', 'Choose how to add a device.', [
      { text: 'Pick from Connected Devices', onPress: () => setPickVisible(true) },
      { text: 'Enter MAC Manually', onPress: () => setManualVisible(true) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }, []);

  const handlePick = useCallback(
    (mac: string) => {
      setPickVisible(false);
      addMutation.mutate(mac);
    },
    [addMutation],
  );

  const handleManualAdd = useCallback(
    (mac: string) => {
      setManualVisible(false);
      addMutation.mutate(mac);
    },
    [addMutation],
  );

  const handleDelete = useCallback(
    (entry: MacFilterEntry) => {
      Alert.alert(
        'Remove Entry',
        `Remove ${entry.mac.toUpperCase()} from the filter list?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: () => {
              setDeletingIndex(entry.index);
              removeMutation.mutate(entry.index, {
                onSettled: () => setDeletingIndex(null),
              });
            },
          },
        ],
      );
    },
    [removeMutation],
  );

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading MAC filter…</Text>
      </View>
    );
  }

  if (error) {
    const isCors =
      error.message.includes('Failed to fetch') ||
      error.message.includes('Network request failed') ||
      error.message.includes('CORS');
    return (
      <View style={styles.center}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorTitle}>
          {isCors ? 'Cannot reach router from browser' : 'Failed to load'}
        </Text>
        <Text style={styles.errorSub}>{isCors ? 'Open the app on your phone.' : error.message}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => void refetch()}>
          <Text style={styles.retryBtnText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {/* mode header */}
      <View style={styles.modeHeader}>
        <View>
          <Text style={styles.modeHeaderLabel}>Current Mode</Text>
          <Text style={[styles.modeHeaderValue, { color: modeBadgeColor(mode) }]}>
            {modeLabel(mode)}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.changeModeBtn}
          onPress={handleChangeMode}
          disabled={setModeMutation.isPending}
        >
          {setModeMutation.isPending ? (
            <ActivityIndicator size="small" color="#2563eb" />
          ) : (
            <Text style={styles.changeModeBtnText}>Change Mode</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* mutation feedback */}
      {addMutation.isPending && (
        <View style={styles.statusBar}>
          <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.statusBarText}>Adding entry…</Text>
        </View>
      )}
      {addMutation.isError && (
        <View style={[styles.statusBar, styles.statusBarError]}>
          <Text style={styles.statusBarText}>Add failed: {addMutation.error?.message}</Text>
        </View>
      )}

      {/* entries list */}
      <ScrollView style={styles.listArea} contentContainerStyle={entries.length === 0 ? styles.emptyContainer : undefined}>
        {entries.length === 0 ? (
          <View style={styles.center}>
            <Text style={styles.emptyText}>No MAC filter entries</Text>
            <Text style={styles.emptySub}>Tap + to add a device.</Text>
          </View>
        ) : (
          <>
            <Text style={styles.sectionHeader}>Filter Entries ({entries.length})</Text>
            {entries.map((entry, i) => (
              <React.Fragment key={entry.mac}>
                <EntryRow
                  entry={entry}
                  onDelete={() => handleDelete(entry)}
                  isDeleting={deletingIndex === entry.index}
                />
                {i < entries.length - 1 && <View style={styles.separator} />}
              </React.Fragment>
            ))}
          </>
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={handleAddPress} activeOpacity={0.85}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* modals */}
      <PickDeviceModal
        visible={pickVisible}
        existingMacs={entries.map((e) => e.mac)}
        onPick={handlePick}
        onClose={() => setPickVisible(false)}
      />
      <ManualMacModal
        visible={manualVisible}
        onAdd={handleManualAdd}
        onClose={() => setManualVisible(false)}
      />
    </View>
  );
}

// ── styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f8fafc' },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  loadingText: { marginTop: 16, color: '#64748b', fontSize: 14 },

  modeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 56 : 20,
    paddingBottom: 18,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e2e8f0',
  },
  modeHeaderLabel: { fontSize: 12, color: '#94a3b8', marginBottom: 4, fontWeight: '500' },
  modeHeaderValue: { fontSize: 17, fontWeight: '700' },
  changeModeBtn: {
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    minWidth: 40,
    alignItems: 'center',
  },
  changeModeBtnText: { color: '#2563eb', fontWeight: '600', fontSize: 14 },

  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563eb',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  statusBarError: { backgroundColor: '#dc2626' },
  statusBarText: { color: '#fff', fontSize: 13 },

  listArea: { flex: 1 },
  emptyContainer: { flex: 1 },
  emptyText: { color: '#94a3b8', fontSize: 16, fontWeight: '600', marginBottom: 6 },
  emptySub: { color: '#cbd5e1', fontSize: 13 },

  sectionHeader: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 8,
  },

  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  entryMain: { flex: 1 },
  entryMac: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  entryVendor: { fontSize: 12, color: '#64748b', marginTop: 2 },
  entryRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },

  enabledBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  badgeOn: { backgroundColor: '#f0fdf4' },
  badgeOff: { backgroundColor: '#f8fafc' },
  enabledBadgeText: { fontSize: 11, fontWeight: '600' },
  badgeOnText: { color: '#16a34a' },
  badgeOffText: { color: '#94a3b8' },

  deleteBtn: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
    backgroundColor: '#fef2f2',
  },
  deleteBtnText: { color: '#dc2626', fontSize: 14, fontWeight: '700' },

  separator: { height: StyleSheet.hairlineWidth, backgroundColor: '#f1f5f9', marginLeft: 16 },

  fab: {
    position: 'absolute',
    bottom: 32,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
  },
  fabText: { color: '#fff', fontSize: 28, fontWeight: '300', lineHeight: 34 },

  errorIcon: { fontSize: 40, marginBottom: 16 },
  errorTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a', textAlign: 'center', marginBottom: 8 },
  errorSub: { fontSize: 14, color: '#64748b', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  retryBtn: { backgroundColor: '#2563eb', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  retryBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  // modals
  modalContainer: { flex: 1, backgroundColor: '#f8fafc' },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 56 : 20,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e2e8f0',
  },
  modalTitle: { fontSize: 17, fontWeight: '700', color: '#0f172a' },
  modalClose: { fontSize: 16, color: '#2563eb', fontWeight: '600' },
  modalEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  modalEmptyText: { color: '#94a3b8', fontSize: 14, textAlign: 'center', lineHeight: 22 },

  pickRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
  },
  pickRowMain: { flex: 1 },
  pickRowHostname: { fontSize: 15, fontWeight: '600', color: '#0f172a', marginBottom: 2 },
  pickRowSub: { fontSize: 12, color: '#64748b', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  pickRowIp: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  pickRowChevron: { fontSize: 22, color: '#2563eb', fontWeight: '600', marginLeft: 12 },

  manualBody: { padding: 20 },
  manualLabel: { fontSize: 13, fontWeight: '600', color: '#334155', marginBottom: 8 },
  manualInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: '#0f172a',
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  manualError: { fontSize: 13, color: '#dc2626', marginBottom: 16 },
  manualAddBtn: {
    backgroundColor: '#2563eb',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  manualAddBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
