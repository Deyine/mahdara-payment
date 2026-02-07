import { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  FlatList,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { getCar } from '../../services/api';
import { colors } from '../../constants/theme';
import { formatPrice, formatMileage } from '../../utils/formatters';
import StatusBadge from '../../components/StatusBadge';
import PhotoViewer from '../../components/PhotoViewer';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function CarDetailScreen() {
  const { id } = useLocalSearchParams();
  const { t } = useTranslation();
  const [car, setCar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewerPhotos, setViewerPhotos] = useState(null);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [heroIndex, setHeroIndex] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const data = await getCar(id);
        setCar(data);
      } catch {
        setError(t('common.error'));
      } finally {
        setLoading(false);
      }
    })();
  }, [id, t]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error || !car) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error || t('common.error')}</Text>
      </View>
    );
  }

  const allPhotos = [...(car.after_repair_photos || []), ...(car.salvage_photos || [])];
  const heroPhotos = allPhotos.length > 0 ? allPhotos : null;

  const openViewer = (photos, index) => {
    setViewerPhotos(photos);
    setViewerIndex(index);
  };

  return (
    <>
      <ScrollView style={styles.container}>
        {/* Hero photo carousel */}
        {heroPhotos ? (
          <View>
            <FlatList
              data={heroPhotos}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => {
                setHeroIndex(Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH));
              }}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item, index }) => (
                <Pressable onPress={() => openViewer(heroPhotos, index)}>
                  <Image source={{ uri: item.url }} style={styles.heroImage} />
                </Pressable>
              )}
            />
            {heroPhotos.length > 1 && (
              <View style={styles.dotsRow}>
                {heroPhotos.map((_, i) => (
                  <View
                    key={i}
                    style={[styles.dot, i === heroIndex && styles.dotActive]}
                  />
                ))}
              </View>
            )}
          </View>
        ) : (
          <View style={[styles.heroImage, styles.placeholder]}>
            <Text style={styles.placeholderText}>{t('common.noPhoto')}</Text>
          </View>
        )}

        {/* Info section */}
        <View style={styles.infoSection}>
          <Text style={styles.carName}>{car.display_name}</Text>

          <View style={styles.row}>
            <StatusBadge status={car.status} />
            <Text style={styles.tenantName}>{car.tenant_name}</Text>
          </View>

          <Text style={styles.price}>
            {car.price ? formatPrice(car.price) : '—'}
          </Text>

          {/* Details grid */}
          <View style={styles.detailsGrid}>
            <DetailItem label={t('carDetail.color')} value={car.color || '—'} />
            <DetailItem label={t('carDetail.mileage')} value={formatMileage(car.mileage)} />
            <DetailItem label={t('carDetail.year')} value={car.year?.toString() || '—'} />
            <DetailItem label={t('carDetail.model')} value={car.car_model?.name || '—'} />
          </View>
        </View>

        {/* After repair photos */}
        {car.after_repair_photos?.length > 0 && (
          <PhotoSection
            title={t('carDetail.afterRepairPhotos')}
            photos={car.after_repair_photos}
            onPhotoPress={(index) => openViewer(car.after_repair_photos, index)}
          />
        )}

        {/* Salvage photos */}
        {car.salvage_photos?.length > 0 && (
          <PhotoSection
            title={t('carDetail.salvagePhotos')}
            photos={car.salvage_photos}
            onPhotoPress={(index) => openViewer(car.salvage_photos, index)}
          />
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      <PhotoViewer
        photos={viewerPhotos}
        visible={viewerPhotos !== null}
        initialIndex={viewerIndex}
        onClose={() => setViewerPhotos(null)}
      />
    </>
  );
}

function DetailItem({ label, value }) {
  return (
    <View style={styles.detailItem}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

function PhotoSection({ title, photos, onPhotoPress }) {
  return (
    <View style={styles.photoSection}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.photoRow}>
          {photos.map((photo, index) => (
            <Pressable key={photo.id} onPress={() => onPhotoPress(index)}>
              <Image source={{ uri: photo.url }} style={styles.thumbnail} />
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: colors.error,
  },
  heroImage: {
    width: SCREEN_WIDTH,
    height: 280,
    backgroundColor: '#e2e8f0',
  },
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  dotActive: {
    backgroundColor: '#ffffff',
  },
  infoSection: {
    padding: 16,
    backgroundColor: colors.surface,
    gap: 10,
  },
  carName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  tenantName: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  price: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.primary,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 0,
  },
  detailItem: {
    width: '50%',
    paddingVertical: 8,
  },
  detailLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  photoSection: {
    marginTop: 12,
    backgroundColor: colors.surface,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  photoRow: {
    flexDirection: 'row',
    gap: 10,
  },
  thumbnail: {
    width: 120,
    height: 90,
    borderRadius: 8,
    backgroundColor: '#e2e8f0',
  },
});
