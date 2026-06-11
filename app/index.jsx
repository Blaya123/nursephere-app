import { useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getStoredUser, getToken } from '../services/api';
import { Colors } from '../constants/theme';

const { width, height } = Dimensions.get('window');

export default function Welcome() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 1500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  useFocusEffect(useCallback(() => {
    checkAuth();
  }, []));

  async function checkAuth() {
    const token = await getToken();
    const user = await getStoredUser();
    if (token && user) {
      router.replace('/(tabs)');
    }
  }

  return (
    <LinearGradient colors={['#008751', '#004D2E', '#002814']} style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <View style={styles.iconContainer}>
            <Ionicons name="medical" size={60} color="#fff" />
          </View>
        </Animated.View>

        <Text style={styles.title}>NURSPHERE</Text>
        <Text style={styles.subtitle}>AI-Powered Nursing Platform</Text>
        <Text style={styles.tagline}>Empowering the next generation of Nigerian nurses</Text>

        <View style={styles.features}>
          {[
            { icon: 'chatbubble-ellipses', text: 'AI Tutor' },
            { icon: 'people', text: 'Community' },
            { icon: 'medkit', text: 'Clinical Tools' },
            { icon: 'map', text: 'Career Roadmap' },
          ].map((f, i) => (
            <View key={i} style={styles.featureItem}>
              <Ionicons name={f.icon} size={20} color="#4ADE80" />
              <Text style={styles.featureText}>{f.text}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.button} onPress={() => router.push('/register')} activeOpacity={0.8}>
          <Text style={styles.buttonText}>Get Started</Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/login')} style={styles.linkContainer}>
          <Text style={styles.linkText}>Already have an account? Sign In</Text>
        </TouchableOpacity>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  iconContainer: { width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 42, fontWeight: '900', color: '#fff', letterSpacing: 4, marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#4ADE80', fontWeight: '600', marginBottom: 8 },
  tagline: { fontSize: 14, color: 'rgba(255,255,255,0.7)', textAlign: 'center', marginBottom: 40 },
  features: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 16, marginBottom: 40 },
  featureItem: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  featureText: { color: '#fff', fontSize: 13, fontWeight: '500' },
  button: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fff', paddingHorizontal: 32, paddingVertical: 16, borderRadius: 30, width: '100%', justifyContent: 'center' },
  buttonText: { color: '#008751', fontSize: 18, fontWeight: '700' },
  linkContainer: { marginTop: 20 },
  linkText: { color: 'rgba(255,255,255,0.8)', fontSize: 14 },
});
