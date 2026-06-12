import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { ActiveTimerProvider } from './context/ActiveTimerContext';
import { NotificationProvider } from './context/NotificationContext';
import { SocketProvider } from './context/SocketContext';

function RootLayoutInner() {
  const { isDark } = useTheme();
  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="register" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="verify-otp" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="forgot-password" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="reset-password" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="assistant" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="dosage" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="diagnosis" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="drugs" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="guides" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="roadmap" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="academic-planner" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="notifications" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="messages" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="dm-chat" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="user-profile" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="admin-dashboard" options={{ headerShown: false, animation: 'slide_from_right' }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <ActiveTimerProvider>
        <NotificationProvider>
          <SocketProvider>
            <RootLayoutInner />
          </SocketProvider>
        </NotificationProvider>
      </ActiveTimerProvider>
    </ThemeProvider>
  );
}
