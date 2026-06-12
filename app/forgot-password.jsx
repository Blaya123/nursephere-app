import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { auth } from '../services/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [devToken, setDevToken] = useState('');

  async function handleSend() {
    if (!email) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }
    setLoading(true);
    try {
      const data = await auth.forgotPassword({ email });
      setSent(true);
      if (data.resetToken) setDevToken(data.resetToken);
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <LinearGradient colors={['#008751', '#004D2E']} style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0} style={styles.content}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>

        <Ionicons name="lock-open" size={48} color="#4ADE80" style={{ marginBottom: 16 }} />
        <Text style={styles.title}>Reset Password</Text>
        <Text style={styles.subtitle}>Enter your email to receive a reset token</Text>

        {devToken ? (
          <Text style={styles.devHint}>Dev Mode — Token: {devToken}</Text>
        ) : null}

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color="rgba(255,255,255,0.6)" />
            <TextInput style={styles.input} placeholder="Email" placeholderTextColor="rgba(255,255,255,0.4)" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" editable={!sent} />
          </View>

          {sent ? (
            <TouchableOpacity style={styles.button} onPress={() => router.push({ pathname: '/reset-password', params: { email } })}>
              <Text style={styles.buttonText}>I Have a Token</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={[styles.button, loading && { opacity: 0.7 }]} onPress={handleSend} disabled={loading}>
              <Text style={styles.buttonText}>{loading ? 'Sending...' : 'Send Reset Token'}</Text>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
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
  devHint: { color: '#FBBF24', fontSize: 13, fontWeight: '600', marginBottom: 16, textAlign: 'center', lineHeight: 20 },
});
