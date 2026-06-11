import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import { DarkColors, Colors } from '../constants/theme';

export default function RootLayout() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const theme = isDark ? DarkColors : Colors;

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="register" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="assistant" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="dosage" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="diagnosis" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="drugs" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="guides" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="roadmap" options={{ headerShown: false, animation: 'slide_from_right' }} />
      </Stack>
    </>
  );
}
