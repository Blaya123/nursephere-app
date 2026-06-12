import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { aiApi } from '../services/api';
import { useTheme } from './context/ThemeContext';

export default function Diagnosis() {
  const { isDark, theme } = useTheme();

  const [symptoms, setSymptoms] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  async function diagnose() {
    if (!symptoms.trim()) return;
    setLoading(true);
    try {
      const data = await aiApi.diagnosis(symptoms);
      setResult(data.response);
    } catch {
      setResult('Unable to generate diagnosis. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} showsVerticalScrollIndicator={false}>
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>NANDA-I Diagnosis</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.body}>
        <View style={[styles.inputCard, { backgroundColor: theme.surface }]}>
          <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Describe symptoms or patient presentation</Text>
          <TextInput style={[styles.input, { backgroundColor: theme.surfaceAlt, color: theme.text, borderColor: theme.border }]} value={symptoms} onChangeText={setSymptoms} placeholder="e.g., 45-year-old female with sharp chest pain, shortness of breath, and anxiety..." placeholderTextColor={theme.textLight} multiline numberOfLines={5} textAlignVertical="top" />
          <TouchableOpacity style={[styles.diagnoseBtn, { backgroundColor: theme.primary }]} onPress={diagnose} disabled={loading || !symptoms.trim()}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.diagnoseBtnText}>Generate Diagnosis</Text>}
          </TouchableOpacity>
        </View>

        {result ? (
          <View style={[styles.resultCard, { backgroundColor: theme.surface }]}>
            <View style={styles.resultHeader}>
              <Ionicons name="document-text" size={20} color={theme.primary} />
              <Text style={[styles.resultTitle, { color: theme.text }]}>AI Diagnosis Result</Text>
            </View>
            <Text style={[styles.resultText, { color: theme.text }]}>{result}</Text>
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 60, paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1 },
  backBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  body: { padding: 16, gap: 16 },
  inputCard: { borderRadius: 16, padding: 20, gap: 12 },
  inputLabel: { fontSize: 14, fontWeight: '500' },
  input: { borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, borderWidth: 1, minHeight: 100 },
  diagnoseBtn: { paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  diagnoseBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  resultCard: { borderRadius: 16, padding: 20 },
  resultHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  resultTitle: { fontSize: 16, fontWeight: '600' },
  resultText: { fontSize: 14, lineHeight: 22 },
});
