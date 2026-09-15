import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as FileSystem from 'expo-file-system/legacy';

interface Field {
  id: string;
  key: string;
  value: string;
}

const LOGIN_TEMPLATE: Field[] = [
  { id: '1', key: 'username', value: 'admin' },
  { id: '2', key: 'psd', value: 'admin' },
  { id: '3', key: 'submit-url', value: '/' },
];

function uid(): string {
  return Math.random().toString(36).slice(2);
}

export default function ProbeScreen() {
  const [path, setPath] = useState('/admin/status_deviceinfo.asp');
  const [method, setMethod] = useState<'GET' | 'POST'>('GET');
  const [fields, setFields] = useState<Field[]>([{ id: uid(), key: '', value: '' }]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    status: number;
    headers: Record<string, string>;
    body: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [headersExpanded, setHeadersExpanded] = useState(false);

  const host = '192.168.1.1';

  function addField() {
    setFields((f) => [...f, { id: uid(), key: '', value: '' }]);
  }

  function removeField(id: string) {
    setFields((f) => f.filter((field) => field.id !== id));
  }

  function updateField(id: string, key: 'key' | 'value', text: string) {
    setFields((f) => f.map((field) => (field.id === id ? { ...field, [key]: text } : field)));
  }

  function loadTemplate() {
    setFields(LOGIN_TEMPLATE.map((f) => ({ ...f, id: uid() })));
  }

  async function send() {
    setLoading(true);
    setResult(null);
    setError(null);

    const url = `http://${host}${path}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10_000);

    try {
      const headers: Record<string, string> = {
        Referer: `http://${host}/`,
        Authorization: `Basic ${btoa('admin:admin')}`,
      };

      let fetchInit: RequestInit = { method, headers, signal: controller.signal };

      if (method === 'POST') {
        const bodyFields = fields.filter((f) => f.key.trim() !== '');
        const params = new URLSearchParams();
        bodyFields.forEach((f) => params.append(f.key, f.value));
        headers['Content-Type'] = 'application/x-www-form-urlencoded';
        fetchInit.body = params.toString();
      }

      const response = await fetch(url, fetchInit);
      const body = await response.text();

      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      setResult({ status: response.status, headers: responseHeaders, body });
    } catch (err) {
      const msg = (err as Error).name === 'AbortError'
        ? 'Request timed out after 10 seconds'
        : (err as Error).message;
      setError(msg);
    } finally {
      clearTimeout(timer);
      setLoading(false);
    }
  }

  async function copyResponse() {
    if (!result) return;
    await Clipboard.setStringAsync(result.body);
    Alert.alert('Copied', 'Response body copied to clipboard.');
  }

  async function saveFixture() {
    if (!result) return;
    Alert.prompt(
      'Save Fixture',
      'Enter a label for this fixture:',
      async (label) => {
        if (!label) return;
        const dir = FileSystem.documentDirectory + '__probe_fixtures__/';
        await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
        const filename = label.replace(/[^a-z0-9_-]/gi, '_') + '.html';
        await FileSystem.writeAsStringAsync(dir + filename, result.body);
        Alert.alert('Saved', `Fixture saved as ${filename}`);
      },
      'plain-text',
    );
  }

  const statusColor = result
    ? result.status >= 200 && result.status < 300
      ? '#22c55e'
      : '#ef4444'
    : '#888';

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.sectionLabel}>URL</Text>
        <View style={styles.urlRow}>
          <Text style={styles.baseUrl}>http://192.168.1.1</Text>
          <TextInput
            style={styles.pathInput}
            value={path}
            onChangeText={setPath}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="/path/to/page.asp"
            placeholderTextColor="#aaa"
          />
        </View>

        <Text style={styles.sectionLabel}>Method</Text>
        <View style={styles.methodRow}>
          {(['GET', 'POST'] as const).map((m) => (
            <TouchableOpacity
              key={m}
              style={[styles.methodBtn, method === m && styles.methodBtnActive]}
              onPress={() => setMethod(m)}
            >
              <Text style={[styles.methodBtnText, method === m && styles.methodBtnTextActive]}>
                {m}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {method === 'POST' && (
          <>
            <View style={styles.fieldHeader}>
              <Text style={styles.sectionLabel}>POST Fields</Text>
              <TouchableOpacity onPress={loadTemplate}>
                <Text style={styles.templateLink}>Load login template</Text>
              </TouchableOpacity>
            </View>
            {fields.map((field) => (
              <View key={field.id} style={styles.fieldRow}>
                <TextInput
                  style={[styles.fieldInput, styles.fieldKey]}
                  value={field.key}
                  onChangeText={(t) => updateField(field.id, 'key', t)}
                  placeholder="key"
                  placeholderTextColor="#aaa"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TextInput
                  style={[styles.fieldInput, styles.fieldValue]}
                  value={field.value}
                  onChangeText={(t) => updateField(field.id, 'value', t)}
                  placeholder="value"
                  placeholderTextColor="#aaa"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity onPress={() => removeField(field.id)} style={styles.removeBtn}>
                  <Text style={styles.removeBtnText}>×</Text>
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity style={styles.addFieldBtn} onPress={addField}>
              <Text style={styles.addFieldBtnText}>+ Add field</Text>
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity
          style={[styles.sendBtn, loading && styles.sendBtnDisabled]}
          onPress={send}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.sendBtnText}>Send</Text>
          )}
        </TouchableOpacity>

        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {result && (
          <View style={styles.resultBox}>
            <Text style={[styles.statusText, { color: statusColor }]}>
              HTTP {result.status}
            </Text>

            <TouchableOpacity
              style={styles.headersToggle}
              onPress={() => setHeadersExpanded((v) => !v)}
            >
              <Text style={styles.headersToggleText}>
                {headersExpanded ? '▾' : '▸'} Response Headers
              </Text>
            </TouchableOpacity>
            {headersExpanded && (
              <View style={styles.headersBox}>
                {Object.entries(result.headers).map(([k, v]) => (
                  <Text key={k} style={styles.headerLine}>
                    <Text style={styles.headerKey}>{k}: </Text>
                    {v}
                  </Text>
                ))}
              </View>
            )}

            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.actionBtn} onPress={copyResponse}>
                <Text style={styles.actionBtnText}>Copy Response</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={saveFixture}>
                <Text style={styles.actionBtnText}>Save Fixture</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.bodyScroll} horizontal>
              <Text style={styles.bodyText} selectable>
                {result.body}
              </Text>
            </ScrollView>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0f1117' },
  scroll: { flex: 1, padding: 16 },
  sectionLabel: { color: '#888', fontSize: 11, fontWeight: '600', textTransform: 'uppercase', marginTop: 16, marginBottom: 6 },
  urlRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1c1f2b', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10 },
  baseUrl: { color: '#555', fontSize: 13, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  pathInput: { flex: 1, color: '#e2e8f0', fontSize: 13, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', paddingLeft: 2 },
  methodRow: { flexDirection: 'row', gap: 8 },
  methodBtn: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 8, backgroundColor: '#1c1f2b', borderWidth: 1, borderColor: '#2a2d3a' },
  methodBtnActive: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
  methodBtnText: { color: '#888', fontWeight: '600', fontSize: 14 },
  methodBtnTextActive: { color: '#fff' },
  fieldHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 16, marginBottom: 6 },
  templateLink: { color: '#3b82f6', fontSize: 12 },
  fieldRow: { flexDirection: 'row', gap: 6, marginBottom: 6 },
  fieldInput: { backgroundColor: '#1c1f2b', color: '#e2e8f0', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 8, fontSize: 13, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  fieldKey: { flex: 2 },
  fieldValue: { flex: 3 },
  removeBtn: { width: 36, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1c1f2b', borderRadius: 6 },
  removeBtnText: { color: '#ef4444', fontSize: 20, lineHeight: 22 },
  addFieldBtn: { alignSelf: 'flex-start', paddingVertical: 6, paddingHorizontal: 12, backgroundColor: '#1c1f2b', borderRadius: 6, marginTop: 4 },
  addFieldBtnText: { color: '#3b82f6', fontSize: 13 },
  sendBtn: { marginTop: 20, backgroundColor: '#3b82f6', borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  sendBtnDisabled: { opacity: 0.6 },
  sendBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  errorBox: { marginTop: 16, backgroundColor: '#2d1414', borderRadius: 8, padding: 14 },
  errorText: { color: '#f87171', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', fontSize: 13 },
  resultBox: { marginTop: 16 },
  statusText: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  headersToggle: { paddingVertical: 6 },
  headersToggleText: { color: '#888', fontSize: 13 },
  headersBox: { backgroundColor: '#1c1f2b', borderRadius: 8, padding: 10, marginBottom: 8 },
  headerLine: { color: '#aaa', fontSize: 11, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', marginBottom: 2 },
  headerKey: { color: '#7dd3fc' },
  actionRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  actionBtn: { flex: 1, backgroundColor: '#1c1f2b', borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
  actionBtnText: { color: '#3b82f6', fontWeight: '600', fontSize: 13 },
  bodyScroll: { backgroundColor: '#0d1117', borderRadius: 8, maxHeight: 400, padding: 12 },
  bodyText: { color: '#a3e635', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', fontSize: 11, lineHeight: 18 },
});
