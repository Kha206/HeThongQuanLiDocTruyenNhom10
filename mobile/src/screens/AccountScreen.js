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
import UserAvatar from '../components/UserAvatar';

export default function AccountScreen({ navigation }) {
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0F0F14" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>TÀI KHOẢN</Text>
        </View>

        {/* Profile Card */}
        {user ? (
          <View style={styles.profileCard}>
            <View style={styles.avatarRow}>
              <UserAvatar user={user} size={64} />
              <View style={styles.profileInfo}>
                <Text style={styles.fullName} numberOfLines={1}>
                  {user.full_name || user.username || 'Độc Giả Marvel'}
                </Text>
                <Text style={styles.username}>@{user.username || 'reader'}</Text>
                <Text style={styles.email} numberOfLines={1}>{user.email || ''}</Text>
              </View>
            </View>

            {/* Mục Chỉnh Sửa Hồ Sơ */}
            <TouchableOpacity
              style={styles.editProfileBtn}
              onPress={() => navigation.navigate('ProfileEdit')}
              activeOpacity={0.8}
            >
              <Ionicons name="create-outline" size={17} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.editProfileBtnText}>Chỉnh Sửa Hồ Sơ</Text>
              <Ionicons name="chevron-forward" size={16} color="#9CA3AF" style={{ marginLeft: 'auto' }} />
            </TouchableOpacity>
          </View>
        ) : (

          <View style={styles.profileCard}>
            <View style={styles.avatarRow}>
              <View style={styles.guestAvatar}>
                <Ionicons name="person-outline" size={32} color="#9CA3AF" />
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.fullName}>Khách Vãng Lai</Text>
                <Text style={styles.username}>Chưa đăng nhập</Text>
                <Text style={styles.email}>Đăng nhập để sở hữu VIP và lưu truyện mua</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.loginBtnAccount}
              onPress={() => navigation.navigate('Login')}
              activeOpacity={0.85}
            >
              <Ionicons name="log-in-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.loginBtnAccountText}>Đăng Nhập Ngay</Text>
            </TouchableOpacity>
          </View>
        )}

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

              <TouchableOpacity
                style={styles.subManageBtn}
                onPress={() => navigation.navigate('Subscriptions')}
                activeOpacity={0.85}
              >
                <Ionicons name="sparkles" size={14} color="#000000" style={{ marginRight: 6 }} />
                <Text style={styles.subManageBtnText}>Gia Hạn Gói Hội Viên</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.vipInactiveBox}>
              <Text style={styles.standardMemberTitle}>Thành viên Tiêu Chuẩn</Text>
              <Text style={styles.standardMemberSub}>
                Chưa kích hoạt Gói Hội Viên VIP. Bạn có thể đọc các chương đọc thử và truyện miễn phí.
              </Text>

              <TouchableOpacity
                style={styles.subUpgradeBtn}
                onPress={() => navigation.navigate('Subscriptions')}
                activeOpacity={0.85}
              >
                <Ionicons name="sparkles" size={14} color="#000000" style={{ marginRight: 6 }} />
                <Text style={styles.subUpgradeBtnText}>Nâng Cấp Gói Marvel VIP</Text>
              </TouchableOpacity>
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
              Đã mua: <Text style={{ color: '#34D399', fontWeight: '700' }}>{purchasedStories.length}</Text> bộ truyện
            </Text>
            {purchasedStories.length > 0 ? (
              <View style={styles.purchasedList}>
                {purchasedStories.map((item) => (
                  <TouchableOpacity
                    key={item.purchase_id || item.story_id}
                    style={styles.purchasedItem}
                    onPress={() => {
                      if (item.story_id) {
                        navigation.navigate('StoryDetail', { storyId: item.story_id });
                      }
                    }}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="checkmark-circle" size={16} color="#34D399" style={{ marginRight: 8 }} />
                    <Text style={styles.purchasedItemTitle} numberOfLines={1}>
                      {item.story?.title || `Bộ truyện #${item.story_id}`}
                    </Text>
                    <Ionicons name="chevron-forward" size={16} color="#6B7280" />
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <Text style={styles.emptyPurchasedText}>
                Bạn chưa mua riêng bộ truyện nào. Các truyện đã mua bản quyền sẽ mở khóa vĩnh viễn tại đây.
              </Text>
            )}
          </View>
        </View>

        {/* Nguồn dữ liệu & Bản quyền Comic Vine */}
        <View style={styles.creditCard}>
          <View style={styles.creditHeader}>
            <Ionicons name="shield-checkmark" size={18} color="#ED1D24" style={{ marginRight: 6 }} />
            <Text style={styles.creditTitle}>Nguồn dữ liệu Comic Vine</Text>
          </View>
          <Text style={styles.creditBody}>
            Dữ liệu truyện, tác giả, hình ảnh và nhân vật được tích hợp và xác thực từ Comic Vine (Gamespot / Fandom).
          </Text>
          <Text style={styles.creditFooter}>
            Marvel Comic Platform Nhóm 10 • All Marvel characters and comics are © Marvel.
          </Text>
        </View>

        {/* Logout Button (Chỉ hiện khi đã đăng nhập) */}
        {user ? (
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.8}>
            <Ionicons name="log-out-outline" size={20} color="#F87171" style={{ marginRight: 8 }} />
            <Text style={styles.logoutButtonText}>Đăng Xuất</Text>
          </TouchableOpacity>
        ) : null}
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
  guestAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#2A2A38',
    borderWidth: 1.5,
    borderColor: '#3E3E50',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A38',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3E3E50',
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginTop: 14,
  },
  editProfileBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  loginBtnAccount: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ED1D24',
    borderRadius: 12,
    paddingVertical: 11,
    marginTop: 14,
  },
  loginBtnAccountText: {
    color: '#FFFFFF',
    fontSize: 13,
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
    color: '#9CA3AF',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 14,
    fontFamily: 'Inter_400Regular',
  },
  subUpgradeBtn: {
    backgroundColor: '#F59E0B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    paddingVertical: 12,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  subUpgradeBtnText: {
    color: '#000000',
    fontWeight: '700',
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
  },
  subManageBtn: {
    backgroundColor: '#F59E0B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    paddingVertical: 10,
    marginTop: 10,
  },
  subManageBtnText: {
    color: '#000000',
    fontWeight: '700',
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
  },
  purchasedBox: {
    backgroundColor: '#0F0F14',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#2A2A38',
  },
  purchasedCountText: {
    color: '#D1D5DB',
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    marginBottom: 8,
  },
  emptyPurchasedText: {
    color: '#6B7280',
    fontSize: 12,
    lineHeight: 18,
    fontFamily: 'Inter_400Regular',
  },
  purchasedList: {
    gap: 8,
    marginTop: 6,
  },
  purchasedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16161F',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#2A2A38',
  },
  purchasedItemTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: 'Outfit_600SemiBold',
    flex: 1,
  },
  creditCard: {
    backgroundColor: '#1A1A22',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2A2A38',
    marginBottom: 20,
  },
  creditHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  creditTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'Outfit_700Bold',
  },
  creditBody: {
    color: '#9CA3AF',
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 10,
    fontFamily: 'Inter_400Regular',
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
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    paddingVertical: 14,
    marginBottom: 20,
  },
  logoutButtonText: {
    color: '#F87171',
    fontWeight: '700',
    fontSize: 14,
    fontFamily: 'Outfit_700Bold',
  },
});
