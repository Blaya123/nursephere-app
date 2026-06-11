import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { auth, setToken, setStoredUser } from '../services/api';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Nursing Student');
  const [year, setYear] = useState('1');
  const [institution, setInstitution] = useState('');
  const [loading, setLoading] = useState(false);

  const roles = ['BSN Student', 'RN', 'Midwife', 'Nursing Student', 'Other'];
  const years = ['1', '2', '3', '4', '5', 'Graduate'];

  async function handleRegister() {
    if (!name || !email || !password) {
      Alert.alert('Error', 'Please fill in required fields');
      return;
    }
    setLoading(true);
    try {
      const data = await auth.register({ name, email, password, role, year, institution });
      await setToken(data.token);
      await setStoredUser(data.user);
      router.replace('/(tabs)');
    } catch (err) {
      Alert.alert('Registration Failed', err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <LinearGradient colors={['#008751', '#004D2E']} style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
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

            <View style={styles.row}>
              <View style={[styles.inputContainer, { flex: 1 }]}>
                <TextInput style={styles.input} value={role} editable={false} />
              </View>
              <TouchableOpacity style={styles.pickerButton}>
                <Text style={styles.pickerText}>Role</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={[styles.button, loading && { opacity: 0.7 }]} onPress={handleRegister} disabled={loading}>
              <Text style={styles.buttonText}>{loading ? 'Creating...' : 'Create Account'}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push('/login')}>
              <Text style={styles.link}>Already have an account? Sign In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  row: { flexDirection: 'row', gap: 10 },
  pickerButton: { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 16, paddingHorizontal: 16, justifyContent: 'center' },
  pickerText: { color: 'rgba(255,255,255,0.7)', fontSize: 14 },
  button: { backgroundColor: '#fff', paddingVertical: 16, borderRadius: 16, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#008751', fontSize: 18, fontWeight: '700' },
  link: { color: 'rgba(255,255,255,0.8)', textAlign: 'center', marginTop: 16, fontSize: 14 },
});
