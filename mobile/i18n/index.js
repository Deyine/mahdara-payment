import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { I18nManager } from 'react-native';

import fr from '../locales/fr.json';
import ar from '../locales/ar.json';

const LANGUAGE_KEY = '@bestcar_language';

// Get saved language or default to French
const getInitialLanguage = async () => {
  try {
    const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
    return savedLanguage || 'fr';
  } catch (error) {
    return 'fr';
  }
};

// Save language preference
export const saveLanguage = async (language) => {
  try {
    await AsyncStorage.setItem(LANGUAGE_KEY, language);
  } catch (error) {
    console.error('Error saving language:', error);
  }
};

// Check if language is RTL (Right-to-Left)
export const isRTL = (language) => {
  return language === 'ar';
};

// Update app RTL layout
export const updateRTL = async (language) => {
  const rtl = isRTL(language);
  if (I18nManager.isRTL !== rtl) {
    I18nManager.forceRTL(rtl);
    I18nManager.allowRTL(rtl);
  }
};

// Initialize i18n
const initI18n = async () => {
  const initialLanguage = await getInitialLanguage();

  await i18n
    .use(initReactI18next)
    .init({
      compatibilityJSON: 'v3',
      resources: {
        fr: { translation: fr },
        ar: { translation: ar },
      },
      lng: initialLanguage,
      fallbackLng: 'fr',
      interpolation: {
        escapeValue: false,
      },
    });

  // Set RTL if needed
  await updateRTL(initialLanguage);
};

initI18n();

export default i18n;
