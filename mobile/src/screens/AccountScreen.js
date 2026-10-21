import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  StatusBar,
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import ProxiedImage from '../components/ProxiedImage';

export default function AccountScreen() {
  const { user, mySubscription, isVip, purchasedStories, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Đăng Xuất',
      'Bạn có chắc chắn muốn đăng xuất khỏi tài khoản không?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Đăng Xuất',
          style: 'destructive',
          onPress: async () => {
            await logout();
          }
        }
      ]
    );
  };

  const getInitialLetter = () => {
    const name = user?.full_name || user?.username || 'U';
    return name.trim().charAt(0).toUpperCase();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0F0F14" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>TÀI KHOẢN</Text>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarRow}>
            {user?.avatar ? (
              <ProxiedImage
                url={user.avatar}
                style={styles.avatarImage}
                fallbackIcon="person"
              />
            ) : (
              <View style={styles.initialAvatar}>
                <Text style={styles.initialText}>{getInitialLetter()}</Text>
              </View>
            )}

            <View style={styles.profileInfo}>
              <Text style={styles.fullName} numberOfLines={1}>
                {user?.full_name || user?.username || 'Độc Giả Marvel'}
              </Text>
              <Text style={styles.username}>@{user?.username || 'reader'}</Text>
              <Text style={styles.email} numberOfLines={1}>{user?.email || ''}</Text>
            </View>
          </View>
        </View>

        {/* Membership VIP Badge Card */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons
              name={isVip ? 'ribbon' : 'ribbon-outline'}
              size={20}
              color={isVip ? '#FBBF24' : '#9CA3AF'}
              style={{ marginRight: 8 }}
            />
            <Text style={styles.sectionTitle}>Gói Hội Viên</Text>
          </View>

          {isVip && mySubscription ? (
            <View style={styles.vipActiveBox}>
              <View style={styles.vipBadgeHeader}>
                <View style={styles.vipPill}>
                  <Ionicons name="sparkles" size={12} color="#000000" style={{ marginRight: 4 }} />
                  <Text style={styles.vipPillText}>MARVEL VIP</Text>
                </View>
                <Text style={styles.vipBadgeTitle}>
                  {mySubscription.plan_name || 'Gói Độc Giả VIP'}
                </Text>
              </View>

              <Text style={styles.vipSubText}>
                {mySubscription.days_remaining !== undefined
                  ? `Thời hạn còn lại: ${mySubscription.days_remaining} ngày`
                  : 'Trạng thái: Đang hoạt động'}
              </Text>
            </View>
          ) : (
            <View style={styles.vipInactiveBox}>
              <Text style={styles.standardMemberTitle}>Thành viên Tiêu Chuẩn</Text>
              <Text style={styles.standardMemberSub}>
                Chưa kích hoạt Gói Hội Viên VIP. Bạn có thể đọc các chương đọc thử và truyện miễn phí.
              </Text>
            </View>
          )}
        </View>

        {/* Tủ sách đã mua */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="cart-outline" size={20} color="#34D399" style={{ marginRight: 8 }} />
            <Text style={styles.sectionTitle}>Truyện Đã Mua Lẻ</Text>
          </View>
          <View style={styles.purchasedBox}>
            <Text style={styles.purchasedCountText}>
              Đã sở hữu: <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>{purchasedStories.length}</Text> bộ truyện
            </Text>
          </View>
        </View>

        {/* Nguồn dữ liệu Comic Vine (Bắt buộc theo yêu cầu) */}
        <View style={styles.creditCard}>
          <View style={styles.creditHeader}>
            <Ionicons name="shield-checkmark-outline" size={18} color="#34D399" style={{ marginRight: 6 }} />
            <Text style={styles.creditTitle}>Nguồn dữ liệu Comic Vine</Text>
          </View>
          <Text style={styles.creditBody}>
            Dữ liệu truyện, tác giả, hình ảnh và nhân vật được tích hợp và xác thực từ Comic Vine (Gamespot / Fandom).
          </Text>
          <Text style={styles.creditFooter}>
            Marvel Comic Platform Nhóm 10 • All Marvel characters and comics are © Marvel.
          </Text>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={20} color="#F87171" style={{ marginRight: 8 }} />
          <Text style={styles.logoutButtonText}>Đăng Xuất</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0F0F14',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    paddingVertical: 12,
    marginBottom: 8,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontFamily: 'Italiana_400Regular',
    letterSpacing: 2,
  },
  profileCard: {
    backgroundColor: '#1A1A22',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#2A2A38',
    marginBottom: 16,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatarImage: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 2,
    borderColor: '#ED1D24',
  },
  initialAvatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#ED1D24',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#ED1D24',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  initialText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '900',
    fontFamily: 'Outfit_700Bold',
  },
  profileInfo: {
    flex: 1,
  },
  fullName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Outfit_700Bold',
    marginBottom: 2,
  },
  username: {
    color: '#ED1D24',
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 2,
  },
  email: {
    color: '#9CA3AF',
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  sectionCard: {
    backgroundColor: '#1A1A22',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2A2A38',
    marginBottom: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'Outfit_700Bold',
    letterSpacing: 0.5,
  },
  vipActiveBox: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  vipBadgeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  vipPill: {
    backgroundColor: '#FBBF24',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  vipPillText: {
    color: '#000000',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  vipBadgeTitle: {
    color: '#FBBF24',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'Outfit_700Bold',
    flex: 1,
  },
  vipSubText: {
    color: '#D1D5DB',
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  vipInactiveBox: {
    backgroundColor: '#0F0F14',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#2A2A38',
  },
  standardMemberTitle: {
    color: '#D1D5DB',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    fontFamily: 'Inter_600SemiBold',
  },
  standardMemberSub: {
    color: '#6B7280',
    fontSize: 12,
    lineHeight: 17,
    fontFamily: 'Inter_400Regular',
  },
  purchasedBox: {
    backgroundColor: '#0F0F14',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#2A2A38',
  },
  purchasedCountText: {
    color: '#9CA3AF',
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },
  creditCard: {
    backgroundColor: '#12121A',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.25)',
    marginBottom: 24,
  },
  creditHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  creditTitle: {
    color: '#34D399',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'Outfit_700Bold',
  },
  creditBody: {
    color: '#9CA3AF',
    fontSize: 11,
    lineHeight: 16,
    fontFamily: 'Inter_400Regular',
    marginBottom: 6,
  },
  creditFooter: {
    color: '#6B7280',
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 12,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.35)',
  },
  logoutButtonText: {
    color: '#F87171',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'Outfit_700Bold',
  },
});
