import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import ComicCard from '../components/ComicCard';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

const PAGE_LIMIT = 6;

export default function HomeScreen({ navigation }) {
  const { isAuthenticated } = useAuth();
  const { unreadCount } = useNotifications();

  const [stories, setStories] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalStories, setTotalStories] = useState(0);

  const [searchQuery, setSearchQuery] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  const searchDebounceTimer = useRef(null);

  // Fetch stories function
  const fetchStories = useCallback(async (targetPage = 1, searchKeyword = '', isRefresh = false) => {
    if (targetPage === 1 && !isRefresh) {
      setLoading(true);
    }
    setError(null);

    try {
      const params = new URLSearchParams();
      params.append('page', String(targetPage));
      params.append('limit', String(PAGE_LIMIT));
      if (searchKeyword && searchKeyword.trim()) {
        params.append('search', searchKeyword.trim());
      }

      const res = await api.get(`/api/stories?${params.toString()}`);

      if (res.success) {
        const fetchedList = res.stories || [];
        setTotalPages(res.totalPages || 1);
        setTotalStories(res.total || 0);

        if (targetPage === 1) {
          setStories(fetchedList);
        } else {
          setStories((prev) => {
            const existingIds = new Set(prev.map((s) => s.id));
            const newItems = fetchedList.filter((s) => !existingIds.has(s.id));
            return [...prev, ...newItems];
          });
        }
        setPage(targetPage);
      } else {
        setError('Không thể tải danh sách truyện.');
      }
    } catch (err) {
      setError(err.message || 'Lỗi khi tải danh sách truyện.');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, []);

  // First mount load
  useEffect(() => {
    fetchStories(1, appliedSearch);
  }, [appliedSearch, fetchStories]);

  // Pull to refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchStories(1, appliedSearch, true);
  }, [appliedSearch, fetchStories]);

  // Infinite scroll load more
  const handleLoadMore = () => {
    if (loading || loadingMore || refreshing) return;
    if (page < totalPages) {
      setLoadingMore(true);
      fetchStories(page + 1, appliedSearch);
    }
  };

  // Search input change with debounce
  const handleSearchChange = (text) => {
    setSearchQuery(text);
    if (searchDebounceTimer.current) {
      clearTimeout(searchDebounceTimer.current);
    }
    searchDebounceTimer.current = setTimeout(() => {
      setAppliedSearch(text);
    }, 450);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setAppliedSearch('');
  };

  const renderHeader = () => (
    <View style={styles.header}>
      {/* App Branding Top Bar */}
      <View style={styles.brandingRow}>
        <View style={styles.titleWrapper}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoBadgeText}>MARVEL</Text>
          </View>
          <Text style={styles.brandTitle}>COMICS HUB</Text>
        </View>
        <View style={styles.headerRightActions}>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{totalStories} truyện</Text>
          </View>
          <TouchableOpacity
            style={styles.bellButton}
            onPress={() => {
              if (isAuthenticated) {
                navigation.navigate('NotificationTab');
              } else {
                navigation.navigate('Login');
              }
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="notifications-outline" size={20} color="#D1D5DB" />
            {unreadCount > 0 && (
              <View style={styles.bellBadge}>
                <Text style={styles.bellBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Input Bar */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color="#9CA3AF" style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm truyện theo tên, mô tả..."
          placeholderTextColor="#6B7280"
          value={searchQuery}
          onChangeText={handleSearchChange}
          returnKeyType="search"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={clearSearch} style={styles.clearBtn}>
            <Ionicons name="close-circle" size={18} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>

      {appliedSearch.trim() ? (
        <View style={styles.searchStatusRow}>
          <Text style={styles.searchResultText}>
            Kết quả tìm kiếm cho: "{appliedSearch.trim()}"
          </Text>
          <TouchableOpacity onPress={clearSearch}>
            <Text style={styles.resetFilterText}>Xóa lọc</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );

  const renderFooter = () => {
    if (!loadingMore) return <View style={{ height: 20 }} />;
    return (
      <View style={styles.loadingMoreWrapper}>
        <ActivityIndicator size="small" color="#ED1D24" />
        <Text style={styles.loadingMoreText}>Đang tải thêm truyện...</Text>
      </View>
    );
  };

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="book-outline" size={48} color="#4B5563" />
        <Text style={styles.emptyTitle}>
          {appliedSearch ? 'Không tìm thấy bộ truyện nào' : 'Chưa có truyện trong kho'}
        </Text>
        <Text style={styles.emptySub}>
          {appliedSearch
            ? 'Vui lòng thử tìm kiếm bằng từ khóa khác.'
            : 'Hệ thống đang cập nhật thêm nội dung mới.'}
        </Text>
        {appliedSearch ? (
          <TouchableOpacity style={styles.resetSearchBtn} onPress={clearSearch}>
            <Text style={styles.resetSearchBtnText}>Xem tất cả truyện</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0F0F14" />
      <View style={styles.container}>
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            {renderHeader()}
            <View style={styles.spinnerWrapper}>
              <ActivityIndicator size="large" color="#ED1D24" />
              <Text style={styles.loadingText}>Đang kết nối kho truyện Marvel...</Text>
            </View>
          </View>
        ) : error && stories.length === 0 ? (
          <View style={styles.errorContainer}>
            {renderHeader()}
            <View style={styles.errorWrapper}>
              <Ionicons name="alert-circle-outline" size={48} color="#F87171" />
              <Text style={styles.errorTitle}>Không thể tải kho truyện</Text>
              <Text style={styles.errorSub}>{error}</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => fetchStories(1, appliedSearch)}
              >
                <Ionicons name="refresh" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.retryButtonText}>Thử lại</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <FlatList
            data={stories}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              <ComicCard
                story={item}
                onPress={(selected) => navigation.navigate('StoryDetail', { storyId: selected.id })}
              />
            )}
            ListHeaderComponent={renderHeader}
            ListFooterComponent={renderFooter}
            ListEmptyComponent={renderEmpty}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.4}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#ED1D24"
                colors={['#ED1D24']}
              />
            }
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0F0F14',
  },
  container: {
    flex: 1,
    backgroundColor: '#0F0F14',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  header: {
    paddingTop: 12,
    paddingBottom: 14,
  },
  brandingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  titleWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoBadge: {
    backgroundColor: '#ED1D24',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  logoBadgeText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: 1.5,
    fontFamily: 'Outfit_700Bold',
  },
  brandTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontFamily: 'Italiana_400Regular',
    letterSpacing: 2,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bellButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1A1A22',
    borderWidth: 1,
    borderColor: '#2A2A38',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  bellBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#ED1D24',
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  bellBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontFamily: 'Outfit_700Bold',
    lineHeight: 12,
  },
  countBadge: {
    backgroundColor: '#1A1A22',
    borderWidth: 1,
    borderColor: '#2A2A38',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  countBadgeText: {
    color: '#9CA3AF',
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A22',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2A2A38',
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },
  clearBtn: {
    padding: 4,
  },
  searchStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingHorizontal: 4,
  },
  searchResultText: {
    color: '#9CA3AF',
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    flex: 1,
  },
  resetFilterText: {
    color: '#ED1D24',
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  spinnerWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  loadingText: {
    color: '#9CA3AF',
    fontSize: 13,
    marginTop: 12,
    fontFamily: 'Inter_400Regular',
  },
  loadingMoreWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  loadingMoreText: {
    color: '#9CA3AF',
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 12,
    fontFamily: 'Outfit_700Bold',
  },
  emptySub: {
    color: '#9CA3AF',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    fontFamily: 'Inter_400Regular',
  },
  resetSearchBtn: {
    marginTop: 16,
    backgroundColor: '#1A1A22',
    borderWidth: 1,
    borderColor: '#ED1D24',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  resetSearchBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  errorContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  errorWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    paddingHorizontal: 24,
  },
  errorTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 12,
    fontFamily: 'Outfit_700Bold',
  },
  errorSub: {
    color: '#F87171',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    fontFamily: 'Inter_400Regular',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ED1D24',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 16,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'Outfit_700Bold',
  },
});
