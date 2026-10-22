import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
  SafeAreaView,
  StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import SandboxPaymentModal from '../components/SandboxPaymentModal';

/**
 * SubscriptionsScreen - Màn hình Danh Sách Gói Hội Viên Marvel VIP
 * 
 * TÍNH NĂNG:
 * 1. Gọi GET /api/plans để lấy danh sách gói active.
 * 2. Hiển thị thông tin gói VIP hiện tại (nếu có) từ mySubscription trong AuthContext.
 * 3. Hỗ trợ nút Đăng ký hoặc Gia hạn cho từng gói.
 * 4. Tích hợp thanh toán mô phỏng SandboxPaymentModal.
 * 5. Làm mới ngay lập tức quyền VIP sau thanh toán thành công.
 */
export default function SubscriptionsScreen({ navigation }) {
  const { isVip, mySubscription, loadUserBenefits } = useAuth();

  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Gói đang được chọn để thanh toán Sandbox
  const [selectedPlanForPayment, setSelectedPlanForPayment] = useState(null);

  const fetchPlans = useCallback(async () => {
    try {
      setError(null);
      const res = await api.get('/api/plans');
      if (res.success && res.plans) {
        setPlans(res.plans);
      } else {
        setError(res.message || 'Không thể tải danh sách gói hội viên.');
      }
    } catch (err) {
      setError(err.message || 'Lỗi kết nối khi tải danh sách gói đọc.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    Promise.all([fetchPlans(), loadUserBenefits()]);
  }, [fetchPlans, loadUserBenefits]);

  const handleSelectPlan = (plan) => {
    setSelectedPlanForPayment(plan);
  };

  const handlePaymentSuccess = () => {
    // Sau khi thanh toán thành công, mySubscription đã được tự động làm mới
    // qua loadUserBenefits() bên trong SandboxPaymentModal.
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0F0F14" />

      {/* Top Navbar */}
      <View style={styles.navBar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Gói Hội Viên Marvel</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#ED1D24"
            colors={['#ED1D24']}
          />
        }
      >
        {/* Hero Header */}
        <View style={styles.heroSection}>
          <View style={styles.vipPill}>
            <Ionicons name="sparkles" size={13} color="#FBBF24" style={{ marginRight: 5 }} />
            <Text style={styles.vipPillText}>ĐẶC QUYỀN HỘI VIÊN MARVEL VIP</Text>
          </View>
          <Text style={styles.heroTitle}>Mở Khóa Toàn Bộ Đa Vũ Trụ</Text>
          <Text style={styles.heroSubtitle}>
            Đọc không giới hạn kho truyện tranh Marvel bản quyền chất lượng gốc từ Comic Vine.
            Trải nghiệm đọc thượng hạng không quảng cáo.
          </Text>

          {/* Checklist ưu điểm */}
          <View style={styles.featureHighlights}>
            <View style={styles.highlightItem}>
              <Ionicons name="checkmark-circle" size={16} color="#34D399" style={{ marginRight: 6 }} />
              <Text style={styles.highlightText}>Kích hoạt tức thì</Text>
            </View>
            <View style={styles.highlightItem}>
              <Ionicons name="checkmark-circle" size={16} color="#34D399" style={{ marginRight: 6 }} />
              <Text style={styles.highlightText}>Không tự động trừ tiền</Text>
            </View>
            <View style={styles.highlightItem}>
              <Ionicons name="checkmark-circle" size={16} color="#34D399" style={{ marginRight: 6 }} />
              <Text style={styles.highlightText}>Cộng dồn khi gia hạn</Text>
            </View>
          </View>
        </View>

        {/* Banner Gói VIP Hiện Tại (Nếu Đang Hoạt Động) */}
        {isVip && mySubscription && (
          <View style={styles.activeSubscriptionCard}>
            <View style={styles.activeSubHeader}>
              <View style={styles.activeSubIcon}>
                <Ionicons name="ribbon" size={24} color="#FBBF24" />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <View style={styles.activeSubBadgeRow}>
                  <Text style={styles.activeSubBadgeLabel}>GÓI ĐANG HOẠT ĐỘNG</Text>
                  {mySubscription.badge && (
                    <View style={styles.activeSubBadgePill}>
                      <Text style={styles.activeSubBadgePillText}>{mySubscription.badge}</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.activeSubPlanName}>{mySubscription.plan_name}</Text>
                <Text style={styles.activeSubDaysRemaining}>
                  Thời hạn còn lại:{' '}
                  <Text style={{ color: '#FBBF24', fontFamily: 'Inter_700Bold' }}>
                    {mySubscription.days_remaining} ngày
                  </Text>
                </Text>
                {mySubscription.end_date && (
                  <Text style={styles.activeSubEndDate}>
                    Hết hạn ngày: {new Date(mySubscription.end_date).toLocaleDateString('vi-VN')}
                  </Text>
                )}
              </View>
            </View>
          </View>
        )}

        {/* Danh sách các gói đọc */}
        <View style={styles.plansSection}>
          <Text style={styles.sectionTitle}>Chọn Gói Hội Viên</Text>

          {loading ? (
            <View style={styles.centerLoading}>
              <ActivityIndicator size="large" color="#ED1D24" />
              <Text style={styles.loadingText}>Đang tải danh sách gói đọc...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={32} color="#F87171" />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={fetchPlans}>
                <Text style={styles.retryBtnText}>Thử lại</Text>
              </TouchableOpacity>
            </View>
          ) : plans.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>Hiện chưa có gói hội viên nào được kích hoạt.</Text>
            </View>
          ) : (
            <View style={styles.plansList}>
              {plans.map((plan) => {
                const isPopular = plan.badge && plan.badge.includes('Phổ Biến');
                const isCurrentPlan = isVip && mySubscription?.plan_name === plan.name;

                return (
                  <View
                    key={plan.id}
                    style={[
                      styles.planCard,
                      isPopular && styles.planCardPopular,
                      isCurrentPlan && styles.planCardCurrent,
                    ]}
                  >
                    {/* Badge nổi bật góc trên */}
                    {plan.badge && (
                      <View style={[styles.planBadge, isPopular ? styles.planBadgePopular : styles.planBadgeRegular]}>
                        <Text style={[styles.planBadgeText, isPopular && styles.planBadgeTextPopular]}>
                          {plan.badge}
                        </Text>
                      </View>
                    )}

                    {/* Tên gói & Giá */}
                    <View style={styles.planHeader}>
                      <Text style={styles.planName}>{plan.name}</Text>
                      <View style={styles.priceRow}>
                        <Text style={styles.planPrice}>
                          {Number(plan.price).toLocaleString('vi-VN')} đ
                        </Text>
                        <Text style={styles.planDuration}>/ {plan.duration_days} ngày</Text>
                      </View>
                    </View>

                    {/* Mô tả gói */}
                    {plan.description && (
                      <Text style={styles.planDescription}>{plan.description}</Text>
                    )}

                    {/* Quyền lợi của gói */}
                    <View style={styles.benefitsList}>
                      <View style={styles.benefitItem}>
                        <Ionicons name="shield-checkmark" size={14} color="#34D399" style={{ marginRight: 6 }} />
                        <Text style={styles.benefitText}>Mở khóa toàn bộ chương VIP Comic Vine</Text>
                      </View>
                      <View style={styles.benefitItem}>
                        <Ionicons name="shield-checkmark" size={14} color="#34D399" style={{ marginRight: 6 }} />
                        <Text style={styles.benefitText}>Đọc không giới hạn trong {plan.duration_days} ngày</Text>
                      </View>
                      <View style={styles.benefitItem}>
                        <Ionicons name="shield-checkmark" size={14} color="#34D399" style={{ marginRight: 6 }} />
                        <Text style={styles.benefitText}>Cộng dồn ngày sử dụng nếu đang có gói</Text>
                      </View>
                    </View>

                    {/* Nút Đăng ký hoặc Gia hạn */}
                    <TouchableOpacity
                      style={[
                        styles.planBtn,
                        isPopular ? styles.planBtnPopular : styles.planBtnRegular,
                      ]}
                      onPress={() => handleSelectPlan(plan)}
                      activeOpacity={0.85}
                    >
                      <Ionicons
                        name={isVip ? 'refresh-outline' : 'sparkles'}
                        size={16}
                        color={isPopular ? '#000000' : '#FFFFFF'}
                        style={{ marginRight: 6 }}
                      />
                      <Text
                        style={[
                          styles.planBtnText,
                          isPopular ? styles.planBtnTextPopular : styles.planBtnTextRegular,
                        ]}
                      >
                        {isVip ? 'Gia Hạn Gói Này' : 'Đăng Ký Ngay'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Modal Thanh toán Sandbox */}
      <SandboxPaymentModal
        visible={!!selectedPlanForPayment}
        plan={selectedPlanForPayment}
        onClose={() => setSelectedPlanForPayment(null)}
        onSuccess={handlePaymentSuccess}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0F0F14',
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A38',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1A1A22',
    borderWidth: 1,
    borderColor: '#2A2A38',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Outfit_700Bold',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  heroSection: {
    alignItems: 'center',
    textAlign: 'center',
    paddingVertical: 16,
    marginBottom: 8,
  },
  vipPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(251, 191, 36, 0.12)',
    borderColor: 'rgba(251, 191, 36, 0.35)',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginBottom: 12,
  },
  vipPillText: {
    color: '#FBBF24',
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1.2,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 26,
    fontFamily: 'Italiana_400Regular',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 1,
  },
  heroSubtitle: {
    color: '#9CA3AF',
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 8,
    marginBottom: 14,
  },
  featureHighlights: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    marginTop: 6,
  },
  highlightItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  highlightText: {
    color: '#D1D5DB',
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
  },
  activeSubscriptionCard: {
    backgroundColor: '#1A1A22',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#F59E0B',
    padding: 16,
    marginBottom: 20,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  activeSubHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeSubIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeSubBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  activeSubBadgeLabel: {
    color: '#FBBF24',
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.8,
  },
  activeSubBadgePill: {
    backgroundColor: 'rgba(251, 191, 36, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  activeSubBadgePillText: {
    color: '#FBBF24',
    fontSize: 9,
    fontFamily: 'Inter_700Bold',
  },
  activeSubPlanName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Outfit_700Bold',
    marginBottom: 4,
  },
  activeSubDaysRemaining: {
    color: '#D1D5DB',
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  activeSubEndDate: {
    color: '#9CA3AF',
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  plansSection: {
    marginTop: 4,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: 'Outfit_700Bold',
    marginBottom: 14,
  },
  centerLoading: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    color: '#9CA3AF',
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginTop: 10,
  },
  errorBox: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#1A1A22',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2A2A38',
  },
  errorText: {
    color: '#F87171',
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    textAlign: 'center',
    marginVertical: 10,
  },
  retryBtn: {
    backgroundColor: '#ED1D24',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  emptyBox: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    color: '#9CA3AF',
    fontSize: 13,
  },
  plansList: {
    gap: 16,
  },
  planCard: {
    backgroundColor: '#1A1A22',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#2A2A38',
    padding: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  planCardPopular: {
    borderColor: '#F59E0B',
    borderWidth: 1.5,
    backgroundColor: '#1E1B24',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  planCardCurrent: {
    borderLeftWidth: 4,
    borderLeftColor: '#34D399',
  },
  planBadge: {
    position: 'absolute',
    top: 14,
    right: 14,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  planBadgePopular: {
    backgroundColor: '#F59E0B',
  },
  planBadgeRegular: {
    backgroundColor: 'rgba(237, 29, 36, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(237, 29, 36, 0.4)',
  },
  planBadgeText: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.5,
  },
  planBadgeTextPopular: {
    color: '#000000',
  },
  planHeader: {
    marginBottom: 8,
    paddingRight: 70,
  },
  planName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Outfit_700Bold',
    marginBottom: 6,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  planPrice: {
    color: '#ED1D24',
    fontSize: 22,
    fontFamily: 'Outfit_700Bold',
    marginRight: 6,
  },
  planDuration: {
    color: '#9CA3AF',
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },
  planDescription: {
    color: '#D1D5DB',
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    lineHeight: 18,
    marginBottom: 14,
  },
  benefitsList: {
    borderTopWidth: 1,
    borderTopColor: '#2A2A38',
    paddingTop: 12,
    marginBottom: 16,
    gap: 8,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  benefitText: {
    color: '#9CA3AF',
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
  },
  planBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    paddingVertical: 13,
  },
  planBtnPopular: {
    backgroundColor: '#F59E0B',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  planBtnRegular: {
    backgroundColor: '#ED1D24',
    shadowColor: '#ED1D24',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  planBtnText: {
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
  },
  planBtnTextPopular: {
    color: '#000000',
  },
  planBtnTextRegular: {
    color: '#FFFFFF',
  },
});
