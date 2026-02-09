import { useState, useEffect, useRef, useMemo } from 'react';
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
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Feather } from '@expo/vector-icons';
import { getCar } from '../../services/api';
import { colors, fontFamily } from '../../constants/theme';
import { formatPrice, formatMileage } from '../../utils/formatters';
import PhotoViewer from '../../components/PhotoViewer';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function CarDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { t } = useTranslation();
  const [car, setCar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewerPhotos, setViewerPhotos] = useState(null);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [heroIndex, setHeroIndex] = useState(0);
  const heroRef = useRef(null);

  const heroPhotos = useMemo(() => {
    if (!car) return null;
    const allPhotos = car.after_repair_photos?.length > 0
      ? car.after_repair_photos
      : (car.salvage_photos || []);
    return allPhotos.length > 0 ? allPhotos : null;
  }, [car]);

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

  useEffect(() => {
    if (!heroPhotos || heroPhotos.length <= 1) return;
    const timer = setInterval(() => {
      setHeroIndex((prev) => {
        const next = (prev + 1) % heroPhotos.length;
        heroRef.current?.scrollToOffset({
          offset: next * SCREEN_WIDTH,
          animated: true,
        });
        return next;
      });
    }, 4000);
    return () => clearInterval(timer);
  }, [heroPhotos]);

  const openViewer = (photos, index) => {
    setViewerPhotos(photos);
    setViewerIndex(index);
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <Pressable style={styles.closeButton} onPress={() => router.canGoBack() ? router.back() : router.replace('/')}>
        <Feather name="arrow-left" size={22} color={colors.text} />
      </Pressable>
      <Text style={styles.brandTitle}>BESTCAR</Text>
      <View style={styles.closeButton} />
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        {renderHeader()}
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !car) {
    return (
      <SafeAreaView style={styles.safeArea}>
        {renderHeader()}
        <View style={styles.center}>
          <Text style={styles.errorText}>{error || t('common.error')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <>
      <SafeAreaView style={styles.safeArea}>
        {renderHeader()}
        <ScrollView style={styles.scrollView}>
          {/* Hero photo carousel */}
          {heroPhotos ? (
            <FlatList
              ref={heroRef}
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
          ) : (
            <View style={[styles.heroImage, styles.placeholder]}>
              <Text style={styles.placeholderText}>{t('common.noPhoto')}</Text>
            </View>
          )}

          {/* Info section */}
          <View style={styles.infoSection}>
            <Text style={styles.carName}>{car.display_name}</Text>

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

          {/* Contact section */}
          <View style={styles.contactSection}>
            <Text style={styles.contactTitle}>{t('carDetail.contact')}</Text>
            <View style={styles.phoneNumbers}>
              <Pressable
                style={styles.phoneButton}
                onPress={() => Linking.openURL('tel:36203052')}
              >
                <Feather name="phone" size={18} color={colors.primary} />
                <Text style={styles.phoneText}>36 20 30 52</Text>
              </Pressable>
              <Pressable
                style={styles.phoneButton}
                onPress={() => Linking.openURL('tel:36622468')}
              >
                <Feather name="phone" size={18} color={colors.primary} />
                <Text style={styles.phoneText}>36 62 24 68</Text>
              </Pressable>
            </View>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>

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
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  return (
    <View style={styles.detailItem}>
      <Text style={[styles.detailLabel, isRTL && { textAlign: 'right' }]}>
        {label}
      </Text>
      <Text style={[styles.detailValue, isRTL && { textAlign: 'right' }]}>
        {value}
      </Text>
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
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  brandTitle: {
    fontSize: 28,
    fontFamily: 'Gagalin-Regular',
    color: colors.primary,
    letterSpacing: 4,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    fontFamily: fontFamily.regular,
    color: colors.error,
  },
  heroImage: {
    width: SCREEN_WIDTH,
    height: 360,
    backgroundColor: colors.placeholder,
  },
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontFamily: fontFamily.regular,
    color: colors.textSecondary,
    fontSize: 14,
  },
  infoSection: {
    padding: 16,
    backgroundColor: colors.surface,
    gap: 10,
  },
  carName: {
    fontSize: 22,
    fontFamily: fontFamily.bold,
    color: colors.text,
  },
  price: {
    fontSize: 18,
    fontFamily: fontFamily.semiBold,
    color: colors.textSecondary,
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
    fontFamily: fontFamily.regular,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    fontFamily: fontFamily.semiBold,
    color: colors.text,
  },
  contactSection: {
    marginTop: 12,
    backgroundColor: colors.surface,
    padding: 16,
  },
  contactTitle: {
    fontSize: 16,
    fontFamily: fontFamily.bold,
    color: colors.text,
    marginBottom: 12,
  },
  phoneNumbers: {
    flexDirection: 'row',
    gap: 10,
  },
  phoneButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  phoneText: {
    fontSize: 16,
    fontFamily: fontFamily.semiBold,
    color: colors.text,
  },
  photoSection: {
    marginTop: 12,
    backgroundColor: colors.surface,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: fontFamily.bold,
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
    backgroundColor: colors.placeholder,
  },
});
