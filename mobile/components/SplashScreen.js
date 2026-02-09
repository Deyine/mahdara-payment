import { View, Text, StyleSheet } from 'react-native';
import { getLocales } from 'expo-localization';
import { colors, fontFamily } from '../constants/theme';

const SUBTITLE = {
  ar: 'إستيراد، بيع و تأجير السيارات',
  fr: 'Importation, vente et location de voitures',
};

function getSubtitle() {
  const locale = getLocales()[0];
  const lang = locale?.languageCode;
  return SUBTITLE[lang] || SUBTITLE.fr;
}

export default function SplashScreen() {
  const subtitle = getSubtitle();

  return (
    <View style={styles.container}>
      {/* Geometric triangle decorations */}
      {/* Top Right */}
      <View style={[styles.triangle, styles.triangleTopRight1]} />
      <View style={[styles.triangle, styles.triangleTopRight2]} />
      <View style={[styles.triangle, styles.triangleTopRight3]} />

      {/* Bottom Left */}
      <View style={[styles.triangle, styles.triangleBottomLeft1]} />
      <View style={[styles.triangle, styles.triangleBottomLeft2]} />

      {/* Bottom Right */}
      <View style={[styles.triangle, styles.triangleBottomRight1]} />
      <View style={[styles.triangle, styles.triangleBottomRight2]} />

      <View style={styles.textContainer}>
        {/* Glitch layer 1 - offset left */}
        <Text style={[styles.text, styles.glitch1]}>BESTCAR</Text>

        {/* Glitch layer 2 - offset right */}
        <Text style={[styles.text, styles.glitch2]}>BESTCAR</Text>

        {/* Main red text on top */}
        <Text style={styles.text}>BESTCAR</Text>
      </View>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  textContainer: {
    position: 'relative',
    zIndex: 10,
  },
  text: {
    fontSize: 60,
    fontFamily: 'Gagalin-Regular',
    color: colors.primary,
    letterSpacing: 10,
    textTransform: 'uppercase',
  },
  subtitle: {
    fontSize: 22,
    fontFamily: fontFamily.bold,
    color: colors.textSecondary,
    marginTop: 12,
    letterSpacing: 1,
    textAlign: 'center',
  },
  glitch1: {
    position: 'absolute',
    color: 'rgba(0, 255, 255, 0.5)', // Cyan
    transform: [{ translateX: -2 }],
  },
  glitch2: {
    position: 'absolute',
    color: 'rgba(255, 0, 255, 0.5)', // Magenta
    transform: [{ translateX: 2 }],
  },
  // Triangle base style
  triangle: {
    position: 'absolute',
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
  },
  // Top Right triangles
  triangleTopRight1: {
    top: -50,
    right: -50,
    borderLeftWidth: 200,
    borderBottomWidth: 200,
    borderLeftColor: 'transparent',
    borderBottomColor: `${colors.primary}15`,
    transform: [{ rotate: '45deg' }],
  },
  triangleTopRight2: {
    top: 20,
    right: -30,
    borderLeftWidth: 150,
    borderBottomWidth: 150,
    borderLeftColor: 'transparent',
    borderBottomColor: `${colors.primary}25`,
    transform: [{ rotate: '30deg' }],
  },
  triangleTopRight3: {
    top: -20,
    right: 40,
    borderLeftWidth: 100,
    borderBottomWidth: 100,
    borderLeftColor: 'transparent',
    borderBottomColor: `${colors.primary}20`,
    transform: [{ rotate: '60deg' }],
  },
  // Bottom Left triangles
  triangleBottomLeft1: {
    bottom: -60,
    left: -60,
    borderRightWidth: 180,
    borderTopWidth: 180,
    borderRightColor: 'transparent',
    borderTopColor: `${colors.primary}18`,
    transform: [{ rotate: '20deg' }],
  },
  triangleBottomLeft2: {
    bottom: 10,
    left: -20,
    borderRightWidth: 120,
    borderTopWidth: 120,
    borderRightColor: 'transparent',
    borderTopColor: `${colors.primary}22`,
    transform: [{ rotate: '-10deg' }],
  },
  // Bottom Right triangles
  triangleBottomRight1: {
    bottom: -40,
    right: -40,
    borderLeftWidth: 160,
    borderTopWidth: 160,
    borderLeftColor: 'transparent',
    borderTopColor: `${colors.primary}20`,
    transform: [{ rotate: '-25deg' }],
  },
  triangleBottomRight2: {
    bottom: 30,
    right: 20,
    borderLeftWidth: 90,
    borderTopWidth: 90,
    borderLeftColor: 'transparent',
    borderTopColor: `${colors.primary}15`,
    transform: [{ rotate: '-40deg' }],
  },
});
