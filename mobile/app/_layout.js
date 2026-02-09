import { useState, useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import * as SplashScreenExpo from 'expo-splash-screen';
import * as Font from 'expo-font';
import { colors } from '../constants/theme';
import {
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
} from '@expo-google-fonts/nunito';
import SplashScreen from '../components/SplashScreen';
import '../i18n'; // Initialize i18n

// Keep the splash screen visible while we fetch resources
SplashScreenExpo.preventAutoHideAsync();

export default function RootLayout() {
  const { t } = useTranslation();
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        await Font.loadAsync({
          'Gagalin-Regular': require('../assets/Gagalin-Regular.otf'),
          'Nunito-Regular': Nunito_400Regular,
          'Nunito-SemiBold': Nunito_600SemiBold,
          'Nunito-Bold': Nunito_700Bold,
        });

        // Minimum splash screen duration
        await new Promise(resolve => setTimeout(resolve, 1500));
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
        await SplashScreenExpo.hideAsync();
      }
    }

    prepare();
  }, []);

  if (!appIsReady) {
    return <SplashScreen />;
  }

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: colors.surface,
          headerTitleStyle: { fontFamily: 'Nunito-Bold' },
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="car/[id]"
          options={{
            headerShown: false,
            animation: 'slide_from_bottom',
          }}
        />
      </Stack>
    </>
  );
}
