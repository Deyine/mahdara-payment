import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import { colors } from '../constants/theme';
import LanguageSwitcher from '../components/LanguageSwitcher';
import '../i18n'; // Initialize i18n

export default function RootLayout() {
  const { t } = useTranslation();

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: '#ffffff',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            title: t('catalog.title'),
            headerRight: () => <LanguageSwitcher />,
          }}
        />
        <Stack.Screen
          name="car/[id]"
          options={{
            title: t('carDetail.title'),
          }}
        />
      </Stack>
    </>
  );
}
