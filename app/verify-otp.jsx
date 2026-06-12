import { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { auth, setToken, setStoredUser } from '../services/api';


const Container = Platform.OS === 'ios' ? KeyboardAvoidingView : View;

export default function VerifyOTP() {
  const { name, email, password, role, year, institution, loginFlow } = useLocalSearchParams();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const inputs = useRef([]);

  function handleChange(text, index) {
    const digit = text.replace(/[^0-9]/g, '');
    if (!digit) return;
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    if (index < 5) inputs.current[index + 1]?.focus();
  }

  function handleKeyPress(e, index) {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  }

  async function handleVerify() {
    const code = otp.join('');
    if (code.length !== 6) {
      Alert.alert('Error', 'Please enter the 6-digit code');
      return;
    }
    setLoading(true);
    try {
      const data = loginFlow === 'true'
        ? await auth.verifyOTP({ email, otp: code })
        : await auth.register({ name, email, password, otp: code, role, year, institution });
      await setToken(data.token);
      await setStoredUser(data.user);
      router.replace('/(tabs)');
    } catch (err) {
      Alert.alert('Verification Failed', err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    try {
      await auth.resendOTP({ email });
      Alert.alert('OTP Resent', 'Check your email for the verification code');
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  }

  return (
    <LinearGradient colors={['#008751', '#004D2E']} style={styles.container}>
      <Container behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0} style={styles.content}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>

        <Ionicons name="mail-unread" size={48} color="#4ADE80" style={{ marginBottom: 16 }} />
        <Text style={styles.title}>Verify Email</Text>
        <Text style={styles.subtitle}>Enter the 6-digit code sent to{'\n'}{email}</Text>

        <View style={styles.otpRow}>
          {otp.map((digit, i) => (
            <TextInput
              key={i}
              ref={ref => inputs.current[i] = ref}
              style={[styles.otpBox, digit ? styles.otpBoxFilled : null]}
              value={digit}
              onChangeText={text => handleChange(text, i)}
              onKeyPress={e => handleKeyPress(e, i)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
            />
          ))}
        </View>

        <TouchableOpacity style={[styles.button, loading && { opacity: 0.7 }]} onPress={handleVerify} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? 'Verifying...' : 'Verify & Create Account'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleResend} style={{ marginTop: 16 }}>
          <Text style={styles.link}>Resend Code</Text>
        </TouchableOpacity>
      </Container>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 24, justifyContent: 'center', alignItems: 'center' },
  back: { position: 'absolute', top: 60, left: 20, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 28, fontWeight: '900', color: '#fff', marginBottom: 8 },
  subtitle: { fontSize: 15, color: 'rgba(255,255,255,0.7)', textAlign: 'center', marginBottom: 32, lineHeight: 22 },
  otpRow: { flexDirection: 'row', gap: 8, marginBottom: 28 },
  otpBox: { width: 48, height: 56, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.12)', color: '#fff', fontSize: 24, fontWeight: '800', textAlign: 'center' },
  otpBoxFilled: { backgroundColor: 'rgba(255,255,255,0.25)', borderWidth: 1, borderColor: '#4ADE80' },
  button: { backgroundColor: '#fff', paddingVertical: 16, borderRadius: 16, alignItems: 'center', width: '100%' },
  buttonText: { color: '#008751', fontSize: 18, fontWeight: '700' },
  link: { color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: '600' },
});

