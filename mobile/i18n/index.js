import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { I18nManager } from 'react-native';
import { getLocales } from 'expo-localization';

import fr from '../locales/fr.json';
import ar from '../locales/ar.json';

// Detect OS language: use Arabic if device is Arabic, otherwise French
function getDeviceLanguage() {
  const locale = getLocales()[0];
  return locale?.languageCode === 'ar' ? 'ar' : 'fr';
}

const deviceLanguage = getDeviceLanguage();

// Update RTL layout based on language
const rtl = deviceLanguage === 'ar';
if (I18nManager.isRTL !== rtl) {
  I18nManager.forceRTL(rtl);
  I18nManager.allowRTL(rtl);
}

i18n
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v3',
    resources: {
      fr: { translation: fr },
      ar: { translation: ar },
    },
    lng: deviceLanguage,
    fallbackLng: 'fr',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
