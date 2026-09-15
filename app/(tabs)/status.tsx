import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
  RefreshControl,
} from 'react-native';
import { useWifi, useChangeWifiPassword } from '@/hooks/useWifi';
import type { WlanSSID } from '@/router/gm630/parsers/wlanConfig';

// ── SSID card with inline password edit ──────────────────────────────────────

function SsidCard({ ssid }: { ssid: WlanSSID }) {
  const [editing, setEditing] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [draft, setDraft] = useState('');
  const { mutate, isPending, isSuccess, error, reset } = useChangeWifiPassword();

  const startEdit = useCallback(() => {
    setDraft(ssid.preSharedKey ?? '');
    setShowPw(true);
    setEditing(true);
    reset();
  }, [ssid.preSharedKey, reset]);

  const cancelEdit = useCallback(() => {
    setEditing(false);
    setShowPw(false);
    setDraft('');
    reset();
  }, [reset]);

  const saveEdit = useCallback(() => {
    if (draft.length < 8) return;
    mutate(
      { ssidIndex: ssid.index, password: draft },
      { onSuccess: () => setEditing(false) },
    );
  }, [draft, ssid.index, mutate]);

  const currentPw = ssid.preSharedKey;
  const hasPw = !!currentPw;
  const maskedPw = hasPw ? '•'.repeat(Math.min(currentPw!.length, 14)) : undefined;

  return (
    <View style={styles.card}>
      {/* Band + status row */}
      <View style={styles.cardTop}>
        <View style={[styles.bandBadge, ssid.band === '2.4GHz' ? styles.band24 : styles.band5]}>
          <Text style={styles.bandBadgeText}>{ssid.band}</Text>
        </View>
        <View style={[styles.enabledDot, ssid.enabled ? styles.dotOn : styles.dotOff]} />
        <Text style={styles.enabledLabel}>{ssid.enabled ? 'Active' : 'Disabled'}</Text>
      </View>

      {/* SSID name */}
      <Text style={styles.ssidName}>{ssid.ssidName}</Text>

      {ssid.authMode && (
        <Text style={styles.authLabel}>{ssid.authMode} · {ssid.encryptType ?? 'AES'}</Text>
      )}

      {/* Password section */}
      <View style={styles.pwSection}>
        <Text style={styles.fieldLabel}>Password</Text>

        {editing ? (
          <>
            <View style={styles.passwordRow}>
              <TextInput
                style={styles.passwordInput}
                value={draft}
                onChangeText={setDraft}
                placeholder="Minimum 8 characters"
                placeholderTextColor="#94a3b8"
                secureTextEntry={!showPw}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={saveEdit}
                autoFocus
              />
              <TouchableOpacity style={styles.showHideBtn} onPress={() => setShowPw((v) => !v)}>
                <Text style={styles.showHideText}>{showPw ? 'Hide' : 'Show'}</Text>
              </TouchableOpacity>
            </View>

            {draft.length > 0 && draft.length < 8 && (
              <Text style={styles.validationError}>Password must be at least 8 characters</Text>
            )}

            {isSuccess && (
              <View style={styles.successBanner}>
                <Text style={styles.successText}>Password changed successfully!</Text>
              </View>
            )}
            {error && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{(error as Error).message}</Text>
              </View>
            )}

            <View style={styles.editActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={cancelEdit} disabled={isPending}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, (isPending || draft.length < 8) && styles.saveBtnDisabled]}
                onPress={saveEdit}
                disabled={isPending || draft.length < 8}
              >
                {isPending ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.saveBtnText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>

            <Text style={styles.warningNote}>
              All devices on this network will be disconnected when the password changes.
            </Text>
          </>
        ) : (
          <View style={styles.pwDisplayRow}>
            {hasPw ? (
              <>
                <Text style={styles.pwMasked} selectable={showPw}>
                  {showPw ? currentPw : maskedPw}
                </Text>
                <TouchableOpacity onPress={() => setShowPw((v) => !v)} style={styles.revealBtn}>
                  <Text style={styles.revealBtnText}>{showPw ? 'Hide' : 'Show'}</Text>
                </TouchableOpacity>
              </>
            ) : (
              <Text style={styles.pwUnavailable}>Not loaded</Text>
            )}
            <TouchableOpacity style={styles.editBtn} onPress={startEdit}>
              <Text style={styles.editBtnText}>Edit</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

// ── main screen ───────────────────────────────────────────────────────────────

export default function WifiScreen() {
  const { data, isLoading, isFetching, error, refetch } = useWifi();

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading Wi-Fi settings…</Text>
      </View>
    );
  }

  if (error) {
    const isCors =
      (error as Error).message.includes('Failed to fetch') ||
      (error as Error).message.includes('Network request failed');
    return (
      <View style={styles.center}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorTitle}>
          {isCors ? 'Cannot reach router from browser' : 'Router unreachable'}
        </Text>
        <Text style={styles.errorSubtext}>
          {isCors ? 'Open the app on your phone instead.' : (error as Error).message}
        </Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
          <Text style={styles.retryBtnText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const ssids = (data ?? []).filter(
    (s) => s.enabled || s.ssidName !== 'WIFI-SSID' + (s.index + 1),
  );
  const primary = ssids.filter((s) => s.index === 0 || s.index === 4);
  const others = ssids.filter((s) => s.index !== 0 && s.index !== 4 && s.enabled);

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      refreshControl={<RefreshControl refreshing={isFetching && !isLoading} onRefresh={refetch} />}
    >
      <Text style={styles.screenTitle}>Wi-Fi</Text>
      <Text style={styles.screenSub}>View and update your Wi-Fi passwords.</Text>

      {primary.map((ssid) => (
        <SsidCard key={ssid.index} ssid={ssid} />
      ))}

      {others.length > 0 && (
        <>
          <Text style={styles.sectionHeader}>Other Active SSIDs</Text>
          {others.map((ssid) => (
            <SsidCard key={ssid.index} ssid={ssid} />
          ))}
        </>
      )}
    </ScrollView>
  );
}

// ── styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16, paddingTop: Platform.OS === 'ios' ? 56 : 24, paddingBottom: 48 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },

  screenTitle: { fontSize: 28, fontWeight: '800', color: '#0f172a', marginBottom: 4 },
  screenSub: { fontSize: 14, color: '#64748b', marginBottom: 24 },
  sectionHeader: {
    fontSize: 12, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase',
    letterSpacing: 0.8, marginTop: 8, marginBottom: 12,
  },

  loadingText: { marginTop: 16, color: '#64748b', fontSize: 14 },
  errorIcon: { fontSize: 40, marginBottom: 12 },
  errorTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a', textAlign: 'center', marginBottom: 8 },
  errorSubtext: { fontSize: 14, color: '#64748b', textAlign: 'center', marginBottom: 24 },
  retryBtn: { backgroundColor: '#2563eb', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  retryBtnText: { color: '#fff', fontWeight: '700' },

  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06,
    shadowRadius: 4, elevation: 2,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
  bandBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  band24: { backgroundColor: '#fef3c7' },
  band5: { backgroundColor: '#eff6ff' },
  bandBadgeText: { fontSize: 11, fontWeight: '700', color: '#1e293b' },
  enabledDot: { width: 8, height: 8, borderRadius: 4 },
  dotOn: { backgroundColor: '#22c55e' },
  dotOff: { backgroundColor: '#e2e8f0' },
  enabledLabel: { fontSize: 12, color: '#64748b' },

  ssidName: { fontSize: 22, fontWeight: '700', color: '#0f172a', marginBottom: 4 },
  authLabel: { fontSize: 12, color: '#94a3b8', marginBottom: 12 },

  pwSection: { marginTop: 4 },
  fieldLabel: {
    fontSize: 11, fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase',
    letterSpacing: 0.5, marginBottom: 8,
  },

  // view mode
  pwDisplayRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pwMasked: { flex: 1, fontSize: 17, color: '#0f172a', letterSpacing: 1.5 },
  pwUnavailable: { flex: 1, fontSize: 14, color: '#94a3b8', fontStyle: 'italic' },
  revealBtn: { paddingHorizontal: 10, paddingVertical: 6 },
  revealBtnText: { fontSize: 14, color: '#2563eb', fontWeight: '600' },
  editBtn: {
    backgroundColor: '#f1f5f9', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 7,
  },
  editBtnText: { fontSize: 14, color: '#0f172a', fontWeight: '600' },

  // edit mode
  passwordRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc',
    borderRadius: 10, borderWidth: 1, borderColor: '#2563eb', marginBottom: 6,
  },
  passwordInput: { flex: 1, paddingHorizontal: 14, paddingVertical: 13, fontSize: 16, color: '#0f172a' },
  showHideBtn: { paddingHorizontal: 14, paddingVertical: 13 },
  showHideText: { fontSize: 14, color: '#2563eb', fontWeight: '600' },
  validationError: { fontSize: 12, color: '#dc2626', marginBottom: 8 },

  successBanner: { backgroundColor: '#f0fdf4', borderRadius: 8, padding: 10, marginBottom: 12 },
  successText: { color: '#16a34a', fontWeight: '600', fontSize: 13 },
  errorBanner: { backgroundColor: '#fef2f2', borderRadius: 8, padding: 10, marginBottom: 12 },
  errorText: { color: '#dc2626', fontSize: 13 },

  editActions: { flexDirection: 'row', gap: 10, marginTop: 4, marginBottom: 12 },
  cancelBtn: {
    flex: 1, backgroundColor: '#f1f5f9', borderRadius: 10, paddingVertical: 12, alignItems: 'center',
  },
  cancelBtnText: { color: '#475569', fontWeight: '700', fontSize: 15 },
  saveBtn: {
    flex: 1, backgroundColor: '#2563eb', borderRadius: 10, paddingVertical: 12, alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.4 },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  warningNote: { fontSize: 12, color: '#94a3b8', textAlign: 'center', lineHeight: 18 },
});
