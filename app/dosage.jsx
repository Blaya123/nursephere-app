import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, useColorScheme, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, DarkColors } from '../constants/theme';
import { clinicalApi } from '../services/api';

const CALC_TYPES = [
  { id: 'weight-based', label: 'Weight-Based', icon: 'scale' },
  { id: 'iv-drip', label: 'IV Drip Rate', icon: 'water' },
  { id: 'bsa', label: 'BSA', icon: 'body' },
  { id: 'desired-dose', label: 'Desired Dose', icon: 'medkit' },
];

export default function Dosage() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const theme = isDark ? DarkColors : Colors;

  const [type, setType] = useState('weight-based');
  const [weight, setWeight] = useState('');
  const [dose, setDose] = useState('');
  const [volume, setVolume] = useState('');
  const [time, setTime] = useState('');
  const [bsa, setBsa] = useState('');
  const [desiredDose, setDesiredDose] = useState('');
  const [concentration, setConcentration] = useState('');
  const [result, setResult] = useState(null);
  const [steps, setSteps] = useState([]);
  const [loading, setLoading] = useState(false);

  async function calculate() {
    setLoading(true);
    try {
      const body = { type };
      if (type === 'weight-based') { body.weight = parseFloat(weight); body.dose = parseFloat(dose); }
      if (type === 'iv-drip') { body.volume = parseFloat(volume); body.time = parseFloat(time); }
      if (type === 'bsa') { body.weight = parseFloat(weight); body.bsa = parseFloat(bsa); }
      if (type === 'desired-dose') { body.desiredDose = parseFloat(desiredDose); body.concentration = parseFloat(concentration); body.volume = 1; }

      const data = await clinicalApi.dosage(body);
      setResult(data.result);
      setSteps(data.steps || []);
    } catch (err) {
      setResult(null);
      setSteps([]);
    } finally {
      setLoading(false);
    }
  }

  const fields = {
    'weight-based': [
      { key: 'weight', label: 'Weight (kg)', value: weight, set: setWeight, placeholder: 'e.g. 70' },
      { key: 'dose', label: 'Dose per kg (mg)', value: dose, set: setDose, placeholder: 'e.g. 5' },
    ],
    'iv-drip': [
      { key: 'volume', label: 'Volume (mL)', value: volume, set: setVolume, placeholder: 'e.g. 1000' },
      { key: 'time', label: 'Time (hours)', value: time, set: setTime, placeholder: 'e.g. 8' },
    ],
    'bsa': [
      { key: 'weight', label: 'Weight (kg)', value: weight, set: setWeight, placeholder: 'e.g. 70' },
      { key: 'bsa', label: 'Height (cm)', value: bsa, set: setBsa, placeholder: 'e.g. 170' },
    ],
    'desired-dose': [
      { key: 'desiredDose', label: 'Desired Dose (mg)', value: desiredDose, set: setDesiredDose, placeholder: 'e.g. 500' },
      { key: 'concentration', label: 'Concentration (mg/mL)', value: concentration, set: setConcentration, placeholder: 'e.g. 250' },
    ],
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} showsVerticalScrollIndicator={false}>
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Dosage Calculator</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.typeRow}>
        {CALC_TYPES.map(t => (
          <TouchableOpacity key={t.id} style={[styles.typeChip, { backgroundColor: type === t.id ? theme.primary : theme.surfaceAlt, borderColor: theme.border }]} onPress={() => setType(t.id)}>
            <Ionicons name={t.icon} size={16} color={type === t.id ? '#fff' : theme.textSecondary} />
            <Text style={[styles.typeLabel, { color: type === t.id ? '#fff' : theme.textSecondary }]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={[styles.formCard, { backgroundColor: theme.surface }]}>
        {fields[type].map(f => (
          <View key={f.key}>
            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>{f.label}</Text>
            <TextInput style={[styles.input, { backgroundColor: theme.surfaceAlt, color: theme.text, borderColor: theme.border }]} value={f.value} onChangeText={f.set} placeholder={f.placeholder} placeholderTextColor={theme.textLight} keyboardType="numeric" />
          </View>
        ))}

        <TouchableOpacity style={[styles.calcBtn, { backgroundColor: theme.primary }]} onPress={calculate} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.calcBtnText}>Calculate</Text>}
        </TouchableOpacity>
      </View>

      {result && (
        <View style={[styles.resultCard, { backgroundColor: theme.surface }]}>
          <Text style={[styles.resultTitle, { color: theme.text }]}>Result</Text>
          <Text style={[styles.resultValue, { color: theme.primary }]}>
            {Object.values(result).join(' ')} {result.unit}
          </Text>
          {steps.length > 0 && (
            <View style={styles.stepsSection}>
              <Text style={[styles.stepsTitle, { color: theme.textSecondary }]}>Step-by-step:</Text>
              {steps.map((s, i) => (
                <Text key={i} style={[styles.stepText, { color: theme.text }]}>{i + 1}. {s}</Text>
              ))}
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 60, paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1 },
  backBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, padding: 16, paddingBottom: 8 },
  typeChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  typeLabel: { fontSize: 13, fontWeight: '500' },
  formCard: { margin: 16, borderRadius: 16, padding: 20, gap: 14 },
  fieldLabel: { fontSize: 13, fontWeight: '500', marginBottom: 4 },
  input: { borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, borderWidth: 1 },
  calcBtn: { paddingVertical: 14, borderRadius: 14, alignItems: 'center', marginTop: 4 },
  calcBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  resultCard: { margin: 16, marginTop: 0, borderRadius: 16, padding: 20 },
  resultTitle: { fontSize: 14, fontWeight: '600', marginBottom: 4 },
  resultValue: { fontSize: 28, fontWeight: '800', marginBottom: 12 },
  stepsSection: { borderTopWidth: 1, borderTopColor: '#E5E7EB', paddingTop: 12 },
  stepsTitle: { fontSize: 13, fontWeight: '500', marginBottom: 6 },
  stepText: { fontSize: 13, lineHeight: 20 },
});
