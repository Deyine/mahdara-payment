import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors } from '../constants/theme';
import { saveLanguage, updateRTL } from '../i18n';

const LANGUAGES = [
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'ar', label: 'العربية', flag: '🇸🇦' },
];

export default function LanguageSwitcher() {
  const { i18n, t } = useTranslation();
  const [dropdownVisible, setDropdownVisible] = useState(false);

  const changeLanguage = async (lang) => {
    setDropdownVisible(false);

    try {
      // Show alert that app needs to reload for RTL changes
      if (lang !== i18n.language) {
        Alert.alert(
          t('settings.language'),
          lang === 'ar'
            ? 'سيتم إعادة تشغيل التطبيق لتطبيق التغييرات'
            : 'L\'application va redémarrer pour appliquer les changements',
          [
            {
              text: lang === 'ar' ? 'إلغاء' : 'Annuler',
              style: 'cancel',
            },
            {
              text: lang === 'ar' ? 'موافق' : 'OK',
              onPress: async () => {
                await saveLanguage(lang);
                await updateRTL(lang);
                await i18n.changeLanguage(lang);
                // In a real app, you might want to reload the app here
                // For now, the RTL change will take effect on next app restart
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error('Error changing language:', error);
    }
  };

  return (
    <View style={styles.container}>
      {/* Language Icon Button */}
      <Pressable
        style={styles.iconButton}
        onPress={() => setDropdownVisible(true)}
      >
        <Text style={styles.iconText}>🌐</Text>
      </Pressable>

      {/* Language Selection Modal */}
      <Modal
        visible={dropdownVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setDropdownVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setDropdownVisible(false)}
        >
          <View style={styles.dropdown}>
            <Text style={styles.dropdownTitle}>{t('settings.language')}</Text>

            {LANGUAGES.map((language) => (
              <Pressable
                key={language.code}
                style={[
                  styles.languageOption,
                  i18n.language === language.code && styles.languageOptionActive,
                ]}
                onPress={() => changeLanguage(language.code)}
              >
                <Text style={styles.languageFlag}>{language.flag}</Text>
                <Text
                  style={[
                    styles.languageLabel,
                    i18n.language === language.code && styles.languageLabelActive,
                  ]}
                >
                  {language.label}
                </Text>
                {i18n.language === language.code && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingRight: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  iconText: {
    fontSize: 24,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdown: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  dropdownTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 12,
  },
  languageOptionActive: {
    backgroundColor: colors.background,
  },
  languageFlag: {
    fontSize: 24,
  },
  languageLabel: {
    fontSize: 16,
    color: colors.text,
    flex: 1,
  },
  languageLabelActive: {
    fontWeight: '600',
    color: colors.primary,
  },
  checkmark: {
    fontSize: 18,
    color: colors.primary,
    fontWeight: 'bold',
  },
});
