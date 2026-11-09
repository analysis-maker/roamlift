import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ensureSession } from '../lib/supabase';
import { useTheme } from '../lib/theme';

export default function RootLayout() {
  const t = useTheme();
  useEffect(() => {
    ensureSession().catch(() => {}); // offline is fine; we retry on the next backend call
  }, []);
  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: t.bg },
          headerTintColor: t.ink,
          headerShadowVisible: false,
          headerTitleStyle: { fontWeight: '700' },
          contentStyle: { backgroundColor: t.bg },
        }}
      >
        <Stack.Screen name="index" options={{ title: 'Roamlift' }} />
        <Stack.Screen name="nearby" options={{ title: 'Near me' }} />
        <Stack.Screen name="scan" options={{ title: 'Scan the gym' }} />
        <Stack.Screen name="kit" options={{ title: 'Confirm the kit' }} />
        <Stack.Screen name="goals" options={{ title: 'Your plan' }} />
        <Stack.Screen name="plan" options={{ title: 'Plan' }} />
        <Stack.Screen name="session/[key]" options={{ title: 'Train' }} />
      </Stack>
    </SafeAreaProvider>
  );
}
