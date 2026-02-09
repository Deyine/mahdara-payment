import { View, Text, Image, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { colors, fontFamily } from '../constants/theme';
import { formatPrice, formatMileage } from '../utils/formatters';

export default function CarCard({ car }) {
  const router = useRouter();
  const { t } = useTranslation();

  const photo = car.after_repair_photos?.[0] || car.salvage_photos?.[0];
  const isSold = car.status === 'sold';

  return (
    <View style={styles.cardWrapper}>
      <Pressable
        style={styles.card}
        onPress={() => router.push(`/car/${car.id}`)}
      >
        <View style={styles.imageContainer}>
          {photo ? (
            <Image
              source={{ uri: photo.url }}
              style={styles.image}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.image, styles.placeholder]}>
              <Text style={styles.placeholderText}>{t('common.noPhoto')}</Text>
            </View>
          )}

          {isSold && (
            <View style={styles.ribbon}>
              <Text style={styles.ribbonText}>{t('carDetail.sold')}</Text>
            </View>
          )}
        </View>

        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={2}>
            {car.display_name}
          </Text>
          <Text style={styles.price}>
            {car.price ? formatPrice(car.price) : '—'}
          </Text>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  cardWrapper: {
    flex: 1,
    paddingHorizontal: 6,
    paddingVertical: 6,
  },
  card: {
    backgroundColor: 'transparent',
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    aspectRatio: 4 / 3,
    backgroundColor: colors.placeholder,
    borderRadius: 8,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontFamily: fontFamily.regular,
  },
  ribbon: {
    position: 'absolute',
    top: 8,
    right: -28,
    backgroundColor: colors.warning,
    paddingVertical: 4,
    paddingHorizontal: 32,
    transform: [{ rotate: '45deg' }],
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  ribbonText: {
    color: colors.surface,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  info: {
    padding: 10,
    gap: 4,
  },
  name: {
    fontSize: 13,
    fontFamily: fontFamily.bold,
    color: colors.text,
    lineHeight: 17,
  },
  price: {
    fontSize: 12,
    fontFamily: fontFamily.semiBold,
    color: colors.textSecondary,
  },
});
