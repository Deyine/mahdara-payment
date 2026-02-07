import { View, Text, Image, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { colors } from '../constants/theme';
import { formatPrice, formatMileage } from '../utils/formatters';

export default function CarCard({ car }) {
  const router = useRouter();
  const { t } = useTranslation();

  const photo = car.after_repair_photos?.[0] || car.salvage_photos?.[0];
  const isSold = car.status === 'sold';

  return (
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

        {/* Sold ribbon - only show for sold cars */}
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

        <Text style={styles.mileage}>
          {formatMileage(car.mileage)}
        </Text>

        <Text style={styles.price}>
          {car.price ? formatPrice(car.price) : '—'}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 10,
    overflow: 'hidden',
    margin: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    aspectRatio: 4 / 3, // Maintains proper photo proportions
    backgroundColor: '#e2e8f0',
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
    fontSize: 12,
  },
  ribbon: {
    position: 'absolute',
    top: 12,
    right: -30,
    backgroundColor: '#f59e0b',
    paddingVertical: 6,
    paddingHorizontal: 40,
    transform: [{ rotate: '45deg' }],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 4,
  },
  ribbonText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  info: {
    padding: 12,
    gap: 8,
  },
  name: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    lineHeight: 18,
  },
  mileage: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: -2,
  },
  price: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primary,
    marginTop: 2,
  },
});
