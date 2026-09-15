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
  KeyboardAvoidingView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { login } from '@/router/gm630/client';
import { useRouterStore } from '@/store/router';

type TestState = 'idle' | 'testing' | 'success' | 'error';

export default function SettingsScreen() {
  const nav = useRouter();
  const credentials = useRouterStore((s) => s.credentials);
  const setCredentials = useRouterStore((s) => s.setCredentials);

  const [host, setHost] = useState(credentials.host);
  const [username, setUsername] = useState(credentials.username);
  const [password, setPassword] = useState(credentials.password);
  const [testState, setTestState] = useState<TestState>('idle');
  const [testError, setTestError] = useState('');

  const hasChanges =
    host.trim() !== credentials.host ||
    username.trim() !== credentials.username ||
    password !== credentials.password;

  const handleTestConnection = useCallback(async () => {
    const trimHost = host.trim();
    const trimUser = username.trim();
    if (!trimHost || !trimUser || !password) {
      setTestState('error');
      setTestError('Host, username, and password are required.');
      return;
    }
    setTestState('testing');
    setTestError('');
    try {
      await login({ host: trimHost, username: trimUser, password });
      // Save on successful test
      setCredentials({ host: trimHost, username: trimUser, password });
      setTestState('success');
    } catch (err) {
      setTestState('error');
      setTestError((err as Error).message ?? 'Connection failed.');
    }
  }, [host, username, password, setCredentials]);

  const handleSave = useCallback(() => {
    setCredentials({ host: host.trim(), username: username.trim(), password });
    setTestState('idle');
  }, [host, username, password, setCredentials]);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.root}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.screenTitle}>Settings</Text>

        {/* Router section */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Router</Text>

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Host</Text>
            <TextInput
              style={styles.fieldInput}
              value={host}
              onChangeText={(t) => { setHost(t); setTestState('idle'); }}
              placeholder="192.168.1.1"
              placeholderTextColor="#94a3b8"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              returnKeyType="next"
            />
          </View>

          <View style={[styles.fieldRow, styles.fieldRowBorder]}>
            <Text style={styles.fieldLabel}>Username</Text>
            <TextInput
              style={styles.fieldInput}
              value={username}
              onChangeText={(t) => { setUsername(t); setTestState('idle'); }}
              placeholder="admin"
              placeholderTextColor="#94a3b8"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
            />
          </View>

          <View style={[styles.fieldRow, styles.fieldRowBorder]}>
            <Text style={styles.fieldLabel}>Password</Text>
            <TextInput
              style={styles.fieldInput}
              value={password}
              onChangeText={(t) => { setPassword(t); setTestState('idle'); }}
              placeholder="password"
              placeholderTextColor="#94a3b8"
              secureTextEntry
              returnKeyType="done"
              onSubmitEditing={handleTestConnection}
            />
          </View>

          {/* status feedback */}
          {testState === 'success' && (
            <View style={[styles.testFeedback, styles.testSuccess]}>
              <Text style={styles.testFeedbackText}>Connected successfully. Credentials saved.</Text>
            </View>
          )}
          {testState === 'error' && (
            <View style={[styles.testFeedback, styles.testError]}>
              <Text style={styles.testFeedbackText}>{testError}</Text>
            </View>
          )}

          <View style={styles.cardActions}>
            {hasChanges && testState !== 'success' && (
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                <Text style={styles.saveBtnText}>Save</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.testBtn, testState === 'testing' && styles.testBtnDisabled]}
              onPress={handleTestConnection}
              disabled={testState === 'testing'}
            >
              {testState === 'testing' ? (
                <ActivityIndicator size="small" color="#2563eb" />
              ) : (
                <Text style={styles.testBtnText}>Test Connection</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Developer Tools section */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Developer Tools</Text>
          <TouchableOpacity style={styles.devRow} onPress={() => nav.push('/probe')} activeOpacity={0.7}>
            <View>
              <Text style={styles.devRowTitle}>Raw Probe</Text>
              <Text style={styles.devRowSub}>Send arbitrary HTTP requests to the router</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Recovery note */}
        <View style={styles.noteCard}>
          <Text style={styles.noteTitle}>Physical Recovery</Text>
          <Text style={styles.noteBody}>
            Physical reset: hold the RESET button for 10+ seconds. This will erase all settings including Wi-Fi passwords.
          </Text>
        </View>

        <Text style={styles.version}>GM630 Manager v1.0.0</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ── styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f8fafc' },
  content: {
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 56 : 24,
    paddingBottom: 48,
  },

  screenTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 24,
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
  },

  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 4,
    minHeight: 50,
  },
  fieldRowBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#f1f5f9',
  },
  fieldLabel: {
    fontSize: 15,
    color: '#1e293b',
    width: 90,
    flexShrink: 0,
  },
  fieldInput: {
    flex: 1,
    fontSize: 15,
    color: '#0f172a',
    paddingVertical: 8,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },

  testFeedback: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginTop: 4,
  },
  testSuccess: { backgroundColor: '#f0fdf4' },
  testError: { backgroundColor: '#fef2f2' },
  testFeedbackText: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 18,
  },

  cardActions: {
    flexDirection: 'row',
    gap: 10,
    padding: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#f1f5f9',
  },
  saveBtn: {
    flex: 1,
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  saveBtnText: { color: '#16a34a', fontWeight: '700', fontSize: 14 },
  testBtn: {
    flex: 1,
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  testBtnDisabled: { opacity: 0.6 },
  testBtnText: { color: '#2563eb', fontWeight: '700', fontSize: 14 },

  devRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#f1f5f9',
  },
  devRowTitle: { fontSize: 15, fontWeight: '600', color: '#1e293b', marginBottom: 2 },
  devRowSub: { fontSize: 12, color: '#94a3b8' },
  chevron: { fontSize: 22, color: '#cbd5e1', fontWeight: '300' },

  noteCard: {
    backgroundColor: '#fffbeb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  noteTitle: { fontSize: 13, fontWeight: '700', color: '#92400e', marginBottom: 6 },
  noteBody: { fontSize: 13, color: '#78350f', lineHeight: 20 },

  version: {
    fontSize: 11,
    color: '#cbd5e1',
    textAlign: 'center',
    marginTop: 8,
  },
});
