import { useState, useEffect, useCallback } from 'react';
import {
  View,
  FlatList,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { getCatalog } from '../services/api';
import { colors } from '../constants/theme';
import CarCard from '../components/CarCard';

export default function CatalogScreen() {
  const { t } = useTranslation();
  const [cars, setCars] = useState([]);
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  const FILTERS = [
    { key: 'all', label: t('catalog.filterAll') },
    { key: 'active', label: t('catalog.filterAvailable') },
    { key: 'sold', label: t('catalog.filterSold') },
  ];

  const fetchCars = useCallback(async (pageNum = 1, isRefresh = false) => {
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
    fetchCars(1, true);
  }, [fetchCars]);

  const onEndReached = useCallback(() => {
    if (loadingMore || page >= totalPages) return;
    setLoadingMore(true);
    fetchCars(page + 1);
  }, [loadingMore, page, totalPages, fetchCars]);

  const filteredCars = filter === 'all'
    ? cars
    : cars.filter((car) => car.status === filter);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
        <Pressable style={styles.retryButton} onPress={() => { setLoading(true); fetchCars(1); }}>
          <Text style={styles.retryText}>{t('common.retry')}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Filter tabs */}
      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <Pressable
            key={f.key}
            style={[styles.filterTab, filter === f.key && styles.filterTabActive]}
            onPress={() => setFilter(f.key)}
          >
            <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>
              {f.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <FlatList
        data={filteredCars}
        numColumns={2}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <CarCard car={item} />}
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
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
  },
  filterTabActive: {
    backgroundColor: colors.primary,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  filterTextActive: {
    color: '#ffffff',
  },
  list: {
    padding: 6,
  },
  errorText: {
    fontSize: 16,
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
    color: '#ffffff',
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
});
