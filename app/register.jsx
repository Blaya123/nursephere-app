import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { auth } from '../services/api';

const Container = Platform.OS === 'ios' ? KeyboardAvoidingView : View;

const programmeOptions = [
  { value: 'BNSc Student', label: 'BNSc Nursing (4 yrs)' },
  { value: 'Diploma Nursing Student', label: 'Diploma Nursing (3 yrs)' },
  { value: 'Midwifery Student', label: 'Midwifery (RM)' },
  { value: 'Community Nursing Student', label: 'Community Nursing (CHEW)' },
  { value: 'Post-Basic Student', label: 'Post-Basic Nursing' },
];

const maxYears = { 'BNSc Student': 4, 'Diploma Nursing Student': 3, 'Midwifery Student': 3, 'Community Nursing Student': 3, 'Post-Basic Student': 1 };

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('BNSc Student');
  const [year, setYear] = useState('1');
  const [institution, setInstitution] = useState('');
  const [loading, setLoading] = useState(false);

  const years = Array.from({ length: maxYears[role] || 4 }, (_, i) => String(i + 1));

  async function handleRegister() {
    if (!name || !email || !password) {
      Alert.alert('Error', 'Please fill in required fields');
      return;
    }
    setLoading(true);
    try {
      const data = await auth.sendOTP({ email });
      router.push({ pathname: '/verify-otp', params: { name, email, password, role, year, institution } });
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <LinearGradient colors={['#008751', '#004D2E']} style={styles.container}>
      <Container behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <TouchableOpacity onPress={() => router.back()} style={styles.back}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>

          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join the Nursphere community</Text>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={20} color="rgba(255,255,255,0.6)" />
              <TextInput style={styles.input} placeholder="Full Name" placeholderTextColor="rgba(255,255,255,0.4)" value={name} onChangeText={setName} />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color="rgba(255,255,255,0.6)" />
              <TextInput style={styles.input} placeholder="Email" placeholderTextColor="rgba(255,255,255,0.4)" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="rgba(255,255,255,0.6)" />
              <TextInput style={styles.input} placeholder="Password (min 6 chars)" placeholderTextColor="rgba(255,255,255,0.4)" value={password} onChangeText={setPassword} secureTextEntry />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="school-outline" size={20} color="rgba(255,255,255,0.6)" />
              <TextInput style={styles.input} placeholder="Institution (optional)" placeholderTextColor="rgba(255,255,255,0.4)" value={institution} onChangeText={setInstitution} />
            </View>

            <View style={styles.yearContainer}>
              <Text style={styles.yearLabel}>Nursing Programme</Text>
              <View style={styles.programmeRow}>
                {programmeOptions.map((p) => (
                  <TouchableOpacity key={p.value} style={[styles.programmeBtn, role === p.value && styles.programmeBtnActive]} onPress={() => { setRole(p.value); setYear('1'); }}>
                    <Text style={[styles.programmeBtnText, role === p.value && styles.programmeBtnTextActive]}>{p.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.yearContainer}>
              <Text style={styles.yearLabel}>Year of Study</Text>
              <View style={styles.yearRow}>
                {years.map((y) => (
                  <TouchableOpacity key={y} style={[styles.yearBtn, year === y && styles.yearBtnActive]} onPress={() => setYear(y)}>
                    <Text style={[styles.yearBtnText, year === y && styles.yearBtnTextActive]}>Year {y}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity style={[styles.button, loading && { opacity: 0.7 }]} onPress={handleRegister} disabled={loading}>
              <Text style={styles.buttonText}>{loading ? 'Creating...' : 'Create Account'}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push('/login')}>
              <Text style={styles.link}>Already have an account? Sign In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </Container>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: 24, justifyContent: 'center', paddingVertical: 60 },
  back: { position: 'absolute', top: 20, left: 0, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 34, fontWeight: '900', color: '#fff', marginBottom: 4, marginTop: 40 },
  subtitle: { fontSize: 16, color: 'rgba(255,255,255,0.7)', marginBottom: 32 },
  form: { gap: 14 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14 },
  input: { flex: 1, color: '#fff', fontSize: 16 },
  yearContainer: { marginTop: 4 },
  yearLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 13, marginBottom: 8 },
  programmeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  programmeBtn: { backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 10, alignItems: 'center', minWidth: '30%', flex: 1 },
  programmeBtnActive: { backgroundColor: '#fff' },
  programmeBtnText: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '600', textAlign: 'center' },
  programmeBtnTextActive: { color: '#008751' },
  yearRow: { flexDirection: 'row', gap: 8 },
  yearBtn: { flex: 1, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  yearBtnActive: { backgroundColor: '#fff' },
  yearBtnText: { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '600' },
  yearBtnTextActive: { color: '#008751' },
  button: { backgroundColor: '#fff', paddingVertical: 16, borderRadius: 16, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#008751', fontSize: 18, fontWeight: '700' },
  link: { color: 'rgba(255,255,255,0.8)', textAlign: 'center', marginTop: 16, fontSize: 14 },
});
