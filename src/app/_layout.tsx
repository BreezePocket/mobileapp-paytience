import '@/live/polyfills';
import { Fredoka_600SemiBold, Fredoka_700Bold } from '@expo-google-fonts/fredoka';
import { Nunito_400Regular, Nunito_600SemiBold, Nunito_800ExtraBold, useFonts } from '@expo-google-fonts/nunito';
import { Stack } from 'expo-router/js-stack';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { TermProvider } from '@/components/widgets';
import { AppStoreProvider, useStore } from '@/store/app-store';
import { colors } from '@/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

function Root() {
  const { state } = useStore();
  const [fontsLoaded] = useFonts({ Fredoka_600SemiBold, Fredoka_700Bold, Nunito_400Regular, Nunito_600SemiBold, Nunito_800ExtraBold });
  // wait for saved state and the first answer from the backend (or its timeout), so no screen flashes empty prices
  const ready = fontsLoaded && state.hydrated && state.market.status !== 'connecting';

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  if (!ready) return <View style={{ flex: 1, backgroundColor: colors.skyTop }} />;

  return (
    <TermProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, cardStyle: { backgroundColor: colors.skyBottom, maxHeight: '100%' } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />
        <Stack.Screen name="sign-in" options={{ presentation: 'modal' }} />
        <Stack.Screen name="primer" options={{ presentation: 'modal' }} />
        <Stack.Screen name="practice" options={{ presentation: 'modal' }} />
        <Stack.Screen name="deal/success" options={{ gestureEnabled: false, animation: 'fade' }} />
      </Stack>
    </TermProvider>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AppStoreProvider>
        <Root />
      </AppStoreProvider>
    </SafeAreaProvider>
  );
}
