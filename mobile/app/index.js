import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  FlatList,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Feather } from '@expo/vector-icons';
import { getCatalog } from '../services/api';
import { colors, fontFamily } from '../constants/theme';
import CarCard from '../components/CarCard';

export default function CatalogScreen() {
  const { t } = useTranslation();
  const [cars, setCars] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  const fetchCars = useCallback(async (pageNum = 1) => {
    try {
      setError(null);
      const data = await getCatalog(pageNum);
      const newCars = data.cars;

      if (pageNum === 1) {
        setCars(newCars);
      } else {
        setCars((prev) => [...prev, ...newCars]);
      }
      setTotalPages(data.meta.total_pages);
      setPage(pageNum);
    } catch (err) {
      setError(t('common.error'));
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [t]);

  useEffect(() => {
    fetchCars(1);
  }, [fetchCars]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchCars(1);
  }, [fetchCars]);

  const onEndReached = useCallback(() => {
    if (loadingMore || page >= totalPages) return;
    setLoadingMore(true);
    fetchCars(page + 1);
  }, [loadingMore, page, totalPages, fetchCars]);

  const filteredCars = useMemo(() => {
    if (!search.trim()) return cars;
    const query = search.toLowerCase().trim();
    return cars.filter((car) =>
      car.display_name?.toLowerCase().includes(query)
    );
  }, [cars, search]);

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.brandTitle}>BESTCAR</Text>
      <View style={styles.searchContainer}>
        <Feather name="search" size={18} color={colors.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder={t('catalog.searchPlaceholder')}
          placeholderTextColor={colors.textSecondary}
          value={search}
          onChangeText={setSearch}
          autoCorrect={false}
        />
      </View>
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

  if (error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        {renderHeader()}
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.retryButton} onPress={() => { setLoading(true); fetchCars(1); }}>
            <Text style={styles.retryText}>{t('common.retry')}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {renderHeader()}
      <FlatList
        data={filteredCars}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => <CarCard car={item} />}
        numColumns={2}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          loadingMore ? (
            <ActivityIndicator style={{ padding: 16 }} color={colors.primary} />
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.emptyText}>{t('catalog.noCars')}</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.background,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  brandTitle: {
    fontSize: 28,
    fontFamily: 'Gagalin-Regular',
    color: colors.primary,
    textAlign: 'center',
    letterSpacing: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 26,
    marginTop: 12,
    paddingHorizontal: 16,
    height: 52,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: fontFamily.regular,
    color: colors.text,
    paddingVertical: 0,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  list: {
    paddingHorizontal: 6,
    paddingBottom: 16,
  },
  errorText: {
    fontSize: 16,
    fontFamily: fontFamily.regular,
    color: colors.error,
    marginBottom: 12,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: colors.surface,
    fontFamily: fontFamily.semiBold,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
    color: colors.textSecondary,
  },
});
