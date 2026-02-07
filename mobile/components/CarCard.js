import { View, Text, Image, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../constants/theme';
import { formatPrice } from '../utils/formatters';
import StatusBadge from './StatusBadge';

export default function CarCard({ car }) {
  const router = useRouter();

  const photo = car.after_repair_photos?.[0] || car.salvage_photos?.[0];

  return (
    <Pressable
      style={styles.card}
      onPress={() => router.push(`/car/${car.id}`)}
    >
      {photo ? (
        <Image source={{ uri: photo.url }} style={styles.image} />
      ) : (
        <View style={[styles.image, styles.placeholder]}>
          <Text style={styles.placeholderText}>Pas de photo</Text>
        </View>
      )}

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {car.display_name}
        </Text>

        <View style={styles.row}>
          <StatusBadge status={car.status} />
          <Text style={styles.tenant} numberOfLines={1}>{car.tenant_name}</Text>
        </View>

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
  image: {
    width: '100%',
    height: 140,
    backgroundColor: '#e2e8f0',
  },
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  info: {
    padding: 10,
    gap: 6,
  },
  name: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tenant: {
    fontSize: 11,
    color: colors.textSecondary,
    flex: 1,
  },
  price: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primary,
  },
});
