import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ComingSoonScreen({ route, navigation }) {
  const { storyTitle, chapterNumber, chapterTitle, isUnlocked } = route.params || {};

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0F0F14" />
      
      {/* Top Navbar */}
      <View style={styles.topNav}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.topNavTitle}>Trình Đọc Truyện</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={styles.container}>
        {/* Icon & Badge */}
        <View style={styles.iconCircle}>
          <Ionicons name="book-outline" size={48} color="#ED1D24" />
        </View>

        <View style={styles.badge}>
          <Text style={styles.badgeText}>SẮP RA MẮT</Text>
        </View>

        <Text style={styles.mainHeading}>Trình Đọc Truyện Di Động</Text>

        {/* Thông tin chương được bấm */}
        <View style={styles.infoCard}>
          <Text style={styles.storyTitleText} numberOfLines={1}>
            {storyTitle || 'Marvel Comic'}
          </Text>
          <Text style={styles.chapterTitleText} numberOfLines={2}>
            Chương {chapterNumber !== undefined ? chapterNumber : '1'}: {chapterTitle || 'Chương truyện'}
          </Text>
          
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Trạng thái quyền đọc:</Text>
            <View style={[styles.accessPill, isUnlocked ? styles.accessPillOpen : styles.accessPillLocked]}>
              <Ionicons
                name={isUnlocked ? 'checkmark-circle' : 'lock-closed'}
                size={12}
                color={isUnlocked ? '#34D399' : '#FBBF24'}
                style={{ marginRight: 4 }}
              />
              <Text style={[styles.accessPillText, isUnlocked ? styles.accessTextOpen : styles.accessTextLocked]}>
                {isUnlocked ? 'Đủ quyền truy cập' : 'Cần Gói VIP hoặc Mua lẻ'}
              </Text>
            </View>
          </View>
        </View>

        {/* Thông điệp giai đoạn */}
        <Text style={styles.messageText}>
          Tính năng đọc truyện tranh với chế độ cuộn dọc toàn màn hình, tải ảnh độ phân giải cao và tự động ghi nhớ tiến độ đọc sẽ chính thức ra mắt trong giai đoạn tiếp theo.
        </Text>

        {/* Nút quay lại */}
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
          <Text style={styles.actionBtnText}>Quay Lại Chi Tiết Truyện</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0F0F14',
  },
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A22',
  },
  backBtn: {
    padding: 6,
    backgroundColor: '#1A1A22',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2A2A38',
  },
  topNavTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Outfit_700Bold',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  iconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(237, 29, 36, 0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(237, 29, 36, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  badge: {
    backgroundColor: '#23232E',
    borderWidth: 1,
    borderColor: '#2A2A38',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 14,
    marginBottom: 12,
  },
  badgeText: {
    color: '#ED1D24',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    fontFamily: 'Outfit_700Bold',
  },
  mainHeading: {
    color: '#FFFFFF',
    fontSize: 22,
    fontFamily: 'Italiana_400Regular',
    letterSpacing: 1.5,
    marginBottom: 20,
    textAlign: 'center',
  },
  infoCard: {
    width: '100%',
    backgroundColor: '#1A1A22',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2A2A38',
    marginBottom: 20,
  },
  storyTitleText: {
    color: '#9CA3AF',
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  chapterTitleText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Outfit_700Bold',
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(42, 42, 56, 0.6)',
  },
  statusLabel: {
    color: '#9CA3AF',
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  accessPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  accessPillOpen: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 0.5,
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  accessPillLocked: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 0.5,
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },
  accessPillText: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  accessTextOpen: {
    color: '#34D399',
  },
  accessTextLocked: {
    color: '#FBBF24',
  },
  messageText: {
    color: '#9CA3AF',
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 28,
    paddingHorizontal: 12,
    fontFamily: 'Merriweather_400Regular',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ED1D24',
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#ED1D24',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'Outfit_700Bold',
  },
});
