import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { auth } from '../services/api';


const Container = Platform.OS === 'ios' ? KeyboardAvoidingView : View;

export default function ResetPassword() {
  const { email: paramEmail } = useLocalSearchParams();
  const [email, setEmail] = useState(paramEmail || '');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleReset() {
    if (!email || !token || !newPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await auth.resetPassword({ email, token, newPassword });
      Alert.alert('Success', 'Password reset successful. Sign in with your new password.', [
        { text: 'Sign In', onPress: () => router.push('/login') },
      ]);
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <LinearGradient colors={['#008751', '#004D2E']} style={styles.container}>
      <Container behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0} style={styles.content}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>

        <Ionicons name="key" size={48} color="#4ADE80" style={{ marginBottom: 16 }} />
        <Text style={styles.title}>New Password</Text>
        <Text style={styles.subtitle}>Enter the reset token and your new password</Text>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color="rgba(255,255,255,0.6)" />
            <TextInput style={styles.input} placeholder="Email" placeholderTextColor="rgba(255,255,255,0.4)" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="key-outline" size={20} color="rgba(255,255,255,0.6)" />
            <TextInput style={styles.input} placeholder="Reset Token" placeholderTextColor="rgba(255,255,255,0.4)" value={token} onChangeText={setToken} autoCapitalize="none" />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color="rgba(255,255,255,0.6)" />
            <TextInput style={styles.input} placeholder="New Password (min 6 chars)" placeholderTextColor="rgba(255,255,255,0.4)" value={newPassword} onChangeText={setNewPassword} secureTextEntry />
          </View>

          <TouchableOpacity style={[styles.button, loading && { opacity: 0.7 }]} onPress={handleReset} disabled={loading}>
            <Text style={styles.buttonText}>{loading ? 'Resetting...' : 'Reset Password'}</Text>
          </TouchableOpacity>
        </View>
      </Container>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 24, justifyContent: 'center' },
  back: { position: 'absolute', top: 60, left: 20, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 28, fontWeight: '900', color: '#fff', marginBottom: 8 },
  subtitle: { fontSize: 15, color: 'rgba(255,255,255,0.7)', marginBottom: 32, lineHeight: 22 },
  form: { gap: 16 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14 },
  input: { flex: 1, color: '#fff', fontSize: 16 },
  button: { backgroundColor: '#fff', paddingVertical: 16, borderRadius: 16, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#008751', fontSize: 18, fontWeight: '700' },
});

